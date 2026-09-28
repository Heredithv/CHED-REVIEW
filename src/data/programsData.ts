export interface UnmetItem {
  id: number;
  area: string;
  requirement: string;
  chedroRemark?: string;
}

export interface ProgramItem {
  id: string;
  name: string;
  code: string;
  level: 'Undergraduate' | 'Graduate';
  campus: 'Main campus' | 'Dumingag campus' | 'Pagadian campus' | 'CMSE (Lakewood)';
  compliedChecks: number;
  totalChecks: number;
  status?: 'Statement pending';
  unmetItems?: UnmetItem[];
  isPlaceholder?: boolean;
}

export interface CampusProgramSummary {
  campus: string;
  programsCount: number;
  percent: number;
  compliedChecks: number;
  totalChecks: number;
  note: string;
}

export const programsPageData = {
  breadcrumbHome: "Home",
  breadcrumbCurrent: "Programs",
  title: "Program compliance",
  subtitle: "43 programs have submitted a compliance form against CHED's policies, standards and guidelines. 598 of 739 checks are marked complied.",
  subtitleHighlight: "43 programs",

  filterTabs: [
    { id: "all", label: "All campuses", count: 43 },
    { id: "Main campus", label: "Main campus", count: 21 },
    { id: "Dumingag campus", label: "Dumingag campus", count: 12 },
    { id: "Pagadian campus", label: "Pagadian campus", count: 5 },
    { id: "CMSE (Lakewood)", label: "CMSE (Lakewood)", count: 5 }
  ],

  levels: ["All levels", "Graduate", "Undergraduate"],

  searchPlaceholder: "Search programs",
  exportButtonText: "Export to Excel",
  exportFileName: "Programs-Compliance-CMO46.xlsx",
  sheetName: "Program Compliance",

  campusSummaries: {
    "Main campus": {
      campus: "Main campus",
      programsCount: 21,
      percent: 80,
      compliedChecks: 278,
      totalChecks: 349,
      note: "21 programs, 80% of checks complied"
    },
    "Dumingag campus": {
      campus: "Dumingag campus",
      programsCount: 12,
      percent: 84,
      compliedChecks: 184,
      totalChecks: 218,
      note: "12 programs, 84% of checks complied"
    },
    "Pagadian campus": {
      campus: "Pagadian campus",
      programsCount: 5,
      percent: 90,
      compliedChecks: 85,
      totalChecks: 94,
      note: "5 programs, 90% of checks complied"
    },
    "CMSE (Lakewood)": {
      campus: "CMSE (Lakewood)",
      programsCount: 5,
      percent: 65,
      compliedChecks: 51,
      totalChecks: 78,
      note: "5 programs, 65% of checks complied"
    }
  } as Record<string, CampusProgramSummary>,

  programs: [
    // Main Campus (21 programs total: 8 real + 13 placeholders)
    {
      id: "main-bsit",
      name: "Bachelor of Science in Information Technology",
      code: "BSIT",
      level: "Undergraduate",
      campus: "Main campus",
      compliedChecks: 14,
      totalChecks: 22,
      unmetItems: [
        { id: 1, area: "Faculty", requirement: "Qualifications of Faculty" },
        { id: 2, area: "Faculty", requirement: "Faculty-student Ratio" },
        { id: 3, area: "Faculty", requirement: "Faculty Development Program" },
        { id: 4, area: "Library", requirement: "Library Holdings" },
        {
          id: 5,
          area: "Laboratories and other Facilities",
          requirement: "Classrooms must be equipped",
          chedroRemark: "- Upgrade classroom set-up."
        },
        { id: 6, area: "Laboratories and other Facilities", requirement: "Laboratory Equipment and Software" },
        { id: 7, area: "Research and Development", requirement: "Faculty Research Publication in Refereed Journals" },
        { id: 8, area: "Community Extension", requirement: "Sustained Community Extension Program" }
      ]
    },
    {
      id: "main-maed-em",
      name: "Master of Arts in Education major in Educational Management",
      code: "MAEd-EM",
      level: "Graduate",
      campus: "Main campus",
      compliedChecks: 18,
      totalChecks: 20
    },
    {
      id: "main-maed-math",
      name: "Master of Arts in Education major in Mathematics",
      code: "MAEd Math",
      level: "Graduate",
      campus: "Main campus",
      compliedChecks: 0,
      totalChecks: 0,
      status: "Statement pending"
    },
    {
      id: "main-beed",
      name: "Bachelor of Elementary Education",
      code: "BEEd",
      level: "Undergraduate",
      campus: "Main campus",
      compliedChecks: 19,
      totalChecks: 21
    },
    {
      id: "main-bsed",
      name: "Bachelor of Secondary Education",
      code: "BSEd",
      level: "Undergraduate",
      campus: "Main campus",
      compliedChecks: 20,
      totalChecks: 21
    },
    {
      id: "main-bsa",
      name: "Bachelor of Science in Agriculture",
      code: "BSA",
      level: "Undergraduate",
      campus: "Main campus",
      compliedChecks: 17,
      totalChecks: 20
    },
    {
      id: "main-bsf",
      name: "Bachelor of Science in Forestry",
      code: "BSF",
      level: "Undergraduate",
      campus: "Main campus",
      compliedChecks: 16,
      totalChecks: 18
    },
    {
      id: "main-bshm",
      name: "Bachelor of Science in Hospitality Management",
      code: "BSHM",
      level: "Undergraduate",
      campus: "Main campus",
      compliedChecks: 15,
      totalChecks: 18
    },
    // Main campus placeholders (13 programs to reach 21)
    { id: "main-p09", name: "Program name (placeholder)", code: "MAIN-09", level: "Undergraduate", campus: "Main campus", compliedChecks: 14, totalChecks: 17, isPlaceholder: true },
    { id: "main-p10", name: "Program name (placeholder)", code: "MAIN-10", level: "Undergraduate", campus: "Main campus", compliedChecks: 15, totalChecks: 18, isPlaceholder: true },
    { id: "main-p11", name: "Program name (placeholder)", code: "MAIN-11", level: "Undergraduate", campus: "Main campus", compliedChecks: 13, totalChecks: 16, isPlaceholder: true },
    { id: "main-p12", name: "Program name (placeholder)", code: "MAIN-12", level: "Undergraduate", campus: "Main campus", compliedChecks: 16, totalChecks: 19, isPlaceholder: true },
    { id: "main-p13", name: "Program name (placeholder)", code: "MAIN-13", level: "Undergraduate", campus: "Main campus", compliedChecks: 12, totalChecks: 16, isPlaceholder: true },
    { id: "main-p14", name: "Program name (placeholder)", code: "MAIN-14", level: "Undergraduate", campus: "Main campus", compliedChecks: 14, totalChecks: 18, isPlaceholder: true },
    { id: "main-p15", name: "Program name (placeholder)", code: "MAIN-15", level: "Graduate", campus: "Main campus", compliedChecks: 15, totalChecks: 18, isPlaceholder: true },
    { id: "main-p16", name: "Program name (placeholder)", code: "MAIN-16", level: "Graduate", campus: "Main campus", compliedChecks: 13, totalChecks: 17, isPlaceholder: true },
    { id: "main-p17", name: "Program name (placeholder)", code: "MAIN-17", level: "Graduate", campus: "Main campus", compliedChecks: 12, totalChecks: 16, isPlaceholder: true },
    { id: "main-p18", name: "Program name (placeholder)", code: "MAIN-18", level: "Graduate", campus: "Main campus", compliedChecks: 11, totalChecks: 15, isPlaceholder: true },
    { id: "main-p19", name: "Program name (placeholder)", code: "MAIN-19", level: "Graduate", campus: "Main campus", compliedChecks: 13, totalChecks: 16, isPlaceholder: true },
    { id: "main-p20", name: "Program name (placeholder)", code: "MAIN-20", level: "Undergraduate", campus: "Main campus", compliedChecks: 13, totalChecks: 17, isPlaceholder: true },
    { id: "main-p21", name: "Program name (placeholder)", code: "MAIN-21", level: "Undergraduate", campus: "Main campus", compliedChecks: 15, totalChecks: 18, isPlaceholder: true },

    // Dumingag Campus (12 programs total, 184 of 218 checks complied)
    { id: "dum-01", name: "Program name (placeholder)", code: "DUM-01", level: "Undergraduate", campus: "Dumingag campus", compliedChecks: 16, totalChecks: 19, isPlaceholder: true },
    { id: "dum-02", name: "Program name (placeholder)", code: "DUM-02", level: "Undergraduate", campus: "Dumingag campus", compliedChecks: 15, totalChecks: 18, isPlaceholder: true },
    { id: "dum-03", name: "Program name (placeholder)", code: "DUM-03", level: "Undergraduate", campus: "Dumingag campus", compliedChecks: 17, totalChecks: 20, isPlaceholder: true },
    { id: "dum-04", name: "Program name (placeholder)", code: "DUM-04", level: "Undergraduate", campus: "Dumingag campus", compliedChecks: 16, totalChecks: 18, isPlaceholder: true },
    { id: "dum-05", name: "Program name (placeholder)", code: "DUM-05", level: "Undergraduate", campus: "Dumingag campus", compliedChecks: 14, totalChecks: 17, isPlaceholder: true },
    { id: "dum-06", name: "Program name (placeholder)", code: "DUM-06", level: "Undergraduate", campus: "Dumingag campus", compliedChecks: 15, totalChecks: 18, isPlaceholder: true },
    { id: "dum-07", name: "Program name (placeholder)", code: "DUM-07", level: "Undergraduate", campus: "Dumingag campus", compliedChecks: 16, totalChecks: 19, isPlaceholder: true },
    { id: "dum-08", name: "Program name (placeholder)", code: "DUM-08", level: "Undergraduate", campus: "Dumingag campus", compliedChecks: 15, totalChecks: 18, isPlaceholder: true },
    { id: "dum-09", name: "Program name (placeholder)", code: "DUM-09", level: "Undergraduate", campus: "Dumingag campus", compliedChecks: 14, totalChecks: 17, isPlaceholder: true },
    { id: "dum-10", name: "Program name (placeholder)", code: "DUM-10", level: "Graduate", campus: "Dumingag campus", compliedChecks: 16, totalChecks: 18, isPlaceholder: true },
    { id: "dum-11", name: "Program name (placeholder)", code: "DUM-11", level: "Undergraduate", campus: "Dumingag campus", compliedChecks: 15, totalChecks: 18, isPlaceholder: true },
    { id: "dum-12", name: "Program name (placeholder)", code: "DUM-12", level: "Undergraduate", campus: "Dumingag campus", compliedChecks: 15, totalChecks: 18, isPlaceholder: true },

    // Pagadian Campus (5 programs total, 85 of 94 checks complied)
    { id: "pag-01", name: "Program name (placeholder)", code: "PAG-01", level: "Undergraduate", campus: "Pagadian campus", compliedChecks: 18, totalChecks: 20, isPlaceholder: true },
    { id: "pag-02", name: "Program name (placeholder)", code: "PAG-02", level: "Undergraduate", campus: "Pagadian campus", compliedChecks: 17, totalChecks: 19, isPlaceholder: true },
    { id: "pag-03", name: "Program name (placeholder)", code: "PAG-03", level: "Undergraduate", campus: "Pagadian campus", compliedChecks: 17, totalChecks: 19, isPlaceholder: true },
    { id: "pag-04", name: "Program name (placeholder)", code: "PAG-04", level: "Graduate", campus: "Pagadian campus", compliedChecks: 16, totalChecks: 18, isPlaceholder: true },
    { id: "pag-05", name: "Program name (placeholder)", code: "PAG-05", level: "Undergraduate", campus: "Pagadian campus", compliedChecks: 17, totalChecks: 18, isPlaceholder: true },

    // CMSE Lakewood Campus (5 programs total, 51 of 78 checks complied)
    { id: "cms-01", name: "Program name (placeholder)", code: "CMS-01", level: "Undergraduate", campus: "CMSE (Lakewood)", compliedChecks: 11, totalChecks: 16, isPlaceholder: true },
    { id: "cms-02", name: "Program name (placeholder)", code: "CMS-02", level: "Undergraduate", campus: "CMSE (Lakewood)", compliedChecks: 10, totalChecks: 15, isPlaceholder: true },
    { id: "cms-03", name: "Program name (placeholder)", code: "CMS-03", level: "Undergraduate", campus: "CMSE (Lakewood)", compliedChecks: 10, totalChecks: 16, isPlaceholder: true },
    { id: "cms-04", name: "Program name (placeholder)", code: "CMS-04", level: "Undergraduate", campus: "CMSE (Lakewood)", compliedChecks: 11, totalChecks: 16, isPlaceholder: true },
    { id: "cms-05", name: "Program name (placeholder)", code: "CMS-05", level: "Graduate", campus: "CMSE (Lakewood)", compliedChecks: 9, totalChecks: 15, isPlaceholder: true }
  ] as ProgramItem[]
};
