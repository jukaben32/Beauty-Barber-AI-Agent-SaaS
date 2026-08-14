-- Beauty Salon & Barbershop AI receptionist SaaS schema
-- Multi-tenant: every row belongs to a business (salon/barbershop).

create extension if not exists pgcrypto;

create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- These three are `language plpgsql` rather than the more idiomatic
-- `language sql` on purpose: `language sql` functions are validated against
-- the catalog (tables must already exist) at CREATE FUNCTION time, but
-- businesses/business_members/clients aren't created until further down
-- this same file — running the file top-to-bottom failed immediately with
-- `relation "businesses" does not exist` before a single table was ever
-- created. plpgsql only compiles the body lazily (checked on first call,
-- by which point every table below has been created), so it tolerates the
-- forward reference without needing to reorder the whole file.
create or replace function is_business_owner(target_business_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from businesses
    where id = target_business_id
      and owner_id = auth.uid()
  );
end;
$$;

create or replace function has_business_access(target_business_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from businesses
    where id = target_business_id
      and owner_id = auth.uid()
  )
  or exists (
    select 1
    from business_members
    where business_id = target_business_id
      and user_id = auth.uid()
  );
end;
$$;

create or replace function is_client_owner(target_client_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from clients
    where id = target_client_id
      and auth_user_id = auth.uid()
  );
end;
$$;

-- 1. BUSINESSES
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  specialty text,
  description text,
  logo_url text,
  phone text,
  contact_email text,
  booking_email text,
  website text,
  address text,
  city text,
  state text,
  zip_code text,
  timezone text not null default 'America/Santo_Domingo',
  payment_wallet_address text,
  payment_chain_id integer not null default 137,
  payment_currency text not null default 'DOP',
  booking_deposit_amount numeric(12,2),
  bank_name text,
  bank_account_holder text,
  bank_account_number text,
  bank_account_type text,
  tax_id text,
  accepts_cash boolean not null default true,
  accepts_transfer boolean not null default false,
  accepts_card boolean not null default false,
  onboarding_step text not null default 'created'
    check (onboarding_step in ('created', 'profile', 'agent', 'services', 'billing', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_businesses_owner_id on businesses (owner_id);
create index if not exists idx_businesses_slug on businesses (slug);

drop trigger if exists update_businesses_updated_at on businesses;
create trigger update_businesses_updated_at
before update on businesses
for each row execute function update_updated_at_column();

alter table businesses enable row level security;

drop policy if exists "business owners can read own business" on businesses;
create policy "business owners can read own business"
  on businesses for select using (has_business_access(id));
drop policy if exists "business owners can create business" on businesses;
create policy "business owners can create business"
  on businesses for insert with check (owner_id = auth.uid());
drop policy if exists "business owners can update business" on businesses;
create policy "business owners can update business"
  on businesses for update using (is_business_owner(id));
drop policy if exists "business owners can delete business" on businesses;
create policy "business owners can delete business"
  on businesses for delete using (is_business_owner(id));

-- 2. STAFF / MEMBERS
create table if not exists business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff'
    check (role in ('owner', 'admin', 'staff', 'assistant')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index if not exists idx_business_members_business_id on business_members (business_id);
create index if not exists idx_business_members_user_id on business_members (user_id);

drop trigger if exists update_business_members_updated_at on business_members;
create trigger update_business_members_updated_at
before update on business_members
for each row execute function update_updated_at_column();

alter table business_members enable row level security;

drop policy if exists "members can read their memberships" on business_members;
create policy "members can read their memberships"
  on business_members for select using (user_id = auth.uid() or is_business_owner(business_id));
drop policy if exists "owners can manage memberships" on business_members;
create policy "owners can manage memberships"
  on business_members for all using (is_business_owner(business_id));

-- 3. SUBSCRIPTIONS
create table if not exists business_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade unique,
  plan text not null default 'free'
    check (plan in ('free', 'pro', 'business')),
  status text not null default 'active'
    check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  website_builder_enabled boolean not null default false,
  billing_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_business_subscriptions_business_id on business_subscriptions (business_id);
create index if not exists idx_business_subscriptions_stripe_customer_id on business_subscriptions (stripe_customer_id);

drop trigger if exists update_business_subscriptions_updated_at on business_subscriptions;
create trigger update_business_subscriptions_updated_at
before update on business_subscriptions
for each row execute function update_updated_at_column();

alter table business_subscriptions enable row level security;

-- Members may only read their subscription — every write (plan changes,
-- Stripe fields) goes through the service-role Stripe webhook. A business
-- owner previously had "for all" here, which let them set their own plan
-- to the paid tier for free straight from the browser.
drop policy if exists "subscription access by business members" on business_subscriptions;
drop policy if exists "subscription changes by owners" on business_subscriptions;
create policy "subscription read by business members"
  on business_subscriptions for select using (has_business_access(business_id));
create policy "subscription writes by service role"
  on business_subscriptions for all using (auth.role() = 'service_role');

-- Auto-create a free subscription row whenever a business is created, so
-- no client code needs INSERT permission on business_subscriptions.
create or replace function create_default_subscription() returns trigger as $$
begin
  insert into business_subscriptions (business_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (business_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_create_default_subscription on businesses;
create trigger trg_create_default_subscription
after insert on businesses
for each row execute function create_default_subscription();

-- 4. AI AGENTS
create table if not exists ai_agents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  title text,
  specialty text,
  voice text not null default 'alloy',
  personality text not null default 'friendly',
  sensitivity numeric(3,2) not null default 0.50 check (sensitivity between 0 and 1),
  greeting_message text not null default 'Hello! I am Clara. How can I help today?',
  system_prompt text not null default '',
  language text not null default 'en',
  status text not null default 'draft'
    check (status in ('draft', 'live', 'paused')),
  calls_handled integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_agents_business_id on ai_agents (business_id);

drop trigger if exists update_ai_agents_updated_at on ai_agents;
create trigger update_ai_agents_updated_at
before update on ai_agents
for each row execute function update_updated_at_column();

alter table ai_agents enable row level security;

drop policy if exists "agents access by business members" on ai_agents;
create policy "agents access by business members"
  on ai_agents for all using (has_business_access(business_id));
-- No public/anon read policy: the widget, booking flow, and realtime voice
-- session all resolve agent data server-side through the service-role admin
-- client (see getPublicWidgetConfig / getBusinessAndAgentNames), scoped by
-- businessSlug. A table-wide "status = 'live'" policy would let anyone with
-- the public anon key read every business's agents directly via PostgREST,
-- including system_prompt.
drop policy if exists "public can read live agents" on ai_agents;

-- Real server-side plan-tier enforcement for AI agent creation. This is
-- the actual gate — the dashboard greys out the "Activate" button too, but
-- that's UX only and can't stop a direct client SDK/API call by itself.
create or replace function enforce_agent_limit() returns trigger as $$
declare
  current_plan text;
  agent_limit int;
  agent_count int;
begin
  select plan into current_plan from business_subscriptions where business_id = new.business_id;
  agent_limit := case coalesce(current_plan, 'free')
    when 'free' then 1
    when 'pro' then 10
    when 'business' then 0
    else 1
  end;
  if agent_limit = 0 then
    return new;
  end if;
  select count(*) into agent_count from ai_agents where business_id = new.business_id;
  if agent_count >= agent_limit then
    raise exception 'Your plan allows a maximum of % AI agent(s). Upgrade to add more.', agent_limit
      using errcode = 'P0001';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_enforce_agent_limit on ai_agents;
create trigger trg_enforce_agent_limit
before insert on ai_agents
for each row execute function enforce_agent_limit();

-- 5. SERVICES
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null default 30,
  price_type text not null default 'fixed'
    check (price_type in ('fixed', 'starting_at', 'contact')),
  price numeric(12,2),
  price_min numeric(12,2),
  price_max numeric(12,2),
  currency text not null default 'DOP',
  active boolean not null default true,
  color text,
  instructions text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_services_business_id on services (business_id);
create index if not exists idx_services_active on services (business_id, active);

drop trigger if exists update_services_updated_at on services;
create trigger update_services_updated_at
before update on services
for each row execute function update_updated_at_column();

alter table services enable row level security;

drop policy if exists "services access by business members" on services;
create policy "services access by business members"
  on services for all using (has_business_access(business_id));
-- No public/anon read policy: pricing and internal `instructions` are
-- internal. Public booking flows read the separate, intentionally-curated
-- website_services table (scoped to published websites) or go through the
-- service-role admin client server-side. A table-wide "active = true"
-- policy would leak every business's service pricing/instructions to
-- anyone with the public anon key via direct PostgREST access.
drop policy if exists "public can read active services" on services;

-- 6. CLIENTS
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text,
  email text,
  date_of_birth date,
  notes text,
  source text not null default 'manual'
    check (source in ('ai_call', 'widget_chat', 'manual', 'portal', 'website_form', 'whatsapp')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_business_id on clients (business_id);
create index if not exists idx_clients_email on clients (email);
create index if not exists idx_clients_phone on clients (phone);
create index if not exists idx_clients_auth_user_id on clients (auth_user_id);

drop trigger if exists update_clients_updated_at on clients;
create trigger update_clients_updated_at
before update on clients
for each row execute function update_updated_at_column();

alter table clients enable row level security;

drop policy if exists "clients access by business members" on clients;
create policy "clients access by business members"
  on clients for all using (has_business_access(business_id));
drop policy if exists "clients can read their own record" on clients;
create policy "clients can read their own record"
  on clients for select using (auth_user_id = auth.uid());
drop policy if exists "clients can update their own record" on clients;
create policy "clients can update their own record"
  on clients for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- business_id must never change after a client row is created: without this,
-- a client could self-service UPDATE their own row's business_id (the RLS
-- policy above only re-checks auth_user_id, not business_id) and silently
-- move their record into a different business's tenant.
create or replace function prevent_client_business_id_change()
returns trigger
language plpgsql
as $$
begin
  if new.business_id is distinct from old.business_id then
    raise exception 'business_id cannot be changed on an existing client record';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_clients_business_id_change on clients;
create trigger prevent_clients_business_id_change
before update on clients
for each row execute function prevent_client_business_id_change();

-- 7. BUSINESS AVAILABILITY
create table if not exists business_availability (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_active boolean not null default true,
  open_time time not null default '09:00',
  close_time time not null default '17:00',
  break_start time,
  break_end time,
  slot_minutes integer not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, day_of_week)
);

create index if not exists idx_business_availability_business_id on business_availability (business_id);

drop trigger if exists update_business_availability_updated_at on business_availability;
create trigger update_business_availability_updated_at
before update on business_availability
for each row execute function update_updated_at_column();

alter table business_availability enable row level security;

drop policy if exists "availability access by business members" on business_availability;
create policy "availability access by business members"
  on business_availability for all using (has_business_access(business_id));

-- 8. CLOSED DATES
create table if not exists closed_dates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  blocked_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (business_id, blocked_date)
);

create index if not exists idx_closed_dates_business_id on closed_dates (business_id);
create index if not exists idx_closed_dates_blocked_date on closed_dates (blocked_date);

alter table closed_dates enable row level security;

drop policy if exists "closed dates access by business members" on closed_dates;
create policy "closed dates access by business members"
  on closed_dates for all using (has_business_access(business_id));

-- 9. APPOINTMENTS
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  agent_id uuid references ai_agents(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  conversation_id uuid,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'pending_confirmation', 'confirmed', 'completed', 'cancelled', 'no_show')),
  source text not null default 'widget'
    check (source in ('widget', 'portal', 'manual', 'ai_call', 'phone', 'whatsapp')),
  notes text,
  rescheduled_from uuid references appointments(id) on delete set null,
  requested_scheduled_at timestamptz,
  reschedule_requested_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  cancelled_by text check (cancelled_by in ('client', 'business', 'system')),
  payment_status text not null default 'not_required'
    check (payment_status in ('not_required', 'pending', 'partial', 'paid', 'cash', 'refunded')),
  payment_amount numeric(12,2),
  payment_currency text not null default 'DOP',
  payment_chain_id integer not null default 137,
  payment_tx_hash text,
  payment_method text
    check (payment_method in ('cash', 'transfer', 'card_cardnet', 'card_azul', 'usdc')),
  payment_reference text,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_appointments_business_id on appointments (business_id);
create index if not exists idx_appointments_client_id on appointments (client_id);
create index if not exists idx_appointments_agent_id on appointments (agent_id);
create index if not exists idx_appointments_service_id on appointments (service_id);
create index if not exists idx_appointments_scheduled_at on appointments (scheduled_at);
create index if not exists idx_appointments_status on appointments (status);

drop trigger if exists update_appointments_updated_at on appointments;
create trigger update_appointments_updated_at
before update on appointments
for each row execute function update_updated_at_column();

alter table appointments enable row level security;

drop policy if exists "appointments access by business members" on appointments;
create policy "appointments access by business members"
  on appointments for all using (has_business_access(business_id));
drop policy if exists "clients can see their appointments" on appointments;
create policy "clients can see their appointments"
  on appointments for select using (
    exists (
      select 1
      from clients p
      where p.id = client_id
        and p.auth_user_id = auth.uid()
    )
  );

-- 10. CONVERSATIONS
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  agent_id uuid references ai_agents(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  channel text not null default 'widget_voice'
    check (channel in ('widget_voice', 'widget_chat', 'phone', 'whatsapp')),
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'failed')),
  outcome text check (outcome in ('booked_appointment', 'qualified_lead', 'no_action', 'escalated')),
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  duration_seconds integer not null default 0,
  transcript_summary text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_conversations_business_id on conversations (business_id);
create index if not exists idx_conversations_client_id on conversations (client_id);
create index if not exists idx_conversations_appointment_id on conversations (appointment_id);

alter table conversations enable row level security;

drop policy if exists "conversations access by business members" on conversations;
create policy "conversations access by business members"
  on conversations for all using (has_business_access(business_id));
drop policy if exists "clients can see own conversations" on conversations;
create policy "clients can see own conversations"
  on conversations for select using (
    exists (
      select 1
      from clients p
      where p.id = client_id
        and p.auth_user_id = auth.uid()
    )
  );

create table if not exists ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  kind text not null check (kind in ('chat_completion', 'realtime_voice')),
  input_tokens integer,
  output_tokens integer,
  duration_seconds integer,
  cost_usd numeric(10,6) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_events_business_id on ai_usage_events (business_id);
create index if not exists idx_ai_usage_events_created_at on ai_usage_events (created_at);

alter table ai_usage_events enable row level security;

drop policy if exists "ai usage events access by business members" on ai_usage_events;
create policy "ai usage events access by business members"
  on ai_usage_events for select using (has_business_access(business_id));
drop policy if exists "service role can manage ai usage events" on ai_usage_events;
create policy "service role can manage ai usage events"
  on ai_usage_events for all using (auth.role() = 'service_role');

create table if not exists conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  role text not null check (role in ('agent', 'caller', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_conversation_messages_conversation_id on conversation_messages (conversation_id);
create index if not exists idx_conversation_messages_business_id on conversation_messages (business_id);

alter table conversation_messages enable row level security;

drop policy if exists "conversation messages access by business members" on conversation_messages;
create policy "conversation messages access by business members"
  on conversation_messages for all using (has_business_access(business_id));

-- 10.5. WHATSAPP CONNECTIONS
create table if not exists whatsapp_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade unique,
  agent_id uuid references ai_agents(id) on delete set null,
  provider text not null default 'evolution'
    check (provider in ('evolution')),
  instance_name text not null,
  instance_token text,
  phone_number text,
  status text not null default 'disconnected'
    check (status in ('disconnected', 'connecting', 'connected')),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_connections_business_id on whatsapp_connections (business_id);
create index if not exists idx_whatsapp_connections_status on whatsapp_connections (status);

drop trigger if exists update_whatsapp_connections_updated_at on whatsapp_connections;
create trigger update_whatsapp_connections_updated_at
before update on whatsapp_connections
for each row execute function update_updated_at_column();

alter table whatsapp_connections enable row level security;

drop policy if exists "whatsapp connections access by business members" on whatsapp_connections;
create policy "whatsapp connections access by business members"
  on whatsapp_connections for all using (has_business_access(business_id))
  with check (has_business_access(business_id));

grant select, insert, update, delete on whatsapp_connections to authenticated;

-- 11. KNOWLEDGE DOCUMENTS / FAQS
create table if not exists knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  title text not null,
  question text,
  answer text,
  category text,
  catalog_key text,
  source_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_documents_business_id on knowledge_documents (business_id);
create index if not exists idx_knowledge_documents_catalog_key on knowledge_documents (catalog_key);

drop trigger if exists update_knowledge_documents_updated_at on knowledge_documents;
create trigger update_knowledge_documents_updated_at
before update on knowledge_documents
for each row execute function update_updated_at_column();

alter table knowledge_documents enable row level security;

drop policy if exists "knowledge documents access by business members" on knowledge_documents;
create policy "knowledge documents access by business members"
  on knowledge_documents for all using (has_business_access(business_id));

-- 12. WIDGETS
create table if not exists widgets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  agent_id uuid references ai_agents(id) on delete set null,
  name text not null default 'Main Widget',
  slug text not null,
  enabled boolean not null default true,
  position text not null default 'bottom-right',
  theme text not null default 'light',
  primary_color text not null default '#0f766e',
  secondary_color text not null default '#0ea5e9',
  tone text not null default 'professional-and-friendly',
  greeting_message text not null default 'Hola, soy Clara. En que te ayudo?',
  allowed_origins text[] not null default '{}',
  slot_duration integer not null default 30,
  show_branding boolean not null default true,
  impressions integer not null default 0,
  interactions integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, slug)
);

create index if not exists idx_widgets_business_id on widgets (business_id);
create index if not exists idx_widgets_slug on widgets (slug);

drop trigger if exists update_widgets_updated_at on widgets;
create trigger update_widgets_updated_at
before update on widgets
for each row execute function update_updated_at_column();

alter table widgets enable row level security;

drop policy if exists "widgets access by business members" on widgets;
create policy "widgets access by business members"
  on widgets for all using (has_business_access(business_id));
-- No public/anon read policy: the embeddable widget script fetches its
-- config through /api/widget/config server-side (service-role admin
-- client, scoped by businessSlug), never via the browser's anon Supabase
-- client. A table-wide "enabled = true" policy would expose every
-- business's allowed_origins, theme, and impression/interaction metrics
-- to anyone with the public anon key via direct PostgREST access.
drop policy if exists "public can read enabled widgets" on widgets;

-- 13. WEBSITES
create table if not exists websites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  agent_id uuid references ai_agents(id) on delete set null,
  slug text not null unique,
  template text not null default 'serenity'
    check (template in ('serenity', 'pulse', 'clarity')),
  published boolean not null default false,
  primary_color text not null default '#0f766e',
  secondary_color text not null default '#0ea5e9',
  font text not null default 'Inter',
  logo_url text,
  site_title text not null,
  site_description text not null,
  hero_headline text,
  hero_subheadline text,
  hero_image_url text,
  cta_primary_text text not null default 'Book Appointment',
  cta_secondary_text text not null default 'View Services',
  about_title text not null default 'About Us',
  about_story text,
  about_photo_url text,
  footer_tagline text,
  footer_copyright text,
  contact_phone text,
  contact_email text,
  contact_address text,
  contact_hours text,
  contact_maps_url text,
  years_experience integer,
  clients_served integer,
  satisfaction_pct numeric(5,2),
  trust_badges text[] not null default '{}',
  featured_service_ids uuid[] not null default '{}',
  social_youtube text,
  social_facebook text,
  social_instagram text,
  social_tiktok text,
  social_linkedin text,
  social_pinterest text,
  social_twitter text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_websites_business_id on websites (business_id);
create index if not exists idx_websites_slug on websites (slug);

drop trigger if exists update_websites_updated_at on websites;
create trigger update_websites_updated_at
before update on websites
for each row execute function update_updated_at_column();

alter table websites enable row level security;

drop policy if exists "websites access by business members" on websites;
create policy "websites access by business members"
  on websites for all
  to authenticated
  using (has_business_access(business_id))
  with check (has_business_access(business_id));
drop policy if exists "public can read published websites" on websites;
create policy "public can read published websites"
  on websites for select
  to anon
  using (published = true);

create table if not exists website_subscribers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  email text not null,
  name text,
  phone text,
  message text,
  source text not null default 'website',
  created_at timestamptz not null default now()
);

create index if not exists idx_website_subscribers_business_id on website_subscribers (business_id);
create index if not exists idx_website_subscribers_email on website_subscribers (email);

alter table website_subscribers enable row level security;

drop policy if exists "website subscribers by business members" on website_subscribers;
create policy "website subscribers by business members"
  on website_subscribers for all
  to authenticated
  using (has_business_access(business_id))
  with check (has_business_access(business_id));

-- 13a. WEBSITE CONTENT TABLES
create table if not exists website_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  icon text not null default 'home',
  name text not null,
  description text,
  duration text,
  price text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_website_services_business_id on website_services (business_id);
create index if not exists idx_website_services_sort_order on website_services (business_id, sort_order);

drop trigger if exists update_website_services_updated_at on website_services;
create trigger update_website_services_updated_at
before update on website_services
for each row execute function update_updated_at_column();

alter table website_services enable row level security;

drop policy if exists "website services access by business members" on website_services;
create policy "website services access by business members"
  on website_services for all
  to authenticated
  using (has_business_access(business_id))
  with check (has_business_access(business_id));
drop policy if exists "public can read published website services" on website_services;
create policy "public can read published website services"
  on website_services for select
  to anon
  using (
    exists (
      select 1
      from websites w
      where w.business_id = business_id
        and w.published = true
    )
  );

create table if not exists website_team_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  role text not null,
  bio text,
  photo_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_website_team_members_business_id on website_team_members (business_id);
create index if not exists idx_website_team_members_sort_order on website_team_members (business_id, sort_order);

drop trigger if exists update_website_team_members_updated_at on website_team_members;
create trigger update_website_team_members_updated_at
before update on website_team_members
for each row execute function update_updated_at_column();

alter table website_team_members enable row level security;

drop policy if exists "website team members access by business members" on website_team_members;
create policy "website team members access by business members"
  on website_team_members for all
  to authenticated
  using (has_business_access(business_id))
  with check (has_business_access(business_id));
drop policy if exists "public can read published website team members" on website_team_members;
create policy "public can read published website team members"
  on website_team_members for select
  to anon
  using (
    exists (
      select 1
      from websites w
      where w.business_id = business_id
        and w.published = true
    )
  );

create table if not exists website_testimonials (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  quote text not null,
  author_name text not null,
  author_role text,
  rating integer not null default 5 check (rating between 1 and 5),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_website_testimonials_business_id on website_testimonials (business_id);
create index if not exists idx_website_testimonials_sort_order on website_testimonials (business_id, sort_order);

drop trigger if exists update_website_testimonials_updated_at on website_testimonials;
create trigger update_website_testimonials_updated_at
before update on website_testimonials
for each row execute function update_updated_at_column();

alter table website_testimonials enable row level security;

drop policy if exists "website testimonials access by business members" on website_testimonials;
create policy "website testimonials access by business members"
  on website_testimonials for all
  to authenticated
  using (has_business_access(business_id))
  with check (has_business_access(business_id));
drop policy if exists "public can read published website testimonials" on website_testimonials;
create policy "public can read published website testimonials"
  on website_testimonials for select
  to anon
  using (
    exists (
      select 1
      from websites w
      where w.business_id = business_id
        and w.published = true
    )
  );

create table if not exists website_specialties (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_website_specialties_business_id on website_specialties (business_id);
create index if not exists idx_website_specialties_sort_order on website_specialties (business_id, sort_order);

alter table website_specialties enable row level security;

drop policy if exists "website specialties access by business members" on website_specialties;
create policy "website specialties access by business members"
  on website_specialties for all
  to authenticated
  using (has_business_access(business_id))
  with check (has_business_access(business_id));
drop policy if exists "public can read published website specialties" on website_specialties;
create policy "public can read published website specialties"
  on website_specialties for select
  to anon
  using (
    exists (
      select 1
      from websites w
      where w.business_id = business_id
        and w.published = true
    )
  );

create table if not exists website_faqs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_website_faqs_business_id on website_faqs (business_id);
create index if not exists idx_website_faqs_sort_order on website_faqs (business_id, sort_order);

alter table website_faqs enable row level security;

drop policy if exists "website faqs access by business members" on website_faqs;
create policy "website faqs access by business members"
  on website_faqs for all
  to authenticated
  using (has_business_access(business_id))
  with check (has_business_access(business_id));
drop policy if exists "public can read published website faqs" on website_faqs;
create policy "public can read published website faqs"
  on website_faqs for select
  to anon
  using (
    exists (
      select 1
      from websites w
      where w.business_id = business_id
        and w.published = true
    )
  );

-- 14. SUPPORT
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  subject text not null,
  description text,
  status text not null default 'open'
    check (status in ('open', 'pending', 'resolved', 'closed')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_business_id on support_tickets (business_id);
create index if not exists idx_support_tickets_client_id on support_tickets (client_id);

drop trigger if exists update_support_tickets_updated_at on support_tickets;
create trigger update_support_tickets_updated_at
before update on support_tickets
for each row execute function update_updated_at_column();

alter table support_tickets enable row level security;

drop policy if exists "support tickets access by business members" on support_tickets;
create policy "support tickets access by business members"
  on support_tickets for all using (has_business_access(business_id));
drop policy if exists "clients can read their support tickets" on support_tickets;
create policy "clients can read their support tickets"
  on support_tickets for select using (
    exists (
      select 1
      from clients p
      where p.id = client_id
        and p.auth_user_id = auth.uid()
    )
  );

create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  sender_type text not null check (sender_type in ('client', 'staff', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_support_messages_ticket_id on support_messages (ticket_id);
create index if not exists idx_support_messages_business_id on support_messages (business_id);

alter table support_messages enable row level security;

drop policy if exists "support messages access by business members" on support_messages;
create policy "support messages access by business members"
  on support_messages for all using (has_business_access(business_id));

-- 15. NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  category text not null default 'system'
    check (category in ('appointment', 'billing', 'widget', 'support', 'system')),
  title text not null,
  message text not null,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_business_id on notifications (business_id);
create index if not exists idx_notifications_created_at on notifications (created_at desc);

alter table notifications enable row level security;

drop policy if exists "notifications access by business members" on notifications;
create policy "notifications access by business members"
  on notifications for all using (has_business_access(business_id));

-- 16. BILLING TRANSACTIONS
create table if not exists billing_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'DOP',
  chain_id integer not null default 137,
  tx_hash text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'failed', 'refunded')),
  payment_type text not null default 'booking_deposit'
    check (payment_type in ('booking_deposit', 'full_payment', 'subscription', 'portal_topup')),
  payment_method text
    check (payment_method in ('cash', 'transfer', 'card_cardnet', 'card_azul', 'usdc')),
  payment_reference text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_billing_transactions_business_id on billing_transactions (business_id);
create index if not exists idx_billing_transactions_appointment_id on billing_transactions (appointment_id);
create index if not exists idx_billing_transactions_client_id on billing_transactions (client_id);

drop trigger if exists update_billing_transactions_updated_at on billing_transactions;
create trigger update_billing_transactions_updated_at
before update on billing_transactions
for each row execute function update_updated_at_column();

alter table billing_transactions enable row level security;

drop policy if exists "billing transactions access by business members" on billing_transactions;
create policy "billing transactions access by business members"
  on billing_transactions for all using (has_business_access(business_id));
drop policy if exists "clients can see their billing rows" on billing_transactions;
create policy "clients can see their billing rows"
  on billing_transactions for select using (
    exists (
      select 1
      from clients p
      where p.id = client_id
        and p.auth_user_id = auth.uid()
    )
  );

-- 17. OPTIONAL HELPER VIEW FOR DASHBOARDS
-- Removed: `business_public_profiles` was an unused view (no code in the app
-- ever queried it) that selected phone/address/payment_wallet_address
-- straight out of `businesses`. Views in Postgres run with the *owner's*
-- privileges when checking table access, and migration-run roles typically
-- have BYPASSRLS, so a plain `select ... from businesses` view like this
-- would ignore businesses' RLS policies entirely and expose every business's
-- contact/payment info to anyone with SELECT on the view (anon/authenticated
-- get that by default in Supabase). If a public business directory is
-- needed later, build it as a `security_invoker = true` view (PG15+) with an
-- explicit, narrow column list and re-add RLS-aware filtering.
drop view if exists business_public_profiles;

-- 18. BUSINESS STRIPE ACCOUNTS
-- Lets a business collect its own appointment payments via Stripe (as an
-- alternative to the existing USDC/wallet flow), separate from this SaaS's
-- own billing. secret_key_encrypted is AES-256-GCM ciphertext (see
-- src/lib/cryptoSecrets.ts) - the app must never return it to the browser;
-- only /api/business/stripe (server-side, service-role client) reads or
-- writes this table.
create table if not exists business_stripe_accounts (
  business_id uuid primary key references businesses(id) on delete cascade,
  publishable_key text,
  secret_key_encrypted text,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists update_business_stripe_accounts_updated_at on business_stripe_accounts;
create trigger update_business_stripe_accounts_updated_at
before update on business_stripe_accounts
for each row execute function update_updated_at_column();

alter table business_stripe_accounts enable row level security;

-- No client-side policy grants insert/update/delete: only the service-role
-- admin client (used exclusively by /api/business/stripe, which itself
-- requires an authenticated owner/admin) ever writes this table. Business
-- members can still read their own row directly for a "connected" status
-- check if useful later - the ciphertext is opaque to them either way.
drop policy if exists "stripe account read by business members" on business_stripe_accounts;
create policy "stripe account read by business members"
  on business_stripe_accounts for select using (has_business_access(business_id));

