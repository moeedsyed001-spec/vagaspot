# 20 — Phase 6 Security & Privacy Audit Report

**Scope:** Ghost Mode, RLS read paths, direct PostgREST exposure, Realtime payloads, client cache hygiene, and secret boundaries.

## 1. Read-Path Audit Summary

| Surface | Protection Verified | Status |
|---|---|---|
| `public.presence` direct table access | `REVOKE ALL` from `public`, `anon`, `authenticated`; RLS enabled with zero `SELECT`/`INSERT`/`UPDATE`/`DELETE` policies. | **Protected** |
| `get_squad_feed(p_squad_id)` RPC | `SECURITY DEFINER`, `SET search_path = ''`, verifies `auth.uid()` and active membership (`is_active_squad_member`). When `ghost_mode = true`, returns `display_name`, `avatar_url`, `role`, `is_ghost = true`, and `NULL` for all 10 presence/zone/note/timestamp fields. | **Protected** |
| Owner / Admin bypass check | `get_squad_feed` applies identical Ghost Mode redaction regardless of `sm.role = 'owner'`. Owners have zero special read path. | **Protected** |
| `set_ghost_mode(p_squad_id, p_enabled)` RPC | Enabling Ghost Mode atomically nulls all 14 shareable columns in `public.presence` (enforced by DB `CHECK` constraint from `0001`). Disabling Ghost Mode resets `campus_state = 'unknown'` and keeps availability/zone/note `NULL`. | **Protected** |
| Supabase Realtime | `public.presence` is **not** in `supabase_realtime` publication. Only `public.squad_feed_signals` (`squad_id`, `last_changed_at`) is published, with `REPLICA IDENTITY DEFAULT` and member-only RLS `SELECT`. | **Protected** |
| Client cache & UI (`TanStack Query`, `MemberFeedCard`) | `GhostModeControl` updates UI only after server RPC confirmation, reverts on failure, scrubs cached fields for `auth.uid()`, and invalidates the feed query. `MemberFeedCard` renders name/avatar + `"Presence hidden"` only when `is_ghost = true`. `signOut` runs `queryClient.clear()` and `clearPendingInviteToken()`. | **Protected** |
| Bundle & Environment Secrets | `src/lib/env.ts` blocks `service_role` JWTs; `.gitignore` excludes `.env*`, keystores, and `google-services.json`. | **Protected** |

## 2. Verification Coverage

- **Unit & component tests (`vitest run`):**
  - `src/features/presence/ghostMode.test.tsx`: confirms server-confirmed toggle, client feed cache scrubbing, and failure rollback + error alert.
  - `src/features/feed/feed.test.tsx`: confirms Ghost card renders only name/avatar and `"Presence hidden"`.
- **Database SQL verification (`supabase/tests/06_ghost_privacy_test.sql`):**
  - Covers raw `presence` column clearing, peer `get_squad_feed` redaction, owner/admin non-bypass, direct `SELECT` denial (`42501`), non-member `set_ghost_mode` denial, off-toggle non-restoration, and `supabase_realtime` publication check.
