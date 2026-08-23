import { createClient } from '@supabase/supabase-js';

// Un-generic client for LMS tables until the Supabase CLI regenerates types from production schema.
// It uses the same auth storage/session as the main client.
export const lmsSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { storage: localStorage, persistSession: true, autoRefreshToken: true } },
);
