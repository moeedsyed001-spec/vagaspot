# 00 — Product Decision Register

**Version:** 0.1  
**Decision status:** Baseline accepted by product owner on 2026-11-23, subject to validation gates below.

## 1. Accepted decisions

| ID | Topic | Decision | Reason |
|---|---|---|---|
| ADR-001 | Product | VAGASPOT (working name) | Distinctive, playful campus identity; not limited to GPS tracking. Check trademarks/domain before public release. |
| ADR-002 | Client | React + TypeScript + Vite | One lightweight codebase for web and Capacitor Android wrapper. |
| ADR-003 | Android bridge | Capacitor 8 stable line + a small custom Kotlin plugin | Android GeofencingClient is required; generic continuous tracking plugin is not the requirement. Verify current compatibility at implementation. |
| ADR-004 | Backend | One Supabase Free project | PostgreSQL, Auth, RLS, RPC and Realtime in one source of truth. |
| ADR-005 | Authentication | Google OAuth only for first MVP | Supabase default email sender is restricted; avoid paid SMTP and password-reset dependencies. |
| ADR-006 | Web hosting | Cloudflare Pages free `*.pages.dev` subdomain | Static SPA hosting without a paid domain or server. |
| ADR-007 | Distribution | Direct signed APK | Avoid Google Play Console registration fee. Users install the APK manually. |
| ADR-008 | Group model | Schema supports multiple squads; first UI focuses on one active squad | Supports later friend groups without creating a database/project per squad. |
| ADR-009 | Location MVP | Manual campus/zone check-in only | The uploaded image is not georeferenced; ship usable app before location automation. |
| ADR-010 | Location Release 2 | Optional Android native geofencing, best-effort | Lower power than continuous GPS polling; OS restrictions still apply. |
| ADR-011 | Web location | User-triggered one-time browser geolocation only | Browsers cannot be relied on to monitor entry/exit while closed. |
| ADR-012 | Presence model | Separate campus presence, availability and zone | Being on campus does not imply a person is free or at a particular building. |
| ADR-013 | Availability | Free, In Class, Busy, Looking for Friends | Four understandable options; DND is a private notification preference, not public status. |
| ADR-014 | Expiry | Availability/zone/note share one expiry: min(updated + 2h, 18:00 Asia/Karachi); reopen at 00:00 PKT; Off Campus clears them | Prevent stale manual check-ins and orphaned spots/notes while respecting end-of-day cutoff. |
| ADR-015 | Campus freshness | Separate 8-hour freshness window from latest verified check-in (does not expire at 18:00); stale becomes Unknown | Support evening campus presence; never infer Off Campus if exit event is missed. |
| ADR-016 | Ghost Mode | Per-squad; profile name/avatar stays; presence, availability, zone, source and timestamps are cleared server-side; off requires fresh check-in | User selected option C; hide server-side, not only in presentation. |
| ADR-017 | History | Keep latest presence snapshot only | No location trail or user-facing presence history. Retain only minimal security/notification dedupe metadata as needed. |
| ADR-018 | Notifications | Realtime feed is core; Android push is a later increment | Push delivery is best-effort and adds credentials/integration; do not block MVP. |
| ADR-019 | Map | No interactive map in MVP | Use map sign to define labels; do not introduce tile-hosting or map API dependency. |
| ADR-020 | Billing | No billing account, paid plans or billable APIs | If quota exhausted, app should degrade/pause, never auto-upgrade. |

## 2. Stack selection

| Layer | Selected technology | Notes |
|---|---|---|
| Language | TypeScript | Strict mode. |
| UI | React + Vite | SPA, static build. |
| Styling | Tailwind CSS + a small set of accessible reusable components | Avoid a large UI framework. shadcn/ui patterns may be copied selectively; no need to import every component. |
| Icons | lucide-react | Consistent, lightweight icon set. |
| Client routing | React Router | Protected routes and join-link route. |
| Server state | TanStack Query | Cache and invalidation; Realtime invalidates/refetches presence query. |
| Local UI state | Zustand only where needed | Do not use it as a second server cache. |
| Backend SDK | `@supabase/supabase-js` | Supabase only. |
| Native wrapper | Capacitor | Android package. |
| Native location | Custom Kotlin Capacitor plugin around Android Geofencing APIs | Release 2; no continuous background GPS plugin. |
| Push | Firebase Cloud Messaging Android transport + Supabase Edge Function sender | Release 1.1; credentials server-side. |
| Web host | Cloudflare Pages | No custom domain required. |
| Repo | Git + GitHub | Private repository allowed; protect secrets. |
| Android build | Android Studio / Gradle locally | Build signed APK locally; never commit keystore. |

## 3. Important rejected alternatives

- **Flutter as first choice:** good mobile toolkit, but team asked for web and Android; React + Capacitor shares more UI/code for this web-first use case.
- **Firebase Firestore as second database:** rejected to avoid two sources of truth and duplicated security logic.
- **Continuous background GPS plugin:** rejected; excessive location sampling, battery/privacy risk and possible commercial licence traps.
- **Six-digit guessable join code:** rejected as the default. Use high-entropy one-time invitation token or link.
- **Live map tiles in MVP:** rejected because maps do not solve the core friend-presence problem and tile-hosting availability/usage rules are not an unlimited free production API.
- **Cloud Functions:** not selected; deploying Firebase Cloud Functions requires Blaze. Supabase Edge Functions have a free allowance, but are optional for push only.
- **Supabase Cron as a core expiry dependency:** rejected; the client/feed computes expiry from timestamps. Cron may be considered later after checking current beta/plan status.

## 4. Open validation gates (must be resolved before corresponding work)

| Gate | Owner action | Blocks |
|---|---|---|
| G-01 Campus georeference | Obtain official campus GIS/KML/GeoJSON, or digitise the property boundary against an aerial map and ground-truth at several points. | Android geofencing Release 2 only. |
| G-02 Device matrix | Confirm actual Redmi model and Android version; test at least one Android device. | Geofencing reliability and APK QA. |
| G-03 Map access | Confirm which listed buildings/zones are student-accessible and names students actually use. | Final quick-zone ordering. |
| G-04 Google OAuth | Create OAuth web client, configure Supabase redirect and allowed callback/deep-link URLs; add friend accounts as testers if consent screen is in testing mode. | Auth implementation. |
| G-05 Supabase inactivity pause | Owner explicitly accepts that free project may pause after low activity for about 7 days and may require manual restore. | Backend provider acceptance. |
| G-06 Push credentials | Decide who owns the Firebase project/FCM service account and securely stores credentials. | Android push phase only. |
| G-07 Brand | Check name availability/trademark before public/commercial release. | Public branding only. |
| G-08 Web push | Not in initial scope; decide later whether browser push is needed. | No MVP blocker. |

## 5. Revisit triggers

Revisit Supabase only if free-plan pausing is unacceptable, the project exceeds quotas, or a required feature cannot be implemented safely. Revisit platform only if native geofence maintenance proves too costly. Revisit architecture before adding a public multi-group product, not during this 6–10-user MVP.
