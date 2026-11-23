import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  Search,
  ExternalLink,
  RefreshCw,
  Download,
  X,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FolderOpen,
  ChevronRight,
  Info
} from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { exportForm6ToExcel } from '../utils/excelExport';
import { getSupabaseClient } from '../data/api';
import { lookupDriveLinkTitle } from '../data/driveUrlTitles';
import { DocumentLinkPreview, convertToDrivePreviewUrl } from '../components/DocumentLinkPreview';

export interface Form6DbRow {
  id: string;
  campus_name: string;
  row_id: number;
  area_of_concern: string | null;
  actual_situation: string | null;
  status: string | null;
  remarks: string | null;
}

export interface Form6EvidenceDbRow {
  id: number;
  parent_id: string;
  source_row: number;
  evidence_text: string | null;
  drive_link: string | null;
}

export interface Form6EvidenceItem {
  id: number;
  parentId: string;
  sourceRow: number;
  evidenceText: string;
  driveLink: string | null;
}

export interface Form6RecordItem {
  id: string;
  campusName: CampusId;
  rowId: number;
  sectionId: number;
  sectionTag: string;
  shortSectionName: string;
  shortTitle: string;
  shortSummary: string;
  areaOfConcern: string;
  actualSituation: string;
  status: string | null;
  remarks: string | null;
  evidences: Form6EvidenceItem[];
}

export type CampusId = 'Main Campus' | 'Pagadian Campus' | 'Dumingag Campus' | 'CMSE Campus';

export const FORM6_CAMPUS_TABS: {
  id: CampusId;
  tabLabel: string;
  shortName: string;
  fullLabel: string;
}[] = [
  {
    id: 'Main Campus',
    tabLabel: 'Main campus',
    shortName: 'Main',
    fullLabel: 'Main Campus'
  },
  {
    id: 'Pagadian Campus',
    tabLabel: 'Pagadian',
    shortName: 'Pagadian',
    fullLabel: 'Pagadian Campus'
  },
  {
    id: 'Dumingag Campus',
    tabLabel: 'Dumingag',
    shortName: 'Dumingag',
    fullLabel: 'Dumingag Campus'
  },
  {
    id: 'CMSE Campus',
    tabLabel: 'Lakewood',
    shortName: 'Lakewood',
    fullLabel: 'Lakewood Campus'
  }
];

interface DocumentViewerModalState {
  title: string;
  subtitle: string;
  previewUrl: string;
  docsUrl: string;
  isFolder: boolean;
}

const FORM6_CACHE_KEY = 'jhcsc_form6_supabase_v6';

let cachedForm6ByCampus: Record<CampusId, Form6RecordItem[]> | null = null;
let prefetchForm6Promise: Promise<Record<CampusId, Form6RecordItem[]> | null> | null = null;

const SECTION_META: {
  id: number;
  minRow: number;
  maxRow: number;
  shortName: string;
  fullName: string;
}[] = [
  { id: 1, minRow: 35, maxRow: 40, shortName: '1. SAS Administration', fullName: 'Section 1. Administration of Student Affairs and Services' },
  { id: 2, minRow: 42, maxRow: 42, shortName: '2. Fee Management', fullName: 'Section 2. SAS Fee Allocation and Financial Management' },
  { id: 3, minRow: 45, maxRow: 48, shortName: '3. Admission Services', fullName: 'Section 3. Admission Services' },
  { id: 4, minRow: 50, maxRow: 54, shortName: '4. Career & Placement', fullName: 'Section 4. Career and Job Placement Services' },
  { id: 5, minRow: 56, maxRow: 60, shortName: '5. Culture & the Arts', fullName: 'Section 5. Culture and the Arts Programs' },
  { id: 6, minRow: 62, maxRow: 67, shortName: '6. Foreign Students', fullName: 'Section 6. Foreign / International Student Services' },
  { id: 7, minRow: 69, maxRow: 85, shortName: '7. Guidance & Counseling', fullName: 'Section 7. Guidance and Counseling Services' },
  { id: 8, minRow: 87, maxRow: 97, shortName: '8. Health & Food Services', fullName: 'Section 8. Health and Food Services' },
  { id: 9, minRow: 99, maxRow: 101, shortName: '9. Information & Orientation', fullName: 'Section 9. Information and Orientation Services' },
  { id: 10, minRow: 103, maxRow: 105, shortName: '10. Multi-Faith Services', fullName: 'Section 10. Multi-Faith / Interfaith Services' },
  { id: 11, minRow: 107, maxRow: 110, shortName: '11. Student Records', fullName: 'Section 11. Student Records Management (Registrar)' },
  { id: 12, minRow: 112, maxRow: 117, shortName: '12. Safety & DRRM', fullName: 'Section 12. Safety, Security, and Disaster Risk Reduction' },
  { id: 13, minRow: 119, maxRow: 123, shortName: '13. Scholarships & Aid', fullName: 'Section 13. Student Scholarships and Financial Assistance' },
  { id: 14, minRow: 125, maxRow: 127, shortName: '14. Community Involvement', fullName: 'Section 14. Social and Community Involvement Programs' },
  { id: 15, minRow: 129, maxRow: 134, shortName: '15. Sports Development', fullName: 'Section 15. Sports Development Programs' },
  { id: 16, minRow: 136, maxRow: 141, shortName: '16. Student Discipline', fullName: 'Section 16. Student Discipline' },
  { id: 17, minRow: 143, maxRow: 148, shortName: '17. Student Handbook', fullName: 'Section 17. Student Handbook Development' },
  { id: 18, minRow: 150, maxRow: 151, shortName: '18. Student Housing', fullName: 'Section 18. Student Housing and Residential Services' },
  { id: 19, minRow: 153, maxRow: 158, shortName: '19. Student Publication', fullName: 'Section 19. Student Publication and Yearbook' },
  { id: 20, minRow: 160, maxRow: 171, shortName: '20. Student Organizations', fullName: 'Section 20. Student Organizations and Leadership' },
  { id: 21, minRow: 173, maxRow: 179, shortName: '21. Special Needs (PWD)', fullName: 'Section 21. Services for Students with Special Needs' },
  { id: 22, minRow: 181, maxRow: 181, shortName: '22. Other Programs', fullName: 'Section 22. Other Institutional Student Programs' }
];

/**
 * Concise 3–5 word titles and 10–14 word summaries for every Form 6 row_id
 * so cards are crisp, scannable, and never congested with walls of text.
 */
const CONCISE_ROW_MAP: Record<number, { title: string; summary: string }> = {
  35: { title: 'SAS Administrative Office', summary: 'Dedicated office coordinating student welfare and support programs across campuses.' },
  36: { title: 'Qualified SAS Personnel', summary: 'Full-time staff and specialists assigned to student service units.' },
  37: { title: 'Inter-Office Coordination', summary: 'Regular coordination with academic, guidance, health, and registrar offices.' },
  38: { title: 'Digital Records & Platforms', summary: 'Electronic document management and digital delivery of student services.' },
  39: { title: 'Student Grievance Mechanism', summary: 'Three-tiered procedure for resolving student concerns and complaints.' },
  40: { title: 'Central Grievance Authority', summary: 'Designated authority for receiving and acting on student service complaints.' },
  42: { title: 'SAS Fee Allocation & Use', summary: 'Full allocation and transparent utilization of collected student service fees.' },
  45: { title: 'Inclusive Admission Policies', summary: 'Clear admission guidelines for all applicants, including PWDs and ALS passers.' },
  46: { title: 'Foreign Student Admission', summary: 'Admission procedures for foreign applicants and overseas Filipino graduates.' },
  47: { title: 'Enrollment of Qualified Applicants', summary: 'Standardized admission testing and enrollment within prescribed periods.' },
  48: { title: 'Admission & Tuition Information', summary: 'Public dissemination of admission guidelines, tuition, and school fees.' },
  50: { title: 'Career & Placement Coordinator', summary: 'Designated focal person managing student career and job placement services.' },
  51: { title: 'Industry & Agency Partnerships', summary: 'Linkages with government and industry partners for career opportunities.' },
  52: { title: 'Career Information Materials', summary: 'Print and digital distribution of job openings and skills training programs.' },
  53: { title: 'Job Placement & Referral System', summary: 'Pre-employment support including coaching, job fairs, and referrals.' },
  54: { title: 'Career Guidance Schedules', summary: 'Timely announcements of career counseling and placement schedules.' },
  56: { title: 'Culture & Arts Focal Person', summary: 'Designated Cultural Director overseeing campus arts and cultural programs.' },
  57: { title: 'Cultural Appreciation Programs', summary: 'Student participation in local, national, and international arts events.' },
  58: { title: 'Philippine Heritage Promotion', summary: 'Cultural activities in partnership with government and arts agencies.' },
  59: { title: 'Creative & Digital Skills', summary: 'Workshops and showcases developing artistic and digital literacy skills.' },
  60: { title: 'Cultural Sensitivity & Harmony', summary: 'Inclusive programs fostering respect among indigenous and cultural groups.' },
  62: { title: 'Foreign Student Unit (FSU)', summary: 'Dedicated unit monitoring international student welfare and compliance.' },
  63: { title: 'Accredited Immigration Liaison', summary: 'Designated staff handling Bureau of Immigration liaison and reporting.' },
  64: { title: 'Student Visa Compliance', summary: 'Verification of valid student visas and study permits for foreign nationals.' },
  65: { title: 'International Student Support', summary: 'Integrated academic and socio-cultural adjustment programs.' },
  66: { title: 'International Student Space', summary: 'Shared institutional space supporting international student activities.' },
  67: { title: 'Foreign Student Reporting', summary: 'Regular submission of updated international student compliance reports.' },
  69: { title: 'Licensed Guidance Head', summary: 'Guidance and Counseling Office headed by a Registered Guidance Counselor.' },
  70: { title: 'Counselor-to-Student Ratio', summary: 'Continuing recruitment to meet the 1:1,000 counselor-to-student ratio.' },
  71: { title: 'Guidance Associate Qualifications', summary: 'Hiring of qualified psychology and behavioral science graduates.' },
  72: { title: 'Peer Facilitators Group', summary: 'Trained student peer facilitators assisting guidance outreach activities.' },
  73: { title: 'Guidance Staff Licensure Support', summary: 'Support mechanisms for associates pursuing RGC professional licensure.' },
  74: { title: 'Continuing RGC Training', summary: 'Professional development seminars and trainings for guidance counselors.' },
  75: { title: 'Individual & Group Counseling', summary: 'Evidence-based, inclusive individual and group counseling services.' },
  76: { title: 'Private Counseling Room', summary: 'Safe, confidential, and accessible room for student counseling sessions.' },
  77: { title: 'Psychosocial Support Access', summary: 'Accessible psychosocial and mental health support for all students.' },
  78: { title: 'Psychological First Aid', summary: 'Online and in-person mental health and crisis support services.' },
  79: { title: 'Scope of Guidance Associates', summary: 'Clear delineation ensuring clinical counseling is handled by licensed RGCs.' },
  80: { title: 'Student Cumulative Records', summary: 'Confidential maintenance of updated student profile and guidance records.' },
  81: { title: 'Standardized Psychological Testing', summary: 'Planned student assessment program using standardized testing tools.' },
  82: { title: 'Student Follow-Up System', summary: 'Structured follow-up monitoring for counseled and referred students.' },
  83: { title: 'Internal & External Referrals', summary: 'Referral network connecting students to specialized professional care.' },
  84: { title: 'Targeted Intervention Programs', summary: 'Planned guidance interventions addressing specific student group needs.' },
  85: { title: 'Guidance Research & Evaluation', summary: 'Periodic evaluation of guidance data to improve student support services.' },
  87: { title: 'Primary Healthcare Services', summary: 'Campus medical and dental primary care services for all students.' },
  88: { title: 'Accessible Campus Clinics', summary: 'Functional health clinics established across college campuses.' },
  89: { title: 'Medical Personnel & Linkages', summary: 'Qualified health staff supported by hospital referral partnerships.' },
  90: { title: 'Clinic Facilities & Health Records', summary: 'Equipped clinic treatment areas and updated student medical records.' },
  91: { title: 'Healthy Lifestyle Promotion', summary: 'Campus health education, wellness campaigns, and fitness activities.' },
  92: { title: 'Supportive Health Policies', summary: 'Institutional policies promoting physical and mental well-being.' },
  93: { title: 'Disease Prevention Orientations', summary: 'Regular student seminars on health safety and disease prevention.' },
  94: { title: 'Food Safety & Nutrition Standards', summary: 'Sanitation and nutritional guidelines for campus food services.' },
  95: { title: 'LGU Food Safety Coordination', summary: 'Coordination with local health offices on food safety outside campus.' },
  96: { title: 'Regular Canteen Inspections', summary: 'Periodic sanitation and hygiene monitoring of campus food outlets.' },
  97: { title: 'Dietary & Cultural Food Labels', summary: 'Labeled food options respecting religious and dietary requirements.' },
  99: { title: 'Accessible Information Materials', summary: 'Updated educational, career, and social information materials.' },
  100: { title: 'Student Orientation Programs', summary: 'Regular campus-wide orientations for new and continuing students.' },
  101: { title: 'Student Rights & Policy Awareness', summary: 'Dissemination of laws, institutional rules, and student welfare policies.' },
  103: { title: 'Respect for Religious Freedom', summary: 'Inclusive campus environment upholding religious freedom for all.' },
  104: { title: 'Facilities for Religious Practice', summary: 'Guidelines for the respectful use of spaces for faith activities.' },
  105: { title: 'Interfaith Harmony & Respect', summary: 'Activities fostering mutual understanding among diverse faith groups.' },
  107: { title: 'Dedicated Registrar Office', summary: 'Registrar unit headed by a qualified officer managing student records.' },
  108: { title: 'Registrar Support Personnel', summary: 'Dedicated staff ensuring timely processing of academic credentials.' },
  109: { title: 'Accessible Records Guidelines', summary: 'Clear procedures on transcript requests, enrollment, and data privacy.' },
  110: { title: 'Digitized Record Backups', summary: 'Electronic archiving and backup of student academic records.' },
  112: { title: 'Safe & Inclusive Campus Facilities', summary: 'Maintained buildings and grounds compliant with accessibility standards.' },
  113: { title: 'Campus Security & Crime Prevention', summary: '24/7 security personnel, ID verification, and campus safety patrols.' },
  114: { title: 'Disaster Risk Reduction (DRRM)', summary: 'Campus mechanisms for hazard mitigation and emergency preparedness.' },
  115: { title: 'Institutional DRRM Committee', summary: 'Operational disaster preparedness and emergency response structure.' },
  116: { title: 'Earthquake & Fire Drills', summary: 'Regular participation in national and local emergency drills.' },
  117: { title: 'Campus Contingency Plans', summary: 'Established emergency response and evacuation protocols per campus.' },
  119: { title: 'Scholarship Focal Person', summary: 'Designated coordinator managing student scholarships and financial aid.' },
  120: { title: 'Accessible Scholarship Information', summary: 'Wide dissemination of available government and institutional grants.' },
  121: { title: 'Fair Screening & Monitoring', summary: 'Transparent qualification screening and monitoring of student grantees.' },
  122: { title: 'Scholarship Policies & Guidelines', summary: 'Standardized guidelines for internal and external financial assistance.' },
  123: { title: 'Emergency Fee Moratorium', summary: 'Deferred payment mechanisms for students affected by emergencies.' },
  125: { title: 'Socio-Civic Student Volunteering', summary: 'Opportunities for voluntary community outreach and civic engagement.' },
  126: { title: 'Student-Led Community Projects', summary: 'Supervision of student organizations conducting community extension.' },
  127: { title: 'Local Off-Campus Activity Rules', summary: 'Safety and approval protocols for off-campus student activities.' },
  129: { title: 'Sports Development Unit', summary: 'Designated sports director and coordinators managing athletics programs.' },
  130: { title: 'Inclusive & Gender-Fair Sports', summary: 'Equitable access to athletic programs across genders and backgrounds.' },
  131: { title: 'Regular Intramurals & Athletics', summary: 'Annual campus intramurals and inter-campus athletic competitions.' },
  132: { title: 'Athlete Safety & Wellness', summary: 'Holistic sports program ensuring medical readiness and athlete safety.' },
  133: { title: 'Sports Program Budget Allocation', summary: 'Dedicated institutional funding for sports equipment and competitions.' },
  134: { title: 'Athletic Policy Compliance', summary: 'Adherence to institutional and national collegiate sports guidelines.' },
  136: { title: 'Student Code of Conduct', summary: 'Clear norms and behavioral standards maintained in the Student Manual.' },
  137: { title: 'Gender & Disability-Fair Rules', summary: 'Consultative discipline policies sensitive to gender and disability.' },
  138: { title: 'Due Process & Decorum Rules', summary: 'Defined procedures for handling complaints, hearings, and sanctions.' },
  139: { title: 'Safe Spaces & Anti-Harassment', summary: 'Strict enforcement of Safe Spaces Act and anti-harassment policies.' },
  140: { title: 'Student Disciplinary Board', summary: 'Constituted committee ensuring fair due process in misconduct cases.' },
  141: { title: 'Conflict Resolution Mechanisms', summary: 'Timely mediation and restorative resolution of student conflicts.' },
  143: { title: 'Participatory Handbook Revision', summary: 'Consultative process involving students in updating the Student Handbook.' },
  144: { title: 'Periodic 5-Year Handbook Review', summary: 'Regular review and updating of student policies within five-year cycles.' },
  145: { title: 'Multi-Sectoral Handbook Committee', summary: 'Committee of SAS, academic, registrar, and student representatives.' },
  146: { title: 'Multi-Format Handbook Access', summary: 'Distribution of the Student Handbook in print and digital formats.' },
  147: { title: 'Comprehensive Handbook Contents', summary: 'Complete coverage of academic rules, student rights, and support services.' },
  148: { title: 'Student Handbook Orientations', summary: 'Regular orientations and student acknowledgment of handbook policies.' },
  150: { title: 'Student Dormitory & Housing Assistance', summary: 'On-campus dormitory services and accredited off-campus housing list.' },
  151: { title: 'Annual Student Housing Report', summary: 'Periodic monitoring and reporting of student residential facilities.' },
  153: { title: 'Campus Press Freedom', summary: 'Institutional support for responsible student journalism and expression.' },
  154: { title: 'Creative Media & Engagement', summary: 'Student publications fostering writing, layout, and community awareness.' },
  155: { title: 'Campus Journalism Act Support', summary: 'Recognized editorial boards operating under the Campus Journalism Act.' },
  156: { title: 'Consultative Yearbook Production', summary: 'Graduating student consultation on optional yearbook production.' },
  157: { title: 'Campus Journalism Training', summary: 'Seminars and workshops building student journalists’ skills.' },
  158: { title: 'Print & Digital Publications', summary: 'Accessible publication distribution through print and online platforms.' },
  160: { title: 'Supervision of Student Orgs', summary: 'Oversight and monitoring of recognized campus student organizations.' },
  161: { title: 'Student Activity Approval System', summary: 'Review and approval process for curricular and co-curricular events.' },
  162: { title: 'Organization Accreditation System', summary: 'Annual accreditation, renewal, and evaluation of student groups.' },
  163: { title: 'Anti-Abuse By-Law Provisions', summary: 'Organizational constitutions prohibiting bullying, hazing, and abuse.' },
  164: { title: 'Student Organization Office Space', summary: 'Dedicated work spaces and institutional support for accredited groups.' },
  165: { title: 'Regulated Online Student Events', summary: 'Guidelines for advance reporting and supervision of virtual activities.' },
  166: { title: 'Strict Anti-Hazing Compliance', summary: 'Zero-tolerance anti-hazing orientation and monitoring for all groups.' },
  167: { title: 'Autonomous Student Government', summary: 'Recognition of the Supreme Student Council and board representation.' },
  168: { title: 'Digital Accreditation Submission', summary: 'Online submission option for student organization accreditation files.' },
  169: { title: 'Transparent Student Elections', summary: 'Clear, democratic election codes for student government officers.' },
  170: { title: 'Student Leadership Trainings', summary: 'Regular leadership seminars and external training partnerships.' },
  171: { title: 'Student-Identified Leadership Programs', summary: 'Leadership capacity-building activities proposed by student leaders.' },
  173: { title: 'Reasonable PWD Accommodations', summary: 'Academic and physical accommodations for students with special needs.' },
  174: { title: 'Disability Support Focal Person', summary: 'Designated coordinator overseeing Disability Support Services (DSS).' },
  175: { title: 'PWD Internal Referral System', summary: 'Streamlined referral mechanism connecting PWD students to support units.' },
  176: { title: 'PWD Enrollment & Support Registry', summary: 'Updated institutional registry and reporting of students with disabilities.' },
  177: { title: 'Special Needs (SSN) Coordinator', summary: 'Designated focal person supporting students with specific learning needs.' },
  178: { title: 'Special Needs Referral Pathway', summary: 'Coordinated referral system for counseling, health, and academic aid.' },
  179: { title: 'Special Needs Program Reporting', summary: 'Regular tracking of programs provided to students with specific needs.' },
  181: { title: 'GAD, Alumni & Allied Programs', summary: 'Gender and Development, alumni engagement, and student enterprise initiatives.' }
};

function resolveSectionInfo(rowId: number) {
  const found = SECTION_META.find((s) => rowId >= s.minRow && rowId <= s.maxRow);
  if (found) return found;
  return SECTION_META[0];
}

function normalizeNullableString(val?: string | null): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed.toUpperCase() === 'NULL') return null;
  return trimmed;
}

function cleanInstitutionalText(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .replace(/\band\s+CMO\s+No\.\s*\d+\s*,?\s*s\.\s*\d{4}/gi, 'and institutional standards')
    .replace(/\bCMO\s*(?:No\.)?\s*\d+\s*,?\s*s\.?\s*\d{4}\s*[-–—]?\s*/gi, '')
    .replace(/\bthe\s+relevant\s+CMO\b/gi, 'relevant institutional guidelines')
    .replace(/\brelevant\s+CMOs\b/gi, 'relevant institutional guidelines')
    .replace(/\bthis\s+CMO\b/gi, 'these institutional standards')
    .replace(/\bCHED\s+Anti-?Hazing\s+CMO\b/gi, 'Anti-Hazing Policy')
    .replace(/\bCMO\.?\s*(\d+)/gi, 'Item $1')
    .replace(/\bCMSE\s*\((?:Lakewood)\)/gi, 'Lakewood')
    .replace(/\bCanuto\s+M\.?\s*S\.?\s*Enerio\s*\(?CMSE\)?/gi, 'Lakewood')
    .replace(/\bCMSE\b/g, 'Lakewood')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function normalizeComplianceStatus(rawStatus: string | null): {
  label: string;
  category: 'complied' | 'partial' | 'none';
} {
  if (!rawStatus) {
    return { label: '', category: 'none' };
  }
  const upper = rawStatus.trim().toUpperCase();
  if (upper.includes('NO ATTACHMENT') || upper.includes('NOT COMPLIED')) {
    return { label: 'For Compliance', category: 'none' };
  }
  if (upper.includes('PARTIAL')) {
    return { label: 'Partially Complied', category: 'partial' };
  }
  if (upper.includes('COMPLIED') || upper.includes('COMPLIANT') || upper.includes('COMPILED')) {
    return { label: 'Complied', category: 'complied' };
  }
  return { label: 'Complied', category: 'complied' };
}

export async function fetchAllForm6Data(): Promise<Record<CampusId, Form6RecordItem[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const [form6Res, evidencesRes] = await Promise.all([
    supabase
      .from('form6')
      .select('id,campus_name,row_id,area_of_concern,actual_situation,status,remarks')
      .order('row_id', { ascending: true })
      .limit(2000),
    supabase
      .from('form6_evidences')
      .select('id,parent_id,source_row,evidence_text,drive_link')
      .order('id', { ascending: true })
      .limit(3000)
  ]);

  if (form6Res.error) {
    throw new Error(`form6 table error: ${form6Res.error.message}`);
  }
  if (evidencesRes.error) {
    throw new Error(`form6_evidences table error: ${evidencesRes.error.message}`);
  }

  const rawForm6: Form6DbRow[] = form6Res.data || [];
  const rawEvidences: Form6EvidenceDbRow[] = evidencesRes.data || [];

  const evidencesByParentId = new Map<string, Form6EvidenceItem[]>();
  rawEvidences.forEach((ev) => {
    if (!ev.parent_id) return;
    const key = ev.parent_id.trim();
    if (!evidencesByParentId.has(key)) {
      evidencesByParentId.set(key, []);
    }
    const cleanLink = normalizeNullableString(ev.drive_link);
    const rawEvText = normalizeNullableString(ev.evidence_text);
    const isGenericText =
      !rawEvText ||
      /^(view evidence file|attached smart chips?|smart chip|supporting document|evidences?)$/i.test(
        rawEvText
      );
    const resolvedDriveTitle = cleanLink ? lookupDriveLinkTitle(cleanLink) : null;
    const rawCleanText =
      (!isGenericText ? rawEvText : resolvedDriveTitle || rawEvText) ||
      (cleanLink ? 'Supporting Document' : '');
    const cleanText = rawCleanText
      .replace(/\bCMSE\s*\((?:Lakewood)\)/gi, 'Lakewood')
      .replace(/\bCanuto\s+M\.?\s*S\.?\s*Enerio\s*\(?CMSE\)?/gi, 'Lakewood')
      .replace(/\bCMSE\b/g, 'Lakewood');
    if (!cleanText && !cleanLink) return;

    evidencesByParentId.get(key)!.push({
      id: ev.id,
      parentId: key,
      sourceRow: ev.source_row,
      evidenceText: cleanText,
      driveLink: cleanLink
    });
  });

  const groupedByCampus: Record<CampusId, Form6RecordItem[]> = {
    'Main Campus': [],
    'Pagadian Campus': [],
    'Dumingag Campus': [],
    'CMSE Campus': []
  };

  FORM6_CAMPUS_TABS.forEach((campusTab) => {
    const campusRows = rawForm6
      .filter((r) => (r.campus_name || '').trim().toLowerCase() === campusTab.id.toLowerCase())
      .sort((a, b) => a.row_id - b.row_id);

    groupedByCampus[campusTab.id] = campusRows.map((row) => {
      const sec = resolveSectionInfo(row.row_id);
      const concise = CONCISE_ROW_MAP[row.row_id];
      const cleanArea = cleanInstitutionalText(normalizeNullableString(row.area_of_concern) || '');
      const cleanActual = cleanInstitutionalText(normalizeNullableString(row.actual_situation) || '');

      return {
        id: row.id,
        campusName: campusTab.id,
        rowId: row.row_id,
        sectionId: sec.id,
        sectionTag: sec.fullName,
        shortSectionName: sec.shortName,
        shortTitle: concise?.title || cleanArea.split(/[.,;]/)[0].slice(0, 55) || 'Student Support Service',
        shortSummary: concise?.summary || cleanActual.split(/\.\s+/)[0] + '.' || 'Implemented across campus.',
        areaOfConcern: cleanArea,
        actualSituation: cleanActual,
        status: normalizeNullableString(row.status),
        remarks: cleanInstitutionalText(normalizeNullableString(row.remarks) || '') || null,
        evidences: evidencesByParentId.get(row.id) || []
      };
    });
  });

  cachedForm6ByCampus = groupedByCampus;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FORM6_CACHE_KEY, JSON.stringify(groupedByCampus));
    }
  } catch {}

  return groupedByCampus;
}

export function preloadForm6Data(): Promise<Record<CampusId, Form6RecordItem[]> | null> {
  if (cachedForm6ByCampus) return Promise.resolve(cachedForm6ByCampus);
  if (prefetchForm6Promise) return prefetchForm6Promise;

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(FORM6_CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed['Main Campus'] && parsed['Main Campus'].length > 0) {
          cachedForm6ByCampus = parsed;
        }
      }
    } catch {}
  }

  prefetchForm6Promise = fetchAllForm6Data()
    .catch((err) => {
      console.warn('Form 6 background preload failed:', err);
      return cachedForm6ByCampus;
    })
    .finally(() => {
      prefetchForm6Promise = null;
    });

  return prefetchForm6Promise;
}

export const Form6Page: React.FC = () => {
  const [activeCampusId, setActiveCampusId] = useState<CampusId>('Main Campus');
  const [allCampusData, setAllCampusData] = useState<Record<CampusId, Form6RecordItem[]>>(() => {
    if (cachedForm6ByCampus) return cachedForm6ByCampus;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(FORM6_CACHE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed['Main Campus']) {
            cachedForm6ByCampus = parsed;
            return parsed;
          }
        }
      } catch {}
    }
    return {
      'Main Campus': [],
      'Pagadian Campus': [],
      'Dumingag Campus': [],
      'CMSE Campus': []
    };
  });

  const [loading, setLoading] = useState<boolean>(
    () => !cachedForm6ByCampus || !cachedForm6ByCampus['Main Campus']?.length
  );
  const [error, setError] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [detailModalItem, setDetailModalItem] = useState<Form6RecordItem | null>(null);

  // Scrollable & Zoomable Document Viewer Modal State
  const [viewerModal, setViewerModal] = useState<DocumentViewerModalState | null>(null);
  const [docZoom, setDocZoom] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const activeCampus = useMemo(() => {
    return FORM6_CAMPUS_TABS.find((c) => c.id === activeCampusId) || FORM6_CAMPUS_TABS[0];
  }, [activeCampusId]);

  const loadSupabaseForm6Data = async () => {
    try {
      if (!cachedForm6ByCampus || !cachedForm6ByCampus['Main Campus']?.length) {
        setLoading(true);
      }
      setError(null);
      const freshData = await fetchAllForm6Data();
      setAllCampusData(freshData);
    } catch (err: any) {
      console.error('Error fetching Supabase Form 6 data:', err);
      setError(err.message || 'Failed to load Form 6 records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupabaseForm6Data();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel('form6_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'form6' }, () => {
        loadSupabaseForm6Data();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'form6_evidences' }, () => {
        loadSupabaseForm6Data();
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (!viewerModal && !detailModalItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewerModal(null);
        setDetailModalItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerModal, detailModalItem]);

  const openDocumentViewer = (
    title: string,
    subtitle: string,
    driveLink: string
  ) => {
    const isFolder = driveLink.includes('/folders/');
    const driveMeta = convertToDrivePreviewUrl(driveLink);
    setDocZoom(1);
    setIsFullscreen(false);
    setViewerModal({
      title,
      subtitle,
      previewUrl: driveMeta.previewUrl || driveLink,
      docsUrl: driveLink,
      isFolder
    });
  };

  const campusRecords = useMemo(() => {
    return allCampusData[activeCampus.id] || [];
  }, [allCampusData, activeCampus.id]);

  // Available sections with item counts for the left sidebar
  const sectionMenu = useMemo(() => {
    return SECTION_META.map((sec) => {
      const items = campusRecords.filter((r) => r.sectionId === sec.id);
      const docsCount = items.reduce(
        (acc, r) => acc + r.evidences.filter((e) => Boolean(e.driveLink)).length,
        0
      );
      return {
        ...sec,
        count: items.length,
        docsCount
      };
    }).filter((s) => s.count > 0);
  }, [campusRecords]);

  // Displayed items: either search results across all sections, or only the selected section
  const displayedItems = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return campusRecords.filter(
        (r) =>
          r.shortTitle.toLowerCase().includes(q) ||
          r.shortSummary.toLowerCase().includes(q) ||
          r.areaOfConcern.toLowerCase().includes(q) ||
          r.actualSituation.toLowerCase().includes(q) ||
          r.shortSectionName.toLowerCase().includes(q)
      );
    }
    return campusRecords.filter((r) => r.sectionId === activeSectionId);
  }, [campusRecords, activeSectionId, searchQuery]);

  const currentSectionInfo = useMemo(() => {
    return SECTION_META.find((s) => s.id === activeSectionId) || SECTION_META[0];
  }, [activeSectionId]);

  const handleExportExcel = () => {
    const rows = campusRecords.map((r) => ({
      id: r.id,
      campus_name: r.campusName,
      row_id: r.rowId,
      section: r.sectionTag,
      area_of_concern: r.areaOfConcern,
      actual_situation: r.actualSituation,
      status: normalizeComplianceStatus(r.status).label || '—',
      remarks: r.remarks || '',
      evidence_text: r.evidences.map((e) => e.evidenceText).join(' | '),
      drive_link: r.evidences
        .map((e) => e.driveLink)
        .filter(Boolean)
        .join(' | ')
    }));
    exportForm6ToExcel(rows, activeCampus.fullLabel);
  };

  return (
    <div className="w-full bg-[#F4F6F1] pb-16 font-sans">
      {/* Pine Hero Band */}
      <InnerHeroBand
        breadcrumb="Form 6"
        title="Form 6: Student support structures"
        subtitle="4 campuses — Student Affairs and Services (SAS) compliance summary and supporting documents by campus."
        highlightNumber="4 campuses"
      />

      {/* White rounded card overlapping the bottom ~80px of the Pine band */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        {/* Main Card Container */}
        <div className="bg-white border border-[#E5E9E2] rounded-signature p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)] space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={loadSupabaseForm6Data}
                className="inline-flex items-center gap-1 underline font-bold text-[#1E4D2B] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Top Bar: Campus Tabs + Search + Export */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5E9E2]">
            <div className="flex flex-wrap items-center gap-2">
              {FORM6_CAMPUS_TABS.map((tab) => {
                const isActive = activeCampusId === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCampusId(tab.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0E3322] text-white shadow-xs'
                        : 'bg-[#EEF1EB] text-[#475569] hover:bg-[#E2E8F0] hover:text-[#15221A]'
                    }`}
                  >
                    {tab.tabLabel}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-7 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#15221A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0E3322]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <a
                href="https://docs.google.com/spreadsheets/d/1YLvHROQLYAJ9WQel4onl-efPp_qF6KBLLvwFDNbujNE/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs rounded-full hover:bg-[#1E4D2B]/5 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>View spreadsheet</span>
              </a>
            </div>
          </div>

          {/* Two-Column Layout: Left Section Menu + Right 2-Column Cards */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Sidebar: Sections */}
            <div className="w-full lg:w-[270px] shrink-0">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-2 px-1">
                Sections
              </div>

              {/* Mobile Dropdown */}
              <div className="lg:hidden mb-2">
                <select
                  value={activeSectionId}
                  onChange={(e) => {
                    setActiveSectionId(Number(e.target.value));
                    setSearchQuery('');
                  }}
                  aria-label="Select section"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#FAFBF8] text-xs font-bold text-[#0E3322]"
                >
                  {sectionMenu.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.shortName} ({sec.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Desktop Vertical Menu */}
              <div className="hidden lg:flex flex-col gap-1">
                {sectionMenu.map((sec) => {
                  const isSelected = !searchQuery.trim() && activeSectionId === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        setActiveSectionId(sec.id);
                        setSearchQuery('');
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-[#0E3322] text-white shadow-2xs'
                          : 'text-[#334155] hover:bg-[#F4F6F1] hover:text-[#0E3322]'
                      }`}
                    >
                      <span className="line-clamp-2 leading-snug">{sec.shortName}</span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          isSelected
                            ? 'bg-[#E8AE1F] text-[#0E3322]'
                            : 'bg-[#EEF1EB] text-[#64748B]'
                        }`}
                      >
                        {sec.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Main Panel: 2-Column Card Grid */}
            <div className="flex-1 min-w-0 w-full">
              {/* Active Section Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[#EEF1EB]">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#E8AE1F] shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-[#0E3322]">
                    {searchQuery.trim()
                      ? `Search Results (${displayedItems.length})`
                      : currentSectionInfo.fullName}
                  </h2>
                </div>
                <span className="text-xs font-medium text-[#64748B]">
                  {displayedItems.length} {displayedItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* 2-Column Grid of Cards (Matching Form 5 Card Layout) */}
              {displayedItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedItems.map((item) => {
                    const normStatus = normalizeComplianceStatus(item.status);
                    const validEvidences = item.evidences.filter((e) => Boolean(e.driveLink));

                    return (
                      <div
                        key={item.id}
                        className="bg-[#FAFBF9] border border-[#DCE3D9] rounded-2xl overflow-hidden hover:border-[#1E4D2B]/40 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between"
                      >
                        <div className="p-5 pb-4">
                          {/* Card Top: Short Title + Status Badge */}
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-sm sm:text-[15px] font-bold text-[#0E3322] leading-snug line-clamp-2">
                              {item.shortTitle}
                            </h3>

                            {normStatus.label && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                                  normStatus.category === 'complied'
                                    ? 'bg-[#E4EFE7] text-[#1E4D2B]'
                                    : normStatus.category === 'partial'
                                    ? 'bg-[#FEF3D6] text-[#8A5A00]'
                                    : 'bg-[#EEF1EB] text-[#56635A]'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    normStatus.category === 'complied'
                                      ? 'bg-[#1E4D2B]'
                                      : normStatus.category === 'partial'
                                      ? 'bg-[#D99B14]'
                                      : 'bg-[#64748B]'
                                  }`}
                                />
                                <span>{normStatus.label}</span>
                              </span>
                            )}
                          </div>

                          {/* Short Summary */}
                          <p className="text-xs sm:text-[13px] text-[#475569] mt-2 leading-relaxed line-clamp-2">
                            {item.shortSummary}
                          </p>

                          {/* Upgraded File Click Rows for Document Evidences (Matching Form 5) */}
                          {validEvidences.length > 0 && (
                            <div className="mt-3.5 pt-3 border-t border-[#EEF1EB] space-y-2">
                              {validEvidences.map((ev, idx) => {
                                const isFolder = Boolean(
                                  ev.driveLink && ev.driveLink.includes('/folders/')
                                );
                                const rawLabel = (ev.evidenceText || '').trim();
                                const isGenericLabel =
                                  !rawLabel ||
                                  rawLabel.toLowerCase() === 'supporting document' ||
                                  rawLabel.toLowerCase() === 'document';
                                const displayLabel = !isGenericLabel
                                  ? rawLabel
                                  : validEvidences.length > 1
                                  ? isFolder
                                    ? `Evidence Folder ${idx + 1}`
                                    : `Supporting Document ${idx + 1}`
                                  : isFolder
                                  ? 'View Evidence Folder'
                                  : 'View Supporting Document';

                                return (
                                  <div key={ev.id} className="w-full">
                                    <DocumentLinkPreview
                                      url={ev.driveLink}
                                      title={ev.evidenceText || item.shortTitle}
                                      text={displayLabel}
                                    >
                                      <a
                                        href={ev.driveLink!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group/doc flex items-center justify-between gap-2.5 w-full px-3 py-2 rounded-xl bg-white hover:bg-[#EDF5F0] border border-[#DCE3D9] hover:border-[#1E4D2B]/40 text-xs font-semibold text-[#0E3322] shadow-2xs transition-all cursor-pointer text-left"
                                      >
                                        <span className="flex items-center gap-2.5 min-w-0 flex-1">
                                          <span className="w-7 h-7 rounded-lg bg-[#E3EFE8] group-hover/doc:bg-[#1E4D2B] text-[#1E4D2B] group-hover/doc:text-white flex items-center justify-center shrink-0 transition-colors">
                                            {isFolder ? (
                                              <FolderOpen className="w-3.5 h-3.5" />
                                            ) : (
                                              <FileText className="w-3.5 h-3.5" />
                                            )}
                                          </span>
                                          <span className="leading-snug text-[#0E3322] group-hover/doc:text-[#1E4D2B] break-words line-clamp-2">
                                            {displayLabel}
                                          </span>
                                        </span>
                                        <span className="w-6 h-6 rounded-md bg-[#F4F6F1] group-hover/doc:bg-[#1E4D2B]/10 text-[#64748B] group-hover/doc:text-[#1E4D2B] flex items-center justify-center shrink-0 transition-colors">
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </span>
                                      </a>
                                    </DocumentLinkPreview>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Card Footer: Details Modal Trigger (Matching Form 5) */}
                        <div className="px-5 py-3 border-t border-[#E5E9E2] flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailModalItem(item)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#475569] hover:text-[#0E3322] cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5 text-[#64748B]" />
                            <span>Details</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#64748B] bg-[#FAFBF8] rounded-2xl border border-dashed border-[#CBD5E1]">
                  {loading
                    ? `Loading records for ${activeCampus.fullLabel}...`
                    : 'No matching items found.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Requirement & Campus Situation Details Modal (Matching Form 5) */}
      {detailModalItem && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDetailModalItem(null)}
        >
          <div
            className="bg-white border border-[#DCE3D9] rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0E3322] text-white px-5 py-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#E8AE1F]">
                  {detailModalItem.shortSectionName} · {activeCampus.fullLabel}
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {detailModalItem.shortTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-1">
                  Requirement
                </div>
                <p className="font-semibold text-[#0E3322] leading-relaxed">
                  {detailModalItem.areaOfConcern}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E5E9E2]">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-1">
                  Campus Implementation
                </div>
                <p className="text-[#334155] leading-relaxed whitespace-pre-line">
                  {detailModalItem.actualSituation || '—'}
                </p>
              </div>

              {detailModalItem.remarks && (
                <div className="p-3.5 rounded-xl bg-[#FAFBF8] border border-[#E5E9E2]">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#0E3322] mb-1">
                    Remarks
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    {detailModalItem.remarks}
                  </p>
                </div>
              )}

              {detailModalItem.evidences.filter((e) => Boolean(e.driveLink)).length > 0 && (
                <div className="pt-3 border-t border-[#E5E9E2]">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-2">
                    Evidences
                  </div>
                  <div className="space-y-2">
                    {detailModalItem.evidences
                      .filter((e) => Boolean(e.driveLink))
                      .map((ev, idx, arr) => {
                        const isFolder = Boolean(ev.driveLink && ev.driveLink.includes('/folders/'));
                        const rawLabel = (ev.evidenceText || '').trim();
                        const isGenericLabel =
                          !rawLabel ||
                          rawLabel.toLowerCase() === 'supporting document' ||
                          rawLabel.toLowerCase() === 'document';
                        const displayLabel = !isGenericLabel
                          ? rawLabel
                          : arr.length > 1
                          ? isFolder
                            ? `Evidence Folder ${idx + 1}`
                            : `Supporting Document ${idx + 1}`
                          : isFolder
                          ? 'View Evidence Folder'
                          : 'View Supporting Document';

                        return (
                          <div key={ev.id} className="w-full">
                            <DocumentLinkPreview
                              url={ev.driveLink}
                              title={ev.evidenceText || detailModalItem.shortTitle}
                              text={displayLabel}
                            >
                              <a
                                href={ev.driveLink!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group/doc flex items-center justify-between gap-2.5 w-full px-3 py-2 rounded-xl bg-[#FAFBF9] hover:bg-[#EDF5F0] border border-[#DCE3D9] hover:border-[#1E4D2B]/40 text-xs font-semibold text-[#0E3322] shadow-2xs transition-all cursor-pointer text-left"
                              >
                                <span className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <span className="w-7 h-7 rounded-lg bg-[#E3EFE8] group-hover/doc:bg-[#1E4D2B] text-[#1E4D2B] group-hover/doc:text-white flex items-center justify-center shrink-0 transition-colors">
                                    {isFolder ? (
                                      <FolderOpen className="w-3.5 h-3.5" />
                                    ) : (
                                      <FileText className="w-3.5 h-3.5" />
                                    )}
                                  </span>
                                  <span className="leading-snug text-[#0E3322] group-hover/doc:text-[#1E4D2B] break-words">
                                    {displayLabel}
                                  </span>
                                </span>
                                <span className="w-6 h-6 rounded-md bg-[#F4F6F1] group-hover/doc:bg-[#1E4D2B]/10 text-[#64748B] group-hover/doc:text-[#1E4D2B] flex items-center justify-center shrink-0 transition-colors">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </span>
                              </a>
                            </DocumentLinkPreview>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-[#FAFBF9] border-t border-[#DCE3D9] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-1.5 rounded-lg bg-[#0E3322] hover:bg-[#1E4D2B] text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable & Zoomable Document Viewer Modal */}
      {viewerModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
          onClick={() => setViewerModal(null)}
        >
          <div
            className={`bg-white border border-[#DCE3D9] rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all duration-200 ${
              isFullscreen ? 'fixed inset-2 z-[60] max-h-none' : 'max-w-5xl w-full max-h-[92vh]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0E3322] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 shrink-0">
              <div className="min-w-0 flex-1">
                {viewerModal.subtitle && (
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#E8AE1F] mb-0.5">
                    {viewerModal.subtitle}
                  </div>
                )}
                <h3 className="text-base sm:text-lg font-bold text-white truncate">
                  {viewerModal.title}
                </h3>
              </div>

              {/* Zoom & Fullscreen Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/15 mr-1">
                  <button
                    type="button"
                    onClick={() => setDocZoom((z) => Math.max(0.75, +(z - 0.15).toFixed(2)))}
                    className="p-1 hover:bg-white/20 rounded text-white cursor-pointer transition-colors"
                    title="Zoom Out (-)"
                    aria-label="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-xs font-mono font-bold text-[#F5F2E6] min-w-[44px] text-center select-none">
                    {Math.round(docZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setDocZoom((z) => Math.min(2.0, +(z + 0.15).toFixed(2)))}
                    className="p-1 hover:bg-white/20 rounded text-white cursor-pointer transition-colors"
                    title="Zoom In (+)"
                    aria-label="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocZoom(1)}
                    className="px-2 py-0.5 text-[11px] font-bold text-[#E8AE1F] hover:bg-white/20 rounded cursor-pointer transition-colors border-l border-white/15 ml-0.5"
                    title="Reset Zoom to 100%"
                  >
                    Reset
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  aria-label="Toggle Fullscreen"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setViewerModal(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer ml-1"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable & Zoomable Document Viewer Canvas */}
            <div className="relative flex-1 bg-[#0F172A] overflow-auto min-h-[460px] h-[72vh] p-3 sm:p-6">
              <div
                className="mx-auto transition-all duration-150 ease-out origin-top bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-300"
                style={{
                  width: `${Math.round(docZoom * 100)}%`,
                  minWidth: docZoom > 1 ? `${Math.round(docZoom * 820)}px` : undefined,
                  maxWidth: docZoom === 1 ? '920px' : 'none',
                  height: `${Math.round(Math.max(680, 680 * docZoom))}px`
                }}
              >
                <iframe
                  src={viewerModal.previewUrl}
                  title={viewerModal.title}
                  className="w-full h-full border-0 bg-white"
                  allow="autoplay"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-[#FAFBF9] border-t border-[#DCE3D9] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0E3322]">
                {viewerModal.isFolder ? (
                  <FolderOpen className="w-4 h-4 text-[#1E4D2B]" />
                ) : (
                  <FileText className="w-4 h-4 text-[#1E4D2B]" />
                )}
                <span>
                  {viewerModal.isFolder
                    ? 'Evidence Folder · Scroll & click files to view'
                    : 'Supporting Document · Scroll & zoom enabled'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 ml-auto">
                {viewerModal.docsUrl && (
                  <a
                    href={viewerModal.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F5F2E6] hover:bg-[#FBF1D2] text-[#0E3322] border border-[#DCE3D9] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setViewerModal(null)}
                  className="px-4 py-1.5 rounded-lg bg-[#0E3322] hover:bg-[#1E4D2B] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
