import { createClient } from '@supabase/supabase-js';

// ==============================================================================
// SUPABASE CLIENT & REAL-TIME DATABASE CONFIGURATION LAYER
// ==============================================================================

export interface SupabaseConfig {
  url: string;
  key: string;
  schema: string;
}

export const NEW_SUPABASE_URL = 'https://wvonwulrshllpcngveaw.supabase.co';
export const NEW_SUPABASE_ANON_KEY = 'sb_publishable_Gi8d1TN9ECPI84apyy6U6w_m8lDBP9B';

function normalizeSupabaseUrl(url: string): string {
  if (!url) return NEW_SUPABASE_URL;
  let cleaned = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  if (cleaned.includes('cpiazhhkkzwbcjsuhapr') || !cleaned.includes('wvonwulrshllpcngveaw')) {
    cleaned = NEW_SUPABASE_URL;
  }
  return cleaned;
}

export function getSupabaseConfig(): SupabaseConfig {
  if (typeof window !== 'undefined') {
    const storedUrl = localStorage.getItem('VITE_SUPABASE_URL');
    if (storedUrl && (storedUrl.includes('cpiazhhkkzwbcjsuhapr') || !storedUrl.includes('wvonwulrshllpcngveaw'))) {
      localStorage.removeItem('VITE_SUPABASE_URL');
      localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
      localStorage.removeItem('jhcsc_form1_persistent_cache_v2');
      localStorage.removeItem('jhcsc_form1_persistent_cache');
      localStorage.removeItem('jhcsc_form1_cache');
      localStorage.removeItem('jhcsc_form1_last_synced_v2');
      sessionStorage.removeItem('jhcsc_form1_cache');
    }
  }

  const envUrl = import.meta.env.VITE_SUPABASE_URL || NEW_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || NEW_SUPABASE_ANON_KEY;
  const envSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'public';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('VITE_SUPABASE_URL') : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('VITE_SUPABASE_ANON_KEY') : null;
  const storedSchema = typeof window !== 'undefined' ? localStorage.getItem('VITE_SUPABASE_SCHEMA') : null;

  const rawChosenUrl = (storedUrl !== null ? storedUrl : envUrl).trim();
  const rawChosenKey = (storedKey !== null ? storedKey : envKey).trim();

  return {
    url: normalizeSupabaseUrl(rawChosenUrl),
    key: rawChosenKey || NEW_SUPABASE_ANON_KEY,
    schema: (storedSchema !== null ? storedSchema : envSchema).trim() || 'public',
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  if (typeof window !== 'undefined') {
    const cleanUrl = normalizeSupabaseUrl(config.url);
    localStorage.setItem('VITE_SUPABASE_URL', cleanUrl);
    localStorage.setItem('VITE_SUPABASE_ANON_KEY', config.key.trim());
    localStorage.setItem('VITE_SUPABASE_SCHEMA', config.schema.trim() || 'public');
    localStorage.removeItem('jhcsc_form1_persistent_cache_v2');
    localStorage.removeItem('jhcsc_form1_last_synced_v2');
    sessionStorage.removeItem('jhcsc_form1_cache');
    cachedClients = {};
  }
}

export function clearSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('VITE_SUPABASE_URL');
    localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
    localStorage.removeItem('VITE_SUPABASE_SCHEMA');
    localStorage.removeItem('jhcsc_form1_persistent_cache_v2');
    localStorage.removeItem('jhcsc_form1_last_synced_v2');
    sessionStorage.removeItem('jhcsc_form1_cache');
    cachedClients = {};
  }
}

let cachedClients: Record<string, any> = {};

export function getSupabaseClient(customSchema?: string): any {
  const targetSchema = customSchema || 'public';
  const cacheKey = `${NEW_SUPABASE_URL}_${targetSchema}`;

  if (cachedClients[cacheKey]) {
    return cachedClients[cacheKey];
  }

  try {
    const client = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_ANON_KEY, {
      db: {
        schema: targetSchema,
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          apikey: NEW_SUPABASE_ANON_KEY,
          Accept: 'application/json',
        },
      },
    });
    cachedClients[cacheKey] = client;
    return client;
  } catch (err) {
    console.warn(`Failed to initialize Supabase client for schema ${targetSchema}:`, err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.key);
}

export interface ApiResponse<T> {
  data: T;
  error: string | null;
  source: 'supabase';
}

async function fetchTableFromSupabase<T>(tableName: string): Promise<ApiResponse<T>> {
  const config = getSupabaseConfig();
  const client = getSupabaseClient(config.schema);

  if (!client) {
    return {
      data: [] as unknown as T,
      error: 'Supabase client could not be initialized.',
      source: 'supabase',
    };
  }

  try {
    const { data, error } = await client.from(tableName).select('*');
    if (error) {
      return {
        data: [] as unknown as T,
        error: error.message,
        source: 'supabase',
      };
    }
    return {
      data: (data || []) as unknown as T,
      error: null,
      source: 'supabase',
    };
  } catch (err: any) {
    return {
      data: [] as unknown as T,
      error: err?.message || `Failed to query Supabase table '${tableName}'.`,
      source: 'supabase',
    };
  }
}

export async function getForm7ResearchLinkages(): Promise<ApiResponse<any[]>> {
  return fetchTableFromSupabase<any[]>('form7');
}
