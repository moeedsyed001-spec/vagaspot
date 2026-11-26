/**
 * OAuth redirect helpers for Phase 2 (Web) and Phase 8 (Android deep-link note).
 *
 * Web:
 *   Uses `${window.location.origin}/auth/callback`.
 *   Ensure both `http://localhost:5173/**` and production `https://<project>.pages.dev/**`
 *   are registered in Supabase Authentication -> URL Configuration -> Redirect URLs.
 *
 * Android (Phase 8 — NOT implemented yet):
 *   Locked deep-link callback: `com.vagaspot.app://auth/callback`
 *   In Phase 8, Capacitor will open Google OAuth via `@capacitor/browser` (system Chrome Custom Tabs)
 *   and listen for `@capacitor/app` `appUrlOpen` to forward the `code` URL to
 *   `supabase.auth.exchangeCodeForSession(...)` using PKCE.
 */
export const ANDROID_OAUTH_CALLBACK_URL = 'com.vagaspot.app://auth/callback';

export function getWebOAuthCallbackUrl(origin: string = window.location.origin): string {
  return `${origin.replace(/\/+$/, '')}/auth/callback`;
}

export function sanitizeReturnPath(candidate: unknown, fallback = '/squad'): string {
  if (typeof candidate !== 'string') {
    return fallback;
  }
  const trimmed = candidate.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }
  if (trimmed.startsWith('/auth')) {
    return fallback;
  }
  return trimmed;
}

export function readOAuthErrorFromUrl(search: string, hash: string): string | null {
  const searchParams = new URLSearchParams(search);
  const hashClean = hash.startsWith('#') ? hash.slice(1) : hash;
  const hashParams = new URLSearchParams(hashClean);

  const errorCode = searchParams.get('error') ?? hashParams.get('error');
  const errorDesc =
    searchParams.get('error_description') ?? hashParams.get('error_description');

  if (!errorCode && !errorDesc) {
    return null;
  }
  if (errorCode === 'access_denied') {
    return 'Google sign-in was cancelled. You can try again whenever you are ready.';
  }
  if (errorDesc) {
    return errorDesc.replace(/\+/g, ' ');
  }
  return 'Google sign-in could not be completed. Please try again.';
}
