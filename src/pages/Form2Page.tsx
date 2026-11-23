import React, { useState, useEffect, useMemo } from 'react';
import { Download, Search, RefreshCw, AlertCircle, ExternalLink, LayoutGrid, Table as TableIcon, GraduationCap, Award, FolderOpen, ChevronDown, CheckCircle2, Briefcase, User, BookOpen, X } from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { exportForm2ToExcel } from '../utils/excelExport';
import { getSupabaseClient } from '../data/api';
import { GoogleDrivePreviewCell } from '../components/GoogleDrivePreviewCell';
import { DocumentLinkPreview } from '../components/DocumentLinkPreview';
import { resolveFacultyPhoto } from '../utils/facultyPhotos';

export interface Form2SubjectItem {
  name: string;
  link?: string;
}

export interface Form2ResearchItem {
  id: string;
  status: 'ONGOING' | 'COMPLETED';
  title: string;
  year?: string;
  outputType?: string;
  outputCitation?: string;
  link?: string;
}

export interface Form2FacultyItem {
  id: string;
  sequenceNo?: number;
  name: string;
  campus: string;
  campusCategory: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE';
  department: string;
  facultyCategory?: string;
  programGroup?: string;
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
  sy2024_2025?: string;
  sy2025_2026: string;
  sy2026_2027: string;
  sy2024_2025_items?: Form2SubjectItem[];
  sy2025_2026_items?: Form2SubjectItem[];
  sy2026_2027_items?: Form2SubjectItem[];
  driveFolderId?: string;
  driveFolderUrl?: string;
  sourceExcelRow?: number;
  photoPath?: string;
  ongoingResearches?: Form2ResearchItem[];
  completedResearches?: Form2ResearchItem[];
}

interface OfficialForm2PlacementRule {
  minRow: number;
  maxRow: number;
  campus: 'Main Campus' | 'Pagadian Campus' | 'Lakewood Campus' | 'Dumingag Campus';
  campusCategory: 'Main' | 'Pagadian' | 'CMSE' | 'Dumingag';
  department: string;
  programGroup: string; // Empty string '' indicates Direct Listing (no sub-program header row)
}

const OFFICIAL_FORM2_PLACEMENT_RULES: OfficialForm2PlacementRule[] = [
  // ======================================================================
  // 1. MAIN CAMPUS (Items 1–100, row_id 16–142)
  // ======================================================================
  // [School] School of Teacher Education
  { minRow: 16, maxRow: 17, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Teacher Education', programGroup: 'Doctor of Philosophy major in English Language Teaching' },
  { minRow: 19, maxRow: 22, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Teacher Education', programGroup: 'Master of Arts in Education, major in English' },
  { minRow: 24, maxRow: 27, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Teacher Education', programGroup: 'Master of Arts in Education, major in Science' },
  { minRow: 29, maxRow: 32, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Teacher Education', programGroup: 'Bachelor of Secondary Education, major in English' },
  { minRow: 34, maxRow: 37, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Teacher Education', programGroup: 'Bachelor of Secondary Education, major in Filipino' },
  { minRow: 39, maxRow: 42, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Teacher Education', programGroup: 'Bachelor of Secondary Education, major in Science' },
  { minRow: 44, maxRow: 45, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Teacher Education', programGroup: 'Bachelor of Secondary Education, major in Math' },
  { minRow: 47, maxRow: 50, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Teacher Education', programGroup: 'Bachelor of Elementary Education' },
  { minRow: 52, maxRow: 62, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Teacher Education', programGroup: 'Allied Faculty' },

  // [School] School of Arts and Sciences
  { minRow: 65, maxRow: 68, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Arts and Sciences', programGroup: 'Bachelor of Arts in Political Science' },
  { minRow: 70, maxRow: 72, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Arts and Sciences', programGroup: 'Bachelor of Science in Social Work' },
  { minRow: 74, maxRow: 74, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Arts and Sciences', programGroup: 'Bachelor of Arts in English Language Studies' },
  { minRow: 76, maxRow: 84, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Arts and Sciences', programGroup: 'Allied Faculty' },

  // [School] School of Computing Science
  { minRow: 87, maxRow: 89, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Computing Science', programGroup: 'Bachelor of Science in Information Technology' },
  { minRow: 91, maxRow: 94, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Computing Science', programGroup: 'Allied Faculty' },

  // [School] School of Engineering & Technology
  { minRow: 97, maxRow: 99, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Engineering & Technology', programGroup: 'Bachelor of Science in Civil Engineering' },
  { minRow: 101, maxRow: 104, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Engineering & Technology', programGroup: 'Bachelor of Science in Agricultural Biosystems and Engineering' },
  { minRow: 106, maxRow: 108, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Engineering & Technology', programGroup: 'Allied Faculty' },

  // [School] School of Agriculture, Forestry, and Environmental Sciences
  { minRow: 111, maxRow: 116, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Agriculture, Forestry, and Environmental Sciences', programGroup: 'Bachelor of Science in Agriculture - Animal Science & Crop Science' },
  { minRow: 118, maxRow: 121, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Agriculture, Forestry, and Environmental Sciences', programGroup: 'Bachelor of Science in Environmental Science' },
  { minRow: 123, maxRow: 125, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Agriculture, Forestry, and Environmental Sciences', programGroup: 'Bachelor of Science in Forestry' },
  { minRow: 127, maxRow: 129, campus: 'Main Campus', campusCategory: 'Main', department: 'School of Agriculture, Forestry, and Environmental Sciences', programGroup: 'Allied Faculty' },

  // [Unit/Group] PathFit & General Education Courses
  { minRow: 131, maxRow: 133, campus: 'Main Campus', campusCategory: 'Main', department: 'PathFit', programGroup: '' },
  { minRow: 135, maxRow: 142, campus: 'Main Campus', campusCategory: 'Main', department: 'General Education Courses', programGroup: '' },

  // ======================================================================
  // 2. PAGADIAN CAMPUS (Items 101–142, row_id 145–196)
  // ======================================================================
  // [School] School of Nursing (Direct Listing)
  { minRow: 145, maxRow: 161, campus: 'Pagadian Campus', campusCategory: 'Pagadian', department: 'School of Nursing', programGroup: '' },

  // [School] School of Business and Management
  { minRow: 164, maxRow: 168, campus: 'Pagadian Campus', campusCategory: 'Pagadian', department: 'School of Business and Management', programGroup: 'Bachelor of Science in Hotel Management' },
  { minRow: 170, maxRow: 173, campus: 'Pagadian Campus', campusCategory: 'Pagadian', department: 'School of Business and Management', programGroup: 'Bachelor of Science in Tourism Management' },
  { minRow: 175, maxRow: 178, campus: 'Pagadian Campus', campusCategory: 'Pagadian', department: 'School of Business and Management', programGroup: 'Bachelor of Science in Entrepreneurship' },

  // [School] School of Computing Science
  { minRow: 181, maxRow: 184, campus: 'Pagadian Campus', campusCategory: 'Pagadian', department: 'School of Computing Science', programGroup: 'Bachelor of Science in Information Technology' },
  { minRow: 186, maxRow: 188, campus: 'Pagadian Campus', campusCategory: 'Pagadian', department: 'School of Computing Science', programGroup: 'Allied Faculty' },

  // [School] School of Law & Units
  { minRow: 190, maxRow: 190, campus: 'Pagadian Campus', campusCategory: 'Pagadian', department: 'School of Law', programGroup: '' },
  { minRow: 192, maxRow: 192, campus: 'Pagadian Campus', campusCategory: 'Pagadian', department: 'PathFit', programGroup: '' },
  { minRow: 194, maxRow: 196, campus: 'Pagadian Campus', campusCategory: 'Pagadian', department: 'General Education Courses', programGroup: '' },

  // ======================================================================
  // 3. LAKEWOOD CAMPUS (Items 143–165, row_id 200–228)
  // ======================================================================
  // [School] School of Teacher Education
  { minRow: 200, maxRow: 203, campus: 'Lakewood Campus', campusCategory: 'CMSE', department: 'School of Teacher Education', programGroup: 'Bachelor in Technical-Vocational Teacher Education - Food Service Management' },
  { minRow: 205, maxRow: 208, campus: 'Lakewood Campus', campusCategory: 'CMSE', department: 'School of Teacher Education', programGroup: 'Bachelor in Technology and Livelihood Education - Home Economics' },

  // [School] School of Computing Science
  { minRow: 211, maxRow: 212, campus: 'Lakewood Campus', campusCategory: 'CMSE', department: 'School of Computing Science', programGroup: 'Bachelor of Science in Information Technology' },

  // [School] School of Engineering & Technology
  { minRow: 215, maxRow: 218, campus: 'Lakewood Campus', campusCategory: 'CMSE', department: 'School of Engineering & Technology', programGroup: 'Bachelor in Industrial Technology - Architectural and Drafting (Allied)' },

  // [Unit/Group] General Education Courses
  { minRow: 220, maxRow: 228, campus: 'Lakewood Campus', campusCategory: 'CMSE', department: 'General Education Courses', programGroup: '' },

  // ======================================================================
  // 4. DUMINGAG CAMPUS (Items 166–228, row_id 232–314)
  // ======================================================================
  // [School] School of Teacher Education
  { minRow: 232, maxRow: 235, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'School of Teacher Education', programGroup: 'Bachelor of Secondary Education, major in English' },
  { minRow: 237, maxRow: 238, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'School of Teacher Education', programGroup: 'Bachelor of Secondary Education, major in Math' },
  { minRow: 240, maxRow: 243, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'School of Teacher Education', programGroup: 'Bachelor of Physical Education' },
  { minRow: 245, maxRow: 250, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'School of Teacher Education', programGroup: 'Bachelor of Elementary Education' },
  { minRow: 252, maxRow: 255, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'School of Teacher Education', programGroup: 'Allied Faculty' },

  // [School] School of Criminal Justice Education
  { minRow: 258, maxRow: 261, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'School of Criminal Justice Education', programGroup: 'Doctor of Philosophy in Criminal Justice, major in Criminology' },
  { minRow: 263, maxRow: 266, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'School of Criminal Justice Education', programGroup: 'Master of Science in Criminal Justice, major in Criminology' },
  { minRow: 268, maxRow: 271, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'School of Criminal Justice Education', programGroup: 'Bachelor of Science in Criminology' },
  { minRow: 273, maxRow: 276, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'School of Criminal Justice Education', programGroup: 'Bachelor of Science in Industrial Security Management' },
  { minRow: 278, maxRow: 278, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'School of Criminal Justice Education', programGroup: 'Allied Faculty' },

  // [School] School of Computing Science
  { minRow: 281, maxRow: 284, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'School of Computing Science', programGroup: 'Bachelor of Science in Information Technology' },
  { minRow: 286, maxRow: 288, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'School of Computing Science', programGroup: 'Allied Faculty' },

  // [School] School of Agriculture, Forestry, and Environmental Sciences
  { minRow: 291, maxRow: 294, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'School of Agriculture, Forestry, and Environmental Sciences', programGroup: 'Doctor of Philosophy in Agriculture' },
  { minRow: 296, maxRow: 298, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'School of Agriculture, Forestry, and Environmental Sciences', programGroup: 'Master of Science in Agriculture' },
  { minRow: 300, maxRow: 302, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'School of Agriculture, Forestry, and Environmental Sciences', programGroup: 'Bachelor of Science in Agriculture - Animal Science & Crop Science' },
  { minRow: 304, maxRow: 304, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'School of Agriculture, Forestry, and Environmental Sciences', programGroup: 'Allied Faculty' },

  // [Unit/Group] PathFit & General Education Courses
  { minRow: 306, maxRow: 307, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'PathFit', programGroup: '' },
  { minRow: 309, maxRow: 314, campus: 'Dumingag Campus', campusCategory: 'Dumingag', department: 'General Education Courses', programGroup: '' },
];

function resolveOfficialForm2Placement(
  rowId: number,
  rawCampusName?: string | null,
  rawSchoolName?: string | null,
  rawFacultyCategory?: string | null
): {
  campus: string;
  campusCategory: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE';
  department: string;
  facultyCategory: string;
  programGroup: string;
} {
  const matched = OFFICIAL_FORM2_PLACEMENT_RULES.find((r) => rowId >= r.minRow && rowId <= r.maxRow);

  const rawCampus = (rawCampusName || matched?.campus || 'Main Campus').toLowerCase();
  let campusCategory: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE' = matched?.campusCategory || 'Main';
  let campus = matched?.campus || 'Main Campus';
  if (rawCampus.includes('pagadian')) {
    campusCategory = 'Pagadian';
    campus = 'Pagadian Campus';
  } else if (rawCampus.includes('dumingag')) {
    campusCategory = 'Dumingag';
    campus = 'Dumingag Campus';
  } else if (rawCampus.includes('cmse') || rawCampus.includes('lakewood') || rawCampus.includes('canuto')) {
    campusCategory = 'CMSE';
    campus = 'Lakewood Campus';
  } else if (rawCampus.includes('main')) {
    campusCategory = 'Main';
    campus = 'Main Campus';
  }

  const department = (rawSchoolName && String(rawSchoolName).trim()) || matched?.department || 'General Academic Program';
  const rawCat = rawFacultyCategory ? String(rawFacultyCategory).trim() : '';
  const facultyCategory = rawCat || matched?.programGroup || 'General / Uncategorized';

  return {
    campus,
    campusCategory,
    department,
    facultyCategory,
    programGroup: facultyCategory,
  };
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
const FORM2_STORAGE_KEY = 'jhcsc_form2_persistent_v15';
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('jhcsc_form2_persistent_v14');
    localStorage.removeItem('jhcsc_form2_persistent_v13');
    localStorage.removeItem('jhcsc_form2_persistent_v12');
    localStorage.removeItem('jhcsc_form2_persistent_v11');
    localStorage.removeItem('jhcsc_form2_persistent_v10');
    localStorage.removeItem('jhcsc_form2_persistent_v9');
    localStorage.removeItem('jhcsc_form2_persistent_v8');
    localStorage.removeItem('jhcsc_form2_persistent_v7');
    sessionStorage.removeItem('jhcsc_form2_cache_v8');
    sessionStorage.removeItem('jhcsc_form2_cache_v5');
  } catch {}
}

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

  // Fast targeted queries: select faculty, latest SY 2025-2026 & SY 2026-2027 subjects, and Form 3 researches in parallel
  const [form2Res, sub25Res, sub26Res, form3Res, form3CompletedRes] = await Promise.all([
    client
      .from('form2')
      .select('row_id,faculty_name,campus_name,school_name,faculty_category,academic_rank,is_full_time_permanent,is_full_time_contractual,is_part_time,teaches_undergrad,teaches_grad,bachelors_degree,masters_degree,doctorate_degree,academic_specialization,license_no,license_no_link,license_expiry,professional_experience,faculty_name_link')
      .order('row_id', { ascending: true }),
    client
      .from('form2_faculty_subjects')
      .select('id,row_id,school_year,subject_name,drive_link')
      .ilike('school_year', '%2025%2026%')
      .order('id', { ascending: false })
      .limit(1000),
    client
      .from('form2_faculty_subjects')
      .select('id,row_id,school_year,subject_name,drive_link')
      .ilike('school_year', '%2026%2027%')
      .order('id', { ascending: false })
      .limit(1000),
    client
      .from('form3')
      .select('row_id,faculty_name,campus_name,ongoing_research_title,ongoing_research_year_started,ongoing_research_expected_finish,completed_research_year,outputs_patents,outputs_journal_publications,outputs_book_publications,outputs_terminal_report')
      .order('row_id', { ascending: true })
      .limit(1000),
    client
      .from('form3_completed_researches')
      .select('id,row_id,research_title,drive_link')
      .order('id', { ascending: true })
      .limit(2000),
  ]);

  if (form2Res.error) {
    throw new Error(`Failed to load Form 2 faculty: ${form2Res.error.message}`);
  }

  // Build Form 3 Completed Researches lookup by Form 3 row_id
  const rawCompletedByF3RowId = new Map<number, { id: string; title: string; link?: string }[]>();
  (form3CompletedRes.data || []).forEach((cr: any) => {
    const rId = Number(cr.row_id);
    const title = String(cr.research_title || '').trim();
    if (!rId || !title || title.toLowerCase() === 'none' || title === '—' || title === '-') return;
    const link =
      cr.drive_link && String(cr.drive_link).trim() && String(cr.drive_link).trim().toUpperCase() !== 'NULL'
        ? String(cr.drive_link).trim()
        : undefined;
    if (!rawCompletedByF3RowId.has(rId)) {
      rawCompletedByF3RowId.set(rId, []);
    }
    const list = rawCompletedByF3RowId.get(rId)!;
    const existing = list.find((item) => item.title.toLowerCase() === title.toLowerCase());
    if (!existing) {
      list.push({ id: String(cr.id ?? `${rId}-${list.length + 1}`), title, link });
    } else if (!existing.link && link) {
      existing.link = link;
    }
  });

  // Helper to parse faculty name into normalized tokens for cross-form matching
  const parseFacultyMatchKey = (rawName: string) => {
    const clean = (rawName || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/^([a-z]{3,})\.\s+([a-z]{3,})/, '$1, $2')
      .replace(/^niez\s+llanevie/, 'niez, llanevie')
      .trim();
    const fullNorm = clean.replace(/[^a-z]/g, '');
    const parts = clean.split(',');
    const last = (parts[0] || '').replace(/[^a-z]/g, '');
    const restTokens = parts
      .slice(1)
      .join(' ')
      .split(/[^a-z]+/)
      .filter((w) => w.length > 1 && !['jr', 'sr', 'ii', 'iii', 'iv', 'dr', 'engr', 'prof', 'atty'].includes(w));
    return {
      fullNorm,
      last,
      first: restTokens[0] || '',
      restTokens,
    };
  };

  interface AggregatedForm3Profile {
    matchKey: ReturnType<typeof parseFacultyMatchKey>;
    ongoing: Form2ResearchItem[];
    completed: Form2ResearchItem[];
  }

  const form3Profiles: AggregatedForm3Profile[] = [];
  const form3ByFullNorm = new Map<string, AggregatedForm3Profile>();

  (form3Res.data || []).forEach((f3: any) => {
    const f3RowId = Number(f3.row_id);
    const f3Name = String(f3.faculty_name || '').trim();
    if (!f3Name) return;
    const mKey = parseFacultyMatchKey(f3Name);
    if (!mKey.fullNorm) return;

    let profile = form3ByFullNorm.get(mKey.fullNorm);
    if (!profile) {
      profile = { matchKey: mKey, ongoing: [], completed: [] };
      form3ByFullNorm.set(mKey.fullNorm, profile);
      form3Profiles.push(profile);
    }

    // 1. Parse Ongoing Researches from form3
    const rawOngoingTitles = f3.ongoing_research_title ? String(f3.ongoing_research_title).split(/\r?\n/) : [];
    const rawOngoingStarts = f3.ongoing_research_year_started ? String(f3.ongoing_research_year_started).split(/\r?\n/) : [];
    const rawOngoingFinishes = f3.ongoing_research_expected_finish ? String(f3.ongoing_research_expected_finish).split(/\r?\n/) : [];

    rawOngoingTitles.forEach((rawTitle: string, oIdx: number) => {
      const title = rawTitle.trim();
      if (!title || ['none', 'empty', 'null', '—', '-'].includes(title.toLowerCase())) return;
      const startYr = (rawOngoingStarts[oIdx] ?? rawOngoingStarts[0] ?? '').trim();
      const finishYr = (rawOngoingFinishes[oIdx] ?? rawOngoingFinishes[0] ?? '').trim();
      const yearLabel =
        startYr && finishYr
          ? `${startYr}–${finishYr}`
          : startYr
          ? `Started ${startYr}`
          : finishYr
          ? `Expected ${finishYr}`
          : undefined;

      if (!profile!.ongoing.some((item) => item.title.toLowerCase() === title.toLowerCase())) {
        profile!.ongoing.push({
          id: `f3-ongoing-${f3RowId}-${oIdx}`,
          status: 'ONGOING',
          title,
          year: yearLabel,
        });
      }
    });

    // 2. Parse Completed Researches from form3_completed_researches + output columns in form3
    const crItems = rawCompletedByF3RowId.get(f3RowId) || [];
    const yearsArr = f3.completed_research_year
      ? String(f3.completed_research_year).split(/\r?\n/).map((s: string) => s.trim())
      : [];
    const patentsArr = f3.outputs_patents
      ? String(f3.outputs_patents).split(/\r?\n/).map((s: string) => s.trim())
      : [];
    const journalsArr = f3.outputs_journal_publications
      ? String(f3.outputs_journal_publications).split(/\r?\n/).map((s: string) => s.trim())
      : [];
    const booksArr = f3.outputs_book_publications
      ? String(f3.outputs_book_publications).split(/\r?\n/).map((s: string) => s.trim())
      : [];
    const terminalsArr = f3.outputs_terminal_report
      ? String(f3.outputs_terminal_report).split(/\r?\n/).map((s: string) => s.trim())
      : [];

    crItems.forEach((cr, crIdx) => {
      const yrVal = (yearsArr[crIdx] ?? (yearsArr.length === 1 ? yearsArr[0] : '')) || undefined;
      const cleanYear = yrVal && !['none', 'empty', 'null', '—', '-'].includes(yrVal.toLowerCase()) ? yrVal : undefined;

      const jrnVal = journalsArr[crIdx] ?? (crItems.length === 1 && crIdx === 0 ? journalsArr[0] : '') ?? '';
      const patVal = patentsArr[crIdx] ?? (crItems.length === 1 && crIdx === 0 ? patentsArr[0] : '') ?? '';
      const bkVal = booksArr[crIdx] ?? (crItems.length === 1 && crIdx === 0 ? booksArr[0] : '') ?? '';
      const trmVal = terminalsArr[crIdx] ?? (crItems.length === 1 && crIdx === 0 ? terminalsArr[0] : '') ?? '';

      let outputType: string | undefined;
      let outputCitation: string | undefined;
      if (jrnVal && !['none', 'empty', 'null', '—', '-'].includes(jrnVal.toLowerCase())) {
        outputType = 'Journal Publication';
        outputCitation = jrnVal;
      } else if (patVal && !['none', 'empty', 'null', '—', '-'].includes(patVal.toLowerCase())) {
        outputType = 'Patent';
        outputCitation = patVal;
      } else if (bkVal && !['none', 'empty', 'null', '—', '-'].includes(bkVal.toLowerCase())) {
        outputType = 'Book Publication';
        outputCitation = bkVal;
      } else if (trmVal && !['none', 'empty', 'null', '—', '-'].includes(trmVal.toLowerCase())) {
        outputType = 'Terminal Report';
        outputCitation = trmVal.startsWith('http') ? undefined : trmVal;
      }

      const existing = profile!.completed.find((item) => item.title.toLowerCase() === cr.title.toLowerCase());
      if (!existing) {
        profile!.completed.push({
          id: `f3-completed-${f3RowId}-${crIdx}`,
          status: 'COMPLETED',
          title: cr.title,
          year: cleanYear,
          outputType,
          outputCitation,
          link: cr.link || (trmVal.startsWith('http') ? trmVal : undefined),
        });
      } else if (!existing.link && cr.link) {
        existing.link = cr.link;
      }
    });
  });

  const allSubjectRows = [...(sub25Res.data || []), ...(sub26Res.data || [])].sort(
    (a: any, b: any) => (Number(a.id) || 0) - (Number(b.id) || 0)
  );
  const subjectsByRowId = new Map<number, { sy25: Form2SubjectItem[]; sy26: Form2SubjectItem[] }>();

  allSubjectRows.forEach((s: any) => {
    const rowIdNum = Number(s.row_id);
    if (isNaN(rowIdNum)) return;
    const rawSubj = String(s.subject_name || '').trim();
    if (!rawSubj || rawSubj.toLowerCase() === 'none' || rawSubj === '—' || rawSubj === '-') return;

    if (!subjectsByRowId.has(rowIdNum)) {
      subjectsByRowId.set(rowIdNum, { sy25: [], sy26: [] });
    }
    const group = subjectsByRowId.get(rowIdNum)!;
    const sy = String(s.school_year || '').trim();
    const targetList =
      sy.includes('2025') && sy.includes('2026')
        ? group.sy25
        : sy.includes('2026') && sy.includes('2027')
        ? group.sy26
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

  const validForm2Rows = (form2Res.data || []).filter((r: any) => {
    const rowIdNum = Number(r.row_id);
    const rawName = String(r.faculty_name || '').trim();
    if (!rawName || rawName.toLowerCase() === 'null' || rawName.includes(':')) return false;
    if (rowIdNum > 314) return false;
    return true;
  });

  const mapped: Form2FacultyItem[] = validForm2Rows.map((r: any, idx: number) => {
    const rowIdNum = Number(r.row_id);
    const placement = resolveOfficialForm2Placement(rowIdNum, r.campus_name, r.school_name, r.faculty_category);

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

    const rowSubs = subjectsByRowId.get(rowIdNum) || { sy25: [], sy26: [] };

    // Match Form 2 faculty member to their Form 3 Research Profile
    const f2Key = parseFacultyMatchKey(r.faculty_name || '');
    let matchedF3 = form3ByFullNorm.get(f2Key.fullNorm);
    if (!matchedF3 && f2Key.last && f2Key.first) {
      matchedF3 = form3Profiles.find(
        (p) =>
          p.matchKey.last === f2Key.last &&
          p.matchKey.first &&
          (p.matchKey.first === f2Key.first ||
            p.matchKey.first.startsWith(f2Key.first) ||
            f2Key.first.startsWith(p.matchKey.first))
      );
    }

    return {
      id: String(r.row_id),
      sequenceNo: idx + 1,
      name: String(r.faculty_name || '').trim(),
      campus: placement.campus,
      campusCategory: placement.campusCategory,
      department: placement.department,
      facultyCategory: placement.facultyCategory,
      programGroup: placement.programGroup,
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
      sy2025_2026: rowSubs.sy25.map((x) => x.name).join(', '),
      sy2026_2027: rowSubs.sy26.map((x) => x.name).join(', '),
      sy2025_2026_items: rowSubs.sy25,
      sy2026_2027_items: rowSubs.sy26,
      driveFolderId: undefined,
      driveFolderUrl: cleanVal(r.faculty_name_link) || undefined,
      sourceExcelRow: rowIdNum,
      photoPath: resolveFacultyPhoto(r.faculty_name, r.photo_link || r.photo_url),
      ongoingResearches: matchedF3 ? matchedF3.ongoing : [],
      completedResearches: matchedF3 ? matchedF3.completed : [],
    };
  });

  cachedForm2Faculty = mapped;
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  cachedForm2LastSynced = nowStr;

  try {
    localStorage.setItem(FORM2_STORAGE_KEY, JSON.stringify(mapped));
    sessionStorage.setItem('jhcsc_form2_cache_v8', JSON.stringify(mapped));
  } catch {}

  return mapped;
}

export async function preloadForm2Data(): Promise<Form2FacultyItem[] | null> {
  if (cachedForm2Faculty && cachedForm2Faculty.length > 0) return cachedForm2Faculty;
  try {
    const stored = (typeof window !== 'undefined' ? localStorage.getItem(FORM2_STORAGE_KEY) : null);
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
      const stored = (typeof window !== 'undefined' ? localStorage.getItem(FORM2_STORAGE_KEY) : null);
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
  const [expandedResearchCards, setExpandedResearchCards] = useState<Record<string, boolean>>({});
  const [selectedResearchModalFaculty, setSelectedResearchModalFaculty] = useState<Form2FacultyItem | null>(null);

  const toggleResearchCard = (facultyId: string) => {
    setExpandedResearchCards((prev) => ({
      ...prev,
      [facultyId]: !prev[facultyId],
    }));
  };

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

  // Filtered faculty list preserving official Excel row order (1 to 228)
  const filteredFaculty = useMemo(() => {
    return [...faculty]
      .sort((a, b) => (a.sourceExcelRow ?? 9999) - (b.sourceExcelRow ?? 9999))
      .filter((f) => {
        // Campus filter
        if (selectedCampus !== 'All campuses') {
          if (selectedCampus === 'Main' && f.campusCategory !== 'Main') return false;
          if (selectedCampus === 'Pagadian' && f.campusCategory !== 'Pagadian') return false;
          if (selectedCampus === 'Dumingag' && f.campusCategory !== 'Dumingag') return false;
          if (selectedCampus === 'CMSE' && f.campusCategory !== 'CMSE') return false;
        }

        // School / Department filter
        if (selectedSchool !== 'All schools' && f.department !== selectedSchool && f.facultyCategory !== selectedSchool) {
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
          const matchesProg = (f.facultyCategory || f.programGroup || '').toLowerCase().includes(q);
          const matchesRank = f.academicRank.toLowerCase().includes(q);
          const matchesSpec = f.academicSpecialization.toLowerCase().includes(q);
          const matchesDegree =
            f.bachelorDegree.toLowerCase().includes(q) ||
            f.masterDegree.toLowerCase().includes(q) ||
            f.doctorateDegree.toLowerCase().includes(q);
          const matchesResearch =
            (f.ongoingResearches || []).some((r) => r.title.toLowerCase().includes(q)) ||
            (f.completedResearches || []).some((r) => r.title.toLowerCase().includes(q));
          if (!matchesName && !matchesDept && !matchesProg && !matchesRank && !matchesSpec && !matchesDegree && !matchesResearch) {
            return false;
          }
        }

        return true;
      });
  }, [faculty, selectedCampus, selectedSchool, selectedRank, searchQuery]);

  // Unique schools/units list in official presentation order for dropdown
  const schoolsList = useMemo(() => {
    const preferredOrder = [
      'School of Teacher Education',
      'School of Arts and Sciences',
      'School of Computing Science',
      'School of Engineering & Technology',
      'School of Agriculture, Forestry, and Environmental Sciences',
      'School of Nursing',
      'School of Business and Management',
      'School of Law',
      'School of Criminal Justice Education',
      'PathFit',
      'General Education Courses',
    ];
    const existing = new Set(faculty.map((f) => f.department).filter(Boolean));
    const ordered = preferredOrder.filter((s) => existing.has(s));
    existing.forEach((s) => {
      if (!ordered.includes(s)) ordered.push(s);
    });
    return ordered;
  }, [faculty]);

  // Campus counts for top filter buttons
  const campusCounts = useMemo(() => {
    return {
      all: faculty.length,
      main: faculty.filter((f) => f.campusCategory === 'Main').length,
      pagadian: faculty.filter((f) => f.campusCategory === 'Pagadian').length,
      cmse: faculty.filter((f) => f.campusCategory === 'CMSE').length,
      dumingag: faculty.filter((f) => f.campusCategory === 'Dumingag').length,
    };
  }, [faculty]);

  // Dynamic statistics computed from REAL Supabase data
  const stats = useMemo(() => {
    const total = faculty.length;
    const permanent = faculty.filter((f) => f.fullTimePermanent).length;
    const contractual = faculty.filter((f) => f.fullTimeContractual).length;
    const partTime = faculty.filter((f) => f.partTime).length;
    const doctorate = faculty.filter((f) => f.highestDegree === 'Doctorate').length;
    const master = faculty.filter((f) => f.highestDegree === "Master's" || f.highestDegree === "Bachelor's").length;
    const bachelor = 0;

    // Classify Completed vs Ongoing for Doctorate and Master's degrees
    const isOngoingDegreeText = (str?: string | null): boolean => {
      if (!str) return false;
      return /on[\s-]*going|\bcar\b|\bunits\b|candidate|enrolled|pursuing|in progress|continuing|lack of tor|no tor|less thesis|dissertation|applied\s+for\s+graduation/i.test(
        str
      );
    };

    let completedDoctorate = 0;
    let ongoingDoctorate = 0;
    let completedMasters = 0;
    let ongoingMasters = 0;

    faculty.forEach((f) => {
      const docStr = (f.doctorateDegree || '').trim();
      const mastStr = (f.masterDegree || '').trim();
      const hasDoc = Boolean(docStr && !['none', 'empty', 'null', '-', '—'].includes(docStr.toLowerCase()));
      const hasMast = Boolean(mastStr && !['none', 'empty', 'null', '-', '—'].includes(mastStr.toLowerCase()));

      if (hasDoc) {
        if (isOngoingDegreeText(docStr)) {
          ongoingDoctorate++;
        } else {
          completedDoctorate++;
        }
      } else if (hasMast) {
        const parts = mastStr
          .split(/[\/\n]+/)
          .map((p) => p.trim())
          .filter(Boolean);
        const hasCompletedMasterPart = parts.length > 0 && parts.some((p) => !isOngoingDegreeText(p));
        if (hasCompletedMasterPart) {
          completedMasters++;
        } else {
          ongoingMasters++;
        }
      } else {
        ongoingMasters++;
      }
    });

    const docRate = total > 0 ? Math.round((doctorate / total) * 100) : 0;
    const mastRate = total > 0 ? Math.round((master / total) * 100) : 0;
    const advancedCount = total;
    const advancedRate = 100;

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
      completedDoctorate,
      ongoingDoctorate,
      completedMasters,
      ongoingMasters,
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
        {
          label: 'Completed Doctorate',
          count: completedDoctorate,
          pct: total > 0 ? Math.round((completedDoctorate / total) * 100) : 0
        },
        {
          label: 'Ongoing Doctorate',
          count: ongoingDoctorate,
          pct: total > 0 ? Math.round((ongoingDoctorate / total) * 100) : 0
        },
        {
          label: "Completed Master's",
          count: completedMasters,
          pct: total > 0 ? Math.round((completedMasters / total) * 100) : 0
        },
        {
          label: "Ongoing Master's",
          count: ongoingMasters,
          pct: total > 0 ? Math.max(4, Math.round((ongoingMasters / total) * 100)) : 0
        }
      ]
    };
  }, [faculty]);

  // Group faculty under the 3-tier hierarchy: Campus -> School/College -> Faculty / Program Category
  const groupedHierarchy = useMemo(() => {
    const campusOrder = ['Main Campus', 'Pagadian Campus', 'Lakewood Campus', 'Dumingag Campus'];
    const groups: Record<string, Record<string, Record<string, Form2FacultyItem[]>>> = {};

    filteredFaculty.forEach((item) => {
      const camp = item.campus || 'Main Campus';
      const dept = item.department || 'General Academic Program';
      const cat = item.facultyCategory || item.programGroup || 'General / Uncategorized';

      if (!groups[camp]) groups[camp] = {};
      if (!groups[camp][dept]) groups[camp][dept] = {};
      if (!groups[camp][dept][cat]) groups[camp][dept][cat] = [];

      groups[camp][dept][cat].push(item);
    });

    // Sort campuses according to standard institutional order
    const sortedGroups: Record<string, Record<string, Record<string, Form2FacultyItem[]>>> = {};
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
            <div className="text-xs font-medium text-[#64748B] mt-1.5">With doctorate degree (completed &amp; ongoing)</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-[18px] p-6 shadow-sm">
            <div className="text-4xl font-extrabold text-[#0E3322]">
              {loading ? '...' : stats.master}
            </div>
            <div className="text-xs font-medium text-[#64748B] mt-1.5">With master&apos;s degree (completed &amp; ongoing)</div>
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

              <div className="space-y-3.5 text-xs">
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
                <span className="text-[11px] text-[#64748B]">Completed &amp; ongoing Doctorate and Master&apos;s degrees</span>
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

          {/* Filter Bar */}
          <div className="space-y-4 mb-8">
            {/* Top Row: Campus Pills on Left, All schools + All ranks on Right */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Campus Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'All campuses', label: 'All campuses', count: campusCounts.all },
                  { id: 'Main', label: 'Main', count: campusCounts.main },
                  { id: 'Pagadian', label: 'Pagadian', count: campusCounts.pagadian },
                  { id: 'CMSE', label: 'Lakewood', count: campusCounts.cmse },
                  { id: 'Dumingag', label: 'Dumingag', count: campusCounts.dumingag },
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
                    {Object.entries(departments).map(([deptName, categoriesMap]) => {
                      const deptFacultyCount = Object.values(categoriesMap).reduce(
                        (sum, list) => sum + list.length,
                        0
                      );
                      return (
                        <div key={deptName} className="space-y-5">
                          {/* Tier 1 & 2 Section Heading: ● Main Campus — School of Teacher Education 39 faculty ---------------- */}
                          <div className="flex items-center gap-2.5 w-full pt-2 pb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F] shrink-0" />
                            <h3 className="font-display font-bold text-base sm:text-lg text-[#0E3322] tracking-tight whitespace-nowrap">
                              {campusName} — {deptName}
                            </h3>
                            <span className="text-xs font-normal text-[#64748B] shrink-0">
                              {deptFacultyCount} faculty
                            </span>
                            <div className="flex-1 border-t border-dashed border-[#BCC7B9] ml-2 hidden sm:block" />
                          </div>

                          {/* Tier 3: Faculty / Program Category Groups */}
                          <div className="space-y-7">
                            {Object.entries(categoriesMap).map(([categoryName, facultyList]) => {
                              const hasSpecificCategory =
                                Boolean(categoryName) &&
                                categoryName !== 'General / Uncategorized' &&
                                categoryName.toLowerCase() !== 'uncategorized';

                              return (
                                <div key={categoryName} className="space-y-3.5">
                                  {hasSpecificCategory && (
                                    <div className="flex items-center gap-2 w-full pl-1">
                                      <span className="text-xs font-bold text-[#1E4D2B] shrink-0">▸</span>
                                      <h4 className="font-display font-bold text-xs sm:text-sm text-[#1E4D2B] tracking-tight">
                                        {categoryName}
                                      </h4>
                                      <span className="text-[11px] font-normal text-[#64748B] shrink-0">
                                        {facultyList.length} faculty
                                      </span>
                                      <div className="flex-1 border-t border-[#E5E9E2] ml-2 hidden sm:block" />
                                    </div>
                                  )}

                                  {/* Cards Grid — Responsive compact layout with brand styling */}
                                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                    {facultyList.map((f) => {
                            const sy25Items: Form2SubjectItem[] =
                              f.sy2025_2026_items && f.sy2025_2026_items.length > 0
                                ? f.sy2025_2026_items
                                : parseSubjectPills(f.sy2025_2026).map((name) => ({ name }));
                            const sy26Items: Form2SubjectItem[] =
                              f.sy2026_2027_items && f.sy2026_2027_items.length > 0
                                ? f.sy2026_2027_items
                                : parseSubjectPills(f.sy2026_2027).map((name) => ({ name }));
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
                                  {(() => {
                                    const resolvedPhoto = f.photoPath || resolveFacultyPhoto(f.name);
                                    return (
                                      <div
                                        className={`w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-[#E3EFE8] border border-[#BCC7B9]/60 flex flex-col items-center justify-center text-center overflow-hidden relative shadow-2xs ${
                                          resolvedPhoto ? 'p-0' : 'p-2'
                                        }`}
                                      >
                                        {resolvedPhoto ? (
                                          <img
                                            src={resolvedPhoto}
                                            alt={f.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover object-top"
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
                                    );
                                  })()}

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
                                <div className="flex-1 min-w-0 overflow-hidden p-3.5 sm:p-4.5 flex flex-col justify-between space-y-3">
                                  <div className="space-y-3 min-w-0">
                                    {/* Header: Name, Academic Rank, School & Licensed Status */}
                                    <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-[#F1F5F9] min-w-0">
                                      <div className="min-w-0 flex-1">
                                        <h4 className="font-display font-bold text-[#15221A] text-base sm:text-lg leading-tight break-words">
                                          {f.name}
                                        </h4>
                                        <div className="text-xs font-semibold text-[#1E4D2B] mt-0.5 break-words">
                                          {f.academicRank}
                                        </div>
                                        <div className="text-[11px] text-[#64748B] mt-0.5 break-words">
                                          {f.department || deptName}
                                          {f.facultyCategory && f.facultyCategory !== 'General / Uncategorized'
                                            ? ` • ${f.facultyCategory}`
                                            : ''}
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
                                    <div className="space-y-1 min-w-0">
                                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#64748B] block">
                                        EDUCATIONAL BACKGROUND
                                      </span>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs min-w-0">
                                        <div className="min-w-0">
                                          <span className="text-[10px] font-semibold text-[#64748B] block">
                                            Bachelor&apos;s
                                          </span>
                                          <p className="text-[11px] text-[#15221A] font-medium leading-snug mt-0.5 break-words">
                                            {f.bachelorDegree || '—'}
                                          </p>
                                        </div>
                                        <div className="min-w-0">
                                          <span className="text-[10px] font-semibold text-[#64748B] block">
                                            Master&apos;s
                                          </span>
                                          <p className="text-[11px] text-[#15221A] font-medium leading-snug mt-0.5 break-words">
                                            {f.masterDegree || '—'}
                                          </p>
                                        </div>
                                        <div className="min-w-0">
                                          <span className="text-[10px] font-semibold text-[#64748B] block">
                                            Doctorate
                                          </span>
                                          <p
                                            className={`text-[11px] leading-snug mt-0.5 break-words ${
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs min-w-0">
                                      <div className="min-w-0">
                                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#64748B] block">
                                          SPECIALIZATION
                                        </span>
                                        <p className="text-[11.5px] font-bold text-[#15221A] mt-0.5 break-words min-h-[16px]">
                                          {f.academicSpecialization || ''}
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

                                        <div className="min-w-0">
                                          <span className="text-[10px] font-semibold text-[#64748B] block mb-1">
                                            SY 2026–2027
                                          </span>
                                          {sy26Items.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                              {sy26Items.map((subj, idx) =>
                                                subj.link ? (
                                                  <DocumentLinkPreview
                                                    key={idx}
                                                    url={subj.link}
                                                    title={`${f.name} — ${subj.name} (SY 2026–2027)`}
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

                                    <div className="border-b border-[#F1F5F9]" />

                                    {/* Research Involvement (from Form 3) — Compact Summary Strip + Expandable Drawer */}
                                    {(() => {
                                      const ongoingList = f.ongoingResearches || [];
                                      const completedList = f.completedResearches || [];
                                      const allResearches = [...ongoingList, ...completedList];
                                      const totalResearchCount = allResearches.length;
                                      const isExpanded = Boolean(expandedResearchCards[f.id]);
                                      const primaryResearch = allResearches[0];

                                      return (
                                        <div className="space-y-1.5 text-xs min-w-0 w-full">
                                          <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                                            <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#64748B] inline-flex items-center gap-1">
                                              <BookOpen className="w-3 h-3 text-[#1E4D2B] shrink-0" />
                                              <span>RESEARCH INVOLVEMENT (FORM 3)</span>
                                            </span>

                                            {totalResearchCount > 0 ? (
                                              <div className="flex items-center gap-1.5 text-[10.5px] font-semibold shrink-0">
                                                {ongoingList.length > 0 && (
                                                  <span className="text-[#B45309]">
                                                    {ongoingList.length} Ongoing
                                                  </span>
                                                )}
                                                {ongoingList.length > 0 && completedList.length > 0 && (
                                                  <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
                                                )}
                                                {completedList.length > 0 && (
                                                  <span className="text-[#1E4D2B]">
                                                    {completedList.length} Completed
                                                  </span>
                                                )}
                                              </div>
                                            ) : (
                                              <span className="text-[10.5px] text-[#94A3B8] italic">
                                                No recorded research
                                              </span>
                                            )}
                                          </div>

                                          {totalResearchCount > 0 && (
                                            <div className="w-full min-w-0 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 space-y-1.5 overflow-hidden">
                                              {/* Default Compact Preview when collapsed */}
                                              {!isExpanded && primaryResearch && (
                                                <div className="space-y-1.5 min-w-0">
                                                  {/* Top Row: Status + Year on Left, Expand/Portfolio buttons on Right */}
                                                  <div className="flex items-center justify-between gap-2 text-[10px] min-w-0">
                                                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                                                      <span
                                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                          primaryResearch.status === 'ONGOING'
                                                            ? 'bg-[#D97706]'
                                                            : 'bg-[#1E4D2B]'
                                                        }`}
                                                      />
                                                      <span
                                                        className={`font-bold uppercase tracking-wide ${
                                                          primaryResearch.status === 'ONGOING'
                                                            ? 'text-[#B45309]'
                                                            : 'text-[#1E4D2B]'
                                                        }`}
                                                      >
                                                        {primaryResearch.status === 'ONGOING' ? 'Ongoing' : 'Completed'}
                                                      </span>
                                                      {primaryResearch.year && (
                                                        <>
                                                          <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
                                                          <span className="text-[#64748B] font-medium">{primaryResearch.year}</span>
                                                        </>
                                                      )}
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                      {totalResearchCount > 1 && (
                                                        <button
                                                          type="button"
                                                          onClick={() => toggleResearchCard(f.id)}
                                                          className="text-[10px] font-semibold text-[#1E4D2B] hover:text-[#0E3322] inline-flex items-center gap-0.5 cursor-pointer"
                                                        >
                                                          <span>+{totalResearchCount - 1} more</span>
                                                          <ChevronDown className="w-3 h-3" />
                                                        </button>
                                                      )}
                                                      <button
                                                        type="button"
                                                        onClick={() => setSelectedResearchModalFaculty(f)}
                                                        className="text-[10px] font-semibold text-[#475569] hover:text-[#1E4D2B] hover:underline cursor-pointer"
                                                      >
                                                        View portfolio
                                                      </button>
                                                    </div>
                                                  </div>

                                                  {/* Research Title (wraps cleanly up to 2 lines without pushing card width) */}
                                                  <div className="min-w-0 w-full">
                                                    {primaryResearch.link ? (
                                                      <DocumentLinkPreview
                                                        url={primaryResearch.link}
                                                        title={`${f.name} — ${primaryResearch.title}`}
                                                      >
                                                        <a
                                                          href={primaryResearch.link}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="text-[11px] font-semibold text-[#15221A] hover:text-[#1E4D2B] hover:underline leading-snug line-clamp-2 break-words whitespace-normal block cursor-pointer"
                                                        >
                                                          <span>{primaryResearch.title}</span>
                                                          <ExternalLink className="w-2.5 h-2.5 text-[#1E4D2B] inline-block ml-1 align-baseline" />
                                                        </a>
                                                      </DocumentLinkPreview>
                                                    ) : (
                                                      <p className="text-[11px] font-semibold text-[#15221A] leading-snug line-clamp-2 break-words whitespace-normal">
                                                        {primaryResearch.title}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              )}

                                              {/* Expanded Collapsible Drawer */}
                                              {isExpanded && (
                                                <div className="space-y-2 min-w-0">
                                                  <div className="max-h-48 overflow-y-auto pr-1 space-y-2 min-w-0">
                                                    {allResearches.map((resItem, rIdx) => (
                                                      <div
                                                        key={resItem.id || rIdx}
                                                        className="text-[11px] pb-1.5 border-b border-[#E2E8F0]/70 last:border-b-0 last:pb-0 min-w-0"
                                                      >
                                                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#64748B] mb-0.5">
                                                          <span
                                                            className={`font-bold uppercase tracking-wide ${
                                                              resItem.status === 'ONGOING'
                                                                ? 'text-[#B45309]'
                                                                : 'text-[#1E4D2B]'
                                                            }`}
                                                          >
                                                            {resItem.status === 'ONGOING' ? 'Ongoing' : 'Completed'}
                                                          </span>
                                                          {resItem.year && (
                                                            <>
                                                              <span aria-hidden="true">·</span>
                                                              <span>{resItem.year}</span>
                                                            </>
                                                          )}
                                                          {resItem.outputType && (
                                                            <>
                                                              <span aria-hidden="true">·</span>
                                                              <span className="text-[#475569] font-medium">
                                                                {resItem.outputType}
                                                              </span>
                                                            </>
                                                          )}
                                                        </div>

                                                        {resItem.link ? (
                                                          <DocumentLinkPreview
                                                            url={resItem.link}
                                                            title={`${f.name} — ${resItem.title}`}
                                                          >
                                                            <a
                                                              href={resItem.link}
                                                              target="_blank"
                                                              rel="noopener noreferrer"
                                                              className="font-semibold text-[#15221A] hover:text-[#1E4D2B] hover:underline leading-snug break-words whitespace-normal block cursor-pointer"
                                                            >
                                                              <span>{resItem.title}</span>
                                                              <ExternalLink className="w-2.5 h-2.5 text-[#1E4D2B] inline-block ml-1 align-baseline" />
                                                            </a>
                                                          </DocumentLinkPreview>
                                                        ) : (
                                                          <p className="font-semibold text-[#15221A] leading-snug break-words whitespace-normal">
                                                            {resItem.title}
                                                          </p>
                                                        )}

                                                        {resItem.outputCitation && (
                                                          <p className="text-[10px] text-[#64748B] mt-0.5 leading-snug break-words whitespace-normal">
                                                            {resItem.outputCitation}
                                                          </p>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>

                                                  <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0]">
                                                    <button
                                                      type="button"
                                                      onClick={() => setSelectedResearchModalFaculty(f)}
                                                      className="text-[10px] font-semibold text-[#1E4D2B] hover:underline cursor-pointer"
                                                    >
                                                      Open full research profile
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => toggleResearchCard(f.id)}
                                                      className="text-[10px] font-semibold text-[#64748B] hover:text-[#15221A] inline-flex items-center gap-0.5 cursor-pointer"
                                                    >
                                                      <span>Collapse</span>
                                                      <ChevronDown className="w-3 h-3 rotate-180" />
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
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
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )
          )}

          {/* TABLE VIEW — Complete CHED Form 2 */}
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
                    <th scope="col" colSpan={2} className="py-1.5 px-3 text-center font-bold">
                      Research Involvement (Form 3)
                    </th>
                  </tr>

                  {/* Tier 2: Specific Official Subheaders */}
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
                    <th scope="col" className="py-1.5 px-3 text-center min-w-[150px]">SY 2025-2026</th>
                    <th scope="col" className="py-1.5 px-3 text-center min-w-[150px]">SY 2026-2027</th>
                    <th scope="col" className="py-1.5 px-3 text-center min-w-[200px]">Ongoing Research</th>
                    <th scope="col" className="py-1.5 px-3 text-center min-w-[220px]">Completed Research</th>
                  </tr>
                </thead>

                <tbody className="text-xs divide-y divide-[#F1F5F9]">
                  {Object.keys(groupedHierarchy).length === 0 ? (
                    <tr>
                      <td colSpan={18} className="py-10 text-center text-[#64748B]">
                        No matching faculty found.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(groupedHierarchy).map(([campusName, departments]) => (
                      <React.Fragment key={campusName}>
                        {/* Level 1: Campus Header Row */}
                        <tr className="bg-[#FAFBF8] border-y border-[#BCC7B9]/60">
                          <td colSpan={18} className="py-2.5 px-4 font-bold text-[#0E3322] text-xs uppercase tracking-wide">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#E8AE1F] mr-2 shrink-0 align-middle" />
                            <span className="align-middle">{campusName}</span>
                          </td>
                        </tr>

                        {Object.entries(departments).map(([deptName, categoriesMap]) => (
                          <React.Fragment key={deptName}>
                            {/* Level 2: School / College Header Row */}
                            <tr className="bg-[#1E4D2B]/10 border-b border-[#1E4D2B]/20">
                              <td colSpan={18} className="py-1.5 px-3 font-bold text-[#1E4D2B] text-xs">
                                ▸ {deptName}
                              </td>
                            </tr>

                            {Object.entries(categoriesMap).map(([categoryName, facultyList]) => {
                              const hasSpecificCategory =
                                Boolean(categoryName) &&
                                categoryName !== 'General / Uncategorized' &&
                                categoryName.toLowerCase() !== 'uncategorized';

                              return (
                                <React.Fragment key={categoryName}>
                                  {/* Level 3: Faculty / Program Category Header Row */}
                                  {hasSpecificCategory && (
                                    <tr className="bg-[#F4F6F1] border-b border-[#E5E9E2]">
                                      <td colSpan={18} className="py-1.5 pl-6 pr-3 font-semibold text-[#0E3322] text-[11px]">
                                        • {categoryName}
                                      </td>
                                    </tr>
                                  )}

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
                                  {f.academicSpecialization || ''}
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

                                {/* Specific Subject Assignments: SY 2026-2027 */}
                                <td className="py-2.5 px-3 align-top text-[#334155] text-[11px] leading-snug break-words">
                                  {f.sy2026_2027_items && f.sy2026_2027_items.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {f.sy2026_2027_items.map((subj, idx) =>
                                        subj.link ? (
                                          <GoogleDrivePreviewCell
                                            key={idx}
                                            text={idx < f.sy2026_2027_items!.length - 1 ? `${subj.name},` : subj.name}
                                            explicitUrl={subj.link}
                                          />
                                        ) : (
                                          <span key={idx}>
                                            {subj.name}
                                            {idx < f.sy2026_2027_items!.length - 1 ? ',' : ''}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    f.sy2026_2027 || '—'
                                  )}
                                </td>

                                {/* Ongoing Research (Form 3) */}
                                <td className="py-2.5 px-3 align-top text-[#334155] text-[11px] leading-snug break-words max-w-[240px]">
                                  {f.ongoingResearches && f.ongoingResearches.length > 0 ? (
                                    <div className="space-y-1">
                                      {f.ongoingResearches.slice(0, 2).map((resItem, rIdx) => (
                                        <div key={resItem.id || rIdx} className="line-clamp-2">
                                          <span className="font-semibold text-[#B45309] mr-1">
                                            {rIdx + 1}.
                                          </span>
                                          <span>{resItem.title}</span>
                                          {resItem.year && (
                                            <span className="text-[10px] text-[#64748B] ml-1">
                                              ({resItem.year})
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                      {f.ongoingResearches.length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedResearchModalFaculty(f)}
                                          className="text-[10px] font-semibold text-[#1E4D2B] hover:underline cursor-pointer"
                                        >
                                          +{f.ongoingResearches.length - 2} more ongoing
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    '—'
                                  )}
                                </td>

                                {/* Completed Research (Form 3) */}
                                <td className="py-2.5 px-3 align-top text-[#334155] text-[11px] leading-snug break-words max-w-[260px]">
                                  {f.completedResearches && f.completedResearches.length > 0 ? (
                                    <div className="space-y-1">
                                      {f.completedResearches.slice(0, 2).map((resItem, rIdx) => (
                                        <div key={resItem.id || rIdx} className="line-clamp-2">
                                          <span className="font-semibold text-[#1E4D2B] mr-1">
                                            {rIdx + 1}.
                                          </span>
                                          {resItem.link ? (
                                            <GoogleDrivePreviewCell
                                              text={resItem.title}
                                              explicitUrl={resItem.link}
                                            />
                                          ) : (
                                            <span>{resItem.title}</span>
                                          )}
                                          {resItem.year && (
                                            <span className="text-[10px] text-[#64748B] ml-1">
                                              ({resItem.year})
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                      {f.completedResearches.length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedResearchModalFaculty(f)}
                                          className="text-[10px] font-semibold text-[#1E4D2B] hover:underline cursor-pointer"
                                        >
                                          +{f.completedResearches.length - 2} more completed (View all {f.completedResearches.length})
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                              </tr>
                                  ))}
                                </React.Fragment>
                              );
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

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-[#E5E9E2] flex items-center justify-end text-xs text-[#64748B]">
            <span className="font-semibold text-[#1E4D2B]">
              Showing {filteredFaculty.length} of {faculty.length} faculty
            </span>
          </div>
        </div>
      </div>

      {/* Faculty Research Portfolio Modal (Form 3 Data) */}
      {selectedResearchModalFaculty && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setSelectedResearchModalFaculty(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#BCC7B9] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0E3322] text-white px-5 py-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#E8AE1F]">
                  Form 3 Research Portfolio
                </div>
                <h3 className="font-display font-bold text-lg leading-snug mt-0.5">
                  {selectedResearchModalFaculty.name}
                </h3>
                <p className="text-xs text-white/80 mt-0.5">
                  {selectedResearchModalFaculty.academicRank} · {selectedResearchModalFaculty.department} ({selectedResearchModalFaculty.campus})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResearchModalFaculty(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Ongoing Researches */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#E2E8F0]">
                  <h4 className="font-bold uppercase tracking-wider text-[#B45309] text-[11px]">
                    Ongoing Researches ({(selectedResearchModalFaculty.ongoingResearches || []).length})
                  </h4>
                </div>
                {(selectedResearchModalFaculty.ongoingResearches || []).length > 0 ? (
                  <div className="space-y-2.5">
                    {(selectedResearchModalFaculty.ongoingResearches || []).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-[#B45309]">
                          <span>Study #{idx + 1} · Ongoing</span>
                          {item.year && <span>{item.year}</span>}
                        </div>
                        <p className="font-bold text-[#15221A] text-xs leading-snug">
                          {item.title}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#94A3B8] italic">No ongoing research recorded in Form 3.</p>
                )}
              </div>

              {/* Completed Researches */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#E2E8F0]">
                  <h4 className="font-bold uppercase tracking-wider text-[#1E4D2B] text-[11px]">
                    Completed Researches ({(selectedResearchModalFaculty.completedResearches || []).length})
                  </h4>
                </div>
                {(selectedResearchModalFaculty.completedResearches || []).length > 0 ? (
                  <div className="space-y-2.5">
                    {(selectedResearchModalFaculty.completedResearches || []).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-[#1E4D2B]">
                          <span>
                            Study #{idx + 1} · Completed
                            {item.outputType ? ` · ${item.outputType}` : ''}
                          </span>
                          {item.year && <span className="text-[#475569]">Year: {item.year}</span>}
                        </div>
                        {item.link ? (
                          <DocumentLinkPreview
                            url={item.link}
                            title={`${selectedResearchModalFaculty.name} — ${item.title}`}
                          >
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-[#15221A] hover:text-[#1E4D2B] hover:underline text-xs leading-snug inline-flex items-start gap-1.5 cursor-pointer"
                            >
                              <span>{item.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-[#1E4D2B] shrink-0 mt-0.5" />
                            </a>
                          </DocumentLinkPreview>
                        ) : (
                          <p className="font-bold text-[#15221A] text-xs leading-snug">
                            {item.title}
                          </p>
                        )}
                        {item.outputCitation && (
                          <p className="text-[11px] text-[#475569] leading-snug pt-0.5">
                            <span className="font-semibold text-[#15221A]">Output / Citation: </span>
                            {item.outputCitation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#94A3B8] italic">No completed research recorded in Form 3.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedResearchModalFaculty(null)}
                className="px-4 py-1.5 rounded-lg bg-[#1E4D2B] hover:bg-[#0E3322] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
