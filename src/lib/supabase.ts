import { createClient } from '@supabase/supabase-js';

function normalizeUrl(url: string): string {
  if (!url) return 'https://wvonwulrshllpcngveaw.supabase.co';
  let cleaned = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  if (cleaned.includes('cpiazhhkkzwbcjsuhapr') || !cleaned.includes('wvonwulrshllpcngveaw')) {
    cleaned = 'https://wvonwulrshllpcngveaw.supabase.co';
  }
  return cleaned;
}

const rawUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (typeof window !== 'undefined' ? localStorage.getItem('VITE_SUPABASE_URL') : null) ||
  'https://wvonwulrshllpcngveaw.supabase.co';

const rawAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (typeof window !== 'undefined' ? localStorage.getItem('VITE_SUPABASE_ANON_KEY') : null) ||
  'sb_publishable_Gi8d1TN9ECPI84apyy6U6w_m8lDBP9B';

// Clear old cpiazhhkkzwbcjsuhapr from localStorage if present
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('VITE_SUPABASE_URL');
  if (stored && (stored.includes('cpiazhhkkzwbcjsuhapr') || !stored.includes('wvonwulrshllpcngveaw'))) {
    localStorage.removeItem('VITE_SUPABASE_URL');
    localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
  }
}

const cleanUrl = normalizeUrl(rawUrl);

const NEW_URL = 'https://wvonwulrshllpcngveaw.supabase.co';
const NEW_KEY = 'sb_publishable_Gi8d1TN9ECPI84apyy6U6w_m8lDBP9B';

export const isSupabaseConfigured = true;

export const supabase = createClient(
  NEW_URL,
  NEW_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        'apikey': NEW_KEY,
        'Accept': 'application/json'
      }
    }
  }
);
