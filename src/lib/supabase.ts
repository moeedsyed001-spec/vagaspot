import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { envConfig } from './env';

let cachedClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!envConfig.isConfigured || !envConfig.supabaseUrl || !envConfig.supabaseAnonKey) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = createClient<Database>(envConfig.supabaseUrl, envConfig.supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return cachedClient;
}
