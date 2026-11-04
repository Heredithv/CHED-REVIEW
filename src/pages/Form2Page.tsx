import React, { useState, useEffect, useMemo } from 'react';
import { Download, Search, RefreshCw, AlertCircle, ExternalLink, LayoutGrid, Table as TableIcon, GraduationCap, Award, FolderOpen, ChevronDown, CheckCircle2, Briefcase, User } from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { exportForm2ToExcel } from '../utils/excelExport';
import { getSupabaseClient } from '../data/api';
import { GoogleDrivePreviewCell } from '../components/GoogleDrivePreviewCell';
import { DocumentLinkPreview } from '../components/DocumentLinkPreview';

export interface Form2SubjectItem {
  name: string;
  link?: string;
}

export interface Form2FacultyItem {
  id: string;
  name: string;
  campus: string;
  campusCategory: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE';
  department: string;
  academicRank: string;
  rankCategory: 'Professor' | 'Associate Professor' | 'Assistant Professor' | 'Instructor';
  fullTimePermanent: boolean;
  fullTimeContractual: boolean;
  partTime: boolean;
  teachingUndergrad: boolean;
  teachingGrad: boolean;
  bachelorDegree: string;
  masterDegree: string;
  doctorateDegree: string;
  highestDegree: 'Doctorate' | "Master's" | "Bachelor's";
  academicSpecialization: string;
  licenseNo: string;
  licenseNoLink?: string;
  licenseExpiryDate: string;
  professionalExperience: string;
  sy2024_2025: string;
  sy2025_2026: string;
  sy2024_2025_items?: Form2SubjectItem[];
  sy2025_2026_items?: Form2SubjectItem[];
  driveFolderId?: string;
  driveFolderUrl?: string;
  sourceExcelRow?: number;
  photoPath?: string;
}

function getInitials(name: string): string {
  if (!name) return 'JH';
  const parts = name.split(',').map((p) => p.trim());
  if (parts.length >= 2) {
    const lastName = parts[0];
    const firstName = parts[1];
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  }
  const words = name.split(' ').filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Module-level in-memory cache for instant switching
let cachedForm2Faculty: Form2FacultyItem[] | null = null;
let cachedForm2LastSynced: string | null = null;
const FORM2_STORAGE_KEY = 'jhcsc_form2_persistent_v6';

// Helper to parse subject pills from strings like "English 10, English 201"
const parseSubjectPills = (subjStr?: string | null): string[] => {
  if (!subjStr || subjStr.trim() === '—' || subjStr.trim() === '-' || subjStr.trim().toLowerCase() === 'none') {
    return [];
  }
  return subjStr
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
};

// Helper to render license expiration with status indicator
const renderLicenseExpiry = (expiryStr?: string | null) => {
  if (!expiryStr || expiryStr === '—' || expiryStr === '-' || expiryStr.toLowerCase() === 'none') {
    return null;
  }

  const expDate = new Date(expiryStr);
  const now = new Date();
  if (!isNaN(expDate.getTime())) {
    if (expDate < now) {
      return (
        <span className="text-[10px] font-bold text-red-600 inline-flex items-center gap-1">
          <span>✕</span> Expired {expiryStr}
        </span>
      );
    }
    const soon = new Date();
    soon.setMonth(now.getMonth() + 12);
    if (expDate < soon) {
      return (
        <span className="text-[10px] font-semibold text-[#B45309] inline-flex items-center gap-1">
          <span>⚠</span> Expiring {expiryStr}
        </span>
      );
    }
  }

  return (
    <span className="text-[10px] font-medium text-[#475569]">
      Valid until {expiryStr}
    </span>
  );
};

export async function fetchFreshForm2Data(): Promise<Form2FacultyItem[]> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client could not be initialized.');
  }

  // Fast targeted queries: select only needed fields in 2 parallel requests
  const [form2Res, subRes] = await Promise.all([
    client
      .from('form2')
      .select('row_id,faculty_name,campus_name,school_name,academic_rank,is_full_time_permanent,is_full_time_contractual,is_part_time,teaches_undergrad,teaches_grad,bachelors_degree,masters_degree,doctorate_degree,academic_specialization,license_no,license_no_link,license_expiry,professional_experience,faculty_name_link')
      .order('row_id', { ascending: true }),
    client
      .from('form2_faculty_subjects')
      .select('row_id,school_year,subject_name,drive_link')
      .order('id', { ascending: true })
      .limit(3000),
  ]);

  if (form2Res.error) {
    throw new Error(`Failed to load Form 2 faculty: ${form2Res.error.message}`);
  }

  const allSubjectRows = subRes.data || [];
  const subjectsByRowId = new Map<number, { sy24: Form2SubjectItem[]; sy25: Form2SubjectItem[] }>();

  allSubjectRows.forEach((s: any) => {
    const rowIdNum = Number(s.row_id);
    if (isNaN(rowIdNum)) return;
    const rawSubj = String(s.subject_name || '').trim();
    if (!rawSubj || rawSubj.toLowerCase() === 'none' || rawSubj === '—' || rawSubj === '-') return;

    if (!subjectsByRowId.has(rowIdNum)) {
      subjectsByRowId.set(rowIdNum, { sy24: [], sy25: [] });
    }
    const group = subjectsByRowId.get(rowIdNum)!;
    const sy = String(s.school_year || '').trim();
    const targetList = sy.includes('2024')
      ? group.sy24
      : sy.includes('2025')
      ? group.sy25
      : null;

    if (targetList) {
      const linkClean =
        s.drive_link && String(s.drive_link).trim() && String(s.drive_link).trim().toUpperCase() !== 'NULL'
          ? String(s.drive_link).trim()
          : undefined;
      const existing = targetList.find((item) => item.name.toLowerCase() === rawSubj.toLowerCase());
      if (!existing) {
        targetList.push({ name: rawSubj, link: linkClean });
      } else if (!existing.link && linkClean) {
        existing.link = linkClean;
      }
    }
  });

  const cleanVal = (val: string | null | undefined) => {
    if (!val) return '';
    const trimmed = String(val).trim();
    if (trimmed.toUpperCase() === 'EMPTY' || trimmed.toUpperCase() === 'NONE' || trimmed.toUpperCase() === 'NULL' || trimmed === '—' || trimmed === '-') {
      return '';
    }
    return trimmed;
  };

  const mapped: Form2FacultyItem[] = (form2Res.data || []).map((r: any) => {
    const rawCampus = (r.campus_name || 'Main Campus').toLowerCase();
    let campusCat: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE' = 'Main';
    if (rawCampus.includes('pagadian')) campusCat = 'Pagadian';
    else if (rawCampus.includes('dumingag')) campusCat = 'Dumingag';
    else if (rawCampus.includes('cmse')) campusCat = 'CMSE';

    const rawRank = (r.academic_rank || '').toUpperCase();
    let rankCat: 'Professor' | 'Associate Professor' | 'Assistant Professor' | 'Instructor' = 'Instructor';
    if (rawRank.includes('PROFESSOR') && !rawRank.includes('ASSOCIATE') && !rawRank.includes('ASSISTANT') && !rawRank.includes('ASSOSIATE')) {
      rankCat = 'Professor';
    } else if (rawRank.includes('ASSOCIATE') || rawRank.includes('ASSOSIATE')) {
      rankCat = 'Associate Professor';
    } else if (rawRank.includes('ASSISTANT')) {
      rankCat = 'Assistant Professor';
    } else {
      rankCat = 'Instructor';
    }

    const doc = (r.doctorate_degree || '').trim();
    const hasDoctorate = doc && doc.toLowerCase() !== 'none' && doc !== '—' && doc !== '-';
    const mast = (r.masters_degree || '').trim();
    const hasMaster = mast && mast.toLowerCase() !== 'none' && mast !== '—' && mast !== '-';

    let highestDeg: 'Doctorate' | "Master's" | "Bachelor's" = "Bachelor's";
    if (hasDoctorate) highestDeg = 'Doctorate';
    else if (hasMaster) highestDeg = "Master's";

    const rowSubs = subjectsByRowId.get(Number(r.row_id)) || { sy24: [], sy25: [] };

    return {
      id: String(r.row_id),
      name: r.faculty_name || '',
      campus: r.campus_name || 'Main Campus',
      campusCategory: campusCat,
      department: r.school_name || 'General Academic Program',
      academicRank: r.academic_rank || 'Instructor',
      rankCategory: rankCat,
      fullTimePermanent: Boolean(r.is_full_time_permanent),
      fullTimeContractual: Boolean(r.is_full_time_contractual),
      partTime: Boolean(r.is_part_time),
      teachingUndergrad: Boolean(r.teaches_undergrad),
      teachingGrad: Boolean(r.teaches_grad),
      bachelorDegree: cleanVal(r.bachelors_degree),
      masterDegree: cleanVal(r.masters_degree),
      doctorateDegree: cleanVal(r.doctorate_degree),
      highestDegree: highestDeg,
      academicSpecialization: cleanVal(r.academic_specialization),
      licenseNo: cleanVal(r.license_no),
      licenseNoLink: cleanVal(r.license_no_link) || undefined,
      licenseExpiryDate: cleanVal(r.license_expiry),
      professionalExperience: cleanVal(r.professional_experience),
      sy2024_2025: rowSubs.sy24.map((x) => x.name).join(', '),
      sy2025_2026: rowSubs.sy25.map((x) => x.name).join(', '),
      sy2024_2025_items: rowSubs.sy24,
      sy2025_2026_items: rowSubs.sy25,
      driveFolderId: undefined,
      driveFolderUrl: cleanVal(r.faculty_name_link) || undefined,
      sourceExcelRow: r.row_id,
      photoPath: undefined
    };
  });

  cachedForm2Faculty = mapped;
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  cachedForm2LastSynced = nowStr;

  try {
    localStorage.setItem(FORM2_STORAGE_KEY, JSON.stringify(mapped));
    sessionStorage.setItem('jhcsc_form2_cache_v5', JSON.stringify(mapped));
  } catch {}

  return mapped;
}

export async function preloadForm2Data(): Promise<Form2FacultyItem[] | null> {
  if (cachedForm2Faculty && cachedForm2Faculty.length > 0) return cachedForm2Faculty;
  try {
    const stored = (typeof window !== 'undefined' ? localStorage.getItem(FORM2_STORAGE_KEY) : null) ||
                   (typeof window !== 'undefined' ? sessionStorage.getItem('jhcsc_form2_cache_v5') : null);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedForm2Faculty = parsed;
        return parsed;
      }
    }
  } catch {}

  return fetchFreshForm2Data().catch(() => null);
}

export const Form2Page: React.FC = () => {
  const [faculty, setFaculty] = useState<Form2FacultyItem[]>(() => {
    if (cachedForm2Faculty && cachedForm2Faculty.length > 0) {
      return cachedForm2Faculty;
    }
    try {
      const stored = (typeof window !== 'undefined' ? localStorage.getItem(FORM2_STORAGE_KEY) : null) ||
                     (typeof window !== 'undefined' ? sessionStorage.getItem('jhcsc_form2_cache_v5') : null);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedForm2Faculty = parsed;
          return parsed;
        }
      }
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return !(cachedForm2Faculty && cachedForm2Faculty.length > 0);
  });
  const [error, setError] = useState<string | null>(null);
  const [, setLastSynced] = useState<string | null>(() => cachedForm2LastSynced);

  const [selectedCampus, setSelectedCampus] = useState<string>('All campuses');
  const [selectedSchool, setSelectedSchool] = useState<string>('All schools');
  const [selectedRank, setSelectedRank] = useState<string>('All ranks');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const loadSupabaseForm2Data = async (force = false) => {
    // Only set loading true if there is no data at all
    if (force && (!cachedForm2Faculty || cachedForm2Faculty.length === 0)) {
      setLoading(true);
    }
    setError(null);
    try {
      const fresh = await fetchFreshForm2Data();
      if (fresh && fresh.length > 0) {
        setFaculty(fresh);
        setLastSynced(cachedForm2LastSynced);
      }
    } catch (err: any) {
      console.warn('Form 2 data sync notice:', err);
      if (!cachedForm2Faculty || cachedForm2Faculty.length === 0) {
        setError(err?.message || 'Failed to connect to Supabase.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupabaseForm2Data();
  }, []);

  // Filtered faculty list
  const filteredFaculty = useMemo(() => {
    return faculty.filter((f) => {
      // Campus filter
      if (selectedCampus !== 'All campuses') {
        if (selectedCampus === 'Main' && f.campusCategory !== 'Main') return false;
        if (selectedCampus === 'Pagadian' && f.campusCategory !== 'Pagadian') return false;
        if (selectedCampus === 'Dumingag' && f.campusCategory !== 'Dumingag') return false;
        if (selectedCampus === 'CMSE' && f.campusCategory !== 'CMSE') return false;
      }

      // School / Department filter
      if (selectedSchool !== 'All schools' && f.department !== selectedSchool) {
        return false;
      }

      // Rank filter
      if (selectedRank !== 'All ranks' && f.rankCategory !== selectedRank) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(q);
        const matchesDept = f.department.toLowerCase().includes(q);
        const matchesRank = f.academicRank.toLowerCase().includes(q);
        const matchesSpec = f.academicSpecialization.toLowerCase().includes(q);
        const matchesDegree =
          f.bachelorDegree.toLowerCase().includes(q) ||
          f.masterDegree.toLowerCase().includes(q) ||
          f.doctorateDegree.toLowerCase().includes(q);
        if (!matchesName && !matchesDept && !matchesRank && !matchesSpec && !matchesDegree) {
          return false;
        }
      }

      return true;
    });
  }, [faculty, selectedCampus, selectedSchool, selectedRank, searchQuery]);

  // Unique schools list for dropdown
  const schoolsList = useMemo(() => {
    return Array.from(new Set(faculty.map((f) => f.department).filter(Boolean))).sort();
  }, [faculty]);

  // Campus counts for top filter buttons
  const campusCounts = useMemo(() => {
    return {
      all: faculty.length,
      main: faculty.filter((f) => f.campusCategory === 'Main').length,
      dumingag: faculty.filter((f) => f.campusCategory === 'Dumingag').length,
      pagadian: faculty.filter((f) => f.campusCategory === 'Pagadian').length,
      cmse: faculty.filter((f) => f.campusCategory === 'CMSE').length,
    };
  }, [faculty]);

  // Dynamic statistics computed from REAL Supabase data
  const stats = useMemo(() => {
    const total = faculty.length;
    const permanent = faculty.filter((f) => f.fullTimePermanent).length;
    const contractual = faculty.filter((f) => f.fullTimeContractual).length;
    const partTime = faculty.filter((f) => f.partTime).length;
    const doctorate = faculty.filter((f) => f.highestDegree === 'Doctorate').length;
    const master = faculty.filter((f) => f.highestDegree === "Master's").length;
    const bachelor = faculty.filter((f) => f.highestDegree === "Bachelor's").length;

    const docRate = total > 0 ? Math.round((doctorate / total) * 100) : 0;
    const mastRate = total > 0 ? Math.round((master / total) * 100) : 0;
    const advancedCount = doctorate + master;
    const advancedRate = total > 0 ? Number(((advancedCount / total) * 100).toFixed(1)) : 0;

    // Ranks distribution (Standard institutional academic ranks)
    const profCount = faculty.filter((f) => f.rankCategory === 'Professor').length;
    const assocCount = faculty.filter((f) => f.rankCategory === 'Associate Professor').length;
    const asstCount = faculty.filter((f) => f.rankCategory === 'Assistant Professor').length;
    const instCount = faculty.filter((f) => f.rankCategory === 'Instructor').length;

    const maxRank = Math.max(1, profCount, assocCount, asstCount, instCount);
    const departmentCount = new Set(faculty.map((f) => f.department).filter(Boolean)).size;

    return {
      total,
      permanent,
      contractual,
      partTime,
      doctorate,
      master,
      bachelor,
      docRate,
      mastRate,
      advancedCount,
      advancedRate,
      departmentCount,
      ranks: [
        { label: 'Professor', count: profCount, pct: Math.round((profCount / maxRank) * 100) },
        { label: 'Associate Professor', count: assocCount, pct: Math.round((assocCount / maxRank) * 100) },
        { label: 'Assistant Professor', count: asstCount, pct: Math.round((asstCount / maxRank) * 100) },
        { label: 'Instructor', count: instCount, pct: Math.round((instCount / maxRank) * 100) }
      ],
      degrees: [
        { label: 'Doctorate Degree', count: doctorate, pct: total > 0 ? Math.round((doctorate / total) * 100) : 0 },
        { label: "Master's Degree", count: master, pct: total > 0 ? Math.round((master / total) * 100) : 0 },
        { label: "Bachelor's Degree", count: bachelor, pct: total > 0 ? Math.round((bachelor / total) * 100) : 0 }
      ]
    };
  }, [faculty]);

  // Group faculty by Campus then by Department matching Image 1
  const groupedHierarchy = useMemo(() => {
    const campusOrder = ['Main Campus', 'Pagadian Campus', 'Dumingag Campus', 'CMSE Campus'];
    const groups: Record<string, Record<string, Form2FacultyItem[]>> = {};

    filteredFaculty.forEach((item) => {
      const camp = item.campus || 'Main Campus';
      const dept = item.department || 'General Academic Program';

      if (!groups[camp]) groups[camp] = {};
      if (!groups[camp][dept]) groups[camp][dept] = [];

      groups[camp][dept].push(item);
    });

    // Sort campuses according to standard institutional order
    const sortedGroups: Record<string, Record<string, Form2FacultyItem[]>> = {};
    campusOrder.forEach((c) => {
      if (groups[c]) sortedGroups[c] = groups[c];
    });
    // Add any remaining campuses
    Object.keys(groups).forEach((c) => {
      if (!sortedGroups[c]) sortedGroups[c] = groups[c];
    });

    return sortedGroups;
  }, [filteredFaculty]);

  return (
    <div className="bg-[#FAFBF8] min-h-screen pb-20">
      {/* Institutional Hero Band */}
      <InnerHeroBand
        breadcrumb="Form 2"
        title="Faculty Profile"
        subtitle="Complete listing of full-time faculty across all campuses: academic rank, employment status, teaching assignments, educational background, and subject assignments."
      />

      {/* Main Container — Exact max-w-[1360px] matching Form 1 */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        {/* Real Dynamic Stats Overlay Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {loading ? '...' : stats.total}
            </div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">Total full-time faculty</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {loading ? '...' : stats.doctorate}
            </div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">With doctorate degree</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {loading ? '...' : stats.master}
            </div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">With master's degree</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {loading ? '...' : stats.departmentCount}
            </div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">Academic departments</div>
          </div>
        </div>

        {/* Visual Metric Progress Cards — Computed from Supabase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card 1: By Academic Rank */}
          <div className="bg-white border border-[#E5E9E2] rounded-[22px] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F] shrink-0" />
                <h3 className="text-sm font-bold text-[#15221A]">By academic rank</h3>
              </div>
              <div className="w-full border-b border-dashed border-[#CBD5E1] mb-5" />

              <div className="space-y-3.5 text-xs">
                {stats.ranks.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4">
                    <span className="text-[#334155] font-semibold w-40 shrink-0">{item.label}</span>
                    <div className="flex-1 h-2.5 bg-[#EEF1EB] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1E4D2B] rounded-full transition-all duration-500"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <span className="font-extrabold text-[#15221A] text-sm w-8 text-right shrink-0">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
              <span className="text-xs font-bold text-[#0E3322]">Total Evaluated Faculty</span>
              <span className="text-sm font-extrabold text-[#1E4D2B] bg-[#F4F6F1] px-3.5 py-1 rounded-full border border-[#E2E8F0]">
                {stats.total}
              </span>
            </div>
          </div>

          {/* Card 2: By Highest Degree Earned */}
          <div className="bg-white border border-[#E5E9E2] rounded-[22px] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F] shrink-0" />
                <h3 className="text-sm font-bold text-[#15221A]">By highest degree earned</h3>
              </div>
              <div className="w-full border-b border-dashed border-[#CBD5E1] mb-5" />

              <div className="space-y-4 text-xs">
                {stats.degrees.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4">
                    <span className="text-[#334155] font-semibold w-40 shrink-0">{item.label}</span>
                    <div className="flex-1 h-2.5 bg-[#EEF1EB] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1E4D2B] rounded-full transition-all duration-500"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <span className="font-extrabold text-[#15221A] text-sm w-8 text-right shrink-0">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#0E3322] block">Postgraduate Faculty Total</span>
                <span className="text-[11px] text-[#64748B]">Doctorate &amp; Master&apos;s degree holders</span>
              </div>
              <span className="text-sm font-extrabold text-[#1E4D2B] bg-[#F4F6F1] px-3.5 py-1 rounded-full border border-[#E2E8F0]">
                {stats.advancedCount} of {stats.total}
              </span>
            </div>
          </div>
        </div>

        {/* Faculty Directory Main Card — Exact same radius, padding, and width as Form 1 */}
        <div className="bg-white border border-[#E5E9E2] rounded-[24px] p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)]">
          {/* Card Title and Subtitle matching Form 1 */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F]" />
                <h2 className="text-2xl font-bold text-[#15221A]">Faculty Directory</h2>
              </div>
            </div>
            <p className="text-xs text-[#64748B] pl-5">
              Complete inventory of J.H. Cerilles State College’s full-time faculty across all campuses, ranks, teaching assignments, educational background, licenses, and subject assignments.
            </p>
          </div>

          <div className="w-full border-b border-dashed border-[#CBD5E1] mb-6" />

          {/* Filter Bar — Matching Screenshot Layout */}
          <div className="space-y-4 mb-8">
            {/* Top Row: Campus Pills on Left, All schools + All ranks on Right */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Campus Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'All campuses', label: 'All campuses', count: campusCounts.all },
                  { id: 'Main', label: 'Main', count: campusCounts.main },
                  { id: 'Dumingag', label: 'Dumingag', count: campusCounts.dumingag },
                  { id: 'Pagadian', label: 'Pagadian', count: campusCounts.pagadian },
                  { id: 'CMSE', label: 'CMSE', count: campusCounts.cmse },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCampus(c.id)}
                    type="button"
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-2 ${
                      selectedCampus === c.id
                        ? 'bg-[#0E3322] text-white shadow-xs'
                        : 'bg-white border border-[#E5E9E2] text-[#475569] hover:bg-[#F4F6F1]'
                    }`}
                  >
                    <span>{c.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        selectedCampus === c.id ? 'bg-white/20 text-white' : 'bg-[#EEF1EB] text-[#64748B]'
                      }`}
                    >
                      {c.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Right Side Dropdowns: All schools + All ranks */}
              <div className="flex items-center gap-2.5">
                {/* All schools Dropdown */}
                <div className="relative inline-block">
                  <select
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    className="appearance-none bg-white text-[#475569] hover:bg-[#F4F6F1] text-xs font-medium py-1.5 pl-3.5 pr-8 rounded-full border border-[#E5E9E2] focus:ring-2 focus:ring-[#1E4D2B] cursor-pointer shadow-2xs"
                  >
                    <option value="All schools">All schools</option>
                    {schoolsList.map((school) => (
                      <option key={school} value={school}>
                        {school}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#64748B]">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* All ranks Dropdown — matching exact width of View spreadsheet button */}
                <div className="relative inline-block w-[150px]">
                  <select
                    value={selectedRank}
                    onChange={(e) => setSelectedRank(e.target.value)}
                    className="w-full appearance-none bg-white text-[#475569] hover:bg-[#F4F6F1] text-xs font-medium py-1.5 pl-3.5 pr-8 rounded-full border border-[#E5E9E2] focus:ring-2 focus:ring-[#1E4D2B] cursor-pointer shadow-2xs truncate"
                  >
                    <option value="All ranks">All ranks</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Instructor">Instructor</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#64748B]">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Search Faculty Input (Left) aligned with Cards | Table and View Spreadsheet (Right) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5 flex-1 min-w-[260px] max-w-xl">
                {/* Search faculty input */}
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search faculty..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-[#E5E9E2] rounded-full focus:outline-none focus:border-[#1E4D2B] shadow-2xs placeholder:text-[#94A3B8]"
                  />
                </div>

                {/* Active Filter Clear */}
                {(selectedCampus !== 'All campuses' || selectedSchool !== 'All schools' || selectedRank !== 'All ranks' || searchQuery.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCampus('All campuses');
                      setSelectedSchool('All schools');
                      setSelectedRank('All ranks');
                      setSearchQuery('');
                    }}
                    className="text-xs text-[#1E4D2B] hover:underline font-semibold cursor-pointer pl-1 whitespace-nowrap"
                  >
                    Reset filters
                  </button>
                )}
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
                    title="Present faculty as profile cards"
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
                  href="https://docs.google.com/spreadsheets/d/13XdBQQ5rvOwpQUHzYQvEBb3loNHzHY4W1m4fCSpUiAE/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 w-[150px] border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs rounded-full hover:bg-[#1E4D2B]/5 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span>View spreadsheet</span>
                </a>
              </div>
            </div>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Indicator (only on first cold boot) */}
          {loading && faculty.length === 0 && (
            <div className="py-16 text-center text-xs text-[#64748B]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#1E4D2B] mb-2" />
              Loading real faculty records from Supabase...
            </div>
          )}

          {/* CARDS VIEW — Faculty Profile Cards organized by Campus & Department */}
          {viewMode === 'cards' && (!loading || faculty.length > 0) && (
            Object.keys(groupedHierarchy).length === 0 ? (
              <div className="py-16 text-center text-xs text-[#64748B]">
                No matching faculty found.
              </div>
            ) : (
              <div className="space-y-12">
                {Object.entries(groupedHierarchy).map(([campusName, departments]) => (
                  <div key={campusName} className="space-y-10">
                    {Object.entries(departments).map(([deptName, facultyList]) => (
                      <div key={deptName} className="space-y-5">
                        {/* Section Heading: ● Main Campus — School of Teacher Education 39 faculty ---------------- */}
                        <div className="flex items-center gap-2.5 w-full pt-2 pb-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F] shrink-0" />
                          <h3 className="font-display font-bold text-base sm:text-lg text-[#0E3322] tracking-tight whitespace-nowrap">
                            {campusName} — {deptName}
                          </h3>
                          <span className="text-xs font-normal text-[#64748B] shrink-0">
                            {facultyList.length} faculty
                          </span>
                          <div className="flex-1 border-t border-dashed border-[#BCC7B9] ml-2 hidden sm:block" />
                        </div>

                        {/* Cards Grid — Responsive compact layout with brand styling */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                          {facultyList.map((f) => {
                            const sy24Items: Form2SubjectItem[] =
                              f.sy2024_2025_items && f.sy2024_2025_items.length > 0
                                ? f.sy2024_2025_items
                                : parseSubjectPills(f.sy2024_2025).map((name) => ({ name }));
                            const sy25Items: Form2SubjectItem[] =
                              f.sy2025_2026_items && f.sy2025_2026_items.length > 0
                                ? f.sy2025_2026_items
                                : parseSubjectPills(f.sy2025_2026).map((name) => ({ name }));
                            const isLicensed = Boolean(
                              f.licenseNo &&
                              f.licenseNo !== '—' &&
                              f.licenseNo !== '-' &&
                              f.licenseNo.toLowerCase() !== 'none' &&
                              f.licenseNo.toLowerCase() !== 'not listed'
                            );

                            return (
                              <div
                                key={f.id}
                                data-program-card="true"
                                className="bg-white border border-[#BCC7B9]/50 rounded-[20px_20px_6px_20px] overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col sm:flex-row min-w-0"
                              >
                                {/* Left Column: Faculty Photo & Clear Stacked Badges */}
                                <div className="w-full sm:w-36 md:w-40 shrink-0 p-3.5 bg-[#FAFBF8] border-b sm:border-b-0 sm:border-r border-[#E5E9E2] flex flex-col items-center justify-start gap-2.5">
                                  {/* Compact Photo Frame Container */}
                                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-[#E3EFE8] border border-[#BCC7B9]/60 flex flex-col items-center justify-center p-2 text-center overflow-hidden relative shadow-2xs">
                                    {f.photoPath ? (
                                      <img
                                        src={f.photoPath}
                                        alt={f.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover rounded-lg"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="flex flex-col items-center justify-center text-[#1E4D2B]">
                                        <User className="w-8 h-8 stroke-[1.5] text-[#1E4D2B]" />
                                        <span className="text-[10px] font-semibold mt-0.5 text-[#1E4D2B]">
                                          Faculty photo
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Appointment Status Pill — Brand Board Colors (#E3EFE8 + #1E4D2B) */}
                                  {f.fullTimePermanent ? (
                                    <div className="inline-flex items-center justify-center gap-1 w-full py-1 px-2.5 rounded-full text-[11px] font-semibold bg-[#E3EFE8] text-[#1E4D2B] border border-[#BCC7B9]/60">
                                      <Briefcase className="w-3 h-3 text-[#1E4D2B] shrink-0" />
                                      <span>Permanent</span>
                                    </div>
                                  ) : f.fullTimeContractual ? (
                                    <div className="inline-flex items-center justify-center gap-1 w-full py-1 px-2.5 rounded-full text-[11px] font-semibold bg-[#F4F6F1] text-[#15221A] border border-[#BCC7B9]">
                                      <Briefcase className="w-3 h-3 text-[#475569] shrink-0" />
                                      <span>Contractual</span>
                                    </div>
                                  ) : f.partTime ? (
                                    <div className="inline-flex items-center justify-center gap-1 w-full py-1 px-2.5 rounded-full text-[11px] font-semibold bg-[#F4F6F1] text-[#15221A] border border-[#BCC7B9]">
                                      <Briefcase className="w-3 h-3 text-[#475569] shrink-0" />
                                      <span>Part-Time</span>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center justify-center gap-1 w-full py-1 px-2.5 rounded-full text-[11px] font-semibold bg-[#F4F6F1] text-[#15221A] border border-[#BCC7B9]">
                                      <Briefcase className="w-3 h-3 text-[#475569] shrink-0" />
                                      <span>Faculty</span>
                                    </div>
                                  )}

                                  {/* Teaching Assignment Section */}
                                  <div className="w-full flex flex-col gap-1 pt-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748B] text-center block">
                                      Teaching Assignment
                                    </span>
                                    {f.teachingUndergrad && (
                                      <span className="inline-flex items-center justify-center gap-1 w-full py-0.5 px-2 rounded-full text-[10px] font-medium bg-white text-[#15221A] border border-[#BCC7B9] shadow-2xs">
                                        <GraduationCap className="w-3 h-3 text-[#1E4D2B] shrink-0" />
                                        <span>Undergrad</span>
                                      </span>
                                    )}
                                    {f.teachingGrad && (
                                      <span className="inline-flex items-center justify-center gap-1 w-full py-0.5 px-2 rounded-full text-[10px] font-semibold bg-[#0E3322] text-[#F5F2E6] shadow-2xs">
                                        <GraduationCap className="w-3 h-3 text-[#E8AE1F] shrink-0" />
                                        <span>Graduate</span>
                                      </span>
                                    )}
                                    {!f.teachingUndergrad && !f.teachingGrad && (
                                      <span className="inline-flex items-center justify-center gap-1 w-full py-0.5 px-2 rounded-full text-[10px] font-medium bg-white text-[#64748B] border border-[#BCC7B9]">
                                        <GraduationCap className="w-3 h-3 text-[#64748B] shrink-0" />
                                        <span>Undergrad</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Right Column: Compact Faculty Details */}
                                <div className="flex-1 p-3.5 sm:p-4.5 flex flex-col justify-between space-y-3">
                                  <div className="space-y-3">
                                    {/* Header: Name, Academic Rank, School & Licensed Status */}
                                    <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-[#F1F5F9]">
                                      <div>
                                        <h4 className="font-display font-bold text-[#15221A] text-base sm:text-lg leading-tight">
                                          {f.name}
                                        </h4>
                                        <div className="text-xs font-semibold text-[#1E4D2B] mt-0.5">
                                          {f.academicRank}
                                        </div>
                                        <div className="text-[11px] text-[#64748B] mt-0.5">
                                          {f.department || deptName}
                                        </div>
                                      </div>

                                      {/* Licensed Badge — Brand Board Colors (#E3EFE8 + #1E4D2B) */}
                                      {isLicensed && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E3EFE8] text-[#1E4D2B] border border-[#BCC7B9]/60 shrink-0">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1E4D2B]" />
                                          <span>Licensed</span>
                                        </span>
                                      )}
                                    </div>

                                    {/* Educational Background */}
                                    <div className="space-y-1">
                                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#64748B] block">
                                        EDUCATIONAL BACKGROUND
                                      </span>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                        <div>
                                          <span className="text-[10px] font-semibold text-[#64748B] block">
                                            Bachelor&apos;s
                                          </span>
                                          <p className="text-[11px] text-[#15221A] font-medium leading-snug mt-0.5">
                                            {f.bachelorDegree || '—'}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-[10px] font-semibold text-[#64748B] block">
                                            Master&apos;s
                                          </span>
                                          <p className="text-[11px] text-[#15221A] font-medium leading-snug mt-0.5">
                                            {f.masterDegree || '—'}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-[10px] font-semibold text-[#64748B] block">
                                            Doctorate
                                          </span>
                                          <p
                                            className={`text-[11px] leading-snug mt-0.5 ${
                                              f.doctorateDegree &&
                                              f.doctorateDegree.toLowerCase() !== 'none' &&
                                              f.doctorateDegree !== '—'
                                                ? 'text-[#15221A] font-medium'
                                                : 'text-[#94A3B8] italic'
                                            }`}
                                          >
                                            {f.doctorateDegree || 'None'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="border-b border-[#F1F5F9]" />

                                    {/* Specialization & License No. Row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                      <div>
                                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#64748B] block">
                                          SPECIALIZATION
                                        </span>
                                        <p className="text-[11.5px] font-bold text-[#15221A] mt-0.5">
                                          {f.academicSpecialization || 'General Education'}
                                        </p>
                                      </div>

                                      <div className="min-w-0">
                                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#64748B] block">
                                          LICENSE NO.
                                        </span>
                                        <div className="text-[11.5px] mt-0.5 break-words [overflow-wrap:anywhere]">
                                          {isLicensed ? (
                                            <div>
                                              {f.licenseNoLink ? (
                                                <GoogleDrivePreviewCell
                                                  text={f.licenseNo}
                                                  explicitUrl={f.licenseNoLink}
                                                  className="font-bold text-[#1E4D2B]"
                                                />
                                              ) : (
                                                <span className="font-bold text-[#15221A]">{f.licenseNo}</span>
                                              )}
                                              {f.licenseExpiryDate && (
                                                <span className="text-[#64748B] font-normal">
                                                  {' '}· valid until {f.licenseExpiryDate}
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-[#94A3B8] italic font-normal">Not listed</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="border-b border-[#F1F5F9]" />

                                    {/* Subject Assignments (from form2_faculty_subjects) */}
                                    <div className="space-y-1.5 text-xs min-w-0">
                                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#64748B] block">
                                        SUBJECT ASSIGNMENTS
                                      </span>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0">
                                        <div className="min-w-0">
                                          <span className="text-[10px] font-semibold text-[#64748B] block mb-1">
                                            SY 2024–2025
                                          </span>
                                          {sy24Items.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                              {sy24Items.map((subj, idx) =>
                                                subj.link ? (
                                                  <DocumentLinkPreview
                                                    key={idx}
                                                    url={subj.link}
                                                    title={`${f.name} — ${subj.name} (SY 2024–2025)`}
                                                  >
                                                    <a
                                                      href={subj.link}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="bg-[#FBF1D2] hover:bg-[#f6e4b0] text-[#854D0E] border border-[#E8AE1F]/40 px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                                    >
                                                      <span>{subj.name}</span>
                                                      <ExternalLink className="w-2.5 h-2.5 text-[#854D0E]/75 shrink-0" />
                                                    </a>
                                                  </DocumentLinkPreview>
                                                ) : (
                                                  <span
                                                    key={idx}
                                                    className="bg-[#FBF1D2] text-[#854D0E] border border-[#E8AE1F]/30 px-2 py-0.5 rounded text-[10px] font-semibold inline-block"
                                                  >
                                                    {subj.name}
                                                  </span>
                                                )
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-[11px] text-[#94A3B8] italic">—</span>
                                          )}
                                        </div>

                                        <div className="min-w-0">
                                          <span className="text-[10px] font-semibold text-[#64748B] block mb-1">
                                            SY 2025–2026
                                          </span>
                                          {sy25Items.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                              {sy25Items.map((subj, idx) =>
                                                subj.link ? (
                                                  <DocumentLinkPreview
                                                    key={idx}
                                                    url={subj.link}
                                                    title={`${f.name} — ${subj.name} (SY 2025–2026)`}
                                                  >
                                                    <a
                                                      href={subj.link}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="bg-[#FBF1D2] hover:bg-[#f6e4b0] text-[#854D0E] border border-[#E8AE1F]/40 px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                                    >
                                                      <span>{subj.name}</span>
                                                      <ExternalLink className="w-2.5 h-2.5 text-[#854D0E]/75 shrink-0" />
                                                    </a>
                                                  </DocumentLinkPreview>
                                                ) : (
                                                  <span
                                                    key={idx}
                                                    className="bg-[#FBF1D2] text-[#854D0E] border border-[#E8AE1F]/30 px-2 py-0.5 rounded text-[10px] font-semibold inline-block"
                                                  >
                                                    {subj.name}
                                                  </span>
                                                )
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-[11px] text-[#94A3B8] italic">—</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Supporting Evidence Button */}
                                  <div className="pt-1">
                                    {f.driveFolderUrl ? (
                                      <div className="w-full [&>span]:w-full">
                                        <DocumentLinkPreview url={f.driveFolderUrl} title={`${f.name} — Supporting Evidence`}>
                                          <a
                                            href={f.driveFolderUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-white bg-[#1E4D2B] hover:bg-[#0E3322] border border-[#1E4D2B] rounded-xl transition-all duration-200 cursor-pointer shadow-2xs"
                                          >
                                            <FolderOpen className="w-3.5 h-3.5 text-white" />
                                            <span>Open supporting evidence folder</span>
                                          </a>
                                        </DocumentLinkPreview>
                                      </div>
                                    ) : (
                                      <div className="text-center text-[10px] text-[#94A3B8] italic py-1 border border-dashed border-[#BCC7B9] rounded-xl">
                                        No credentials folder linked
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )
          )}

          {/* TABLE VIEW — Complete CHED Form 2 matching Image 1 */}
          {viewMode === 'table' && (!loading || faculty.length > 0) && (
            <div className="w-full overflow-x-auto custom-table-scrollbar border border-[#E2E8F0] rounded-xl">
              <table className="w-full text-left border-collapse min-w-[1580px]">
                <thead>
                  {/* Tier 1: Main Section Headers Matching Official CHED Form 2 */}
                  <tr className="bg-[#1E4D2B] text-white text-[10px] font-bold uppercase tracking-wider divide-x divide-[#2b6d3d] border-b border-[#1E4D2B]">
                    <th scope="col" rowSpan={2} className="py-2.5 px-3 text-center align-middle font-bold min-w-[200px]">
                      Complete Listing of Faculty
                      <div className="text-[9px] font-normal text-white/80 lowercase italic capitalize mt-0.5">
                        (Last Name, First Name)
                      </div>
                    </th>
                    <th scope="col" rowSpan={2} className="py-2.5 px-3 text-center align-middle font-bold min-w-[150px]">
                      Academic Rank
                    </th>
                    <th scope="col" colSpan={3} className="py-1.5 px-2 text-center font-bold">
                      Employment Status
                    </th>
                    <th scope="col" colSpan={2} className="py-1.5 px-2 text-center font-bold">
                      Teaching Assignment
                    </th>
                    <th scope="col" colSpan={3} className="py-1.5 px-3 text-center font-bold">
                      Educational Background
                      <div className="text-[9px] font-normal text-white/80 lowercase italic capitalize mt-0.5">
                        (Full name of the program)
                      </div>
                    </th>
                    <th scope="col" rowSpan={2} className="py-2.5 px-3 text-center align-middle font-bold min-w-[150px]">
                      Academic Specialization
                    </th>
                    <th scope="col" colSpan={2} className="py-1.5 px-2 text-center font-bold">
                      Licensed <span className="text-[9px] font-normal text-white/80 lowercase italic capitalize">(If applicable)</span>
                    </th>
                    <th scope="col" rowSpan={2} className="py-2.5 px-2 text-center align-middle font-bold min-w-[100px]">
                      Professional Experience
                    </th>
                    <th scope="col" colSpan={2} className="py-1.5 px-3 text-center font-bold">
                      Specific Subject Assignments (Past 2 School Years)
                    </th>
                  </tr>

                  {/* Tier 2: Specific Official Subheaders Matching Image 1 */}
                  <tr className="bg-[#F8FAFC] text-[#475569] text-[9.5px] font-semibold divide-x divide-[#E2E8F0] border-b border-[#CBD5E1]">
                    <th scope="col" className="py-1.5 px-2 text-center min-w-[45px]">Perm.</th>
                    <th scope="col" className="py-1.5 px-2 text-center min-w-[45px]">Cont.</th>
                    <th scope="col" className="py-1.5 px-2 text-center min-w-[45px]">Part-Time</th>
                    <th scope="col" className="py-1.5 px-2 text-center min-w-[55px]">Undergrad</th>
                    <th scope="col" className="py-1.5 px-2 text-center min-w-[55px]">Grad</th>
                    <th scope="col" className="py-1.5 px-3 text-center min-w-[160px]">Bachelor&apos;s</th>
                    <th scope="col" className="py-1.5 px-3 text-center min-w-[160px]">Master&apos;s</th>
                    <th scope="col" className="py-1.5 px-3 text-center min-w-[160px]">Doctorate</th>
                    <th scope="col" className="py-1.5 px-2 text-center min-w-[90px]">No.</th>
                    <th scope="col" className="py-1.5 px-2 text-center min-w-[90px]">Expiry Date</th>
                    <th scope="col" className="py-1.5 px-3 text-center min-w-[150px]">SY 2024-2025</th>
                    <th scope="col" className="py-1.5 px-3 text-center min-w-[150px]">SY 2025-2026</th>
                  </tr>
                </thead>

                <tbody className="text-xs divide-y divide-[#F1F5F9]">
                  {Object.keys(groupedHierarchy).length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-10 text-center text-[#64748B]">
                        No matching faculty found.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(groupedHierarchy).map(([campusName, departments]) => (
                      <React.Fragment key={campusName}>
                        {/* Level 1: Campus Header Row */}
                        <tr className="bg-[#FAFBF8] border-y border-[#BCC7B9]/60">
                          <td colSpan={16} className="py-2.5 px-4 font-bold text-[#0E3322] text-xs uppercase tracking-wide">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#E8AE1F] mr-2 shrink-0 align-middle" />
                            <span className="align-middle">{campusName}</span>
                          </td>
                        </tr>

                        {Object.entries(departments).map(([deptName, facultyList]) => (
                          <React.Fragment key={deptName}>
                            {/* Level 2: Green Department Header Row matching Image 1 */}
                            <tr className="bg-[#1E4D2B]/10 border-b border-[#1E4D2B]/20">
                              <td colSpan={16} className="py-1.5 px-3 font-bold text-[#1E4D2B] text-xs">
                                ▸ {deptName}
                              </td>
                            </tr>

                            {/* Faculty Rows */}
                            {facultyList.map((f) => (
                              <tr key={f.id} className="hover:bg-[#F8FAFC] transition-colors divide-x divide-[#F1F5F9]">
                                {/* Faculty Name & Evidence Folder Link */}
                                <td className="py-2.5 px-3 align-top font-bold text-[#15221A] text-xs break-words">
                                  {f.driveFolderUrl ? (
                                    <GoogleDrivePreviewCell
                                      text={f.name}
                                      explicitUrl={f.driveFolderUrl}
                                      columnType="major"
                                    />
                                  ) : (
                                    <span>{f.name}</span>
                                  )}
                                </td>

                                {/* Academic Rank */}
                                <td className="py-2.5 px-3 align-top text-[#334155] text-xs break-words">
                                  {f.academicRank}
                                </td>

                                {/* Employment Status */}
                                <td className="py-2.5 px-2 text-center align-top text-[#166534] font-bold text-xs">
                                  {f.fullTimePermanent ? '✓' : ''}
                                </td>
                                <td className="py-2.5 px-2 text-center align-top text-[#166534] font-bold text-xs">
                                  {f.fullTimeContractual ? '✓' : ''}
                                </td>
                                <td className="py-2.5 px-2 text-center align-top text-[#166534] font-bold text-xs">
                                  {f.partTime ? '✓' : ''}
                                </td>

                                {/* Teaching Assignment */}
                                <td className="py-2.5 px-2 text-center align-top text-[#166534] font-bold text-xs">
                                  {f.teachingUndergrad ? '✓' : ''}
                                </td>
                                <td className="py-2.5 px-2 text-center align-top text-[#166534] font-bold text-xs">
                                  {f.teachingGrad ? '✓' : ''}
                                </td>

                                {/* Educational Background */}
                                <td className="py-2.5 px-3 align-top text-[#334155] text-[11px] leading-snug break-words">
                                  {f.bachelorDegree || '—'}
                                </td>
                                <td className="py-2.5 px-3 align-top text-[#334155] text-[11px] leading-snug break-words">
                                  {f.masterDegree || '—'}
                                </td>
                                <td className="py-2.5 px-3 align-top text-[#334155] text-[11px] leading-snug break-words">
                                  {f.doctorateDegree || '—'}
                                </td>

                                {/* Academic Specialization */}
                                <td className="py-2.5 px-3 align-top text-[#334155] text-[11px] leading-snug break-words">
                                  {f.academicSpecialization || '—'}
                                </td>

                                {/* Licensed */}
                                <td className="py-2.5 px-2 text-center align-top text-[#334155] text-[11px] break-words">
                                  {f.licenseNo ? (
                                    f.licenseNoLink ? (
                                      <GoogleDrivePreviewCell
                                        text={f.licenseNo}
                                        explicitUrl={f.licenseNoLink}
                                      />
                                    ) : (
                                      <span>{f.licenseNo}</span>
                                    )
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="py-2.5 px-2 text-center align-top text-[#334155] text-[11px] break-words">
                                  {f.licenseExpiryDate || '—'}
                                </td>

                                {/* Professional Experience */}
                                <td className="py-2.5 px-2 align-top text-[#64748B] text-[11px] break-words">
                                  {f.professionalExperience || '—'}
                                </td>

                                {/* Specific Subject Assignments: SY 2024-2025 */}
                                <td className="py-2.5 px-3 align-top text-[#334155] text-[11px] leading-snug break-words">
                                  {f.sy2024_2025_items && f.sy2024_2025_items.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {f.sy2024_2025_items.map((subj, idx) =>
                                        subj.link ? (
                                          <GoogleDrivePreviewCell
                                            key={idx}
                                            text={idx < f.sy2024_2025_items!.length - 1 ? `${subj.name},` : subj.name}
                                            explicitUrl={subj.link}
                                          />
                                        ) : (
                                          <span key={idx}>
                                            {subj.name}
                                            {idx < f.sy2024_2025_items!.length - 1 ? ',' : ''}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    f.sy2024_2025 || '—'
                                  )}
                                </td>

                                {/* Specific Subject Assignments: SY 2025-2026 */}
                                <td className="py-2.5 px-3 align-top text-[#334155] text-[11px] leading-snug break-words">
                                  {f.sy2025_2026_items && f.sy2025_2026_items.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {f.sy2025_2026_items.map((subj, idx) =>
                                        subj.link ? (
                                          <GoogleDrivePreviewCell
                                            key={idx}
                                            text={idx < f.sy2025_2026_items!.length - 1 ? `${subj.name},` : subj.name}
                                            explicitUrl={subj.link}
                                          />
                                        ) : (
                                          <span key={idx}>
                                            {subj.name}
                                            {idx < f.sy2025_2026_items!.length - 1 ? ',' : ''}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    f.sy2025_2026 || '—'
                                  )}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
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
              Showing {filteredFaculty.length} of {faculty.length} faculty
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
