export interface EnvConfig {
  readonly supabaseUrl: string | null;
  readonly supabaseAnonKey: string | null;
  readonly isConfigured: boolean;
  readonly issues: readonly string[];
}

const PLACEHOLDER_MARKERS = ['YOUR_PROJECT', 'YOUR_PUBLIC_ANON', 'example.com'];

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_MARKERS.some((marker) => value.includes(marker));
}

function looksLikeServiceRoleJwt(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) {
    return false;
  }
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    const parsed: unknown = JSON.parse(decoded);
    if (typeof parsed === 'object' && parsed !== null && 'role' in parsed) {
      return (parsed as { role?: unknown }).role === 'service_role';
    }
  } catch {
    return false;
  }
  return false;
}

export function validateEnv(
  rawEnv: Readonly<Record<string, string | boolean | undefined>> = import.meta.env,
): EnvConfig {
  const issues: string[] = [];

  const rawUrl = typeof rawEnv.VITE_SUPABASE_URL === 'string' ? rawEnv.VITE_SUPABASE_URL.trim() : '';
  const rawAnonKey =
    typeof rawEnv.VITE_SUPABASE_ANON_KEY === 'string' ? rawEnv.VITE_SUPABASE_ANON_KEY.trim() : '';

  let validUrl: string | null = null;
  if (!rawUrl || isPlaceholder(rawUrl)) {
    issues.push('VITE_SUPABASE_URL is not configured yet.');
  } else {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
        issues.push('VITE_SUPABASE_URL must use https:// (or localhost for local development).');
      } else {
        validUrl = rawUrl;
      }
    } catch {
      issues.push('VITE_SUPABASE_URL is not a valid URL.');
    }
  }

  let validAnonKey: string | null = null;
  if (!rawAnonKey || isPlaceholder(rawAnonKey)) {
    issues.push('VITE_SUPABASE_ANON_KEY is not configured yet.');
  } else if (looksLikeServiceRoleJwt(rawAnonKey)) {
    issues.push('Refusing VITE_SUPABASE_ANON_KEY because it appears to be a service_role secret.');
  } else {
    validAnonKey = rawAnonKey;
  }

  return {
    supabaseUrl: validUrl,
    supabaseAnonKey: validAnonKey,
    isConfigured: validUrl !== null && validAnonKey !== null && issues.length === 0,
    issues,
  };
}

export const envConfig = validateEnv();
