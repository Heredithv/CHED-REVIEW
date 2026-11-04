import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, RefreshCw, ExternalLink, AlertCircle, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { getSupabaseClient } from '../data/api';
import { GoogleDrivePreviewCell } from '../components/GoogleDrivePreviewCell';
import { findEvidenceFileMatch, EvidenceFile } from '../utils/googleDrivePreview';

export interface Form1EnrollmentSY {
  schoolYear: string;
  schoolYearShort: string;
  count: number;
}

export interface Form1ProgramItem {
  id: string;
  offeringId?: string;
  name: string;
  major?: string;
  majorLink?: string;
  majorFileId?: string;
  authority: string;
  authorityLink?: string;
  authorityFileId?: string;
  copcStatus: string;
  copcRaw?: string;
  copcLink?: string;
  copcFileId?: string;
  syStarted: string;
  researchCourse: string;
  researchUnits: string | number;
  researchReqElec: 'Required' | 'Elective' | string;
  thesisDissertation: string;
  thesisUnits: string | number;
  prereqToGrad: 'Yes' | 'No' | string;
  averageEnrollment: number;
  enrollmentHistory: Form1EnrollmentSY[];
  campus: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE';
  level: 'Undergraduate' | 'Masteral' | 'Doctoral';
  groupName: string;
}

// Global in-memory and persistent cache for instant, zero-delay rendering on page switches
const FORM1_STORAGE_KEY = 'jhcsc_form1_new_supabase_v4';
const FORM1_SYNCED_KEY = 'jhcsc_form1_last_synced_v4';

// Explicitly wipe any stale caches from the previous database
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('jhcsc_form1_persistent_cache_v2');
    localStorage.removeItem('jhcsc_form1_persistent_cache');
    localStorage.removeItem('jhcsc_form1_cache');
    localStorage.removeItem('jhcsc_form1_last_synced_v2');
    sessionStorage.removeItem('jhcsc_form1_cache');
  } catch {}
}

let cachedForm1Programs: Form1ProgramItem[] | null = null;
let cachedForm1LastSynced: string | null = null;
let prefetchPromise: Promise<Form1ProgramItem[] | null> | null = null;

function parseCount(v: any): number {
  if (v === null || v === undefined || v === '' || v === 'None') return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

const EnrollmentTrendline: React.FC<{
  history: Form1EnrollmentSY[];
  averageEnrollment: number;
  chartId: string;
  size?: 'sm' | 'lg';
}> = ({ history, averageEnrollment, chartId, size = 'sm' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const n = history.length;
  if (n === 0) return null;

  const width = 600;
  const height = size === 'lg' ? 156 : 126;
  const topPad = size === 'lg' ? 30 : 26;
  const bottomPad = 10;
  const baselineY = height - bottomPad;
  const plotHeight = baselineY - topPad;

  const counts = history.map((h) => h.count);
  const maxVal = Math.max(1, ...counts, averageEnrollment);
  const minVal = Math.min(...counts, averageEnrollment);
  const range = maxVal - minVal;

  const getY = (val: number) => {
    const norm = range === 0 ? (maxVal > 0 ? 0.6 : 0.12) : (val - minVal) / range;
    return baselineY - 12 - norm * (plotHeight - 16);
  };

  const avgY = getY(averageEnrollment);

  const points = history.map((sy, idx) => {
    const x = ((idx + 0.5) / n) * width;
    const y = getY(sy.count);
    const prevCount = idx > 0 ? history[idx - 1].count : null;
    const diff = prevCount !== null ? sy.count - prevCount : null;
    const pctChange =
      prevCount !== null && prevCount > 0
        ? Math.round(((sy.count - prevCount) / prevCount) * 100)
        : prevCount === 0 && sy.count > 0
        ? 100
        : 0;
    return {
      idx,
      x,
      y,
      count: sy.count,
      label: sy.schoolYearShort,
      fullYear: sy.schoolYear,
      diff,
      pctChange,
    };
  });

  // Overall trend percentage from first non-zero year (or first year) to last year
  const firstNonZero = history.find((h) => h.count > 0) || history[0];
  const lastEntry = history[history.length - 1];
  const overallPct =
    firstNonZero && firstNonZero.count > 0
      ? Math.round(((lastEntry.count - firstNonZero.count) / firstNonZero.count) * 100)
      : 0;

  // Smooth cubic bezier path through points
  const buildSmoothPath = (pts: typeof points) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpx1 = p0.x + (p1.x - p0.x) * 0.42;
      const cpy1 = p0.y;
      const cpx2 = p1.x - (p1.x - p0.x) * 0.42;
      const cpy2 = p1.y;
      d += ` C ${cpx1.toFixed(1)} ${cpy1.toFixed(1)}, ${cpx2.toFixed(1)} ${cpy2.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return d;
  };

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${baselineY} L ${points[0].x.toFixed(1)} ${baselineY} Z`;
  const gradId = `trend-grad-${chartId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const activePt = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="w-full select-none">
      {/* Header Row: 5-YEAR ENROLLMENT TREND + Overall % Badge | 5-Yr Mean Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1E4D2B] shrink-0" />
          <span className="text-[11px] sm:text-xs font-extrabold tracking-wider text-[#15221A] uppercase">
            5-YEAR ENROLLMENT TREND
          </span>
          {overallPct < 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3D6] border border-[#F3D078] text-[#9A5B00]">
              <span>↘</span>
              <span>{overallPct}%</span>
            </span>
          ) : overallPct > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E3EFE8] border border-[#1E4D2B]/25 text-[#1E4D2B]">
              <span>↗</span>
              <span>+{overallPct}%</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF1EB] border border-[#CBD5E1] text-[#475569]">
              <span>→</span>
              <span>0%</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#64748B]">5-Yr Mean:</span>
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-extrabold bg-[#E3EFE8] border border-[#1E4D2B]/20 text-[#0E3322]">
            {averageEnrollment.toFixed(1)} students
          </span>
        </div>
      </div>

      {/* Main SVG + Interactive Overlay */}
      <div className="w-full relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={`w-full overflow-visible ${size === 'lg' ? 'h-40' : 'h-28'}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E4D2B" stopOpacity="0.22" />
              <stop offset="70%" stopColor="#1E4D2B" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#1E4D2B" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Soft shaded area under trendline */}
          <path d={areaPath} fill={`url(#${gradId})`} />

          {/* Gold Dashed Average Line across the chart */}
          <line
            x1={points[0].x}
            y1={avgY}
            x2={points[points.length - 1].x}
            y2={avgY}
            stroke="#E8AE1F"
            strokeWidth="1.6"
            strokeDasharray="5 4"
          />

          {/* Main Forest Green Trendline */}
          <path
            d={linePath}
            fill="none"
            stroke="#1E4D2B"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Right-aligned "avg XX" label sitting at the end of the gold average line */}
        <div
          className="absolute right-0 -translate-y-1/2 pointer-events-none pr-0.5"
          style={{ top: `${(avgY / height) * 100}%` }}
        >
          <span className="text-[10px] font-bold text-[#D99B14] bg-[#FAFBF8]/90 px-1 rounded">
            avg {Math.round(averageEnrollment)}
          </span>
        </div>

        {/* Interactive 6-column hover layer for points, vertical dashed cursor, and counts */}
        <div
          className={`absolute inset-0 grid grid-cols-6 ${
            size === 'lg' ? 'h-40' : 'h-28'
          }`}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {points.map((pt, idx) => {
            const topPercent = (pt.y / height) * 100;
            const isHovered = hoveredIdx === idx;
            const isLast = idx === n - 1;

            return (
              <div
                key={pt.fullYear}
                className="relative h-full flex justify-center cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onClick={(e) => {
                  e.stopPropagation();
                  setHoveredIdx(hoveredIdx === idx ? null : idx);
                }}
              >
                {/* Vertical dashed guide line when hovered */}
                {isHovered && (
                  <div
                    className="absolute inset-y-1 w-0 border-l border-dashed border-[#1E4D2B]/55 pointer-events-none"
                  />
                )}

                {/* Data node & Count label */}
                <div
                  className="absolute -translate-y-1/2 flex flex-col items-center pointer-events-none"
                  style={{ top: `${topPercent}%` }}
                >
                  <span
                    className={`-mt-6 mb-1 font-extrabold transition-transform ${
                      isHovered
                        ? 'text-[#0E3322] scale-110'
                        : 'text-[#15221A]'
                    } bg-[#FAFBF8]/90 px-1 rounded ${
                      size === 'lg' ? 'text-xs' : 'text-[11px]'
                    }`}
                  >
                    {pt.count}
                  </span>

                  {isHovered ? (
                    <div className="w-4 h-4 rounded-full bg-[#1E4D2B] border-2 border-white ring-4 ring-[#1E4D2B]/20 shadow-xs transition-all" />
                  ) : isLast ? (
                    <div className="w-3 h-3 rounded-full bg-[#E8AE1F] border-2 border-white shadow-2xs transition-all" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1E4D2B] border-2 border-white shadow-2xs transition-all" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Dark Green Tooltip Card on Hover */}
        {activePt && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-150 max-w-full"
            style={{
              left: `${Math.min(
                size === 'sm' ? 68 : 78,
                Math.max(size === 'sm' ? 32 : 22, ((activePt.idx + 0.5) / n) * 100)
              )}%`,
              top: `${Math.min(62, Math.max(28, (activePt.y / height) * 100 + 14))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-[#0E3322] text-white rounded-xl px-3.5 py-2 shadow-[0_10px_28px_rgba(14,51,34,0.38)] border border-[#1E4D2B] whitespace-nowrap">
              <div className="flex items-center gap-2 text-xs font-extrabold">
                <span className="text-white">{activePt.fullYear.replace('-', ' – ')}</span>
                <span className="text-[#E8AE1F]">{activePt.count} enrollees</span>
              </div>
              <div className="mt-0.5 text-[11px] font-semibold">
                {activePt.diff === null ? (
                  <span className="text-[#94A3B8]">Baseline year in 5-yr window</span>
                ) : activePt.diff > 0 ? (
                  <span className="text-[#6EE7B7]">
                    ▲ +{activePt.diff} vs prior year (+{activePt.pctChange}%)
                  </span>
                ) : activePt.diff < 0 ? (
                  <span className="text-[#FCD34D]">
                    ▼ {activePt.diff} vs prior year ({activePt.pctChange}%)
                  </span>
                ) : (
                  <span className="text-[#CBD5E1]">• No change vs prior year (0%)</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Solid Baseline */}
      <div className="w-full border-b border-[#CBD5E1]/80 mt-0 mb-2" />

      {/* School Year Labels aligned directly underneath each point */}
      <div className="grid grid-cols-6 gap-1 text-center">
        {history.map((sy, idx) => (
          <span
            key={sy.schoolYear}
            onMouseEnter={() => setHoveredIdx(idx)}
            className={`${
              size === 'lg' ? 'text-xs' : 'text-[10.5px]'
            } cursor-pointer transition-colors truncate ${
              hoveredIdx === idx || idx === n - 1
                ? 'font-bold text-[#0E3322]'
                : 'font-medium text-[#64748B]'
            }`}
          >
            {sy.schoolYearShort}
          </span>
        ))}
      </div>
    </div>
  );
};

function parseFlatForm1Rows(rows: any[]): Form1ProgramItem[] {
  const cleanLink = (val: any) => {
    if (!val) return undefined;
    const s = String(val).trim();
    if (s === '' || s.toUpperCase() === 'NULL' || s === '-' || s === '—') return undefined;
    return s;
  };

  const cleanText = (val: any) => {
    if (!val) return '';
    const s = String(val).trim();
    if (s.toUpperCase() === 'NULL' || s === 'None' || s === '--') return '';
    return s;
  };

  return rows.map((r, index) => {
    const rowId = r.row_id ?? index + 1;
    const campusRaw = (r.campus_name || '').toLowerCase();
    let campus: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE' = 'Main';
    if (campusRaw.includes('pagadian')) campus = 'Pagadian';
    else if (campusRaw.includes('dumingag')) campus = 'Dumingag';
    else if (campusRaw.includes('cmse')) campus = 'CMSE';

    const progName = (r.program_offering || '').trim();
    const progLower = progName.toLowerCase();
    const levelRaw = (r.program_level || '').toLowerCase();

    let levelCategory: 'Undergraduate' | 'Masteral' | 'Doctoral' = 'Undergraduate';
    if (levelRaw.includes('undergraduate')) {
      levelCategory = 'Undergraduate';
    } else if (
      progLower.includes('doctor') ||
      progLower.includes('phd') ||
      progLower.includes('ph.d') ||
      progLower.includes('juris doctor')
    ) {
      levelCategory = 'Doctoral';
    } else if (
      progLower.includes('master') ||
      progLower.includes('ms ') ||
      progLower.includes('ma ') ||
      progLower.includes('maed') ||
      levelRaw.includes('graduate')
    ) {
      levelCategory = 'Masteral';
    } else {
      levelCategory = 'Undergraduate';
    }

    const groupName = `${campus} Campus — ${levelCategory} Programs`;

    const history: Form1EnrollmentSY[] = [
      { schoolYear: '2021-2022', schoolYearShort: 'SY 21–22', count: parseCount(r.enrollees_sy21_22) },
      { schoolYear: '2022-2023', schoolYearShort: 'SY 22–23', count: parseCount(r.enrollees_sy22_23) },
      { schoolYear: '2023-2024', schoolYearShort: 'SY 23–24', count: parseCount(r.enrollees_sy23_24) },
      { schoolYear: '2024-2025', schoolYearShort: 'SY 24–25', count: parseCount(r.enrollees_sy24_25) },
      { schoolYear: '2025-2026', schoolYearShort: 'SY 25–26', count: parseCount(r.enrollees_sy25_26) },
      { schoolYear: '2026-2027', schoolYearShort: 'SY 26–27', count: parseCount(r.enrollees_sy26_27) },
    ];

    let avgVal = r.average_enrollees !== null && r.average_enrollees !== undefined && r.average_enrollees !== ''
      ? Number(r.average_enrollees)
      : 0;
    if (isNaN(avgVal) || avgVal === 0) {
      const nonZero = history.filter((h) => h.count > 0);
      if (nonZero.length > 0) {
        avgVal = history.reduce((sum, h) => sum + h.count, 0) / history.length;
      }
    }

    const majorClean = cleanText(r.major_specialization) || undefined;

    return {
      id: `sp-${rowId}`,
      offeringId: String(rowId),
      name: progName,
      major: majorClean,
      majorLink: cleanLink(r.major_specialization_link),
      authority: cleanText(r.board_reso_no),
      authorityLink: cleanLink(r.board_reso_link),
      copcStatus: cleanText(r.copc_no),
      copcRaw: cleanText(r.copc_no),
      copcLink: cleanLink(r.copc_link),
      syStarted: cleanText(r.school_year_started),
      researchCourse: cleanText(r.research_course_titles),
      researchUnits: r.research_units !== null && r.research_units !== undefined && r.research_units !== 'None' ? String(r.research_units) : '',
      researchReqElec: cleanText(r.research_required),
      thesisDissertation: cleanText(r.thesis_course_title),
      thesisUnits: r.thesis_units !== null && r.thesis_units !== undefined && r.thesis_units !== 'None' ? String(r.thesis_units) : '',
      prereqToGrad: cleanText(r.thesis_prerequisite),
      averageEnrollment: Number(avgVal || 0),
      enrollmentHistory: history,
      campus,
      level: levelCategory,
      groupName,
    };
  });
}

function parseForm1Response(
  offerings: any[],
  researchCourses: any[],
  thesisProjects: any[],
  enrollments: any[],
  averages: any[],
  evidenceFiles: EvidenceFile[]
): Form1ProgramItem[] {
  const researchMap = new Map<string, any>();
  researchCourses.forEach((rc: any) => {
    researchMap.set(rc.offering_id || rc.form1_offering_id, rc);
  });

  const thesisMap = new Map<string, any>();
  thesisProjects.forEach((tp: any) => {
    thesisMap.set(tp.offering_id || tp.form1_offering_id, tp);
  });

  const enrollmentMap = new Map<string, Form1EnrollmentSY[]>();
  enrollments.forEach((en: any) => {
    const offId = en.offering_id || en.form1_offering_id;
    if (!enrollmentMap.has(offId)) {
      enrollmentMap.set(offId, []);
    }
    const syStr = String(en.school_year || '');
    let shortSy = syStr;
    if (syStr.includes('2021') && syStr.includes('2022')) shortSy = 'SY 21–22';
    else if (syStr.includes('2022') && syStr.includes('2023')) shortSy = 'SY 22–23';
    else if (syStr.includes('2023') && syStr.includes('2024')) shortSy = 'SY 23–24';
    else if (syStr.includes('2024') && syStr.includes('2025')) shortSy = 'SY 24–25';
    else if (syStr.includes('2025') && syStr.includes('2026')) shortSy = 'SY 25–26';
    else if (syStr.includes('2026') && syStr.includes('2027')) shortSy = 'SY 26–27';

    enrollmentMap.get(offId)!.push({
      schoolYear: syStr,
      schoolYearShort: shortSy,
      count: Number(en.enrollment_count || 0)
    });
  });

  const averageMap = new Map<string, number>();
  averages.forEach((avg: any) => {
    averageMap.set(avg.offering_id, Number(avg.average_enrollment || 0));
  });

  return offerings.map((off: any, index: number) => {
    const offId = off.id;
    const rc = researchMap.get(offId);
    const tp = thesisMap.get(offId);
    const history = enrollmentMap.get(offId) || [];

    history.sort((a, b) => a.schoolYear.localeCompare(b.schoolYear));

    let avgVal = averageMap.get(offId);
    if (avgVal === undefined || isNaN(avgVal)) {
      if (history.length > 0) {
        const nonZero = history.filter(h => h.count > 0);
        const sum = history.reduce((acc, h) => acc + h.count, 0);
        avgVal = nonZero.length > 0 ? sum / history.length : 0;
      } else {
        avgVal = 0;
      }
    }

    const campusRaw = (off.campus || 'Main Campus').toLowerCase();
    let campusCategory: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE' = 'Main';
    if (campusRaw.includes('pagadian')) campusCategory = 'Pagadian';
    else if (campusRaw.includes('dumingag')) campusCategory = 'Dumingag';
    else if (campusRaw.includes('cmse')) campusCategory = 'CMSE';

    const rawProgName = off.program_name || '';
    const progNameLower = rawProgName.toLowerCase();
    const rawLevel = (off.level || off.program_level || '').toLowerCase();
    let levelCategory: 'Undergraduate' | 'Masteral' | 'Doctoral' = 'Undergraduate';
    if (progNameLower.includes('doctor') || rawLevel.includes('doctor') || progNameLower.includes('phd') || progNameLower.includes('ph.d')) {
      levelCategory = 'Doctoral';
    } else if (progNameLower.includes('master') || rawLevel.includes('master') || progNameLower.includes('ms ') || progNameLower.includes('ma ') || progNameLower.includes('maed')) {
      levelCategory = 'Masteral';
    }

    const groupName = `${campusCategory} Campus — ${levelCategory} Programs`;

    const majorMatch = findEvidenceFileMatch(off.major_specialization, evidenceFiles);
    const authMatch = findEvidenceFileMatch(off.board_resolution_no, evidenceFiles);
    const copcMatch = findEvidenceFileMatch(off.copc_raw, evidenceFiles) || findEvidenceFileMatch(off.copc_no, evidenceFiles);

    return {
      id: `sp-${offId || index}`,
      offeringId: offId,
      name: rawProgName,
      major: off.major_specialization || undefined,
      majorLink: majorMatch?.drive_url,
      majorFileId: majorMatch?.drive_file_id || undefined,
      authority: off.board_resolution_no || '',
      authorityLink: authMatch?.drive_url,
      authorityFileId: authMatch?.drive_file_id || undefined,
      copcStatus: off.copc_no || '',
      copcRaw: off.copc_raw || off.copc_no || '',
      copcLink: copcMatch?.drive_url,
      copcFileId: copcMatch?.drive_file_id || undefined,
      syStarted: off.school_year_started || '',
      researchCourse: rc ? rc.course_title : '',
      researchUnits: rc ? rc.no_of_units : '',
      researchReqElec: rc && rc.required_or_elective ? rc.required_or_elective : '',
      thesisDissertation: tp ? tp.course_title : '',
      thesisUnits: tp ? tp.no_of_units : '',
      prereqToGrad: off.prerequisite_to_graduation || '',
      averageEnrollment: Number(avgVal || 0),
      enrollmentHistory: history,
      campus: campusCategory,
      level: levelCategory,
      groupName
    };
  });
}

export async function preloadForm1Data(): Promise<Form1ProgramItem[] | null> {
  if (cachedForm1Programs && cachedForm1Programs.length > 0) {
    return cachedForm1Programs;
  }
  if (prefetchPromise) return prefetchPromise;

  try {
    const stored = (typeof window !== 'undefined' ? localStorage.getItem(FORM1_STORAGE_KEY) : null) || 
                   (typeof window !== 'undefined' ? sessionStorage.getItem('jhcsc_form1_cache') : null);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedForm1Programs = parsed;
        cachedForm1LastSynced = (typeof window !== 'undefined' ? localStorage.getItem(FORM1_SYNCED_KEY) : null) || null;
        return parsed;
      }
    }
  } catch {}

  // If not cached, do NOT start background network request on site open to prioritize speed
  return null;
}

export const Form1Page: React.FC = () => {
  const [selectedCampus, setSelectedCampus] = useState<string>('All campuses');
  const [selectedLevel, setSelectedLevel] = useState<string>('All levels');
  const [summarySchoolYear, setSummarySchoolYear] = useState<string>('2026-2027');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const [programs, setPrograms] = useState<Form1ProgramItem[]>(() => {
    if (cachedForm1Programs && cachedForm1Programs.length > 0) {
      return cachedForm1Programs;
    }
    try {
      const stored = (typeof window !== 'undefined' ? localStorage.getItem(FORM1_STORAGE_KEY) : null) || 
                     (typeof window !== 'undefined' ? sessionStorage.getItem('jhcsc_form1_cache') : null);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedForm1Programs = parsed;
          cachedForm1LastSynced = (typeof window !== 'undefined' ? localStorage.getItem(FORM1_SYNCED_KEY) : null) || null;
          return parsed;
        }
      }
    } catch {}
    return [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    // If persistent cache exists, opening the site requires 0ms loading
    return !(cachedForm1Programs && cachedForm1Programs.length > 0);
  });
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(() => 
    cachedForm1LastSynced || (typeof window !== 'undefined' ? localStorage.getItem(FORM1_SYNCED_KEY) : null)
  );

  // Supabase live importer for Form 1 table
  const loadSupabaseForm1Data = async (_force = false) => {
    setLoading(true);
    setError(null);
    try {
      const client = getSupabaseClient();
      if (!client) {
        setError('Supabase client is not configured.');
        setLoading(false);
        return;
      }

      // Query the consolidated 'form1' table in the new Supabase database (51 programs)
      const form1Res = await client.from('form1').select('*').order('row_id', { ascending: true });
      if (form1Res.error) {
        throw new Error(`Supabase form1 query error: ${form1Res.error.message}`);
      }

      if (!form1Res.data || form1Res.data.length === 0) {
        throw new Error('Connected to new Supabase database, but table "form1" returned 0 rows.');
      }

      const mapped = parseFlatForm1Rows(form1Res.data);
      cachedForm1Programs = mapped;
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      cachedForm1LastSynced = nowStr;
      try {
        localStorage.setItem(FORM1_STORAGE_KEY, JSON.stringify(mapped));
        localStorage.setItem(FORM1_SYNCED_KEY, nowStr);
      } catch {}

      setPrograms(mapped);
      setError(null);
      setLastSynced(nowStr);
    } catch (err: any) {
      console.warn('Error fetching Supabase Form 1 data:', err);
      setError(`Database Error: ${err?.message || 'unexpected error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Unconditionally fetch fresh data from the new Supabase database on every page load
    loadSupabaseForm1Data(true);
  }, []);

  const filteredPrograms = useMemo(() => {
    return programs.filter((item) => {
      const matchCampus =
        selectedCampus === 'All campuses' ||
        (selectedCampus === 'Main' && item.campus === 'Main') ||
        (selectedCampus === 'Pagadian' && item.campus === 'Pagadian') ||
        (selectedCampus === 'Dumingag' && item.campus === 'Dumingag') ||
        (selectedCampus === 'CMSE' && item.campus === 'CMSE');

      const matchLevel =
        selectedLevel === 'All levels' ||
        (selectedLevel === 'Doctoral' && item.level === 'Doctoral') ||
        (selectedLevel === 'Masteral' && item.level === 'Masteral') ||
        (selectedLevel === 'Undergraduate' && item.level === 'Undergraduate');

      const matchQuery =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.major && item.major.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.researchCourse.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCampus && matchLevel && matchQuery;
    });
  }, [programs, selectedCampus, selectedLevel, searchQuery]);

  const campusCounts = useMemo(() => {
    return {
      all: programs.length,
      main: programs.filter((p) => p.campus === 'Main').length,
      pagadian: programs.filter((p) => p.campus === 'Pagadian').length,
      dumingag: programs.filter((p) => p.campus === 'Dumingag').length,
      cmse: programs.filter((p) => p.campus === 'CMSE').length,
    };
  }, [programs]);

  // Live calculated summary metrics directly from Supabase programs state
  const summaryMetrics = useMemo(() => {
    let undergradCount = 0;
    let masteralCount = 0;
    let doctoralCount = 0;

    let undergradEnrollment = 0;
    let masteralEnrollment = 0;
    let doctoralEnrollment = 0;

    programs.forEach((p) => {
      let val = 0;
      if (summarySchoolYear === 'All Years Sum') {
        if (p.enrollmentHistory && p.enrollmentHistory.length > 0) {
          val = p.enrollmentHistory.reduce((sum, h) => sum + (Number(h.count) || 0), 0);
        } else {
          val = Math.round(Number(p.averageEnrollment) || 0);
        }
      } else {
        const syTarget = summarySchoolYear.replace(/\s+/g, '');
        const match = p.enrollmentHistory?.find((h) => {
          const hSy = (h.schoolYear || '').replace(/\s+/g, '');
          const hSyShort = (h.schoolYearShort || '').replace(/\s+/g, '');
          return hSy.includes(syTarget) || syTarget.includes(hSy) || hSyShort.includes(syTarget.slice(2, 4));
        });

        if (match) {
          val = Number(match.count) || 0;
        } else if (p.enrollmentHistory && p.enrollmentHistory.length > 0) {
          val = 0;
        } else {
          val = Math.round(Number(p.averageEnrollment) || 0);
        }
      }

      if (p.level === 'Doctoral') {
        doctoralCount++;
        doctoralEnrollment += val;
      } else if (p.level === 'Masteral') {
        masteralCount++;
        masteralEnrollment += val;
      } else {
        undergradCount++;
        undergradEnrollment += val;
      }
    });

    return {
      undergradCount,
      masteralCount,
      doctoralCount,
      totalCount: programs.length,
      undergradEnrollment,
      masteralEnrollment,
      doctoralEnrollment,
      totalEnrollment: undergradEnrollment + masteralEnrollment + doctoralEnrollment
    };
  }, [programs, summarySchoolYear]);

  // Group by groupName
  const groupedPrograms = useMemo(() => {
    const groups: { [key: string]: Form1ProgramItem[] } = {};
    filteredPrograms.forEach((p) => {
      if (!groups[p.groupName]) {
        groups[p.groupName] = [];
      }
      groups[p.groupName].push(p);
    });
    return groups;
  }, [filteredPrograms]);

  const renderStatusBadge = (
    status?: string,
    rawCopc?: string,
    copcLink?: string,
    copcFileId?: string
  ) => {
    const textToEvaluate = (rawCopc && rawCopc.trim()) ? rawCopc.trim() : (status ? status.trim() : '');
    
    // If blank in Supabase, keep completely blank
    if (!textToEvaluate) {
      return null;
    }

    const lower = textToEvaluate.toLowerCase();

    // Plain text indicating application after approval, ongoing, or ANY item with NO genuine evidence file link:
    // Strictly plain text: NO BOX, NO BACKGROUND, JUST TEXT
    if (lower.includes('for application') || lower.includes('ongoing') || lower.includes('pending') || !copcLink) {
      return (
        <span className="text-[11px] text-[#334155] font-normal leading-snug break-words">
          {textToEvaluate}
        </span>
      );
    }

    // Official COPC document (renders Google Drive preview link ONLY if genuine document exists in evidence_files)
    return (
      <div className="text-[11px] break-words">
        <GoogleDrivePreviewCell
          text={textToEvaluate}
          explicitUrl={copcLink}
          explicitFileId={copcFileId}
          columnType="copc"
        />
      </div>
    );
  };

  const renderReqElecBadge = (val: string) => {
    const isRequired = val.toLowerCase().includes('req');
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
          isRequired
            ? 'bg-[#E3EFE8] text-[#0E3322]'
            : 'bg-[#EEF1EB] text-[#475569]'
        }`}
      >
        {isRequired ? 'Required' : 'Elective'}
      </span>
    );
  };

  const renderPrereqBadge = (val: string) => {
    const isYes = val.toLowerCase() === 'yes';
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
          isYes
            ? 'bg-[#E3EFE8] text-[#0E3322]'
            : 'bg-[#FBF1D2] text-[#8A6600]'
        }`}
      >
        {isYes ? 'Yes' : 'No'}
      </span>
    );
  };

  return (
    <div className="w-full bg-[#F4F6F1] pb-16 font-sans">
      {/* Pine hero band */}
      <InnerHeroBand
        breadcrumb="Form 1"
        title="Form 1 Programs & Enrollment"
        subtitle="Complete listing of undergraduate and graduate programs, along with their enrollment data."
      />

      {/* Hero Stats Overlay */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">{summaryMetrics.totalCount}</div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">Total programs</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {summaryMetrics.undergradCount}
            </div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">Undergraduate programs</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {summaryMetrics.masteralCount}
            </div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">Masteral programs</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {summaryMetrics.doctoralCount}
            </div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">Doctoral programs</div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-[#E5E9E2] rounded-[24px] p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)]">
          {/* Title and subtitle */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F]" />
                <h2 className="text-2xl font-bold text-[#15221A]">Program Inventory</h2>
              </div>
              <div className="flex items-center gap-2">
              </div>
            </div>
            <p className="text-xs text-[#64748B] pl-5">
              Inventory of J.H. Cerilles State College’s degree programs, operating approvals, research requirements, and multi-year enrollment figures.
            </p>
          </div>

          <div className="w-full border-b border-dashed border-[#CBD5E1] mb-6" />

          {/* Error / Warning Notice */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Supabase Data Notice</h4>
                <p className="text-xs mt-1 text-amber-800">{error}</p>
              </div>
            </div>
          )}

          {/* DATA SUMMARY SECTION (Matches image.png graph block branding) */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Block 1: Enrollment Summary */}
            <div className="bg-white border border-[#E5E9E2] rounded-[22px] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F] shrink-0" />
                    <h3 className="text-sm font-bold text-[#15221A]">
                      Enrollment ({summarySchoolYear === '2026-2027' ? 'SY 2026–2027' : summarySchoolYear})
                    </h3>
                  </div>

                  {/* School year selector */}
                  <div className="relative inline-block">
                    <select
                      value={summarySchoolYear}
                      onChange={(e) => setSummarySchoolYear(e.target.value)}
                      className="appearance-none bg-[#EEF1EB] text-[#475569] hover:bg-[#E2E8F0] text-[11px] font-semibold py-1 pl-3 pr-7 rounded-full border-none focus:ring-1 focus:ring-[#1E4D2B] cursor-pointer"
                    >
                      <option value="2026-2027">SY 2026–2027 (Current)</option>
                      <option value="2025-2026">SY 2025–2026</option>
                      <option value="2024-2025">SY 2024–2025</option>
                      <option value="2023-2024">SY 2023–2024</option>
                      <option value="2022-2023">SY 2022–2023</option>
                      <option value="2021-2022">SY 2021–2022</option>
                      <option value="All Years Sum">All Years Combined</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-[#64748B] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div className="w-full border-b border-dashed border-[#CBD5E1] mb-5" />

                <div className="space-y-4">
                  {/* Undergraduate */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#334155] font-semibold w-40 shrink-0">Undergraduate Programs</span>
                    <div className="flex-1 bg-[#EEF1EB] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1E4D2B] h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(8, (summaryMetrics.undergradEnrollment / (summaryMetrics.undergradEnrollment || 1)) * 100))}%`
                        }}
                      />
                    </div>
                    <span className="font-extrabold text-[#15221A] text-sm w-16 text-right shrink-0">
                      {loading && programs.length === 0 ? (
                        <span className="inline-block w-12 h-4 bg-[#EEF1EB] rounded animate-pulse" />
                      ) : (
                        summaryMetrics.undergradEnrollment.toLocaleString('en-US')
                      )}
                    </span>
                  </div>

                  {/* Masteral */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#334155] font-semibold w-40 shrink-0">Masteral Programs</span>
                    <div className="flex-1 bg-[#EEF1EB] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1E4D2B] h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(6, (summaryMetrics.masteralEnrollment / (summaryMetrics.undergradEnrollment || 1)) * 100))}%`
                        }}
                      />
                    </div>
                    <span className="font-extrabold text-[#15221A] text-sm w-16 text-right shrink-0">
                      {loading && programs.length === 0 ? (
                        <span className="inline-block w-12 h-4 bg-[#EEF1EB] rounded animate-pulse" />
                      ) : (
                        summaryMetrics.masteralEnrollment.toLocaleString('en-US')
                      )}
                    </span>
                  </div>

                  {/* Doctoral */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#334155] font-semibold w-40 shrink-0">Doctoral Programs</span>
                    <div className="flex-1 bg-[#EEF1EB] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1E4D2B] h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(5, (summaryMetrics.doctoralEnrollment / (summaryMetrics.undergradEnrollment || 1)) * 100))}%`
                        }}
                      />
                    </div>
                    <span className="font-extrabold text-[#15221A] text-sm w-16 text-right shrink-0">
                      {loading && programs.length === 0 ? (
                        <span className="inline-block w-12 h-4 bg-[#EEF1EB] rounded animate-pulse" />
                      ) : (
                        summaryMetrics.doctoralEnrollment.toLocaleString('en-US')
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom total row */}
              <div className="mt-6 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs font-bold text-[#0E3322]">Total Enrollment</span>
                <span className="text-sm font-extrabold text-[#1E4D2B] bg-[#F4F6F1] px-3.5 py-1 rounded-full border border-[#E2E8F0]">
                  {loading && programs.length === 0 ? (
                    <span className="inline-block w-14 h-4 bg-[#E2E8F0] rounded animate-pulse" />
                  ) : (
                    summaryMetrics.totalEnrollment.toLocaleString('en-US')
                  )}
                </span>
              </div>
            </div>

            {/* Block 2: Programs Count Summary */}
            <div className="bg-white border border-[#E5E9E2] rounded-[22px] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F] shrink-0" />
                  <h3 className="text-sm font-bold text-[#15221A]">Programs</h3>
                </div>
                <div className="w-full border-b border-dashed border-[#CBD5E1] mb-5" />

                <div className="space-y-4">
                  {/* Total Undergraduate */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#334155] font-semibold w-48 shrink-0">Total No. of Undergraduate Programs</span>
                    <div className="flex-1 bg-[#EEF1EB] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1E4D2B] h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(12, (summaryMetrics.undergradCount / (summaryMetrics.undergradCount || 1)) * 100))}%`
                        }}
                      />
                    </div>
                    <span className="font-extrabold text-[#15221A] text-sm w-10 text-right shrink-0">
                      {loading && programs.length === 0 ? (
                        <span className="inline-block w-6 h-4 bg-[#EEF1EB] rounded animate-pulse" />
                      ) : (
                        summaryMetrics.undergradCount
                      )}
                    </span>
                  </div>

                  {/* Total Masteral */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#334155] font-semibold w-48 shrink-0">Total No. of Masteral Programs</span>
                    <div className="flex-1 bg-[#EEF1EB] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1E4D2B] h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(8, (summaryMetrics.masteralCount / (summaryMetrics.undergradCount || 1)) * 100))}%`
                        }}
                      />
                    </div>
                    <span className="font-extrabold text-[#15221A] text-sm w-10 text-right shrink-0">
                      {loading && programs.length === 0 ? (
                        <span className="inline-block w-6 h-4 bg-[#EEF1EB] rounded animate-pulse" />
                      ) : (
                        summaryMetrics.masteralCount
                      )}
                    </span>
                  </div>

                  {/* Total Doctoral */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#334155] font-semibold w-48 shrink-0">Total No. of Doctoral Programs</span>
                    <div className="flex-1 bg-[#EEF1EB] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1E4D2B] h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(6, (summaryMetrics.doctoralCount / (summaryMetrics.undergradCount || 1)) * 100))}%`
                        }}
                      />
                    </div>
                    <span className="font-extrabold text-[#15221A] text-sm w-10 text-right shrink-0">
                      {loading && programs.length === 0 ? (
                        <span className="inline-block w-6 h-4 bg-[#EEF1EB] rounded animate-pulse" />
                      ) : (
                        summaryMetrics.doctoralCount
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom total row */}
              <div className="mt-6 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs font-bold text-[#0E3322]">Total No. of Degree Programs</span>
                <span className="text-sm font-extrabold text-[#1E4D2B] bg-[#F4F6F1] px-3.5 py-1 rounded-full border border-[#E2E8F0]">
                  {loading && programs.length === 0 ? (
                    <span className="inline-block w-8 h-4 bg-[#E2E8F0] rounded animate-pulse" />
                  ) : (
                    summaryMetrics.totalCount
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Filters Bar with Campus Pills, Level Select, Search, and View Toggle */}
          <div className="space-y-4 mb-8">
            {/* Top Row: Campus Tabs on Left, View Switcher (Cards | Table) & View Spreadsheet on Right */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Campus Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'All campuses', label: 'All campuses', count: campusCounts.all },
                  { id: 'Main', label: 'Main', count: campusCounts.main },
                  { id: 'Pagadian', label: 'Pagadian', count: campusCounts.pagadian },
                  { id: 'Dumingag', label: 'Dumingag', count: campusCounts.dumingag },
                  { id: 'CMSE', label: 'CMSE', count: campusCounts.cmse },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCampus(c.id)}
                    type="button"
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-2 ${
                      selectedCampus === c.id
                        ? 'bg-[#0E3322] text-white shadow-xs'
                        : 'bg-[#EEF1EB] text-[#475569] hover:bg-[#E2E8F0]'
                    }`}
                  >
                    <span>{c.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        selectedCampus === c.id ? 'bg-white/20 text-white' : 'bg-white text-[#64748B]'
                      }`}
                    >
                      {c.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* View Switcher (Cards | Table) & View Spreadsheet */}
              <div className="flex items-center gap-2.5">
                <div className="inline-flex items-center p-0.5 bg-[#EEF1EB] rounded-full border border-[#E5E9E2]">
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'cards'
                        ? 'bg-[#0E3322] text-white shadow-xs'
                        : 'text-[#475569] hover:text-[#0E3322]'
                    }`}
                    title="Present programs as cards"
                  >
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-[#0E3322] text-white shadow-xs'
                        : 'text-[#475569] hover:text-[#0E3322]'
                    }`}
                    title="Table view"
                  >
                    <span>Table</span>
                  </button>
                </div>

                <a
                  href="https://docs.google.com/spreadsheets/d/1YNaX8twBL2SfzbFu_8cuEh1VCYA3P80TIcVaIWuHALs/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs rounded-full hover:bg-[#1E4D2B]/5 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View spreadsheet</span>
                </a>
              </div>
            </div>

            {/* Bottom Row: Level Select & Active Filter Reset on Left, Search Programs on Right */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5">
                {/* Level Dropdown */}
                <div className="relative inline-block">
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="appearance-none bg-white text-[#475569] hover:bg-[#F4F6F1] text-xs font-medium py-1.5 pl-3.5 pr-8 rounded-full border border-[#E5E9E2] focus:ring-2 focus:ring-[#1E4D2B] cursor-pointer shadow-2xs"
                  >
                    <option value="All levels">All levels</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Masteral">Masteral</option>
                    <option value="Doctoral">Doctoral</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Active Filter Clear */}
                {(selectedCampus !== 'All campuses' || selectedLevel !== 'All levels' || searchQuery.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCampus('All campuses');
                      setSelectedLevel('All levels');
                      setSearchQuery('');
                    }}
                    className="text-xs text-[#1E4D2B] hover:underline font-semibold cursor-pointer pl-1 whitespace-nowrap"
                  >
                    Reset filters
                  </button>
                )}
              </div>

              {/* Search programs input */}
              <div className="relative min-w-[260px] w-full sm:w-[440px] md:w-[500px]">
                <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search programs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-[#E5E9E2] rounded-full focus:outline-none focus:border-[#1E4D2B] shadow-2xs placeholder:text-[#94A3B8]"
                />
              </div>
            </div>
          </div>

          {/* Cards View Mode */}
          {viewMode === 'cards' ? (
            <div className="space-y-10">
              {loading && programs.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`skel-card-${i}`} className="bg-white border border-[#E5E9E2] rounded-[22px] overflow-hidden shadow-xs animate-pulse">
                      <div className="bg-[#0E3322]/30 h-16 w-full" />
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="h-3 bg-[#EEF1EB] rounded w-2/3" />
                            <div className="h-4 bg-[#EEF1EB] rounded w-full" />
                          </div>
                          <div className="space-y-3">
                            <div className="h-3 bg-[#EEF1EB] rounded w-2/3" />
                            <div className="h-4 bg-[#EEF1EB] rounded w-full" />
                          </div>
                        </div>
                        <div className="h-10 bg-[#FAFBF8] rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : Object.keys(groupedPrograms).length === 0 ? (
                <div className="py-16 text-center text-[#64748B] bg-white border border-[#E5E9E2] rounded-[22px]">
                  No matching degree programs found.
                </div>
              ) : (
                Object.entries(groupedPrograms).map(([groupTitle, items]) => (
                  <div key={groupTitle} className="space-y-4">
                    {/* Group Header */}
                    <div className="flex items-center gap-2.5 px-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F] shrink-0" />
                      <h3 className="text-sm font-bold text-[#1E4D2B] tracking-wide whitespace-nowrap">
                        {groupTitle}
                      </h3>
                      <span className="text-xs text-[#64748B] font-medium">({items.length})</span>
                      <div className="w-full border-b border-dashed border-[#CBD5E1] ml-2 hidden sm:block" />
                    </div>

                    {/* Program Cards Grid Matching Brand Board Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {items.map((row) => {
                        const isExpanded = expandedIds.has(row.id);
                        const maxCount = Math.max(1, ...row.enrollmentHistory.map((h) => h.count));
                        const formattedAvg = Number(row.averageEnrollment).toFixed(0);

                        // School Year Started pill in top right (strictly school_year_started column)
                        let startPill: string | null = null;
                        if (row.syStarted && row.syStarted.trim()) {
                          const trimmed = row.syStarted.trim();
                          const lower = trimmed.toLowerCase();
                          if (!lower.startsWith('sy') && !lower.startsWith('to ') && !lower.startsWith('to-')) {
                            startPill = `SY ${trimmed}`;
                          } else {
                            startPill = trimmed;
                          }
                        }

                        return (
                          <div
                            key={row.id}
                            data-program-card="true"
                            className="bg-white border border-[#E5E9E2] rounded-[22px] overflow-hidden shadow-[0_4px_20px_rgba(21,34,26,0.04)] hover:shadow-[0_8px_30px_rgba(21,34,26,0.08)] transition-all flex flex-col justify-between min-w-0"
                          >
                            {/* Pine Top Banner Header */}
                            <div className="bg-[#0E3322] px-6 py-4 flex items-start justify-between gap-3 text-white">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-extrabold text-base sm:text-lg leading-tight text-white tracking-tight break-words [overflow-wrap:anywhere]">
                                  {row.name}
                                </h4>
                                {row.major && (
                                  <div className="text-xs text-[#E3EFE8] font-medium mt-1 break-words [overflow-wrap:anywhere] leading-snug">
                                    {row.majorLink ? (
                                      <GoogleDrivePreviewCell
                                        text={row.major}
                                        explicitUrl={row.majorLink}
                                        explicitFileId={row.majorFileId}
                                        columnType="major"
                                        className="text-[#E3EFE8] hover:text-white underline decoration-[#E8AE1F]"
                                      />
                                    ) : (
                                      <span className="break-words [overflow-wrap:anywhere]">{row.major}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {startPill && (
                                <span className="bg-[#E8AE1F] text-[#15221A] text-xs font-bold px-3 py-1 rounded-full shrink-0 shadow-2xs whitespace-nowrap">
                                  {startPill}
                                </span>
                              )}
                            </div>

                            {/* Two-Column Grid Body */}
                            <div className="p-6 flex-1 flex flex-col justify-between space-y-4 min-w-0">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs min-w-0">
                                {/* Left Column */}
                                <div className="space-y-4 min-w-0">
                                  {/* Board Resolution */}
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase mb-1">
                                      BOARD RESOLUTION
                                    </div>
                                    <div className="font-semibold text-[#15221A] text-xs leading-snug break-words [overflow-wrap:anywhere]">
                                      {row.authorityLink ? (
                                        <GoogleDrivePreviewCell
                                          text={row.authority || '—'}
                                          explicitUrl={row.authorityLink}
                                          explicitFileId={row.authorityFileId}
                                          columnType="authority"
                                        />
                                      ) : (
                                        <span className="break-words [overflow-wrap:anywhere]">{row.authority || '—'}</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Research Course */}
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase mb-1">
                                      RESEARCH COURSE
                                    </div>
                                    <div className="text-xs text-[#15221A] font-normal leading-snug break-words [overflow-wrap:anywhere]">
                                      {row.researchCourse ? (
                                        <>
                                          <GoogleDrivePreviewCell text={row.researchCourse} />
                                          {row.researchUnits ? (
                                            <span className="text-[#64748B] ml-1 font-medium">({row.researchUnits} units)</span>
                                          ) : null}
                                        </>
                                      ) : (
                                        <span className="text-[#94A3B8]">—</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Thesis / Dissertation */}
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase mb-1">
                                      THESIS / DISSERTATION
                                    </div>
                                    <div className="text-xs text-[#15221A] font-normal leading-snug break-words [overflow-wrap:anywhere]">
                                      {row.thesisDissertation ? (
                                        <>
                                          <GoogleDrivePreviewCell text={row.thesisDissertation} />
                                          {row.thesisUnits ? (
                                            <span className="text-[#64748B] ml-1 font-medium">({row.thesisUnits} units)</span>
                                          ) : null}
                                        </>
                                      ) : (
                                        <span className="text-[#94A3B8]">—</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4 min-w-0">
                                  {/* COPC */}
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase mb-1">
                                      COPC
                                    </div>
                                    <div className="font-semibold text-[#15221A] text-xs leading-snug break-words [overflow-wrap:anywhere]">
                                      {row.copcLink ? (
                                        <GoogleDrivePreviewCell
                                          text={(row.copcRaw || row.copcStatus || '—').replace(/^✓\s*/, '')}
                                          explicitUrl={row.copcLink}
                                          explicitFileId={row.copcFileId}
                                          columnType="copc"
                                        />
                                      ) : (
                                        <span className="break-words [overflow-wrap:anywhere]">{(row.copcRaw || row.copcStatus || '—').replace(/^✓\s*/, '')}</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Required or Elective */}
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase mb-1">
                                      REQUIRED OR ELECTIVE?
                                    </div>
                                    <div className="text-xs text-[#15221A] font-medium break-words [overflow-wrap:anywhere]">
                                      {row.researchReqElec || '—'}
                                    </div>
                                  </div>

                                  {/* Pre-req to Grad */}
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase mb-1">
                                      PRE-REQ TO GRAD?
                                    </div>
                                    <div className="text-xs text-[#15221A] font-medium break-words [overflow-wrap:anywhere]">
                                      {row.prereqToGrad === 'Yes' ? 'Required' : (row.prereqToGrad || '—')}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 5-Yr Enrollment Bottom Row */}
                              <div className="border-t border-[#E5E9E2] pt-3.5 flex items-center justify-between">
                                <span className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
                                  5-YR ENROLLMENT
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(row.id)}
                                  className="inline-flex items-baseline gap-1 hover:opacity-80 transition-opacity cursor-pointer group"
                                  title="Click to view 5-year enrollment breakdown"
                                >
                                  <span className="text-2xl font-extrabold text-[#1E4D2B] tracking-tight">
                                    {formattedAvg}
                                  </span>
                                  <span className="text-xs text-[#64748B] font-medium">students</span>
                                  <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] group-hover:text-[#1E4D2B] transition-transform ml-0.5 ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              </div>

                              {/* Expandable Chart Drawer inside Card */}
                              {isExpanded && (
                                <div className="mt-3 border-t border-dashed border-[#CBD5E1] bg-[#FAFBF8] rounded-xl p-4">
                                  {row.enrollmentHistory.length === 0 ? (
                                    <p className="text-xs text-[#64748B] italic">No enrollment history records found in Supabase.</p>
                                  ) : (
                                    <EnrollmentTrendline
                                      history={row.enrollmentHistory}
                                      averageEnrollment={row.averageEnrollment}
                                      chartId={`card-${row.id}`}
                                      size="sm"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Table Container — Single View with Full Official CHED Form 1 Titles */
            <div className="w-full overflow-x-auto custom-table-scrollbar border border-[#E2E8F0] rounded-2xl bg-white shadow-xs">
              <table className="w-full text-left border-collapse min-w-[1320px]">
                <thead>
                  {/* Tier 1: Main Section Headers Matching Official CHED Form 1 */}
                  <tr className="bg-[#1E4D2B] text-white text-[11px] font-bold tracking-wider border-b border-[#2b6d3d]">
                    <th scope="col" rowSpan={2} className="py-3 px-3 text-center align-middle font-bold uppercase w-[230px] min-w-[210px] border-r border-[#2b6d3d]">
                      <div>Complete Listing of Program Offerings</div>
                      <div className="text-[9.5px] font-normal text-white/80 lowercase italic capitalize mt-0.5">& Major / Specialization</div>
                    </th>
                    <th scope="col" colSpan={2} className="py-2 px-2 text-center font-bold uppercase border-r border-[#2b6d3d]">
                      Authority to Operate
                    </th>
                    <th scope="col" rowSpan={2} className="py-3 px-2 text-center align-middle font-bold uppercase w-[95px] min-w-[90px] border-r border-[#2b6d3d]">
                      School Year Started
                    </th>
                    <th scope="col" colSpan={2} className="py-2 px-2 text-center font-bold uppercase border-r border-[#2b6d3d]">
                      Research / Data Analysis Courses <span className="text-[9.5px] font-normal text-white/80 lowercase italic capitalize">(If applicable)</span>
                    </th>
                    <th scope="col" colSpan={2} className="py-2 px-2 text-center font-bold uppercase border-r border-[#2b6d3d]">
                      Thesis / Dissertation / Special Project <span className="text-[9.5px] font-normal text-white/80 lowercase italic capitalize">(If applicable)</span>
                    </th>
                    <th scope="col" rowSpan={2} className="py-3 px-2 text-center align-middle font-bold uppercase w-[110px] min-w-[105px]">
                      <div>Past 5-Yr</div>
                      <div>Enrollment</div>
                    </th>
                  </tr>

                  {/* Tier 2: Specific Official Subheaders Matching CHED Excel Form */}
                  <tr className="bg-[#F8FAFC] text-[#475569] text-[10px] font-semibold border-b border-[#CBD5E1]">
                    <th scope="col" className="py-2 px-2.5 text-center leading-tight w-[140px] min-w-[130px] border-r border-[#E2E8F0]">
                      1. Board Reso No. approving offering
                    </th>
                    <th scope="col" className="py-2 px-2.5 text-center leading-tight w-[220px] min-w-[200px] border-r border-[#2b6d3d]">
                      2. COPC No., date issued, & issuing office
                    </th>
                    <th scope="col" className="py-2 px-2.5 text-center leading-tight w-[180px] min-w-[160px] border-r border-[#E2E8F0]">
                      Course Titles & Units
                    </th>
                    <th scope="col" className="py-2 px-2 text-center leading-tight w-[100px] min-w-[95px] border-r border-[#2b6d3d]">
                      Required or Elective?
                    </th>
                    <th scope="col" className="py-2 px-2.5 text-center leading-tight w-[180px] min-w-[160px] border-r border-[#E2E8F0]">
                      Course Title & Units
                    </th>
                    <th scope="col" className="py-2 px-2 text-center leading-tight w-[95px] min-w-[90px] border-r border-[#2b6d3d]">
                      Pre-requisite to Grad.?
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-[#F1F5F9]">
                  {loading && programs.length === 0 ? (
                    // Smooth skeleton rows while initial data resolves
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={`skel-row-${i}`} className="animate-pulse divide-x divide-[#F1F5F9]">
                        <td className="py-3 px-3">
                          <div className="h-3.5 bg-[#EEF1EB] rounded w-4/5 mb-1.5" />
                          <div className="h-2.5 bg-[#F1F5F9] rounded w-1/2" />
                        </td>
                        <td className="py-3 px-2.5"><div className="h-3 bg-[#EEF1EB] rounded w-5/6" /></td>
                        <td className="py-3 px-2.5"><div className="h-3 bg-[#EEF1EB] rounded w-full" /></td>
                        <td className="py-3 px-2"><div className="h-3 bg-[#EEF1EB] rounded w-2/3" /></td>
                        <td className="py-3 px-2.5"><div className="h-3 bg-[#EEF1EB] rounded w-4/5" /></td>
                        <td className="py-3 px-2 text-center"><div className="h-4 bg-[#EEF1EB] rounded-full w-14 mx-auto" /></td>
                        <td className="py-3 px-2.5"><div className="h-3 bg-[#EEF1EB] rounded w-4/5" /></td>
                        <td className="py-3 px-2 text-center"><div className="h-4 bg-[#EEF1EB] rounded-full w-10 mx-auto" /></td>
                        <td className="py-3 px-2 text-center"><div className="h-6 bg-[#EEF1EB] rounded w-14 mx-auto" /></td>
                      </tr>
                    ))
                  ) : Object.keys(groupedPrograms).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#64748B]">
                        No matching programs found.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(groupedPrograms).map(([groupTitle, items]) => (
                      <React.Fragment key={groupTitle}>
                        {/* Group Header Row */}
                        <tr className="bg-[#1E4D2B]/10 border-y border-[#1E4D2B]/20">
                          <td colSpan={9} className="py-2.5 px-4 font-bold text-[#1E4D2B] text-xs">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#E8AE1F] mr-2 shrink-0 align-middle" />
                            <span className="align-middle">{groupTitle}</span>
                          </td>
                        </tr>

                        {/* Program Rows */}
                        {items.map((row) => {
                          const isExpanded = expandedIds.has(row.id);
                          const maxCount = Math.max(1, ...row.enrollmentHistory.map((h) => h.count));
                          const formattedAvg = Number(row.averageEnrollment).toFixed(1);

                          return (
                            <React.Fragment key={row.id}>
                              <tr className={`hover:bg-[#F8FAFC] transition-colors divide-x divide-[#F1F5F9] ${isExpanded ? 'bg-[#FCFDFB]' : ''}`}>
                                {/* Program Name & Major */}
                                <td className="py-3 px-3 align-top">
                                  <div className="font-bold text-[#15221A] text-xs leading-snug break-words">{row.name}</div>
                                  {row.major && (
                                    <div className="text-[11px] text-[#64748B] font-normal mt-0.5 break-words">
                                      {row.majorLink ? (
                                        <GoogleDrivePreviewCell
                                          text={row.major}
                                          explicitUrl={row.majorLink}
                                          explicitFileId={row.majorFileId}
                                          columnType="major"
                                        />
                                      ) : (
                                        <span>{row.major}</span>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Authority to Operate */}
                                <td className="py-3 px-2.5 text-[#334155] font-normal text-[11px] align-top break-words">
                                  {row.authorityLink ? (
                                    <GoogleDrivePreviewCell
                                      text={row.authority}
                                      explicitUrl={row.authorityLink}
                                      explicitFileId={row.authorityFileId}
                                      columnType="authority"
                                    />
                                  ) : (
                                    <span>{row.authority}</span>
                                  )}
                                </td>

                                {/* COPC */}
                                <td className="py-3 px-2.5 align-top break-words">
                                  {renderStatusBadge(row.copcStatus, row.copcRaw, row.copcLink, row.copcFileId)}
                                </td>

                                {/* SY Started */}
                                <td className="py-3 px-2 text-[#475569] text-[11px] align-top text-center break-words">
                                  {row.syStarted}
                                </td>

                                {/* Research Course */}
                                <td className="py-3 px-2.5 text-[#334155] text-[11px] align-top break-words">
                                  {row.researchCourse ? (
                                    <div>
                                      <GoogleDrivePreviewCell text={row.researchCourse} />{' '}
                                      {row.researchUnits ? <span className="text-[#64748B]">({row.researchUnits} units)</span> : null}
                                    </div>
                                  ) : null}
                                </td>

                                {/* Req. / Elec. */}
                                <td className="py-3 px-2 text-center align-top">
                                  {row.researchReqElec ? renderReqElecBadge(row.researchReqElec) : null}
                                </td>

                                {/* Thesis / Dissertation */}
                                <td className="py-3 px-2.5 text-[#334155] text-[11px] align-top break-words">
                                  {row.thesisDissertation ? (
                                    <div>
                                      <GoogleDrivePreviewCell text={row.thesisDissertation} />{' '}
                                      {row.thesisUnits ? <span className="text-[#64748B]">({row.thesisUnits} units)</span> : null}
                                    </div>
                                  ) : null}
                                </td>

                                {/* Prereq. to Grad */}
                                <td className="py-3 px-2 text-center align-top">
                                  {row.prereqToGrad ? renderPrereqBadge(row.prereqToGrad) : null}
                                </td>

                                {/* Average Enrollment */}
                                <td className="py-3 px-2 text-center align-top whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpanded(row.id)}
                                    className="inline-flex items-center justify-between w-full max-w-[76px] bg-[#F4F6F1] border border-[#E2E8F0] text-[#0E3322] font-semibold text-[11px] py-1 px-2 rounded hover:border-[#1E4D2B] transition-all cursor-pointer shadow-2xs whitespace-nowrap mx-auto"
                                    title="Click to view 5-year enrollment breakdown"
                                  >
                                    <span>{formattedAvg}</span>
                                    <ChevronDown className={`w-3 h-3 text-[#64748B] shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                </td>
                              </tr>

                              {/* Expanded 5-Year Enrollment Drawer */}
                              {isExpanded && (
                                <tr className="bg-[#FAFBF8]">
                                  <td colSpan={9} className="p-4 sm:p-6 border-b border-[#E2E8F0]">
                                    <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-xs max-w-4xl mx-auto">
                                      {/* Section Heading with Dot and Dashed Road */}
                                      <div className="flex items-center gap-2.5 mb-8">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F] shrink-0" />
                                        <h4 className="text-sm font-bold text-[#1E4D2B] whitespace-nowrap">
                                          Enrollment, past 5 school years — {row.name} {row.major ? `(${row.major})` : ''}
                                        </h4>
                                        <div className="w-full border-b border-dashed border-[#CBD5E1] ml-2 hidden sm:block" />
                                      </div>

                                      {row.enrollmentHistory.length === 0 ? (
                                        <p className="text-xs text-[#64748B] italic">No year-by-year enrollment breakdown found in Supabase.</p>
                                      ) : (
                                        <div className="w-full mb-6">
                                          <EnrollmentTrendline
                                            history={row.enrollmentHistory}
                                            averageEnrollment={row.averageEnrollment}
                                            chartId={`table-${row.id}`}
                                            size="lg"
                                          />
                                        </div>
                                      )}

                                      {/* Dashed Road Divider */}
                                      <div className="w-full border-b border-dashed border-[#CBD5E1] my-5" />

                                      {/* Footer Average Row */}
                                      <div className="flex items-center justify-between w-full text-sm px-1">
                                        <span className="text-[#64748B] font-medium">5-year average</span>
                                        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FBF1D2] border border-[#E8AE1F]/30">
                                          <span className="text-sm font-bold text-[#1E4D2B]">
                                            Average: {row.averageEnrollment.toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-[#E5E9E2] flex items-center justify-end text-xs text-[#64748B]">
            <span className="font-semibold text-[#1E4D2B]">
              Showing {filteredPrograms.length} of {programs.length} programs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
