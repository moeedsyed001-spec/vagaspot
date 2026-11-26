-- 0006_ghost_mode_and_privacy.sql
-- VAGASPOT Phase 6: Server-side Ghost Mode transition & privacy hardening.
-- Enforces:
--   - Per-squad Ghost Mode scoped to auth.uid()
--   - Turning Ghost Mode ON atomically clears all shareable fields to NULL
--   - Turning Ghost Mode OFF resets campus_state to 'unknown' and never restores prior state
--   - Reasserts REPLICA IDENTITY DEFAULT and zero direct client access on presence

begin;

create or replace function public.set_ghost_mode(p_squad_id uuid, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_enabled is null then
    raise exception 'Ghost Mode flag is required' using errcode = '22023';
  end if;

  if not public.is_active_squad_member(p_squad_id) then
    raise exception 'Not a member of this squad' using errcode = '42501';
  end if;

  if p_enabled then
    insert into public.presence (squad_id, user_id, ghost_mode)
    values (p_squad_id, v_uid, true)
    on conflict (squad_id, user_id)
    do update set
      ghost_mode = true,
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
      note = null;
  else
    insert into public.presence (squad_id, user_id, campus_state, ghost_mode)
    values (p_squad_id, v_uid, 'unknown', false)
    on conflict (squad_id, user_id)
    do update set
      ghost_mode = false,
      campus_state = 'unknown',
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
      note = null;
  end if;

  perform public.touch_squad_feed_signal(p_squad_id);
end;
$$;

revoke all on function public.set_ghost_mode(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_ghost_mode(uuid, boolean) to authenticated;

-- Privacy hardening assertions: keep REPLICA IDENTITY DEFAULT and no direct presence access
alter table public.presence replica identity default;
alter table public.squad_feed_signals replica identity default;

revoke all on table public.presence from public, anon, authenticated;
revoke all on table public.squad_invites from public, anon, authenticated;
revoke all on table public.invite_redeem_attempts from public, anon, authenticated;
revoke all on table public.push_delivery_dedupe from public, anon, authenticated;

commit;
