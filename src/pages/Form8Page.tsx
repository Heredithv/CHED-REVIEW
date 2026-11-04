import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  Building2,
  Users,
  Clock,
  Search,
  FileText,
  CheckCircle2,
  ExternalLink,
  Calendar,
  RefreshCw,
  AlertCircle,
  Award,
  ChevronDown,
  Layers,
  MapPin,
  Target,
  FileCheck,
  GraduationCap
} from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { exportForm8ToExcel } from '../utils/excelExport';
import { getSupabaseClient } from '../data/api';
import { DocumentLinkPreview } from '../components/DocumentLinkPreview';

export interface Form8AgencyPartner {
  name: string;
  moaDocumentName?: string;
  moaUrl?: string;
}

export interface Form8OutreachProgram {
  id: string;
  no: number;
  category: string;
  schoolYear: string;
  campus: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE';
  title: string;
  rawTitle?: string;
  documentName?: string;
  documentUrl?: string;
  extensionProposalTitle: string;
  extensionProposalDocumentName?: string;
  extensionProposalUrl?: string;
  researchOutputAppliedTitle: string;
  researchOutputAuthors?: string;
  researchOutputDocumentName?: string;
  researchOutputUrl?: string;
  objectives: string[];
  collaboratingAgencies: Form8AgencyPartner[];
  targetCommunity: string;
  durationAndFrequency: string;
  deliverables: string;
  expectedOutcomes: string[];
  participantsStudents: number;
  participantsFaculty: number;
  participantsStaff: number;
  participantsBeneficiaries: number;
}

// Clean document name or raw string to a readable academic title
function formatDisplayTitle(raw?: string | null, fallback = ''): string {
  if (!raw) return fallback;
  const cleaned = raw
    .replace(/\.pdf$/i, '')
    .replace(/^(\d+[\.\-\s]+)+/, '') // remove leading numbering like "10. "
    .replace(/[_\-]+/g, ' ')
    .trim();
  return cleaned || fallback;
}

// Normalize campus string from DB ('MAIN CAMPUS', 'DUMINGAG CAMPUS', etc.)
function normalizeCampus(raw?: string | null): 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE' {
  if (!raw) return 'Main';
  const lower = raw.toLowerCase();
  if (lower.includes('dumingag')) return 'Dumingag';
  if (lower.includes('pagadian')) return 'Pagadian';
  if (lower.includes('cmse') || lower.includes('canuto')) return 'CMSE';
  return 'Main';
}



const FORM8_CACHE_KEY = 'jhcsc_form8_supabase_v1';
let cachedForm8Programs: Form8OutreachProgram[] | null = null;
let prefetchForm8Promise: Promise<Form8OutreachProgram[] | null> | null = null;

function cleanNullableText(val?: string | null): string {
  if (!val) return '';
  const trimmed = String(val).trim();
  if (!trimmed || trimmed.toUpperCase() === 'NULL' || trimmed.toUpperCase() === 'EMPTY') {
    return '';
  }
  return trimmed;
}

export async function fetchAllForm8Data(): Promise<Form8OutreachProgram[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured or could not be initialized.');
  }

  // Concurrently query form8 and form8_evidences using exact schema columns
  const [f8Res, evRes] = await Promise.all([
    supabase
      .from('form8')
      .select(
        'id,campus_name,school_year,program_no,outreach_title,extension_proposal,research_applied,objectives,collaborating_agency,target_beneficiaries,duration_frequency,expected_outputs,expected_outcome,participants_students,participants_faculty,participants_staff,participants_beneficiaries'
      )
      .order('id', { ascending: true }),
    supabase
      .from('form8_evidences')
      .select('id,parent_id,column_source,evidence_text,drive_link')
      .order('id', { ascending: true })
  ]);

  if (f8Res.error) {
    throw new Error(`Failed to load Form 8 outreach programs: ${f8Res.error.message}`);
  }
  if (evRes.error) {
    throw new Error(`Failed to load Form 8 evidences: ${evRes.error.message}`);
  }

  // Index form8_evidences by parent_id (foreign key referencing form8.id)
  const evidencesByParentId = new Map<
    number,
    Array<{
      id: number;
      parent_id: number;
      column_source: string;
      evidence_text: string;
      drive_link: string;
    }>
  >();

  (evRes.data || []).forEach((ev: any) => {
    const pid = Number(ev.parent_id);
    if (!pid) return;
    if (!evidencesByParentId.has(pid)) {
      evidencesByParentId.set(pid, []);
    }
    evidencesByParentId.get(pid)!.push({
      id: Number(ev.id),
      parent_id: pid,
      column_source: cleanNullableText(ev.column_source),
      evidence_text: cleanNullableText(ev.evidence_text),
      drive_link: cleanNullableText(ev.drive_link)
    });
  });

  const rawRows = f8Res.data || [];
  const mapped: Form8OutreachProgram[] = rawRows.map((d: any, idx: number) => {
    const rowId = Number(d.id);
    const progNo = Number(d.program_no) || idx + 1;
    const schoolYear = cleanNullableText(d.school_year) || '2026';
    const campus = normalizeCampus(d.campus_name);
    const rowEvidences = evidencesByParentId.get(rowId) || [];

    const outreachEv = rowEvidences.find(
      (e) => e.column_source.toLowerCase() === 'outreach title'
    );
    const proposalEv = rowEvidences.find(
      (e) => e.column_source.toLowerCase() === 'extension proposal'
    );
    const researchEv = rowEvidences.find(
      (e) => e.column_source.toLowerCase() === 'research outputs'
    );
    const moaEvs = rowEvidences.filter(
      (e) => e.column_source.toLowerCase() === 'collaborating agency moa'
    );

    // Outreach Title & Evidence Document
    const rawOutreachTitle =
      cleanNullableText(d.outreach_title) ||
      outreachEv?.evidence_text ||
      cleanNullableText(d.extension_proposal) ||
      proposalEv?.evidence_text ||
      `Outreach Program No. ${progNo}`;
    const displayTitle = formatDisplayTitle(rawOutreachTitle, `Outreach Program No. ${progNo}`);

    // Extension Proposal & Evidence Document
    const proposalRaw =
      cleanNullableText(d.extension_proposal) || proposalEv?.evidence_text || '';
    const proposalTitle = formatDisplayTitle(proposalRaw, proposalRaw);

    // Applied Research Output & Evidence Document
    const researchRaw =
      cleanNullableText(d.research_applied) || researchEv?.evidence_text || '';
    const researchTitle = formatDisplayTitle(researchRaw, researchRaw);

    // Collaborating Agency / MOA Documents
    const agencies: Form8AgencyPartner[] = [];
    if (moaEvs.length > 0) {
      moaEvs.forEach((moa) => {
        const label = formatDisplayTitle(
          moa.evidence_text || cleanNullableText(d.collaborating_agency),
          moa.evidence_text || 'Collaborating Partner'
        );
        agencies.push({
          name: label,
          moaDocumentName: moa.evidence_text || undefined,
          moaUrl: moa.drive_link || undefined
        });
      });
    } else {
      const agencyRaw = cleanNullableText(d.collaborating_agency);
      if (agencyRaw) {
        agencies.push({
          name: formatDisplayTitle(agencyRaw, agencyRaw),
          moaDocumentName: agencyRaw
        });
      }
    }

    // Parse objectives
    let objectivesList: string[] = [];
    const rawObjectives = cleanNullableText(d.objectives);
    if (rawObjectives) {
      objectivesList = rawObjectives
        .split(/\r?\n|(?=\b\d+\.\s+)/)
        .map((s: string) => s.replace(/^\d+\.\s*/, '').trim())
        .filter((s: string) => s.length > 2);
    }

    // Parse expected outcomes
    let outcomesList: string[] = [];
    const rawOutcome = cleanNullableText(d.expected_outcome);
    if (rawOutcome) {
      outcomesList = rawOutcome
        .split(/\r?\n|(?=\b\d+\.\s+)/)
        .map((s: string) => s.replace(/^\d+\.\s*/, '').trim())
        .filter((s: string) => s.length > 2);
    }

    const durationAndFrequencyStr = cleanNullableText(d.duration_frequency) || '—';

    return {
      id: String(d.id || `f8-${idx}`),
      no: progNo,
      category: `SY ${schoolYear}`,
      schoolYear,
      campus,
      title: displayTitle,
      rawTitle: cleanNullableText(d.outreach_title) || undefined,
      documentName: outreachEv?.evidence_text || cleanNullableText(d.outreach_title) || undefined,
      documentUrl: outreachEv?.drive_link || undefined,
      extensionProposalTitle: proposalTitle,
      extensionProposalDocumentName:
        proposalEv?.evidence_text || cleanNullableText(d.extension_proposal) || undefined,
      extensionProposalUrl: proposalEv?.drive_link || undefined,
      researchOutputAppliedTitle: researchTitle,
      researchOutputDocumentName:
        researchEv?.evidence_text || cleanNullableText(d.research_applied) || undefined,
      researchOutputUrl: researchEv?.drive_link || undefined,
      objectives: objectivesList,
      collaboratingAgencies: agencies,
      targetCommunity: cleanNullableText(d.target_beneficiaries) || '—',
      durationAndFrequency: durationAndFrequencyStr,
      deliverables: cleanNullableText(d.expected_outputs) || '—',
      expectedOutcomes: outcomesList,
      participantsStudents: Number(d.participants_students || 0),
      participantsFaculty: Number(d.participants_faculty || 0),
      participantsStaff: Number(d.participants_staff || 0),
      participantsBeneficiaries: Number(d.participants_beneficiaries || 0)
    };
  });

  cachedForm8Programs = mapped;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FORM8_CACHE_KEY, JSON.stringify(mapped));
    }
  } catch {}

  return mapped;
}

export function preloadForm8Data(): Promise<Form8OutreachProgram[] | null> {
  if (cachedForm8Programs) return Promise.resolve(cachedForm8Programs);
  if (prefetchForm8Promise) return prefetchForm8Promise;

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(FORM8_CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedForm8Programs = parsed;
        }
      }
    } catch {}
  }

  prefetchForm8Promise = fetchAllForm8Data()
    .catch((err) => {
      console.warn('Form 8 background preload failed:', err);
      return cachedForm8Programs;
    })
    .finally(() => {
      prefetchForm8Promise = null;
    });

  return prefetchForm8Promise;
}

export const Form8Page: React.FC = () => {
  // ZERO MOCK DATA: Directly populated from Supabase form8 and form8_evidences
  const [programs, setPrograms] = useState<Form8OutreachProgram[]>(() => {
    if (cachedForm8Programs) return cachedForm8Programs;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(FORM8_CACHE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            cachedForm8Programs = parsed;
            return parsed;
          }
        }
      } catch {}
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(
    () => !cachedForm8Programs || cachedForm8Programs.length === 0
  );
  const [error, setError] = useState<string | null>(null);
  const [, setLastSynced] = useState<string | null>(null);

  // Filters & Views
  const [selectedCampus, setSelectedCampus] = useState<string>('All campuses');
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('All years');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Layout views: 'cards' (Extended blocks matching Forms 1-4) and 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Fetch live Form 8 records directly from Supabase
  const loadSupabaseForm8Data = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh || !cachedForm8Programs || cachedForm8Programs.length === 0) {
        setLoading(true);
      }
      setError(null);
      const mapped = await fetchAllForm8Data();
      setPrograms(mapped);
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      console.error('Error fetching Supabase Form 8 data:', err);
      setError(err?.message || 'Failed to connect to Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupabaseForm8Data();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel('form8_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'form8' }, () => {
        loadSupabaseForm8Data();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'form8_evidences' }, () => {
        loadSupabaseForm8Data();
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, []);

  // Distinct School Years available in live Supabase dataset
  const availableSchoolYears = useMemo(() => {
    const set = new Set<string>();
    programs.forEach((p) => {
      if (p.schoolYear) set.add(p.schoolYear);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [programs]);

  // Filtered Programs
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      // Campus filter
      if (selectedCampus !== 'All campuses' && p.campus !== selectedCampus) {
        return false;
      }
      // School Year filter
      if (selectedSchoolYear !== 'All years' && p.schoolYear !== selectedSchoolYear) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q) || (p.rawTitle || '').toLowerCase().includes(q);
        const inProposal = p.extensionProposalTitle.toLowerCase().includes(q);
        const inResearch = p.researchOutputAppliedTitle.toLowerCase().includes(q);
        const inCommunity = p.targetCommunity.toLowerCase().includes(q);
        const inAgencies = p.collaboratingAgencies.some((a) => a.name.toLowerCase().includes(q));
        const inDeliverables = p.deliverables.toLowerCase().includes(q);
        return inTitle || inProposal || inResearch || inCommunity || inAgencies || inDeliverables;
      }
      return true;
    });
  }, [programs, selectedCampus, selectedSchoolYear, searchQuery]);

  // Real Aggregate Metrics directly from Supabase records
  const metrics = useMemo(() => {
    const totalPrograms = programs.length;
    const totalStudents = programs.reduce((acc, p) => acc + (p.participantsStudents || 0), 0);
    const totalFacultyAndStaff = programs.reduce(
      (acc, p) => acc + (p.participantsFaculty || 0) + (p.participantsStaff || 0),
      0
    );
    const totalBeneficiaries = programs.reduce((acc, p) => acc + (p.participantsBeneficiaries || 0), 0);
    return { totalPrograms, totalStudents, totalFacultyAndStaff, totalBeneficiaries };
  }, [programs]);

  // Grouped by Campus & Category
  const groupedHierarchy = useMemo(() => {
    const campusOrder = ['Main', 'Dumingag', 'Pagadian', 'CMSE'];
    const map: Record<string, Record<string, Form8OutreachProgram[]>> = {};

    filteredPrograms.forEach((p) => {
      const camp = `${p.campus} Campus`;
      const cat = p.category || 'Based on Faculty Research';
      if (!map[camp]) map[camp] = {};
      if (!map[camp][cat]) map[camp][cat] = [];
      map[camp][cat].push(p);
    });

    // Reorder campuses according to institutional order
    const orderedMap: Record<string, Record<string, Form8OutreachProgram[]>> = {};
    campusOrder.forEach((c) => {
      const key = `${c} Campus`;
      if (map[key]) orderedMap[key] = map[key];
    });
    // Add any remaining
    Object.keys(map).forEach((k) => {
      if (!orderedMap[k]) orderedMap[k] = map[k];
    });

    return orderedMap;
  }, [filteredPrograms]);

  // Excel Export Handler using live Supabase data
  const handleExportExcel = () => {
    const rows = filteredPrograms.map((p) => ({
      'No.': p.no,
      'Campus': `${p.campus} Campus`,
      'School Year': `SY ${p.schoolYear}`,
      'Title of Outreach Programs or Activities': p.title,
      'Document Name (Evidence)': p.documentName || '',
      'Title of Extension Proposals': p.extensionProposalTitle,
      'Title & Author/s of Research Outputs Being Applied': p.researchOutputAppliedTitle,
      'Objectives of the Outreach Program or Activity': p.objectives.map((o, idx) => `${idx + 1}. ${o}`).join('\n'),
      'Collaborating Agency / Organization': p.collaboratingAgencies.map((a) => a.name).join(', '),
      'Target Community and Beneficiaries': p.targetCommunity,
      'Duration & Frequency': p.durationAndFrequency,
      'Deliverables / Outputs': p.deliverables,
      'Expected Outcome': p.expectedOutcomes.map((o, idx) => `${idx + 1}. ${o}`).join('\n'),
      'Students': p.participantsStudents || 0,
      'Faculty': p.participantsFaculty || 0,
      'Staff': p.participantsStaff || 0,
      'Beneficiaries': p.participantsBeneficiaries || 0
    }));
    exportForm8ToExcel(rows);
  };

  return (
    <div className="w-full bg-[#F4F6F1] pb-16 font-sans">
      {/* Pine Hero Band */}
      <InnerHeroBand
        breadcrumb="Form 8"
        title="Form 8 Community Outreach Programs"
        subtitle="Comprehensive institutional repository of community outreach programs, extension proposals, applied faculty research, collaborating partner agencies, and beneficiary impact."
      />

      {/* Hero Stats Overlay — Full max-w-[1360px] matching Forms 1-4 */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Total Outreach Programs */}
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-[#EEF1EB] rounded animate-pulse" />
              ) : (
                metrics.totalPrograms
              )}
            </div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">Outreach programs recorded</div>
          </div>

          {/* Card 2: Student Participants Engaged */}
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-[#EEF1EB] rounded animate-pulse" />
              ) : (
                metrics.totalStudents.toLocaleString()
              )}
            </div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">Student participants engaged</div>
          </div>

          {/* Card 3: Faculty & Extension Staff */}
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-[#EEF1EB] rounded animate-pulse" />
              ) : (
                metrics.totalFacultyAndStaff.toLocaleString()
              )}
            </div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">Faculty &amp; extension staff</div>
          </div>

          {/* Card 4: Community Beneficiaries Reached */}
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-[#EEF1EB] rounded animate-pulse" />
              ) : (
                metrics.totalBeneficiaries.toLocaleString()
              )}
            </div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">Community beneficiaries reached</div>
          </div>
        </div>

        {/* Main Card — Extended full width matching Forms 1-4 */}
        <div className="bg-white border border-[#E5E9E2] rounded-[24px] p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)]">
          {/* Card Title and Subtitle */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F]" />
              <h2 className="text-2xl font-bold text-[#15221A]">Outreach Programs</h2>
            </div>
            <p className="text-xs text-[#64748B] pl-5">
              Comprehensive inventory of J.H. Cerilles State College outreach programs, extension proposals, applied faculty research, signed agreements, and community impact.
            </p>
          </div>

          <div className="w-full border-b border-dashed border-[#CBD5E1] mb-6" />

          {/* Supabase Error Alert Notice if query failed */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold block text-sm">Supabase Connection Notice</span>
                <span>{error}</span>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => loadSupabaseForm8Data(true)}
                    className="underline font-bold text-[#1E4D2B] hover:text-[#0E3322]"
                  >
                    Click here to retry fetching from Supabase
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar — Matching Form 1 & Form 2 layout */}
          <div className="space-y-4 mb-8">
            {/* Top Row: Campus Tabs on Left, Layout Switcher & Export on Right */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Campus Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'All campuses', label: 'All campuses' },
                  { id: 'Main', label: 'Main' },
                  { id: 'Dumingag', label: 'Dumingag' },
                  { id: 'Pagadian', label: 'Pagadian' },
                  { id: 'CMSE', label: 'CMSE' }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCampus(c.id)}
                    type="button"
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      selectedCampus === c.id
                        ? 'bg-[#0E3322] text-white shadow-xs'
                        : 'bg-[#EEF1EB] text-[#475569] hover:bg-[#E2E8F0]'
                    }`}
                  >
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>

              {/* View Switcher (Cards | Table) & Export Buttons */}
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
                    title="Present outreach programs as institutional cards"
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
                    title="Present complete CHED Form U8 spreadsheet"
                  >
                    <span>Table</span>
                  </button>
                </div>

                <a
                  href="https://docs.google.com/spreadsheets/d/1HztU0vxM-cPRdSauJS4MQLt5oB6JQKdgF8vP4qlqQPU/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs rounded-full hover:bg-[#1E4D2B]/5 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                  title="Open Form 8 Google Spreadsheet"
                >
                  <span>View spreadsheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Bottom Row: School Year Selector & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* School Year Filter */}
                {availableSchoolYears.length > 0 && (
                  <div className="relative inline-block">
                    <select
                      value={selectedSchoolYear}
                      onChange={(e) => setSelectedSchoolYear(e.target.value)}
                      className="appearance-none bg-white text-[#475569] hover:bg-[#F4F6F1] text-xs font-medium py-1.5 pl-3 pr-7 rounded-full border border-[#E5E9E2] focus:ring-2 focus:ring-[#1E4D2B] cursor-pointer shadow-2xs"
                    >
                      <option value="All years">All school years</option>
                      {availableSchoolYears.map((sy) => (
                        <option key={sy} value={sy}>
                          SY {sy}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}

                {(selectedCampus !== 'All campuses' ||
                  selectedSchoolYear !== 'All years' ||
                  searchQuery.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCampus('All campuses');
                      setSelectedSchoolYear('All years');
                      setSearchQuery('');
                    }}
                    className="text-xs text-[#1E4D2B] hover:underline font-semibold cursor-pointer pl-1 whitespace-nowrap"
                  >
                    Reset filters
                  </button>
                )}
              </div>

              {/* Search input */}
              <div className="relative min-w-[260px] w-full sm:w-[320px] md:w-[360px]">
                <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search outreach programs, proposals, agencies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-[#E5E9E2] rounded-full focus:outline-none focus:border-[#1E4D2B] shadow-2xs placeholder:text-[#94A3B8]"
                />
              </div>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-6 py-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-[#E5E9E2] rounded-2xl p-6 bg-white space-y-4 animate-pulse">
                  <div className="h-6 bg-[#EEF1EB] rounded w-2/3" />
                  <div className="h-4 bg-[#EEF1EB] rounded w-1/3" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="h-20 bg-[#F4F6F1] rounded-xl" />
                    <div className="h-20 bg-[#F4F6F1] rounded-xl" />
                    <div className="h-20 bg-[#F4F6F1] rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State when no data is returned from Supabase */}
          {!loading && filteredPrograms.length === 0 && (
            <div className="py-16 text-center text-xs text-[#64748B] bg-[#FAFBF8] rounded-2xl border border-dashed border-[#CBD5E1]">
              <Layers className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
              <div className="font-semibold text-sm text-[#1E293B] mb-1">
                No outreach programs found
              </div>
              <p className="max-w-md mx-auto text-[#64748B] mb-4">
                {programs.length === 0
                  ? 'No records currently detected in the form8_outreach_programs table in Supabase. Any changes or entries added to the database will automatically display here.'
                  : 'No records matched the selected campus, school year, or search filters.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCampus('All campuses');
                  setSelectedSchoolYear('All years');
                  setSearchQuery('');
                  loadSupabaseForm8Data(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-[#0E3322] bg-[#E3EFE8] hover:bg-[#d0e5d8] transition-all cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Filters &amp; Reload</span>
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CARDS VIEW — Extended Full-Length Institutional Cards (Matching Forms 1-4) */}
          {/* ========================================================================= */}
          {!loading && viewMode === 'cards' && filteredPrograms.length > 0 && (
            <div className="space-y-12">
              {Object.entries(groupedHierarchy).map(([campusName, categories]) => (
                <div key={campusName} className="space-y-8">
                  {Object.entries(categories).map(([catName, programList]) => (
                    <div key={catName} className="space-y-6">
                      {/* Section Heading with Amber Dot & Dashed Line */}
                      <div className="flex items-center gap-2.5 w-full pt-2 pb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F] shrink-0" />
                        <h3 className="font-display font-bold text-base sm:text-lg text-[#0E3322] tracking-tight whitespace-nowrap">
                          {campusName} — {catName}
                        </h3>
                        <span className="text-xs font-normal text-[#64748B] shrink-0">
                          {programList.length} {programList.length === 1 ? 'program' : 'programs'}
                        </span>
                        <div className="flex-1 border-t border-dashed border-[#CBD5E1] ml-2 hidden sm:block" />
                      </div>

                      {/* Extended Full-Width Blocks (Single column spanning 100% width matching Forms 1-4) */}
                      <div className="space-y-6">
                        {programList.map((prog) => (
                          <div
                            key={prog.id}
                            className="bg-white border border-[#E5E9E2] rounded-[20px] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                          >
                            {/* Deep Pine Green Top Banner */}
                            <div className="bg-[#0E3322] px-6 py-4 flex flex-wrap items-start justify-between gap-4 text-white">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                  <span className="text-xs text-[#CBD5E1] font-medium">
                                    {prog.campus} Campus · SY {prog.schoolYear}
                                  </span>
                                </div>
                                <h4 className="font-bold text-white text-base sm:text-lg leading-snug tracking-tight">
                                  {prog.title}
                                </h4>
                              </div>

                              {/* Document Action Button */}
                              {prog.documentUrl && (
                                <DocumentLinkPreview
                                  url={prog.documentUrl}
                                  title={prog.title || 'Outreach Program Document'}
                                >
                                  <a
                                    href={prog.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full border border-white/20 transition-all shrink-0 shadow-2xs"
                                    title="Open outreach program PDF document in Google Drive"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>View Document</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </DocumentLinkPreview>
                              )}
                            </div>

                            {/* Extended Block Body: Structured 3-Column Grid */}
                            <div className="p-6 sm:p-7 space-y-6 bg-white">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Column 1: Research Outputs & Extension Proposals */}
                                <div className="space-y-4">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                                    <Award className="w-3.5 h-3.5 text-[#1E4D2B]" />
                                    RESEARCH OUTPUTS &amp; EXTENSION PROPOSALS
                                  </span>

                                  {/* Research Output Panel */}
                                  <div className="bg-[#FAFBF8] border border-[#E5E9E2] rounded-xl p-4 space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-bold text-[#64748B] uppercase">
                                        Research Outputs Being Applied
                                      </span>
                                      {prog.researchOutputUrl && (
                                        <DocumentLinkPreview
                                          url={prog.researchOutputUrl}
                                          title={prog.researchOutputAppliedTitle || 'Research Abstract PDF'}
                                        >
                                          <a
                                            href={prog.researchOutputUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] text-[#1E4D2B] hover:underline font-semibold inline-flex items-center gap-0.5"
                                          >
                                            <span>Abstract PDF</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </a>
                                        </DocumentLinkPreview>
                                      )}
                                    </div>
                                    <p className="font-semibold text-xs text-[#1E293B] leading-snug">
                                      {prog.researchOutputAppliedTitle || '—'}
                                    </p>
                                  </div>

                                  {/* Extension Proposal Panel */}
                                  <div className="bg-[#FAFBF8] border border-[#E5E9E2] rounded-xl p-4 space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-bold text-[#64748B] uppercase">
                                        Title of Extension Proposals
                                      </span>
                                      {prog.extensionProposalUrl && (
                                        <DocumentLinkPreview
                                          url={prog.extensionProposalUrl}
                                          title={prog.extensionProposalTitle || 'Extension Proposal PDF'}
                                        >
                                          <a
                                            href={prog.extensionProposalUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] text-[#1E4D2B] hover:underline font-semibold inline-flex items-center gap-0.5"
                                          >
                                            <span>Proposal PDF</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </a>
                                        </DocumentLinkPreview>
                                      )}
                                    </div>
                                    <p className="font-semibold text-xs text-[#1E293B] leading-snug">
                                      {prog.extensionProposalTitle || '—'}
                                    </p>
                                  </div>

                                  {/* Community & Duration Badges */}
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-start gap-2 text-xs text-[#334155] bg-[#F4F6F1] p-2.5 rounded-lg border border-[#E5E9E2]">
                                      <Users className="w-4 h-4 text-[#1E4D2B] shrink-0 mt-0.5" />
                                      <div>
                                        <div className="text-[10px] uppercase font-bold text-[#64748B]">Target Community &amp; Beneficiaries</div>
                                        <div className="font-medium text-[#15221A]">{prog.targetCommunity}</div>
                                      </div>
                                    </div>

                                    {prog.durationAndFrequency && prog.durationAndFrequency !== '—' && (
                                      <div className="flex items-center gap-2 text-xs text-[#334155] bg-[#F4F6F1] p-2.5 rounded-lg border border-[#E5E9E2]">
                                        <Clock className="w-4 h-4 text-[#64748B] shrink-0" />
                                        <div>
                                          <div className="text-[10px] uppercase font-bold text-[#64748B]">Duration &amp; Frequency</div>
                                          <div className="font-medium text-[#15221A]">{prog.durationAndFrequency}</div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Column 2: Objectives & Collaborating Agencies */}
                                <div className="space-y-4">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                                    <Target className="w-3.5 h-3.5 text-[#1E4D2B]" />
                                    OBJECTIVES &amp; COLLABORATING AGENCIES
                                  </span>

                                  {/* Objectives */}
                                  <div className="space-y-2">
                                    <div className="text-xs font-semibold text-[#15221A]">Objectives of Outreach Program:</div>
                                    {prog.objectives.length > 0 ? (
                                      <ul className="space-y-2 text-xs text-[#334155]">
                                        {prog.objectives.map((obj, i) => (
                                          <li key={i} className="flex items-start gap-2.5">
                                            <span className="w-4 h-4 rounded-full bg-[#E3EFE8] text-[#1E4D2B] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                              {i + 1}
                                            </span>
                                            <span className="leading-relaxed">{obj}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <div className="text-xs text-[#94A3B8] italic">No specific objectives itemized.</div>
                                    )}
                                  </div>

                                  {/* Collaborating Agencies */}
                                  <div className="space-y-2 pt-2 border-t border-[#EEF1EB]">
                                    <div className="text-xs font-semibold text-[#15221A]">Collaborating Agency / Organization:</div>
                                    {prog.collaboratingAgencies.length > 0 ? (
                                      <div className="space-y-2">
                                        {prog.collaboratingAgencies.map((agency, aIdx) => (
                                          <div
                                            key={aIdx}
                                            className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#FAFBF8] border border-[#E5E9E2] text-xs"
                                          >
                                            <div className="flex items-center gap-2">
                                              <Building2 className="w-3.5 h-3.5 text-[#1E4D2B] shrink-0" />
                                              <span className="font-semibold text-[#15221A]">{agency.name}</span>
                                            </div>
                                            {agency.moaUrl && (
                                              <DocumentLinkPreview
                                                url={agency.moaUrl}
                                                title={`Signed MOA - ${agency.name}`}
                                              >
                                                <a
                                                  href={agency.moaUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E4D2B] bg-[#E3EFE8] hover:bg-[#d0e5d8] px-2 py-0.5 rounded transition-all shrink-0"
                                                >
                                                  <span>MOA</span>
                                                  <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                              </DocumentLinkPreview>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-[#94A3B8] italic">Direct institutional outreach.</div>
                                    )}
                                  </div>
                                </div>

                                {/* Column 3: Expected Deliverables & Outcomes */}
                                <div className="space-y-4">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                                    <FileCheck className="w-3.5 h-3.5 text-[#1E4D2B]" />
                                    EXPECTED DELIVERABLES &amp; OUTCOMES
                                  </span>

                                  {/* Deliverables */}
                                  {prog.deliverables && prog.deliverables !== '—' && (
                                    <div className="bg-[#FAFBF8] border border-[#E5E9E2] rounded-xl p-3.5 space-y-1">
                                      <div className="text-[10px] font-bold text-[#64748B] uppercase">Expected Deliverables / Outputs</div>
                                      <p className="text-xs text-[#334155] leading-relaxed">
                                        {prog.deliverables}
                                      </p>
                                    </div>
                                  )}

                                  {/* Expected Outcomes */}
                                  <div className="space-y-2">
                                    <div className="text-xs font-semibold text-[#15221A]">Expected Outcome:</div>
                                    {prog.expectedOutcomes.length > 0 ? (
                                      <ul className="space-y-2 text-xs text-[#334155]">
                                        {prog.expectedOutcomes.map((out, oIdx) => (
                                          <li key={oIdx} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-[#1E4D2B] shrink-0 mt-0.5" />
                                            <span className="leading-snug">{out}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <div className="text-xs text-[#94A3B8] italic">Continuous community engagement &amp; evaluation.</div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Participant Breakdown Strip across bottom of extended block */}
                              <div className="bg-[#FAFBF8] -mx-6 -mb-7 sm:-mx-7 sm:-mb-7 px-6 py-3 border-t border-[#E5E9E2] flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#64748B] shrink-0 sm:border-r sm:border-[#E5E9E2] sm:pr-6">
                                  <Users className="w-3.5 h-3.5 text-[#1E4D2B]" />
                                  <span>Participants</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center flex-1">
                                  <div>
                                    <div className="font-bold text-sm text-[#0E3322]">
                                      {prog.participantsStudents}
                                    </div>
                                    <div className="text-[10.5px] text-[#64748B] font-medium">Students</div>
                                  </div>
                                  <div>
                                    <div className="font-bold text-sm text-[#0E3322]">
                                      {prog.participantsFaculty}
                                    </div>
                                    <div className="text-[10.5px] text-[#64748B] font-medium">Faculty</div>
                                  </div>
                                  <div>
                                    <div className="font-bold text-sm text-[#0E3322]">
                                      {prog.participantsStaff}
                                    </div>
                                    <div className="text-[10.5px] text-[#64748B] font-medium">Staff</div>
                                  </div>
                                  <div>
                                    <div className="font-bold text-sm text-[#E8AE1F]">
                                      {prog.participantsBeneficiaries}
                                    </div>
                                    <div className="text-[10.5px] text-[#64748B] font-medium">Beneficiaries</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TABLE VIEW — Complete CHED Form U8 Spreadsheet Replica                    */}
          {/* ========================================================================= */}
          {!loading && viewMode === 'table' && filteredPrograms.length > 0 && (
            <div className="w-full overflow-x-auto custom-table-scrollbar border border-[#E2E8F0] rounded-xl shadow-xs">
              <table className="w-full text-left border-collapse min-w-[1900px] text-xs">
                <thead>
                  {/* Tier 1 Header — Deep Pine Green */}
                  <tr className="bg-[#1E4D2B] text-white text-[11px] font-bold uppercase tracking-wider divide-x divide-[#2b6d3d] border-b border-[#1E4D2B]">
                    <th scope="col" rowSpan={2} className="py-3 px-3 align-middle font-bold w-24">
                      Campus
                    </th>
                    <th scope="col" rowSpan={2} className="py-3 px-3.5 align-middle font-bold min-w-[240px]">
                      Title of Outreach Programs or Activities
                      <div className="text-[9.5px] text-white/80 lowercase italic font-normal">
                        (Past ten school years)
                      </div>
                    </th>
                    <th scope="col" rowSpan={2} className="py-3 px-3.5 align-middle font-bold min-w-[220px]">
                      Title of Extension Proposals
                    </th>
                    <th scope="col" rowSpan={2} className="py-3 px-3.5 align-middle font-bold min-w-[240px]">
                      Title &amp; Author/s of Research Outputs Being Applied
                    </th>
                    <th scope="col" rowSpan={2} className="py-3 px-3.5 align-middle font-bold min-w-[280px]">
                      Objectives of the Outreach Program or Activity
                    </th>
                    <th scope="col" rowSpan={2} className="py-3 px-3.5 align-middle font-bold min-w-[220px]">
                      Collaborating Agency / Organization
                      <div className="text-[9.5px] text-white/80 lowercase italic font-normal">
                        (Signed MOA / MOPA)
                      </div>
                    </th>
                    <th scope="col" rowSpan={2} className="py-3 px-3.5 align-middle font-bold min-w-[200px]">
                      Target Community &amp; Beneficiaries
                    </th>
                    <th scope="col" rowSpan={2} className="py-3 px-3 align-middle font-bold min-w-[150px]">
                      Duration &amp; Frequency
                    </th>
                    <th scope="col" rowSpan={2} className="py-3 px-3.5 align-middle font-bold min-w-[260px]">
                      Expected Deliverables / Outputs
                    </th>
                    <th scope="col" rowSpan={2} className="py-3 px-3.5 align-middle font-bold min-w-[240px]">
                      Expected Outcome
                    </th>
                    <th scope="col" colSpan={4} className="py-2 px-2 text-center font-bold">
                      Number of Participants
                    </th>
                  </tr>
                  {/* Tier 2 Header — Participants Sub-columns */}
                  <tr className="bg-[#173e23] text-white text-[10px] font-bold uppercase tracking-wider divide-x divide-[#2b6d3d]">
                    <th scope="col" className="py-2 px-2 text-center w-20">Students</th>
                    <th scope="col" className="py-2 px-2 text-center w-20">Faculty</th>
                    <th scope="col" className="py-2 px-2 text-center w-24">Staff</th>
                    <th scope="col" className="py-2 px-2 text-center w-24">Beneficiaries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white text-[#15221A]">
                  {filteredPrograms.map((prog) => (
                    <tr key={prog.id} className="hover:bg-[#F9FAF8] transition-colors divide-x divide-[#E2E8F0] align-top">
                      <td className="py-3 px-3 font-semibold text-[#0E3322] whitespace-nowrap">
                        {prog.campus}
                        <div className="text-[10px] text-[#64748B] font-normal">SY {prog.schoolYear}</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-[#15221A] leading-snug">
                          {prog.title}
                        </div>
                        {prog.documentUrl && (
                          <DocumentLinkPreview
                            url={prog.documentUrl}
                            title={prog.title || prog.documentName || 'Outreach Program Document'}
                          >
                            <a
                              href={prog.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1E4D2B] hover:underline font-semibold text-[11px] inline-flex items-center gap-1 mt-1"
                            >
                              <span>{prog.documentName || 'View Document'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </DocumentLinkPreview>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="text-[#334155] leading-snug">
                          {prog.extensionProposalTitle || '—'}
                        </div>
                        {prog.extensionProposalUrl && (
                          <DocumentLinkPreview
                            url={prog.extensionProposalUrl}
                            title={prog.extensionProposalTitle || 'Extension Proposal Document'}
                          >
                            <a
                              href={prog.extensionProposalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1E4D2B] hover:underline font-semibold text-[11px] inline-flex items-center gap-1 mt-1"
                            >
                              <span>Proposal Document</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </DocumentLinkPreview>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-[#15221A] leading-snug">
                          {prog.researchOutputAppliedTitle || '—'}
                        </div>
                        {prog.researchOutputUrl && (
                          <DocumentLinkPreview
                            url={prog.researchOutputUrl}
                            title={prog.researchOutputAppliedTitle || 'Research Abstract PDF'}
                          >
                            <a
                              href={prog.researchOutputUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1E4D2B] hover:underline font-semibold text-[11px] inline-flex items-center gap-1 mt-1"
                            >
                              <span>Abstract PDF</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </DocumentLinkPreview>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        {prog.objectives.length > 0 ? (
                          <ol className="list-decimal pl-4 space-y-1 text-[#334155] leading-relaxed">
                            {prog.objectives.map((obj, i) => (
                              <li key={i}>{obj}</li>
                            ))}
                          </ol>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 space-y-1.5">
                        {prog.collaboratingAgencies.length > 0 ? (
                          prog.collaboratingAgencies.map((agency, aIdx) => (
                            <div key={aIdx} className="text-[#334155]">
                              <div className="font-medium text-[#15221A]">{agency.name}</div>
                              {agency.moaUrl && (
                                <DocumentLinkPreview
                                  url={agency.moaUrl}
                                  title={`Signed MOA - ${agency.name}`}
                                >
                                  <a
                                    href={agency.moaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#1E4D2B] hover:underline font-medium text-[11px] inline-flex items-center gap-1"
                                  >
                                    <span>Signed MOA</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </DocumentLinkPreview>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-[#334155] leading-relaxed">
                        {prog.targetCommunity}
                      </td>
                      <td className="py-3 px-3 text-[#334155]">
                        <div className="font-medium text-[#15221A]">{prog.durationAndFrequency || '—'}</div>
                      </td>
                      <td className="py-3 px-3.5 text-[#334155] leading-relaxed">
                        {prog.deliverables}
                      </td>
                      <td className="py-3 px-3.5">
                        {prog.expectedOutcomes.length > 0 ? (
                          <ol className="list-decimal pl-4 space-y-1 text-[#334155] leading-relaxed">
                            {prog.expectedOutcomes.map((out, oIdx) => (
                              <li key={oIdx}>{out}</li>
                            ))}
                          </ol>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center font-semibold text-[#15221A]">
                        {prog.participantsStudents}
                      </td>
                      <td className="py-3 px-2 text-center font-semibold text-[#15221A]">
                        {prog.participantsFaculty}
                      </td>
                      <td className="py-3 px-2 text-center font-semibold text-[#15221A]">
                        {prog.participantsStaff}
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-[#1E4D2B]">
                        {prog.participantsBeneficiaries}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Note matching Form 2 */}
          <div className="mt-6 pt-4 border-t border-[#E5E9E2] flex items-center justify-end text-xs text-[#64748B]">
            <span className="font-semibold text-[#1E4D2B]">
              Showing {filteredPrograms.length} of {programs.length} outreach programs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
