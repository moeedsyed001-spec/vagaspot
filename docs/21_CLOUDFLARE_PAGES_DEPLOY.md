# 21 — Cloudflare Pages Deployment & Verification Guide

**Cost constraint:** PKR 0 — uses Cloudflare Pages Free (`*.pages.dev`), no custom domain, no paid Workers, no paid storage.

## 1. Before Connecting Cloudflare Pages

1. Ensure the latest Phase 7 commit is pushed to your private GitHub repository (`moeedsyed001-spec/vagaspot`, branch `main`).
2. Confirm `.env.local` is **not** committed to Git (`git ls-files .env.local` must return nothing).

## 2. Cloudflare Pages Dashboard Setup

1. Log in to https://dash.cloudflare.com/ → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select repository `moeedsyed001-spec/vagaspot` and production branch `main`.
3. Configure **Build settings**:
   - **Framework preset:** Vite (or None)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Under **Environment variables** (Production & Preview if used), add **only** these two public variables (copy values from `D:\VagaSpot\.env.local`):
   - `VITE_SUPABASE_URL` = `https://YOUR_PROJECT_REF.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY`
   - Never add `service_role`, Google Client Secret, FCM private keys, or signing keystores.
5. Click **Save and Deploy**. Note your assigned `https://<project>.pages.dev` URL.

## 3. Update Google OAuth & Supabase Redirect URLs

1. **Google Cloud Console → OAuth client ID:**
   - Under **Authorized JavaScript origins**, add `https://<project>.pages.dev`.
2. **Supabase Dashboard → Authentication → URL Configuration:**
   - Update **Site URL** to `https://<project>.pages.dev` (or keep `http://localhost:5173` during active local dev and ensure both URLs are in Redirect URLs).
   - Under **Redirect URLs**, ensure all three are listed:
     - `https://<project>.pages.dev/**`
     - `http://localhost:5173/**`
     - `com.vagaspot.app://auth/callback`

## 4. Post-Deploy Verification Checklist

Test in a fresh incognito browser on `https://<project>.pages.dev`:
- [ ] **HTTPS & PWA manifest:** DevTools → Application → Manifest loads `VAGASPOT` with `192x192` and `512x512` icons; Service Worker `/sw.js` registers cleanly without caching Supabase requests.
- [ ] **Google OAuth login:** Sign in completes and redirects back to `/auth/callback` → `/squad`.
- [ ] **Nested route refresh:** Navigate directly to `/check-in/zones`, `/settings/manage`, and `/join/sample` and press F5/Refresh — page renders cleanly via `public/_redirects` without a 404.
- [ ] **Invite, feed & check-in:** Two accounts can join via `https://<project>.pages.dev/join/<token>`, update check-in, see Realtime updates, and toggle Ghost Mode.
- [ ] **Offline honesty:** Toggle DevTools **Offline** — feed switches to the offline banner and never claims stale presence is live.
- [ ] **No secrets in bundle:** Verify `.env.local` and `service_role` strings are absent from `dist/` and repository history.
