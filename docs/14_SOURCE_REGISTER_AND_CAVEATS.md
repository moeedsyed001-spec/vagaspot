# 14 — Source Register, Current Free Limits and Technical Caveats

**Checked:** 2026-11-23. Vendor prices, quotas, SDK support and policies change. Recheck these pages before every release. The product owner supplied the campus sign photo; the vendor facts below are external research.

## 1. Supabase

- Pricing/free limits: https://supabase.com/pricing — current published Free figures include 500 MB database, 5 GB egress, 5 GB cached egress, 2 million Realtime messages/month, 200 peak connections, 500,000 Edge Function invocations and 1 GB storage. <Cite refs={["turn485877search4","turn485877search5","turn485877search7"]}/>
- Free project pausing: https://supabase.com/docs/guides/platform/free-project-pausing — low activity over a 7-day period can pause Free projects; several requests a day may help but is not a guarantee. <Cite refs={["turn485877search0","turn485877search1","turn485877search13"]}/>
- Free project count: https://supabase.com/docs/guides/platform/billing-faq — current published limit is two active Free projects. <Cite refs={["turn485877search12","turn485877search7"]}/>
- Edge Functions quota: https://supabase.com/docs/guides/functions/pricing — Free quota currently 500k invocations; beyond-free overage is not available on Free plan. <Cite refs={["turn485877search8","turn485877search11"]}/>
- Important limitation: Free does not include automatic backups; export data manually and store safely. <Cite refs={["turn485877search4"]}/>
- Default email sender: https://supabase.com/docs/guides/auth/auth-smtp — current default service sends only to organization team-authorized addresses and is limited to 2 emails/hour; password reset, magic links and email OTPs need custom SMTP for ordinary users. This is why MVP starts with Google OAuth. <Cite refs={["turn889828search0","turn889828search8"]}/>

## 2. Android Geofencing

- Official guide: https://developer.android.com/develop/sensors-and-location/location/geofencing — geofences are circular, up to 100 active geofences per app/device user; supports enter/exit/dwell and expiry. <Cite refs={["turn485877search6"]}/>
- Android background location permission: https://developer.android.com/develop/sensors-and-location/location/permissions/background — on Android 11+, “Allow all the time” is granted through Settings, with an educational explanation and a way to decline; the app must continue to work without it. <Cite refs={["turn889828search1","turn889828search3","turn889828search6"]}/>
- Background limitations and latency vary by Android version/OEM/power settings. A 5–10 minute target is a pilot target, not a vendor guarantee.

## 3. Capacitor

- Official docs: https://capacitorjs.com/docs/android — Capacitor 8 documents the native Android runtime and Java/Kotlin bridge, with Android Studio as the Android project environment. Use current stable major at implementation and verify compatibility. <Cite refs={["turn889828search2"]}/>
- Do not assume a generic continuous background location plugin is free for all production builds or equivalent to GeofencingClient. Inspect its licence, maintenance, Android support and release-build terms before any adoption.

## 4. Cloudflare Pages

- Pages limits: https://developers.cloudflare.com/pages/platform/limits/ — the current Free plan lists a monthly build limit (500 builds/month in the checked documentation). Static asset requests are documented as free; avoid Workers/functions unless their separate free allowance is checked. <Cite refs={["turn889828search4","turn636826search11"]}/>

## 5. Firebase Cloud Messaging

- FCM pricing: https://firebase.google.com/products/cloud-messaging/ and https://firebase.google.com/pricing — Firebase lists Cloud Messaging as no-cost, including on Spark. This does not make all other Firebase services free. The app uses FCM only for Android push, not Firestore or Cloud Functions. <Cite refs={["turn839363search0","turn839363search1","turn839363search3"]}/>
- Use HTTP v1 from a server-side Edge Function with service-account credentials stored as secrets; never put private key in Android or web code.

## 6. Google Antigravity and coding tools

- Current individual Antigravity plan: https://antigravity.google/pricing — listed at $0/month with basic weekly rate limits; quotas are not unlimited and may change. <Cite refs={["turn485877search2","turn485877search3"]}/>
- VS Code: https://code.visualstudio.com/ — free editor.
- Gemini Code Assist old free plan/tutorials may be stale; verify current offering rather than relying on older guides.

## 7. Android distribution

- Google Play Console registration fee is avoided by direct APK sharing. Do not publish to Play Store in this zero-cost pilot. Check current official Play registration fees if the decision changes.

## 8. Open facts / no unsupported claims

- Campus photo is not georeferenced; no coordinates or perimeter polygon have been derived from it.
- No claim is made that geofencing will always update within 5–10 minutes.
- No claim is made that free tiers will remain unchanged forever or that free services provide an uptime SLA.
- No claim is made that every Redmi model handles geofences identically; target device testing is required.
- VAGASPOT name is a working suggestion; trademark, company name and domain availability are not checked.
