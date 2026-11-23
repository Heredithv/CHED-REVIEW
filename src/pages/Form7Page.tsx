import React, { useState, useEffect, useMemo } from 'react';
import { ExternalLink, Search, ChevronDown, Loader2 } from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { getSupabaseClient } from '../data/api';
import { DocumentLinkPreview } from '../components/DocumentLinkPreview';

export interface Form7DbRow {
  id: number;
  type_of_research: string | null;
  linkage_name: string | null;
  drive_link: string | null;
  year_started: string | null;
  year_ended: string | null;
  nature_of_partnership: string | null;
  academic_program: string | null;
  research_title: string | null;
  expected_outputs: string | null;
}

export interface PartnershipItem {
  id: string;
  partnerName: string;
  type: string;
  nature: string;
  programs: string[];
  outputs: string;
  researchTitle: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Ended' | 'Dates pending';
  duration: string | null;
  driveLink: string | null;
}

const FORM7_CACHE_KEY = 'jhcsc_form7_supabase_v2';
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('jhcsc_form7_supabase_v1');
  } catch {}
}
let cachedForm7Partnerships: PartnershipItem[] | null = null;
let prefetchForm7Promise: Promise<PartnershipItem[] | null> | null = null;

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const trimmed = dateStr.trim();
  if (
    !trimmed ||
    trimmed.toUpperCase() === 'NULL' ||
    trimmed === '—' ||
    trimmed.toLowerCase().includes('school year')
  ) {
    return '—';
  }
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const parts = trimmed.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return trimmed;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return trimmed;
  }
}

function isForm7HeaderOrEmptyRow(row: any): boolean {
  if (!row) return true;
  const name = (row.linkage_name ?? row.linkage_name_address ?? '').toString().trim();
  const type = (row.type_of_research ?? row.research_linkage_type ?? '').toString().trim();
  const start = (row.year_started ?? row.partnership_start_date ?? '').toString().trim();
  if (start.toLowerCase() === 'school year started') return true;
  if ((!name || name.toUpperCase() === 'NULL') && (!type || type.toUpperCase() === 'NULL')) {
    return true;
  }
  return false;
}

function transformSupabaseRowToPartnershipItem(row: Form7DbRow & Record<string, any>): PartnershipItem {
  const rawStart = (row.year_started ?? row.partnership_start_date ?? '').toString().trim();
  const rawEnd = (row.year_ended ?? row.partnership_end_date ?? '').toString().trim();
  const isOngoing =
    Boolean(row.partnership_ongoing) ||
    rawEnd.toLowerCase() === 'present' ||
    rawEnd.toLowerCase() === 'ongoing';

  const startDateFormatted = formatDate(rawStart);
  let endDateFormatted = formatDate(rawEnd);
  if (isOngoing && (endDateFormatted === '—' || !rawEnd)) {
    endDateFormatted = 'Present';
  }

  // Calculate status from year_started / year_ended
  let status: 'Active' | 'Ended' | 'Dates pending' = 'Ended';
  if (
    (!rawStart || rawStart.toUpperCase() === 'NULL') &&
    (!rawEnd || rawEnd.toUpperCase() === 'NULL') &&
    !isOngoing
  ) {
    status = 'Dates pending';
  } else if (isOngoing) {
    status = 'Active';
  } else if (/^\d{4}$/.test(rawEnd)) {
    const endYear = parseInt(rawEnd, 10);
    const currentYear = new Date().getFullYear();
    status = endYear >= currentYear ? 'Active' : 'Ended';
  } else if (rawEnd) {
    const endDateObj = new Date(rawEnd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!isNaN(endDateObj.getTime()) && endDateObj >= today) {
      status = 'Active';
    } else {
      status = 'Ended';
    }
  }

  // Calculate duration from year_started and year_ended
  let duration: string | null = null;
  if (/^\d{4}$/.test(rawStart) && /^\d{4}$/.test(rawEnd)) {
    const years = parseInt(rawEnd, 10) - parseInt(rawStart, 10);
    if (years > 0) {
      duration = `${years} ${years === 1 ? 'year' : 'years'}`;
    }
  } else if (rawStart && rawEnd) {
    const d1 = new Date(rawStart);
    const d2 = new Date(rawEnd);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      const years = d2.getFullYear() - d1.getFullYear();
      if (years > 0) {
        duration = `${years} ${years === 1 ? 'year' : 'years'}`;
      }
    }
  }

  // Handle academic_program
  let programsList: string[] = [];
  const rawPrograms = (row.academic_program ?? row.specific_academic_program_supported ?? '').toString().trim();
  if (rawPrograms && rawPrograms.toLowerCase() !== 'none' && rawPrograms.toUpperCase() !== 'NULL') {
    programsList = rawPrograms
      .split(',')
      .map((p: string) => p.trim())
      .filter((p: string) => Boolean(p) && p.toLowerCase() !== 'none' && p.toUpperCase() !== 'NULL');
  }

  // Handle research_title
  const rawTitle = (row.research_title ?? row.research_title_and_authors ?? '').toString().trim();
  const researchTitle =
    !rawTitle || rawTitle.toLowerCase() === 'none' || rawTitle.toUpperCase() === 'NULL'
      ? 'None listed'
      : rawTitle;

  // Handle expected_outputs
  const rawOutputs = (row.expected_outputs ?? row.expected_research_outputs ?? '').toString().trim();
  const outputs =
    !rawOutputs || rawOutputs.toLowerCase() === 'none' || rawOutputs.toUpperCase() === 'NULL'
      ? 'None listed'
      : rawOutputs;

  // Handle drive_link
  const rawDriveLink = (row.drive_link ?? '').toString().trim();
  const driveLink =
    rawDriveLink && rawDriveLink.toUpperCase() !== 'NULL' ? rawDriveLink : null;

  return {
    id: String(row.id),
    partnerName: (row.linkage_name ?? row.linkage_name_address ?? '').toString().trim(),
    type: (row.type_of_research ?? row.research_linkage_type ?? '').toString().trim(),
    nature: (row.nature_of_partnership ?? row.partnership_nature ?? '').toString().trim(),
    programs: programsList,
    outputs,
    researchTitle,
    startDate: startDateFormatted,
    endDate: endDateFormatted,
    status,
    duration,
    driveLink,
  };
}

export async function fetchForm7Partnerships(): Promise<PartnershipItem[]> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client could not be initialized.');
  }
  const { data, error } = await client.from('form7').select('*').order('id', { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  const rows = Array.isArray(data) ? data : [];
  const mapped = rows
    .filter((r) => !isForm7HeaderOrEmptyRow(r))
    .map(transformSupabaseRowToPartnershipItem);

  if (mapped.length > 0) {
    cachedForm7Partnerships = mapped;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(FORM7_CACHE_KEY, JSON.stringify(mapped));
        sessionStorage.setItem(FORM7_CACHE_KEY, JSON.stringify(mapped));
      }
    } catch {}
  }
  return mapped;
}

export function preloadForm7Data(): Promise<PartnershipItem[] | null> {
  if (cachedForm7Partnerships && cachedForm7Partnerships.length > 0) return Promise.resolve(cachedForm7Partnerships);
  if (prefetchForm7Promise) return prefetchForm7Promise;

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(FORM7_CACHE_KEY) || sessionStorage.getItem(FORM7_CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedForm7Partnerships = parsed;
        }
      }
    } catch {}
  }

  prefetchForm7Promise = fetchForm7Partnerships()
    .catch((err) => {
      console.warn('Form 7 background preload failed:', err);
      return cachedForm7Partnerships;
    })
    .finally(() => {
      prefetchForm7Promise = null;
    });

  return prefetchForm7Promise;
}

export const Form7Page: React.FC = () => {
  const [partnerships, setPartnerships] = useState<PartnershipItem[]>(() => {
    if (cachedForm7Partnerships && cachedForm7Partnerships.length > 0) return cachedForm7Partnerships;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(FORM7_CACHE_KEY) || sessionStorage.getItem(FORM7_CACHE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            cachedForm7Partnerships = parsed;
            return parsed;
          }
        }
      } catch {}
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => !cachedForm7Partnerships || cachedForm7Partnerships.length === 0);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Ended'>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [programFilter, setProgramFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Fetch live Supabase data on mount + subscribe to realtime changes
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!cachedForm7Partnerships || cachedForm7Partnerships.length === 0) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const mapped = await fetchForm7Partnerships();
        if (isMounted && mapped) {
          setPartnerships(mapped);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to fetch Form 7 linkages');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();

    const supabase = getSupabaseClient();
    if (!supabase) {
      return () => {
        isMounted = false;
      };
    }

    const channel = supabase
      .channel('form7_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'form7' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      isMounted = false;
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, []);

  // Compute stats dynamically from live Supabase records
  const stats = useMemo(() => {
    const total = partnerships.length;
    const local = partnerships.filter((p) =>
      p.type.toLowerCase().includes('local')
    ).length;
    const international = partnerships.filter((p) =>
      p.type.toLowerCase().includes('international')
    ).length;
    const active = partnerships.filter((p) => p.status === 'Active').length;

    return { total, local, international, active };
  }, [partnerships]);

  // Available Filter Options derived dynamically
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    partnerships.forEach((p) => {
      if (p.type) set.add(p.type);
    });
    return Array.from(set).sort();
  }, [partnerships]);

  const availablePrograms = useMemo(() => {
    const set = new Set<string>();
    partnerships.forEach((p) => {
      p.programs.forEach((prog) => set.add(prog));
    });
    return Array.from(set).sort();
  }, [partnerships]);

  // Filter partnerships dynamically
  const filteredPartnerships = useMemo(() => {
    return partnerships.filter((item) => {
      // Status Filter
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;

      // Type Filter
      if (typeFilter !== 'All' && item.type !== typeFilter) return false;

      // Program Filter
      if (programFilter !== 'All' && !item.programs.includes(programFilter)) return false;

      // Search Term Filter
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchesName = item.partnerName.toLowerCase().includes(term);
        const matchesNature = item.nature.toLowerCase().includes(term);
        const matchesTitle = item.researchTitle.toLowerCase().includes(term);
        if (!matchesName && !matchesNature && !matchesTitle) return false;
      }

      return true;
    });
  }, [partnerships, statusFilter, typeFilter, programFilter, searchTerm]);

  // Group partnerships by type for Form 1 table styling parity
  const groupedPartnerships = useMemo(() => {
    const groups: Record<string, PartnershipItem[]> = {};
    filteredPartnerships.forEach((p) => {
      const key = p.type || 'Local Research Institutions';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [filteredPartnerships]);

  return (
    <div className="w-full bg-[#F4F6F1] pb-16 font-sans">
      {/* Hero Band */}
      <InnerHeroBand
        breadcrumb="Form 7"
        title="Form 7: Research linkages"
        subtitle={`Partnerships and memoranda of agreement for research, development, and extension. ${stats.active} active linkages supporting academic programs.`}
        highlightNumber={`${stats.active} active linkages`}
      />

      {/* Hero Stats */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">{stats.total}</div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">Total linkages listed</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">{stats.local}</div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">Local research institutions</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">{stats.international}</div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">International linkages</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">{stats.active}</div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">Active partnerships</div>
          </div>
        </div>

        {/* Main Content Container Card */}
        <div className="bg-white border border-[#E5E9E2] rounded-[24px] p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)]">
          {/* Action / Filtering Row (Uniform with Forms 1-4) */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8 border-b border-[#F1F5F9] pb-6">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Pills */}
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-2 ${
                  statusFilter === 'All'
                    ? 'bg-[#0E3322] text-white shadow-xs'
                    : 'bg-[#EEF1EB] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                <span>All linkages</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    statusFilter === 'All' ? 'bg-white/20 text-white' : 'bg-white text-[#64748B]'
                  }`}
                >
                  {partnerships.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('Active')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'Active'
                    ? 'bg-[#0E3322] text-white shadow-xs'
                    : 'bg-[#EEF1EB] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                Active
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('Ended')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'Ended'
                    ? 'bg-[#0E3322] text-white shadow-xs'
                    : 'bg-[#EEF1EB] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                Ended
              </button>

              {/* Type Select Dropdown */}
              <div className="relative inline-block">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none bg-white text-[#475569] hover:bg-[#F4F6F1] text-xs font-medium py-1.5 pl-3.5 pr-8 rounded-full border border-[#E5E9E2] focus:ring-2 focus:ring-[#1E4D2B] cursor-pointer shadow-2xs outline-none"
                >
                  <option value="All">All types</option>
                  {availableTypes.map((typeStr) => (
                    <option key={typeStr} value={typeStr}>
                      {typeStr}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Programs Dropdown */}
              <div className="relative inline-block">
                <select
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  className="appearance-none bg-white text-[#475569] hover:bg-[#F4F6F1] text-xs font-medium py-1.5 pl-3.5 pr-8 rounded-full border border-[#E5E9E2] focus:ring-2 focus:ring-[#1E4D2B] cursor-pointer shadow-2xs outline-none"
                >
                  <option value="All">All programs</option>
                  {availablePrograms.map((prog) => (
                    <option key={prog} value={prog}>
                      {prog}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Search input with inner icon feel */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search institution..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white text-[#475569] text-xs font-medium py-1.5 pl-8 pr-3.5 rounded-full border border-[#E5E9E2] focus:ring-2 focus:ring-[#1E4D2B] outline-none w-full sm:w-52 shadow-2xs"
                />
                <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* View Mode Switcher (Cards | Table) & View Spreadsheet Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center p-0.5 bg-[#EEF1EB] rounded-full border border-[#E5E9E2]">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-[#0E3322] text-white shadow-xs'
                      : 'text-[#475569] hover:text-[#0E3322]'
                  }`}
                  title="Cards view"
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
                href="https://docs.google.com/spreadsheets/d/1k3DOBvOMFykYuKfJ2RqpoPbIuHGJjKlZljcdWJL1zy4/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs rounded-full hover:bg-[#1E4D2B]/5 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View spreadsheet</span>
              </a>
            </div>
          </div>

          {/* Heading Divider Block */}
          <div className="flex items-center gap-[14px] mb-6">
            <span className="w-[12px] h-[12px] rounded-full bg-[#E8AE1F] shadow-[0_0_0_4px_#FBF1D2] shrink-0" />
            <h3 className="text-[16px] font-bold text-[#1E4D2B] flex items-center gap-2 whitespace-nowrap">
              <span>Local Research Institutions</span>
              <span className="text-[13px] font-medium text-[#56635A]">
                {filteredPartnerships.length} partnerships
              </span>
            </h3>
            <div className="flex-1 border-t-2 border-dashed border-[#BCC7B9]" />
          </div>

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#1E4D2B]">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#1E4D2B]" />
              <p className="text-sm font-semibold text-[#56635A]">Loading Form 7 linkages from Supabase...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-[#991B1B] bg-[#FEF2F2] rounded-2xl border border-[#FCA5A5] p-6">
              <p className="font-bold mb-1">Database connection error</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : filteredPartnerships.length === 0 ? (
            <div className="text-center py-16 text-[#56635A] bg-[#FAFBF8] rounded-2xl border border-dashed border-[#DCE3D9]">
              No partnerships match the selected filter criteria.
            </div>
          ) : viewMode === 'table' ? (
            /* TABLE VIEW (Exact Form 1 table layout & visual design) */
            <div className="overflow-x-auto custom-table-scrollbar rounded-[16px] border border-[#E5E9E2] shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1E4D2B] text-white text-[11px] font-bold uppercase tracking-wider">
                    <th scope="col" className="py-3.5 px-4 w-48 min-w-[190px] border-r border-[#2b6d3d]">
                      Dates &amp; Duration
                    </th>
                    <th scope="col" className="py-3.5 px-4 min-w-[240px] border-r border-[#2b6d3d]">
                      Partner Institution / Agency
                    </th>
                    <th scope="col" className="py-3.5 px-4 min-w-[150px] border-r border-[#2b6d3d]">
                      Type
                    </th>
                    <th scope="col" className="py-3.5 px-3.5 text-center min-w-[110px] border-r border-[#2b6d3d]">
                      Status
                    </th>
                    <th scope="col" className="py-3.5 px-4 min-w-[180px] border-r border-[#2b6d3d]">
                      Nature of Partnership
                    </th>
                    <th scope="col" className="py-3.5 px-4 min-w-[180px] border-r border-[#2b6d3d]">
                      Programs Supported
                    </th>
                    <th scope="col" className="py-3.5 px-4 min-w-[240px] border-r border-[#2b6d3d]">
                      Research Title &amp; Author/s
                    </th>
                    <th scope="col" className="py-3.5 px-4 min-w-[200px]">
                      Expected Research Outputs
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-[#E2E8F0]">
                  {Object.keys(groupedPartnerships).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#64748B]">
                        No matching partnerships found.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(groupedPartnerships).map(([groupTitle, items]) => (
                      <React.Fragment key={groupTitle}>
                        {/* Group Category Header Row (Exact Form 1 layout style) */}
                        <tr className="bg-[#1E4D2B]/10 border-y border-[#1E4D2B]/20">
                          <td colSpan={8} className="py-3 px-4 font-bold text-[#1E4D2B] text-xs">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#E8AE1F] mr-2 shrink-0 align-middle" />
                            <span className="align-middle">{groupTitle}</span>
                            <span className="text-[#56635A] font-normal text-[11px] ml-2">
                              ({items.length} {items.length === 1 ? 'partnership' : 'partnerships'})
                            </span>
                          </td>
                        </tr>

                        {/* Partnership Rows */}
                        {items.map((item) => {
                          const isActive = item.status === 'Active';
                          const isEnded = item.status === 'Ended';
                          const isDatesPending = item.status === 'Dates pending';

                          return (
                            <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors divide-x divide-[#F1F5F9]">
                              <td className="py-4 px-4 sm:px-5 align-top">
                                <div className="font-bold text-[#0E3322] text-[13px] leading-tight">{item.startDate}</div>
                                <div className="text-[12px] text-[#56635A] mt-1 block font-medium whitespace-nowrap">
                                  {item.endDate !== '—' ? `to ${item.endDate}` : '—'}
                                </div>
                                {item.duration && (
                                  <span className="inline-block bg-[#FBF1D2] text-[#7A5500] text-[11px] font-bold px-2 py-0.5 rounded-md mt-2 border border-[#F3E5AB]">
                                    {item.duration}
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 font-bold text-[#0E3322] text-[13px] leading-snug align-top">
                                {item.driveLink ? (
                                  <DocumentLinkPreview url={item.driveLink} title={item.partnerName}>
                                    <a
                                      href={item.driveLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                    >
                                      {item.partnerName}
                                    </a>
                                  </DocumentLinkPreview>
                                ) : (
                                  item.partnerName
                                )}
                              </td>
                              <td className="py-4 px-4 align-top">
                                <span className="bg-[#F4F6F1] text-[#56635A] border border-[#DCE3D9] text-[11.5px] font-semibold px-2.5 py-1 rounded-md inline-block whitespace-nowrap">
                                  {item.type}
                                </span>
                              </td>
                              <td className="py-4 px-3.5 text-center align-top">
                                {isActive && (
                                  <span className="bg-[#E4EFE7] text-[#1E4D2B] rounded-full px-2.5 py-1 text-[11.5px] font-bold inline-flex items-center gap-1.5 whitespace-nowrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E4D2B] shrink-0" />
                                    <span>Active</span>
                                  </span>
                                )}
                                {isEnded && (
                                  <span className="bg-[#F4F6F1] text-[#56635A] border border-[#DCE3D9] rounded-md px-2.5 py-1 text-[11.5px] font-semibold inline-block whitespace-nowrap">
                                    Ended
                                  </span>
                                )}
                                {isDatesPending && (
                                  <span className="bg-[#F4F6F1] text-[#56635A] border border-[#DCE3D9] rounded-md px-2.5 py-1 text-[11.5px] font-semibold inline-block whitespace-nowrap">
                                    Dates pending
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-[#15221A] text-[12.5px] leading-relaxed align-top">
                                {item.nature}
                              </td>
                              <td className="py-4 px-4 align-top">
                                {item.programs.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {item.programs.map((prog) => (
                                      <span key={prog} className="bg-[#F0F2EE] text-[#15221A] rounded-md px-2 py-0.5 text-[11.5px] font-medium">
                                        {prog}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[#56635A] italic text-xs">None listed</span>
                                )}
                              </td>
                              <td className="py-4 px-4 align-top">
                                <span className={item.researchTitle && item.researchTitle !== 'None listed' ? 'font-semibold text-[#0E3322] text-[12.5px] leading-relaxed' : 'text-[#56635A] italic text-xs'}>
                                  {item.researchTitle || 'None listed'}
                                </span>
                              </td>
                              <td className="py-4 px-4 align-top">
                                <span className={item.outputs && item.outputs !== 'None listed' ? 'text-[#15221A] text-[12.5px] leading-relaxed' : 'text-[#56635A] italic text-xs'}>
                                  {item.outputs || 'None listed'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* CARDS / LIST VIEW */
            <div className="border-t border-[#DCE3D9]">
              {filteredPartnerships.map((item) => {
                const isActive = item.status === 'Active';
                const isEnded = item.status === 'Ended';
                const isDatesPending = item.status === 'Dates pending';

                return (
                  <div
                    key={item.id}
                    className="flex flex-col md:flex-row items-stretch min-h-[180px] hover:bg-[#F8FAF6] transition-colors duration-150 border-b border-[#DCE3D9]"
                  >
                    {/* Left Column: Date Range, Status & Duration Badge (Comfortable 200px width with left padding) */}
                    <div className="w-[200px] min-w-[200px] shrink-0 py-5 pl-6 pr-5 flex flex-col justify-between">
                      <div>
                        <div className="text-[14px] font-bold text-[#0E3322] leading-tight">
                          {item.startDate}
                        </div>
                        <div className="text-[13px] text-[#56635A] block mt-0.5">
                          {item.endDate !== '—' ? `to ${item.endDate}` : '—'}
                        </div>
                      </div>

                      <div className="mt-2.5 space-y-1.5">
                        {isActive && (
                          <div>
                            <span className="bg-[#E4EFE7] text-[#1E4D2B] rounded-[6px] px-2.5 py-1 text-[12px] font-semibold inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1E4D2B] shrink-0" />
                              <span>Active</span>
                            </span>
                          </div>
                        )}

                        {isEnded && (
                          <div>
                            <span className="bg-[#F4F6F1] text-[#56635A] border border-[#DCE3D9] rounded-[6px] px-2.5 py-1 text-[12px] font-semibold inline-block">
                              Ended
                            </span>
                          </div>
                        )}

                        {isDatesPending && (
                          <div>
                            <span className="bg-[#F4F6F1] text-[#56635A] border border-[#DCE3D9] rounded-[6px] px-2.5 py-1 text-[12px] font-semibold inline-block">
                              Dates pending
                            </span>
                          </div>
                        )}

                        {isActive && item.duration && (
                          <div>
                            <span className="bg-[#FBF1D2] text-[#7A5500] rounded-[6px] px-2.5 py-1 text-[12px] font-semibold inline-block">
                              {item.duration}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Key Details Grid with Gold Vertical Line */}
                    <div className="flex-1 py-5 pl-7 pr-6 border-l-[3px] border-l-[#E8AE1F] flex flex-col justify-between gap-3">
                      {/* Name Header and Type Chip Row */}
                      <div className="flex justify-between items-start gap-6 mb-[14px]">
                        <h4 className="text-[15px] font-bold text-[#0E3322] leading-snug flex-1">
                          {item.driveLink ? (
                            <DocumentLinkPreview url={item.driveLink} title={item.partnerName}>
                              <a
                                href={item.driveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {item.partnerName}
                              </a>
                            </DocumentLinkPreview>
                          ) : (
                            item.partnerName
                          )}
                        </h4>
                        <span className="bg-[#F4F6F1] text-[#56635A] border border-[#DCE3D9] rounded-[8px] px-[11px] py-[4px] text-[12px] font-semibold inline-flex items-center gap-[6px] whitespace-nowrap shrink-0">
                          <span className="w-[6px] h-[6px] rounded-full bg-[#1E4D2B] shrink-0" />
                          <span>{item.type}</span>
                        </span>
                      </div>

                      {/* Main Metadata Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-[14px] gap-x-[36px] mb-[14px]">
                        {/* Nature of Partnership */}
                        <div>
                          <div className="text-[10px] font-bold tracking-[.07em] uppercase text-[#56635A]">
                            NATURE OF PARTNERSHIP
                          </div>
                          <div className="text-[13.5px] text-[#15221A] mt-[2px] leading-snug">
                            {item.nature}
                          </div>
                        </div>

                        {/* Programs Supported */}
                        <div>
                          <div className="text-[10px] font-bold tracking-[.07em] uppercase text-[#56635A]">
                            PROGRAMS SUPPORTED
                          </div>
                          <div className="mt-[2px]">
                            {item.programs.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item.programs.map((prog) => (
                                  <span
                                    key={prog}
                                    className="bg-[#F0F2EE] text-[#15221A] rounded-[6px] px-[8px] py-[3px] text-[12px] font-medium"
                                  >
                                    {prog}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[13.5px] text-[#56635A] italic">
                                None listed
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Research Title & Authors */}
                        <div>
                          <div className="text-[10px] font-bold tracking-[.07em] uppercase text-[#56635A]">
                            RESEARCH TITLE &amp; AUTHOR/S
                          </div>
                          <div
                            className={`mt-[2px] text-[13.5px] leading-snug ${
                              item.researchTitle && item.researchTitle !== 'None listed'
                                ? 'font-semibold text-[#0E3322]'
                                : 'text-[#56635A] italic'
                            }`}
                          >
                            {item.researchTitle || 'None listed'}
                          </div>
                        </div>
                      </div>

                      {/* Expected Research Outputs */}
                      <div>
                        <div className="text-[10px] font-bold tracking-[.07em] uppercase text-[#56635A]">
                          EXPECTED RESEARCH OUTPUTS
                        </div>
                        <div
                          className={`mt-[2px] text-[13.5px] leading-snug ${
                            item.outputs && item.outputs !== 'None listed'
                              ? 'text-[#15221A]'
                              : 'text-[#56635A] italic'
                          }`}
                        >
                          {item.outputs || 'None listed'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Note matching Form 2 */}
          <div className="mt-6 pt-4 border-t border-[#E5E9E2] flex items-center justify-end text-xs text-[#64748B]">
            <span className="font-semibold text-[#1E4D2B]">
              Showing {filteredPartnerships.length} of {partnerships.length} linkages
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
