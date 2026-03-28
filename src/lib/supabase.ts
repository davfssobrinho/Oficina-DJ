import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-url.supabase.co' &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('http')
);

if (!isSupabaseConfigured) {
  console.warn('Supabase configuration is missing or invalid. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}

// Ensure we always pass a valid-looking URL to createClient to avoid immediate crash,
// even if it's just a placeholder. The App.tsx will handle the non-configured state.
const validUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co';
const validKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(validUrl, validKey);
