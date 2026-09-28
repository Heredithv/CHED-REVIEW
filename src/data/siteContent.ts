export interface NavItem {
  label: string;
  href: string;
  isHashScroll?: boolean;
}

export interface MetricCard {
  number: string;
  subNumber?: string;
  label: string;
  title: string;
  desc: string;
  linkText: string;
  href: string;
}

export interface ChedFormItem {
  num: number;
  name: string;
  desc: string;
  status: 'Open form' | 'Next phase';
  isOpen: boolean;
  href: string;
}

export interface CampusScorecard {
  name: string;
  programsCount: number;
  percent: number;
  complied: number;
  total: number;
  campusFilter: string;
}

export const siteContent = {
  collegeName: "J.H. Cerilles State College",
  tagline: "Road to university status",
  actNumber: "Republic Act No. 12295",
  dataAsOf: "October 1, 2026",
  footerText: "© 2026 J.H. Cerilles State College.",
  footerDate: "October 1, 2026",

  navItems: [
    { label: "About", href: "#about", isHashScroll: true },
    { label: "What CHED reviews", href: "#reviews", isHashScroll: true },
    { label: "Forms 1–8", href: "#forms", isHashScroll: true },
    { label: "Requirements", href: "#requirements" },
    { label: "Programs", href: "#programs" }
  ],

  hero: {
    titleLines: ["Road to", "university", "status"],
    subtitle: "Every form and program the college has submitted to CHED, in one place and ready to download.",
    metaDateLabel: "Data as of",
    metaDateValue: "October 1, 2026",
    metaAct: "Republic Act No. 12295",
    stats: [
      { value: "9,587", label: "students enrolled" },
      { value: "42", label: "degree programs" },
      { value: "222", label: "full-time faculty" },
      { value: "4", label: "campuses" }
    ],
    road: {
      startLabel: "Today",
      endLabel: "University",
      endLogoText: "JH",
      stops: [
        { num: 1, name: "Programs and enrollment", href: "#form1" },
        { num: 2, name: "Faculty", href: "#form2" },
        { num: 3, name: "Research involvement", href: "#form3" },
        { num: 4, name: "Research spending", href: "#form4" },
        { num: 5, name: "Learning resources", href: "#form5" },
        { num: 6, name: "Student support", href: "#form6" },
        { num: 7, name: "Research linkages", href: "#form7" },
        { num: 8, name: "Outreach", href: "#form8" }
      ]
    }
  },

  about: {
    heading: "About the conversion",
    body: "J.H. Cerilles State College is converting into a state university under Republic Act No. 12295. This site puts the college's submissions in front of CHED reviewers: the eight institutional forms, the compliance record of each program, and the evidence behind them. There is nothing to sign in to, and every table downloads as an Excel file.",
    cards: [
      {
        icon: "document",
        title: "Complete records",
        description: "Forms 1 to 8 and 43 program compliance forms across four campuses."
      },
      {
        icon: "download",
        title: "Ready to download",
        description: "Every table exports to Excel, filtered the way you see it."
      }
    ]
  },

  whatChedReviews: {
    heading: "What CHED reviews",
    subtitle: "The requirements in CMO No. 46, series of 2012, grouped into three questions.",
    cards: [
      {
        number: "42",
        label: "degree programs",
        title: "Programs and enrollment",
        desc: "34 undergraduate and 8 graduate programs, with 9,587 students enrolled.",
        linkText: "See every program",
        href: "#programs"
      },
      {
        number: "107",
        subNumber: "of 222",
        label: "full-time faculty doing research",
        title: "Faculty and research",
        desc: "₱9.51M went to research in school year 2025, 2.3 times the expected amount.",
        linkText: "Open Form 3",
        href: "#form3"
      },
      {
        number: "11",
        label: "research linkages listed",
        title: "Resources, linkages and outreach",
        desc: "Library and student support records for each campus, plus outreach programs.",
        linkText: "See the requirements",
        href: "#requirements"
      }
    ] as MetricCard[]
  },

  formsSection: {
    heading: "CHED Forms 1 to 8",
    subtitle: "The submitted evidence, form by form. Open a form to see its data.",
    card1: {
      title: "Programs, faculty and research",
      forms: [
        { num: 1, name: "Programs and enrollment", desc: "42 programs and 9,587 students", status: "Open form", isOpen: true, href: "#form1" },
        { num: 2, name: "Faculty", desc: "Rank, employment status, degrees and assignments", status: "Open form", isOpen: true, href: "#form2" },
        { num: 3, name: "Research involvement", desc: "107 of 222 full-time faculty do research", status: "Open form", isOpen: true, href: "#form3" },
        { num: 4, name: "Research spending", desc: "₱9.51M spent in school year 2025", status: "Open form", isOpen: true, href: "#form4" }
      ] as ChedFormItem[]
    },
    card2: {
      title: "Resources, linkages and outreach",
      forms: [
        { num: 5, name: "Learning resources", desc: "Library and facilities, one table per campus", status: "Open form", isOpen: true, href: "#form5" },
        { num: 6, name: "Student support", desc: "Support structures and services, per campus", status: "Open form", isOpen: true, href: "#form6" },
        { num: 7, name: "Research linkages", desc: "11 research linkages listed", status: "Open form", isOpen: true, href: "#form7" },
        { num: 8, name: "Outreach", desc: "Outreach and extension programs", status: "Open form", isOpen: true, href: "#form8" }
      ] as ChedFormItem[]
    }
  },

  campusesSection: {
    heading: "Program compliance by campus",
    subtitle: "598 of 739 requirement checks across 43 program forms are marked complied (81%).",
    campuses: [
      { name: "Main", programsCount: 21, percent: 80, complied: 278, total: 349, campusFilter: "Main campus" },
      { name: "Dumingag", programsCount: 12, percent: 84, complied: 184, total: 218, campusFilter: "Dumingag campus" },
      { name: "Pagadian", programsCount: 5, percent: 90, complied: 85, total: 94, campusFilter: "Pagadian campus" },
      { name: "CMSE (Lakewood)", programsCount: 5, percent: 65, complied: 51, total: 78, campusFilter: "CMSE (Lakewood)" }
    ] as CampusScorecard[],
    legend: {
      complied: "Complied",
      notComplied: "Not complied"
    }
  },

  closingPanel: {
    heading: "In review with CHEDRO IX",
    subtitle: "One conversion, four campuses.",
    campuses: ["Main", "Dumingag", "Pagadian", "CMSE (Lakewood)"]
  }
};
