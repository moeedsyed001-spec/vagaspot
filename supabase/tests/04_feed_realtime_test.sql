-- 04_feed_realtime_test.sql
-- Disposable/transactional SQL verification script for Phase 4.
-- Verifies:
--   - Non-member User C cannot read get_squad_feed
--   - Ghost Mode fixture redacts all shareable presence/timestamp fields server-side
--   - Expired availability/zone/note become NULL in get_squad_feed
--   - Stale campus state (> 8h) becomes 'unknown' (never 'off_campus')
--   - public.squad_feed_signals is in supabase_realtime, while public.presence is NOT

begin;

do $$
declare
  v_owner uuid := '11111111-1111-4111-8111-111111111111';
  v_friend uuid := '22222222-2222-4222-8222-222222222222';
  v_outsider uuid := '33333333-3333-4333-8333-333333333333';
  v_squad_id uuid;
  v_token text;
  v_row record;
  v_count int;
begin
  insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values
    (v_owner, 'authenticated', 'authenticated', 'owner@example.test', '{"full_name":"Owner One"}'::jsonb, now(), now()),
    (v_friend, 'authenticated', 'authenticated', 'friend@example.test', '{"full_name":"Friend Two"}'::jsonb, now(), now()),
    (v_outsider, 'authenticated', 'authenticated', 'outsider@example.test', '{"full_name":"Outsider Three"}'::jsonb, now(), now());

  insert into public.campus_zones (id, name, category, display_order, is_active, show_in_quick_list)
  values ('library', 'Library', 'learning', 12, true, true)
  on conflict (id) do nothing;

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', v_owner::text, 'role', 'authenticated')::text, true);
  v_squad_id := public.create_squad('COMSATS Feed Test');
  v_token := public.create_invite(v_squad_id, 24);

  perform set_config('request.jwt.claims', json_build_object('sub', v_friend::text, 'role', 'authenticated')::text, true);
  perform * from public.redeem_invite(v_token);

  -- 1. Outsider cannot call get_squad_feed
  perform set_config('request.jwt.claims', json_build_object('sub', v_outsider::text, 'role', 'authenticated')::text, true);
  begin
    perform * from public.get_squad_feed(v_squad_id);
    raise exception 'FAIL: Outsider could read get_squad_feed';
  exception when insufficient_privilege then
    null; -- expected
  end;

  -- 2. Seed presence fixtures as privileged role to test feed transformations
  execute 'reset role';

  -- Owner: active on_campus, active free, active library + note
  update public.presence
  set campus_state = 'on_campus',
      campus_source = 'manual',
      campus_observed_at = now() - interval '10 minutes',
      campus_fresh_until = now() + interval '7 hours 50 minutes',
      availability = 'free',
      availability_source = 'manual',
      availability_updated_at = now() - interval '10 minutes',
      availability_expires_at = now() + interval '1 hour 50 minutes',
      zone_id = 'library',
      zone_source = 'manual',
      zone_updated_at = now() - interval '10 minutes',
      zone_expires_at = now() + interval '1 hour 50 minutes',
      note = '2nd floor quiet area',
      ghost_mode = false
  where squad_id = v_squad_id and user_id = v_owner;

  -- Friend: stale campus (>8h) + expired availability/zone/note
  update public.presence
  set campus_state = 'on_campus',
      campus_source = 'manual',
      campus_observed_at = now() - interval '9 hours',
      campus_fresh_until = now() - interval '1 hour',
      availability = 'busy',
      availability_source = 'manual',
      availability_updated_at = now() - interval '3 hours',
      availability_expires_at = now() - interval '1 hour',
      zone_id = 'library',
      zone_source = 'manual',
      zone_updated_at = now() - interval '3 hours',
      zone_expires_at = now() - interval '1 hour',
      note = 'Should be hidden',
      ghost_mode = false
  where squad_id = v_squad_id and user_id = v_friend;

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', v_friend::text, 'role', 'authenticated')::text, true);

  -- Check Owner active row
  select * into v_row from public.get_squad_feed(v_squad_id) f where f.user_id = v_owner;
  if v_row.campus_state <> 'on_campus' or v_row.availability <> 'free' or v_row.zone_id <> 'library' or v_row.note <> '2nd floor quiet area' then
    raise exception 'FAIL: Active feed row mismatch: %', v_row;
  end if;

  -- Check stale + expired Friend row
  select * into v_row from public.get_squad_feed(v_squad_id) f where f.user_id = v_friend;
  if v_row.campus_state <> 'unknown' or v_row.campus_source is not null or v_row.availability is not null or v_row.zone_id is not null or v_row.note is not null then
    raise exception 'FAIL: Stale/expired row was not redacted properly';
  end if;

  -- 3. Enable Ghost Mode on Owner and verify Friend sees NULLs only
  execute 'reset role';
  update public.presence
  set ghost_mode = true,
      campus_state = null,
      campus_source = null,
      campus_observed_at = null,
      campus_fresh_until = null,
      manual_override_until = null,
      availability = null,
      availability_source = null,
      availability_updated_at = null,
      availability_expires_at = null,
      zone_id = null,
      zone_source = null,
      zone_updated_at = null,
      zone_expires_at = null,
      note = null
  where squad_id = v_squad_id and user_id = v_owner;

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', v_friend::text, 'role', 'authenticated')::text, true);

  select * into v_row from public.get_squad_feed(v_squad_id) f where f.user_id = v_owner;
  if v_row.is_ghost is not true
     or v_row.display_name <> 'Owner One'
     or v_row.campus_state is not null
     or v_row.availability is not null
     or v_row.zone_id is not null
     or v_row.note is not null
     or v_row.last_updated_at is not null then
    raise exception 'FAIL: Ghost Mode row leaked presence fields';
  end if;

  -- 4. Verify Realtime publication contains squad_feed_signals and NOT presence
  execute 'reset role';
  select count(*) into v_count
  from pg_publication_tables
  where pubname = 'supabase_realtime'
    and schemaname = 'public'
    and tablename = 'squad_feed_signals';
  if v_count <> 1 then
    raise exception 'FAIL: public.squad_feed_signals is not in supabase_realtime';
  end if;

  select count(*) into v_count
  from pg_publication_tables
  where pubname = 'supabase_realtime'
    and schemaname = 'public'
    and tablename = 'presence';
  if v_count <> 0 then
    raise exception 'FAIL: public.presence must NOT be in supabase_realtime';
  end if;

  raise notice 'ALL PHASE 4 FEED & REALTIME TESTS PASSED';
end;
$$;

rollback;
