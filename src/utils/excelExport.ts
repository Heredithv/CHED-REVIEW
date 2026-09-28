import * as XLSX from 'xlsx';
import { siteContent } from '../data/siteContent';
import { requirementsPageData } from '../data/requirementsData';
import { form3PageData } from '../data/form3Data';
import { form4PageData } from '../data/form4Data';
import { programsPageData, ProgramItem } from '../data/programsData';

export function exportSingleTable(data: any[], fileName: string, sheetName: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  XLSX.writeFile(wb, fileName);
}

export function exportForm3ToExcel() {
  const rows: any[] = [];
  form3PageData.campuses.forEach(group => {
    group.schools.forEach(school => {
      rows.push({
        'Campus': group.campusName,
        'School / Unit': school.school,
        'Full-Time Faculty': school.fullTimeFaculty,
        'Ongoing Research Count': school.ongoingCount,
        'Ongoing Research %': `${school.ongoingPercent}%`,
        'Completed Research Count': school.completedCount,
        'Completed Research %': `${school.completedPercent}%`,
        'Both Count': school.bothCount,
        'Both %': `${school.bothPercent}%`
      });
    });
    rows.push({
      'Campus': group.campusName,
      'School / Unit': `${group.campusName} Total`,
      'Full-Time Faculty': group.total.fullTimeFaculty,
      'Ongoing Research Count': group.total.ongoingCount,
      'Ongoing Research %': `${group.total.ongoingPercent}%`,
      'Completed Research Count': group.total.completedCount,
      'Completed Research %': `${group.total.completedPercent}%`,
      'Both Count': group.total.bothCount,
      'Both %': `${group.total.bothPercent}%`
    });
  });

  rows.push({
    'Campus': 'ALL CAMPUSES',
    'School / Unit': 'Grand Total',
    'Full-Time Faculty': form3PageData.allCampusesTotal.fullTimeFaculty,
    'Ongoing Research Count': form3PageData.allCampusesTotal.ongoingCount,
    'Ongoing Research %': `${form3PageData.allCampusesTotal.ongoingPercent}%`,
    'Completed Research Count': form3PageData.allCampusesTotal.completedCount,
    'Completed Research %': `${form3PageData.allCampusesTotal.completedPercent}%`,
    'Both Count': form3PageData.allCampusesTotal.bothCount,
    'Both %': `${form3PageData.allCampusesTotal.bothPercent}%`
  });

  exportSingleTable(rows, form3PageData.exportFileName, form3PageData.sheetName);
}

export function exportForm4ToExcel() {
  const rows = form4PageData.records.map(r => ({
    'School Year': r.schoolYear,
    'Faculty Doing Research': r.facultyCount,
    'Expected Expenditure (PHP)': r.expected,
    'Actual Expenditure (PHP)': r.actual,
    'Difference (PHP)': r.difference,
    'Actual vs Expected': r.ratio
  }));

  exportSingleTable(rows, form4PageData.tableCard.exportFileName, form4PageData.tableCard.sheetName);
}

export function exportForm1ToExcel(programs: any[] = []) {
  if (!programs || programs.length === 0) {
    alert('No Form 1 program data available to export.');
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
      '5-Year Average': typeof r.averageEnrollment === 'number' ? r.averageEnrollment.toFixed(2) : (r.averageEnrollment || 0)
    };
  });

  exportSingleTable(rows, 'Form-1-Programs-And-Enrollment.xlsx', 'Form 1 Programs');
}

export function exportForm2ToExcel(facultyList: any[] = []) {
  if (!facultyList || facultyList.length === 0) return;
  const rows = facultyList.map(f => ({
    'Campus': f.campus || '',
    'Department / Program': f.department || f.schoolGroup || '',
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
    'Subject Assignments (SY 2024-2025)': f.sy2024_2025 || '',
    'Subject Assignments (SY 2025-2026)': f.sy2025_2026 || '',
    'Google Drive Folder': f.driveFolderUrl || ''
  }));
  exportSingleTable(rows, 'Form-2-Faculty-Profiles-JHCSC.xlsx', 'Form 2 Faculty');
}

export function exportForm5ToExcel(campus: string) {
  const rows = [
    { 'Requirement': 'Library — Vision, Mission, Goals', 'Evidence': 'view_link_to_evidence.pdf', 'Status': 'With evidence', 'Campus': campus },
    { 'Requirement': 'Library — Administration', 'Evidence': 'insert narrative description', 'Status': 'Pending', 'Campus': campus },
    { 'Requirement': 'Library — Collection Development', 'Evidence': 'collection-policy.pdf', 'Status': 'With evidence', 'Campus': campus },
    { 'Requirement': 'Online Academic Databases', 'Evidence': 'insert narrative description', 'Status': 'Pending', 'Campus': campus },
    { 'Requirement': 'Laboratories and Facilities', 'Evidence': 'lab-inventory-2026.pdf', 'Status': 'With evidence', 'Campus': campus }
  ];
  exportSingleTable(rows, `Form-5-Learning-Resources-${campus.replace(/\s+/g, '-')}.xlsx`, 'Form 5 Resources');
}

export function exportForm6ToExcel(campus: string) {
  const rows = [
    { 'Support Structure': '1. Counseling and Guidance Services', 'Description / Evidence': 'guidance-manual-2025.pdf', 'Status': 'With evidence', 'Campus': campus },
    { 'Support Structure': '2. Wellness and Recreation Facilities', 'Description / Evidence': 'facilities-inventory.pdf', 'Status': 'With evidence', 'Campus': campus },
    { 'Support Structure': '3. Student Information and Communication', 'Description / Evidence': 'insert narrative description', 'Status': 'Pending', 'Campus': campus },
    { 'Support Structure': '4. Student Organization and Activities', 'Description / Evidence': 'org-accreditation-list.pdf', 'Status': 'With evidence', 'Campus': campus },
    { 'Support Structure': 'Office of Student Affairs', 'Description / Evidence': 'osa-annual-report.pdf', 'Status': 'With evidence', 'Campus': campus },
    { 'Support Structure': 'Scholarship and Financial Assistance', 'Description / Evidence': 'insert narrative description', 'Status': 'Pending', 'Campus': campus }
  ];
  exportSingleTable(rows, `Form-6-Student-Support-${campus.replace(/\s+/g, '-')}.xlsx`, 'Form 6 Support');
}

export function exportForm7ToExcel() {
  const rows = [
    { 'Category': 'Research & Development', 'Partner Institution': 'Department of Agriculture — Bureau of Agricultural Research', 'Description': 'Crop-Land Suitability Assessment research partnership.', 'Duration': 'Nov 2021 – Jun 2023 · BS Agriculture' },
    { 'Category': 'Technology Transfer', 'Partner Institution': 'Jose Rizal Memorial State University (Siocon)', 'Description': 'Technology transfer, technology incubation.', 'Duration': 'Aug 2025 – Aug 2030' },
    { 'Category': 'Research, Development & Extension', 'Partner Institution': 'Jose Rizal Memorial State University', 'Description': 'Collaborative research, development and extension activities.', 'Duration': 'Aug 2025 – Aug 2030' },
    { 'Category': 'Research & Development', 'Partner Institution': 'Philippine Coconut Authority', 'Description': 'Seed Farm Development Project.', 'Duration': 'Oct 2024 – Oct 2059' }
  ];
  exportSingleTable(rows, 'Form-7-Research-Linkages.xlsx', 'Form 7 Linkages');
}

export function exportForm8ToExcel() {
  const rows = [
    { 'Program Title': 'Climate-Resilient Zampen Native Chicken Production', 'Description': 'Baseline vulnerability assessment and climate-resilient poultry production methods for farmers.', 'MOA / Partner': 'MOA: Katipunan, Mahayag, Mati', 'Target Community': 'Target: Poultry farmers and raisers', 'Expected Outcomes': 'Farmers aware of risks; improved climate-resilient production practices.' },
    { 'Program Title': 'E-PHARIAN Program', 'Description': 'Digital extension program supporting rural communities.', 'MOA / Partner': 'MOPA: Dumalinao', 'Target Community': 'Rural community participants', 'Expected Outcomes': 'Improved digital access and community services.' },
    { 'Program Title': 'AR & Attendance Project LAMDAG', 'Description': 'Augmented reality and smart attendance tracking system for schools.', 'MOA / Partner': 'N/A', 'Target Community': 'School communities', 'Expected Outcomes': 'Modernized attendance systems; improved school administration.' }
  ];
  exportSingleTable(rows, 'Form-8-Outreach-Programs.xlsx', 'Form 8 Outreach');
}

export function exportFilteredProgramsToExcel(programs: ProgramItem[], campusLabel: string) {
  const rows = programs.map(p => ({
    'Campus': p.campus,
    'Program Code': p.code,
    'Program Name': p.name,
    'Academic Level': p.level,
    'Complied Checks': p.status === 'Statement pending' ? 'Statement pending' : p.compliedChecks,
    'Total Checks': p.status === 'Statement pending' ? 'N/A' : p.totalChecks,
    'Compliance Rate': p.status === 'Statement pending' ? 'Pending' : `${Math.round((p.compliedChecks / p.totalChecks) * 100)}%`
  }));

  const cleanLabel = campusLabel.replace(/[^a-zA-Z0-9]/g, '-');
  exportSingleTable(rows, `Programs-Compliance-${cleanLabel}.xlsx`, 'Program Compliance');
}

export function downloadAllSiteData() {
  const wb = XLSX.utils.book_new();

  // 1. Overview
  const overviewRows = [
    { 'Metric / Parameter': 'Institution Name', 'Value': siteContent.collegeName },
    { 'Metric / Parameter': 'Legislation', 'Value': siteContent.actNumber },
    { 'Metric / Parameter': 'Audit Date', 'Value': siteContent.dataAsOf },
    { 'Metric / Parameter': 'Students Enrolled', 'Value': siteContent.hero.stats[0].value },
    { 'Metric / Parameter': 'Degree Programs', 'Value': siteContent.hero.stats[1].value },
    { 'Metric / Parameter': 'Full-Time Faculty', 'Value': siteContent.hero.stats[2].value },
    { 'Metric / Parameter': 'Campuses', 'Value': siteContent.hero.stats[3].value }
  ];
  const wsOverview = XLSX.utils.json_to_sheet(overviewRows);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

  // 2. Requirements
  const reqRows = requirementsPageData.requirements.map(r => ({
    'Item #': r.id,
    'Area': r.area,
    'Requirement': r.requirement,
    'College Statement': r.statement,
    'Status': r.statusLabel
  }));
  const wsReq = XLSX.utils.json_to_sheet(reqRows);
  XLSX.utils.book_append_sheet(wb, wsReq, 'CMO 46 Requirements');

  // 3. Form 3
  const form3Rows: any[] = [];
  form3PageData.campuses.forEach(group => {
    group.schools.forEach(school => {
      form3Rows.push({
        'Campus': group.campusName,
        'School': school.school,
        'Full-Time Faculty': school.fullTimeFaculty,
        'Ongoing': school.ongoingCount,
        'Ongoing %': `${school.ongoingPercent}%`,
        'Completed': school.completedCount,
        'Completed %': `${school.completedPercent}%`,
        'Both': school.bothCount,
        'Both %': `${school.bothPercent}%`
      });
    });
  });
  const wsForm3 = XLSX.utils.json_to_sheet(form3Rows);
  XLSX.utils.book_append_sheet(wb, wsForm3, 'Form 3 Research');

  // 4. Form 4
  const form4Rows = form4PageData.records.map(r => ({
    'School Year': r.schoolYear,
    'Faculty Doing Research': r.facultyCount,
    'Expected Spending': r.expected,
    'Actual Spending': r.actual,
    'Difference': r.difference,
    'Multiplier': r.ratio
  }));
  const wsForm4 = XLSX.utils.json_to_sheet(form4Rows);
  XLSX.utils.book_append_sheet(wb, wsForm4, 'Form 4 Spending');

  // 5. Programs
  const progRows = programsPageData.programs.map(p => ({
    'Campus': p.campus,
    'Code': p.code,
    'Program Name': p.name,
    'Level': p.level,
    'Complied Checks': p.status === 'Statement pending' ? 'Statement pending' : p.compliedChecks,
    'Total Checks': p.status === 'Statement pending' ? 'N/A' : p.totalChecks,
    'Compliance %': p.status === 'Statement pending' ? 'Pending' : `${Math.round((p.compliedChecks / p.totalChecks) * 100)}%`
  }));
  const wsProg = XLSX.utils.json_to_sheet(progRows);
  XLSX.utils.book_append_sheet(wb, wsProg, 'Programs Compliance');

  XLSX.writeFile(wb, 'JHCSC-Road-To-University-Status-Complete-Data.xlsx');
}
