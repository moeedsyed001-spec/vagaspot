-- VAGASPOT schema blueprint v0.1 — REVIEW BEFORE USE.
-- This file creates core tables and indexes only.
-- It intentionally does NOT contain complete RLS policies, grants, RPC function bodies,
-- triggers, OAuth setup or Realtime publication changes. It is NOT a production-secure migration.
-- Read docs/04_DATABASE_AND_PRESENCE_SPEC.md and docs/AGENTS.md first.
-- Never apply permissive policies such as USING (true) to make the frontend “work”.

begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 50),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 40),
  created_by uuid not null references auth.users(id),
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
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_by uuid references auth.users(id),
  revoked_at timestamptz,
  check (expires_at > created_at)
);

create index if not exists idx_squad_invites_squad
  on public.squad_invites(squad_id, created_at desc);

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
  check (availability is not null or availability_expires_at is null),
  check (zone_id is not null or zone_expires_at is null)
);

create index if not exists idx_presence_squad_updated
  on public.presence(squad_id, updated_at desc);

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

-- RLS is enabled immediately. Add reviewed policies and narrowly scoped grants
-- in a follow-up migration before exposing any table through the Data API.
alter table public.profiles enable row level security;
alter table public.squads enable row level security;
alter table public.squad_members enable row level security;
alter table public.squad_invites enable row level security;
alter table public.campus_zones enable row level security;
alter table public.campus_config enable row level security;
alter table public.presence enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_devices enable row level security;

comment on table public.presence is
  'Latest shareable presence snapshot only. No GPS coordinates or movement history. Ghost Mode must clear all shareable fields atomically.';
comment on column public.campus_config.boundary_geojson is
  'NULL until the COMSATS campus boundary is georeferenced and human-reviewed. Do not derive coordinates from the photographed sign.';
comment on table public.squad_invites is
  'Stores only a cryptographic hash of high-entropy one-time invitation token; raw token is returned once by a secured RPC.';

commit;
