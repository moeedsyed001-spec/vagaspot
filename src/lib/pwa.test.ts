import { describe, expect, it } from 'vitest';
import { isSameOriginStaticAsset } from './pwa';

describe('PWA service worker cache boundary', () => {
  const origin = 'https://vagaspot.pages.dev';

  it('allows caching same-origin static shell assets only', () => {
    expect(isSameOriginStaticAsset('https://vagaspot.pages.dev/assets/index-123.js', origin)).toBe(
      true,
    );
    expect(isSameOriginStaticAsset('https://vagaspot.pages.dev/icons/icon-192.png', origin)).toBe(
      true,
    );
    expect(isSameOriginStaticAsset('https://vagaspot.pages.dev/manifest.webmanifest', origin)).toBe(
      true,
    );
  });

  it('never caches Supabase API, Auth, Realtime, or sw.js itself', () => {
    expect(
      isSameOriginStaticAsset('https://xyz.supabase.co/rest/v1/rpc/get_squad_feed', origin),
    ).toBe(false);
    expect(isSameOriginStaticAsset('https://xyz.supabase.co/auth/v1/token', origin)).toBe(false);
    expect(isSameOriginStaticAsset('https://vagaspot.pages.dev/sw.js', origin)).toBe(false);
  });
});
