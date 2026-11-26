# 01 — Product Requirements Document (PRD)

**Product:** VAGASPOT  
**Version:** 0.1  
**Status:** Baseline for MVP planning  
**Primary campus:** COMSATS University Islamabad  
**Initial group size:** 6–10 invited friends

## 1. Product summary

VAGASPOT is a private campus social-presence board. It helps a small friend group answer three different questions:

1. Is my friend on campus?
2. Where on campus did they last say they are?
3. Are they available to meet?

The product is not a person-tracking system. It uses manual check-ins in the first release and may add optional Android campus-boundary detection in a later release. It does not need continuous GPS coordinates to deliver its main value.

**Positioning:** Your people. Your campus. Your spot.

## 2. Problem statement

Friends repeatedly message one another to ask where everyone is and whether they are free. Manual status boards can become stale when people forget to update them. VAGASPOT reduces this friction through fast manual updates first, with optional automatic campus-presence detection later.

## 3. Goals

- Let an invited friend sign in and join a private squad.
- Show a live list of squad members and their shareable latest presence.
- Separate campus presence from availability and campus zone.
- Make manual status + zone updates possible in a few taps.
- Expire availability and zone data predictably.
- Give every user immediate control through Ghost Mode.
- Support web and Android from one React codebase.
- Keep infrastructure spend at PKR 0 through free tiers and no billing account.
- Keep the MVP useful when location permissions are denied or automation is unavailable.

## 4. Non-goals

- Continuous GPS tracking or a movement history.
- Automatic building-level or room-level detection.
- Timetable synchronization in MVP.
- Chat, direct messages or social networking discovery.
- Public directory of students.
- Campus navigation or turn-by-turn routing.
- User-uploaded images/storage in MVP.
- iOS app in initial delivery.
- Browser background geofencing.
- Guaranteed real-time geofence delivery or 100% uptime from free hosting.

## 5. Users and roles

### Squad member
A friend who signs in, joins by invitation, views the feed, checks in, changes availability and controls their privacy.

### Squad owner/admin
The person who creates a squad and manages invitations and membership. Admin status does not grant permission to see Ghost Mode data.

### Product owner/developer
Maintains Supabase, OAuth, Cloudflare deployment, Android signing and documentation. Should not use privileged database keys in the client.

## 6. MVP scope (Release 1)

### Included
- Google OAuth login and logout.
- Private squad creation and joining via expiring single-use invitation link/token.
- Member list and live feed.
- Public member profile name and optional avatar from Google profile (no profile photo upload).
- Campus presence value: Unknown by default; a user can manually set On Campus or Off Campus.
- Availability: Free, In Class, Busy, Looking for Friends.
- Manual zone selection from COMSATS sign-derived zone catalogue.
- Optional short location note with strict character limit (e.g. 60 characters); do not use it for exact addresses.
- Manual presence/availability update timestamps.
- Availability/zone expiry after min(2 hours, 18:00 Asia/Karachi).
- Ghost Mode; profile remains visible but all shareable presence details are suppressed.
- Responsive PWA-capable web interface.
- Supabase Realtime updates with a polling/refetch fallback.
- Basic member removal, leave squad, revoke invite and delete-account guidance.

### Deliberately deferred
- Native Android background geofencing.
- FCM push notifications (except a later small increment once server-side sending is tested).
- Browser push notifications.
- Interactive map and live pin.
- Timetable, meetup matcher, chat, campus events.

## 7. Release 2 scope — Android campus awareness

- Explicit per-user opt-in to background campus detection.
- Register native Android geofences as coarse wake-up regions.
- Use a verified campus polygon as the spatial truth after a transition; discard raw coordinates immediately after the decision.
- Update only campus presence, not availability or zone.
- Entry/exit debounce and recheck, offline retry and stale-to-Unknown behaviour.
- Settings to pause/re-enable automation and revoke permission.
- Best-effort event target of 5–10 minutes under validated conditions; never promise exact timing.

## 8. User value and success measures

For a 6–10 person pilot, success is qualitative and measurable:
- At least 6 group members can sign in and join without developer intervention after setup.
- A user can update availability/zone in no more than 3 meaningful taps after opening the feed.
- A change made on one device appears on another within 5 seconds under a healthy connection (target, not SLA).
- Expired availability/zone is never presented as current.
- Ghost Mode hides presence data from another member's session, including direct database/API attempts.
- No exact coordinates or movement path are stored.
- No paid plan, billing account or unexpected charge is needed for the pilot.
- Android auto detection is not released until field tests show acceptable false-positive/false-negative rates.

## 9. Product principles

1. **Presence is not availability.** On campus does not mean free.
2. **User control first.** Automation is opt-in; manual check-in remains available.
3. **Minimal location data.** Store state/zone, not movement trails.
4. **Privacy by construction.** Ghost Mode must redact data server-side.
5. **Honest freshness.** Show when a state was last confirmed; stale means Unknown.
6. **Manual-first resilience.** Denied permission does not break the core product.
7. **Zero-billing architecture.** No payment-enabled service or dependency.
8. **Small-group simplicity.** Avoid enterprise-scale abstractions and unnecessary features.

## 10. Platform differences

| Capability | Web | Android |
|---|---|---|
| Sign in, squad, feed | Yes | Yes |
| Manual campus/status/zone updates | Yes | Yes |
| One-time geolocation on explicit action | Supported browsers, HTTPS and permission required | Yes |
| Detect entry/exit when app is closed | No | Optional Release 2 geofencing |
| Native push | Browser-dependent; deferred | FCM in later increment |
| Offline state | Cache UI where safe; queue no sensitive stale presence by default | Same; geofence event may be queued locally |

## 11. Product risks

- Supabase Free may pause after low activity for about one week; owner must accept manual restore possibility.
- Free quotas can be exhausted; services may stop until reset.
- OAuth and FCM setup are integration tasks, not zero-effort.
- Android background events can be delayed or missed because of OS settings, battery management, force-stop, permission and connectivity.
- Uploaded campus map is not geographically calibrated.
- Push delivery and PWA/browser background behaviour differ by OS/browser.
- Free-plan policies can change; zero lifetime cost cannot be guaranteed by any vendor.

## 12. Release acceptance

Release 1 is accepted when all P0 stories in `02_USER_STORIES_AND_BUSINESS_RULES.md` pass the tests in `10_TESTING_AND_ACCEPTANCE.md`, RLS is verified with at least two user accounts, web is deployed on a free `pages.dev` address, and the Android app runs as a locally signed APK. Geofencing is not a Release 1 acceptance condition.
