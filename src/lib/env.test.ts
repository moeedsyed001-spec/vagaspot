import { describe, expect, it } from 'vitest';
import { validateEnv } from './env';

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

describe('validateEnv', () => {
  it('flags missing or placeholder environment variables', () => {
    const result = validateEnv({
      VITE_SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY',
    });

    expect(result.isConfigured).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('rejects a service_role JWT passed as anon key', () => {
    const result = validateEnv({
      VITE_SUPABASE_URL: 'https://abcdef.supabase.co',
      VITE_SUPABASE_ANON_KEY: makeJwt({ role: 'service_role' }),
    });

    expect(result.isConfigured).toBe(false);
    expect(result.issues.some((msg) => msg.includes('service_role'))).toBe(true);
  });

  it('accepts valid https Supabase URL and anon key', () => {
    const result = validateEnv({
      VITE_SUPABASE_URL: 'https://abcdef.supabase.co',
      VITE_SUPABASE_ANON_KEY: makeJwt({ role: 'anon' }),
    });

    expect(result.isConfigured).toBe(true);
    expect(result.issues).toEqual([]);
  });
});
