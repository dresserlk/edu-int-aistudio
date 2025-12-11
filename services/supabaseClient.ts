import { createClient } from '@supabase/supabase-js';

// Access environment variables injected by Vite's `define` config.
// We use process.env here because we mapped it in vite.config.ts.
// Vite replaces these expressions with the actual string values at build time.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase URL or Key. Please check your Environment Variables in Cloudflare or .env file.");
}

// Create the client with the keys (or fallback to empty strings to prevent immediate crash, though calls will fail)
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');