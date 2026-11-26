import { describe, expect, it } from 'vitest';
import {
  ANDROID_OAUTH_CALLBACK_URL,
  getWebOAuthCallbackUrl,
  readOAuthErrorFromUrl,
  sanitizeReturnPath,
} from './authRedirect';

describe('authRedirect helpers', () => {
  it('builds web callback URL and preserves locked Android callback constant', () => {
    expect(getWebOAuthCallbackUrl('https://vagaspot.pages.dev/')).toBe(
      'https://vagaspot.pages.dev/auth/callback',
    );
    expect(ANDROID_OAUTH_CALLBACK_URL).toBe('com.vagaspot.app://auth/callback');
  });

  it('sanitizes return paths against open redirects', () => {
    expect(sanitizeReturnPath('/check-in')).toBe('/check-in');
    expect(sanitizeReturnPath('https://evil.example')).toBe('/squad');
    expect(sanitizeReturnPath('//evil.example')).toBe('/squad');
    expect(sanitizeReturnPath('/auth/callback')).toBe('/squad');
    expect(sanitizeReturnPath(undefined)).toBe('/squad');
  });

  it('extracts user-friendly OAuth cancellation and error messages', () => {
    expect(readOAuthErrorFromUrl('?error=access_denied', '')).toContain('cancelled');
    expect(readOAuthErrorFromUrl('', '#error=server_error&error_description=Bad+request')).toBe(
      'Bad request',
    );
    expect(readOAuthErrorFromUrl('?code=abc', '')).toBeNull();
  });
});
