# 17 — Backend and Hosting Decision Comparison

## 1. Supabase vs Firebase for this product

| Criterion | Supabase Free | Firebase Spark | VAGASPOT decision |
|---|---|---|---|
| Database model | PostgreSQL relational SQL | Firestore document database / RTDB | Supabase fits squads, memberships, invites and joins naturally. |
| Authorization | PostgreSQL RLS + SQL functions | Firebase Security Rules | Both can be secure; both require careful rule tests. |
| Real-time feed | Supabase Realtime | Firestore listeners / RTDB | Both can work for 6–10 users. |
| Server logic on no-billing plan | Edge Functions with free quota | Cloud Functions require Blaze | Supabase has a practical server-side option for a small FCM sender. |
| Authentication | Google OAuth; email sender limitations | Google/email auth; phone SMS billed | Both support Google. Supabase SMTP limitations mean Google-only MVP. |
| FCM | Use Firebase solely as push transport | Native Firebase messaging | FCM itself is no-cost; push sender must still be secure. |
| Free project lifecycle | Free project may pause after ~7 days of low activity | No equivalent Supabase-style pause for Spark project, but quotas/features are constrained | Owner accepts Supabase pause trade-off. |
| Backups | No automatic backups on Free | Firestore export/backup automation has separate constraints | Manual Supabase export and recovery plan. |
| Free quota exhaustion | Service can be paused/limited; no overage on Free | Free product quota limits/blocks; Cloud Functions unavailable on Spark | No automatic upgrade or payment method. |
| SQL portability | Strong PostgreSQL portability | Firestore vendor-specific model | Supabase preferred. |

## 2. Why not Firebase-only?

Firebase Spark has strong free products, including FCM and Authentication, but VAGASPOT would need server-side authorization and notification dispatch. Firebase Cloud Functions require the Blaze plan. Calling FCM directly from the client would expose credentials or allow spoofed notifications, so it is not acceptable. Firebase-only remains possible if push is omitted and presence updates stay in Firestore, but the relational squad/invite/visibility model is a natural fit for Supabase.

## 3. Why not both databases?

Do not store presence in Supabase and also mirror it into Firestore. Dual-write systems create inconsistent states, duplicate authorization rules, more reads/writes and more failure modes. Use one Postgres source of truth. Firebase is only the Android push transport if/when needed.

## 4. Chosen Supabase trade-off

The owner asked me to choose the best option, but has not explicitly confirmed whether manual restoration after a holiday pause is acceptable. Supabase Free can pause after low activity over about a week, and it lacks automatic backups. This is not suitable for a service that requires guaranteed always-on availability. For a 6–10 friend pilot, I recommend it only if the owner accepts occasional manual restoration; that acceptance remains an open gate in `00_DECISION_REGISTER.md`.

If “must always be available through long holidays without an owner action” becomes non-negotiable, then strict $0 and a managed uptime guarantee conflict. Do not pretend that switching to Firebase makes all operational guarantees free.

## 5. Why one shared project for future groups?

Supabase currently allows two active Free projects per account/organization. Creating one separate database/project per friend group would quickly exceed this constraint and increase maintenance. Later, host multiple squads in the same project using `squad_id`, RLS and secure RPCs. This keeps groups logically isolated, but it is not the same as each group owning an independent database/key. If true independent tenancy, data residency or user-managed backend keys become mandatory, free hosting may no longer meet the requirement.

## 6. Hosting comparison

- Cloudflare Pages: selected for static React SPA, free `pages.dev` subdomain and no backend runtime requirement.
- GitHub Pages: possible static alternative but OAuth/SPA route setup is less convenient for this use case.
- Vercel/Netlify: viable alternatives, but no reason to introduce another vendor while Cloudflare static Pages is adequate.
- Supabase Edge Functions: used only for small secure server-side tasks such as FCM send; not a general always-running server.

## 7. Location stack comparison

- Native Android GeofencingClient: selected for Release 2 because the app needs boundary transitions, not continuous location streaming.
- Community background GPS plugin: not the default. Must verify maintenance, licence, background limits and battery impact before use.
- Commercial location SDK: rejected unless explicitly licensed at $0 for the intended release build; current cost requirement forbids relying on paid licences.
- Browser Geolocation API: only for explicit one-time foreground user action; not background monitoring.
