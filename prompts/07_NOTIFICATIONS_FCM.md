# Prompt 07 — Android push notifications (Release 1.1, optional)

**Feed:** `AGENTS.md`, `docs/02_USER_STORIES_AND_BUSINESS_RULES.md` (BR-14/15), `docs/03_SYSTEM_ARCHITECTURE.md`, `docs/04_DATABASE_AND_PRESENCE_SPEC.md`, `docs/09_NOTIFICATIONS.md`.

## Task prompt

Implement Android FCM push as an optional enhancement; Realtime feed remains primary and must work without push. Register Android device token through authenticated RPC. Add notification preferences with default values in the spec and master switch. Implement Supabase Edge Function sender that verifies JWT/authorization, rechecks the current squad membership, preference and Ghost Mode, uses FCM HTTP v1 from server-side secrets only, sends generic privacy-preserving content and handles invalid tokens. Add event deduplication and prevent duplicate sends. Avoid pg_net/database webhook dependency unless separately approved and tested.

Do not send zones, coordinates, notes, raw tokens or hidden statuses in payload. Do not implement browser push. If Firebase project or credentials are missing, build typed integration boundary and exact setup doc; don't insert fake secrets.

## Checks

- Preferences on/off category and master switch.
- Ghost Mode suppresses notifications.
- Removed member gets no push.
- Duplicate event sends once.
- Invalid token gets removed.
- No service credential in bundle/Git.
- Feed still updates when FCM/Edge Function unavailable.
