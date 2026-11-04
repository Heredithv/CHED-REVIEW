import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  Search,
  ExternalLink,
  RefreshCw,
  X,
  ChevronDown
} from 'lucide-react';
import { getSupabaseClient } from '../data/api';
import { lookupDriveLinkTitle } from '../data/driveUrlTitles';
import { DocumentLinkPreview } from '../components/DocumentLinkPreview';

export type CampusId = 'Main Campus' | 'Dumingag Campus' | 'Pagadian Campus' | 'CMSE Campus';
export type DegreeLevel = 'Doctoral' | 'Masters' | 'Bachelor';
export type AreaStatusFilter = 'all' | 'complied' | 'not_complied' | 'pending';

export interface ProgrammaticDbRow {
  id: string;
  sheet_name: string;
  sheet_link?: string | null;
  campus: string | null;
  program_name: string | null;
  row_number: number;
  area_of_compliance: string | null;
  psg_requirement: string | null;
  actual_situation: string | null;
  status: string | null;
  chedro_remarks: string | null;
}

export interface ProgrammaticEvidenceDbRow {
  id: number;
  parent_id: string;
  column_source: string | null;
  evidence_text: string | null;
  drive_link: string | null;
}

export interface ProgramEvidenceItem {
  id: string;
  label: string;
  columnSource: string | null;
  driveLink: string;
}

export interface ProgramComplianceRowItem {
  id: string;
  rowNumber: number;
  areaId: number;
  subTitle: string;
  rawArea: string;
  psgRequirement: string;
  cleanPsgRequirement: string;
  actualSituation: string;
  cleanActualSituation: string;
  status: string | null;
  statusCategory: 'complied' | 'not_complied' | 'pending';
  statusLabel: string;
  remarks: string | null;
  evidences: ProgramEvidenceItem[];
}

export interface ProgramAreaGroup {
  areaId: number;
  roman: string;
  title: string;
  rows: ProgramComplianceRowItem[];
  compliedCount: number;
  notCompliedCount: number;
  pendingCount: number;
  overallStatus: 'complied' | 'not_complied' | 'pending';
}

export interface ProgramSheetData {
  sheetName: string;
  sheetLink: string | null;
  code: string;
  shortBadge: string;
  programName: string;
  sidebarTitle: string;
  cmoSubtitle: string;
  dbCampus: string | null;
  campus: CampusId;
  level: DegreeLevel;
  areas: ProgramAreaGroup[];
  allRows: ProgramComplianceRowItem[];
  areasCompliedCount: number;
  areasNotCompliedCount: number;
  areasPendingCount: number;
}

export const CAMPUS_GROUPS: {
  id: CampusId;
  label: string;
}[] = [
  { id: 'Main Campus', label: 'Main Campus' },
  { id: 'Dumingag Campus', label: 'Dumingag Campus' },
  { id: 'Pagadian Campus', label: 'Pagadian Campus' },
  { id: 'CMSE Campus', label: 'CMSE Campus' }
];

export const AREA_DEFINITIONS: {
  id: number;
  roman: string;
  defaultTitle: string;
}[] = [
  { id: 1, roman: 'I', defaultTitle: 'Authority to Operate' },
  { id: 2, roman: 'II', defaultTitle: 'Administration — Qualifications of Dean & Chair' },
  { id: 3, roman: 'III', defaultTitle: 'Curriculum' },
  { id: 4, roman: 'IV', defaultTitle: 'Research & Field Instruction Requirements' },
  { id: 5, roman: 'V', defaultTitle: 'Faculty' },
  { id: 6, roman: 'VI', defaultTitle: 'Library' },
  { id: 7, roman: 'VII', defaultTitle: 'Laboratories and Other Facilities' },
  { id: 8, roman: 'VIII', defaultTitle: 'Admission, Retention and Residency Requirements' },
  { id: 9, roman: 'IX', defaultTitle: 'Research' },
  { id: 10, roman: 'X', defaultTitle: 'Other PSG Requirements' }
];

/**
 * Specific Google Spreadsheet link per programmatic form (`sheet_name`).
 */
export const PROGRAM_SPREADSHEET_LINKS: Record<string, string> = {};
export const DEFAULT_PROGRAMMATIC_SPREADSHEET_LINK = '';

let cachedProgramsList: ProgramSheetData[] | null = null;
let prefetchProgramsPromise: Promise<ProgramSheetData[] | null> | null = null;

function normalizeStatus(statusRaw: string | null): {
  category: 'complied' | 'not_complied' | 'pending';
  label: string;
} {
  const s = (statusRaw || '').trim();
  const sLower = s.toLowerCase();
  if (!s || sLower === 'null' || sLower === 'select option') {
    return { category: 'pending', label: 'Pending' };
  }
  if (sLower === 'complied' || sLower.startsWith('complied')) {
    return { category: 'complied', label: 'Complied' };
  }
  if (sLower.includes('not complied') || sLower.includes('non-complied')) {
    return { category: 'not_complied', label: 'Not Complied' };
  }
  return { category: 'pending', label: s };
}

/**
 * Formats Google Sheets 1899 ratio-to-time strings (e.g. "Sat Dec 30 1899 00:29:42 GMT+0655...")
 * back into their true ratio (e.g. "1:35") and decimal percentages (e.g. "0.7778" -> "77.78%")
 * while preserving all real database text.
 */
function formatDatabaseCellText(raw: string, areaContext = ''): string {
  if (!raw) return '';
  let text = raw
    .replace(/https?:\/\/[^\s)]+/gi, '')
    .replace(/See Evidences? here:\s*/gi, '')
    .trim();

  // Remove accidental outer wrapping double quotes from CSV/Sheet cells
  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
    text = text.slice(1, -1).trim();
  }

  // Convert Google Sheets 1899 time-serialized ratios (1:XX) back to ratio format
  if (/Dec 30 1899/i.test(text)) {
    const timeMatch = text.match(/(\d{2}):(\d{2}):(\d{2})\s*GMT([+-]\d{4})?/i);
    if (timeMatch) {
      const hh = parseInt(timeMatch[1], 10);
      const mm = parseInt(timeMatch[2], 10);
      const ss = parseInt(timeMatch[3], 10);
      // Manila/Singapore 1899 LMT offset (+06:55:25) vs +08:00 (+1h 05m 18s difference when seconds=42)
      if (ss === 42) {
        const totalMinutes = hh * 60 + mm + 66;
        const ratioLeft = Math.floor(totalMinutes / 60);
        const ratioRight = totalMinutes % 60;
        return `${ratioLeft}:${ratioRight}`;
      }
      return `${hh || 1}:${mm}`;
    }
  }

  // Convert raw decimal percentage values (e.g., 1, 0.7778, 0.25) in "Percentage of Full-time Faculty"
  if (/Percentage of Full-time Faculty/i.test(areaContext) && /^(0?\.\d+|1(\.0+)?)$/.test(text)) {
    const num = parseFloat(text);
    if (!isNaN(num) && num > 0 && num <= 1) {
      const pct = Math.round(num * 10000) / 100;
      return `${pct}%`;
    }
  }

  return text.replace(/\n{3,}/g, '\n\n').trim();
}

function resolveSheetMetadata(
  sheetName: string,
  dbCampus: string | null,
  dbProgramName: string | null
): {
  campus: CampusId;
  level: DegreeLevel;
  code: string;
  shortBadge: string;
  programName: string;
  sidebarTitle: string;
} {
  const sLower = sheetName.toLowerCase();
  const cLower = (dbCampus || '').toLowerCase();

  let campus: CampusId = 'Main Campus';
  if (sLower.startsWith('cmse_') || sLower.startsWith('copy of cmse_')) {
    campus = 'CMSE Campus';
  } else if (sLower.startsWith('pagadian_') || sLower.startsWith('copy of pagadian_')) {
    campus = 'Pagadian Campus';
  } else if (
    sLower.startsWith('dumingag_') ||
    sLower.startsWith('duimngag_') ||
    sLower.startsWith('copy of dumingag_')
  ) {
    campus = 'Dumingag Campus';
  } else if (sLower.startsWith('main_') || sLower.startsWith('copy of main_') || sLower === 'phd_elt') {
    campus = 'Main Campus';
  } else if (cLower.includes('cmse') || cLower.includes('canuto') || cLower.includes('enerio')) {
    campus = 'CMSE Campus';
  } else if (cLower.includes('pagadian')) {
    campus = 'Pagadian Campus';
  } else if (cLower.includes('dumingag')) {
    campus = 'Dumingag Campus';
  }

  const rawCode = sheetName
    .replace(/^(Copy of (Main_|Dumingag_|Duimngag_|Pagadian_|CMSE_)|Main_|Dumingag_|Duimngag_|Pagadian_|CMSE_)/i, '')
    .replace(/_/g, ' ')
    .trim();
  const code = sheetName.startsWith('Copy of ') ? `${rawCode} (Copy)` : rawCode || sheetName;
  const shortBadge = rawCode.split(/\s+/)[0] || code.slice(0, 6);

  const pLower = (dbProgramName || '').toLowerCase();
  let level: DegreeLevel = 'Bachelor';
  if (sLower.includes('phd') || pLower.includes('doctor of philosophy') || pLower.includes('doctoral')) {
    level = 'Doctoral';
  } else if (
    /(^|_)(ma|ms|magdev|maed|mserm|mscj)/i.test(sheetName) ||
    pLower.includes('master of') ||
    pLower.includes('master in')
  ) {
    level = 'Masters';
  }

  let programName = (dbProgramName || '').trim();
  if (sheetName === 'Dumingag_PhD Agri') {
    programName = 'Doctor of Philosophy in Agriculture';
  } else if (sheetName === 'Dumingag_MS Agri') {
    programName = 'Master of Science in Agriculture';
  } else if (!programName) {
    const baseKey = sheetName.replace(/^Copy of /i, '');
    const nullNameMap: Record<string, string> = {
      PhD_ELT: 'Doctor of Philosophy in English Language Teaching',
      Main_BAELS: 'Bachelor of Arts in English Language Studies',
      Main_MSERM: 'Master of Science in Environmental Resource Management',
      Dumingag_BSISM: 'Bachelor of Science in Industrial Security Management',
      Dumingag_MAgDev: 'Master of Agricultural Development',
      Pagadian_BSN: 'Bachelor of Science in Nursing',
      Pagadian_BSHM: 'Bachelor of Science in Hospitality Management',
      Pagadian_BSTM: 'Bachelor of Science in Tourism Management',
      Pagadian_BSEntrep: 'Bachelor of Science in Entrepreneurship',
      Pagadian_BSIT: 'Bachelor of Science in Information Technology'
    };
    programName = nullNameMap[baseKey] || sheetName;
  }
  if (sheetName.startsWith('Copy of ') && !programName.endsWith('(Copy)')) {
    programName = `${programName} (Copy)`;
  }

  const sidebarTitle = programName
    .replace(/^Bachelor of Science in /i, 'BS ')
    .replace(/^Bachelor of Arts in /i, 'BA ')
    .replace(/^Bachelor of Secondary Education\s*(major in|-|—)?\s*/i, 'BSEd — ')
    .replace(/^Bachelor in Secondary Education\s*(Major in|-|—)?\s*/i, 'BSEd — ')
    .replace(/^Bachelor of Elementary Education/i, 'BEEd — Elementary Education')
    .replace(/^Bachelor of Physical Education.*/i, 'BPEd — Physical Education')
    .replace(/^Bachelor in Technical[- ]Vocational Teacher Education\s*(major in|-|—)?\s*/i, 'BTVTEd — ')
    .replace(/^Bachelor of Technical[- ]Vocational Teacher Education\s*(major in|-|—)?\s*/i, 'BTVTEd — ')
    .replace(/^Bachelor of Technology and Livelihood Education\s*(major in|-|—)?\s*/i, 'BTLEd — ')
    .replace(/^Master of Arts in Education\s*(major in|-|—)?\s*/i, 'MAEd — ')
    .replace(/^Master of Science in /i, 'MS ')
    .replace(/^Doctor of Philosophy in /i, 'PhD in ');

  return { campus, level, code, shortBadge, programName, sidebarTitle };
}

function detectAreaId(
  areaText: string,
  psgText: string,
  rowNumber: number,
  currentAreaId: number
): number {
  const combined = `${areaText} ${psgText}`.trim();
  const aTrim = areaText.trim();

  if (/^I\.\s*Authority/i.test(aTrim) || rowNumber === 10) return 1;
  if (/^(II|2)\.\s*(Administration|Graduate Program)/i.test(aTrim) || /^Administration$/i.test(aTrim)) return 2;
  if (/^(III|IV)\.\s*Curriculum/i.test(aTrim) || /^Program Structure/i.test(aTrim)) return 3;
  if (
    /^IV\.\s*(Research|Institutional|Administration)/i.test(aTrim) ||
    /Supervised Field Instruction|Facilities for Field Instruction|Institutional Arrangement/i.test(aTrim)
  ) {
    return 4;
  }
  if (
    /^(III|V)\.\s*(Faculty|Program Requirement)/i.test(aTrim) ||
    /^Faculty$/i.test(aTrim) ||
    /Qualifications of Faculty|Conditions of employment|Faculty-student Ratio|Percentage of Full-time Faculty|Teaching Load|Faculty Development Program|Adviser to Student Ratio|Thesis\/Dissertation Panel/i.test(
      aTrim
    )
  ) {
    return 5;
  }
  if (
    /^(V|VI)\.\s*Library/i.test(aTrim) ||
    /^Library$/i.test(aTrim) ||
    /a\.\s*Librarian|a\.\s*Human Resources|b\.\s*Library Holdings/i.test(aTrim)
  ) {
    return 6;
  }
  if (
    /^(VI|VII)\.\s*Laboratories/i.test(aTrim) ||
    /RCW Laboratory|Classrooms must be equipped|For lecture classes|Special lectures w\/ class size/i.test(aTrim)
  ) {
    return 7;
  }
  if (
    /^(VII|VIII)\.\s*Admission/i.test(aTrim) ||
    /a\.\s*Admission|b\.\s*Retention|c\.\s*Residency Requirement|Admission Requirement/i.test(aTrim)
  ) {
    return 8;
  }
  if (/^IX\.\s*Research/i.test(aTrim)) return 9;
  if (
    /^(VIII|X)\.\s*(Other PSG|Complii?ance with OBE)/i.test(aTrim) ||
    /OBE Requirement|HEI-Industry Partnership/i.test(aTrim)
  ) {
    return 10;
  }

  if (/Subscription to at least two \(2\) peer-reviewed|titles of graduate reference books/i.test(combined)) {
    return 6;
  }
  return currentAreaId;
}

function isGenericEvidenceLabel(label: string): boolean {
  const t = label.trim();
  if (!t) return true;
  if (/^https?:\/\//i.test(t)) return true;
  if (/^(view evidence file|attached smart chips?|smart chip|supporting document|evidence file\s*\d*|evidences?|see evidences?( here)?:?|link|here)$/i.test(t)) {
    return true;
  }
  if (/^(\d+[.)]|[a-z][.)]|[-•])$/i.test(t)) {
    return true;
  }
  return false;
}

function normalizeEvidenceUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\.$/, '');
  if (trimmed === 'https://drive.google.com/drive/folders/1W3o') {
    return 'https://drive.google.com/drive/folders/1W3oExlYq5X651XKdmXEPg5qzFRrtqo1O?usp=drive_link';
  }
  if (trimmed === 'https://docs.google.com/document/d/17DvJ83_s_HdhhjZtcZPACWmeYe3ydzA') {
    return 'https://docs.google.com/document/d/17DvJ83_s_HdhhjZtcZPACWmeYe3ydzAh/edit';
  }
  return trimmed;
}

function extractCandidateFileLabelsFromText(actualText: string): string[] {
  if (!actualText) return [];
  const candidates: string[] = [];
  const lines = actualText
    .split(/\r?\n/)
    .map((l) =>
      l
        .replace(/https?:\/\/[^\s)]+/gi, '')
        .replace(/^(?:See\s+)?(?:Area\s+[IVX]+\s+)?Evidences?\s*(?:here)?:?\s*/i, '')
        .trim()
    )
    .filter(Boolean);

  for (const line of lines) {
    // 1. Explicit file names (.pdf, .docx, .jpg, .png, .jfif, .xlsx)
    const fileMatch = line.match(/([^\n\r:]+\.(?:pdf|docx?|xlsx?|pptx?|jpg|jpeg|png|jfif))/i);
    if (fileMatch) {
      const cleaned = fileMatch[1]
        .replace(/^(?:[a-z0-9]+[.)]|[-•])\s*/i, '')
        .trim();
      if (cleaned && !candidates.includes(cleaned)) {
        candidates.push(cleaned);
        continue;
      }
    }

    // 2. Labeled credential/designation lines (e.g. "Credentials: TORMES_EMELYN_DACOL")
    const kvMatch = line.match(/^(?:[a-z0-9]+[.)]\s*)?(Credentials|PRC(?:\s*ID)?|Designation)\s*:\s*(.+)$/i);
    if (kvMatch && kvMatch[2].trim()) {
      const val = kvMatch[2].trim();
      if (!candidates.includes(val)) {
        candidates.push(val);
        continue;
      }
    }

    // 3. Short standalone title lines (when cell only contains a folder/chip name like "2 RCW Policies")
    if (
      lines.length <= 2 &&
      line.length <= 90 &&
      !/^[-•]\s*(no\s+copc|to\s+secure|may\s+use|check\s+with|c\/o\s+)/i.test(line)
    ) {
      const cleaned = line.replace(/^(?:[a-z0-9]+[.)]|[-•])\s*/i, '').trim();
      if (cleaned && !candidates.includes(cleaned)) {
        candidates.push(cleaned);
      }
    }
  }

  return candidates;
}

function extractEvidencesForRow(
  row: ProgrammaticDbRow,
  dbEvidences: ProgrammaticEvidenceDbRow[]
): ProgramEvidenceItem[] {
  const results: ProgramEvidenceItem[] = [];
  const seenUrls = new Set<string>();

  // Re-join any URL broken across lines by newline characters in actual_situation
  const actualText = (row.actual_situation || '').replace(
    /(https?:\/\/[^\s)\r\n]+)\r?\n([A-Za-z0-9_\-?=&#/]+)/g,
    '$1$2'
  );
  const lines = actualText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const urlToInlineLabel = new Map<string, string>();
  lines.forEach((line, idx) => {
    const matches = line.match(/https?:\/\/[^\s)]+/gi);
    if (matches) {
      const textWithoutUrl = line
        .replace(/https?:\/\/[^\s)]+/gi, '')
        .replace(/^(?:See\s+)?Evidences?\s*(?:here)?:?\s*/i, '')
        .replace(/^[:\-\s]+|[:\-\s]+$/g, '')
        .trim();
      const prevLine =
        idx > 0 && !/https?:\/\//i.test(lines[idx - 1])
          ? lines[idx - 1].replace(/^(?:See\s+)?Evidences?\s*(?:here)?:?\s*/i, '').trim()
          : '';
      const bestLabel =
        textWithoutUrl && !isGenericEvidenceLabel(textWithoutUrl)
          ? textWithoutUrl
          : prevLine && !isGenericEvidenceLabel(prevLine)
          ? prevLine
          : '';
      matches.forEach((rawUrl) => {
        const splitUrls = rawUrl.split(/(?=https?:\/\/)/g);
        splitUrls.forEach((u) => {
          const cleanU = normalizeEvidenceUrl(u);
          if (cleanU && bestLabel) {
            urlToInlineLabel.set(cleanU, bestLabel);
          }
        });
      });
    }
  });

  const candidateTextLabels = extractCandidateFileLabelsFromText(actualText);
  let candidateCursor = 0;

  const addUrl = (
    rawUrl: string,
    candidateLabel: string,
    columnSource: string | null,
    indexHint: number
  ) => {
    const parts = rawUrl.split(/(?=https?:\/\/)/g);
    parts.forEach((part) => {
      const cleanUrl = normalizeEvidenceUrl(part);
      if (!cleanUrl.startsWith('http')) return;
      if (seenUrls.has(cleanUrl)) return;
      seenUrls.add(cleanUrl);

      let label = candidateLabel
        .replace(/https?:\/\/[^\s)]+/gi, '')
        .replace(/^(?:See\s+)?Evidences?\s*(?:here)?:?\s*/i, '')
        .replace(/^[:\-\s]+|[:\-\s]+$/g, '')
        .trim();

      if (isGenericEvidenceLabel(label)) {
        const resolvedDriveTitle = lookupDriveLinkTitle(cleanUrl);
        if (resolvedDriveTitle && !isGenericEvidenceLabel(resolvedDriveTitle)) {
          label = resolvedDriveTitle;
        } else if (urlToInlineLabel.get(cleanUrl)) {
          label = urlToInlineLabel.get(cleanUrl)!;
        } else if (candidateCursor < candidateTextLabels.length) {
          label = candidateTextLabels[candidateCursor++];
        } else {
          label = `Evidence Document ${indexHint}`;
        }
      }

      results.push({
        id: `${row.id}-ev-${results.length + 1}`,
        label,
        columnSource,
        driveLink: cleanUrl
      });
    });
  };

  dbEvidences.forEach((ev, idx) => {
    if (ev.drive_link) {
      addUrl(ev.drive_link, ev.evidence_text || '', ev.column_source || null, idx + 1);
    }
  });

  const inlineUrls = actualText.match(/https?:\/\/[^\s)]+/gi) || [];
  inlineUrls.forEach((u, idx) => {
    addUrl(u, urlToInlineLabel.get(normalizeEvidenceUrl(u)) || '', 'Actual Situation', idx + 1);
  });

  // Fallback for MS Agriculture Row 10 ("a. BRN for PhD Agri") where the sheet hyperlink was not in programmatic_evidences
  if (
    results.length === 0 &&
    (row.id === 'Dumingag_MS Agri_10' || row.id === 'Dumingag_MS Crim_10') &&
    /BRN for PhD Agri/i.test(actualText)
  ) {
    results.push({
      id: `${row.id}-ev-1`,
      label: 'a. BRN for PhD Agri (Board Resolution No. 78, s. 2026)',
      columnSource: 'Actual Situation',
      driveLink: 'https://drive.google.com/file/d/1CRW8fMH_ZGoHTTTJpr3JVAal4OICRwyQ/view?usp=drive_link'
    });
  }

  return results;
}

function stripRedundantEvidenceFilenamesFromActual(
  cleanActual: string,
  evidences: ProgramEvidenceItem[]
): string {
  if (!cleanActual || evidences.length === 0) return cleanActual;

  const normalizeForCompare = (s: string) =>
    s
      .toLowerCase()
      .replace(/^(?:see\s+)?(?:area\s+[ivx]+\s+)?evidences?\s*(?:here)?:?\s*/i, '')
      .replace(/^(?:[a-z0-9]+[.)]|[-•])\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();

  const evidenceLabelSet = new Set<string>();
  evidences.forEach((ev) => {
    const norm = normalizeForCompare(ev.label);
    if (norm) {
      evidenceLabelSet.add(norm);
      // Also match without file extension if needed
      const withoutExt = norm.replace(/\.(pdf|docx?|xlsx?|pptx?|jpg|jpeg|png|jfif)$/i, '').trim();
      if (withoutExt) evidenceLabelSet.add(withoutExt);
    }
  });

  const rawLines = cleanActual.split(/\r?\n/);
  const keptLines = rawLines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    if (/^(?:see\s+)?(?:area\s+[ivx]+\s+)?evidences?\s*(?:here)?:?$/i.test(trimmed)) {
      return false;
    }
    const normLine = normalizeForCompare(trimmed);
    if (!normLine) return false;
    if (evidenceLabelSet.has(normLine)) {
      return false;
    }
    const normLineNoExt = normLine.replace(/\.(pdf|docx?|xlsx?|pptx?|jpg|jpeg|png|jfif)$/i, '').trim();
    if (normLineNoExt && evidenceLabelSet.has(normLineNoExt) && /\.(pdf|docx?|xlsx?|pptx?|jpg|jpeg|png|jfif)$/i.test(normLine)) {
      return false;
    }
    return true;
  });

  return keptLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildProgramSheetsFromDb(
  formRows: ProgrammaticDbRow[],
  evidenceRows: ProgrammaticEvidenceDbRow[]
): ProgramSheetData[] {
  const evidencesByParent = new Map<string, ProgrammaticEvidenceDbRow[]>();
  evidenceRows.forEach((ev) => {
    if (!ev.parent_id) return;
    const list = evidencesByParent.get(ev.parent_id) || [];
    list.push(ev);
    evidencesByParent.set(ev.parent_id, list);
  });

  const rowsBySheet = new Map<string, ProgrammaticDbRow[]>();
  formRows.forEach((r) => {
    if (!r.sheet_name) return;
    const list = rowsBySheet.get(r.sheet_name) || [];
    list.push(r);
    rowsBySheet.set(r.sheet_name, list);
  });

  const sheets: ProgramSheetData[] = [];

  Array.from(rowsBySheet.entries()).forEach(([sheetName, rawSheetRows]) => {
    const sortedRows = [...rawSheetRows].sort((a, b) => a.row_number - b.row_number);
    if (sortedRows.length === 0) return;

    const firstWithCampus = sortedRows.find((r) => r.campus && r.campus.trim() !== '');
    const firstWithProgName = sortedRows.find((r) => r.program_name && r.program_name.trim() !== '');
    const firstWithSheetLink = sortedRows.find((r) => r.sheet_link && r.sheet_link.trim() !== '');

    const meta = resolveSheetMetadata(
      sheetName,
      firstWithCampus?.campus || null,
      firstWithProgName?.program_name || null
    );

    let currentAreaId = 1;
    const parsedRows: ProgramComplianceRowItem[] = [];

    sortedRows.forEach((row) => {
      const areaText = (row.area_of_compliance || '').trim();
      const psgText = (row.psg_requirement || '').trim();
      const actualText = (row.actual_situation || '').trim();
      const statusText = (row.status || '').trim();
      const remarksText = (row.chedro_remarks || '').trim();

      currentAreaId = detectAreaId(areaText, psgText, row.row_number, currentAreaId);
      const rowEvidences = extractEvidencesForRow(row, evidencesByParent.get(row.id) || []);

      if (
        !areaText &&
        !psgText &&
        !actualText &&
        (!statusText || statusText === 'null') &&
        !remarksText &&
        rowEvidences.length === 0
      ) {
        return;
      }

      const normStatus = normalizeStatus(row.status);
      let cleanSubTitle = areaText
        .replace(/^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s*/i, '')
        .replace(/\(Please refer to the specific requirements per PSG\)/gi, '')
        .trim();

      let cleanPsg = formatDatabaseCellText(psgText, areaText);
      const rawCleanActual = formatDatabaseCellText(actualText, areaText);
      const cleanActual = stripRedundantEvidenceFilenamesFromActual(rawCleanActual, rowEvidences);

      // In Area I and Area IX, if `psg_requirement` is empty in the sheet because the requirement description
      // was written inside Column A (`area_of_compliance`), extract that description into `cleanPsg`
      if (!cleanPsg && /^IX\.\s*Research/i.test(areaText)) {
        const desc = areaText.replace(/^IX\.\s*Research\s*/i, '').trim();
        if (desc) {
          cleanPsg = desc;
          cleanSubTitle = 'Research';
        }
      } else if (!cleanPsg && /^I\.\s*Authority to Operate/i.test(areaText)) {
        const desc = areaText.replace(/^I\.\s*Authority to Operate:?\s*/i, '').trim();
        if (desc) {
          cleanPsg = desc;
          cleanSubTitle = 'Authority to Operate';
        }
      }

      parsedRows.push({
        id: row.id,
        rowNumber: row.row_number,
        areaId: currentAreaId,
        subTitle: cleanSubTitle || areaText,
        rawArea: areaText,
        psgRequirement: psgText,
        cleanPsgRequirement: cleanPsg,
        actualSituation: actualText,
        cleanActualSituation: cleanActual,
        status: statusText || null,
        statusCategory: normStatus.category,
        statusLabel: normStatus.label,
        remarks: remarksText || null,
        evidences: rowEvidences
      });
    });

    const areas: ProgramAreaGroup[] = [];

    AREA_DEFINITIONS.forEach((areaDef) => {
      const rawAreaRows = parsedRows.filter((r) => r.areaId === areaDef.id);
      if (rawAreaRows.length === 0) return;

      // Filter out pure section-header rows when that same area has sub-rows
      const filteredAreaRows =
        rawAreaRows.length > 1
          ? rawAreaRows.filter((r) => {
              const isBlankHeader =
                !r.cleanPsgRequirement &&
                !r.cleanActualSituation &&
                (!r.status || r.status.toLowerCase() === 'null') &&
                !r.remarks &&
                r.evidences.length === 0;
              return !isBlankHeader;
            })
          : rawAreaRows;

      const finalRows = filteredAreaRows.length > 0 ? filteredAreaRows : rawAreaRows;

      // For multi-row areas, only count rows that actually have a status (or all rows if none have status)
      // so a parent overview paragraph with status=null doesn't falsely add "1 Pending"
      const rowsWithExplicitStatus = finalRows.filter(
        (r) => r.status && r.status.toLowerCase() !== 'null'
      );
      const statusBasis = rowsWithExplicitStatus.length > 0 ? rowsWithExplicitStatus : finalRows;

      const compliedCount = statusBasis.filter((r) => r.statusCategory === 'complied').length;
      const notCompliedCount = statusBasis.filter((r) => r.statusCategory === 'not_complied').length;
      const pendingCount = statusBasis.filter((r) => r.statusCategory === 'pending').length;

      let overallStatus: 'complied' | 'not_complied' | 'pending' = 'pending';
      if (notCompliedCount > 0) {
        overallStatus = 'not_complied';
      } else if (compliedCount > 0) {
        overallStatus = 'complied';
      }

      areas.push({
        areaId: areaDef.id,
        roman: areaDef.roman,
        title: areaDef.defaultTitle,
        rows: finalRows,
        compliedCount,
        notCompliedCount,
        pendingCount,
        overallStatus
      });
    });

    const allPsgText = parsedRows.map((r) => `${r.psgRequirement} ${r.actualSituation}`).join(' ');
    const cmoMatch = allPsgText.match(/CMO\s*No\.?\s*\d+\s*,?\s*(?:s\.|series of)\s*\d{4}/i);
    const unitsMatch = allPsgText.match(/\b(\d{2,3})\s*units\b/i);
    let cmoSubtitle = '';
    if (cmoMatch && unitsMatch) {
      cmoSubtitle = `${cmoMatch[0]} · ${unitsMatch[1]} units`;
    } else if (cmoMatch) {
      cmoSubtitle = cmoMatch[0];
    }

    const areasCompliedCount = areas.filter((a) => a.overallStatus === 'complied').length;
    const areasNotCompliedCount = areas.filter((a) => a.overallStatus === 'not_complied').length;
    const areasPendingCount = areas.filter((a) => a.overallStatus === 'pending').length;

    sheets.push({
      sheetName,
      sheetLink: firstWithSheetLink?.sheet_link?.trim() || null,
      code: meta.code,
      shortBadge: meta.shortBadge,
      programName: meta.programName,
      sidebarTitle: meta.sidebarTitle,
      cmoSubtitle,
      dbCampus: firstWithCampus?.campus || null,
      campus: meta.campus,
      level: meta.level,
      areas,
      allRows: parsedRows,
      areasCompliedCount,
      areasNotCompliedCount,
      areasPendingCount
    });
  });

  const levelRank: Record<DegreeLevel, number> = {
    Doctoral: 1,
    Masters: 2,
    Bachelor: 3
  };
  sheets.sort((a, b) => {
    if (levelRank[a.level] !== levelRank[b.level]) {
      return levelRank[a.level] - levelRank[b.level];
    }
    return a.sidebarTitle.localeCompare(b.sidebarTitle);
  });

  return sheets;
}

export async function preloadProgramsData(forceRefresh = false): Promise<ProgramSheetData[] | null> {
  if (!forceRefresh && cachedProgramsList) return cachedProgramsList;
  if (!forceRefresh && prefetchProgramsPromise) return prefetchProgramsPromise;

  prefetchProgramsPromise = (async () => {
    try {
      const client = getSupabaseClient();
      if (!client) return null;

      const [formsPage1, formsPage2, evPage1, evPage2] = await Promise.all([
        client
          .from('programmatic_forms')
          .select('*')
          .order('id', { ascending: true })
          .range(0, 999),
        client
          .from('programmatic_forms')
          .select('*')
          .order('id', { ascending: true })
          .range(1000, 2999),
        client
          .from('programmatic_evidences')
          .select('*')
          .order('id', { ascending: true })
          .range(0, 999),
        client
          .from('programmatic_evidences')
          .select('*')
          .order('id', { ascending: true })
          .range(1000, 2999)
      ]);

      if (formsPage1.error || !formsPage1.data) return null;

      const allFormRows = [
        ...(formsPage1.data as ProgrammaticDbRow[]),
        ...((formsPage2.data || []) as ProgrammaticDbRow[])
      ];

      const allEvidenceRows = [
        ...((evPage1.data || []) as ProgrammaticEvidenceDbRow[]),
        ...((evPage2.data || []) as ProgrammaticEvidenceDbRow[])
      ];

      const built = buildProgramSheetsFromDb(allFormRows, allEvidenceRows);
      cachedProgramsList = built;
      return built;
    } catch {
      return null;
    } finally {
      prefetchProgramsPromise = null;
    }
  })();

  return prefetchProgramsPromise;
}

interface ProgramsPageProps {
  initialCampus?: string;
}

export const ProgramsPage: React.FC<ProgramsPageProps> = ({ initialCampus }) => {
  const [programs, setPrograms] = useState<ProgramSheetData[]>(() => cachedProgramsList || []);
  const [loading, setLoading] = useState<boolean>(() => !cachedProgramsList);
  const [error, setError] = useState<string | null>(null);

  const [openCampuses, setOpenCampuses] = useState<Record<CampusId, boolean>>({
    'Main Campus': true,
    'Dumingag Campus': false,
    'Pagadian Campus': false,
    'CMSE Campus': false
  });

  const [activeSheetName, setActiveSheetName] = useState<string>('Main_BSA');
  const [sidebarSearch, setSidebarSearch] = useState<string>('');
  const [areaStatusFilter, setAreaStatusFilter] = useState<AreaStatusFilter>('all');
  const [expandedAreaIds, setExpandedAreaIds] = useState<Record<number, boolean>>({ 1: true });

  useEffect(() => {
    if (!initialCampus) return;
    const norm = initialCampus.toLowerCase();
    let targetCampus: CampusId = 'Main Campus';
    if (norm.includes('pagadian')) targetCampus = 'Pagadian Campus';
    else if (norm.includes('dumingag')) targetCampus = 'Dumingag Campus';
    else if (norm.includes('cmse') || norm.includes('lakewood')) targetCampus = 'CMSE Campus';

    setOpenCampuses({
      'Main Campus': targetCampus === 'Main Campus',
      'Dumingag Campus': targetCampus === 'Dumingag Campus',
      'Pagadian Campus': targetCampus === 'Pagadian Campus',
      'CMSE Campus': targetCampus === 'CMSE Campus'
    });

    const firstInCampus = programs.find((p) => p.campus === targetCampus);
    if (firstInCampus) {
      setActiveSheetName(firstInCampus.sheetName);
    }
  }, [initialCampus, programs]);

  const loadProgramsFromSupabase = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await preloadProgramsData(force);
      if (data && data.length > 0) {
        setPrograms(data);
      } else {
        setError('Unable to load records from programmatic_forms and programmatic_evidences.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load programmatic compliance forms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgramsFromSupabase(false);
  }, []);

  const currentProgram = useMemo(() => {
    if (programs.length === 0) return null;
    return programs.find((p) => p.sheetName === activeSheetName) || programs[0];
  }, [programs, activeSheetName]);

  const displayedAreas = useMemo(() => {
    if (!currentProgram) return [];
    if (areaStatusFilter === 'all') return currentProgram.areas;
    return currentProgram.areas.filter((a) => a.overallStatus === areaStatusFilter);
  }, [currentProgram, areaStatusFilter]);

  const handleSelectProgram = (prog: ProgramSheetData) => {
    setActiveSheetName(prog.sheetName);
    setAreaStatusFilter('all');
    setOpenCampuses((prev) => ({
      ...prev,
      [prog.campus]: true
    }));
    const firstAttentionArea =
      prog.areas.find(
        (a) => a.overallStatus === 'not_complied' || a.rows.some((r) => Boolean(r.remarks))
      ) || prog.areas[0];
    setExpandedAreaIds(firstAttentionArea ? { [firstAttentionArea.areaId]: true } : { 1: true });
  };

  const toggleCampusGroup = (campusId: CampusId) => {
    setOpenCampuses((prev) => ({
      ...prev,
      [campusId]: !prev[campusId]
    }));
  };

  const toggleAreaAccordion = (areaId: number) => {
    setExpandedAreaIds((prev) => ({
      ...prev,
      [areaId]: !prev[areaId]
    }));
  };

  const allAreasExpanded = useMemo(() => {
    if (displayedAreas.length === 0) return false;
    return displayedAreas.every((a) => Boolean(expandedAreaIds[a.areaId]));
  }, [displayedAreas, expandedAreaIds]);

  const handleToggleExpandAll = () => {
    if (allAreasExpanded) {
      setExpandedAreaIds({});
    } else {
      const next: Record<number, boolean> = {};
      displayedAreas.forEach((a) => {
        next[a.areaId] = true;
      });
      setExpandedAreaIds(next);
    }
  };

  const handleFilterByTile = (targetFilter: AreaStatusFilter) => {
    const nextFilter = areaStatusFilter === targetFilter ? 'all' : targetFilter;
    setAreaStatusFilter(nextFilter);
    if (nextFilter !== 'all' && currentProgram) {
      const matching: Record<number, boolean> = {};
      currentProgram.areas
        .filter((a) => a.overallStatus === nextFilter)
        .forEach((a) => {
          matching[a.areaId] = true;
        });
      setExpandedAreaIds(matching);
    }
  };

  const renderStatusText = (
    category: 'complied' | 'not_complied' | 'pending',
    customLabel?: string
  ) => {
    if (category === 'complied') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-[#E6F5EC] border border-[#B2DFC2] text-[#0B7A3B] whitespace-nowrap shrink-0 tabular-nums">
          {customLabel || 'Complied'}
        </span>
      );
    }
    if (category === 'not_complied') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-[#FDF2F2] border border-[#F3C1BF] text-[#C81E1E] whitespace-nowrap shrink-0 tabular-nums">
          {customLabel || 'Not Complied'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-[#F1F5F9] border border-[#CBD5E1] text-[#475569] whitespace-nowrap shrink-0 tabular-nums">
        {customLabel || 'Pending'}
      </span>
    );
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#F4F6F1] flex flex-col lg:flex-row items-start font-sans">
      {/* ======================================================================= */}
      {/* LEFT SIDEBAR (280px wide, Sticky on Desktop)                            */}
      {/* ======================================================================= */}
      <aside className="w-full lg:w-[280px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-[#DCE3D9] lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] flex flex-col">
        <div className="px-5 pt-5 pb-4 bg-[#0E3322] text-[#F5F2E6] border-b border-[#1E4D2B]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#E8AE1F]">
            Choose Campus &amp; Program
          </div>

          <div className="relative mt-2.5">
            <Search className="w-3.5 h-3.5 text-[#F5F2E6]/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search program or code..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-white/20 bg-[#1E4D2B]/70 text-xs text-white placeholder-[#F5F2E6]/60 focus:outline-none focus:bg-[#1E4D2B] focus:border-[#E8AE1F]"
            />
            {sidebarSearch && (
              <button
                type="button"
                onClick={() => setSidebarSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#F5F2E6]/70 hover:text-white cursor-pointer"
                aria-label="Clear filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Campus Groups */}
        <div className="flex-1 overflow-y-auto py-1.5 divide-y divide-[#EEF1EB]">
          {CAMPUS_GROUPS.map((campusGroup) => {
            const q = sidebarSearch.trim().toLowerCase();
            const campusProgs = programs.filter((p) => {
              if (p.campus !== campusGroup.id) return false;
              if (!q) return true;
              return (
                p.programName.toLowerCase().includes(q) ||
                p.sidebarTitle.toLowerCase().includes(q) ||
                p.code.toLowerCase().includes(q) ||
                p.sheetName.toLowerCase().includes(q)
              );
            });

            const isOpen = q ? campusProgs.length > 0 : openCampuses[campusGroup.id];
            const hasSelectedProgram = currentProgram?.campus === campusGroup.id;

            const doctoralProgs = campusProgs.filter((p) => p.level === 'Doctoral');
            const mastersProgs = campusProgs.filter((p) => p.level === 'Masters');
            const bachelorProgs = campusProgs.filter((p) => p.level === 'Bachelor');

            const renderProgramButton = (prog: ProgramSheetData) => {
              const isSelected = currentProgram?.sheetName === prog.sheetName;
              return (
                <button
                  key={prog.sheetName}
                  type="button"
                  onClick={() => handleSelectProgram(prog)}
                  className={`w-full text-left px-3.5 py-2 rounded-xl transition-colors cursor-pointer block ${
                    isSelected
                      ? 'bg-[#0E3322] text-white shadow-2xs'
                      : 'hover:bg-[#F4F6F1] text-[#1E293B]'
                  }`}
                >
                  <div
                    className={`text-[13px] leading-snug ${
                      isSelected ? 'font-bold text-white' : 'font-medium text-[#15221A]'
                    }`}
                  >
                    {prog.sidebarTitle}
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      isSelected ? 'font-semibold text-[#E8AE1F]' : 'text-[#64748B]'
                    }`}
                  >
                    {prog.code}
                  </div>
                </button>
              );
            };

            return (
              <div key={campusGroup.id} className="py-1 px-2">
                {/* Campus Header */}
                <button
                  type="button"
                  onClick={() => toggleCampusGroup(campusGroup.id)}
                  className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                    hasSelectedProgram
                      ? 'bg-[#F4F6F1] text-[#0E3322]'
                      : 'hover:bg-[#FAFBF9] text-[#0E3322]'
                  }`}
                >
                  <span className="text-[13.5px] font-extrabold text-[#0E3322] truncate">
                    {campusGroup.label}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold text-[#1E4D2B] tabular-nums">
                      {campusProgs.length}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#1E4D2B] shrink-0 transition-transform duration-150 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Collapsible Programs List under Doctoral / Master's / Bachelor's */}
                {isOpen && (
                  <div className="pt-1 pb-2 px-1 space-y-2.5">
                    {doctoralProgs.length > 0 && (
                      <div className="space-y-0.5">
                        <div className="px-3 pt-2 pb-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[#1E4D2B]">
                          Doctoral
                        </div>
                        {doctoralProgs.map(renderProgramButton)}
                      </div>
                    )}

                    {mastersProgs.length > 0 && (
                      <div className="space-y-0.5">
                        <div className="px-3 pt-2 pb-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[#1E4D2B]">
                          Master&apos;s
                        </div>
                        {mastersProgs.map(renderProgramButton)}
                      </div>
                    )}

                    {bachelorProgs.length > 0 && (
                      <div className="space-y-0.5">
                        <div className="px-3 pt-2 pb-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[#1E4D2B]">
                          Bachelor&apos;s
                        </div>
                        {bachelorProgs.map(renderProgramButton)}
                      </div>
                    )}

                    {campusProgs.length === 0 && (
                      <div className="px-3 py-2 text-xs text-[#64748B]">
                        No matching programs
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ======================================================================= */}
      {/* RIGHT MAIN PANEL: Single Program View                                   */}
      {/* ======================================================================= */}
      <main className="flex-1 min-w-0 p-5 sm:p-8 lg:p-10">
        <div className="max-w-[1040px] mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => loadProgramsFromSupabase(true)}
                className="inline-flex items-center gap-1.5 underline font-semibold text-[#1E4D2B] cursor-pointer whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {loading && !currentProgram ? (
            <div className="bg-white border border-[#DCE3D9] rounded-xl p-12 text-center text-sm text-[#56635A]">
              Loading programmatic compliance records...
            </div>
          ) : currentProgram ? (
            <>
              {/* 1. JHCSC PINE & GOLD PROGRAM HEADER BANNER */}
              <div className="bg-[#0E3322] text-[#F5F2E6] border-t-4 border-[#E8AE1F] rounded-2xl p-6 sm:p-7 shadow-[0_8px_24px_rgba(14,51,34,0.12)]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* Brand Metadata Line */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#F5F2E6]/85">
                      <span className="font-bold text-[#E8AE1F] uppercase tracking-wider">
                        {currentProgram.campus}
                      </span>
                      <span aria-hidden="true" className="text-[#F5F2E6]/40">
                        ·
                      </span>
                      <span>
                        {currentProgram.level === 'Bachelor'
                          ? "Bachelor's Degree"
                          : currentProgram.level === 'Masters'
                          ? "Master's Degree"
                          : 'Doctoral Degree'}
                      </span>
                      <span aria-hidden="true" className="text-[#F5F2E6]/40">
                        ·
                      </span>
                      <span className="font-semibold text-[#F5F2E6]">{currentProgram.code}</span>
                      {currentProgram.cmoSubtitle && (
                        <>
                          <span aria-hidden="true" className="text-[#F5F2E6]/40">
                            ·
                          </span>
                          <span className="text-[#F5F2E6]/90">{currentProgram.cmoSubtitle}</span>
                        </>
                      )}
                    </div>

                    <h1 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold text-[#F5F2E6] leading-snug mt-2 text-balance">
                      {currentProgram.programName}
                    </h1>
                  </div>

                  {/* View Spreadsheet Action at Top Right */}
                  <div className="shrink-0">
                    {(() => {
                      const sheetUrl =
                        currentProgram.sheetLink ||
                        PROGRAM_SPREADSHEET_LINKS[currentProgram.sheetName] ||
                        DEFAULT_PROGRAMMATIC_SPREADSHEET_LINK;
                      return sheetUrl ? (
                        <a
                          href={sheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#E8AE1F] hover:bg-[#f2ba2b] text-xs font-extrabold text-[#0E3322] transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
                        >
                          <span>View spreadsheet</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-xs font-semibold text-[#F5F2E6]/70 cursor-default whitespace-nowrap shrink-0"
                          title="Spreadsheet link not available"
                        >
                          <span>View spreadsheet</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* 2. THREE INTERACTIVE SUMMARY STAT TILES (Complied / Not Complied / Pending) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {/* Complied Filter Button */}
                <button
                  type="button"
                  onClick={() => handleFilterByTile('complied')}
                  className={`bg-white px-5 py-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    areaStatusFilter === 'complied'
                      ? 'border-[#0B7A3B] bg-[#F2FAF5] shadow-xs'
                      : 'border-[#DCE3D9] hover:border-[#0B7A3B]/50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#1E4D2B]">
                      Areas complied
                    </div>
                    <div className="text-[11px] text-[#56635A] mt-0.5">
                      Meets CHED PSG standards
                    </div>
                  </div>
                  <span className="text-3xl font-extrabold text-[#0B7A3B] tabular-nums">
                    {currentProgram.areasCompliedCount}
                  </span>
                </button>

                {/* Not Complied Filter Button */}
                <button
                  type="button"
                  onClick={() => handleFilterByTile('not_complied')}
                  className={`bg-white px-5 py-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    areaStatusFilter === 'not_complied'
                      ? 'border-[#C81E1E] bg-[#FDF5F5] shadow-xs'
                      : 'border-[#DCE3D9] hover:border-[#C81E1E]/50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#991B1B]">
                      Not yet complied
                    </div>
                    <div className="text-[11px] text-[#56635A] mt-0.5">
                      Requires action or deficiency fix
                    </div>
                  </div>
                  <span className="text-3xl font-extrabold text-[#C81E1E] tabular-nums">
                    {currentProgram.areasNotCompliedCount}
                  </span>
                </button>

                {/* Pending Filter Button */}
                <button
                  type="button"
                  onClick={() => handleFilterByTile('pending')}
                  className={`bg-white px-5 py-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    areaStatusFilter === 'pending'
                      ? 'border-[#475569] bg-[#F1F5F9] shadow-xs'
                      : 'border-[#DCE3D9] hover:border-[#475569]/50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                      Pending / no data
                    </div>
                    <div className="text-[11px] text-[#56635A] mt-0.5">
                      Awaiting evaluation entry
                    </div>
                  </div>
                  <span className="text-3xl font-extrabold text-[#475569] tabular-nums">
                    {currentProgram.areasPendingCount}
                  </span>
                </button>
              </div>

              {/* 3. SECTION HEADER: Compliance Areas + Expand/Collapse All */}
              <div className="flex items-center justify-between gap-3 mt-7 mb-3.5">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#0E3322] shrink-0">
                    {areaStatusFilter === 'all'
                      ? `${currentProgram.areas.length} Compliance Areas`
                      : `Filtered: ${displayedAreas.length} of ${currentProgram.areas.length} Areas`}
                  </h2>
                  <div className="flex-1 border-b border-[#DCE3D9]" />
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {areaStatusFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setAreaStatusFilter('all')}
                      className="text-xs font-bold text-[#1E4D2B] hover:underline cursor-pointer whitespace-nowrap"
                    >
                      Show all {currentProgram.areas.length} areas
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleToggleExpandAll}
                    className="text-xs font-bold text-[#1E4D2B] hover:text-[#0E3322] underline-offset-2 hover:underline cursor-pointer whitespace-nowrap"
                  >
                    {allAreasExpanded ? 'Collapse all' : 'Expand all'}
                  </button>
                </div>
              </div>

              {/* 4. ACCORDION LIST OF COMPLIANCE AREAS (I – X) */}
              {displayedAreas.length > 0 ? (
                <div className="space-y-3">
                  {displayedAreas.map((area) => {
                    const isExpanded = Boolean(expandedAreaIds[area.areaId]);
                    const hasMixedSubStatuses =
                      area.rows.length > 1 &&
                      ((area.compliedCount > 0 && area.notCompliedCount > 0) ||
                        (area.compliedCount > 0 && area.pendingCount > 0) ||
                        (area.notCompliedCount > 0 && area.pendingCount > 0));

                    return (
                      <div
                        key={`${currentProgram.sheetName}-area-${area.areaId}`}
                        className="bg-white border border-[#DCE3D9] rounded-xl overflow-hidden transition-colors"
                      >
                        {/* Accordion Header Row */}
                        <button
                          type="button"
                          onClick={() => toggleAreaAccordion(area.areaId)}
                          className={`w-full px-5 py-4 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer ${
                            isExpanded ? 'bg-[#F7F9F5]' : 'hover:bg-[#FAFBF9]'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span className="w-8 h-8 rounded-lg bg-[#0E3322] text-[#E8AE1F] font-extrabold text-xs flex items-center justify-center shrink-0 tabular-nums">
                              {area.roman}
                            </span>
                            <span className="text-sm sm:text-[15px] font-bold text-[#0E3322] leading-snug">
                              {area.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {hasMixedSubStatuses ? (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {area.compliedCount > 0 &&
                                  renderStatusText('complied', `${area.compliedCount} Complied`)}
                                {area.notCompliedCount > 0 &&
                                  renderStatusText(
                                    'not_complied',
                                    `${area.notCompliedCount} Not Complied`
                                  )}
                                {area.pendingCount > 0 &&
                                  area.notCompliedCount === 0 &&
                                  renderStatusText('pending', `${area.pendingCount} Pending`)}
                              </div>
                            ) : (
                              renderStatusText(area.overallStatus)
                            )}
                            <ChevronDown
                              className={`w-4 h-4 text-[#56635A] transition-transform duration-150 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>

                        {/* Expanded Accordion Content */}
                        {isExpanded && (
                          <div className="divide-y divide-[#E5E9E2] border-t border-[#DCE3D9] bg-white">
                            {area.rows.map((row, rowIdx) => {
                              const prevRow = rowIdx > 0 ? area.rows[rowIdx - 1] : null;
                              const isSameTitleAsArea =
                                row.subTitle.toLowerCase() === area.title.toLowerCase() ||
                                area.title.toLowerCase().startsWith(row.subTitle.toLowerCase());
                              const isSameTitleAsPrev =
                                prevRow &&
                                prevRow.subTitle.toLowerCase() === row.subTitle.toLowerCase();

                              const showSubHeader =
                                area.rows.length > 1 &&
                                Boolean(row.subTitle) &&
                                !isSameTitleAsArea &&
                                !isSameTitleAsPrev;

                              return (
                                <div key={row.id}>
                                  {/* Sub-row header strip for multi-item areas */}
                                  {showSubHeader && (
                                    <div className="px-6 py-2.5 bg-[#F4F6F1] border-b border-[#E5E9E2] flex items-center justify-between gap-3">
                                      <div className="text-xs sm:text-[13.5px] font-bold text-[#0E3322]">
                                        {row.subTitle}
                                      </div>
                                      {row.status && renderStatusText(row.statusCategory)}
                                    </div>
                                  )}

                                  {/* 2-Column PSG Requirement & Actual Situation */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-[#E5E9E2]">
                                    {/* Left Column: PSG REQUIREMENT */}
                                    <div className="p-6">
                                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#1E4D2B] mb-2">
                                        PSG Requirement
                                      </div>
                                      <p className="text-sm text-[#15221A] leading-relaxed whitespace-pre-line">
                                        {row.cleanPsgRequirement ||
                                          (!showSubHeader && row.subTitle !== area.title
                                            ? row.subTitle
                                            : '—')}
                                      </p>
                                    </div>

                                    {/* Right Column: ACTUAL SITUATION + Inline Evidence Links */}
                                    <div className="p-6">
                                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#1E4D2B] mb-2">
                                        Actual Situation
                                      </div>
                                      {(row.cleanActualSituation || row.evidences.length === 0) && (
                                        <p className="text-sm text-[#15221A] leading-relaxed whitespace-pre-line">
                                          {row.cleanActualSituation || '—'}
                                        </p>
                                      )}

                                      {/* Supporting Evidence Links from `programmatic_evidences` */}
                                      {row.evidences.length > 0 && (
                                        <div
                                          className={`${
                                            row.cleanActualSituation ? 'mt-3.5' : 'mt-1'
                                          } flex flex-wrap items-center gap-2`}
                                        >
                                          {row.evidences.map((ev) => (
                                            <DocumentLinkPreview
                                              key={ev.id}
                                              url={ev.driveLink}
                                              title={ev.label || row.subTitle}
                                              text={ev.label}
                                            >
                                              <a
                                                href={ev.driveLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4F6F1] hover:bg-[#0E3322] border border-[#DCE3D9] hover:border-[#0E3322] text-xs font-bold text-[#0E3322] hover:text-white transition-colors cursor-pointer"
                                              >
                                                <span>{ev.label}</span>
                                                <ExternalLink className="w-3 h-3 shrink-0" />
                                              </a>
                                            </DocumentLinkPreview>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Highlighted CHEDRO Remark Box in JHCSC Gold Tint */}
                                  {row.remarks && (
                                    <div className="px-6 pb-5 pt-1">
                                      <div className="w-full bg-[#FBF1D2]/75 border border-[#E8AE1F]/70 rounded-xl px-4 py-3.5 text-xs sm:text-sm text-[#6B4000] leading-relaxed whitespace-pre-line">
                                        <strong className="font-extrabold text-[#523000]">
                                          CHEDRO Remark:{' '}
                                        </strong>
                                        {row.remarks}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border border-[#DCE3D9] rounded-xl p-10 text-center space-y-3">
                  <p className="text-sm font-medium text-[#334155]">
                    No compliance areas match the selected status filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAreaStatusFilter('all')}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-[#0E3322] text-white text-xs font-bold cursor-pointer"
                  >
                    Show all {currentProgram.areas.length} areas
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-[#DCE3D9] rounded-xl p-12 text-center text-sm text-[#56635A]">
              No program selected.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
