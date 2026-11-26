# 10 — Testing and Acceptance Plan

## 1. Test layers

1. Unit tests: pure business rules, expiry calculation, enum validation, visibility transformation, coordinate point-in-polygon utility (Release 2).
2. Component tests: check-in form, friend card, Ghost Mode rendering, empty/error states.
3. Integration tests: OAuth callback, Supabase RPCs, invite redemption, feed and Realtime update.
4. Security tests: two separate users, RLS policies, Ghost Mode direct API access, invite replay, member removal.
5. Device tests: real Android phone for OAuth/deep link, app lifecycle and later geofence behaviour.
6. Operational tests: quota/service unavailable, offline, restore paused Supabase project, signed APK install/update.

## 2. Required business-rule tests

| Test ID | Scenario | Expected result |
|---|---|---|
| T-BR-01 | User changes Free at 10:00 PKT | `availability_expires_at` is 12:00 PKT |
| T-BR-02 | User changes Free at 17:30 PKT | Expires at 18:00 PKT, not 19:30 |
| T-BR-03 | User attempts new active availability at 18:15 PKT | No active availability until next allowed check-in window; UI communicates cutoff |
| T-BR-04 | Campus state last confirmed beyond freshness cutoff | Effective state becomes Unknown, not Off Campus |
| T-BR-05 | Geofence entry event | Campus state may become On Campus; availability and zone remain unchanged |
| T-BR-06 | Ghost Mode enabled | Peer feed reveals name/avatar and hidden state only; no last timestamp or prior status/zone |
| T-BR-07 | Ghost Mode disabled | Presence returns Unknown/empty, not previous cached state |
| T-BR-08 | Manual campus override followed by no geofence event | Manual state remains until override expires |
| T-BR-09 | Invalid zone ID | Database rejects update |
| T-BR-10 | Note exceeds 60 chars | Validation error, no partial update |

## 3. Security and RLS tests (must use at least two accounts)

- User A cannot read User B's private squad if not a member.
- User A cannot read another squad's presence by guessing UUID.
- A removed member immediately loses access even with old JWT/session; test policy revalidation.
- Member cannot promote self to owner or remove another member.
- Member cannot insert presence for a different `user_id`.
- Member cannot set `source=geofence` through the manual RPC.
- Member cannot set arbitrary `expires_at` or `updated_at`.
- Owner cannot see Ghost Mode status or zone.
- Direct REST calls cannot recover previous status from Ghost Mode rows.
- A consumed/expired/revoked invitation cannot be replayed or redeemed twice.
- Raw invite token is never written to database, console, telemetry or server log.
- Frontend bundle contains no service-role or FCM private key.
- Notification function refuses a caller who is not authorized and rechecks Ghost Mode.

## 4. UX tests

- New user with no squad sees a useful create/join state.
- Feed with no active statuses explains that users need to check in.
- User can check in in 3 meaningful taps after opening check-in screen.
- Permission denied does not block manual flow.
- Offline save does not falsely say “Live”.
- Stale presence shows “Unknown” or “Last updated …”, not current status.
- Ghost Mode state is visually clear to owner without exposing hidden data to peers.
- Keyboard, screen-reader labels, focus, contrast and 200% zoom checked.

## 5. Real-device Android release checks

- Install signed APK cleanly.
- Sign in and complete OAuth callback/deep link.
- Close and reopen app; session behaves as expected.
- Reinstall/update APK without losing account.
- Test Android notification permission if FCM is enabled.
- Check network switch between Wi-Fi and mobile data.
- Check Redmi battery saver/autostart restrictions after model chosen.
- For geofence Release 2, run all cases in `08_LOCATION_AND_GEOFENCING.md` and record false positives/misses and latency.

## 6. Release definition of done

### MVP
- P0 user stories pass.
- No critical/high security issue open.
- RLS tests pass for two users.
- Availability expiry handles PKT boundary cases.
- Ghost Mode tested by direct database/API access, not just screenshot.
- Web production build and APK build succeed.
- `.env` and secrets excluded from Git.
- Owner can export database data and restore/recreate configuration from documentation.

### Geofencing Release 2
- Campus polygon approved and versioned.
- At least 20 entry/exit field trials across gates/time/device conditions (small pilot; increase if results vary).
- Track false entry/exit, missed events and latency; agree pass threshold before release.
- No automatic detection if polygon, permission or fix quality is uncertain.
- Manual fallback remains fully functional.
