# 02 — User Stories, Acceptance Criteria and Business Rules

## 1. User stories

Priorities: **P0** required for usable MVP; **P1** desired shortly after MVP; **P2** later release.

| ID | Priority | User story | Acceptance criteria |
|---|---|---|---|
| US-001 | P0 | As a friend, I can sign in with Google so I can use my account without a password reset flow. | Successful OAuth returns to app; invalid/cancelled flow displays recoverable message; session persists securely; logout clears local state. |
| US-002 | P0 | As a friend, I can create a private squad. | Creator becomes owner; squad is not publicly discoverable; only members can read its data. |
| US-003 | P0 | As an owner, I can generate an invitation link/token. | Token is random, stored as hash, one-use, revocable and expires; raw token is shown only at creation. |
| US-004 | P0 | As an invited friend, I can join a squad using the invitation. | Must be authenticated; expired/revoked/used token fails safely; membership is created once; duplicate membership is idempotent. |
| US-005 | P0 | As a member, I can see my squad's friend feed. | Feed contains only squad members; shows profile name/avatar, current visible presence, status, zone and relative/absolute update age. |
| US-006 | P0 | As a member, I can manually state On Campus or Off Campus. | Server records source=manual, actor=auth.uid(), timestamp; no GPS coordinate is needed. |
| US-007 | P0 | As a member, I can choose availability. | Allowed values only; manual change updates server timestamp and expiry; expired value is displayed as unset/Unknown. |
| US-008 | P0 | As a member, I can choose a campus zone. | Selection is from active campus zones; optional note obeys length limit; zone expires with availability. |
| US-009 | P0 | As a member, I can enable Ghost Mode immediately. | Profile remains visible; other members cannot read campus state, availability, zone, source or timestamps; own session can see own state. |
| US-010 | P0 | As a member, I can turn Ghost Mode off. | Shareable presence remains Unknown/empty until user performs a fresh check-in; never restore stale cached status. |
| US-011 | P0 | As a member, I can leave a squad. | Membership is removed; member loses all access; no presence row remains visible in that squad. |
| US-012 | P0 | As an owner, I can remove a member and revoke invites. | Only owner can do this; action invalidates membership/invite access immediately. |
| US-013 | P0 | As a user, I can see stale or unavailable information honestly. | Expired state is not labelled current; stale campus detection becomes Unknown; feed handles offline/reconnect. |
| US-014 | P1 | As a user, I can receive Android push notifications for selected events. | Only enabled recipients receive; Ghost Mode data is never included; invalid token is removed; duplicate events are deduplicated. |
| US-015 | P1 | As a member, I can enable automatic campus detection on Android. | Requires explicit opt-in and background permission disclosure; denied permission leaves manual use intact. |
| US-016 | P1 | As a member, my campus presence can change on geofence entry/exit. | Event verified against approved campus polygon; no exact coordinate stored; errors/uncertainty produce Unknown, not false certainty. |
| US-017 | P1 | As a member, I can turn automatic detection off. | Geofences removed; no further automation update is sent; manual updates remain available. |
| US-018 | P1 | As a user, I can install the web app as a PWA where supported. | Manifest/icons/HTTPS/installability checked; web app remains functional in browser without PWA installation. |

## 2. Business rules

### BR-01 — Separation of state
Campus presence, availability and zone are separate values. A change to one must not silently set the others. In particular, automatic entry never sets availability=Free and never guesses a zone.

### BR-02 — Allowed enums

- `campus_state`: `on_campus`, `off_campus`, `unknown`.
- `availability`: `free`, `in_class`, `busy`, `looking_for_friends` or `null`.
- `source`: `manual`, `geofence`, `null`.
- `ghost_mode`: boolean.
- `zone_id`: active campus zone ID or `null`.

### BR-03 — Manual status expiry
For a manual availability/zone update at time `t` in `Asia/Karachi`:

`availability_expires_at = min(t + 2 hours, next applicable 18:00 local cutoff)`

The date boundary must be evaluated using `Asia/Karachi`, not the browser/device timezone. Availability, zone and note share one expiry and reopen at `00:00` `Asia/Karachi`. If a user checks in between `18:00` and `23:59` PKT, no new active availability/zone/note is created. Setting `campus_state` to `off_campus` automatically clears active availability, zone and note.

Campus presence does **not** use this same two-hour timer.

### BR-04 — Campus freshness
A campus detection has a separate `campus_observed_at` and an 8-hour freshness window (`campus_observed_at + 8 hours`) from the latest verified check-in, and does **not** automatically expire at `18:00` PKT. After cutoff, public state becomes `unknown`. Never convert a missed exit event into `off_campus` just because time elapsed.

### BR-05 — Ghost Mode precedence
Ghost Mode is scoped per squad and overrides manual, geofence, feed, Realtime, push and all other display paths. When Ghost Mode is on, clear `campus_state`, `availability`, `zone_id`, `source`, `campus_observed_at`, `last_updated_at`, `availability_expires_at`, `note` for that squad row server-side. The profile name/avatar remain visible. Server-side read rules must not expose the old values.

When Ghost Mode is turned off, do not reinstate previous state. Set campus state to `unknown`, availability and zone to null; require a fresh user action or new verified geofence event. Ghost Mode prevents further access through the application; it cannot erase information another member already saw, copied, photographed or remembered before Ghost Mode was enabled.

### BR-06 — Manual override
In Release 2, a manual campus-state selection is authoritative until the next verified geofence event or a maximum override duration of 2 hours, whichever happens first. This prevents automation immediately undoing a user's correction. Availability/zone continue following BR-03.

### BR-07 — Unknown is not Off Campus
If permission is denied, location is unavailable, event is ambiguous, data is stale or internet sync has not completed, use `unknown`. Do not infer off-campus state from missing data.

### BR-08 — Squad authorization
A user can read a squad or its presence only while an active membership exists. Owner/admin actions require owner role. A squad owner cannot see another member's hidden presence during Ghost Mode.

### BR-09 — Invitation token
Use at least 96 bits of cryptographically secure randomness (recommended 128 bits), single-use, expiring (default 72 hours), revocable, and stored server-side only as a cryptographic hash. Do not use a sequential ID or low-entropy six-digit guessable code as the primary secret. A short human-readable squad name/code can identify the group but must not grant membership.

### BR-10 — Profile fields
Only display name and optional provider avatar are needed. Do not collect phone number, date of birth, student ID or precise home address. Never use student ID as a password or invite token.

### BR-11 — Zone catalogue
Zones come from `campus_zones`; only active zones are selectable. The supplied sign is the initial label source. A zone label does not claim that GPS verified the person is inside that building.

### BR-12 — Location minimisation
Do not store continuous coordinates, routes, movement trails or raw triggering locations. Release 2 may obtain a transient coordinate on-device to verify a geofence transition against the campus polygon. Discard it after decision. Do not log it to analytics, crash logs or push messages.

### BR-13 — Timestamp source
Use Supabase/PostgreSQL server timestamps for authoritative `updated_at`, `observed_at` and expiry values. The client may display relative time but must not be trusted to set authoritative server time.

### BR-14 — Notification preferences
Default preferences (subject to OS permission): campus entry ON; availability changed to Free ON; Looking for Friends ON; new squad member ON; campus exit OFF; zone changes OFF; Ghost Mode changes OFF. Master push switch overrides all categories. Users can change preferences at any time.

### BR-15 — Notification privacy
Push text must be generic, e.g. “A friend is now on campus” or “A friend is free”. Never include a zone, coordinate, hidden state, or status for a Ghost Mode user. Only notify users who remain active squad members and have the corresponding preference enabled.

### BR-16 — Offline updates
If a manual update fails, show “Not synced” and allow retry. Do not show it as live to friends until server confirms. An Android geofence event may be queued locally; the feed must show the last server-confirmed state, not imply the offline event has synchronized.

### BR-17 — Data retention
Keep the latest presence snapshot only. No user-facing presence history. Invitation hashes are removed/revoked when consumed or expired; device tokens are removed on logout/account deletion; notification dedupe metadata should be minimal and short-lived. No analytics product that records precise location.

### BR-18 — Quota exhaustion
When backend quota or service is unavailable, show a useful offline/service-unavailable state. Do not silently switch to paid resources or ask the application to upgrade automatically.

## 3. Error and empty-state copy principles

- Use “Presence unavailable” rather than “Off Campus” if the system does not know.
- Use “Last updated 18 min ago” instead of making old data look live.
- Use “Location permission is off — manual check-in still works.”
- Use “Ghost Mode is on” only on the user's own screen; other members see name/avatar and a neutral hidden state.
- Use “Invite expired — ask the squad owner for a new one.”
