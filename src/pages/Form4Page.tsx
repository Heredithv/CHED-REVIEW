import React, { useState, useEffect, useMemo } from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { getSupabaseClient } from '../data/api';

export interface Form4SummaryDbRow {
  row_id: number;
  school_year: string;
  faculty_count: number;
  expected_expenditure: number;
  actual_expenditure: number;
  difference: number;
}

export interface Form4DetailedDbRow {
  row_id: number;
  school_year: string;
  faculty_count: number;
  expected_expenditure: number;
  gaa: number;
  stf: number;
  actual_expenditure: number;
  difference: number;
}

export interface SpendingItem {
  id?: string;
  rowId?: number;
  sy: string;
  syShort: string;
  schoolYearNum: number;
  faculty: number;
  expected: string;
  expectedRaw: number;
  expectedNum: number;
  gaa: string;
  gaaRaw: number;
  stf: string;
  stfRaw: number;
  actual: string;
  actualRaw: number;
  actualNum: number;
  diff: string;
  diffRaw: number;
  ratio: string;
}

const fallbackSpendingRows: SpendingItem[] = [
  {
    rowId: 11,
    sy: 'School Year 2021',
    syShort: 'SY 2021',
    schoolYearNum: 2021,
    faculty: 24,
    expected: '1,800,000.00',
    expectedRaw: 1800000,
    expectedNum: 1.80,
    gaa: '3,012,000.00',
    gaaRaw: 3012000,
    stf: '3,859,216.81',
    stfRaw: 3859216.81,
    actual: '6,871,216.81',
    actualRaw: 6871216.81,
    actualNum: 6.87,
    diff: '5,071,216.81',
    diffRaw: 5071216.81,
    ratio: '3.8×'
  },
  {
    rowId: 12,
    sy: 'School Year 2022',
    syShort: 'SY 2022',
    schoolYearNum: 2022,
    faculty: 30,
    expected: '2,250,000.00',
    expectedRaw: 2250000,
    expectedNum: 2.25,
    gaa: '3,012,000.00',
    gaaRaw: 3012000,
    stf: '3,128,857.99',
    stfRaw: 3128857.99,
    actual: '6,140,857.99',
    actualRaw: 6140857.99,
    actualNum: 6.14,
    diff: '3,890,857.99',
    diffRaw: 3890857.99,
    ratio: '2.7×'
  },
  {
    rowId: 13,
    sy: 'School Year 2023',
    syShort: 'SY 2023',
    schoolYearNum: 2023,
    faculty: 41,
    expected: '3,075,000.00',
    expectedRaw: 3075000,
    expectedNum: 3.08,
    gaa: '3,111,000.00',
    gaaRaw: 3111000,
    stf: '3,643,058.39',
    stfRaw: 3643058.39,
    actual: '6,754,058.39',
    actualRaw: 6754058.39,
    actualNum: 6.75,
    diff: '3,679,058.39',
    diffRaw: 3679058.39,
    ratio: '2.2×'
  },
  {
    rowId: 14,
    sy: 'School Year 2024',
    syShort: 'SY 2024',
    schoolYearNum: 2024,
    faculty: 46,
    expected: '3,450,000.00',
    expectedRaw: 3450000,
    expectedNum: 3.45,
    gaa: '3,162,000.00',
    gaaRaw: 3162000,
    stf: '5,107,307.81',
    stfRaw: 5107307.81,
    actual: '8,269,307.81',
    actualRaw: 8269307.81,
    actualNum: 8.27,
    diff: '4,819,307.81',
    diffRaw: 4819307.81,
    ratio: '2.4×'
  },
  {
    rowId: 15,
    sy: 'School Year 2025',
    syShort: 'SY 2025',
    schoolYearNum: 2025,
    faculty: 56,
    expected: '4,200,000.00',
    expectedRaw: 4200000,
    expectedNum: 4.20,
    gaa: '3,214,000.00',
    gaaRaw: 3214000,
    stf: '6,297,178.08',
    stfRaw: 6297178.08,
    actual: '9,511,178.08',
    actualRaw: 9511178.08,
    actualNum: 9.51,
    diff: '5,311,178.08',
    diffRaw: 5311178.08,
    ratio: '2.3×'
  }
];

const FORM4_SUMMARY_CACHE_KEY = 'jhcsc_form4_summary_v2';
const FORM4_DETAILED_CACHE_KEY = 'jhcsc_form4_detailed_v2';

// Module-level in-memory cache for zero-delay navigation
let cachedForm4Summary: SpendingItem[] | null = null;
let cachedForm4Detailed: SpendingItem[] | null = null;

function extractSchoolYearNumber(rawSy: any): number {
  const str = String(rawSy || '').trim();
  const match = str.match(/\b(20\d{2})\b/);
  if (match) return Number(match[1]);
  const num = Number(str);
  return !isNaN(num) && num > 0 ? num : 0;
}

function formatSchoolYearLabel(rawSy: any, syNum: number): string {
  if (syNum > 0) return `School Year ${syNum}`;
  const str = String(rawSy || '').trim();
  if (!str) return 'School Year';
  return str
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function mapDbRowToSpendingItem(r: any, detailedMatch?: any): SpendingItem {
  const syNum = extractSchoolYearNumber(r.school_year);
  const syLabel = formatSchoolYearLabel(r.school_year, syNum);
  const syShort = syNum > 0 ? `SY ${syNum}` : syLabel;

  const facultyNum = Number(r.faculty_count ?? r.full_time_faculty_research_involvement ?? 0);
  const expVal = Number(r.expected_expenditure ?? r.expected_annual_research_expenditure ?? 0);
  const actVal = Number(r.actual_expenditure ?? r.actual_annual_research_expenditure ?? 0);
  const diffVal =
    r.difference !== undefined && r.difference !== null
      ? Number(r.difference)
      : r.difference_actual_expected !== undefined && r.difference_actual_expected !== null
      ? Number(r.difference_actual_expected)
      : actVal - expVal;

  const gaaVal = Number(r.gaa ?? detailedMatch?.gaa ?? 0);
  const stfVal = Number(r.stf ?? detailedMatch?.stf ?? 0);
  const ratioVal = expVal > 0 ? (actVal / expVal).toFixed(1) + '×' : '0.0×';

  return {
    id: String(r.row_id ?? r.id ?? syLabel),
    rowId: Number(r.row_id) || undefined,
    sy: syLabel,
    syShort,
    schoolYearNum: syNum,
    faculty: facultyNum,
    expected: expVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    expectedRaw: expVal,
    expectedNum: expVal / 1000000,
    gaa: gaaVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    gaaRaw: gaaVal,
    stf: stfVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    stfRaw: stfVal,
    actual: actVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    actualRaw: actVal,
    actualNum: actVal / 1000000,
    diff: diffVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    diffRaw: diffVal,
    ratio: ratioVal
  };
}

export async function preloadForm4Data(): Promise<SpendingItem[] | null> {
  if (cachedForm4Summary && cachedForm4Summary.length > 0) return cachedForm4Summary;
  try {
    const stored = (typeof window !== 'undefined' ? localStorage.getItem(FORM4_SUMMARY_CACHE_KEY) : null) ||
                   (typeof window !== 'undefined' ? sessionStorage.getItem(FORM4_SUMMARY_CACHE_KEY) : null);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedForm4Summary = parsed;
        return parsed;
      }
    }
  } catch {}
  return fallbackSpendingRows;
}

export const Form4Page: React.FC = () => {
  const [summarySpending, setSummarySpending] = useState<SpendingItem[]>(() => {
    if (cachedForm4Summary && cachedForm4Summary.length > 0) {
      return cachedForm4Summary;
    }
    try {
      const stored = (typeof window !== 'undefined' ? localStorage.getItem(FORM4_SUMMARY_CACHE_KEY) : null) ||
                     (typeof window !== 'undefined' ? sessionStorage.getItem(FORM4_SUMMARY_CACHE_KEY) : null);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedForm4Summary = parsed;
          return parsed;
        }
      }
    } catch {}
    return fallbackSpendingRows;
  });

  const [detailedSpending, setDetailedSpending] = useState<SpendingItem[]>(() => {
    if (cachedForm4Detailed && cachedForm4Detailed.length > 0) {
      return cachedForm4Detailed;
    }
    try {
      const stored = (typeof window !== 'undefined' ? localStorage.getItem(FORM4_DETAILED_CACHE_KEY) : null) ||
                     (typeof window !== 'undefined' ? sessionStorage.getItem(FORM4_DETAILED_CACHE_KEY) : null);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedForm4Detailed = parsed;
          return parsed;
        }
      }
    } catch {}
    return fallbackSpendingRows;
  });

  const [error, setError] = useState<string | null>(null);
  const [tableMode, setTableMode] = useState<'standard' | 'breakdown'>('standard');
  const [hoveredSy, setHoveredSy] = useState<string | null>(null);
  const maxVal = 10; // 10M scale for chart bar heights

  // Fetch live Form 4 data from Supabase (form4_summary & form4_detailed)
  const loadSupabaseForm4Data = async () => {
    try {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Supabase client could not be initialized.');
      }

      // Query both Form 4 tables simultaneously: form4_summary and form4_detailed
      const [sumRes, detRes] = await Promise.all([
        client
          .from('form4_summary')
          .select('*')
          .order('row_id', { ascending: true }),
        client
          .from('form4_detailed')
          .select('*')
          .order('row_id', { ascending: true })
      ]);

      if (sumRes.error && detRes.error) {
        throw new Error(`Failed to load Form 4 tables: ${sumRes.error.message}`);
      }

      const rawSummaryRows: Form4SummaryDbRow[] = sumRes.data || [];
      const rawDetailedRows: Form4DetailedDbRow[] = detRes.data || [];

      // Index detailed rows by schoolYearNum and raw school_year string for cross-lookup
      const detailedByYear: Record<string, Form4DetailedDbRow> = {};
      rawDetailedRows.forEach((d) => {
        const yr = extractSchoolYearNumber(d.school_year);
        if (yr > 0) detailedByYear[String(yr)] = d;
        if (d.school_year) detailedByYear[String(d.school_year).trim().toUpperCase()] = d;
      });

      if (rawSummaryRows.length > 0) {
        const mappedSummary = rawSummaryRows.map((r) => {
          const yr = extractSchoolYearNumber(r.school_year);
          const detMatch =
            (yr > 0 ? detailedByYear[String(yr)] : undefined) ||
            detailedByYear[String(r.school_year || '').trim().toUpperCase()];
          return mapDbRowToSpendingItem(r, detMatch);
        });
        mappedSummary.sort((a, b) => (a.schoolYearNum - b.schoolYearNum) || ((a.rowId || 0) - (b.rowId || 0)));
        setSummarySpending(mappedSummary);
        cachedForm4Summary = mappedSummary;
        try {
          localStorage.setItem(FORM4_SUMMARY_CACHE_KEY, JSON.stringify(mappedSummary));
          sessionStorage.setItem(FORM4_SUMMARY_CACHE_KEY, JSON.stringify(mappedSummary));
        } catch {}
      }

      if (rawDetailedRows.length > 0) {
        const mappedDetailed = rawDetailedRows.map((r) => mapDbRowToSpendingItem(r, r));
        mappedDetailed.sort((a, b) => (a.schoolYearNum - b.schoolYearNum) || ((a.rowId || 0) - (b.rowId || 0)));
        setDetailedSpending(mappedDetailed);
        cachedForm4Detailed = mappedDetailed;
        try {
          localStorage.setItem(FORM4_DETAILED_CACHE_KEY, JSON.stringify(mappedDetailed));
          sessionStorage.setItem(FORM4_DETAILED_CACHE_KEY, JSON.stringify(mappedDetailed));
        } catch {}

        // If form4_summary happened to be empty, populate summary from detailed as well
        if (rawSummaryRows.length === 0) {
          setSummarySpending(mappedDetailed);
          cachedForm4Summary = mappedDetailed;
        }
      } else if (rawSummaryRows.length > 0) {
        // If form4_detailed happened to be empty, populate detailed from summary
        const mappedSummary = rawSummaryRows.map((r) => mapDbRowToSpendingItem(r));
        mappedSummary.sort((a, b) => (a.schoolYearNum - b.schoolYearNum) || ((a.rowId || 0) - (b.rowId || 0)));
        setDetailedSpending(mappedSummary);
        cachedForm4Detailed = mappedSummary;
      }

      setError(null);
    } catch (err: any) {
      console.warn('Form 4 Supabase load issue, using validated data:', err);
      setError(err?.message || 'Failed to connect to Supabase. Displaying verified local cache.');
    }
  };

  useEffect(() => {
    loadSupabaseForm4Data();

    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel('form4_realtime_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'form4_summary' },
        () => {
          loadSupabaseForm4Data();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'form4_detailed' },
        () => {
          loadSupabaseForm4Data();
        }
      )
      .subscribe();

    return () => {
      try {
        client.removeChannel(channel);
      } catch {}
    };
  }, []);

  // Select active dataset based on mode: 'standard' -> form4_summary, 'breakdown' -> form4_detailed
  const spending = useMemo(() => {
    return tableMode === 'breakdown' ? detailedSpending : summarySpending;
  }, [tableMode, summarySpending, detailedSpending]);

  // Compute Headline Metrics & Cumulative Totals for the active view
  const { totals } = useMemo(() => {
    const list = spending.length > 0 ? spending : fallbackSpendingRows;

    const sumFaculty = list.reduce((acc, cur) => acc + cur.faculty, 0);
    const sumExpected = list.reduce((acc, cur) => acc + cur.expectedRaw, 0);
    const sumGaa = list.reduce((acc, cur) => acc + cur.gaaRaw, 0);
    const sumStf = list.reduce((acc, cur) => acc + cur.stfRaw, 0);
    const sumActual = list.reduce((acc, cur) => acc + cur.actualRaw, 0);
    const sumDiff = list.reduce((acc, cur) => acc + cur.diffRaw, 0);
    const overallRatio = sumExpected > 0 ? (sumActual / sumExpected).toFixed(2) + '×' : '0.0×';

    return {
      totals: {
        faculty: sumFaculty,
        expected: sumExpected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        gaa: sumGaa.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        stf: sumStf.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        actual: sumActual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        diff: sumDiff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        ratio: overallRatio
      }
    };
  }, [spending]);

  return (
    <div className="w-full bg-[#F4F6F1] pb-16 font-sans">
      {/* Pine Hero Band */}
      <InnerHeroBand
        breadcrumb="Form 4"
        title="Form 4 Research Spending"
        subtitle="Annual research expenditures and faculty involvement for SY 2021–2025, funded through GAA and STF."
      />

      {/* Main Container — Exact max-w-[1360px] matching Form 1, Form 2, and Form 3 */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        {/* Supabase Error Notice (if any) */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold block">Supabase Connection Notice</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Chart Card — Expected vs. actual research cost overlapping hero */}
        <div className="bg-white border border-[#E5E9E2] rounded-[24px] p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)] mb-8">
          {/* Section Title with Yellow Dot and Dashed Line */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#E8AE1F] shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-[#15221A]">Expected vs. actual research cost</h2>
            </div>
          </div>

          <div className="w-full border-b border-dashed border-[#CBD5E1] mb-6" />

          {/* Legend */}
          <div className="flex items-center gap-6 mb-8 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[#FEF9C3] border border-[#E8AE1F] rounded-xs shrink-0" />
              <span className="text-[#334155] font-medium">Expected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[#1E4D2B] rounded-xs shrink-0" />
              <span className="text-[#334155] font-medium">Actual</span>
            </div>
          </div>

          {/* Dual Bar Chart */}
          <div className="relative pt-8 pb-4 border-b border-[#CBD5E1]">
            <div className="grid grid-cols-5 gap-3 sm:gap-8 h-64 items-end max-w-4xl mx-auto px-2">
              {spending.map((item) => {
                // Out of a 200px chart height ceiling for 10M
                const expHeightPx = Math.max(16, Math.round((item.expectedNum / maxVal) * 200));
                const actHeightPx = Math.max(16, Math.round((item.actualNum / maxVal) * 200));
                const isHovered = hoveredSy === item.sy;

                return (
                  <div
                    key={item.sy}
                    onMouseEnter={() => setHoveredSy(item.sy)}
                    onMouseLeave={() => setHoveredSy(null)}
                    className={`flex flex-col items-center h-full justify-end group cursor-pointer transition-all duration-200 rounded-xl py-2 px-1 ${
                      isHovered ? 'bg-[#1E4D2B]/8 ring-1 ring-[#1E4D2B]/20' : 'hover:bg-[#1E4D2B]/4'
                    }`}
                    title={`Click or hover to highlight ${item.sy} in the table`}
                  >
                    <div className="flex items-end justify-center gap-1.5 sm:gap-2.5 w-full">
                      {/* Expected Bar */}
                      <div className="flex flex-col items-center">
                        <span
                          className={`text-[10px] font-bold text-[#8C660B] bg-[#FFFBEB] px-1 py-0.5 rounded-xs border border-[#FDE68A] whitespace-nowrap mb-1 shadow-2xs transition-all duration-200 ${
                            isHovered ? 'scale-110 -translate-y-0.5 ring-1 ring-[#E8AE1F]' : ''
                          }`}
                        >
                          ₱{item.expectedNum.toFixed(2)}M
                        </span>
                        <div
                          className={`w-5 sm:w-8 bg-[#FEF9C3] border border-[#E8AE1F] rounded-t-xs transition-all duration-300 ${
                            isHovered
                              ? 'bg-[#FEF08A] brightness-105 shadow-sm'
                              : 'group-hover:bg-[#FEF08A]'
                          }`}
                          style={{ height: `${expHeightPx}px` }}
                        />
                      </div>

                      {/* Actual Bar */}
                      <div className="flex flex-col items-center">
                        <span
                          className={`text-[10px] font-bold text-white bg-[#0E3322] px-1 py-0.5 rounded-xs whitespace-nowrap mb-1 shadow-2xs transition-all duration-200 ${
                            isHovered ? 'scale-110 -translate-y-0.5 ring-1 ring-[#1E4D2B]' : ''
                          }`}
                        >
                          ₱{item.actualNum.toFixed(2)}M
                        </span>
                        <div
                          className={`w-6 sm:w-10 bg-[#1E4D2B] rounded-t-xs transition-all duration-300 ${
                            isHovered
                              ? 'bg-[#0E3322] brightness-110 shadow-md'
                              : 'group-hover:bg-[#0E3322]'
                          }`}
                          style={{ height: `${actHeightPx}px` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-xs mt-3 whitespace-nowrap transition-colors duration-200 ${
                        isHovered ? 'text-[#0E3322] font-extrabold underline decoration-[#E8AE1F] decoration-2 underline-offset-4' : 'font-semibold text-[#475569]'
                      }`}
                    >
                      {item.syShort}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white border border-[#E5E9E2] rounded-[24px] p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)]">
          {/* Table Header Controls: Summary/GAA button leftmost, View Spreadsheet rightmost */}
          <div className="flex items-center justify-between gap-4 mb-6">
            {/* Mode Toggle: Summary vs GAA & STF Breakdown in the leftmost part */}
            <div className="inline-flex items-center p-0.5 bg-[#EEF1EB] rounded-lg border border-[#E5E9E2]">
              <button
                type="button"
                onClick={() => setTableMode('standard')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  tableMode === 'standard'
                    ? 'bg-[#0E3322] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0E3322]'
                }`}
              >
                Summary
              </button>
              <button
                type="button"
                onClick={() => setTableMode('breakdown')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  tableMode === 'breakdown'
                    ? 'bg-[#0E3322] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0E3322]'
                }`}
              >
                GAA &amp; STF Breakdown
              </button>
            </div>

            {/* View Spreadsheet in the rightmost part */}
            <a
              href="https://docs.google.com/spreadsheets/d/1JFS5FN0PGDIlfpbRHpS39ZSdImrLoiw226UukXkyCmM/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs sm:text-sm rounded-lg hover:bg-[#1E4D2B]/5 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View spreadsheet</span>
            </a>
          </div>

          {/* Data Table directly displaying Supabase data */}
          <div className="overflow-x-auto custom-table-scrollbar rounded-xl border border-[#E5E9E2] bg-white shadow-2xs">
            <table className={`w-full text-left border-collapse ${tableMode === 'breakdown' ? 'min-w-[1060px]' : 'min-w-[900px]'} lg:min-w-full`}>
              <thead>
                <tr className="bg-[#FAFBF9] border-b-2 border-[#E2E8F0] text-[11px] sm:text-xs font-bold text-[#475569] uppercase tracking-wider align-bottom">
                  <th scope="col" className="py-3.5 pl-5 pr-4 text-left whitespace-nowrap">
                    School Year
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-center">
                    <div className="leading-snug text-center">Total No. of Full-Time Faculty with Research Involvement</div>
                    <div className="text-[10px] text-[#64748B] font-semibold normal-case tracking-normal mt-0.5 text-center">(A)</div>
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-center">
                    <div className="leading-snug text-center">Expected Annual Research Cost Expenditure</div>
                    <div className="text-[10px] text-[#64748B] font-semibold normal-case tracking-normal mt-0.5 text-center">(A x PhP75,000)</div>
                  </th>
                  {tableMode === 'breakdown' && (
                    <>
                      <th scope="col" className="py-3.5 px-4 text-center whitespace-nowrap">
                        GAA
                      </th>
                      <th scope="col" className="py-3.5 px-4 text-center whitespace-nowrap">
                        STF
                      </th>
                    </>
                  )}
                  <th scope="col" className="py-3.5 px-4 text-center leading-snug">
                    Actual Annual Research Cost Expenditure
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-center leading-snug">
                    Difference Between Actual and Expected
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm divide-y divide-[#EEF2F6]">
                {spending.map((r, idx) => {
                  const isHovered = hoveredSy === r.sy;

                  return (
                    <tr
                      key={r.sy}
                      onMouseEnter={() => setHoveredSy(r.sy)}
                      onMouseLeave={() => setHoveredSy(null)}
                      className={`transition-all duration-150 cursor-pointer ${
                        isHovered
                          ? 'bg-[#E3EFE8] ring-2 ring-inset ring-[#1E4D2B]/30 shadow-xs'
                          : idx % 2 === 1
                          ? 'bg-[#FAFCF8] hover:bg-[#F3F6F2]'
                          : 'bg-white hover:bg-[#F3F6F2]'
                      }`}
                    >
                      <td className={`py-3.5 pl-5 pr-4 text-left font-bold whitespace-nowrap transition-colors ${
                        isHovered ? 'text-[#0E3322]' : 'text-[#15221A]'
                      }`}>
                        {r.sy}
                      </td>
                      <td className={`py-3.5 px-4 text-center font-medium tabular-nums transition-colors ${
                        isHovered ? 'text-[#0E3322] font-semibold' : 'text-[#15221A]'
                      }`}>
                        {r.faculty}
                      </td>
                      <td className={`py-3.5 px-4 text-center tabular-nums transition-colors ${
                        isHovered ? 'text-[#0E3322] font-semibold' : 'text-[#334155]'
                      }`}>
                        {r.expected}
                      </td>
                      {tableMode === 'breakdown' && (
                        <>
                          <td className={`py-3.5 px-4 text-center tabular-nums transition-colors ${
                            isHovered ? 'text-[#0E3322] font-semibold' : 'text-[#334155]'
                          }`}>
                            {r.gaa}
                          </td>
                          <td className={`py-3.5 px-4 text-center tabular-nums transition-colors ${
                            isHovered ? 'text-[#0E3322] font-semibold' : 'text-[#334155]'
                          }`}>
                            {r.stf}
                          </td>
                        </>
                      )}
                      <td className="py-3.5 px-4 text-center font-bold text-[#1E4D2B] tabular-nums">
                        {r.actual}
                      </td>
                      <td className={`py-3.5 px-4 text-center font-medium tabular-nums transition-colors ${
                        isHovered ? 'text-[#0E3322] font-semibold' : 'text-[#334155]'
                      }`}>
                        {r.diff}
                      </td>
                    </tr>
                  );
                })}
                {/* 5-Year Cumulative Total Row */}
                <tr className="bg-[#F5F8F4] border-t-2 border-[#1E4D2B] font-bold text-[#15221A]">
                  <td className="py-3.5 pl-5 pr-4 text-left font-extrabold whitespace-nowrap text-[#15221A]">
                    Total (5 School Years)
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-[#15221A] tabular-nums">
                    {totals.faculty}
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-[#15221A] tabular-nums">
                    {totals.expected}
                  </td>
                  {tableMode === 'breakdown' && (
                    <>
                      <td className="py-3.5 px-4 text-center font-extrabold text-[#15221A] tabular-nums">
                        {totals.gaa}
                      </td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-[#15221A] tabular-nums">
                        {totals.stf}
                      </td>
                    </>
                  )}
                  <td className="py-3.5 px-4 text-center font-extrabold text-[#1E4D2B] tabular-nums">
                    {totals.actual}
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-[#15221A] tabular-nums">
                    {totals.diff}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
