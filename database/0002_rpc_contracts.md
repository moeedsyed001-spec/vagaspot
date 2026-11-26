# VAGASPOT database RPC contract checklist

This file is a contract, not executable SQL. Implement functions in ordered migrations after reading `docs/04_DATABASE_AND_PRESENCE_SPEC.md`.

## Required function signatures (proposed)

```sql
create_squad(p_name text) returns uuid
create_invite(p_squad_id uuid, p_ttl_hours int default 72) returns text
redeem_invite(p_raw_token text) returns uuid
get_my_squads() returns setof ...
get_squad_feed(p_squad_id uuid) returns setof ...
set_my_campus_state(p_squad_id uuid, p_state text) returns void
set_my_availability(p_squad_id uuid, p_availability text) returns timestamptz
set_my_zone(p_squad_id uuid, p_zone_id text, p_note text default null) returns timestamptz
set_ghost_mode(p_squad_id uuid, p_enabled boolean) returns void
set_auto_detection_enabled(p_enabled boolean) returns void -- Release 2
register_push_device(p_token text) returns void -- Release 1.1
remove_push_device(p_token text) returns void -- Release 1.1
```

## Security requirements for every mutation RPC

- `auth.uid()` must be non-null.
- Validate caller membership in the requested squad.
- Never accept a target `user_id`; derive it from `auth.uid()`.
- Use `security definer` only when needed, set fixed `search_path`, qualify all objects and revoke default PUBLIC execute permissions.
- Return only the minimum required output.
- Server computes timestamps and expiry; client cannot choose them.
- Explicitly validate enum values, active zone, text length and role.
- Keep invitation redeem transactional and single-use.
- Test as anon, member, non-member, owner and removed member.

## Important state transitions

### `set_ghost_mode(true)`
Set `ghost_mode=true`; clear campus_state/source/observed/freshness/manual override, availability/source/timestamps/expiry, zone/source/timestamps/expiry and note in the same transaction. Retain squad_id/user_id and updated_at.

### `set_ghost_mode(false)`
Set `ghost_mode=false`; set campus_state=`unknown` or NULL according to chosen effective view; clear availability and zone; do not restore old values. Require a fresh check-in.

### `set_my_availability`
Compute expiry server-side using `Asia/Karachi`: minimum of current instant + 2 hours and that day's 18:00 Asia/Karachi. If local time is already at/after 18:00, do not create an active state; return an understandable validation error or null expiry by agreed UI contract.

### `get_squad_feed`
- Check active membership.
- Join profiles and presence.
- For Ghost Mode rows return display_name/avatar plus hidden flag only; all presence fields are NULL.
- For expired availability/zone return NULL.
- For stale campus state return Unknown.
- Do not return exact coordinates or raw tokens.

## Realtime

After function/policy implementation, publish only necessary tables. RLS must be validated with multiple users. Never add a sensitive table to Realtime before authorization is tested.
