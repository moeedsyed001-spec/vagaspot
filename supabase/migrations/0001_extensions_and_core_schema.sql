-- 0001_extensions_and_core_schema.sql
-- VAGASPOT reviewed core schema v0.2
-- Fixes blueprint gaps:
--   - Explicit pgcrypto extension in extensions schema
--   - Safe FK delete actions on squads/squad_invites so full account deletion is never blocked
--   - auto_detection_enabled on profiles (for Release 2)
--   - invite_redeem_attempts table (for Phase 3 brute-force protection)
--   - squad_feed_signals table (for Phase 4 Realtime without exposing raw presence SELECT)
--   - Strict presence expiry & Ghost Mode DB invariants
--   - Default-deny RLS enabled + direct table grants revoked from public/anon/authenticated

begin;

create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 50),
  avatar_url text,
  auto_detection_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 40),
  created_by uuid references auth.users(id) on delete set null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.squad_members (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (squad_id, user_id)
);

create index if not exists idx_squad_members_user_active
  on public.squad_members(user_id, is_active);

create index if not exists idx_squad_members_squad_active
  on public.squad_members(squad_id, is_active);

create table if not exists public.squad_invites (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  token_hash bytea not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  check (expires_at > created_at)
);

create index if not exists idx_squad_invites_squad
  on public.squad_invites(squad_id, created_at desc);

create table if not exists public.invite_redeem_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  failed_count integer not null default 0 check (failed_count >= 0),
  window_started_at timestamptz not null default now(),
  locked_until timestamptz
);

create table if not exists public.campus_zones (
  id text primary key,
  name text not null,
  category text not null,
  display_order integer not null,
  is_active boolean not null default true,
  show_in_quick_list boolean not null default false
);

create table if not exists public.campus_config (
  id text primary key,
  display_name text not null,
  timezone text not null default 'Asia/Karachi',
  boundary_geojson jsonb,
  boundary_version text,
  geofence_config jsonb,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_campus_config_updated_at on public.campus_config;
create trigger trg_campus_config_updated_at
  before update on public.campus_config
  for each row execute function public.set_updated_at();

create table if not exists public.presence (
  squad_id uuid not null references public.squads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  campus_state text check (campus_state in ('on_campus', 'off_campus', 'unknown')),
  campus_source text check (campus_source in ('manual', 'geofence')),
  campus_observed_at timestamptz,
  campus_fresh_until timestamptz,
  manual_override_until timestamptz,
  availability text check (availability in ('free', 'in_class', 'busy', 'looking_for_friends')),
  availability_source text check (availability_source in ('manual')),
  availability_updated_at timestamptz,
  availability_expires_at timestamptz,
  zone_id text references public.campus_zones(id),
  zone_source text check (zone_source in ('manual')),
  zone_updated_at timestamptz,
  zone_expires_at timestamptz,
  note text check (note is null or char_length(note) <= 60),
  ghost_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (squad_id, user_id),
  foreign key (squad_id, user_id)
    references public.squad_members(squad_id, user_id) on delete cascade,
  check (
    (availability is null and availability_expires_at is null)
    or (availability is not null and availability_expires_at is not null)
  ),
  check (
    (zone_id is null and zone_expires_at is null)
    or (zone_id is not null and zone_expires_at is not null)
  ),
  check (
    not ghost_mode
    or (
      campus_state is null
      and campus_source is null
      and campus_observed_at is null
      and campus_fresh_until is null
      and manual_override_until is null
      and availability is null
      and availability_source is null
      and availability_updated_at is null
      and availability_expires_at is null
      and zone_id is null
      and zone_source is null
      and zone_updated_at is null
      and zone_expires_at is null
      and note is null
    )
  )
);

create index if not exists idx_presence_squad_updated
  on public.presence(squad_id, updated_at desc);

drop trigger if exists trg_presence_updated_at on public.presence;
create trigger trg_presence_updated_at
  before update on public.presence
  for each row execute function public.set_updated_at();

create table if not exists public.squad_feed_signals (
  squad_id uuid primary key references public.squads(id) on delete cascade,
  last_changed_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  squad_id uuid not null references public.squads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  master_enabled boolean not null default true,
  campus_entry boolean not null default true,
  campus_exit boolean not null default false,
  became_free boolean not null default true,
  looking_for_friends boolean not null default true,
  member_joined boolean not null default true,
  zone_changed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (squad_id, user_id),
  foreign key (squad_id, user_id)
    references public.squad_members(squad_id, user_id) on delete cascade
);

drop trigger if exists trg_notification_preferences_updated_at on public.notification_preferences;
create trigger trg_notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('android')),
  token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_push_devices_user
  on public.push_devices(user_id);

drop trigger if exists trg_push_devices_updated_at on public.push_devices;
create trigger trg_push_devices_updated_at
  before update on public.push_devices
  for each row execute function public.set_updated_at();

create table if not exists public.push_delivery_dedupe (
  event_id uuid not null,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  created_at timestamptz not null default now(),
  primary key (event_id, recipient_user_id, event_type)
);

-- Enable RLS on every exposed table (default deny)
alter table public.profiles enable row level security;
alter table public.squads enable row level security;
alter table public.squad_members enable row level security;
alter table public.squad_invites enable row level security;
alter table public.invite_redeem_attempts enable row level security;
alter table public.campus_zones enable row level security;
alter table public.campus_config enable row level security;
alter table public.presence enable row level security;
alter table public.squad_feed_signals enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_devices enable row level security;
alter table public.push_delivery_dedupe enable row level security;

-- Lock down default grants before granting narrow access in 0002
revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

comment on table public.presence is
  'Latest shareable presence snapshot only. No direct client SELECT; read via get_squad_feed RPC. Ghost Mode clears all shareable fields atomically.';
comment on table public.squad_feed_signals is
  'Minimal Realtime invalidation signal per squad; carries no presence or location fields.';
comment on column public.campus_config.boundary_geojson is
  'NULL until COMSATS campus boundary is georeferenced and human-reviewed.';
comment on table public.squad_invites is
  'Stores only SHA-256 hash of high-entropy single-use invite token; raw token returned once by RPC.';

commit;
