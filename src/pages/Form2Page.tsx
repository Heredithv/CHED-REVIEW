import React, { useState, useEffect, useMemo } from 'react';
import { Download, Search, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { exportForm2ToExcel } from '../utils/excelExport';
import { getSupabaseClient } from '../data/api';
import { GoogleDrivePreviewCell } from '../components/GoogleDrivePreviewCell';

export interface Form2FacultyItem {
  id: string;
  name: string;
  campus: string;
  campusCategory: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE';
  department: string;
  academicRank: string;
  rankCategory: 'Professor' | 'Associate Professor' | 'Assistant Professor' | 'Instructor' | 'Lecturer / Others';
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
  licenseExpiryDate: string;
  professionalExperience: string;
  sy2024_2025: string;
  sy2025_2026: string;
  driveFolderId?: string;
  driveFolderUrl?: string;
  sourceExcelRow?: number;
}

export const Form2Page: React.FC = () => {
  const [faculty, setFaculty] = useState<Form2FacultyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCampus, setSelectedCampus] = useState<string>('All campuses');
  const [selectedRank, setSelectedRank] = useState<string>('All ranks');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadSupabaseForm2Data = async () => {
    setLoading(true);
    setError(null);
    try {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Supabase client could not be initialized.');
      }

      // 1. Fetch profiles, evidence folders, and subject assignments in parallel
      const [facRes, folderRes, subRes] = await Promise.all([
        client
          .from('form2_faculty_profiles')
          .select('*')
          .order('source_excel_row', { ascending: true }),
        client.from('form2_faculty_drive_folders').select('*'),
        client.from('form2_subject_assignments').select('*')
      ]);

      if (facRes.error) {
        throw new Error(`Failed to load faculty profiles: ${facRes.error.message}`);
      }

      const profiles = facRes.data || [];
      const folders = folderRes.data || [];
      const subjects = subRes.data || [];

      // 2. Map drive folders by faculty_id
      const folderMap = new Map<string, any>();
      folders.forEach((f: any) => {
        if (f.faculty_id) folderMap.set(f.faculty_id, f);
      });

      // 3. Map subject assignments by faculty_id
      const subjectMap = new Map<string, { sy2425?: string; sy2526?: string }>();
      subjects.forEach((s: any) => {
        if (!s.faculty_id) return;
        if (!subjectMap.has(s.faculty_id)) {
          subjectMap.set(s.faculty_id, {});
        }
        const entry = subjectMap.get(s.faculty_id)!;
        const sy = String(s.school_year || '').trim();
        if (sy.includes('2024') && sy.includes('2025')) {
          entry.sy2425 = s.subject_assignments || '';
        } else if (sy.includes('2025') && sy.includes('2026')) {
          entry.sy2526 = s.subject_assignments || '';
        }
      });

      // 4. Map to unified Form2FacultyItem
      const mapped: Form2FacultyItem[] = profiles.map((p: any) => {
        const folder = folderMap.get(p.id);
        const subj = subjectMap.get(p.id) || {};

        // Campus category
        const rawCampus = (p.campus || 'Main Campus').toLowerCase();
        let campusCat: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE' = 'Main';
        if (rawCampus.includes('pagadian')) campusCat = 'Pagadian';
        else if (rawCampus.includes('dumingag')) campusCat = 'Dumingag';
        else if (rawCampus.includes('cmse')) campusCat = 'CMSE';

        // Rank category
        const rawRank = (p.academic_rank || '').toUpperCase();
        let rankCat: 'Professor' | 'Associate Professor' | 'Assistant Professor' | 'Instructor' | 'Lecturer / Others' = 'Instructor';
        if (rawRank.includes('PROFESSOR') && !rawRank.includes('ASSOCIATE') && !rawRank.includes('ASSISTANT')) {
          rankCat = 'Professor';
        } else if (rawRank.includes('ASSOCIATE PROFESSOR')) {
          rankCat = 'Associate Professor';
        } else if (rawRank.includes('ASSISTANT PROFESSOR')) {
          rankCat = 'Assistant Professor';
        } else if (rawRank.includes('INSTRUCTOR')) {
          rankCat = 'Instructor';
        } else {
          rankCat = 'Lecturer / Others';
        }

        // Highest degree
        const doc = (p.doctorate_program || '').trim();
        const hasDoctorate = doc && doc.toLowerCase() !== 'none' && doc !== '—' && doc !== '-';
        const mast = (p.master_program || '').trim();
        const hasMaster = mast && mast.toLowerCase() !== 'none' && mast !== '—' && mast !== '-';

        let highestDeg: 'Doctorate' | "Master's" | "Bachelor's" = "Bachelor's";
        if (hasDoctorate) highestDeg = 'Doctorate';
        else if (hasMaster) highestDeg = "Master's";

        // Clean values
        const cleanVal = (val: string | null | undefined) => {
          if (!val) return '';
          const trimmed = val.trim();
          if (trimmed.toUpperCase() === 'EMPTY' || trimmed.toUpperCase() === 'NONE' || trimmed === '—' || trimmed === '-') {
            return '';
          }
          return trimmed;
        };

        return {
          id: p.id,
          name: p.faculty_name || '',
          campus: p.campus || 'Main Campus',
          campusCategory: campusCat,
          department: p.department_or_academic_program || 'General Academic Program',
          academicRank: p.academic_rank || 'Instructor',
          rankCategory: rankCat,
          fullTimePermanent: Boolean(p.full_time_permanent),
          fullTimeContractual: Boolean(p.full_time_contractual),
          partTime: Boolean(p.part_time),
          teachingUndergrad: Boolean(p.teaching_undergraduate),
          teachingGrad: Boolean(p.teaching_graduate),
          bachelorDegree: cleanVal(p.bachelor_program),
          masterDegree: cleanVal(p.master_program),
          doctorateDegree: cleanVal(p.doctorate_program),
          highestDegree: highestDeg,
          academicSpecialization: cleanVal(p.academic_specialization),
          licenseNo: cleanVal(p.license_no),
          licenseExpiryDate: cleanVal(p.license_expiry_date),
          professionalExperience: cleanVal(p.professional_experience),
          sy2024_2025: subj.sy2425 || '',
          sy2025_2026: subj.sy2526 || '',
          driveFolderId: folder?.drive_folder_id || undefined,
          driveFolderUrl: folder?.drive_folder_url || undefined,
          sourceExcelRow: p.source_excel_row
        };
      });

      setFaculty(mapped);
    } catch (err: any) {
      console.error('Error fetching Supabase Form 2 data:', err);
      setError(err?.message || 'Failed to connect to Supabase.');
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
  }, [faculty, selectedCampus, selectedRank, searchQuery]);

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

    // Ranks distribution
    const profCount = faculty.filter((f) => f.rankCategory === 'Professor').length;
    const assocCount = faculty.filter((f) => f.rankCategory === 'Associate Professor').length;
    const asstCount = faculty.filter((f) => f.rankCategory === 'Assistant Professor').length;
    const instCount = faculty.filter((f) => f.rankCategory === 'Instructor').length;
    const lecCount = faculty.filter((f) => f.rankCategory === 'Lecturer / Others').length;

    const maxRank = Math.max(1, profCount, assocCount, asstCount, instCount, lecCount);

    return {
      total,
      permanent,
      contractual,
      partTime,
      doctorate,
      master,
      bachelor,
      docRate,
      ranks: [
        { label: 'Professor', count: profCount, pct: Math.round((profCount / maxRank) * 100) },
        { label: 'Associate Professor', count: assocCount, pct: Math.round((assocCount / maxRank) * 100) },
        { label: 'Assistant Professor', count: asstCount, pct: Math.round((asstCount / maxRank) * 100) },
        { label: 'Instructor', count: instCount, pct: Math.round((instCount / maxRank) * 100) },
        { label: 'Lecturer / Others', count: lecCount, pct: Math.round((lecCount / maxRank) * 100) }
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
            <div className="text-xs font-medium text-[#64748B] mt-1.5">Full-time faculty (total)</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {loading ? '...' : stats.permanent}
            </div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">Permanent</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {loading ? '...' : stats.contractual}
            </div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">Contractual</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {loading ? '...' : `${stats.docRate}%`}
            </div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">With doctorate</div>
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
              <span className="text-xs font-bold text-[#0E3322]">Doctorate Credential Rate</span>
              <span className="text-sm font-extrabold text-[#1E4D2B] bg-[#F4F6F1] px-3.5 py-1 rounded-full border border-[#E2E8F0]">
                {stats.docRate}%
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
              <div className="flex items-center gap-2">
                <button
                  onClick={loadSupabaseForm2Data}
                  disabled={loading}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E4D2B] bg-[#F4F6F1] border border-[#E2E8F0] rounded-full hover:bg-[#E3EFE8] transition-all cursor-pointer"
                  title="Reload from Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-[#64748B] pl-5">
              Complete inventory of J.H. Cerilles State College’s full-time faculty across all campuses, ranks, teaching assignments, educational background, licenses, and subject assignments.
            </p>
          </div>

          <div className="w-full border-b border-dashed border-[#CBD5E1] mb-6" />

          {/* Filter Row matching Form 1 */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-2">
              {['All campuses', 'Main', 'Pagadian', 'Dumingag', 'CMSE'].map((campus) => (
                <button
                  key={campus}
                  onClick={() => setSelectedCampus(campus)}
                  type="button"
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    selectedCampus === campus
                      ? 'bg-[#0E3322] text-white shadow-xs'
                      : 'bg-[#EEF1EB] text-[#475569] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {campus}
                </button>
              ))}

              <div className="relative inline-block ml-1">
                <select
                  value={selectedRank}
                  onChange={(e) => setSelectedRank(e.target.value)}
                  className="appearance-none bg-[#EEF1EB] text-[#475569] hover:bg-[#E2E8F0] text-xs font-medium py-1.5 pl-4 pr-8 rounded-full border-none focus:ring-2 focus:ring-[#1E4D2B] cursor-pointer"
                >
                  <option value="All ranks">All ranks</option>
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Instructor">Instructor</option>
                  <option value="Lecturer / Others">Lecturer / Others</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#64748B]">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search faculty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#1E4D2B]"
                />
              </div>

              <button
                onClick={() => exportForm2ToExcel(filteredFaculty)}
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs rounded-full hover:bg-[#1E4D2B]/5 transition-all cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export to Excel</span>
              </button>
            </div>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="py-16 text-center text-xs text-[#64748B]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#1E4D2B] mb-2" />
              Loading real faculty records from Supabase...
            </div>
          )}

          {/* Table Container — Complete CHED Form 2 matching Image 1 */}
          {!loading && (
            <div className="w-full overflow-x-auto no-scrollbar border border-[#E2E8F0] rounded-xl">
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
                        {/* Level 1: Yellow Campus Header Row matching Image 1 */}
                        <tr className="bg-[#FEF9C3] border-y border-[#FDE047]">
                          <td colSpan={16} className="py-2 px-3 font-bold text-[#854D0E] text-xs uppercase tracking-wide">
                            {campusName}
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
                                  {f.licenseNo || '—'}
                                </td>
                                <td className="py-2.5 px-2 text-center align-top text-[#334155] text-[11px] break-words">
                                  {f.licenseExpiryDate || '—'}
                                </td>

                                {/* Professional Experience */}
                                <td className="py-2.5 px-2 align-top text-[#64748B] text-[11px] break-words">
                                  {f.professionalExperience || '—'}
                                </td>

                                {/* Specific Subject Assignments: SY 2024-2025 */}
                                <td className="py-2.5 px-3 align-top text-[#334155] text-[11px] leading-snug break-words whitespace-pre-line">
                                  {f.sy2024_2025 || '—'}
                                </td>

                                {/* Specific Subject Assignments: SY 2025-2026 */}
                                <td className="py-2.5 px-3 align-top text-[#334155] text-[11px] leading-snug break-words whitespace-pre-line">
                                  {f.sy2025_2026 || '—'}
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
          <div className="mt-6 pt-4 border-t border-[#E5E9E2] flex items-center justify-between text-xs text-[#64748B]">
            <span>
              All faculty records, Google Drive evidence folders, and subject assignments are synchronized live with Supabase.
            </span>
            <span className="font-semibold text-[#1E4D2B]">
              Showing {filteredFaculty.length} of {faculty.length} faculty
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
