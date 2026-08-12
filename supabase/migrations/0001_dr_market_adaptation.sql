-- Dominican Republic market adaptation
-- Run this once against your LIVE Supabase project (SQL Editor -> New query).
-- schema.sql only affects fresh installs (CREATE TABLE IF NOT EXISTS), so an
-- existing project needs these ALTER TABLE statements applied by hand.
--
-- Safe to re-run: column additions use IF NOT EXISTS. The two "ADD
-- CONSTRAINT" blocks are wrapped so they skip cleanly if already applied.

-- 1. Change future-row defaults (does NOT touch existing rows - see the
--    optional UPDATE statements at the bottom if you want to backfill them).
alter table businesses alter column timezone set default 'America/Santo_Domingo';
alter table businesses alter column payment_currency set default 'DOP';
alter table services alter column currency set default 'DOP';
alter table appointments alter column payment_currency set default 'DOP';
alter table billing_transactions alter column currency set default 'DOP';

-- 2. New columns on businesses: bank details + which payment methods the
--    business accepts.
alter table businesses add column if not exists bank_name text;
alter table businesses add column if not exists bank_account_holder text;
alter table businesses add column if not exists bank_account_number text;
alter table businesses add column if not exists bank_account_type text;
alter table businesses add column if not exists tax_id text;
alter table businesses add column if not exists accepts_cash boolean not null default true;
alter table businesses add column if not exists accepts_transfer boolean not null default false;
alter table businesses add column if not exists accepts_card boolean not null default false;

-- 3. New payment_method/payment_reference columns on appointments and
--    billing_transactions, with the local processors as valid options
--    alongside cash/usdc.
alter table appointments add column if not exists payment_method text;
alter table appointments add column if not exists payment_reference text;
alter table billing_transactions add column if not exists payment_method text;
alter table billing_transactions add column if not exists payment_reference text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'appointments_payment_method_check'
  ) then
    alter table appointments
      add constraint appointments_payment_method_check
      check (payment_method in ('cash', 'transfer', 'card_cardnet', 'card_azul', 'usdc'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'billing_transactions_payment_method_check'
  ) then
    alter table billing_transactions
      add constraint billing_transactions_payment_method_check
      check (payment_method in ('cash', 'transfer', 'card_cardnet', 'card_azul', 'usdc'));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- OPTIONAL: backfill existing rows to the new DR defaults.
-- Only the businesses you already have will still show America/New_York
-- and USDC until you either edit them by hand in the dashboard/Settings,
-- or run this. Uncomment and run separately if you want that now.
-- ─────────────────────────────────────────────────────────────────────────
-- update businesses set timezone = 'America/Santo_Domingo' where timezone = 'America/New_York';
-- update businesses set payment_currency = 'DOP' where payment_currency = 'USDC';
-- update services set currency = 'DOP' where currency = 'USDC';
-- update appointments set payment_currency = 'DOP' where payment_currency = 'USDC';
-- update billing_transactions set currency = 'DOP' where currency = 'USDC';
