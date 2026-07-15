-- ============================================================================
-- LendLoop — Foundation migration
-- ============================================================================
-- Adds every table/column needed for the full feature roadmap:
--   Reviews everywhere, Damage Deposit, Cancellation Policy, Wishlist,
--   Owner Earnings, Availability Calendar, Multiple Photos, In-App Messaging,
--   Dispute Resolution, Admin Panel.
--
-- Safe to run more than once: every statement is guarded (IF NOT EXISTS /
-- DO-block existence checks), so re-running this file is a no-op for
-- anything already applied. Existing tables, columns, and data are never
-- dropped or renamed.
--
-- HOW TO RUN
--   Supabase Dashboard → SQL Editor → paste this file → Run.
--   or, with the Supabase CLI linked to your project:  supabase db push
-- ============================================================================

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. CANCELLATION POLICY (assets + rentals)
-- ----------------------------------------------------------------------------
alter table public.assets
  add column if not exists cancellation_policy text not null default 'MODERATE'
    check (cancellation_policy in ('FLEXIBLE', 'MODERATE', 'STRICT'));

alter table public.rentals
  add column if not exists cancellation_policy text
    check (cancellation_policy in ('FLEXIBLE', 'MODERATE', 'STRICT')),
  add column if not exists cancelled_by uuid references public.users(id),
  add column if not exists cancellation_reason text,
  add column if not exists refund_amount numeric(10, 2),
  add column if not exists cancelled_at timestamptz;

-- ----------------------------------------------------------------------------
-- 2. DAMAGE DEPOSIT lifecycle (rentals)
-- ----------------------------------------------------------------------------
alter table public.rentals
  add column if not exists deposit_status text not null default 'NONE'
    check (deposit_status in ('NONE', 'PENDING', 'HELD', 'REFUNDED', 'PARTIALLY_REFUNDED', 'FORFEITED')),
  add column if not exists deposit_refund_amount numeric(10, 2),
  add column if not exists deposit_notes text,
  add column if not exists deposit_resolved_at timestamptz,
  add column if not exists deposit_resolved_by uuid references public.users(id);

-- ----------------------------------------------------------------------------
-- 3. WISHLIST
-- ----------------------------------------------------------------------------
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, asset_id)
);

create index if not exists idx_wishlists_user_id on public.wishlists(user_id);
create index if not exists idx_wishlists_asset_id on public.wishlists(asset_id);

-- ----------------------------------------------------------------------------
-- 4. MULTIPLE PHOTOS (asset_images)
-- ----------------------------------------------------------------------------
create table if not exists public.asset_images (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_asset_images_asset_id on public.asset_images(asset_id, sort_order);

-- Backfill: carry each asset's existing single image_url into asset_images
-- as position 0, so nothing is lost when the UI switches to the gallery.
insert into public.asset_images (asset_id, image_url, sort_order)
select a.id, a.image_url, 0
from public.assets a
where a.image_url is not null
  and not exists (
    select 1 from public.asset_images ai where ai.asset_id = a.id
  );

-- ----------------------------------------------------------------------------
-- 5. REVIEWS — denormalized asset_id for fast per-asset rating queries
-- ----------------------------------------------------------------------------
alter table public.reviews
  add column if not exists asset_id uuid references public.assets(id),
  add column if not exists is_flagged boolean not null default false;

update public.reviews r
set asset_id = rt.asset_id
from public.rentals rt
where r.rental_id = rt.id
  and r.asset_id is null;

create index if not exists idx_reviews_asset_id on public.reviews(asset_id);
create index if not exists idx_reviews_receiver_id on public.reviews(receiver_id);

-- ----------------------------------------------------------------------------
-- 6. AVAILABILITY CALENDAR (owner-blocked dates)
-- ----------------------------------------------------------------------------
create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  owner_id uuid not null references public.users(id),
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists idx_availability_blocks_asset_id on public.availability_blocks(asset_id);

-- ----------------------------------------------------------------------------
-- 7. IN-APP MESSAGING (conversations + messages)
-- ----------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets(id) on delete cascade,
  rental_id uuid references public.rentals(id) on delete cascade,
  participant_one_id uuid not null references public.users(id),
  participant_two_id uuid not null references public.users(id),
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now(),
  unique (asset_id, participant_one_id, participant_two_id)
);

create index if not exists idx_conversations_participant_one on public.conversations(participant_one_id);
create index if not exists idx_conversations_participant_two on public.conversations(participant_two_id);
create index if not exists idx_conversations_rental_id on public.conversations(rental_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation_id on public.messages(conversation_id, created_at);
create index if not exists idx_messages_sender_id on public.messages(sender_id);

-- Add messages + conversations to the Supabase Realtime publication so the
-- frontend can subscribe to live inserts without polling.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
exception when undefined_object then
  -- supabase_realtime publication doesn't exist in this environment
  -- (e.g. a non-Supabase Postgres instance) — safe to skip.
  null;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
exception when undefined_object then
  null;
end $$;

-- ----------------------------------------------------------------------------
-- 8. DISPUTE RESOLUTION
-- ----------------------------------------------------------------------------
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references public.rentals(id) on delete cascade,
  raised_by uuid not null references public.users(id),
  against_user_id uuid not null references public.users(id),
  reason text not null,
  description text,
  status text not null default 'OPEN'
    check (status in ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED')),
  resolution text,
  resolved_by uuid references public.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_disputes_rental_id on public.disputes(rental_id);
create index if not exists idx_disputes_status on public.disputes(status);

create table if not exists public.dispute_messages (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_dispute_messages_dispute_id on public.dispute_messages(dispute_id, created_at);

-- ----------------------------------------------------------------------------
-- 9. ADMIN PANEL support columns
-- ----------------------------------------------------------------------------
alter table public.users
  add column if not exists is_admin boolean not null default false,
  add column if not exists is_banned boolean not null default false,
  add column if not exists banned_reason text,
  add column if not exists banned_at timestamptz;

alter table public.assets
  add column if not exists is_flagged boolean not null default false,
  add column if not exists flagged_reason text;

-- ----------------------------------------------------------------------------
-- Done. Re-run any time — every statement above is idempotent.
-- ----------------------------------------------------------------------------
