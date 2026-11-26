# Prompt 04 — Friend feed and Supabase Realtime

**Feed:** `AGENTS.md`, `docs/02_USER_STORIES_AND_BUSINESS_RULES.md` (BR-01/05/07/08/13), `docs/03_SYSTEM_ARCHITECTURE.md` (Realtime), `docs/04_DATABASE_AND_PRESENCE_SPEC.md` (presence and feed RPC), `docs/05_SCREENS_AND_NAVIGATION.md` (S-05/S-10), `docs/07_BRAND_AND_DESIGN_SYSTEM.md`.

## Task prompt

Implement the squad feed UI and data integration. Create `get_squad_feed` or use the agreed query/RLS strategy; show only current squad members. A member card shows avatar/initials, name, campus state (On Campus/Off Campus/Unknown), availability only when active, selected zone only when active, source/freshness label and a last-updated time. Ghost member card must show name/avatar and “Presence hidden” only; never show old status, zone, update time or source.

Use TanStack Query for server cache. Use Supabase Realtime only to invalidate/refetch the active squad feed. Add a modest 60-second polling fallback only while feed is visible, pause while backgrounded, and show sync/last successful update. Do not create a second client-side source of truth. Provide loading, empty, network disconnected, paused-service and error states.

Do not implement check-in mutation, push, map or geofencing yet. Use no fake production sample data.

## Checks

- Change a harmless test row as User A; User B in same squad sees update without refresh.
- Unrelated User C sees nothing.
- Ghost Mode fixture is redacted at server/API level.
- Realtime disconnect/reconnect returns correct state.
- Typecheck, tests, build.
