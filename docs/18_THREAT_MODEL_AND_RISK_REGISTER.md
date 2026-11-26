# 18 — Lightweight Threat Model and Risk Register

This is a proportionate security checklist for a 6–10-person friend group, not a formal enterprise threat model.

## 1. Assets to protect

- Google-authenticated user accounts and session tokens.
- Squad membership and invitation secrets.
- Latest presence, availability and zone.
- Ghost Mode state and previously visible data.
- FCM registration tokens and server-side service credentials.
- Supabase project keys, OAuth secrets and Android release keystore.

## 2. Likely threats and controls

| Threat | Impact | Required control | Residual limitation |
|---|---|---|---|
| Invite token guessed/shared publicly | Stranger joins squad | 128-bit random token, hash at rest, one-use, expiry, revoke, rate-limit redemption | A member can intentionally share an invite; owner can revoke it. |
| Non-member queries another squad UUID | Presence leakage | RLS and RPC membership checks on every request | Misconfigured RLS remains a critical risk; test two accounts. |
| Owner/admin tries to view Ghost Mode | Privacy breach | Ghost data cleared server-side; role never bypasses hidden state | Cannot erase info already seen/copied before Ghost Mode. |
| Client sends fake user ID/source/time | Impersonation or false status | RPC derives auth.uid; server timestamps; source set internally; validation | A user can still manually claim their own state; app is not attendance proof. |
| User spoofs GPS/geofence | False campus state | Best-effort point-in-polygon check, coarse confidence, no enforcement use | Rooted/spoofed devices can lie; don't use for attendance/security. |
| FCM secret leaked in app | Anyone sends push | Keep service account only in Edge Function secrets | Review build artifacts and Git history. |
| Supabase anon key misunderstood as secret | Insecure client | Treat anon key as public; RLS is security boundary; never expose service_role | Incorrect RLS can leak data. |
| Stale exit event / missed callback | Friend appears On Campus incorrectly | Freshness cutoff → Unknown; entry/exit recheck; last-confirmed timestamp | Event can be delayed; show best-effort status. |
| Aggressive polling exhausts quotas | Temporary outage | Realtime scoped to active squad; polling only fallback and visible page; no GPS heartbeat | Free quotas may change/exhaust. |
| Lost APK keystore | Cannot update installed package | Two secure offline backups; never commit or upload to AI | If lost, new package identity/install may be needed. |
| Supabase Free project pauses | App unavailable | Owner alert/restore process; export backup; accept pause in pilot | No guaranteed uptime on Free. |
| Cached hidden state remains on peer device | Ghost transition might show stale card | Invalidate cache and refetch; short-lived memory cache; no local persistent presence cache | Other person may remember/screenshot prior state; cannot revoke human knowledge. |

## 3. Minimal abuse controls

- Invitation redemption: max failed attempts per authenticated account/time window; rotate/revoke token.
- Squad creation: simple owner-only and reasonable per-account cap.
- Presence writes: only member can update own row, with database validation; do not allow arbitrary rapid writes if not needed.
- Push: authenticated function, member/recipient filtering, dedupe and per-user preferences.
- Notes: max 60 characters; plain text only; escape on render.
- Admin tools: owner only; no hidden-presence access.

## 4. Operational risk priorities

P0 before release: RLS, Ghost Mode redaction, invitation security, secret handling, account removal, no billing account.  
P1 before geofencing: polygon accuracy, Android permission disclosure, Xiaomi/Redmi background behaviour, spoofing limitations and false transition tests.  
P2 before wider group distribution: privacy notice/legal review, group separation, moderation/reporting and restore/runbook.

## 5. Red-team checklist

Try these manually using a second/non-member account:
- Modify URL squad ID and call every feed/RPC endpoint.
- Redeem the same invite twice and concurrently.
- Update another user's presence by changing payload `user_id`.
- Change role in a direct REST request.
- Enable Ghost Mode then inspect table, RPC response, Realtime event and cached UI.
- Revoke member and continue with old browser session.
- Search browser bundle, source maps and APK for secrets.
- Trigger notifications while Ghost Mode is on and while preferences are off.
