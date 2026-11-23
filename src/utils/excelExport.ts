import * as XLSX from 'xlsx';

export function exportSingleTable(data: any[], fileName: string, sheetName: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  XLSX.writeFile(wb, fileName);
}

export function exportForm1ToExcel(programs: any[] = []) {
  if (!programs || programs.length === 0) {
    return;
  }

  const rows = programs.map((r: any) => {
    const hist = r.enrollmentHistory || [];
    const syMap: Record<string, number> = {};
    hist.forEach((h: any) => {
      if (h.schoolYearShort) syMap[h.schoolYearShort] = h.count;
    });

    return {
      'Campus': r.campus,
      'Group / Level': r.groupName || r.level,
      'Program Offering': r.name,
      'Major / Specialization': r.major || '',
      'Board Resolution / Authority': r.authority || '',
      'COPC Details': r.copcStatus || '',
      'SY Started': r.syStarted || '',
      'Research Course Title': r.researchCourse || '',
      'Research Units': r.researchUnits || '',
      'Required or Elective': r.researchReqElec || '',
      'Thesis Title': r.thesisDissertation || '',
      'Thesis Units': r.thesisUnits || '',
      'Prerequisite': r.prereqToGrad || '',
      'SY 21–22': syMap['SY 21–22'] ?? '',
      'SY 22–23': syMap['SY 22–23'] ?? '',
      'SY 23–24': syMap['SY 23–24'] ?? '',
      'SY 24–25': syMap['SY 24–25'] ?? '',
      'SY 25–26': syMap['SY 25–26'] ?? '',
      'SY 26–27': syMap['SY 26–27'] ?? '',
      '5-Year Average': typeof r.averageEnrollment === 'number' ? r.averageEnrollment.toFixed(2) : (r.averageEnrollment || 0),
    };
  });

  exportSingleTable(rows, 'Form-1-Programs-And-Enrollment.xlsx', 'Form 1 Programs');
}

export function exportForm2ToExcel(facultyList: any[] = []) {
  if (!facultyList || facultyList.length === 0) return;
  const rows = facultyList.map((f, idx) => ({
    '#': f.sequenceNo ?? idx + 1,
    'Campus': f.campus || '',
    'School / Unit': f.department || f.schoolGroup || '',
    'Program / Group': f.programGroup || 'Direct Listing',
    'Faculty Name': f.name || '',
    'Academic Rank': f.academicRank || '',
    'Permanent': f.fullTimePermanent ? 'TRUE' : 'FALSE',
    'Contractual': f.fullTimeContractual ? 'TRUE' : 'FALSE',
    'Part-Time': f.partTime ? 'TRUE' : 'FALSE',
    'Undergraduate Teaching': f.teachingUndergrad ? 'TRUE' : 'FALSE',
    'Graduate Teaching': f.teachingGrad ? 'TRUE' : 'FALSE',
    "Bachelor's Degree": f.bachelorDegree || '',
    "Master's Degree": f.masterDegree || '',
    'Doctorate Degree': f.doctorateDegree || '',
    'Academic Specialization': f.academicSpecialization || '',
    'License No.': f.licenseNo || '',
    'License Expiry Date': f.licenseExpiryDate || '',
    'Professional Experience': f.professionalExperience || '',
    'Subject Assignments (SY 2025-2026)': f.sy2025_2026 || '',
    'Subject Assignments (SY 2026-2027)': f.sy2026_2027 || '',
    'Ongoing Researches (Form 3)': (f.ongoingResearches || []).map((r: any) => r.title).join('; '),
    'Completed Researches (Form 3)': (f.completedResearches || []).map((r: any) => r.title).join('; '),
    'Google Drive Folder': f.driveFolderUrl || '',
  }));
  exportSingleTable(rows, 'Form-2-Faculty-Profiles-JHCSC.xlsx', 'Form 2 Faculty');
}

export function exportForm3ToExcel(facultyList: any[] = []) {
  if (!facultyList || facultyList.length === 0) return;

  const rows = facultyList.map((f, idx) => {
    const ongoingTitles = (f.ongoingResearch || []).map((r: any) => r.research_title).filter(Boolean).join('; ');
    const ongoingYears = (f.ongoingResearch || []).map((r: any) => (r.year_started ? `SY ${r.year_started}` : '')).filter(Boolean).join('; ');
    const completedTitles = (f.completedResearch || []).map((r: any) => r.research_title).filter(Boolean).join('; ');
    const completedYears = (f.completedResearch || []).map((r: any) => r.year_completed || r.year_completed_raw || '').filter(Boolean).join('; ');
    const outputCitations = (f.completedResearch || [])
      .flatMap((r: any) => (r.outputs || []).map((o: any) => o.output_title_or_citation || o.output_type))
      .filter(Boolean)
      .join('; ');

    return {
      '#': idx + 1,
      'Campus': f.campus || '',
      'Department / School': f.department || '',
      'Faculty Name': f.name || '',
      'Academic Rank': f.academicRank || '',
      'Permanent': f.fullTimePermanent ? 'TRUE' : 'FALSE',
      'Contractual': f.fullTimeContractual ? 'TRUE' : 'FALSE',
      'Ongoing Research Title': ongoingTitles || '—',
      'Ongoing SY / Year Started': ongoingYears || '—',
      'Completed Research Title': completedTitles || '—',
      'Year Completed': completedYears || '—',
      'Outputs & Citations (Journal/Patent/Book)': outputCitations || '—',
      'Google Drive Evidence Folder': f.driveFolderUrl || '',
    };
  });

  exportSingleTable(rows, 'Form-3-Faculty-Research-Directory-JHCSC.xlsx', 'Form 3 Research');
}

export function exportForm5ToExcel(rows: any[], campusName = 'Main Campus') {
  if (!Array.isArray(rows) || rows.length === 0) return;
  const cleanCampus = campusName.replace(/[^a-zA-Z0-9]/g, '-');
  exportSingleTable(rows, `Form-5-Learning-Resources-${cleanCampus}.xlsx`, 'Form 5 Resources');
}

export function exportForm6ToExcel(rows: any[], campusName = 'Main Campus') {
  if (!Array.isArray(rows) || rows.length === 0) return;
  const cleanCampus = campusName.replace(/[^a-zA-Z0-9]/g, '-');
  exportSingleTable(rows, `Form-6-Student-Support-${cleanCampus}.xlsx`, 'Form 6 Support');
}

export function exportForm7ToExcel(rows: any[] = []) {
  if (!Array.isArray(rows) || rows.length === 0) return;
  exportSingleTable(rows, 'Form-7-Research-Linkages.xlsx', 'Form 7 Linkages');
}

export function exportForm8ToExcel(customRows?: any[]) {
  if (!customRows || customRows.length === 0) return;
  exportSingleTable(customRows, 'CHED-Form-U8-Outreach-Programs-JHCSC.xlsx', 'Form U8 Outreach');
}

export function exportFilteredProgramsToExcel(programs: any[], campusLabel: string) {
  if (!programs || programs.length === 0) return;
  const rows = programs.map((p) => ({
    'Campus': p.campus,
    'Program Code': p.code,
    'Program Name': p.programName || p.name,
    'Academic Level': p.level,
    'Complied Checks': p.compliedCount ?? p.compliedChecks ?? 0,
    'Total Checks': p.totalCount ?? p.totalChecks ?? 0,
    'Compliance Rate': `${p.compliancePercent ?? 0}%`,
  }));

  const cleanLabel = campusLabel.replace(/[^a-zA-Z0-9]/g, '-');
  exportSingleTable(rows, `Programs-Compliance-${cleanLabel}.xlsx`, 'Program Compliance');
}
