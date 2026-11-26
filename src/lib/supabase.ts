import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { envConfig } from './env';

let cachedClient: SupabaseClient | null = null;

/**
 * Phase 1 placeholder client factory.
 * Returns null until Supabase is configured and wired in Phase 2.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!envConfig.isConfigured || !envConfig.supabaseUrl || !envConfig.supabaseAnonKey) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = createClient(envConfig.supabaseUrl, envConfig.supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return cachedClient;
}
