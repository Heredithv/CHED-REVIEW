import { createClient } from '@supabase/supabase-js';

// Support both Vite standard (VITE_) and Next.js style (NEXT_PUBLIC_) environment variables
const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  '';

const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://cpiazhhkkzwbcjsuhapr.supabase.co',
  supabaseAnonKey || 'sb_publishable_9kz5P-L4PhYlc7-il39bug_JaEWl74-'
);
