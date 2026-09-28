import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { exportForm1ToExcel } from '../utils/excelExport';
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

export const Form1Page: React.FC = () => {
  const [selectedCampus, setSelectedCampus] = useState<string>('All campuses');
  const [selectedLevel, setSelectedLevel] = useState<string>('All levels');
  const [summarySchoolYear, setSummarySchoolYear] = useState<string>('2026-2027');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [programs, setPrograms] = useState<Form1ProgramItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Live Supabase loader for Form 1 tables
  const loadSupabaseForm1Data = async () => {
    setLoading(true);
    setError(null);
    try {
      const client = getSupabaseClient();
      if (!client) {
        setError('Supabase client is not configured.');
        setPrograms([]);
        setLoading(false);
        return;
      }

      const [
        offeringsRes,
        researchRes,
        thesisRes,
        enrollmentsRes,
        averagesRes,
        evidenceFilesRes
      ] = await Promise.all([
        client.from('form1_program_offerings').select('*'),
        client.from('form1_research_courses').select('*'),
        client.from('form1_thesis_projects').select('*'),
        client.from('form1_enrollments').select('*'),
        client.from('form1_enrollment_averages').select('*'),
        client.from('evidence_files').select('*')
      ]);

      if (offeringsRes.error) {
        setError(`Couldn't load Form 1 data from Supabase — error: ${offeringsRes.error.message}`);
        setPrograms([]);
        setLoading(false);
        return;
      }

      const offerings = offeringsRes.data || [];
      const evidenceFiles: EvidenceFile[] = (evidenceFilesRes.data || []) as EvidenceFile[];
      if (offerings.length === 0) {
        setError("Couldn't load Form 1 data from Supabase — check that the tables exist and contain rows (form1_program_offerings table has 0 rows).");
        setPrograms([]);
        setLoading(false);
        return;
      }

      const researchCourses = researchRes.data || [];
      const thesisProjects = thesisRes.data || [];
      const enrollments = enrollmentsRes.data || [];
      const averages = averagesRes.data || [];

      // Build maps for fast lookup
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

      const mapped: Form1ProgramItem[] = offerings.map((off: any, index: number) => {
        const offId = off.id;
        const rc = researchMap.get(offId);
        const tp = thesisMap.get(offId);
        const history = enrollmentMap.get(offId) || [];

        // Sort history by school year
        history.sort((a, b) => a.schoolYear.localeCompare(b.schoolYear));

        // Calculate average from history or averageMap
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

        // Campus determination
        const campusRaw = (off.campus || 'Main Campus').toLowerCase();
        let campusCategory: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE' = 'Main';
        if (campusRaw.includes('pagadian')) campusCategory = 'Pagadian';
        else if (campusRaw.includes('dumingag')) campusCategory = 'Dumingag';
        else if (campusRaw.includes('cmse')) campusCategory = 'CMSE';

        // Level determination
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

      setPrograms(mapped);
      setError(null);
      setLastSynced(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.warn('Error fetching Supabase Form 1 data:', err);
      setError(`Couldn't load Form 1 data from Supabase — ${err?.message || 'unexpected error'}`);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupabaseForm1Data();
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
                      {summaryMetrics.undergradEnrollment.toLocaleString('en-US')}
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
                      {summaryMetrics.masteralEnrollment.toLocaleString('en-US')}
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
                      {summaryMetrics.doctoralEnrollment.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom total row */}
              <div className="mt-6 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs font-bold text-[#0E3322]">Total Enrollment</span>
                <span className="text-sm font-extrabold text-[#1E4D2B] bg-[#F4F6F1] px-3.5 py-1 rounded-full border border-[#E2E8F0]">
                  {summaryMetrics.totalEnrollment.toLocaleString('en-US')}
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
                      {summaryMetrics.undergradCount}
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
                      {summaryMetrics.masteralCount}
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
                      {summaryMetrics.doctoralCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom total row */}
              <div className="mt-6 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs font-bold text-[#0E3322]">Total No. of Degree Programs</span>
                <span className="text-sm font-extrabold text-[#1E4D2B] bg-[#F4F6F1] px-3.5 py-1 rounded-full border border-[#E2E8F0]">
                  {summaryMetrics.totalCount}
                </span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
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
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="appearance-none bg-[#EEF1EB] text-[#475569] hover:bg-[#E2E8F0] text-xs font-medium py-1.5 pl-4 pr-8 rounded-full border-none focus:ring-2 focus:ring-[#1E4D2B] cursor-pointer"
                >
                  <option value="All levels">All levels</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Masteral">Masteral</option>
                  <option value="Doctoral">Doctoral</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search programs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#1E4D2B]"
                />
              </div>

              <button
                onClick={() => loadSupabaseForm1Data()}
                disabled={loading}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] text-[#475569] font-medium text-xs rounded-lg hover:bg-[#F8FAFC] transition-all cursor-pointer disabled:opacity-50"
                title="Refresh from Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => exportForm1ToExcel(filteredPrograms)}
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs rounded-full hover:bg-[#1E4D2B]/5 transition-all cursor-pointer whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View spreadsheet</span>
              </button>
            </div>
          </div>

          {/* Table Container — Strictly Single View with Full Official CHED Form 1 Titles */}
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed">
              <colgroup>
                <col style={{ width: '18%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '5%' }} />
                <col style={{ width: '6%' }} />
              </colgroup>
              <thead>
                {/* Tier 1: Main Section Headers Matching Official CHED Form 1 */}
                <tr className="bg-[#1E4D2B] text-white text-[10px] font-bold tracking-wider divide-x divide-[#2b6d3d] border-b border-[#1E4D2B]">
                  <th scope="col" rowSpan={2} className="py-2.5 px-2.5 text-center align-middle font-bold uppercase">
                    <div>Complete Listing of Program Offerings</div>
                    <div className="text-[9px] font-normal text-white/80 lowercase italic capitalize mt-0.5">& Major / Specialization</div>
                  </th>
                  <th scope="col" colSpan={2} className="py-1.5 px-2 text-center font-bold uppercase">
                    Authority to Operate
                  </th>
                  <th scope="col" rowSpan={2} className="py-2.5 px-1.5 text-center align-middle font-bold uppercase">
                    School Year Started
                  </th>
                  <th scope="col" colSpan={2} className="py-1.5 px-2 text-center font-bold uppercase">
                    Research / Data Analysis Courses <span className="text-[9px] font-normal text-white/80 lowercase italic capitalize">(If applicable)</span>
                  </th>
                  <th scope="col" colSpan={2} className="py-1.5 px-2 text-center font-bold uppercase">
                    Thesis / Dissertation / Special Project <span className="text-[9px] font-normal text-white/80 lowercase italic capitalize">(If applicable)</span>
                  </th>
                  <th scope="col" rowSpan={2} className="py-2.5 px-1 text-center align-middle font-bold uppercase">
                    <div>Past 5-Yr</div>
                    <div>Enrollment</div>
                  </th>
                </tr>

                {/* Tier 2: Specific Official Subheaders Matching CHED Excel Form */}
                <tr className="bg-[#F8FAFC] text-[#475569] text-[9.5px] font-semibold divide-x divide-[#E2E8F0] border-b border-[#CBD5E1]">
                  <th scope="col" className="py-1.5 px-1.5 text-center leading-tight">
                    1. Board Reso No. approving offering
                  </th>
                  <th scope="col" className="py-1.5 px-1.5 text-center leading-tight">
                    2. COPC No., date issued, & issuing office
                  </th>
                  <th scope="col" className="py-1.5 px-1.5 text-center leading-tight">
                    Course Titles & Units
                  </th>
                  <th scope="col" className="py-1.5 px-1 text-center leading-tight">
                    Required or Elective?
                  </th>
                  <th scope="col" className="py-1.5 px-1.5 text-center leading-tight">
                    Course Title & Units
                  </th>
                  <th scope="col" className="py-1.5 px-1 text-center leading-tight">
                    Pre-requisite to Grad.?
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-[#F1F5F9]">
                {Object.keys(groupedPrograms).length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#64748B]">
                      No matching programs found.
                    </td>
                  </tr>
                ) : (
                  Object.entries(groupedPrograms).map(([groupTitle, items]) => (
                    <React.Fragment key={groupTitle}>
                      {/* Group Header Row */}
                      <tr>
                        <td colSpan={9} className="pt-5 pb-1.5 px-2">
                          <div className="font-bold text-[#1E4D2B] text-xs flex items-center gap-1.5 border-b border-dashed border-[#E8AE1F] pb-1">
                            <span>▸ {groupTitle}</span>
                          </div>
                        </td>
                      </tr>

                      {/* Program Rows */}
                      {items.map((row) => {
                        const isExpanded = expandedId === row.id;
                        const maxCount = Math.max(1, ...row.enrollmentHistory.map(h => h.count));
                        const formattedAvg = Number(row.averageEnrollment).toFixed(1);

                        return (
                          <React.Fragment key={row.id}>
                            <tr className={`hover:bg-[#F8FAFC] transition-colors ${isExpanded ? 'bg-[#FCFDFB]' : ''}`}>
                              {/* Program Name & Major */}
                              <td className="py-2.5 px-2 align-top">
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
                              <td className="py-2.5 px-2 text-[#334155] font-normal text-[11px] align-top break-words">
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
                              <td className="py-2.5 px-2 align-top break-words">
                                {renderStatusBadge(row.copcStatus, row.copcRaw, row.copcLink, row.copcFileId)}
                              </td>

                              {/* SY Started */}
                              <td className="py-2.5 px-2 text-[#475569] text-[11px] align-top break-words">
                                {row.syStarted}
                              </td>

                              {/* Research Course */}
                              <td className="py-2.5 px-2 text-[#334155] text-[11px] align-top break-words">
                                {row.researchCourse ? (
                                  <div>
                                    <GoogleDrivePreviewCell text={row.researchCourse} />{' '}
                                    {row.researchUnits ? <span className="text-[#64748B]">({row.researchUnits} units)</span> : null}
                                  </div>
                                ) : null}
                              </td>

                              {/* Req. / Elec. */}
                              <td className="py-2.5 px-1 text-center align-top">
                                {row.researchReqElec ? renderReqElecBadge(row.researchReqElec) : null}
                              </td>

                              {/* Thesis / Dissertation */}
                              <td className="py-2.5 px-2 text-[#334155] text-[11px] align-top break-words">
                                {row.thesisDissertation ? (
                                  <div>
                                    <GoogleDrivePreviewCell text={row.thesisDissertation} />{' '}
                                    {row.thesisUnits ? <span className="text-[#64748B]">({row.thesisUnits} units)</span> : null}
                                  </div>
                                ) : null}
                              </td>

                              {/* Prereq. to Grad */}
                              <td className="py-2.5 px-1 text-center align-top">
                                {row.prereqToGrad ? renderPrereqBadge(row.prereqToGrad) : null}
                              </td>

                              {/* Average Enrollment */}
                              <td className="py-2.5 px-1 text-center align-top whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(isExpanded ? null : row.id)}
                                  className="inline-flex items-center justify-between w-full max-w-[66px] bg-[#F4F6F1] border border-[#E2E8F0] text-[#0E3322] font-semibold text-[11px] py-1 px-1.5 rounded hover:border-[#1E4D2B] transition-all cursor-pointer shadow-2xs whitespace-nowrap mx-auto"
                                  title="Click to view 5-year enrollment breakdown"
                                >
                                  <span>{formattedAvg}</span>
                                  <ChevronDown className={`w-3 h-3 text-[#64748B] shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              </td>
                            </tr>

                            {/* Expanded 5-Year Enrollment Drawer */}
                            {isExpanded && (
                              <tr className="bg-transparent">
                                <td colSpan={9} className="p-0 py-4">
                                  <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-xs mx-2">
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
                                        {/* Chart Grid with Bars */}
                                        <div className="grid grid-cols-6 gap-3 sm:gap-6 items-end h-40 w-full px-2">
                                          {row.enrollmentHistory.map((sy) => (
                                            <div key={sy.schoolYear} className="flex flex-col items-center h-full justify-end group">
                                              {/* Count Number sitting above its bar */}
                                              <span className="text-xs font-bold text-[#15221A] mb-2">{sy.count}</span>
                                              
                                              {/* Solid Forest Green Bar */}
                                              <div
                                                className="w-10 sm:w-12 bg-[#1E4D2B] rounded-t-xs transition-all duration-300 group-hover:bg-[#0E3322]"
                                                style={{ height: `${Math.max(12, Math.min(100, (sy.count / maxCount) * 100))}%` }}
                                              />
                                            </div>
                                          ))}
                                        </div>

                                        {/* Solid Baseline */}
                                        <div className="w-full border-b border-[#E2E8F0] mt-0 mb-3" />

                                        {/* School Year Labels below baseline */}
                                        <div className="grid grid-cols-6 gap-3 sm:gap-6 text-center px-2">
                                          {row.enrollmentHistory.map((sy) => (
                                            <span key={sy.schoolYear} className="text-xs font-medium text-[#64748B] whitespace-nowrap">
                                              {sy.schoolYearShort}
                                            </span>
                                          ))}
                                        </div>
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
        </div>
      </div>
    </div>
  );
};
