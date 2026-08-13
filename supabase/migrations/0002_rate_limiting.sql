-- Rate limiting for public, unauthenticated endpoints (widget realtime voice/
-- chat, portal magic-link email, website contact form). Without this, anyone
-- can hammer /api/realtime/sdp and run up the OpenAI bill, or email-bomb a
-- client through /api/portal/check-email. See src/lib/rateLimit.ts.
--
-- Fixed-window counter: each (key, window) pair gets its own row, keyed by
-- "<key>:<window index>" so a window's row is naturally fresh - no reset
-- logic needed. Old rows are cheap to leave (small volume for this app's
-- scale) but a periodic cleanup is included below to be safe long-term.

create table if not exists rate_limit_hits (
  bucket_key text primary key,
  count integer not null default 1,
  expires_at timestamptz not null
);

create index if not exists rate_limit_hits_expires_at_idx on rate_limit_hits (expires_at);

create or replace function increment_rate_limit(p_bucket_key text, p_expires_at timestamptz)
returns integer
language plpgsql
as $$
declare
  v_count integer;
begin
  insert into rate_limit_hits (bucket_key, count, expires_at)
  values (p_bucket_key, 1, p_expires_at)
  on conflict (bucket_key)
  do update set count = rate_limit_hits.count + 1
  returning count into v_count;
  return v_count;
end;
$$;

-- Best-effort cleanup so the table doesn't grow forever. Safe to call
-- repeatedly; a stray expired row just gets caught on the next run.
create or replace function cleanup_rate_limit_hits()
returns void
language sql
as $$
  delete from rate_limit_hits where expires_at < now() - interval '1 hour';
$$;

alter table rate_limit_hits enable row level security;

-- Only the service-role admin client (used exclusively by src/lib/rateLimit.ts,
-- itself server-only) ever touches this table - no end-user policy needed.
