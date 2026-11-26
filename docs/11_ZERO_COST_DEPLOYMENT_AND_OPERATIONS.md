# 11 — Zero-Cost Deployment and Operations Guide

**Cost policy:** PKR 0. No paid tier, no billing account, no paid API, no paid domain, no Play Store registration and no paid package licence.

## 1. What “free forever” can and cannot mean

No third-party provider can guarantee that a free plan will exist forever or retain the same limits. VAGASPOT can enforce a **no-spend policy** by never linking a payment method or enabling a billing plan. When a provider changes a free tier or reaches a quota, the app may pause/degrade until the owner restores service or changes provider. This protects against surprise charges but does not guarantee uninterrupted operation.

For Supabase specifically, Free projects may pause after about a week of low database activity. Supabase says a few real requests a day often help avoid pausing but does not guarantee that. If the group is inactive over holidays, manual restoration may be needed. The owner explicitly accepts this trade-off.

## 2. Accounts and services needed

| Purpose | Account/tool | Free approach | Avoid |
|---|---|---|---|
| Source control | GitHub | Free private repository | Commit secrets or keystore |
| Code editor | VS Code | Free | Paid extension required for build |
| AI coding | Google Antigravity Individual or another free AI tier | Current free plan has basic weekly rate limits; keep prompts/task context small | Assuming unlimited free agent work |
| Backend | Supabase | One Free project; monitor quota and pause | Pro upgrade, paid add-ons, billing method |
| Web hosting | Cloudflare Pages | Static SPA on `*.pages.dev` | Custom domain/paid Workers |
| OAuth | Google Cloud OAuth client | Basic profile/email scopes; testing users | Paid Google APIs or sensitive scopes |
| Android | Android Studio + SDK | Local builds | Play Store developer account |
| Push (later) | Firebase project for FCM only | No-cost FCM transport; no Firestore/Functions | Firebase Blaze Functions or paid services |
| Maps/GIS (later) | QGIS + public/official boundary source | Open-source GIS software | Paid geocoding/tile API |

## 3. Supabase setup checklist

1. Create Supabase account and one Free project in a suitable nearby region; choose a database password and store it in a password manager.
2. Do not add a card or upgrade organization/project.
3. Copy Project URL and public anon/publishable key into local `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Never copy `service_role` key into a `VITE_` variable or client-side file.
5. Configure Google provider in Supabase Auth and Google Cloud OAuth.
6. Set exact allowed redirect URLs for local web, Cloudflare Pages and Android deep link.
7. Apply reviewed migrations in order using Supabase SQL Editor or Supabase CLI.
8. Enable RLS on every exposed table and test using two real accounts.
9. Set Realtime publication only for required tables after policies are complete.
10. Set usage reminders/monitor dashboard. Free log retention is limited; do not rely on logs as an audit archive.
11. Create an encrypted manual database export before schema changes and at least monthly during pilot.

Supabase Free currently publishes 500 MB database, 5 GB egress, 5 GB cached egress, 2 million Realtime messages, 200 peak Realtime connections and 500,000 Edge Function invocations. Check official pricing at every major release; limits can change. Free plan has no automatic backups. Store a secure export outside the public repository.

## 4. Google OAuth setup

1. Create/select Google Cloud project.
2. Configure OAuth consent screen with only basic identity scopes (`openid`, `email`, `profile`).
3. If app remains in Testing mode, add each of the 6–10 group members as test users.
4. Create OAuth Web client ID.
5. Add Supabase callback URL to Authorized redirect URIs.
6. Add VAGASPOT web origins and allowed redirect URLs to Supabase.
7. Configure the Capacitor Android deep link/return URL and test on a physical phone.
8. Store OAuth client secret only in Supabase/provider configuration; never in frontend.
9. If Google provider verification/testing changes, follow current provider console instructions; do not add unneeded scopes.

Use Google-only auth for MVP. Supabase's default SMTP sender is restricted for normal public email delivery. Do not claim email/password confirmation/reset is production-ready without a separate no-cost SMTP provider that has been verified; avoid adding one now.

## 5. Cloudflare Pages deployment

1. Push repo to GitHub.
2. In Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Select repository and production branch.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Pages environment variables.
7. Set OAuth redirect URLs to deployed `https://<project>.pages.dev/...` address.
8. Deploy; test SPA deep links and auth callback.
9. Keep a `public/_redirects` or equivalent SPA fallback only if required by the selected Pages routing setup; verify actual route refresh.
10. No custom domain required.

Static asset requests on Pages are currently free/unlimited under the documented model; builds have a monthly quota and should not be triggered needlessly. Check Cloudflare Pages limits at deployment time. Build only on meaningful pushes or use manual deploy.

## 6. Android APK build and sharing

1. Install Android Studio, Android SDK and a compatible JDK.
2. Build web app: `npm run build`.
3. Sync Capacitor: `npx cap sync android`.
4. Open Android project: `npx cap open android`.
5. Set application ID (e.g. `com.vagaspot.app`) once; do not change after distribution unless migrating package.
6. Configure deep links, app icon, name and permissions.
7. Build debug APK for pilot test.
8. Create a release signing keystore locally; back up securely in at least two private places.
9. Build signed release APK with Android Studio or Gradle.
10. Share APK file privately. Tell friends how to verify source and install. Future updates must use the same signing key.

Do not commit `.jks`, signing passwords, Google client secret or service-account JSON. Do not store signing key in cloud AI chat. Direct APK distribution avoids the one-time Play Console registration fee but users must sideload/update manually.

## 7. FCM push setup (Release 1.1)

1. Create Firebase project solely for Android app registration/FCM.
2. Add Android package ID; download `google-services.json` into Android app module (it is client config, but review contents; no server private key belongs there).
3. Configure FCM SDK and ask permission on Android versions that require it.
4. Create service account credential for server-side FCM HTTP v1 sender; protect it as Supabase Edge Function secret.
5. Deploy `send-presence-push` only on Supabase Free quota; verify secret handling and auth checks.
6. Register/delete device tokens through authenticated RPCs.
7. Test disabled preferences, Ghost Mode, duplicate events and invalid tokens.
8. If function/FCM is unavailable, feed Realtime still works.

## 8. No-cost safeguards

- Do not attach a payment method to Supabase or Firebase.
- Do not upgrade to paid plans.
- Do not enable Google Maps, Mapbox, paid geocoding or paid tiles.
- Do not use a commercial background-geolocation SDK that requires a licence.
- No SMS authentication.
- No Firebase Cloud Functions.
- No custom domain purchase.
- No paid email provider.
- Avoid file uploads and storage unless a free-plan need is confirmed.
- Monitor quota; no aggressive polling or heartbeat writes.
- Keep Realtime subscription scoped to the active squad.
- If over free quota, reduce usage or wait for reset; do not auto-upgrade.

## 9. Operational routine

Monthly (or before significant change):
- Export database schema/data securely.
- Check Supabase pause/usage/egress/Realtime/Edge Function metrics.
- Review OAuth and FCM settings.
- Confirm APK keystore backup exists.
- Test one invite and one two-device status update.
- Review RLS and membership changes.
- Re-check vendor free plan terms.

## 10. Recovery

If Supabase pauses: owner restores it in dashboard; if restore is unavailable, consult current vendor docs and restore from secure export to a new Free project only if project allowance permits. Update Pages/Android environment only after schema and policies are recreated and security tested.

If Cloudflare Pages is unavailable: app backend is unchanged; use local build for temporary testing, but do not configure paid fallback.

If FCM stops: disable push feature and keep Realtime feed. Do not make push essential to check-in.

If a signing keystore is lost: the same Android package cannot be updated with the old identity; protect the keystore carefully. A new package/installation may be required.
