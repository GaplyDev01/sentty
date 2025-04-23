import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Get Supabase URL and key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase credentials are configured
export const isSupabaseConfigured = () => {
  return (
    supabaseUrl && 
    supabaseKey && 
    supabaseUrl.length > 0 && 
    supabaseKey.length > 0 && 
    !supabaseUrl.includes('your-project-url') &&
    !supabaseKey.includes('your-anon-key')
  );
};

// Create a dummy client to prevent app crashes when credentials are missing
const createDummyClient = () => {
  console.warn(
    'Supabase credentials are missing or invalid. Please connect to Supabase via the "Connect to Supabase" button.'
  );
  
  // Return a minimal mock client that won't crash the app
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: () => Promise.resolve({ error: null })
    },
    from: () => ({
      select: () => ({ data: null, error: { message: 'Supabase not configured' } })
    })
  } as any;
};

// Initialize the Supabase client
export const supabase = isSupabaseConfigured()
  ? createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : createDummyClient();