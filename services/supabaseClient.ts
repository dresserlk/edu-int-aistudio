import { createClient } from '@supabase/supabase-js';

// These should be set in your Cloudflare Pages / Vercel Environment Variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing! The app will not function correctly.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
