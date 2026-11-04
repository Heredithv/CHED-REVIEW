import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, RefreshCw, AlertCircle, ExternalLink, BarChart2, ArrowUp, X } from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { getSupabaseClient } from '../data/api';

export interface Form3SummaryDbRow {
  campus: string;
  department_or_academic_program: string;
  total_faculty: number;
  ongoing_faculty: number;
  ongoing_percentage: number;
  completed_faculty: number;
  completed_percentage: number;
  both_faculty: number;
  both_percentage: number;
}

export interface Form3ResearchOutputItem {
  id: string;
  research_id: string;
  output_type: string;
  output_title_or_citation: string;
  year_completed?: number | string | null;
  source_url?: string | null;
}

export interface Form3ResearchItem {
  id: string;
  faculty_id: string;
  research_status: 'ONGOING' | 'COMPLETED' | string;
  research_title: string;
  year_started?: number | string | null;
  expected_year_to_finish?: number | string | null;
  year_completed?: number | string | null;
  year_completed_raw?: string | null;
  publication_url?: string | null;
  terminal_report_url?: string | null;
  source_excel_row?: number;
  evidenceFile?: {
    id: string;
    drive_url?: string;
    file_name?: string;
    drive_file_id?: string;
  } | null;
  outputs: Form3ResearchOutputItem[];
}

export interface Form3FacultyItem {
  id: string;
  name: string;
  campus: string;
  campusCategory: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE';
  department: string;
  academicRank: string;
  fullTimePermanent: boolean;
  fullTimeContractual: boolean;
  partTime: boolean;
  status: 'Permanent' | 'Contractual' | 'Part-Time' | string;
  ongoingResearch: Form3ResearchItem[];
  completedResearch: Form3ResearchItem[];
  hasOngoing: boolean;
  hasCompleted: boolean;
  hasBoth: boolean;
  isActivelyInvolved: boolean;
  driveFolderUrl?: string;
  driveFolderId?: string;
  sourceExcelRow?: number;
}

const FORM3_FACULTY_CACHE_KEY = 'jhcsc_form3_faculty_v9';
const FORM3_SUMMARY_CACHE_KEY = 'jhcsc_form3_summary_v9';

// Module-level in-memory cache for instant zero-delay switching
let cachedForm3Faculty: Form3FacultyItem[] | null = null;
let cachedForm3Summary: Form3SummaryDbRow[] | null = null;

export async function preloadForm3Data(): Promise<Form3FacultyItem[] | null> {
  if (cachedForm3Faculty && cachedForm3Faculty.length > 0) return cachedForm3Faculty;
  try {
    const stored = (typeof window !== 'undefined' ? localStorage.getItem(FORM3_FACULTY_CACHE_KEY) : null) ||
                   (typeof window !== 'undefined' ? sessionStorage.getItem(FORM3_FACULTY_CACHE_KEY) : null);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedForm3Faculty = parsed;
        return parsed;
      }
    }
  } catch {}
  return null;
}

export const Form3Page: React.FC = () => {
  const [faculty, setFaculty] = useState<Form3FacultyItem[]>(() => {
    if (cachedForm3Faculty && cachedForm3Faculty.length > 0) {
      return cachedForm3Faculty;
    }
    try {
      const stored = (typeof window !== 'undefined' ? localStorage.getItem(FORM3_FACULTY_CACHE_KEY) : null) ||
                     (typeof window !== 'undefined' ? sessionStorage.getItem(FORM3_FACULTY_CACHE_KEY) : null);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedForm3Faculty = parsed;
          return parsed;
        }
      }
    } catch {}
    return [];
  });

  const [summaryList, setSummaryList] = useState<Form3SummaryDbRow[]>(() => {
    if (cachedForm3Summary && cachedForm3Summary.length > 0) {
      return cachedForm3Summary;
    }
    try {
      const stored = (typeof window !== 'undefined' ? localStorage.getItem(FORM3_SUMMARY_CACHE_KEY) : null) ||
                     (typeof window !== 'undefined' ? sessionStorage.getItem(FORM3_SUMMARY_CACHE_KEY) : null);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedForm3Summary = parsed;
          return parsed;
        }
      }
    } catch {}
    return [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    return !(cachedForm3Faculty && cachedForm3Faculty.length > 0);
  });
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedCampus, setSelectedCampus] = useState<string>('All campuses');
  const [summaryCampus, setSummaryCampus] = useState<string>('All campuses');
  const [selectedSchool, setSelectedSchool] = useState<string>('All schools');
  const [selectedInvolvement, setSelectedInvolvement] = useState<string>('All involvement');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModalFaculty, setSelectedModalFaculty] = useState<Form3FacultyItem | null>(null);

  useEffect(() => {
    if (!selectedModalFaculty) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedModalFaculty(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedModalFaculty]);

  const loadSupabaseForm3Data = async (force = false) => {
    if (force && (!cachedForm3Faculty || cachedForm3Faculty.length === 0)) {
      setLoading(true);
    }
    setError(null);
    try {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Supabase client could not be initialized.');
      }

      // Fetch Form 3 tables (`form3`, `form3_completed_researches`, `form3_summary`) in parallel
      const [summaryRes, form3Res, completedRes] = await Promise.all([
        client.from('form3_summary').select('*').order('id', { ascending: true }),
        client.from('form3').select('*').order('row_id', { ascending: true }),
        client.from('form3_completed_researches').select('*').order('id', { ascending: true }),
      ]);

      if (form3Res.error) {
        throw new Error(`Failed to load Form 3 records: ${form3Res.error.message}`);
      }

      // 1. Process & Deduplicate Summary Data from `form3_summary`
      const formatSummaryCampus = (raw: string): string => {
        const upper = (raw || '').trim().toUpperCase();
        if (upper.includes('MAIN')) return 'Main Campus';
        if (upper.includes('PAGADIAN')) return 'Pagadian Campus';
        if (upper.includes('DUMINGAG')) return 'Dumingag Campus';
        if (upper.includes('CMSE') || upper.includes('CANUTO')) return 'CMSE Campus';
        if (upper.includes('ALL CAMPUSES')) return 'ALL CAMPUSES';
        return (raw || '').trim();
      };

      const seenSummaryKeys = new Set<string>();
      const fetchedSummary: Form3SummaryDbRow[] = [];
      (summaryRes.data || []).forEach((row: any) => {
        const campus = formatSummaryCampus(row.campus_name || row.campus || '');
        const dept = String(row.school_name || row.department_or_academic_program || '').trim();
        if (!campus && !dept) return;
        const dedupKey = `${campus.toUpperCase()}|${dept.toUpperCase()}`;
        if (seenSummaryKeys.has(dedupKey)) return;
        seenSummaryKeys.add(dedupKey);

        fetchedSummary.push({
          campus,
          department_or_academic_program: dept,
          total_faculty: Number(row.no_of_faculty ?? row.total_faculty) || 0,
          ongoing_faculty: Number(row.ongoing_number ?? row.ongoing_faculty) || 0,
          ongoing_percentage: Number(row.ongoing_percent ?? row.ongoing_percentage) || 0,
          completed_faculty: Number(row.completed_number ?? row.completed_faculty) || 0,
          completed_percentage: Number(row.completed_percent ?? row.completed_percentage) || 0,
          both_faculty: Number(row.both_number ?? row.both_faculty) || 0,
          both_percentage: Number(row.both_percent ?? row.both_percentage) || 0,
        });
      });

      // 2. Group & Deduplicate Completed Researches from `form3_completed_researches` by `row_id`
      const rawCompletedByRowId: Record<number, { id: string; title: string; link: string | null }[]> = {};
      (completedRes.data || []).forEach((cr: any) => {
        const rowId = Number(cr.row_id);
        const title = String(cr.research_title || '').trim();
        const link = cr.drive_link ? String(cr.drive_link).trim() : null;
        if (!rowId || !title) return;
        if (!rawCompletedByRowId[rowId]) {
          rawCompletedByRowId[rowId] = [];
        }
        const existing = rawCompletedByRowId[rowId].find(
          (item) => item.title.toLowerCase() === title.toLowerCase()
        );
        if (existing) {
          if (!existing.link && link) existing.link = link;
        } else {
          rawCompletedByRowId[rowId].push({
            id: String(cr.id ?? `${rowId}-${rawCompletedByRowId[rowId].length + 1}`),
            title,
            link,
          });
        }
      });

      // 3. Build Faculty Profiles from `form3` joined with `form3_completed_researches`
      const seenFacultyRowIds = new Set<number>();
      const mappedFaculty: Form3FacultyItem[] = [];

      (form3Res.data || []).forEach((f: any, idx: number) => {
        const rowId = Number(f.row_id ?? idx + 1);
        if (seenFacultyRowIds.has(rowId)) return;
        seenFacultyRowIds.add(rowId);

        const rawCampus = String(f.campus_name || f.campus || '').trim();
        let campusCategory: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE' = 'Main';
        const lowerCampus = rawCampus.toLowerCase();
        if (lowerCampus.includes('pagadian')) campusCategory = 'Pagadian';
        else if (lowerCampus.includes('dumingag')) campusCategory = 'Dumingag';
        else if (lowerCampus.includes('cmse') || lowerCampus.includes('canuto')) campusCategory = 'CMSE';

        const rawName = String(f.faculty_name || f.full_name || f.name || '').trim();
        const rawDept = String(f.school_name || f.department_or_academic_program || f.department || '').trim();

        const isPerm = Boolean(f.is_full_time_permanent ?? f.employment_permanent ?? f.full_time_permanent);
        const isCont = Boolean(f.is_full_time_contractual ?? f.employment_contractual ?? f.full_time_contractual);
        const isPart = Boolean(f.is_part_time ?? f.employment_part_time ?? f.part_time);
        const status = isPerm ? 'Permanent' : isCont ? 'Contractual' : isPart ? 'Part-Time' : 'Permanent';

        // Build Ongoing Research list from `form3` columns (supporting multiple ongoing studies separated by newline)
        const ongoingList: Form3ResearchItem[] = [];
        const rawOngoingTitles = f.ongoing_research_title ? String(f.ongoing_research_title).split(/\r?\n/) : [];
        const rawOngoingStarts = f.ongoing_research_year_started ? String(f.ongoing_research_year_started).split(/\r?\n/) : [];
        const rawOngoingFinishes = f.ongoing_research_expected_finish ? String(f.ongoing_research_expected_finish).split(/\r?\n/) : [];

        rawOngoingTitles.forEach((rawTitle: string, oIdx: number) => {
          const ongoingTitle = rawTitle.trim();
          if (!ongoingTitle) return;
          const startYr = (rawOngoingStarts[oIdx] ?? rawOngoingStarts[0] ?? '').trim() || null;
          const finishYr = (rawOngoingFinishes[oIdx] ?? rawOngoingFinishes[0] ?? '').trim() || null;

          ongoingList.push({
            id: `ongoing-${rowId}-${oIdx}`,
            faculty_id: String(rowId),
            research_status: 'ONGOING',
            research_title: ongoingTitle,
            year_started: startYr,
            expected_year_to_finish: finishYr,
            year_completed: null,
            year_completed_raw: null,
            publication_url: f.ongoing_research_link || null,
            terminal_report_url: null,
            source_excel_row: rowId,
            evidenceFile: null,
            outputs: [],
          });
        });

        // Parse per-study years & outputs from `form3` columns (aligned 1-to-1 by line with `form3_completed_researches`)
        const yearsArr = f.completed_research_year ? String(f.completed_research_year).split(/\r?\n/).map((s: string) => s.trim()) : [];
        const patentsArr = f.outputs_patents ? String(f.outputs_patents).split(/\r?\n/).map((s: string) => s.trim()) : [];
        const journalsArr = f.outputs_journal_publications ? String(f.outputs_journal_publications).split(/\r?\n/).map((s: string) => s.trim()) : [];
        const booksArr = f.outputs_book_publications ? String(f.outputs_book_publications).split(/\r?\n/).map((s: string) => s.trim()) : [];
        const terminalsArr = f.outputs_terminal_report ? String(f.outputs_terminal_report).split(/\r?\n/).map((s: string) => s.trim()) : [];

        const buildOutputsForIndex = (crIdx: number, fallbackSingle: boolean, crLink: string | null): Form3ResearchOutputItem[] => {
          const outs: Form3ResearchOutputItem[] = [];
          const yrVal = (yearsArr[crIdx] ?? (fallbackSingle ? yearsArr[0] : '')) || null;
          const patVal = patentsArr[crIdx] ?? (fallbackSingle && crIdx === 0 ? patentsArr[0] : '') ?? '';
          const jrnVal = journalsArr[crIdx] ?? (fallbackSingle && crIdx === 0 ? journalsArr[0] : '') ?? '';
          const bkVal = booksArr[crIdx] ?? (fallbackSingle && crIdx === 0 ? booksArr[0] : '') ?? '';
          const trmVal = terminalsArr[crIdx] ?? (fallbackSingle && crIdx === 0 ? terminalsArr[0] : '') ?? '';

          if (patVal) {
            outs.push({
              id: `out-patent-${rowId}-${crIdx}`,
              research_id: `completed-${rowId}-${crIdx}`,
              output_type: 'Patent',
              output_title_or_citation: patVal,
              year_completed: yrVal,
              source_url: crLink,
            });
          }
          if (jrnVal) {
            outs.push({
              id: `out-journal-${rowId}-${crIdx}`,
              research_id: `completed-${rowId}-${crIdx}`,
              output_type: 'Journal Publication',
              output_title_or_citation: jrnVal,
              year_completed: yrVal,
              source_url: crLink,
            });
          }
          if (bkVal) {
            outs.push({
              id: `out-book-${rowId}-${crIdx}`,
              research_id: `completed-${rowId}-${crIdx}`,
              output_type: 'Book Publication',
              output_title_or_citation: bkVal,
              year_completed: yrVal,
              source_url: crLink,
            });
          }
          if (trmVal) {
            outs.push({
              id: `out-terminal-${rowId}-${crIdx}`,
              research_id: `completed-${rowId}-${crIdx}`,
              output_type: 'Terminal Report',
              output_title_or_citation: trmVal,
              year_completed: yrVal,
              source_url: trmVal.startsWith('http') ? trmVal : crLink,
            });
          }
          return outs;
        };

        // Build Completed Research list from `form3_completed_researches` joined by `row_id`
        const rawCrItems = rawCompletedByRowId[rowId] || [];
        const completedList: Form3ResearchItem[] = [];

        if (rawCrItems.length > 0) {
          const isSingleYearFallback = yearsArr.length === 1 && rawCrItems.length === 1;
          rawCrItems.forEach((crItem, crIdx) => {
            const yrVal = (yearsArr[crIdx] ?? (isSingleYearFallback ? yearsArr[0] : '')) || null;
            const trmVal = terminalsArr[crIdx] ?? (crIdx === 0 ? terminalsArr[0] : '') ?? '';
            const itemOutputs = buildOutputsForIndex(crIdx, rawCrItems.length === 1, crItem.link);

            completedList.push({
              id: `completed-${rowId}-${crIdx}`,
              faculty_id: String(rowId),
              research_status: 'COMPLETED',
              research_title: crItem.title,
              year_started: null,
              expected_year_to_finish: null,
              year_completed: yrVal,
              year_completed_raw: yrVal,
              publication_url: crItem.link,
              terminal_report_url: trmVal.startsWith('http') ? trmVal : null,
              source_excel_row: rowId,
              evidenceFile: crItem.link
                ? {
                    id: `ev-${crItem.id}`,
                    drive_url: crItem.link,
                    file_name: crItem.title,
                  }
                : null,
              outputs: itemOutputs,
            });
          });
        } else {
          const maxLen = Math.max(yearsArr.length, patentsArr.length, journalsArr.length, booksArr.length, terminalsArr.length);
          for (let crIdx = 0; crIdx < maxLen; crIdx++) {
            const yrVal = yearsArr[crIdx] || null;
            const trmVal = terminalsArr[crIdx] || '';
            const itemOutputs = buildOutputsForIndex(crIdx, true, null);
            if (!yrVal && itemOutputs.length === 0) continue;

            completedList.push({
              id: `completed-${rowId}-${crIdx}`,
              faculty_id: String(rowId),
              research_status: 'COMPLETED',
              research_title: itemOutputs[0]?.output_title_or_citation || 'Completed Research',
              year_started: null,
              expected_year_to_finish: null,
              year_completed: yrVal,
              year_completed_raw: yrVal,
              publication_url: null,
              terminal_report_url: trmVal.startsWith('http') ? trmVal : null,
              source_excel_row: rowId,
              evidenceFile: null,
              outputs: itemOutputs,
            });
          }
        }

        const hasOngoing = ongoingList.length > 0;
        const hasCompleted = completedList.length > 0;
        const hasBoth = hasOngoing && hasCompleted;
        const isActivelyInvolved = hasOngoing || hasCompleted;

        mappedFaculty.push({
          id: String(rowId),
          name: rawName || 'Unlisted Faculty',
          campus: rawCampus || `${campusCategory} Campus`,
          campusCategory,
          department: rawDept || 'General Academic Program',
          academicRank: String(f.academic_rank || 'Instructor').trim(),
          fullTimePermanent: isPerm,
          fullTimeContractual: isCont,
          partTime: isPart,
          status,
          ongoingResearch: ongoingList,
          completedResearch: completedList,
          hasOngoing,
          hasCompleted,
          hasBoth,
          isActivelyInvolved,
          sourceExcelRow: rowId,
        });
      });

      setSummaryList(fetchedSummary);
      setFaculty(mappedFaculty);
      cachedForm3Summary = fetchedSummary;
      cachedForm3Faculty = mappedFaculty;

      try {
        localStorage.setItem(FORM3_SUMMARY_CACHE_KEY, JSON.stringify(fetchedSummary));
        localStorage.setItem(FORM3_FACULTY_CACHE_KEY, JSON.stringify(mappedFaculty));
        sessionStorage.setItem(FORM3_SUMMARY_CACHE_KEY, JSON.stringify(fetchedSummary));
        sessionStorage.setItem(FORM3_FACULTY_CACHE_KEY, JSON.stringify(mappedFaculty));
      } catch {}
    } catch (err: any) {
      console.error('Error fetching Form 3 data from Supabase:', err);
      setError(err?.message || 'Failed to fetch Form 3 records from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupabaseForm3Data(false);
  }, []);

  // Compute Distinct Schools for Dropdown Filter
  const schoolsList = useMemo(() => {
    const set = new Set<string>();
    faculty.forEach((f) => {
      if (f.department) set.add(f.department);
    });
    return Array.from(set).sort();
  }, [faculty]);

  // Compute Campus Filter Counts
  const campusCounts = useMemo(() => {
    const counts = {
      all: 0,
      main: 0,
      pagadian: 0,
      dumingag: 0,
      cmse: 0
    };
    faculty.forEach((f) => {
      if (!f.isActivelyInvolved) return;
      counts.all += 1;
      if (f.campusCategory === 'Main') counts.main += 1;
      if (f.campusCategory === 'Pagadian') counts.pagadian += 1;
      if (f.campusCategory === 'Dumingag') counts.dumingag += 1;
      if (f.campusCategory === 'CMSE') counts.cmse += 1;
    });
    return counts;
  }, [faculty]);

  // Filter Faculty
  const filteredFaculty = useMemo(() => {
    return faculty.filter((f) => {
      // 1. Campus Filter
      if (selectedCampus !== 'All campuses') {
        if (f.campusCategory !== selectedCampus) return false;
      }

      // 2. School / Department Filter
      if (selectedSchool !== 'All schools') {
        if (f.department !== selectedSchool) return false;
      }

      // 3. Involvement Filter
      if (selectedInvolvement === 'All involvement') {
        if (!f.isActivelyInvolved) return false;
      } else if (selectedInvolvement === 'Ongoing research') {
        if (!f.hasOngoing) return false;
      } else if (selectedInvolvement === 'Completed research') {
        if (!f.hasCompleted) return false;
      } else if (selectedInvolvement === 'Both ongoing & completed') {
        if (!f.hasBoth) return false;
      }

      // 4. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = f.name.toLowerCase().includes(q);
        const matchRank = f.academicRank.toLowerCase().includes(q);
        const matchDept = f.department.toLowerCase().includes(q);
        const matchOngoing = f.ongoingResearch.some(
          (r) => r.research_title.toLowerCase().includes(q) || String(r.year_started || '').includes(q)
        );
        const matchCompleted = f.completedResearch.some(
          (r) =>
            r.research_title.toLowerCase().includes(q) ||
            String(r.year_completed || '').includes(q) ||
            r.outputs.some((out) => out.output_title_or_citation.toLowerCase().includes(q))
        );
        if (!matchName && !matchRank && !matchDept && !matchOngoing && !matchCompleted) {
          return false;
        }
      }

      return true;
    });
  }, [faculty, selectedCampus, selectedSchool, selectedInvolvement, searchQuery]);

  // Group Filtered Faculty by Campus and Department
  const groupedHierarchy = useMemo(() => {
    const hierarchy: Record<string, Record<string, Form3FacultyItem[]>> = {};

    filteredFaculty.forEach((f) => {
      const camp = f.campus || `${f.campusCategory} Campus`;
      const dept = f.department || 'General Department';
      if (!hierarchy[camp]) hierarchy[camp] = {};
      if (!hierarchy[camp][dept]) hierarchy[camp][dept] = [];
      hierarchy[camp][dept].push(f);
    });

    return hierarchy;
  }, [filteredFaculty]);

  // Form 3 Summary Grouping
  const groupedSummary = useMemo<{
    groups: { campusName: string; rows: Form3SummaryDbRow[]; totalRow?: Form3SummaryDbRow }[];
    grandTotal: Form3SummaryDbRow | undefined;
  }>(() => {
    const groups: {
      campusName: string;
      rows: Form3SummaryDbRow[];
      totalRow?: Form3SummaryDbRow;
    }[] = [];

    const campusOrder = ['Main Campus', 'Pagadian Campus', 'Dumingag Campus', 'CMSE Campus'];
    let grandTotal: Form3SummaryDbRow | undefined = undefined;

    summaryList.forEach((row) => {
      const c = row.campus.trim();
      const d = row.department_or_academic_program.trim();
      const upperC = c.toUpperCase();
      const upperD = d.toUpperCase();

      if (
        upperC === 'ALL CAMPUSES' ||
        upperC.includes('GRAND TOTAL') ||
        upperD.includes('OVERALL TOTAL') ||
        upperD.includes('GRAND TOTAL')
      ) {
        grandTotal = row;
        return;
      }

      let group = groups.find((g) => g.campusName.toLowerCase() === c.toLowerCase());
      if (!group) {
        group = { campusName: c, rows: [] };
        groups.push(group);
      }

      if (upperD === 'TOTAL' || upperD.endsWith('TOTAL') || d.toLowerCase().includes('campus total')) {
        group.totalRow = row;
      } else {
        group.rows.push(row);
      }
    });

    groups.sort((a, b) => {
      const idxA = campusOrder.findIndex((co) => a.campusName.toLowerCase().includes(co.toLowerCase().split(' ')[0]));
      const idxB = campusOrder.findIndex((co) => b.campusName.toLowerCase().includes(co.toLowerCase().split(' ')[0]));
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    return {
      groups,
      grandTotal
    };
  }, [summaryList]);

  // Overall Headline Metrics Computed Live from Supabase & Synchronized with Official Form 3 Data Summary
  const headlineMetrics = useMemo(() => {
    const grandTotal = groupedSummary.grandTotal;

    const totalFaculty = grandTotal?.total_faculty ?? (faculty.length || 222);
    const ongoingFaculty = grandTotal?.ongoing_faculty ?? faculty.filter((f) => f.hasOngoing).length;
    const completedFaculty = grandTotal?.completed_faculty ?? faculty.filter((f) => f.hasCompleted).length;
    const bothFaculty = grandTotal?.both_faculty ?? faculty.filter((f) => f.hasBoth).length;
    const activeFaculty = faculty.filter((f) => f.isActivelyInvolved).length || 107;

    const ongoingPct = grandTotal?.ongoing_percentage != null && grandTotal.ongoing_percentage > 0
      ? grandTotal.ongoing_percentage.toFixed(1)
      : ((ongoingFaculty / totalFaculty) * 100).toFixed(1);
    const completedPct = grandTotal?.completed_percentage != null && grandTotal.completed_percentage > 0
      ? grandTotal.completed_percentage.toFixed(1)
      : ((completedFaculty / totalFaculty) * 100).toFixed(1);
    const bothPct = grandTotal?.both_percentage != null && grandTotal.both_percentage > 0
      ? grandTotal.both_percentage.toFixed(1)
      : ((bothFaculty / totalFaculty) * 100).toFixed(1);
    const activePct = totalFaculty > 0 ? ((activeFaculty / totalFaculty) * 100).toFixed(1) : '48.2';

    return {
      totalFaculty,
      ongoingFaculty,
      ongoingPct,
      completedFaculty,
      completedPct,
      bothFaculty,
      bothPct,
      activeFaculty,
      activePct
    };
  }, [faculty, groupedSummary.grandTotal]);

  // Filtered Summary Groups based on summaryCampus
  const displayedSummaryGroups = useMemo(() => {
    if (summaryCampus === 'All campuses') {
      return groupedSummary.groups;
    }
    return groupedSummary.groups.filter((g) => g.campusName === summaryCampus);
  }, [groupedSummary.groups, summaryCampus]);

  return (
    <div className="w-full bg-[#F4F6F1] pb-16 font-sans">
      {/* Hero Band */}
      <InnerHeroBand
        breadcrumb="Form 3"
        title="Form 3 Research Involvement"
        subtitle="Listing of full-time faculty research involvement across all campuses, including ongoing research, completed research outputs, and publication citations."
      />

      {/* Main Container — Standard max-w-[1360px] matching Form 1 and Form 2 */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        {/* Real Dynamic Stats Overlay Cards from Supabase Form 3 Data */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Total Faculty */}
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {loading && faculty.length === 0 ? (
                <span className="inline-block w-12 h-8 bg-[#EEF1EB] rounded animate-pulse" />
              ) : (
                headlineMetrics.totalFaculty
              )}
            </div>
            <div className="text-xs font-normal text-[#64748B] mt-1.5">Full-time faculty</div>
          </div>

          {/* Card 2: Faculty with Ongoing Research */}
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {loading && faculty.length === 0 ? (
                <span className="inline-block w-12 h-8 bg-[#EEF1EB] rounded animate-pulse" />
              ) : (
                headlineMetrics.ongoingFaculty
              )}
            </div>
            <div className="text-xs font-normal text-[#64748B] mt-1.5">With ongoing research</div>
          </div>

          {/* Card 3: Faculty with Completed Research */}
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {loading && faculty.length === 0 ? (
                <span className="inline-block w-12 h-8 bg-[#EEF1EB] rounded animate-pulse" />
              ) : (
                headlineMetrics.completedFaculty
              )}
            </div>
            <div className="text-xs font-normal text-[#64748B] mt-1.5">With completed research</div>
          </div>

          {/* Card 4: Faculty with Both Ongoing & Completed Research */}
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {loading && faculty.length === 0 ? (
                <span className="inline-block w-12 h-8 bg-[#EEF1EB] rounded animate-pulse" />
              ) : (
                headlineMetrics.bothFaculty
              )}
            </div>
            <div className="text-xs font-normal text-[#64748B] mt-1.5">Both ongoing & completed</div>
          </div>
        </div>

        {/* Card 1: Faculty Research Directory */}
        <div className="bg-white border border-[#E5E9E2] rounded-[22px] p-5 sm:p-7 shadow-[0_4px_24px_rgba(21,34,26,0.04)] mb-6">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F]" />
              <h2 className="text-xl sm:text-2xl font-bold text-[#15221A]">Faculty Research Directory</h2>
            </div>
            <p className="text-xs text-[#64748B] pl-4.5">
              Comprehensive repository of full-time faculty research projects, publication citations, and active research engagement across all campus schools.
            </p>
          </div>

          <div className="w-full border-b border-dashed border-[#CBD5E1] mb-4" />

          {/* Filter Bar — Solid Flex/Grid that won't disrupt when filters change */}
          <div className="space-y-3 mb-5">
            {/* Top Row: Campus Tabs on Left, View Switcher (Cards | Table) & View Spreadsheet on Right */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Campus Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'All campuses', label: 'All campuses' },
                  { id: 'Main', label: 'Main' },
                  { id: 'Pagadian', label: 'Pagadian' },
                  { id: 'Dumingag', label: 'Dumingag' },
                  { id: 'CMSE', label: 'CMSE' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCampus(c.id)}
                    type="button"
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      selectedCampus === c.id
                        ? 'bg-[#0E3322] text-white shadow-xs'
                        : 'bg-[#EEF1EB] text-[#475569] hover:bg-[#E2E8F0]'
                    }`}
                  >
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>

              {/* View Switcher (Cards | Table) & View Spreadsheet */}
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center p-0.5 bg-[#EEF1EB] rounded-full border border-[#E5E9E2]">
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'cards'
                        ? 'bg-[#0E3322] text-white shadow-xs'
                        : 'text-[#475569] hover:text-[#0E3322]'
                    }`}
                    title="Present faculty as research cards"
                  >
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-[#0E3322] text-white shadow-xs'
                        : 'text-[#475569] hover:text-[#0E3322]'
                    }`}
                    title="Table view"
                  >
                    <span>Table</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('summary-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E3EFE8] text-[#1E4D2B] hover:bg-[#1E4D2B] hover:text-white font-bold text-xs rounded-full transition-all cursor-pointer whitespace-nowrap shadow-2xs border border-[#1E4D2B]/20"
                  title="Jump to Summary by campus and school table"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>View summary</span>
                </button>

                <a
                  href="https://docs.google.com/spreadsheets/d/16wSL2yuTXb45iRAiQgZchAwb1py7gsYoetac125coFA/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs rounded-full hover:bg-[#1E4D2B]/5 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View spreadsheet</span>
                </a>
              </div>
            </div>

            {/* Bottom Row: School Dropdown, Involvement Dropdown & Active Filter Reset (Left), Search (Right) */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* School Dropdown */}
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
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Involvement Dropdown */}
                <div className="relative inline-block">
                  <select
                    value={selectedInvolvement}
                    onChange={(e) => setSelectedInvolvement(e.target.value)}
                    className="appearance-none bg-white text-[#475569] hover:bg-[#F4F6F1] text-xs font-medium py-1.5 pl-3.5 pr-8 rounded-full border border-[#E5E9E2] focus:ring-2 focus:ring-[#1E4D2B] cursor-pointer shadow-2xs"
                  >
                    <option value="All involvement">All actively involved ({headlineMetrics.activeFaculty})</option>
                    <option value="Ongoing research">With ongoing research ({headlineMetrics.ongoingFaculty})</option>
                    <option value="Completed research">With completed research ({headlineMetrics.completedFaculty})</option>
                    <option value="Both ongoing & completed">With both ongoing &amp; completed ({headlineMetrics.bothFaculty})</option>
                    <option value="All full-time faculty">All full-time faculty ({headlineMetrics.totalFaculty})</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Reset Filters */}
                {(selectedCampus !== 'All campuses' || selectedSchool !== 'All schools' || selectedInvolvement !== 'All involvement' || searchQuery.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCampus('All campuses');
                      setSelectedSchool('All schools');
                      setSelectedInvolvement('All involvement');
                      setSearchQuery('');
                    }}
                    className="text-xs text-[#1E4D2B] hover:underline font-semibold cursor-pointer pl-1 whitespace-nowrap"
                  >
                    Reset filters
                  </button>
                )}
              </div>

              {/* Search programs input */}
              <div className="relative min-w-[240px] w-full sm:w-[300px] md:w-[340px]">
                <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search faculty, rank, or research title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-[#E5E9E2] rounded-full focus:outline-none focus:border-[#1E4D2B] shadow-2xs placeholder:text-[#94A3B8]"
                />
              </div>
            </div>
          </div>

          {/* Error message if any */}
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading state */}
          {loading && faculty.length === 0 && (
            <div className="py-12 text-center text-xs text-[#64748B]">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#1E4D2B] mb-2" />
              Loading faculty research records...
            </div>
          )}

          {/* CARDS VIEW — 2-Column Grid Following Website Brand Identity (Form 1 & Form 2 Architecture) */}
          {viewMode === 'cards' && (!loading || faculty.length > 0) && (
            Object.keys(groupedHierarchy).length === 0 ? (
              <div className="py-16 text-center text-[#64748B] bg-white border border-[#E5E9E2] rounded-[22px] text-xs">
                No matching faculty research records found.
              </div>
            ) : (
              <div className="space-y-10">
                {Object.entries(groupedHierarchy).map(([campusName, departments]) => (
                  <div key={campusName} className="space-y-8">
                    {Object.entries(departments).map(([deptName, facultyList]) => (
                      <div key={deptName} className="space-y-4">
                        {/* Group Header Matching Form 1 & Form 2 */}
                        <div className="flex items-center gap-2.5 px-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F] shrink-0" />
                          <h3 className="text-sm font-bold text-[#1E4D2B] tracking-wide whitespace-nowrap">
                            {campusName} — {deptName}
                          </h3>
                          <span className="text-xs text-[#64748B] font-medium">({facultyList.length})</span>
                          <div className="w-full border-b border-dashed border-[#CBD5E1] ml-2 hidden sm:block" />
                        </div>

                        {/* Faculty Research Cards Grid Matching Form 1 Brand Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                          {facultyList.map((f) => {
                            const extractYear = (val?: string | number | null): number => {
                              if (val == null) return 0;
                              const matches = String(val).match(/\b(19|20)\d{2}\b/g);
                              if (!matches || matches.length === 0) return 0;
                              return Math.max(...matches.map((m) => parseInt(m, 10)));
                            };

                            const sortedOngoing = [...f.ongoingResearch].sort(
                              (a, b) => extractYear(b.year_started) - extractYear(a.year_started)
                            );
                            const sortedCompleted = [...f.completedResearch].sort(
                              (a, b) =>
                                extractYear(b.year_completed || b.year_completed_raw) -
                                extractYear(a.year_completed || a.year_completed_raw)
                            );

                            const ongoingCount = sortedOngoing.length;
                            const completedCount = sortedCompleted.length;
                            const totalCount = ongoingCount + completedCount;
                            const hasOngoing = ongoingCount > 0;

                            // Show up to 2 studies in the card preview to maintain balanced card proportions
                            const ongoingPreviewLimit = 1;
                            const completedPreviewLimit = hasOngoing ? 1 : 2;

                            const displayedOngoing = sortedOngoing.slice(0, ongoingPreviewLimit);
                            const displayedCompleted = sortedCompleted.slice(0, completedPreviewLimit);
                            const displayedCount = displayedOngoing.length + displayedCompleted.length;
                            const hasMoreResearch = totalCount > displayedCount;

                            return (
                              <div
                                key={f.id}
                                data-program-card="true"
                                className="bg-white border border-[#E5E9E2] rounded-[22px] overflow-hidden shadow-[0_4px_20px_rgba(21,34,26,0.04)] hover:shadow-[0_8px_30px_rgba(21,34,26,0.08)] transition-all flex flex-col justify-between min-w-0"
                              >
                                {/* Pine Top Banner Header — Exact Match to Form 1 */}
                                <div className="bg-[#0E3322] px-6 py-4 flex items-start justify-between gap-3 text-white">
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-extrabold text-base sm:text-lg leading-tight text-white tracking-tight break-words [overflow-wrap:anywhere]">
                                      {f.name}
                                    </h4>
                                    <div className="text-xs text-[#E3EFE8] font-medium mt-1 leading-snug">
                                      <span>{f.academicRank}</span>
                                      {f.status && (
                                        <>
                                          <span className="mx-1.5 text-[#E3EFE8]/60">·</span>
                                          <span>{f.status}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {totalCount > 0 && (
                                    <span className="bg-[#E8AE1F] text-[#15221A] text-xs font-bold px-3 py-1 rounded-full shrink-0 shadow-2xs whitespace-nowrap">
                                      {totalCount} {totalCount === 1 ? 'Research' : 'Researches'}
                                    </span>
                                  )}
                                </div>

                                {/* Card Body — Clean Editorial Typography & Hairline Dividers */}
                                <div className="p-6 flex-1 flex flex-col justify-between space-y-4 min-w-0">
                                  {totalCount === 0 ? (
                                    <div className="py-6 text-center text-xs text-[#64748B]">
                                      No research projects recorded for this faculty member.
                                    </div>
                                  ) : (
                                    <div className="space-y-4 min-w-0">
                                      {/* Ongoing Research Section */}
                                      {displayedOngoing.length > 0 && (
                                        <div className="space-y-2.5 min-w-0">
                                          <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
                                            ONGOING RESEARCH{ongoingCount > 1 ? ` (${ongoingCount})` : ''}
                                          </div>
                                          <div className="space-y-3 min-w-0">
                                            {displayedOngoing.map((r) => {
                                              const sourceUrl = r.publication_url || r.outputs?.[0]?.source_url;
                                              return (
                                                <div key={r.id} className="min-w-0">
                                                  <div className="font-semibold text-[#15221A] text-xs leading-snug break-words [overflow-wrap:anywhere]">
                                                    {sourceUrl ? (
                                                      <a
                                                        href={sourceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[#1E4D2B] hover:underline inline"
                                                      >
                                                        <span>{r.research_title}</span>
                                                        <ExternalLink className="w-3 h-3 inline-block ml-1 -mt-0.5 text-[#1E4D2B]" />
                                                      </a>
                                                    ) : (
                                                      <span>{r.research_title}</span>
                                                    )}
                                                  </div>
                                                  <div className="text-[11px] text-[#64748B] mt-1">
                                                    <span>Year started: {r.year_started || '—'}</span>
                                                    {r.expected_year_to_finish && (
                                                      <>
                                                        <span className="mx-1.5 text-[#BCC7B9]">·</span>
                                                        <span>Expected finish: {r.expected_year_to_finish}</span>
                                                      </>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {displayedOngoing.length > 0 && displayedCompleted.length > 0 && (
                                        <div className="border-b border-[#F1F5F9]" />
                                      )}

                                      {/* Completed Research Section */}
                                      {displayedCompleted.length > 0 && (
                                        <div className="space-y-2.5 min-w-0">
                                          <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
                                            COMPLETED RESEARCH{completedCount > 1 ? ` (${completedCount})` : ''}
                                          </div>
                                          <div className="space-y-3 divide-y divide-[#F1F5F9] min-w-0">
                                            {displayedCompleted.map((r, idx) => {
                                              const yr = r.year_completed || r.year_completed_raw;
                                              const primaryOutput = r.outputs?.[0];
                                              const citation = primaryOutput?.output_title_or_citation;
                                              const sourceUrl = r.publication_url || primaryOutput?.source_url;

                                              return (
                                                <div key={r.id} className={`min-w-0 ${idx > 0 ? 'pt-3' : ''}`}>
                                                  <div className="flex items-start justify-between gap-3">
                                                    <div className="font-semibold text-[#15221A] text-xs leading-snug break-words [overflow-wrap:anywhere] flex-1">
                                                      {sourceUrl ? (
                                                        <a
                                                          href={sourceUrl}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="text-[#1E4D2B] hover:underline inline"
                                                        >
                                                          <span>{r.research_title}</span>
                                                          <ExternalLink className="w-3 h-3 inline-block ml-1 -mt-0.5 text-[#1E4D2B]" />
                                                        </a>
                                                      ) : (
                                                        <span>{r.research_title}</span>
                                                      )}
                                                    </div>
                                                    {yr && (
                                                      <span className="text-xs font-bold text-[#1E4D2B] shrink-0">
                                                        {yr}
                                                      </span>
                                                    )}
                                                  </div>
                                                  {citation && citation !== r.research_title && (
                                                    <p className="text-[11px] text-[#64748B] leading-snug mt-1 line-clamp-2 break-words [overflow-wrap:anywhere]">
                                                      {citation}
                                                    </p>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Bottom Summary Bar Matching Form 1 */}
                                  <div className="border-t border-[#E5E9E2] pt-3.5 flex items-center justify-between gap-3">
                                    <div className="text-xs text-[#64748B] font-medium">
                                      <span className="font-bold text-[#15221A]">{completedCount}</span> completed
                                      <span className="mx-1.5 text-[#BCC7B9]">·</span>
                                      <span className="font-bold text-[#15221A]">{ongoingCount}</span> ongoing
                                    </div>

                                    {totalCount > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedModalFaculty(f)}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-[#1E4D2B] hover:text-[#0E3322] hover:underline transition-colors cursor-pointer shrink-0"
                                      >
                                        <span>
                                          {hasMoreResearch
                                            ? `View all ${totalCount} records`
                                            : 'View full details'}
                                        </span>
                                        <span>→</span>
                                      </button>
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

          {/* TABLE VIEW — Faculty Research Table matching Original Spreadsheet Exactly */}
          {viewMode === 'table' && (!loading || faculty.length > 0) && (
            <div className="w-full overflow-x-auto custom-table-scrollbar border border-[#E2E8F0] rounded-xl">
              <table className="w-full text-left border-collapse min-w-[1500px]">
                <thead>
                  {/* Tier 1: Main Section Headers Matching Original Spreadsheet */}
                  <tr className="bg-[#1E4D2B] text-white text-[10px] font-bold uppercase tracking-wider divide-x divide-[#2b6d3d] border-b border-[#1E4D2B]">
                    <th scope="col" rowSpan={2} className="py-2.5 px-3 text-center align-middle font-bold min-w-[200px]">
                      COMPLETE LISTING OF FULL-TIME FACULTY
                    </th>
                    <th scope="col" rowSpan={2} className="py-2.5 px-3 text-center align-middle font-bold min-w-[160px]">
                      Academic Rank
                    </th>
                    <th scope="col" colSpan={2} className="py-1.5 px-2 text-center font-bold">
                      Full-Time Employment Status
                      <div className="text-[9px] font-normal text-white/80 lowercase italic capitalize mt-0.5">
                        (Please mark one.)
                      </div>
                    </th>
                    <th scope="col" colSpan={3} className="py-1.5 px-2 text-center font-bold">
                      On-going Research
                    </th>
                    <th scope="col" rowSpan={2} className="py-2.5 px-3 text-center align-middle font-bold min-w-[200px]">
                      Completed Research
                    </th>
                    <th scope="col" rowSpan={2} className="py-2.5 px-2 text-center align-middle font-bold min-w-[85px]">
                      Year Completed
                    </th>
                    <th scope="col" colSpan={4} className="py-1.5 px-3 text-center font-bold">
                      Outputs of Completed Research for the Past Ten (10) Years
                      <div className="text-[9px] font-normal text-white/80 lowercase italic capitalize mt-0.5">
                        (Please indicate title and year completed. If publication, cite properly.)
                      </div>
                    </th>
                  </tr>

                  {/* Tier 2: Specific Subheaders Matching Spreadsheet */}
                  <tr className="bg-[#F8FAFC] text-[#475569] text-[9.5px] font-semibold divide-x divide-[#E2E8F0] border-b border-[#CBD5E1]">
                    <th scope="col" className="py-1.5 px-2 text-center min-w-[65px]">Permanent</th>
                    <th scope="col" className="py-1.5 px-2 text-center min-w-[70px]">Contractual</th>
                    <th scope="col" className="py-1.5 px-3 text-center min-w-[200px]">Title</th>
                    <th scope="col" className="py-1.5 px-2 text-center min-w-[75px]">Year Started</th>
                    <th scope="col" className="py-1.5 px-2 text-center min-w-[100px]">Expected Year to Finish</th>
                    <th scope="col" className="py-1.5 px-2 text-center min-w-[80px]">Patent/s</th>
                    <th scope="col" className="py-1.5 px-3 text-center min-w-[240px]">Journal Publication/s</th>
                    <th scope="col" className="py-1.5 px-2 text-center min-w-[80px]">Book Publication/s</th>
                    <th scope="col" className="py-1.5 px-2 text-center min-w-[105px] bg-[#1E4D2B]/10 text-[#1E4D2B] font-bold">TERMINAL REPORT</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-[#F1F5F9] bg-white">
                  {Object.keys(groupedHierarchy).length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-10 text-center text-[#64748B]">
                        No matching faculty research records found.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(groupedHierarchy).map(([campusName, departments]) => (
                      <React.Fragment key={campusName}>
                        {/* Level 1: Campus Header Row */}
                        <tr className="bg-[#FAFBF8] border-y border-[#BCC7B9]/60">
                          <td colSpan={13} className="py-2.5 px-4 font-bold text-[#0E3322] text-xs uppercase tracking-wide">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#E8AE1F] mr-2 shrink-0 align-middle" />
                            <span className="align-middle">{campusName}</span>
                          </td>
                        </tr>

                        {/* Level 2: Department Header & Faculty Rows */}
                        {Object.entries(departments).map(([deptName, facultyList]) => (
                          <React.Fragment key={deptName}>
                            <tr className="bg-[#E3EFE8]/40 border-y border-[#1E4D2B]/20">
                              <td colSpan={13} className="py-2 px-6 font-bold text-[#1E4D2B] text-xs">
                                <span className="inline-block w-2 h-2 rounded-full bg-[#1E4D2B] mr-2 shrink-0 align-middle" />
                                <span className="align-middle">{deptName}</span>
                                <span className="text-[#64748B] font-normal text-[11px] ml-2">
                                  ({facultyList.length} {facultyList.length === 1 ? 'researcher' : 'researchers'})
                                </span>
                              </td>
                            </tr>

                            {facultyList.map((row) => {
                              const ongoingList = row.ongoingResearch;
                              const completedList = row.completedResearch;
                              const maxRows = Math.max(1, ongoingList.length, completedList.length);

                              return Array.from({ length: maxRows }).map((_, rIdx) => {
                                const isFirstRow = rIdx === 0;
                                const ongoingItem = ongoingList[rIdx];
                                const completedItem = completedList[rIdx];

                                const patents = completedItem
                                  ? completedItem.outputs.filter((o) => (o.output_type || '').toLowerCase().includes('patent'))
                                  : [];
                                const journals = completedItem
                                  ? completedItem.outputs.filter((o) => (o.output_type || '').toLowerCase().includes('journal') || (!o.output_type?.toLowerCase().includes('book') && !o.output_type?.toLowerCase().includes('patent') && !o.output_type?.toLowerCase().includes('terminal')))
                                  : [];
                                const books = completedItem
                                  ? completedItem.outputs.filter((o) => (o.output_type || '').toLowerCase().includes('book'))
                                  : [];

                                const terminalReportOutput = completedItem
                                  ? completedItem.outputs.find((o) => (o.output_type || '').toLowerCase().includes('terminal') || (o.output_type || '').toLowerCase().includes('report'))
                                  : null;

                                const terminalLink = completedItem?.terminal_report_url || terminalReportOutput?.source_url || null;
                                const totalRows = maxRows;

                                return (
                                  <tr key={`${row.id}-${rIdx}`} className="hover:bg-[#F8FAFC] transition-colors divide-x divide-[#F1F5F9]">
                                    {/* Faculty Name */}
                                    {isFirstRow && (
                                      <td
                                        rowSpan={totalRows}
                                        className="py-2.5 px-3 align-top font-bold text-[#15221A] text-xs break-words bg-white"
                                      >
                                        {row.name}
                                      </td>
                                    )}

                                    {/* Academic Rank */}
                                    {isFirstRow && (
                                      <td
                                        rowSpan={totalRows}
                                        className="py-2.5 px-3 align-top text-[#334155] text-xs break-words bg-white"
                                      >
                                        {row.academicRank}
                                      </td>
                                    )}

                                    {/* Permanent */}
                                    {isFirstRow && (
                                      <td
                                        rowSpan={totalRows}
                                        className="py-2.5 px-2 text-center align-top text-xs text-[#334155] font-medium bg-white"
                                      >
                                        {row.fullTimePermanent ? 'TRUE' : 'FALSE'}
                                      </td>
                                    )}

                                    {/* Contractual */}
                                    {isFirstRow && (
                                      <td
                                        rowSpan={totalRows}
                                        className="py-2.5 px-2 text-center align-top text-xs text-[#334155] font-medium bg-white"
                                      >
                                        {row.fullTimeContractual ? 'TRUE' : 'FALSE'}
                                      </td>
                                    )}

                                    {/* On-going Research: Title */}
                                    <td className="py-2.5 px-3 text-[#15221A] text-xs leading-snug align-top max-w-xs">
                                      {ongoingItem ? (
                                        <div className="font-medium text-[#15221A]">
                                          {ongoingItem.publication_url ? (
                                            <a
                                              href={ongoingItem.publication_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-[#1E4D2B] hover:underline inline-flex items-start gap-1"
                                            >
                                              <span>{ongoingItem.research_title}</span>
                                              <ExternalLink className="w-3 h-3 text-[#1E4D2B] shrink-0 mt-0.5" />
                                            </a>
                                          ) : (
                                            <span>{ongoingItem.research_title}</span>
                                          )}
                                        </div>
                                      ) : null}
                                    </td>

                                    {/* On-going Research: Year Started */}
                                    <td className="py-2.5 px-2 text-center text-[11px] text-[#64748B] align-top whitespace-nowrap">
                                      {ongoingItem ? ongoingItem.year_started || '—' : null}
                                    </td>

                                    {/* On-going Research: Expected Year to Finish */}
                                    <td className="py-2.5 px-2 text-center text-[11px] text-[#64748B] align-top whitespace-nowrap">
                                      {ongoingItem ? ongoingItem.expected_year_to_finish || '—' : null}
                                    </td>

                                    {/* Completed Research: Title */}
                                    <td className="py-2.5 px-3 text-[#15221A] text-xs leading-snug align-top max-w-xs">
                                      {completedItem ? (
                                        <div className="font-medium text-[#15221A]">
                                          {completedItem.publication_url ? (
                                            <a
                                              href={completedItem.publication_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="hover:underline text-[#1E4D2B] inline-flex items-start gap-1"
                                            >
                                              <span>{completedItem.research_title}</span>
                                              <ExternalLink className="w-3 h-3 text-[#1E4D2B] shrink-0 mt-0.5" />
                                            </a>
                                          ) : (
                                            <span>{completedItem.research_title}</span>
                                          )}
                                        </div>
                                      ) : null}
                                    </td>

                                    {/* Year Completed */}
                                    <td className="py-2.5 px-2 text-center text-[11px] text-[#475569] font-medium align-top whitespace-nowrap">
                                      {completedItem ? completedItem.year_completed || completedItem.year_completed_raw || '—' : null}
                                    </td>

                                    {/* Outputs: Patent/s */}
                                    <td className="py-2.5 px-2 text-center text-[11px] text-[#64748B] align-top">
                                      {patents.length > 0 ? (
                                        <div className="space-y-1">
                                          {patents.map((p, pi) => (
                                            <div key={pi} className="text-[#15221A]">{p.output_title_or_citation}</div>
                                          ))}
                                        </div>
                                      ) : null}
                                    </td>

                                    {/* Outputs: Journal Publication/s */}
                                    <td className="py-2.5 px-3 text-[#15221A] text-xs leading-snug align-top max-w-xs">
                                      {journals.length > 0 ? (
                                        <div className="space-y-1">
                                          {journals.map((j, ji) => (
                                            <div key={ji} className="text-[#475569]">
                                              {j.source_url ? (
                                                <a
                                                  href={j.source_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="hover:underline text-[#1E4D2B]"
                                                >
                                                  {j.output_title_or_citation}
                                                </a>
                                              ) : (
                                                j.output_title_or_citation
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : null}
                                    </td>

                                    {/* Outputs: Book Publication/s */}
                                    <td className="py-2.5 px-2 text-center text-[11px] text-[#64748B] align-top">
                                      {books.length > 0 ? (
                                        <div className="space-y-1">
                                          {books.map((b, bi) => (
                                            <div key={bi} className="text-[#15221A]">{b.output_title_or_citation}</div>
                                          ))}
                                        </div>
                                      ) : null}
                                    </td>

                                    {/* Outputs: TERMINAL REPORT */}
                                    <td className="py-2.5 px-2 text-center align-top text-xs">
                                      {terminalLink ? (
                                        <a
                                          href={terminalLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-[10.5px] text-[#1E4D2B] hover:underline font-semibold"
                                        >
                                          <span>Report</span>
                                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                        </a>
                                      ) : null}
                                    </td>
                                  </tr>
                                );
                              });
                            })}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Clean Footer Info */}
          <div className="mt-6 pt-4 border-t border-[#E5E9E2] flex items-center justify-end text-xs text-[#64748B]">
            <span className="font-semibold text-[#1E4D2B]">
              Showing {filteredFaculty.length} of {headlineMetrics.activeFaculty} actively involved researchers
            </span>
          </div>
        </div>

        {/* Card 2: Summary by campus and school — Clean Tabular Presentation */}
        <div id="summary-section" className="bg-white border border-[#E5E9E2] rounded-[24px] p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)] mb-8 scroll-mt-6">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F] shrink-0" />
              <h2 className="text-2xl font-bold text-[#15221A]">Summary by campus and school</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 300, behavior: 'smooth' })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E4D2B] bg-[#E3EFE8] border border-[#1E4D2B]/20 rounded-full hover:bg-[#1E4D2B] hover:text-white transition-all cursor-pointer"
                title="Scroll back up to Faculty Directory"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Back to Directory</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-[#64748B] pl-5 mb-5">
            Faculty count and research engagement rate per school and academic department.
          </p>

          {/* Campus Filter Pills for Summary Table */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSummaryCampus('All campuses')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  summaryCampus === 'All campuses'
                    ? 'bg-[#0E3322] text-white shadow-xs'
                    : 'bg-[#EEF1EB] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                <span>TOTAL</span>
              </button>
              {groupedSummary.groups
                .filter((group) => {
                  const upper = group.campusName.trim().toUpperCase();
                  return upper !== 'ALL CAMPUSES' && !upper.includes('GRAND TOTAL') && group.rows.length > 0;
                })
                .map((group) => {
                  const isSelected = summaryCampus === group.campusName;
                  const shortName = group.campusName.replace(/\s+Campus$/i, '');
                  return (
                    <button
                      key={group.campusName}
                      type="button"
                      onClick={() => setSummaryCampus(group.campusName)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0E3322] text-white shadow-xs'
                          : 'bg-[#EEF1EB] text-[#475569] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      <span>{shortName}</span>
                    </button>
                  );
                })}
            </div>

            {summaryCampus !== 'All campuses' && (
              <button
                type="button"
                onClick={() => setSummaryCampus('All campuses')}
                className="text-xs text-[#1E4D2B] hover:underline font-semibold cursor-pointer whitespace-nowrap pl-1"
              >
                Show all campuses
              </button>
            )}
          </div>

          <div className="overflow-x-auto custom-table-scrollbar border border-[#E2E8F0] rounded-xl">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="bg-[#1E4D2B] text-white text-[10.5px] font-bold uppercase tracking-wider divide-x divide-[#2b6d3d] border-b border-[#1E4D2B]">
                  <th scope="col" className="py-3 pl-4 pr-3">Campus / School</th>
                  <th scope="col" className="py-3 px-3 text-right">No. of Faculty</th>
                  <th scope="col" className="py-3 px-3 text-right">Ongoing</th>
                  <th scope="col" className="py-3 px-2 text-right">%</th>
                  <th scope="col" className="py-3 px-3 text-right">Completed</th>
                  <th scope="col" className="py-3 px-2 text-right">%</th>
                  <th scope="col" className="py-3 px-3 text-right">Both</th>
                  <th scope="col" className="py-3 pr-4 pl-2 text-right">%</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-[#F1F5F9] bg-white">
                {displayedSummaryGroups.map((group) => (
                  <React.Fragment key={group.campusName}>
                    <tr className="bg-[#FAFBF8] border-y border-[#BCC7B9]/60">
                      <td colSpan={8} className="py-2.5 px-4">
                        <div className="font-bold text-[#0E3322] text-xs uppercase tracking-wide flex items-center gap-2">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#E8AE1F] shrink-0" />
                          <span>{group.campusName}</span>
                        </div>
                      </td>
                    </tr>
                    {group.rows.map((r) => (
                      <tr key={r.department_or_academic_program} className="hover:bg-[#F8FAFC] transition-colors divide-x divide-[#F1F5F9]">
                        <td className="py-2.5 pl-6 pr-3 text-[#15221A] font-medium">
                          {r.department_or_academic_program}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-[#15221A]">{r.total_faculty}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-[#15221A]">{r.ongoing_faculty}</td>
                        <td className="py-2.5 px-2 text-right text-[#64748B]">{Number(r.ongoing_percentage).toFixed(2)}%</td>
                        <td className="py-2.5 px-3 text-right font-medium text-[#1E4D2B]">{r.completed_faculty}</td>
                        <td className="py-2.5 px-2 text-right text-[#64748B]">{Number(r.completed_percentage).toFixed(2)}%</td>
                        <td className="py-2.5 px-3 text-right font-medium text-[#15221A]">{r.both_faculty}</td>
                        <td className="py-2.5 pr-4 pl-2 text-right text-[#64748B]">{Number(r.both_percentage).toFixed(2)}%</td>
                      </tr>
                    ))}
                    {group.totalRow && (
                      <tr className="bg-[#FAFBF8] font-bold text-[#15221A] border-t border-[#E2E8F0] divide-x divide-[#E2E8F0]">
                        <td className="py-3 pl-6 pr-3 text-[#0E3322]">
                          {group.campusName} TOTAL
                        </td>
                        <td className="py-3 px-3 text-right">{group.totalRow.total_faculty}</td>
                        <td className="py-3 px-3 text-right text-[#15221A]">{group.totalRow.ongoing_faculty}</td>
                        <td className="py-3 px-2 text-right">{Number(group.totalRow.ongoing_percentage).toFixed(2)}%</td>
                        <td className="py-3 px-3 text-right text-[#1E4D2B]">{group.totalRow.completed_faculty}</td>
                        <td className="py-3 px-2 text-right">{Number(group.totalRow.completed_percentage).toFixed(2)}%</td>
                        <td className="py-3 px-3 text-right">{group.totalRow.both_faculty}</td>
                        <td className="py-3 pr-4 pl-2 text-right">{Number(group.totalRow.both_percentage).toFixed(2)}%</td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {summaryCampus === 'All campuses' && groupedSummary.grandTotal && (
                  <tr className="bg-[#E3EFE8] font-extrabold text-[#0E3322] border-t-2 border-[#1E4D2B] divide-x divide-[#BCC7B9]/60">
                    <td className="py-3.5 pl-4 pr-3 text-sm font-extrabold text-[#0E3322]">
                      Overall Total
                    </td>
                    <td className="py-3.5 px-3 text-right text-sm">{groupedSummary.grandTotal.total_faculty}</td>
                    <td className="py-3.5 px-3 text-right text-sm text-[#0E3322]">{groupedSummary.grandTotal.ongoing_faculty}</td>
                    <td className="py-3.5 px-2 text-right">{Number(groupedSummary.grandTotal.ongoing_percentage).toFixed(2)}%</td>
                    <td className="py-3.5 px-3 text-right text-sm text-[#1E4D2B]">{groupedSummary.grandTotal.completed_faculty}</td>
                    <td className="py-3.5 px-2 text-right">{Number(groupedSummary.grandTotal.completed_percentage).toFixed(2)}%</td>
                    <td className="py-3.5 px-3 text-right text-sm">{groupedSummary.grandTotal.both_faculty}</td>
                    <td className="py-3.5 pr-4 pl-2 text-right">{Number(groupedSummary.grandTotal.both_percentage).toFixed(2)}%</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Complete Research List Modal when clicking "View all records" */}
      {selectedModalFaculty && (() => {
        const extractYear = (val?: string | number | null): number => {
          if (val == null) return 0;
          const matches = String(val).match(/\b(19|20)\d{2}\b/g);
          if (!matches || matches.length === 0) return 0;
          return Math.max(...matches.map((m) => parseInt(m, 10)));
        };

        const modalOngoing = [...selectedModalFaculty.ongoingResearch].sort(
          (a, b) => extractYear(b.year_started) - extractYear(a.year_started)
        );
        const modalCompleted = [...selectedModalFaculty.completedResearch].sort(
          (a, b) =>
            extractYear(b.year_completed || b.year_completed_raw) -
            extractYear(a.year_completed || a.year_completed_raw)
        );
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            onClick={() => setSelectedModalFaculty(null)}
          >
            <div
              className="bg-white border border-[#E5E9E2] rounded-[24px] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-[#0E3322] px-6 py-5 flex items-start justify-between gap-4 text-white shrink-0">
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-lg sm:text-xl text-white leading-snug break-words">
                    {selectedModalFaculty.name}
                  </h3>
                  {selectedModalFaculty.academicRank && (
                    <p className="text-xs text-[#E3EFE8] font-medium mt-1 leading-relaxed break-words">
                      {selectedModalFaculty.academicRank}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden sm:flex items-center gap-4 pr-2 border-r border-white/15">
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-extrabold text-[#E8AE1F] leading-none">
                        {modalCompleted.length}
                      </span>
                      <span className="text-[10px] text-[#E3EFE8] mt-1">completed</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-extrabold text-[#E8AE1F] leading-none">
                        {modalOngoing.length}
                      </span>
                      <span className="text-[10px] text-[#E3EFE8] mt-1">ongoing</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedModalFaculty(null)}
                    aria-label="Close research modal"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Scrollable Research List */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-white">
                {/* Ongoing Research Section */}
                {modalOngoing.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E5E9E2] pb-2">
                      <span className="text-xs font-bold tracking-wider text-[#0E3322] uppercase">
                        Ongoing Research ({modalOngoing.length})
                      </span>
                    </div>

                    <div className="divide-y divide-[#F1F5F9]">
                      {modalOngoing.map((r, idx) => {
                        const sourceUrl = r.publication_url || r.outputs?.[0]?.source_url;

                        return (
                          <div key={r.id} className="py-3.5 first:pt-1 last:pb-1 space-y-1.5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="font-semibold text-xs sm:text-sm text-[#15221A] leading-snug flex-1 break-words">
                                <span className="text-[#64748B] font-bold mr-1.5">{idx + 1}.</span>
                                {sourceUrl ? (
                                  <a
                                    href={sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#1E4D2B] hover:underline font-semibold inline"
                                  >
                                    <span>{r.research_title}</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-[#1E4D2B] inline-block ml-1 -mt-0.5 shrink-0" />
                                  </a>
                                ) : (
                                  <span>{r.research_title}</span>
                                )}
                              </div>
                            </div>

                            <div className="text-xs text-[#64748B] pl-4">
                              <span>Year started: <strong className="font-semibold text-[#15221A]">{r.year_started || '—'}</strong></span>
                              {r.expected_year_to_finish && (
                                <>
                                  <span className="mx-2 text-[#BCC7B9]">·</span>
                                  <span>Expected completion: <strong className="font-semibold text-[#15221A]">{r.expected_year_to_finish}</strong></span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Completed Research Section */}
                {modalCompleted.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E5E9E2] pb-2">
                      <span className="text-xs font-bold tracking-wider text-[#0E3322] uppercase">
                        Completed Research ({modalCompleted.length})
                      </span>
                    </div>

                    <div className="divide-y divide-[#F1F5F9]">
                      {modalCompleted.map((r, idx) => {
                        const yr = r.year_completed || r.year_completed_raw;
                        const primaryOutput = r.outputs?.[0];
                        const sourceUrl = r.publication_url || primaryOutput?.source_url;

                        return (
                          <div key={r.id} className="py-3.5 first:pt-1 last:pb-1 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="font-semibold text-xs sm:text-sm text-[#15221A] leading-snug flex-1 break-words">
                                <span className="text-[#64748B] font-bold mr-1.5">{idx + 1}.</span>
                                {sourceUrl ? (
                                  <a
                                    href={sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#1E4D2B] hover:underline font-semibold inline"
                                  >
                                    <span>{r.research_title}</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-[#1E4D2B] inline-block ml-1 -mt-0.5 shrink-0" />
                                  </a>
                                ) : (
                                  <span>{r.research_title}</span>
                                )}
                              </div>

                              {yr && (
                                <span className="text-xs font-bold text-[#1E4D2B] shrink-0 whitespace-nowrap">
                                  {yr}
                                </span>
                              )}
                            </div>

                            {r.outputs && r.outputs.length > 0 && (
                              <div className="space-y-1.5 pl-4">
                                {r.outputs
                                  .filter((out) => out.output_title_or_citation && out.output_title_or_citation !== r.research_title)
                                  .map((out) => (
                                    <div key={out.id} className="min-w-0">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                                        {out.output_type || 'JOURNAL PUBLICATION'}
                                      </span>
                                      <p className="text-xs text-[#15221A] font-medium leading-relaxed mt-0.5 break-words">
                                        {out.output_title_or_citation}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-[#FAFBF8] border-t border-[#E5E9E2] flex items-center justify-between gap-4 shrink-0">
                <span className="text-xs text-[#64748B] truncate">
                  {selectedModalFaculty.campus} — {selectedModalFaculty.department}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedModalFaculty(null)}
                  className="px-4 py-2 rounded-xl bg-[#0E3322] hover:bg-[#1E4D2B] text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
