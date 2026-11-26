import { Capacitor } from '@capacitor/core';

export function isSameOriginStaticAsset(requestUrl: string, appOrigin: string): boolean {
  try {
    const parsed = new URL(requestUrl);
    if (parsed.origin !== appOrigin) {
      return false;
    }
    if (parsed.pathname === '/sw.js') {
      return false;
    }
    return (
      parsed.pathname.startsWith('/assets/') ||
      parsed.pathname.startsWith('/icons/') ||
      parsed.pathname === '/manifest.webmanifest'
    );
  } catch {
    return false;
  }
}

export function registerPwaServiceWorker(): void {
  if (!import.meta.env.PROD) {
    return;
  }
  if (Capacitor.isNativePlatform()) {
    return;
  }
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration is progressive enhancement; never block app startup.
    });
  });
}
