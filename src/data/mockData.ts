/**
 * Realistic compliance review dataset for J.H. Cerilles State College (JHCSC)
 * University Conversion under Republic Act No. 12295
 * Aligned with CHED CMO No. 46, Series of 2012
 */

export interface Campus {
  id: string;
  code: string;
  name: string;
  location: string;
  established: number;
  total_enrollment: number;
  faculty_count: number;
  programs_count: number;
  lead_officer: string;
}

export interface InstitutionalFormSummary {
  form_id: string;
  code: string;
  title: string;
  cmo_area: string;
  compliance_status: 'Complied' | 'Not complied' | 'Pending submission';
  last_updated: string;
  focal_person: string;
  kpi_summary: string;
  description: string;
}

export interface CMORequirement {
  id: string;
  area_number: number;
  area_name: string;
  cmo_standard: string;
  jhcsc_compliance_statement: string;
  chedro_remarks: string;
  compliance_status: 'Complied' | 'Not complied' | 'Pending submission';
  associated_form: string;
  evidence_code: string;
  evidence_title: string;
  evidence_url: string;
}

export interface Form4Expenditure {
  id: string;
  fiscal_year: string;
  campus_id: string;
  campus_name: string;
  budget_line: string;
  allocated_php: number;
  disbursed_php: number;
  institutional_budget_share_pct: number;
  funding_source: string;
  research_focus: string;
  status: 'Complied' | 'Not complied' | 'Pending submission';
  evidence_code: string;
  evidence_title: string;
  evidence_url: string;
}

export interface Form4FundingGrant {
  id: string;
  grant_code: string;
  project_title: string;
  funding_agency: string;
  project_leader: string;
  campus_name: string;
  approved_budget_php: number;
  amount_received_php: number;
  duration_period: string;
  status: 'Complied' | 'Not complied' | 'Pending submission';
  deliverables_summary: string;
  evidence_url: string;
}

export interface AcademicProgram {
  id: string;
  code: string;
  name: string;
  campus_id: string;
  campus_name: string;
  level: 'Undergraduate' | 'Graduate';
  degree_type: 'Baccalaureate' | 'Master' | 'Doctorate' | 'Diploma';
  copc_status: 'Complied' | 'Not complied' | 'Pending submission';
  copc_number: string;
  copc_issuance_date: string;
  accreditation_level: string;
  enrolled_students: number;
  faculty_assigned: number;
  evidence_code: string;
  evidence_title: string;
  evidence_url: string;
}

export interface EvidenceLink {
  id: string;
  code: string;
  title: string;
  category: string;
  form_reference: string;
  file_type: string;
  file_size: string;
  url: string;
  date_verified: string;
}

export const CAMPUSES: Campus[] = [
  {
    id: 'camp-main',
    code: 'MAIN',
    name: 'Main Campus',
    location: 'Mati, San Miguel, Zamboanga del Sur',
    established: 2001,
    total_enrollment: 6850,
    faculty_count: 148,
    programs_count: 16,
    lead_officer: 'Dr. Edgardo H. Rosales (College President)'
  },
  {
    id: 'camp-dum',
    code: 'DUM',
    name: 'Dumingag Campus',
    location: 'Dumingag, Zamboanga del Sur',
    established: 1993,
    total_enrollment: 3920,
    faculty_count: 86,
    programs_count: 10,
    lead_officer: 'Dr. Jerry B. Superales (Campus Director)'
  },
  {
    id: 'camp-pag',
    code: 'PAG',
    name: 'Pagadian City Campus',
    location: 'Balangasan District, Pagadian City, Zamboanga del Sur',
    established: 2003,
    total_enrollment: 3100,
    faculty_count: 72,
    programs_count: 8,
    lead_officer: 'Dr. Mary Ann P. Gomez (Campus Director)'
  },
  {
    id: 'camp-cmse',
    code: 'CMSE',
    name: 'Canuto MS Enerio (CMSE) Campus',
    location: 'Poblacion, Lakewood, Zamboanga del Sur',
    established: 1998,
    total_enrollment: 950,
    faculty_count: 36,
    programs_count: 4,
    lead_officer: 'Prof. Romeo A. Sanchez (Campus Administrator)'
  }
];

export const INSTITUTIONAL_SUMMARY = {
  institution_name: 'J.H. Cerilles State College',
  target_university_name: 'Zamboanga del Sur State University',
  legal_basis: 'Republic Act No. 12295',
  evaluation_standard: 'CHED Memorandum Order No. 46, Series of 2012',
  data_as_of: 'Nov 4, 2026',
  total_enrollment: 14820,
  undergraduate_enrollment: 13950,
  graduate_enrollment: 870,
  total_programs: 38,
  undergraduate_programs: 31,
  graduate_programs: 7,
  full_time_faculty: 342,
  faculty_with_doctorate: 94,
  faculty_with_masters: 198,
  faculty_with_bachelors: 50,
  campuses_count: 4,
  total_research_expenditure_5yr: 48650000,
  average_annual_rd_percentage: 6.84, // Exceeds 5.0% threshold
  ched_min_rd_percentage: 5.0,
  external_grants_secured: 31200000,
  copc_compliance_rate: 89.47 // 34 out of 38 programs
};

export const INSTITUTIONAL_FORMS: InstitutionalFormSummary[] = [
  {
    form_id: 'form-1',
    code: 'Form 1',
    title: 'Programs & Enrollment Profile',
    cmo_area: 'Area I & II: Enrollment Trends and Program Standards',
    compliance_status: 'Complied',
    last_updated: '2026-03-20',
    focal_person: 'Office of the College Registrar / VPAA',
    kpi_summary: '14,820 Students · 38 Programs · 89.5% COPC Coverage',
    description: 'Five-year longitudinal enrollment data (SY 2021-2026), authority to operate, COPC statuses, and research course inventories.'
  },
  {
    form_id: 'form-2',
    code: 'Form 2',
    title: 'Faculty Qualifications & Distribution',
    cmo_area: 'Area III: Faculty Profile & Academic Qualifications',
    compliance_status: 'Complied',
    last_updated: '2026-03-18',
    focal_person: 'Human Resource Management Office (HRMO)',
    kpi_summary: '342 Full-Time Faculty · 85.4% Post-Graduate Degrees',
    description: 'Faculty distribution by rank, employment tenure, doctoral/masteral qualifications, and discipline assignments.'
  },
  {
    form_id: 'form-3',
    code: 'Form 3',
    title: 'Research Culture & Scholarly Outputs',
    cmo_area: 'Area IV: Research, Development, and Extension (RDE)',
    compliance_status: 'Complied',
    last_updated: '2026-03-21',
    focal_person: 'Office of Research and Extension (ORE)',
    kpi_summary: '112 Scopus/CHED-Indexed Publications · 18 Active Patents',
    description: 'Peer-reviewed scholarly publications, ongoing multidisciplinary projects, faculty research participation rates, and institutional IP registrations.'
  },
  {
    form_id: 'form-4',
    code: 'Form 4',
    title: 'Research Expenditures & External Funding',
    cmo_area: 'Area V: Research Investment & Sustainability',
    compliance_status: 'Complied',
    last_updated: '2026-03-24',
    focal_person: 'Financial Management Services & Research Accounting',
    kpi_summary: '₱48.65M Total 5-Yr R&D · 6.84% Budget Share · ₱31.2M Grants',
    description: 'Annual R&D allocation, audited disbursement breakdown vs 5% statutory threshold, and external counterpart grants.'
  },
  {
    form_id: 'form-5',
    code: 'Form 5',
    title: 'Learning Resources & Laboratory Facilities',
    cmo_area: 'Area VI: Library, Digital, and Laboratory Holdings',
    compliance_status: 'Complied',
    last_updated: '2026-03-15',
    focal_person: 'Learning Resource Center & Campus Laboratories',
    kpi_summary: '42,800 Physical Volumes · 14 Scopus/ScienceDirect Subscriptions',
    description: 'Library holdings, digital research access, science laboratories, smart classrooms, and IT infrastructure per campus.'
  },
  {
    form_id: 'form-6',
    code: 'Form 6',
    title: 'Student Services & Support Structures',
    cmo_area: 'Area VII: Student Affairs, Guidance, and Health Services',
    compliance_status: 'Complied',
    last_updated: '2026-03-19',
    focal_person: 'Office of Student Affairs and Services (OSAS)',
    kpi_summary: '100% Operational Guidance Clinics · 4 Campus Infirmaries',
    description: 'Institutional support units, guidance & psychological services, career placement, student housing, and sports facilities.'
  },
  {
    form_id: 'form-7',
    code: 'Form 7',
    title: 'Institutional Linkages & Partnerships',
    cmo_area: 'Area VIII: National & Global Collaborative Linkages',
    compliance_status: 'Complied',
    last_updated: '2026-03-22',
    focal_person: 'Internationalization & External Affairs Office',
    kpi_summary: '46 Active MOAs/MOUs · 12 SUC Consortia · 6 International Partners',
    description: 'Academic collaborations, research consortiums, student internship MoUs, and bilateral faculty exchange agreements.'
  },
  {
    form_id: 'form-8',
    code: 'Form 8',
    title: 'Community Outreach & Extension Programs',
    cmo_area: 'Area VIII: Community Extension & Impact Services',
    compliance_status: 'Complied',
    last_updated: '2026-03-23',
    focal_person: 'Directorate of Community Extension Services',
    kpi_summary: '28 Adopted Municipal Barangays · 8,420 Beneficiaries',
    description: 'Sustainable community development projects, livelihood technology transfer, literacy interventions, and environmental stewardship.'
  }
];

export const CMO_REQUIREMENTS: CMORequirement[] = [
  {
    id: 'cmo-1',
    area_number: 1,
    area_name: 'Degree of Enrollment (Area I)',
    cmo_standard: 'A state university must demonstrate sustained institutional enrollment with a minimum of 5,000 students enrolled across diverse disciplines, including a vibrant post-graduate program component (at least 5% of student population).',
    jhcsc_compliance_statement: 'JHCSC has a total headcount of 14,820 students across four strategic campuses in Zamboanga del Sur (SY 2025-2026). The graduate school currently enrolls 870 students (5.87% of total population), satisfying the graduate density standard.',
    chedro_remarks: 'Validated against CHED Regional Office IX Higher Education Management Information System (HEMIS). Enrollment count exceeds minimum requirements by 196%. Graduate enrollment ratio meets the 5% threshold.',
    compliance_status: 'Complied',
    associated_form: 'Form 1',
    evidence_code: 'EV-ENR-2026-01',
    evidence_title: 'CHED HEMIS Certified Enrolment Summary SY 2021-2026',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'cmo-2',
    area_number: 2,
    area_name: 'Program Accreditation & COPC (Area II)',
    cmo_standard: 'At least 80% of mandated degree programs must have valid Certificate of Program Compliance (COPC) and recognized accreditation from AACCUP (minimum Level II Re-accredited status).',
    jhcsc_compliance_statement: '34 out of 38 active academic programs (89.47%) possess valid COPCs issued by the CHED Regional Office IX. 26 programs maintain Level II or Level III AACCUP accreditation status, with Agriculture and Education programs undergoing Level IV survey.',
    chedro_remarks: 'CHEDRO IX Technical Division confirms issuance of 34 COPCs. The 4 remaining programs are newly instituted Bachelor of Science in Data Analytics and Nursing programs, which are currently on candidate status awaiting final site visit inspection.',
    compliance_status: 'Complied',
    associated_form: 'Form 1',
    evidence_code: 'EV-PROG-COPC-88',
    evidence_title: 'CHEDRO IX Issued COPC Certificates and AACCUP Accreditations',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'cmo-3',
    area_number: 3,
    area_name: 'Faculty Profile & Qualifications (Area III)',
    cmo_standard: 'At least 70% of full-time faculty members must hold relevant master\'s degrees, and at least 20% must possess earned doctorate degrees from recognized higher education institutions in their fields of specialization.',
    jhcsc_compliance_statement: 'JHCSC employs 342 permanent, full-time faculty members. 94 hold earned doctorates (27.48%), and 198 hold earned master\'s degrees (57.89%). Together, 85.38% of full-time faculty possess post-graduate degrees, with zero contractual faculty holding lower than bachelor qualifications.',
    chedro_remarks: 'Faculty rosters verified against Civil Service Commission Plantilla of Personnel and authenticated transcripts/diplomas. The 27.48% doctorate ratio exceeds the 20% minimum threshold for university conversion.',
    compliance_status: 'Complied',
    associated_form: 'Form 2',
    evidence_code: 'EV-FAC-HR-342',
    evidence_title: 'CSC Plantilla of Permanent Faculty & Authenticated Degree Registry',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'cmo-4',
    area_number: 4,
    area_name: 'Research Culture & Scholarly Outputs (Area IV)',
    cmo_standard: 'An established research culture with regular budgetary allocation, faculty research incentives, and verified publications in internationally indexed journals (Scopus, Web of Science, or CHED-recognized peer-reviewed journals).',
    jhcsc_compliance_statement: 'The institution has recorded 112 peer-reviewed scholarly publications over the preceding 5 years, of which 68 are indexed in Scopus/WoS journals. The college operates four specialized research centers and maintains 18 registered intellectual property assets (patents and utility models) with the Intellectual Property Office of the Philippines (IPOPHL).',
    chedro_remarks: 'Publication metadata independently authenticated via Scopus Author IDs and IPOPHL official registry records. Faculty research engagement demonstrated across all constituent campuses.',
    compliance_status: 'Complied',
    associated_form: 'Form 3',
    evidence_code: 'EV-RES-PUB-112',
    evidence_title: 'Authenticated Journal Publication Index & IPOPHL Patent Certificates',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'cmo-5',
    area_number: 5,
    area_name: 'Research Expenditures & Funding (Area V)',
    cmo_standard: 'The institution must allocate and expend at least 5% of its total annual operating budget exclusively for Research, Development, and Extension (RDE) programs and demonstrate capacity to attract external research grants.',
    jhcsc_compliance_statement: 'JHCSC has maintained an average annual research expenditure ratio of 6.84% over the last five fiscal years (FY 2021-2025), totaling ₱48,650,000 in institutional funds. In addition, the college has secured ₱31,200,000 in competitive external grants from DOST, CHED-DARE-TO, and the Department of Agriculture.',
    chedro_remarks: 'Commission on Audit (COA) Annual Audit Reports (AAR) and institutional financial statements corroborate annual R&D obligations and disbursements. The 6.84% expenditure percentage complies with and surpasses the 5% threshold.',
    compliance_status: 'Complied',
    associated_form: 'Form 4',
    evidence_code: 'EV-FIN-COA-2025',
    evidence_title: 'COA Audited Financial Statements and Budget Allocations for R&D (FY 2021-2025)',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'cmo-6',
    area_number: 6,
    area_name: 'Learning Resources & Library Holdings (Area VI)',
    cmo_standard: 'Adequate, modern, and accessible learning resources, including comprehensive physical and digital libraries, high-speed campus connectivity, science laboratories, and ICT-enabled learning spaces.',
    jhcsc_compliance_statement: 'The college learning resource system houses 42,800 professional and academic book titles across 4 campuses, augmented by campus-wide subscriptions to ScienceDirect, Scopus, EBSCOhost, and Philippine E-Journals. Each campus operates modern laboratories complying with safety guidelines.',
    chedro_remarks: 'Library holdings inspect report submitted and verified. All campuses connected via high-bandwidth fiber optic connection under DICT GovNet. Science laboratories meet CHED technical committee minimum equipment inventories.',
    compliance_status: 'Complied',
    associated_form: 'Form 5',
    evidence_code: 'EV-LIB-RES-42K',
    evidence_title: 'Library Holdings Inventory and Digital Database Subscription Invoices',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'cmo-7',
    area_number: 7,
    area_name: 'Student Support Services & Structures (Area VII)',
    cmo_standard: 'Comprehensive student services including licensed guidance counseling (1:1000 ratio), medical and dental clinics, disability accessibility, alumni relations, and student welfare organizations.',
    jhcsc_compliance_statement: 'Full student affairs offices are operational on all four campuses with licensed guidance counselors, full-time medical doctors and registered nurses, student disaster risk units, active Supreme Student Council, and institutionalized scholarship support.',
    chedro_remarks: 'On-site physical audit verified clinic facilities, medicine stocks, guidance offices, and student multi-purpose centers. Institutional student services meet CMO 09 s. 2013 standards.',
    compliance_status: 'Complied',
    associated_form: 'Form 6',
    evidence_code: 'EV-SAS-CLINIC-09',
    evidence_title: 'OSAS Organizational Structure, Counselor PRC Licenses, and Clinic Permits',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'cmo-8',
    area_number: 8,
    area_name: 'Linkages & Community Outreach (Area VIII)',
    cmo_standard: 'Active bilateral partnerships with industry, local government units, research institutes, and foreign universities, alongside sustained extension programs that measurably benefit marginalized host communities.',
    jhcsc_compliance_statement: 'JHCSC holds 46 active Memoranda of Agreement (MOAs), including partnerships with IRRI, SEARCA, DOST IX, Provincial Government of Zamboanga del Sur, and 6 Southeast Asian universities. The college maintains 28 adopted barangays with monitored technology livelihood projects.',
    chedro_remarks: 'Notarized MOAs and MoUs reviewed. Community extension terminal reports demonstrate documented livelihood adoption in rubber processing, cacao propagation, and IT literacy in indigenous Subanen communities.',
    compliance_status: 'Complied',
    associated_form: 'Form 7 & 8',
    evidence_code: 'EV-LNK-EXT-46',
    evidence_title: 'Notarized Partnership MOAs & Community Extension Impact Reports',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  }
];

export const FORM4_RESEARCH_EXPENDITURES: Form4Expenditure[] = [
  {
    id: 'exp-2025-01',
    fiscal_year: 'FY 2025',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    budget_line: 'Personnel Services & Research Honoraria',
    allocated_php: 3800000,
    disbursed_php: 3750000,
    institutional_budget_share_pct: 7.20,
    funding_source: 'GAA Institutional Fund (Fund 101)',
    research_focus: 'Biodiversity, Indigenous Forest Conservation & IT Systems',
    status: 'Complied',
    evidence_code: 'EV-F4-2025-01',
    evidence_title: 'FY 2025 COA Disbursed Research Honoraria and Personnel Vouchers',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'exp-2025-02',
    fiscal_year: 'FY 2025',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    budget_line: 'Maintenance and Other Operating Expenses (MOOE)',
    allocated_php: 4200000,
    disbursed_php: 4120000,
    institutional_budget_share_pct: 7.20,
    funding_source: 'Special Trust Fund / Fiduciary (Fund 164)',
    research_focus: 'International Scopus Journal Publication Subsidies & Patent Fees',
    status: 'Complied',
    evidence_code: 'EV-F4-2025-02',
    evidence_title: 'FY 2025 Publication Incentive Liquidation and IPOPHL Official Receipts',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'exp-2025-03',
    fiscal_year: 'FY 2025',
    campus_id: 'camp-dum',
    campus_name: 'Dumingag Campus',
    budget_line: 'Capital Outlay (CO) - Agri-Tech Research Equipment',
    allocated_php: 2500000,
    disbursed_php: 2480000,
    institutional_budget_share_pct: 7.10,
    funding_source: 'GAA Capital Outlay Allocation',
    research_focus: 'Smart Organic Farming, Soil Chemistry & Crop Gene Bank',
    status: 'Complied',
    evidence_code: 'EV-F4-2025-03',
    evidence_title: 'Inspection and Acceptance Report (IAR) for Agri-Laboratory Equipment',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'exp-2025-04',
    fiscal_year: 'FY 2025',
    campus_id: 'camp-pag',
    campus_name: 'Pagadian City Campus',
    budget_line: 'Research Conferences, Dissemination & Data Analytics',
    allocated_php: 1400000,
    disbursed_php: 1380000,
    institutional_budget_share_pct: 6.90,
    funding_source: 'Special Trust Fund (Fund 164)',
    research_focus: 'Criminology, Urban Governance & MSME Business Analytics',
    status: 'Complied',
    evidence_code: 'EV-F4-2025-04',
    evidence_title: 'Official Conference Registration and Presentation Certificates',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'exp-2025-05',
    fiscal_year: 'FY 2025',
    campus_id: 'camp-cmse',
    campus_name: 'Canuto MS Enerio (CMSE) Campus',
    budget_line: 'Limnological and Freshwater Aquatic Research MOOE',
    allocated_php: 950000,
    disbursed_php: 920000,
    institutional_budget_share_pct: 6.50,
    funding_source: 'Institutional Research Allocation',
    research_focus: 'Lake Wood Endemic Fishery Sustainability & Water Quality',
    status: 'Complied',
    evidence_code: 'EV-F4-2025-05',
    evidence_title: 'Water Quality Field Testing Disbursement Liquidation',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'exp-2024-01',
    fiscal_year: 'FY 2024',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    budget_line: 'Faculty Research Grants & Project Seed Funds',
    allocated_php: 3500000,
    disbursed_php: 3450000,
    institutional_budget_share_pct: 6.95,
    funding_source: 'GAA Institutional Fund (Fund 101)',
    research_focus: 'Climate Resilient Agriculture & Environmental Modeling',
    status: 'Complied',
    evidence_code: 'EV-F4-2024-01',
    evidence_title: 'FY 2024 BOR Approved Research Proposal Grants and Contracts',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'exp-2024-02',
    fiscal_year: 'FY 2024',
    campus_id: 'camp-dum',
    campus_name: 'Dumingag Campus',
    budget_line: 'Agro-Forestry Field Trial Stations & MOOE',
    allocated_php: 2200000,
    disbursed_php: 2150000,
    institutional_budget_share_pct: 6.95,
    funding_source: 'Fund 164 Fiduciary Fund',
    research_focus: 'High-Value Rubber & Cacao Clonal Propagation Research',
    status: 'Complied',
    evidence_code: 'EV-F4-2024-02',
    evidence_title: 'Agricultural Experimental Nursery Procurement and Audited Vouchers',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'exp-2024-03',
    fiscal_year: 'FY 2024',
    campus_id: 'camp-pag',
    campus_name: 'Pagadian City Campus',
    budget_line: 'Socio-Economic & Forensic Research Equipment',
    allocated_php: 1800000,
    disbursed_php: 1760000,
    institutional_budget_share_pct: 6.80,
    funding_source: 'GAA Institutional Budget',
    research_focus: 'Forensic Ballistics Software & Criminalistics Research Lab',
    status: 'Complied',
    evidence_code: 'EV-F4-2024-03',
    evidence_title: 'Forensic Software Licensing and COA Acceptance Documents',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'exp-2024-04',
    fiscal_year: 'FY 2024',
    campus_id: 'camp-cmse',
    campus_name: 'Canuto MS Enerio (CMSE) Campus',
    budget_line: 'Community Watershed and Ecological Research MOOE',
    allocated_php: 800000,
    disbursed_php: 780000,
    institutional_budget_share_pct: 6.40,
    funding_source: 'Institutional Research Allocation',
    research_focus: 'Lake Wood Protected Basin Eco-Tourism Impact Study',
    status: 'Complied',
    evidence_code: 'EV-F4-2024-04',
    evidence_title: 'Community Ecological Assessment Research Field Receipts',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'exp-2023-01',
    fiscal_year: 'FY 2023',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    budget_line: 'Institutional Research Grants and Publication Incentives',
    allocated_php: 3200000,
    disbursed_php: 3120000,
    institutional_budget_share_pct: 6.75,
    funding_source: 'GAA Institutional Fund (Fund 101)',
    research_focus: 'Renewable Solar Integration & Microgrid Engineering',
    status: 'Complied',
    evidence_code: 'EV-F4-2023-01',
    evidence_title: 'FY 2023 BOR Resolution on Research Incentive Guidelines',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'exp-2023-02',
    fiscal_year: 'FY 2023',
    campus_id: 'camp-dum',
    campus_name: 'Dumingag Campus',
    budget_line: 'Livestock Genetics & Feed Formulation Facilities',
    allocated_php: 2000000,
    disbursed_php: 1950000,
    institutional_budget_share_pct: 6.70,
    funding_source: 'Special Trust Fund (Fund 164)',
    research_focus: 'Native Chicken Genetic Conservation & Organic Forage Trials',
    status: 'Complied',
    evidence_code: 'EV-F4-2023-02',
    evidence_title: 'Livestock Center Research Disbursed Invoices and Audit Clearance',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'exp-2023-03',
    fiscal_year: 'FY 2023',
    campus_id: 'camp-pag',
    campus_name: 'Pagadian City Campus',
    budget_line: 'Digital Library & Research Database Subscriptions',
    allocated_php: 1500000,
    disbursed_php: 1480000,
    institutional_budget_share_pct: 6.60,
    funding_source: 'Institutional Research Allocation',
    research_focus: 'Multidisciplinary Database Access & Statistical Tooling (SPSS/NVivo)',
    status: 'Complied',
    evidence_code: 'EV-F4-2023-03',
    evidence_title: 'Official Invoices for Elsevier Scopus & Statistical Licenses',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'exp-2023-04',
    fiscal_year: 'FY 2023',
    campus_id: 'camp-cmse',
    campus_name: 'Canuto MS Enerio (CMSE) Campus',
    budget_line: 'Indigenous Cultural Heritage Field Research',
    allocated_php: 750000,
    disbursed_php: 730000,
    institutional_budget_share_pct: 6.30,
    funding_source: 'Institutional Research Allocation',
    research_focus: 'Subanen Oral Lore, Ethnobotany & Cultural Preservation',
    status: 'Complied',
    evidence_code: 'EV-F4-2023-04',
    evidence_title: 'NCIP Free and Prior Informed Consent (FPIC) Documentation',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'exp-2022-01',
    fiscal_year: 'FY 2022',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    budget_line: 'Post-Pandemic Educational Recovery Research Grants',
    allocated_php: 2900000,
    disbursed_php: 2850000,
    institutional_budget_share_pct: 6.65,
    funding_source: 'GAA Fund 101',
    research_focus: 'Flexible Learning Pedagogies & Educational Diagnostics',
    status: 'Complied',
    evidence_code: 'EV-F4-2022-01',
    evidence_title: 'FY 2022 Disbursed Educational Research Grants Liquidation',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'exp-2022-02',
    fiscal_year: 'FY 2022',
    campus_id: 'camp-dum',
    campus_name: 'Dumingag Campus',
    budget_line: 'Food Processing Laboratory Refurbishment & Supplies',
    allocated_php: 1800000,
    disbursed_php: 1780000,
    institutional_budget_share_pct: 6.60,
    funding_source: 'Fund 164',
    research_focus: 'Post-Harvest Cassava & Sweet Potato Commercial Processing',
    status: 'Complied',
    evidence_code: 'EV-F4-2022-02',
    evidence_title: 'Food Innovation Center Equipment Procurement and COA Vouchers',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'exp-2021-01',
    fiscal_year: 'FY 2021',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    budget_line: 'Institutional Research Seed Fund & Publication Fees',
    allocated_php: 2600000,
    disbursed_php: 2540000,
    institutional_budget_share_pct: 6.45,
    funding_source: 'GAA Institutional Budget',
    research_focus: 'Institutional Policy, Public Administration & Science Education',
    status: 'Complied',
    evidence_code: 'EV-F4-2021-01',
    evidence_title: 'COA Audited Research Summary for FY 2021',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'exp-2021-02',
    fiscal_year: 'FY 2021',
    campus_id: 'camp-dum',
    campus_name: 'Dumingag Campus',
    budget_line: 'Agri-Ecological Field Trials MOOE',
    allocated_php: 1550000,
    disbursed_php: 1510000,
    institutional_budget_share_pct: 6.40,
    funding_source: 'Fund 164 Fiduciary',
    research_focus: 'Organic Bio-Fertilizer Trials on Upland Rice Cultivars',
    status: 'Complied',
    evidence_code: 'EV-F4-2021-02',
    evidence_title: 'FY 2021 Organic Bio-Fertilizer Project Liquidation Documents',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  }
];

export const FORM4_RESEARCH_FUNDING: Form4FundingGrant[] = [
  {
    id: 'grant-01',
    grant_code: 'DOST-PCAARRD-2024-09',
    project_title: 'Development of Precision Agro-Climatic Decision Support System for Rubber Smallholders in Zamboanga Peninsula',
    funding_agency: 'DOST - PCAARRD',
    project_leader: 'Dr. Jerry B. Superales',
    campus_name: 'Dumingag Campus',
    approved_budget_php: 7850000,
    amount_received_php: 7850000,
    duration_period: '2024-2026 (24 Months)',
    status: 'Complied',
    deliverables_summary: 'Weather sensor deployment across 12 rubber cooperatives; mobile farmer advisory app completed.',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'grant-02',
    grant_code: 'CHED-DARE-TO-2023-14',
    project_title: 'Enhancement of Research and Innovation Ecosystem for Zamboanga del Sur State College Conversion',
    funding_agency: 'Commission on Higher Education (CHED Central Office)',
    project_leader: 'Dr. Edgardo H. Rosales / Dr. Mary Ann Gomez',
    campus_name: 'Main Campus',
    approved_budget_php: 9500000,
    amount_received_php: 9500000,
    duration_period: '2023-2025 (24 Months)',
    status: 'Complied',
    deliverables_summary: 'Faculty Scopus publication coaching, research equipment upgrades, and laboratory modernization.',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'grant-03',
    grant_code: 'DA-BAR-RDE-2024-03',
    project_title: 'Sustainable Production and Value-Adding of Indigenous Tubers and Root Crops in Upland Communities',
    funding_agency: 'Department of Agriculture - Bureau of Agricultural Research (DA-BAR)',
    project_leader: 'Prof. Aniceta C. Morales',
    campus_name: 'Dumingag Campus',
    approved_budget_php: 4650000,
    amount_received_php: 4650000,
    duration_period: '2024-2025 (18 Months)',
    status: 'Complied',
    deliverables_summary: 'Processing protocols for sweet potato flour; 3 community micro-enterprises launched.',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'grant-04',
    grant_code: 'LGU-ZDS-RES-2024-01',
    project_title: 'Provincial Baseline Mapping and GIS Risk Assessment of Flood-Prone Agricultural Basins in Zamboanga del Sur',
    funding_agency: 'Provincial Government of Zamboanga del Sur',
    project_leader: 'Engr. Michael T. Tan',
    campus_name: 'Pagadian City Campus',
    approved_budget_php: 3800000,
    amount_received_php: 3800000,
    duration_period: '2024-2025 (12 Months)',
    status: 'Complied',
    deliverables_summary: 'Provincial GIS hazard atlas submitted and adopted by Provincial DRRMO Council.',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'grant-05',
    grant_code: 'DOST-IX-SETUP-2025-07',
    project_title: 'Modernization of JHCSC Cacao Fermentation and Solar Tunnel Drying Research Facility',
    funding_agency: 'DOST Regional Office IX',
    project_leader: 'Dr. Jerry B. Superales',
    campus_name: 'Dumingag Campus',
    approved_budget_php: 3200000,
    amount_received_php: 3200000,
    duration_period: '2025-2026 (12 Months)',
    status: 'Complied',
    deliverables_summary: 'Commercial grade solar dryer installed; tablea sensory and microbial laboratory operational.',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'grant-06',
    grant_code: 'DENR-FMB-2024-11',
    project_title: 'Biodiversity Assessment and Carrying Capacity Study of Lake Wood Freshwater Ecosystem and Surrounding Watershed',
    funding_agency: 'DENR - Forest Management Bureau & PAWB',
    project_leader: 'Prof. Romeo A. Sanchez',
    campus_name: 'Canuto MS Enerio (CMSE) Campus',
    approved_budget_php: 2200000,
    amount_received_php: 2200000,
    duration_period: '2024-2025 (12 Months)',
    status: 'Complied',
    deliverables_summary: 'Comprehensive ichthyological and floral inventory published; Lake Wood co-management plan endorsed.',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  }
];

export const EVIDENCE_LINKS: EvidenceLink[] = [
  {
    id: 'ev-1',
    code: 'EV-FIN-COA-2025',
    title: 'COA Audited Financial Statements and Budget Allocations for R&D (FY 2021-2025)',
    category: 'Form 4 Research Expenditures',
    form_reference: 'Form 4',
    file_type: 'PDF / Verified Official Stamp',
    file_size: '4.8 MB',
    url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing',
    date_verified: '2026-03-24'
  },
  {
    id: 'ev-2',
    code: 'EV-F4-GRANTS-SUMMARY',
    title: 'External Research Grants Portfolio (DOST, CHED, DA-BAR, LGU MOAs & Bank Confirmations)',
    category: 'Form 4 Research Funding',
    form_reference: 'Form 4',
    file_type: 'PDF Portfolio',
    file_size: '12.4 MB',
    url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing',
    date_verified: '2026-03-22'
  },
  {
    id: 'ev-3',
    code: 'EV-BOR-RES-12295',
    title: 'Board of Trustees Resolutions and University Conversion Roadmap Compliance Dossier',
    category: 'Institutional Mandate',
    form_reference: 'Overview',
    file_type: 'PDF',
    file_size: '8.1 MB',
    url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing',
    date_verified: '2026-03-20'
  },
  {
    id: 'ev-4',
    code: 'EV-PROG-COPC-88',
    title: 'CHEDRO IX Certificates of Program Compliance (COPC) Bundle - 34 Programs',
    category: 'Form 1 Academic Programs',
    form_reference: 'Form 1',
    file_type: 'PDF Bundle',
    file_size: '32.6 MB',
    url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing',
    date_verified: '2026-03-15'
  },
  {
    id: 'ev-5',
    code: 'EV-FAC-HR-342',
    title: 'Certified Plantilla of 342 Permanent Faculty with Masteral & Doctoral Transcript Validations',
    category: 'Form 2 Faculty Profile',
    form_reference: 'Form 2',
    file_type: 'PDF Bundle',
    file_size: '18.9 MB',
    url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing',
    date_verified: '2026-03-18'
  },
  {
    id: 'ev-6',
    code: 'EV-RES-PUB-112',
    title: 'Scholarly Publication Compendium (Scopus, WoS, CHED Recognitions) & IPOPHL Certificates',
    category: 'Form 3 Research Outputs',
    form_reference: 'Form 3',
    file_type: 'PDF Compendium',
    file_size: '22.0 MB',
    url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing',
    date_verified: '2026-03-21'
  }
];

export const ANNUAL_EXPENDITURE_TREND = [
  {
    year: '2021',
    label: 'FY 2021',
    allocated: 4150000,
    disbursed: 4050000,
    budget_share_pct: 6.42,
    threshold_pct: 5.0,
    external_grants: 3800000
  },
  {
    year: '2022',
    label: 'FY 2022',
    allocated: 4700000,
    disbursed: 4630000,
    budget_share_pct: 6.62,
    threshold_pct: 5.0,
    external_grants: 4500000
  },
  {
    year: '2023',
    label: 'FY 2023',
    allocated: 7450000,
    disbursed: 7280000,
    budget_share_pct: 6.72,
    threshold_pct: 5.0,
    external_grants: 5900000
  },
  {
    year: '2024',
    label: 'FY 2024',
    allocated: 8300000,
    disbursed: 8140000,
    budget_share_pct: 6.88,
    threshold_pct: 5.0,
    external_grants: 8000000
  },
  {
    year: '2025',
    label: 'FY 2025',
    allocated: 12850000,
    disbursed: 12650000,
    budget_share_pct: 7.15,
    threshold_pct: 5.0,
    external_grants: 9000000
  }
];

export const ACADEMIC_PROGRAMS: AcademicProgram[] = [
  // --- MAIN CAMPUS (16 Programs: 12 Undergrad, 4 Grad) ---
  {
    id: 'prog-main-01',
    code: 'BSIT',
    name: 'Bachelor of Science in Information Technology',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2023-014',
    copc_issuance_date: '2023-04-18',
    accreditation_level: 'Level III Re-accredited (AACCUP)',
    enrolled_students: 840,
    faculty_assigned: 18,
    evidence_code: 'EV-PROG-MAIN-BSIT',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level III Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-main-02',
    code: 'BSCS',
    name: 'Bachelor of Science in Computer Science',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2023-015',
    copc_issuance_date: '2023-04-18',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 420,
    faculty_assigned: 12,
    evidence_code: 'EV-PROG-MAIN-BSCS',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-main-03',
    code: 'BEED',
    name: 'Bachelor of Elementary Education',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2022-088',
    copc_issuance_date: '2022-09-10',
    accreditation_level: 'Level III Re-accredited (AACCUP)',
    enrolled_students: 760,
    faculty_assigned: 16,
    evidence_code: 'EV-PROG-MAIN-BEED',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level III Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-main-04',
    code: 'BSED',
    name: 'Bachelor of Secondary Education (Major in English, Math, Science)',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2022-089',
    copc_issuance_date: '2022-09-10',
    accreditation_level: 'Level III Re-accredited (AACCUP)',
    enrolled_students: 890,
    faculty_assigned: 20,
    evidence_code: 'EV-PROG-MAIN-BSED',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level III Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-main-05',
    code: 'BSBA',
    name: 'Bachelor of Science in Business Administration',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2023-042',
    copc_issuance_date: '2023-07-22',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 650,
    faculty_assigned: 14,
    evidence_code: 'EV-PROG-MAIN-BSBA',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-main-06',
    code: 'BSHM',
    name: 'Bachelor of Science in Hospitality Management',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2023-043',
    copc_issuance_date: '2023-07-22',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 580,
    faculty_assigned: 11,
    evidence_code: 'EV-PROG-MAIN-BSHM',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-main-07',
    code: 'BSTM',
    name: 'Bachelor of Science in Tourism Management',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2024-008',
    copc_issuance_date: '2024-02-14',
    accreditation_level: 'Level I Accredited (AACCUP)',
    enrolled_students: 390,
    faculty_assigned: 8,
    evidence_code: 'EV-PROG-MAIN-BSTM',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level I Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-main-08',
    code: 'BSPA',
    name: 'Bachelor of Science in Public Administration',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2023-061',
    copc_issuance_date: '2023-08-30',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 460,
    faculty_assigned: 9,
    evidence_code: 'EV-PROG-MAIN-BSPA',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-main-09',
    code: 'BSCE',
    name: 'Bachelor of Science in Civil Engineering',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Pending submission',
    copc_number: 'Awaiting Final Inspection',
    copc_issuance_date: '2026-Q2 Expected',
    accreditation_level: 'Candidate Status (AACCUP)',
    enrolled_students: 320,
    faculty_assigned: 10,
    evidence_code: 'EV-PROG-MAIN-BSCE',
    evidence_title: 'CHEDRO IX RQAT Ocular Inspection Endorsement Dossier',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-main-10',
    code: 'BSN',
    name: 'Bachelor of Science in Nursing',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Pending submission',
    copc_number: 'Awaiting Final Inspection',
    copc_issuance_date: '2026-Q2 Expected',
    accreditation_level: 'Candidate Status (AACCUP)',
    enrolled_students: 210,
    faculty_assigned: 8,
    evidence_code: 'EV-PROG-MAIN-BSN',
    evidence_title: 'CHED Technical Panel for Nursing Education Audit Documents',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-main-11',
    code: 'BAT',
    name: 'Bachelor of Agricultural Technology',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2022-054',
    copc_issuance_date: '2022-06-11',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 440,
    faculty_assigned: 10,
    evidence_code: 'EV-PROG-MAIN-BAT',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-main-12',
    code: 'BSES',
    name: 'Bachelor of Science in Environmental Science',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2023-078',
    copc_issuance_date: '2023-11-05',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 380,
    faculty_assigned: 9,
    evidence_code: 'EV-PROG-MAIN-BSES',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-main-13',
    code: 'MAED',
    name: 'Master of Arts in Education (Majors: Educational Management, English)',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    level: 'Graduate',
    degree_type: 'Master',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2022-101',
    copc_issuance_date: '2022-10-14',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 310,
    faculty_assigned: 12,
    evidence_code: 'EV-PROG-MAIN-MAED',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-main-14',
    code: 'MPA',
    name: 'Master in Public Administration',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    level: 'Graduate',
    degree_type: 'Master',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2023-019',
    copc_issuance_date: '2023-05-12',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 230,
    faculty_assigned: 10,
    evidence_code: 'EV-PROG-MAIN-MPA',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-main-15',
    code: 'MSA',
    name: 'Master of Science in Agriculture (Major: Agronomy, Animal Science)',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    level: 'Graduate',
    degree_type: 'Master',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2024-002',
    copc_issuance_date: '2024-01-20',
    accreditation_level: 'Level I Accredited (AACCUP)',
    enrolled_students: 140,
    faculty_assigned: 8,
    evidence_code: 'EV-PROG-MAIN-MSA',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level I Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-main-16',
    code: 'EDD',
    name: 'Doctor of Education (Ed.D.) in Educational Leadership',
    campus_id: 'camp-main',
    campus_name: 'Main Campus',
    level: 'Graduate',
    degree_type: 'Doctorate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2024-015',
    copc_issuance_date: '2024-03-28',
    accreditation_level: 'Level I Accredited (AACCUP)',
    enrolled_students: 80,
    faculty_assigned: 8,
    evidence_code: 'EV-PROG-MAIN-EDD',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level I Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },

  // --- DUMINGAG CAMPUS (10 Programs: 8 Undergrad, 2 Grad) ---
  {
    id: 'prog-dum-01',
    code: 'BSA',
    name: 'Bachelor of Science in Agriculture (Crop Science & Animal Science)',
    campus_id: 'camp-dum',
    campus_name: 'Dumingag Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2022-011',
    copc_issuance_date: '2022-03-15',
    accreditation_level: 'Level IV Candidate (AACCUP)',
    enrolled_students: 1120,
    faculty_assigned: 22,
    evidence_code: 'EV-PROG-DUM-BSA',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level IV Candidate Status',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-dum-02',
    code: 'BSABE',
    name: 'Bachelor of Science in Agricultural and Biosystems Engineering',
    campus_id: 'camp-dum',
    campus_name: 'Dumingag Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2023-033',
    copc_issuance_date: '2023-06-19',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 480,
    faculty_assigned: 12,
    evidence_code: 'EV-PROG-DUM-BSABE',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-dum-03',
    code: 'BSF',
    name: 'Bachelor of Science in Forestry',
    campus_id: 'camp-dum',
    campus_name: 'Dumingag Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2022-074',
    copc_issuance_date: '2022-08-11',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 420,
    faculty_assigned: 10,
    evidence_code: 'EV-PROG-DUM-BSF',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-dum-04',
    code: 'BTLED',
    name: 'Bachelor of Technology and Livelihood Education',
    campus_id: 'camp-dum',
    campus_name: 'Dumingag Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2023-055',
    copc_issuance_date: '2023-08-04',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 540,
    faculty_assigned: 11,
    evidence_code: 'EV-PROG-DUM-BTLED',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-dum-05',
    code: 'BSAB',
    name: 'Bachelor of Science in Agribusiness',
    campus_id: 'camp-dum',
    campus_name: 'Dumingag Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2023-056',
    copc_issuance_date: '2023-08-04',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 460,
    faculty_assigned: 9,
    evidence_code: 'EV-PROG-DUM-BSAB',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-dum-06',
    code: 'BSOA',
    name: 'Bachelor of Science in Organic Agriculture',
    campus_id: 'camp-dum',
    campus_name: 'Dumingag Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2024-022',
    copc_issuance_date: '2024-04-10',
    accreditation_level: 'Level I Accredited (AACCUP)',
    enrolled_students: 310,
    faculty_assigned: 7,
    evidence_code: 'EV-PROG-DUM-BSOA',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level I Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-dum-07',
    code: 'BSFT',
    name: 'Bachelor of Science in Food Technology',
    campus_id: 'camp-dum',
    campus_name: 'Dumingag Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2024-023',
    copc_issuance_date: '2024-04-10',
    accreditation_level: 'Level I Accredited (AACCUP)',
    enrolled_students: 280,
    faculty_assigned: 7,
    evidence_code: 'EV-PROG-DUM-BSFT',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level I Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-dum-08',
    code: 'DAT',
    name: 'Diploma in Agricultural Technology',
    campus_id: 'camp-dum',
    campus_name: 'Dumingag Campus',
    level: 'Undergraduate',
    degree_type: 'Diploma',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2021-030',
    copc_issuance_date: '2021-05-18',
    accreditation_level: 'Complied / TESDA-CHED Articulated',
    enrolled_students: 200,
    faculty_assigned: 5,
    evidence_code: 'EV-PROG-DUM-DAT',
    evidence_title: 'CHEDRO IX COPC Certificate & Articulation Agreement',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-dum-09',
    code: 'MSRD',
    name: 'Master of Science in Rural Development',
    campus_id: 'camp-dum',
    campus_name: 'Dumingag Campus',
    level: 'Graduate',
    degree_type: 'Master',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2023-049',
    copc_issuance_date: '2023-07-29',
    accreditation_level: 'Level I Accredited (AACCUP)',
    enrolled_students: 70,
    faculty_assigned: 6,
    evidence_code: 'EV-PROG-DUM-MSRD',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level I Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-dum-10',
    code: 'MSCS',
    name: 'Master of Science in Crop Science',
    campus_id: 'camp-dum',
    campus_name: 'Dumingag Campus',
    level: 'Graduate',
    degree_type: 'Master',
    copc_status: 'Pending submission',
    copc_number: 'Awaiting Final Inspection',
    copc_issuance_date: '2026-Q3 Expected',
    accreditation_level: 'Candidate Status (AACCUP)',
    enrolled_students: 40,
    faculty_assigned: 5,
    evidence_code: 'EV-PROG-DUM-MSCS',
    evidence_title: 'CHEDRO IX Technical Panel Evaluation Review Minutes',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },

  // --- PAGADIAN CITY CAMPUS (8 Programs: 7 Undergrad, 1 Grad) ---
  {
    id: 'prog-pag-01',
    code: 'BSCrim',
    name: 'Bachelor of Science in Criminology',
    campus_id: 'camp-pag',
    campus_name: 'Pagadian City Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2022-038',
    copc_issuance_date: '2022-05-24',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 1050,
    faculty_assigned: 21,
    evidence_code: 'EV-PROG-PAG-BSCRIM',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-pag-02',
    code: 'BSIT-IND',
    name: 'Bachelor of Science in Industrial Technology',
    campus_id: 'camp-pag',
    campus_name: 'Pagadian City Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2022-039',
    copc_issuance_date: '2022-05-24',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 580,
    faculty_assigned: 13,
    evidence_code: 'EV-PROG-PAG-BSITIND',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-pag-03',
    code: 'BSIS',
    name: 'Bachelor of Science in Information Systems',
    campus_id: 'camp-pag',
    campus_name: 'Pagadian City Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2023-017',
    copc_issuance_date: '2023-04-20',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 450,
    faculty_assigned: 11,
    evidence_code: 'EV-PROG-PAG-BSIS',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-pag-04',
    code: 'BPED',
    name: 'Bachelor of Physical Education',
    campus_id: 'camp-pag',
    campus_name: 'Pagadian City Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2023-080',
    copc_issuance_date: '2023-11-12',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 340,
    faculty_assigned: 8,
    evidence_code: 'EV-PROG-PAG-BPED',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-pag-05',
    code: 'BSOA-PAG',
    name: 'Bachelor of Science in Office Administration',
    campus_id: 'camp-pag',
    campus_name: 'Pagadian City Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2023-081',
    copc_issuance_date: '2023-11-12',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 320,
    faculty_assigned: 7,
    evidence_code: 'EV-PROG-PAG-BSOA',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-pag-06',
    code: 'BECE',
    name: 'Bachelor of Early Childhood Education',
    campus_id: 'camp-pag',
    campus_name: 'Pagadian City Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2024-009',
    copc_issuance_date: '2024-02-18',
    accreditation_level: 'Level I Accredited (AACCUP)',
    enrolled_students: 230,
    faculty_assigned: 6,
    evidence_code: 'EV-PROG-PAG-BECE',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level I Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-pag-07',
    code: 'MSCJ',
    name: 'Master of Science in Criminal Justice (Major: Criminology)',
    campus_id: 'camp-pag',
    campus_name: 'Pagadian City Campus',
    level: 'Graduate',
    degree_type: 'Master',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2023-066',
    copc_issuance_date: '2023-09-15',
    accreditation_level: 'Level I Accredited (AACCUP)',
    enrolled_students: 110,
    faculty_assigned: 7,
    evidence_code: 'EV-PROG-PAG-MSCJ',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level I Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-pag-08',
    code: 'BSDA',
    name: 'Bachelor of Science in Data Analytics',
    campus_id: 'camp-pag',
    campus_name: 'Pagadian City Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Pending submission',
    copc_number: 'Awaiting Final Inspection',
    copc_issuance_date: '2026-Q3 Expected',
    accreditation_level: 'Candidate Status (AACCUP)',
    enrolled_students: 130,
    faculty_assigned: 5,
    evidence_code: 'EV-PROG-PAG-BSDA',
    evidence_title: 'CHED Technical Committee Curriculum & Lab Endorsement',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },

  // --- CANUTO MS ENERIO (CMSE) CAMPUS (4 Programs: 4 Undergrad) ---
  {
    id: 'prog-cmse-01',
    code: 'BSF-AQUA',
    name: 'Bachelor of Science in Fisheries (Limnology & Inland Aquaculture)',
    campus_id: 'camp-cmse',
    campus_name: 'Canuto MS Enerio (CMSE) Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2022-045',
    copc_issuance_date: '2022-06-03',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 320,
    faculty_assigned: 9,
    evidence_code: 'EV-PROG-CMSE-BSF',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-cmse-02',
    code: 'BSED-CMSE',
    name: 'Bachelor of Secondary Education (Major in Social Studies, Filipino)',
    campus_id: 'camp-cmse',
    campus_name: 'Canuto MS Enerio (CMSE) Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2022-046',
    copc_issuance_date: '2022-06-03',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 280,
    faculty_assigned: 10,
    evidence_code: 'EV-PROG-CMSE-BSED',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-cmse-03',
    code: 'BEED-CMSE',
    name: 'Bachelor of Elementary Education',
    campus_id: 'camp-cmse',
    campus_name: 'Canuto MS Enerio (CMSE) Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2023-012',
    copc_issuance_date: '2023-03-19',
    accreditation_level: 'Level II Re-accredited (AACCUP)',
    enrolled_students: 220,
    faculty_assigned: 9,
    evidence_code: 'EV-PROG-CMSE-BEED',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level II Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'prog-cmse-04',
    code: 'BSAET',
    name: 'Bachelor of Science in Agro-Ecotourism Management',
    campus_id: 'camp-cmse',
    campus_name: 'Canuto MS Enerio (CMSE) Campus',
    level: 'Undergraduate',
    degree_type: 'Baccalaureate',
    copc_status: 'Complied',
    copc_number: 'COPC-RO9-2024-031',
    copc_issuance_date: '2024-05-16',
    accreditation_level: 'Level I Accredited (AACCUP)',
    enrolled_students: 130,
    faculty_assigned: 8,
    evidence_code: 'EV-PROG-CMSE-BSAET',
    evidence_title: 'CHEDRO IX COPC Certificate & AACCUP Level I Certificate',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  }
];

// ==============================================================================
// FORM 3: RESEARCH CULTURE & SCHOLARLY OUTPUTS
// ==============================================================================
export interface Form3Publication {
  id: string;
  paper_title: string;
  lead_author: string;
  co_authors: string;
  journal_name: string;
  indexing: 'Scopus' | 'CHED Recognized' | 'Web of Science' | 'Peer-Reviewed';
  issn_isbn: string;
  publication_year: number;
  campus_name: string;
  thematic_area: string;
  doi: string;
  status: 'Complied' | 'Not complied' | 'Pending submission';
  evidence_code: string;
  evidence_url: string;
}

export interface Form3Patent {
  id: string;
  registration_no: string;
  title: string;
  inventors: string;
  ip_type: 'Invention Patent' | 'Utility Model' | 'Industrial Design';
  filing_date: string;
  registration_date: string;
  campus_name: string;
  status: 'Complied' | 'Not complied' | 'Pending submission';
  evidence_code: string;
}

export interface Form3AnnualTrend {
  year: number;
  scopus_wos: number;
  ched_recognized: number;
  international_peer: number;
  patents: number;
  total_publications: number;
}

export const FORM3_ANNUAL_TREND: Form3AnnualTrend[] = [
  { year: 2021, scopus_wos: 8, ched_recognized: 6, international_peer: 4, patents: 2, total_publications: 18 },
  { year: 2022, scopus_wos: 11, ched_recognized: 7, international_peer: 5, patents: 3, total_publications: 23 },
  { year: 2023, scopus_wos: 14, ched_recognized: 9, international_peer: 6, patents: 4, total_publications: 29 },
  { year: 2024, scopus_wos: 18, ched_recognized: 11, international_peer: 7, patents: 4, total_publications: 36 },
  { year: 2025, scopus_wos: 22, ched_recognized: 14, international_peer: 8, patents: 5, total_publications: 44 }
];

export const FORM3_PUBLICATIONS: Form3Publication[] = [
  {
    id: 'pub-01',
    paper_title: 'Assessment of Soil Degradation and Indigenous Nutrient Buffering Capacities in Agro-Ecological Zones of Zamboanga del Sur',
    lead_author: 'Dr. Roberto M. Delos Santos',
    co_authors: 'Superales, J. B., & Omandam, E. T.',
    journal_name: 'Philippine Journal of Science (Scopus Q2)',
    indexing: 'Scopus',
    issn_isbn: '0031-7683',
    publication_year: 2025,
    campus_name: 'Main Campus (San Miguel)',
    thematic_area: 'Sustainable Agriculture & Food Security',
    doi: '10.56899/pjs.154.02.14',
    status: 'Complied',
    evidence_code: 'EV-PUB-2025-001',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'pub-02',
    paper_title: 'Socio-Hydrological Vulnerability and Community Resilience Modeling in the Sibuguey-Salug River Basin Catchments',
    lead_author: 'Engr. Maybelle P. Villaflores',
    co_authors: 'Rosales, E. H., & Alforque, M. C.',
    journal_name: 'Journal of Hydrology: Regional Studies (Scopus Q1)',
    indexing: 'Scopus',
    issn_isbn: '2214-5818',
    publication_year: 2025,
    campus_name: 'Pagadian City Campus',
    thematic_area: 'Water Resources & Climate Adaptation',
    doi: '10.1016/j.ejrh.2025.101890',
    status: 'Complied',
    evidence_code: 'EV-PUB-2025-002',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'pub-03',
    paper_title: 'Genetic Diversity and Phenotypic Profiling of Native Subanen Rice Landraces in Western Mindanao Highlands',
    lead_author: 'Dr. Jerry B. Superales',
    co_authors: 'Lumapas, C. R., & Baluyot, G. V.',
    journal_name: 'Asia Life Sciences: The Asian International Journal of Life Sciences',
    indexing: 'Scopus',
    issn_isbn: '0117-3375',
    publication_year: 2024,
    campus_name: 'Dumingag Campus',
    thematic_area: 'Biodiversity Conservation & Indigenous Heritage',
    doi: '10.26720/als.2024.33.2.19',
    status: 'Complied',
    evidence_code: 'EV-PUB-2024-003',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'pub-04',
    paper_title: 'Techno-Economic Feasibility and Life Cycle Assessment of Biomass-Derived Torrefied Pellets from Rice Husk Feedstocks',
    lead_author: 'Engr. Daryl K. Tan',
    co_authors: 'Sanchez, R. A., & Quimno, L. P.',
    journal_name: 'Bioresource Technology Reports (Scopus Q2)',
    indexing: 'Scopus',
    issn_isbn: '2589-014X',
    publication_year: 2024,
    campus_name: 'Canuto MS Enerio (CMSE) Campus',
    thematic_area: 'Renewable Energy & Circular Bioeconomy',
    doi: '10.1016/j.biteb.2024.101742',
    status: 'Complied',
    evidence_code: 'EV-PUB-2024-004',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'pub-05',
    paper_title: 'Pedagogical Shift to Culturally Responsive STEM Learning Paradigms: Longitudinal Outcomes Among Rural Indigenous Learners',
    lead_author: 'Dr. Lilibeth M. Maghanoy',
    co_authors: 'Gomez, M. A., & Suan, F. T.',
    journal_name: 'Philippine Journal of Education Research and Development (CHED-Recognized)',
    indexing: 'CHED Recognized',
    issn_isbn: '2408-3380',
    publication_year: 2024,
    campus_name: 'Main Campus (San Miguel)',
    thematic_area: 'Education Pedagogy & Social Inclusion',
    doi: '10.47772/pjerd.2024.1202',
    status: 'Complied',
    evidence_code: 'EV-PUB-2024-005',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'pub-06',
    paper_title: 'Machine Learning Classification of Coastal Mangrove Biometrics Using Multi-Spectral Sentinel-2 Imagery in Dumanquilas Bay',
    lead_author: 'Prof. Mark Jason B. Cañete',
    co_authors: 'Villaflores, M. P., & Ocampos, H. L.',
    journal_name: 'Remote Sensing Applications: Society and Environment (Web of Science / Scopus Q1)',
    indexing: 'Web of Science',
    issn_isbn: '2352-9385',
    publication_year: 2023,
    campus_name: 'Pagadian City Campus',
    thematic_area: 'Environmental Informatics & Remote Sensing',
    doi: '10.1016/j.rsase.2023.101033',
    status: 'Complied',
    evidence_code: 'EV-PUB-2023-006',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'pub-07',
    paper_title: 'Post-Harvest Losses Mitigation in Banana (Musa acuminata) Supply Chains Through Solar-Assisted Desiccant Drying',
    lead_author: 'Dr. Jerry B. Superales',
    co_authors: 'Tagalog, R. S., & Delos Santos, R. M.',
    journal_name: 'Agricultural Engineering International: CIGR Journal',
    indexing: 'Scopus',
    issn_isbn: '1682-1130',
    publication_year: 2023,
    campus_name: 'Dumingag Campus',
    thematic_area: 'Agri-Processing & Post-Harvest Engineering',
    doi: '10.54846/cigr.2023.6744',
    status: 'Complied',
    evidence_code: 'EV-PUB-2023-007',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'pub-08',
    paper_title: 'Ethnopharmacological Screening and Antimicrobial Profiling of Selected Medicinal Plants Utilized by the Subanen Tribe',
    lead_author: 'Dr. Clarita R. Lumapas',
    co_authors: 'Rosales, E. H., & Orellana, N. B.',
    journal_name: 'Asian Pacific Journal of Tropical Biomedicine (Scopus Q2)',
    indexing: 'Scopus',
    issn_isbn: '2221-1691',
    publication_year: 2022,
    campus_name: 'Main Campus (San Miguel)',
    thematic_area: 'Natural Products & Public Health',
    doi: '10.4103/2221-1691.354421',
    status: 'Complied',
    evidence_code: 'EV-PUB-2022-008',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'pub-09',
    paper_title: 'Macroeconomic Determinants of Micro, Small, and Medium Enterprises Sustainability in Rural Zamboanga Peninsula',
    lead_author: 'Dr. Mary Ann P. Gomez',
    co_authors: 'Macalisang, P. C., & Daan, J. F.',
    journal_name: 'Philippine Academy of Management Journal (CHED-Recognized)',
    indexing: 'CHED Recognized',
    issn_isbn: '2599-4670',
    publication_year: 2022,
    campus_name: 'Pagadian City Campus',
    thematic_area: 'Socio-Economic Development & MSME Enterprise',
    doi: '10.47772/pamj.2022.0804',
    status: 'Complied',
    evidence_code: 'EV-PUB-2022-009',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  },
  {
    id: 'pub-10',
    paper_title: 'Optimization of Biocontrol Formulation of Trichoderma harzianum Against Fusarium Wilt in Highland Cavendish Plantations',
    lead_author: 'Prof. Gomer V. Baluyot',
    co_authors: 'Superales, J. B., & Alingal, T. S.',
    journal_name: 'Crop Protection & Phytopathology Journal (Scopus Q2)',
    indexing: 'Scopus',
    issn_isbn: '0261-2194',
    publication_year: 2021,
    campus_name: 'Dumingag Campus',
    thematic_area: 'Biological Control & Crop Protection',
    doi: '10.1016/j.cropro.2021.105820',
    status: 'Complied',
    evidence_code: 'EV-PUB-2021-010',
    evidence_url: 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing'
  }
];

export const FORM3_PATENTS: Form3Patent[] = [
  {
    id: 'pat-01',
    registration_no: 'UM-2-2024-000412',
    title: 'Dual-Chamber Modular Solar Crop Dryer with Thermal Storage Gravel Bed',
    inventors: 'Dr. Jerry B. Superales, Engr. Daryl K. Tan',
    ip_type: 'Utility Model',
    filing_date: '2023-04-18',
    registration_date: '2024-03-22',
    campus_name: 'Dumingag Campus',
    status: 'Complied',
    evidence_code: 'EV-IPOPHL-UM-2024-01'
  },
  {
    id: 'pat-02',
    registration_no: 'UM-2-2024-000588',
    title: 'Automated Real-Time Microclimatic Sensor Array for Rubber Tree Nurseries',
    inventors: 'Prof. Mark Jason B. Cañete, Engr. Maybelle P. Villaflores',
    ip_type: 'Utility Model',
    filing_date: '2023-08-11',
    registration_date: '2024-06-19',
    campus_name: 'Pagadian City Campus',
    status: 'Complied',
    evidence_code: 'EV-IPOPHL-UM-2024-02'
  },
  {
    id: 'pat-03',
    registration_no: 'UM-2-2023-000319',
    title: 'Compact Mechanized Cassava Shredder and Starch Extractor Assembly',
    inventors: 'Dr. Roberto M. Delos Santos, Prof. Romeo A. Sanchez',
    ip_type: 'Utility Model',
    filing_date: '2022-09-05',
    registration_date: '2023-05-14',
    campus_name: 'Main Campus (San Miguel)',
    status: 'Complied',
    evidence_code: 'EV-IPOPHL-UM-2023-03'
  },
  {
    id: 'pat-04',
    registration_no: 'ID-3-2023-000108',
    title: 'Ergonomic Handheld Mechanical Corn Sheller Tool Body',
    inventors: 'Engr. Daryl K. Tan, Dr. Jerry B. Superales',
    ip_type: 'Industrial Design',
    filing_date: '2022-11-20',
    registration_date: '2023-08-01',
    campus_name: 'Dumingag Campus',
    status: 'Complied',
    evidence_code: 'EV-IPOPHL-ID-2023-04'
  }
];

// ==============================================================================
// FORM 1: PROGRAM OFFERINGS DETAILED BREAKDOWN
// ==============================================================================
export interface Form1OfferingItem {
  id: string;
  campus_name: string;
  program_code: string;
  degree_title: string;
  academic_level: string;
  board_resolution_no: string;
  copc_number: string;
  copc_status: 'Complied' | 'Not complied' | 'Pending submission';
  enrolled_sy2526: number;
  five_year_graduates: number;
  evidence_code: string;
}

export const FORM1_OFFERINGS_LIST: Form1OfferingItem[] = [
  {
    id: 'f1-01',
    campus_name: 'Main Campus',
    program_code: 'BSIT-MAIN',
    degree_title: 'Bachelor of Science in Information Technology',
    academic_level: 'Undergraduate',
    board_resolution_no: 'BOR Res. No. 42, s. 2011',
    copc_number: 'COPC-RO9-2022-014',
    copc_status: 'Complied',
    enrolled_sy2526: 840,
    five_year_graduates: 512,
    evidence_code: 'EV-F1-PROG-01'
  },
  {
    id: 'f1-02',
    campus_name: 'Main Campus',
    program_code: 'BSCRIM-MAIN',
    degree_title: 'Bachelor of Science in Criminology',
    academic_level: 'Undergraduate',
    board_resolution_no: 'BOR Res. No. 18, s. 2008',
    copc_number: 'COPC-RO9-2021-008',
    copc_status: 'Complied',
    enrolled_sy2526: 1250,
    five_year_graduates: 780,
    evidence_code: 'EV-F1-PROG-02'
  },
  {
    id: 'f1-03',
    campus_name: 'Dumingag Campus',
    program_code: 'BSA-DUM',
    degree_title: 'Bachelor of Science in Agriculture',
    academic_level: 'Undergraduate',
    board_resolution_no: 'BOR Res. No. 04, s. 2002',
    copc_number: 'COPC-RO9-2021-003',
    copc_status: 'Complied',
    enrolled_sy2526: 720,
    five_year_graduates: 430,
    evidence_code: 'EV-F1-PROG-03'
  },
  {
    id: 'f1-04',
    campus_name: 'Pagadian City Campus',
    program_code: 'BSCS-PAG',
    degree_title: 'Bachelor of Science in Computer Science',
    academic_level: 'Undergraduate',
    board_resolution_no: 'BOR Res. No. 55, s. 2015',
    copc_number: 'COPC-RO9-2022-029',
    copc_status: 'Complied',
    enrolled_sy2526: 540,
    five_year_graduates: 310,
    evidence_code: 'EV-F1-PROG-04'
  },
  {
    id: 'f1-05',
    campus_name: 'Canuto MS Enerio (CMSE) Campus',
    program_code: 'BSF-CMSE',
    degree_title: 'Bachelor of Science in Forestry',
    academic_level: 'Undergraduate',
    board_resolution_no: 'BOR Res. No. 12, s. 2006',
    copc_number: 'COPC-RO9-2021-021',
    copc_status: 'Complied',
    enrolled_sy2526: 320,
    five_year_graduates: 195,
    evidence_code: 'EV-F1-PROG-05'
  }
];

// ==============================================================================
// FORM 2: FACULTY PROFILE & QUALIFICATIONS
// ==============================================================================
export interface Form2FacultySummary {
  id: string;
  rank_category: string;
  doctorate_holders: number;
  masters_holders: number;
  bachelors_only: number;
  total_count: number;
  percentage: number;
  tenured_permanent: number;
  standard_met: 'Complied' | 'Not complied' | 'Pending submission';
  evidence_code: string;
}

export const FORM2_FACULTY_DISTRIBUTION: Form2FacultySummary[] = [
  {
    id: 'f2-prof',
    rank_category: 'Professors & Associate Professors',
    doctorate_holders: 42,
    masters_holders: 8,
    bachelors_only: 0,
    total_count: 50,
    percentage: 14.6,
    tenured_permanent: 50,
    standard_met: 'Complied',
    evidence_code: 'EV-F2-RANK-01'
  },
  {
    id: 'f2-asst',
    rank_category: 'Assistant Professors',
    doctorate_holders: 38,
    masters_holders: 96,
    bachelors_only: 0,
    total_count: 134,
    percentage: 39.2,
    tenured_permanent: 130,
    standard_met: 'Complied',
    evidence_code: 'EV-F2-RANK-02'
  },
  {
    id: 'f2-inst',
    rank_category: 'Instructors (Full-Time Plantilla)',
    doctorate_holders: 14,
    masters_holders: 94,
    bachelors_only: 50,
    total_count: 158,
    percentage: 46.2,
    tenured_permanent: 142,
    standard_met: 'Complied',
    evidence_code: 'EV-F2-RANK-03'
  }
];

// ==============================================================================
// FORM 5: LEARNING RESOURCES & LABORATORY HOLDINGS
// ==============================================================================
export interface Form5ResourceItem {
  id: string;
  campus_name: string;
  category: 'Library Holding' | 'Digital Database' | 'Laboratory Facility' | 'IT Infrastructure';
  item_description: string;
  quantity_or_capacity: string;
  statutory_standard: string;
  status: 'Complied' | 'Not complied' | 'Pending submission';
  evidence_code: string;
}

export const FORM5_RESOURCES: Form5ResourceItem[] = [
  {
    id: 'f5-01',
    campus_name: 'All Campuses (Main, DUM, PAG, CMSE)',
    category: 'Library Holding',
    item_description: 'Cataloged Physical Book Titles (Hardbound & Circulation Volumes)',
    quantity_or_capacity: '42,800 cataloged titles (64,200 accessioned volumes)',
    statutory_standard: 'Min. 5,000 professional titles per degree discipline',
    status: 'Complied',
    evidence_code: 'EV-F5-LIB-01'
  },
  {
    id: 'f5-02',
    campus_name: 'All Campuses',
    category: 'Digital Database',
    item_description: 'Institutional Subscriptions to Scopus, ScienceDirect, Philippine E-Lib & IEEE Xplore',
    quantity_or_capacity: 'Campus-wide IP-authenticated 24/7 remote proxy access',
    statutory_standard: 'Institutional access to recognized peer-reviewed indexing databases',
    status: 'Complied',
    evidence_code: 'EV-F5-DIG-02'
  },
  {
    id: 'f5-03',
    campus_name: 'Main & Dumingag Campuses',
    category: 'Laboratory Facility',
    item_description: 'Specialized Biotechnology, Soil Science, Tissue Culture, & Food Tech Labs',
    quantity_or_capacity: '14 specialized laboratories with DENR & BFP safety clearances',
    statutory_standard: 'Adequate dedicated laboratory facilities meeting CHED CMO standards',
    status: 'Complied',
    evidence_code: 'EV-F5-LAB-03'
  },
  {
    id: 'f5-04',
    campus_name: 'Pagadian & Main Campuses',
    category: 'IT Infrastructure',
    item_description: 'Fiber-Optic Gigabit Backbone, 1 Gbps Leased Line, 8 Computer Labs',
    quantity_or_capacity: '620 terminal stations (1:1 student-to-computer laboratory ratio)',
    statutory_standard: 'High-speed broadband network with student computing terminals',
    status: 'Complied',
    evidence_code: 'EV-F5-IT-04'
  }
];

// ==============================================================================
// FORM 6: STUDENT SERVICES & SUPPORT STRUCTURES
// ==============================================================================
export interface Form6SupportItem {
  id: string;
  campus_name: string;
  service_area: 'Student Welfare' | 'Guidance & Counseling' | 'Medical/Dental' | 'Administrative Plantilla' | 'Housing/Sports';
  facility_or_program: string;
  staffing_capacity: string;
  operational_status: string;
  status: 'Complied' | 'Not complied' | 'Pending submission';
  evidence_code: string;
}

export const FORM6_SUPPORT: Form6SupportItem[] = [
  {
    id: 'f6-01',
    campus_name: 'All Campuses (4 sites)',
    service_area: 'Guidance & Counseling',
    facility_or_program: 'Career Guidance, Psychological Testing, & Mental Health Wellness Clinic',
    staffing_capacity: '8 Registered Guidance Counselors (RGC) & 4 Psychometricians',
    operational_status: 'Fully operational with designated intake and testing rooms',
    status: 'Complied',
    evidence_code: 'EV-F6-GUID-01'
  },
  {
    id: 'f6-02',
    campus_name: 'All Campuses (4 sites)',
    service_area: 'Medical/Dental',
    facility_or_program: 'Campus Infirmary & Emergency Medical Care Clinic',
    staffing_capacity: '2 Medical Officers, 1 University Dentist, 8 Registered Nurses',
    operational_status: 'Equipped with emergency beds, oxygen tanks, AED, and ambulance',
    status: 'Complied',
    evidence_code: 'EV-F6-MED-02'
  },
  {
    id: 'f6-03',
    campus_name: 'Main & Dumingag Campuses',
    service_area: 'Administrative Plantilla',
    facility_or_program: 'Institutional Registrar, HRMO, Cashiering, Accounting, Supply Offices',
    staffing_capacity: '184 permanent DBM-authorized administrative plantilla personnel',
    operational_status: 'Certified ISO 9001:2015 Quality Management System Compliant',
    status: 'Complied',
    evidence_code: 'EV-F6-ADM-03'
  },
  {
    id: 'f6-04',
    campus_name: 'Main, Dumingag, & CMSE',
    service_area: 'Housing/Sports',
    facility_or_program: 'On-Campus Student Dormitories & Multipurpose Sports Gymnasium Complex',
    staffing_capacity: '600-bed capacity student housing, standard athletic track and oval',
    operational_status: 'Complete student welfare, security 24/7, and sports facilities',
    status: 'Complied',
    evidence_code: 'EV-F6-SPRT-04'
  }
];

// ==============================================================================
// FORM 7: INSTITUTIONAL LINKAGES & PARTNERSHIPS
// ==============================================================================
export interface Form7Linkage {
  id: string;
  partner_institution: string;
  partner_type: 'International University' | 'National SUC Consortia' | 'Government Agency' | 'Industry/Private';
  agreement_title: string;
  validity_period: string;
  scope_of_collaboration: string;
  campus_beneficiary: string;
  status: 'Complied' | 'Not complied' | 'Pending submission';
  evidence_code: string;
}

export const FORM7_LINKAGES: Form7Linkage[] = [
  {
    id: 'f7-01',
    partner_institution: 'Universiti Putra Malaysia (UPM), Malaysia',
    partner_type: 'International University',
    agreement_title: 'Memorandum of Agreement on Bilateral Faculty & Student Research Exchange',
    validity_period: '2023–2028 (5 Years)',
    scope_of_collaboration: 'Joint agricultural biotechnology research, co-authorship, faculty post-doc training',
    campus_beneficiary: 'Main & Dumingag Campuses',
    status: 'Complied',
    evidence_code: 'EV-F7-MOA-UPM'
  },
  {
    id: 'f7-02',
    partner_institution: 'Department of Science and Technology (DOST) Region IX',
    partner_type: 'Government Agency',
    agreement_title: 'Collaborative Research & Innovation Deployment Partnership Accord',
    validity_period: '2022–2027 (5 Years)',
    scope_of_collaboration: 'Funding of regional innovation centers, technology licensing, MSME assistance',
    campus_beneficiary: 'All Campuses',
    status: 'Complied',
    evidence_code: 'EV-F7-MOA-DOST'
  },
  {
    id: 'f7-03',
    partner_institution: 'Mindanao State University System (MSU)',
    partner_type: 'National SUC Consortia',
    agreement_title: 'Mindanao Higher Education Research Consortium (MHERC) Covenant',
    validity_period: '2021–2026 (5 Years)',
    scope_of_collaboration: 'Cross-enrollment in post-graduate courses, laboratory sharing, joint conferences',
    campus_beneficiary: 'All Campuses',
    status: 'Complied',
    evidence_code: 'EV-F7-MOA-MSU'
  },
  {
    id: 'f7-04',
    partner_institution: 'Provincial Government of Zamboanga del Sur (PGLGU)',
    partner_type: 'Government Agency',
    agreement_title: 'Provincial Agricultural Modernization & Environmental Stewardship Accord',
    validity_period: '2022–2026 (4 Years)',
    scope_of_collaboration: 'Watershed conservation, scholarship grants, agricultural extension demonstrations',
    campus_beneficiary: 'All Campuses',
    status: 'Complied',
    evidence_code: 'EV-F7-MOA-PLGU'
  }
];

// ==============================================================================
// FORM 8: COMMUNITY OUTREACH & EXTENSION PROGRAMS
// ==============================================================================
export interface Form8Outreach {
  id: string;
  project_title: string;
  target_community: string;
  municipality: string;
  lead_campus: string;
  program_lead: string;
  active_years: string;
  direct_beneficiaries: number;
  status: 'Complied' | 'Not complied' | 'Pending submission';
  evidence_code: string;
}

export const FORM8_OUTREACH: Form8Outreach[] = [
  {
    id: 'f8-01',
    project_title: 'Project BUKLOD: Indigenous Subanen Agro-Forestry & Honey Livelihood Program',
    target_community: 'Subanen Ancestral Domain (CADT 082)',
    municipality: 'Lakewood, Zamboanga del Sur',
    lead_campus: 'Canuto MS Enerio (CMSE) Campus',
    program_lead: 'Prof. Romeo A. Sanchez',
    active_years: '2022–2025',
    direct_beneficiaries: 1240,
    status: 'Complied',
    evidence_code: 'EV-F8-EXT-01'
  },
  {
    id: 'f8-02',
    project_title: 'Project TULAY: Digital Literacy and e-Commerce Incubation for Rural Cooperatives',
    target_community: '12 Agrarian Reform Beneficiary Coops',
    municipality: 'Pagadian City & San Miguel',
    lead_campus: 'Pagadian City Campus',
    program_lead: 'Dr. Mary Ann P. Gomez',
    active_years: '2023–2025',
    direct_beneficiaries: 2850,
    status: 'Complied',
    evidence_code: 'EV-F8-EXT-02'
  },
  {
    id: 'f8-03',
    project_title: 'Project ANI: Climate-Resilient Hybrid Rice Seed Multiplication Demonstration',
    target_community: 'Lowland Farming Irrigators Associations',
    municipality: 'Dumingag & Mahayag',
    lead_campus: 'Dumingag Campus',
    program_lead: 'Dr. Jerry B. Superales',
    active_years: '2021–2025',
    direct_beneficiaries: 3100,
    status: 'Complied',
    evidence_code: 'EV-F8-EXT-03'
  },
  {
    id: 'f8-04',
    project_title: 'Project LUSOG: Coastal Mangrove Reforestation & Fisheries Livelihood Program',
    target_community: 'Artisanal Fisherfolk Communities',
    municipality: 'Dumanquilas Bay (Vincenzo Sagun)',
    lead_campus: 'Main Campus (San Miguel)',
    program_lead: 'Dr. Roberto M. Delos Santos',
    active_years: '2022–2025',
    direct_beneficiaries: 1230,
    status: 'Complied',
    evidence_code: 'EV-F8-EXT-04'
  }
];

