import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  CAMPUSES,
  INSTITUTIONAL_FORMS,
  INSTITUTIONAL_SUMMARY,
  CMO_REQUIREMENTS,
  FORM4_RESEARCH_EXPENDITURES,
  FORM4_RESEARCH_FUNDING,
  EVIDENCE_LINKS,
  ANNUAL_EXPENDITURE_TREND,
  ACADEMIC_PROGRAMS,
  FORM3_PUBLICATIONS,
  FORM3_PATENTS,
  FORM3_ANNUAL_TREND,
  FORM1_OFFERINGS_LIST,
  FORM2_FACULTY_DISTRIBUTION,
  FORM5_RESOURCES,
  FORM6_SUPPORT,
  FORM7_LINKAGES,
  FORM8_OUTREACH,
  Campus,
  InstitutionalFormSummary,
  CMORequirement,
  Form4Expenditure,
  Form4FundingGrant,
  EvidenceLink,
  AcademicProgram,
  Form3Publication,
  Form3Patent,
  Form3AnnualTrend,
  Form1OfferingItem,
  Form2FacultySummary,
  Form5ResourceItem,
  Form6SupportItem,
  Form7Linkage,
  Form8Outreach
} from './mockData';

// ==============================================================================
// ==============================================================================
// SUPABASE CLIENT & CONFIGURATION LAYER
// ==============================================================================

export interface SupabaseConfig {
  url: string;
  key: string;
  schema: string;
}

function normalizeSupabaseUrl(url: string): string {
  if (!url) return NEW_SUPABASE_URL;
  let cleaned = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  if (cleaned.includes('cpiazhhkkzwbcjsuhapr') || !cleaned.includes('wvonwulrshllpcngveaw')) {
    cleaned = NEW_SUPABASE_URL;
  }
  return cleaned;
}

export const NEW_SUPABASE_URL = 'https://wvonwulrshllpcngveaw.supabase.co';
export const NEW_SUPABASE_ANON_KEY = 'sb_publishable_Gi8d1TN9ECPI84apyy6U6w_m8lDBP9B';

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
    // Invalidate client cache and cached form data
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
          'apikey': NEW_SUPABASE_ANON_KEY,
          'Accept': 'application/json'
        }
      }
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
  source: 'supabase' | 'mock';
  dataAsOf: string;
}

// ------------------------------------------------------------------------------
// Generic SELECT helper with automatic schema fallback ('ched_public' -> 'public' -> mock)
// ------------------------------------------------------------------------------
async function fetchView<T>(viewName: string, mockFallback: T): Promise<ApiResponse<T>> {
  const config = getSupabaseConfig();

  if (config.url && config.key) {
    // 1. Primary schema try
    const primaryClient = getSupabaseClient(config.schema);
    if (primaryClient) {
      try {
        const { data, error } = await primaryClient.from(viewName).select('*');
        if (!error && data && data.length > 0) {
          return {
            data: data as unknown as T,
            error: null,
            source: 'supabase',
            dataAsOf: INSTITUTIONAL_SUMMARY.data_as_of,
          };
        }
      } catch (err) {
        console.warn(`Query on primary schema '${config.schema}.${viewName}' failed:`, err);
      }
    }

    // 2. Secondary fallback schema try if primary was not 'public'
    if (config.schema !== 'public') {
      const publicClient = getSupabaseClient('public');
      if (publicClient) {
        try {
          const { data, error } = await publicClient.from(viewName).select('*');
          if (!error && data && data.length > 0) {
            return {
              data: data as unknown as T,
              error: null,
              source: 'supabase',
              dataAsOf: INSTITUTIONAL_SUMMARY.data_as_of,
            };
          }
        } catch (err) {
          console.warn(`Query on fallback schema 'public.${viewName}' failed:`, err);
        }
      }
    }
  }

  // 3. Fallback to comprehensive mock dataset
  return {
    data: mockFallback,
    error: null,
    source: 'mock',
    dataAsOf: INSTITUTIONAL_SUMMARY.data_as_of,
  };
}

export async function testSupabaseConnection(
  url: string,
  key: string,
  schema: string = 'public'
): Promise<{ success: boolean; message: string; tablesFound: string[] }> {
  if (!url || !key) {
    return { success: false, message: 'Please enter both Supabase URL and Anon Key.', tablesFound: [] };
  }

  try {
    const cleanUrl = normalizeSupabaseUrl(url);
    const client = createClient(cleanUrl, key, {
      db: { schema: schema || 'public' },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const knownTables = ['form1', 'form2', 'form3', 'form4_summary', 'form4_detailed', 'form5', 'form6', 'form7', 'form8', 'campuses', 'programs', 'institutional_forms', 'form1_program_offerings', 'form2_faculty_profiles'];
    const tablesFound: string[] = [];

    for (const table of knownTables) {
      const { data, error } = await client.from(table).select('*').limit(1);
      if (!error && data) {
        tablesFound.push(table);
      }
    }

    if (tablesFound.length > 0) {
      return {
        success: true,
        message: `Successfully connected! Found ${tablesFound.length} matching table(s) in schema '${schema}': ${tablesFound.join(', ')}.`,
        tablesFound,
      };
    } else {
      // Try public schema if custom schema returned 0 tables
      if (schema !== 'public') {
        const publicClient = createClient(cleanUrl, key, {
          db: { schema: 'public' },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const publicTablesFound: string[] = [];
        for (const table of knownTables) {
          const { data, error } = await publicClient.from(table).select('*').limit(1);
          if (!error && data) {
            publicTablesFound.push(table);
          }
        }
        if (publicTablesFound.length > 0) {
          return {
            success: true,
            message: `Connected! Found ${publicTablesFound.length} table(s) in 'public' schema: ${publicTablesFound.join(', ')}.`,
            tablesFound: publicTablesFound,
          };
        }
      }

      return {
        success: true,
        message: `Connected to Supabase project successfully! Note: No compliance tables were detected in schema '${schema}'. You can use the SQL Setup Script to populate them.`,
        tablesFound: [],
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Connection failed. Please verify your Supabase URL and Anon Key.',
      tablesFound: [],
    };
  }
}

// ==============================================================================
// 1. Institutional Forms view
// ==============================================================================
export async function getInstitutionalForms(): Promise<ApiResponse<InstitutionalFormSummary[]>> {
  return fetchView<InstitutionalFormSummary[]>('institutional_forms', INSTITUTIONAL_FORMS);
}

// ==============================================================================
// 2. Campuses view
// ==============================================================================
export async function getCampuses(): Promise<ApiResponse<Campus[]>> {
  return fetchView<Campus[]>('campuses', CAMPUSES);
}

// ==============================================================================
// 3. Programs view
// ==============================================================================
export async function getPrograms(): Promise<ApiResponse<AcademicProgram[]>> {
  return fetchView<AcademicProgram[]>('programs', ACADEMIC_PROGRAMS);
}

// ==============================================================================
// 5. Form 1: Enrollments view
// ==============================================================================
export async function getForm1Enrollments(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('form1_enrollments', []);
}

// ==============================================================================
// 6. Form 1: Enrollment Averages view
// ==============================================================================
export async function getForm1EnrollmentAverages(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('form1_enrollment_averages', []);
}

// ==============================================================================
// 7. Form 1: Research Courses view
// ==============================================================================
export async function getForm1ResearchCourses(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('form1_research_courses', []);
}

// ==============================================================================
// 8. Form 1: Thesis Projects view
// ==============================================================================
export async function getForm1ThesisProjects(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('form1_thesis_projects', []);
}

// ==============================================================================
// 9. Form 2: Faculty Profiles view
// ==============================================================================
export async function getForm2FacultyProfiles(): Promise<ApiResponse<Form2FacultySummary[]>> {
  return fetchView<Form2FacultySummary[]>('form2_faculty_profiles', FORM2_FACULTY_DISTRIBUTION);
}

// ==============================================================================
// 10. Form 2: Subject Assignments view
// ==============================================================================
export async function getForm2SubjectAssignments(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('form2_subject_assignments', []);
}

// ==============================================================================
// 11. Form 3: Research view
// ==============================================================================
export async function getForm3Research(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('form3_research', FORM3_PUBLICATIONS);
}

// ==============================================================================
// 12. Form 3: Research Outputs view
// ==============================================================================
export async function getForm3ResearchOutputs(): Promise<ApiResponse<Form3Publication[]>> {
  return fetchView<Form3Publication[]>('form3_research_outputs', FORM3_PUBLICATIONS);
}

export async function getForm3Patents(): Promise<ApiResponse<Form3Patent[]>> {
  return fetchView<Form3Patent[]>('form3_patents', FORM3_PATENTS);
}

export async function getForm3Trends(): Promise<ApiResponse<Form3AnnualTrend[]>> {
  return fetchView<Form3AnnualTrend[]>('form3_trends', FORM3_ANNUAL_TREND);
}

// ==============================================================================
// 13. Form 3: Summary view
// ==============================================================================
export async function getForm3Summary(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('form3_summary', FORM3_ANNUAL_TREND);
}

// ==============================================================================
// 14. Form 4: Summary & Detailed views
// ==============================================================================
export async function getForm4Summary(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('form4_summary', FORM4_RESEARCH_EXPENDITURES);
}

export async function getForm4Detailed(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('form4_detailed', FORM4_RESEARCH_EXPENDITURES);
}

export async function getForm4ResearchExpenditures(): Promise<ApiResponse<Form4Expenditure[]>> {
  return fetchView<Form4Expenditure[]>('form4_summary', FORM4_RESEARCH_EXPENDITURES);
}

// ==============================================================================
// 15. Form 4: Research Funding view
// ==============================================================================
export async function getForm4ResearchFunding(): Promise<ApiResponse<Form4FundingGrant[]>> {
  return fetchView<Form4FundingGrant[]>('form4_detailed', FORM4_RESEARCH_FUNDING);
}

// ==============================================================================
// 16. Form 5: Requirements & Evidences views
// ==============================================================================
export async function getForm5Requirements(): Promise<ApiResponse<Form5ResourceItem[]>> {
  return fetchView<Form5ResourceItem[]>('form5', FORM5_RESOURCES);
}

export async function getForm5Responses(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('form5_evidences', []);
}

// ==============================================================================
// 18. Form 6: Student Affairs & Services (form6 & form6_evidences)
// ==============================================================================
export async function getForm6Requirements(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('form6', []);
}

export async function getForm6Responses(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('form6_evidences', []);
}

export async function getForm6GeneralSupportStructures(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('form6', []);
}

export async function getForm6SpecialSupportStructures(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('form6_evidences', []);
}

// ==============================================================================
// 22. Form 7: Research Linkages view (form7)
// ==============================================================================
export async function getForm7ResearchLinkages(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('form7', []);
}

// ==============================================================================
// 23. Form 8: Outreach Programs view (form8)
// ==============================================================================
export async function getForm8OutreachPrograms(): Promise<ApiResponse<Form8Outreach[]>> {
  return fetchView<Form8Outreach[]>('form8', []);
}

// ==============================================================================
// 24. Programmatic Forms view
// ==============================================================================
export async function getProgrammaticForms(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('programmatic_forms', []);
}

// ==============================================================================
// 25. Programmatic Requirements view
// ==============================================================================
export async function getProgrammaticRequirements(): Promise<ApiResponse<any[]>> {
  return fetchView<any[]>('programmatic_requirements', []);
}

// ==============================================================================
// 26. Evidence Links view (Combined view)
// ==============================================================================
export async function getEvidenceLinks(): Promise<ApiResponse<EvidenceLink[]>> {
  return fetchView<EvidenceLink[]>('evidence_links', EVIDENCE_LINKS);
}

// ==============================================================================
// CMO Requirements summary (for Overview & Requirements page)
// ==============================================================================
export async function getCMORequirements(): Promise<ApiResponse<CMORequirement[]>> {
  return {
    data: CMO_REQUIREMENTS,
    error: null,
    source: 'mock',
    dataAsOf: INSTITUTIONAL_SUMMARY.data_as_of
  };
}

export async function getAnnualExpenditureTrends() {
  return {
    data: ANNUAL_EXPENDITURE_TREND,
    dataAsOf: INSTITUTIONAL_SUMMARY.data_as_of
  };
}

export async function getInstitutionalSummary() {
  return {
    data: INSTITUTIONAL_SUMMARY,
    dataAsOf: INSTITUTIONAL_SUMMARY.data_as_of
  };
}
