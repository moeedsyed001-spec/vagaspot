# 15 — Open Items and Owner Checklist

These are not reasons to stop the MVP. They are gates for the relevant phase.

## Before implementation
- [x] Confirm VAGASPOT is the chosen working name.
- [ ] Choose one developer/owner who controls Supabase, Google OAuth, Cloudflare and signing key.
- [x] Create private GitHub repository (`vagaspot`).
- [x] Confirm the group agrees to Google sign-in and invite-link access.
- [ ] Finalize ambiguous zone labels before seeding `campus_zones` (keep student-relevant locations active; hide utility/restricted rooms).

## Before backend integration
- [ ] Create one Supabase Free project without payment method.
- [x] Owner explicitly accepts Free inactivity pausing and no automatic backups.
- [ ] Configure Google OAuth and test redirect on web.
- [x] Confirm Android application ID (`com.vagaspot.app`) and deep-link scheme (`com.vagaspot.app://auth/callback`).
- [ ] Confirm 6–10 testers can access Google OAuth during consent-screen testing.

## Before Android APK sharing
- [ ] Confirm exact Android/MIUI version on pilot device (`Redmi Note 11`) before Phase 8.
- [ ] Test OAuth callback/deep links on the physical device.
- [ ] Create and safely back up Android release keystore.
- [ ] Test clean install, upgrade APK and logout.

## Before optional geofencing Release 2
- [ ] Obtain actual coordinates or digitise campus perimeter in QGIS.
- [ ] Verify polygon against campus boundaries and gates.
- [ ] Confirm if perimeter includes roads/approach areas/parking.
- [ ] Agree geofence layout/radii and test at all gates.
- [ ] Pilot Android background location opt-in and explanatory disclosure.
- [ ] Record latency, false positives, false negatives and missed events.
- [ ] Set acceptance threshold before broad enablement.

## Before optional FCM push
- [ ] Create Firebase project for FCM only.
- [ ] Protect service account credential in Supabase Edge Function secrets.
- [ ] Test generic notification text, user preferences, Ghost Mode and duplicate handling.
