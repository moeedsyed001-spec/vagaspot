# 04 — Database and Presence Snapshot Specification

**Database:** Supabase PostgreSQL  
**Data model:** latest-state snapshot, not location history  
**Timezone for campus rules:** `Asia/Karachi`

## 1. Data principles

- Store only information needed to render the current squad feed.
- One presence row per `(squad_id, user_id)` in the first schema. This supports different visibility/state per squad if multi-squad UI is added later.
- A user's automatic campus event can update their active squad presence rows; MVP UI shows one active squad.
- Never store raw GPS coordinates or route history.
- Use `auth.uid()` as the actor identity; do not trust a client-supplied user ID.
- Use server-side timestamps and expiry calculation.
- Ghost Mode must clear sensitive shareable fields in the row so Realtime and direct reads cannot reveal stale state.

## 2. Tables

### `profiles`

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid PK references `auth.users(id)` | Account identity |
| `display_name` | text | Name visible to squad |
| `avatar_url` | text nullable | Google profile image URL, not uploaded storage |
| `created_at`, `updated_at` | timestamptz | Server timestamps |

Profile display fields are readable only by users sharing at least one squad with the profile owner. Only the owner can update their profile.

### `squads`

`id uuid PK`, `name text`, `created_by uuid`, `created_at timestamptz`, `is_archived boolean`.

Squads are private and not publicly discoverable. Creator becomes `owner` member in a transaction.

### `squad_members`

`id uuid PK`, `squad_id uuid FK`, `user_id uuid FK`, `role text CHECK ('owner','member')`, `joined_at timestamptz`, `is_active boolean`. Unique `(squad_id,user_id)`. Only owner can promote/remove members; member can leave. Prefer soft inactive or delete membership; after leaving, access must disappear immediately. A single owner minimum should be preserved when transferring/deleting.

### `squad_invites`

`id uuid PK`, `squad_id uuid FK`, `token_hash bytea UNIQUE`, `created_by uuid`, `created_at timestamptz`, `expires_at timestamptz`, `consumed_at timestamptz NULL`, `consumed_by uuid NULL`, `revoked_at timestamptz NULL`.

- Generate 128 bits or more of CSPRNG entropy.
- Show raw token/link once; store only SHA-256 digest at rest.
- Default expiry 72 hours.
- Single-use by default; revoke and rotate from owner settings.
- Never expose invite table directly to ordinary members.
- Apply a short rate limit to failed redeem attempts per authenticated user.

### `campus_zones`

`id text PK` (stable slug), `name text`, `category text`, `display_order int`, `is_active boolean`, `show_in_quick_list boolean`.

The initial rows are sourced from the uploaded map legend and are in `data/comsats-campus-zones.csv`. No coordinates are included until measured.

### `campus_config`

`id text PK` (e.g. `comsats-islamabad`), `display_name text`, `timezone text` (fixed to `Asia/Karachi`), `boundary_geojson jsonb NULL`, `boundary_version text NULL`, `geofence_config jsonb NULL`, `is_active boolean`.

Do not populate `boundary_geojson` with estimates from the photographed sign. It remains NULL until georeferenced and reviewed. Restrict write access to project owner/admin tooling, not squad clients.

### `presence`

Composite primary key `(squad_id,user_id)`; foreign keys to membership and profile.

| Column | Type | Meaning |
|---|---|---|
| `squad_id`, `user_id` | uuid | Presence owner within a squad |
| `campus_state` | text/enum nullable | `on_campus`, `off_campus`, `unknown`; NULL while ghost |
| `campus_source` | text nullable | `manual` or `geofence`; NULL while ghost |
| `campus_observed_at` | timestamptz nullable | Server time this campus state was confirmed |
| `campus_fresh_until` | timestamptz nullable | After this, feed treats state as Unknown |
| `manual_override_until` | timestamptz nullable | Manual campus correction wins over automation until then |
| `availability` | text/enum nullable | `free`, `in_class`, `busy`, `looking_for_friends`; NULL while ghost |
| `availability_source` | text nullable | `manual`; NULL while ghost |
| `availability_updated_at` | timestamptz nullable | Last selection |
| `availability_expires_at` | timestamptz nullable | Earlier of +2h or 18:00 local |
| `zone_id` | text nullable | Active `campus_zones.id`; NULL while ghost |
| `zone_source` | text nullable | `manual`; NULL while ghost |
| `zone_updated_at` | timestamptz nullable | Last zone selection |
| `zone_expires_at` | timestamptz nullable | Same expiry rule as availability |
| `note` | text nullable | Optional user note, max 60 chars; NULL while ghost |
| `ghost_mode` | boolean | Visibility switch |
| `created_at`, `updated_at` | timestamptz | Server timestamps |

Use text checks or PostgreSQL enums. Prefer check constraints if future enum additions should avoid migration friction. The `presence` feed can expose `ghost_mode=true` while all shareable presence fields are NULL. This permits a member card to remain visible without leaking previous state.

### `notification_preferences` (Release 1.1)

Composite key `(squad_id,user_id)`. Fields: `master_enabled`, `campus_entry`, `campus_exit`, `became_free`, `looking_for_friends`, `member_joined`, `zone_changed`, `updated_at`. Defaults are in `02_USER_STORIES_AND_BUSINESS_RULES.md`.

### `push_devices` (Release 1.1)

`id uuid PK`, `user_id uuid`, `platform text CHECK ('android')`, `token text UNIQUE`, `created_at`, `updated_at`, `last_seen_at`. A user can register more than one device. Delete invalid FCM tokens and remove tokens on logout/account deletion. Never expose tokens to other members.

### Optional `push_delivery_dedupe` (Release 1.1 only)

Use a random event UUID and recipient user ID + event type + created timestamp to prevent duplicate push sends. This is technical delivery metadata, not a presence history. Keep no coordinates or zone text. Avoid building a permanent event ledger. Clean up old dedupe rows opportunistically in a safe server-side function or omit push until a cleanup mechanism is verified.

## 3. Read/write access model

- Enable RLS on every table exposed via Supabase APIs.
- Default deny.
- `profiles`: select self and profiles of active squad peers; update self only.
- `squads`: select only if active member; create through RPC; update/delete owner only through RPC.
- `squad_members`: select members of own squads; mutations through authorized RPCs.
- `squad_invites`: no general select; create/revoke/redeem through RPC only.
- `campus_zones`, `campus_config`: authenticated read; no client writes.
- `presence`: **no direct client `SELECT`** (prevents raw PostgREST reads of expired fields); read only through `get_squad_feed` RPC; writes through RPC only. Ghost update clears all shareable fields atomically.
- `notification_preferences`, `push_devices`: own rows only.
- `service_role` key is never used by client code.

Security-definer functions must set a fixed safe `search_path`, check `auth.uid()` and membership/role explicitly, validate every enum/expiry/note and be granted only to intended roles. Avoid policy recursion by using carefully audited helper functions or explicit joins.

## 4. RPC contracts

Implement and test these functions. Names are proposed; adjust signatures once, then keep consistent across docs/code.

| RPC | Auth | Purpose | Key validation |
|---|---|---|---|
| `create_squad(p_name)` | Signed in | Create squad and owner membership in one transaction | Trim name, 2–40 chars |
| `create_invite(p_squad_id,p_ttl_hours)` | Owner | Create random invite; return raw token once | Membership+owner role, TTL 1–168h |
| `redeem_invite(p_raw_token)` | Signed in | Join squad atomically | Hash token, active, not expired/revoked/used; unique membership |
| `get_my_squads()` | Signed in | List memberships | Only caller rows |
| `get_squad_feed(p_squad_id)` | Signed in member | Return profiles + redacted current presence | Member check; hide null fields/expired values |
| `set_my_campus_state(p_squad_id,p_state)` | Signed in member | Manual On/Off/Unknown | Valid state; source set server-side; manual override until now+2h |
| `set_my_availability(p_squad_id,p_availability)` | Signed in member | Update availability and expiry | Allowed enum; server computes expiry using Asia/Karachi |
| `set_my_zone(p_squad_id,p_zone_id,p_note)` | Signed in member | Update zone and expiry | Active zone; note <=60 chars |
| `set_ghost_mode(p_squad_id,p_enabled)` | Signed in member | Hide or reset presence | When true clear all shareable fields; when false reset to Unknown/null |
| `set_auto_detection_enabled(p_enabled)` | Signed in | Save user's opt-in preference (Release 2) | Does not imply OS permission granted |
| `register_push_device(p_token)` | Signed in | Save caller FCM token | Platform Android; token belongs to caller |
| `remove_push_device(p_token)` | Signed in | Remove caller token | Token ownership check |

Do not write a generic client-controlled `set_presence(status,source)` RPC that accepts arbitrary source, expiry or `user_id`. Separate functions make validation and permissions easier to reason about.

## 5. Expiry evaluation

Do not require PostgreSQL TTL, a paid cleanup job or a scheduled function for visible correctness.

Feed RPC should return an effective view:
- If `ghost_mode=true`, return hidden values as NULL.
- If `availability_expires_at <= now()`, return availability NULL and zone NULL (or treat zone independently if product later separates expiry).
- If `campus_fresh_until <= now()`, return campus_state `unknown`, campus_source NULL.
- A stale record is not necessarily deleted; it simply is not shown as current.

Optionally clear expired snapshot fields on the next user's own presence mutation. Avoid a background scheduler dependency in MVP.

## 6. Realtime publication

After RLS/policies have been tested, do **not** expose raw `presence` rows directly to client `SELECT` for Realtime; instead publish a minimal Realtime refresh signal (e.g., a separate `squad_feed_signals` table containing only `squad_id` and `updated_at`) plus only necessary non-sensitive membership change signals, subject to RLS. Treat Realtime strictly as an invalidation/refresh signal for `get_squad_feed`.

## 7. Data lifecycle

- On leaving a squad: remove/inactivate membership and delete that squad's presence row for the user.
- On account deletion: execute a full server-side deletion flow (database cleanup + privileged `auth.users` deletion) rather than deleting only the public profile. Ensure FKs (`squads.created_by`, `squad_invites.created_by`/`consumed_by`) allow clean deletion or transfer/revoke ownership first.
- On Ghost Mode: preserve membership; clear shared presence fields.
- On logout: clear client caches and optionally unregister local FCM token; do not delete account data.
- No continuous GPS data to purge because it is never persisted.

## 8. Starter SQL

`../database/0001_schema_blueprint.sql` is intentionally labelled as a review-first schema skeleton. It does not replace complete RPC bodies, RLS policies, grants, edge-function review or multi-account security testing. Do not deploy it as a finished secure backend.
