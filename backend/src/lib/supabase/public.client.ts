import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getValidatedEnv } from '../../config/env.schema';

export function createSupabasePublicClient(): SupabaseClient {
  const env = getValidatedEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

