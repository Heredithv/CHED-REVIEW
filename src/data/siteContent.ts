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
  notComplied: number;
  pending: number;
  total: number;
  areasComplied?: number;
  areasNotComplied?: number;
  areasPending?: number;
  areasTotal?: number;
  campusFilter: string;
}

export const siteContent = {
  collegeName: "J.H. Cerilles State College",
  tagline: "Road to university status",
  actNumber: "Republic Act No. 12295",
  dataAsOf: "Nov 4, 2026",
  footerText: "© 2026 J.H. Cerilles State College.",
  footerDate: "Data as of Nov 4, 2026",

  navItems: [
    { label: "About", href: "#about", isHashScroll: true },
    { label: "President's Message", href: "#reviews", isHashScroll: true },
    { label: "Forms 1–8", href: "#forms", isHashScroll: true },
    { label: "Programs", href: "#programs" },
    { label: "Map", href: "#map", isHashScroll: true }
  ],

  hero: {
    titleLines: ["Road to", "university", "status"],
    subtitle: "Every form and program the college has submitted to CHED, organized in one transparent evaluation portal.",
    metaDateLabel: "Data as of",
    metaDateValue: "Nov 4, 2026",
    metaAct: "Republic Act No. 12295",
    stats: [
      { value: "9,953", label: "students enrolled" },
      { value: "51", label: "degree programs" },
      { value: "227", label: "full-time faculty" },
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
    body: "J.H. Cerilles State College is transitioning into a comprehensive state university pursuant to Republic Act No. 12295. This institutional repository presents the college’s official submissions for Commission on Higher Education (CHED) evaluation: the eight institutional compliance forms, programmatic self-survey evidence across all four accredited campuses, and verified institutional records. Evaluators have direct, transparent access to live institutional data and linked official CHED spreadsheets without authentication barriers.",
    cards: [
      {
        icon: "document",
        title: "Institutional Documentation",
        description: "Official CHED Forms 1 to 8 and 51 degree program compliance portfolios across all four campuses."
      },
      {
        icon: "spreadsheet",
        title: "Verified Cloud Spreadsheets",
        description: "Directly linked to official CHED working spreadsheets and institutional database records for transparent evaluation."
      }
    ]
  },

  presidentMessage: {
    eyebrow: "PRESIDENT'S MESSAGE",
    heading: "A vision carried\nby every campus",
    subtitle: "Official statement of institutional commitment for the CHED University Conversion Evaluation.",
    presidentName: "Dr. Edgardo H. Rosales, Ed.D, JD",
    presidentRole: "College President II",
    institution: "J.H. Cerilles State College",
    photoUrl: "/assets/president_portrait.png",
    salutation: "To the Commission on Higher Education (CHED) Evaluation Committee, Academic Peers, and the JHCSC Community:",
    pullQuote: "Our journey to university status is not merely an institutional milestone — it is a promise to every student, faculty member, and community we serve.",
    paragraphs: [
      "J.H. Cerilles State College has grown from a regional institution into a multi-campus academic community committed to excellence in instruction, research, and extension. Today, we stand before the Commission on Higher Education with full confidence in the quality of our programs, our people, and our processes.",
      "This portal reflects our transparency and readiness. Every document here is a testament to the dedication of our faculty, staff, and administration."
    ],
    fullMessageParagraphs: [
      "Prepared in fulfillment of Republic Act No. 12295 and the operational requirements of CMO No. 46, series of 2012, this portal consolidates our verified institutional records across all eight CHED evaluation forms and fifty-one degree program offerings across Main Campus in Mati, San Miguel, Dumingag Campus, Pagadian Annex, and Lakewood Campus.",
      "From strengthening our graduate-qualified faculty profile and expanding funded research outputs to upgrading our library holdings, student support systems, research linkages, and community extension initiatives, our preparation has been guided by rigorous self-assessment and continuous quality improvement as we take this historic step toward becoming a full-fledged state university."
    ],
    metaDetails: [
      { label: "Legal Mandate", value: "Republic Act No. 12295" },
      { label: "Evaluation Framework", value: "CHED CMO No. 46, s. 2012" },
      { label: "Institutional Scope", value: "4 Campuses · Forms 1 to 8" }
    ]
  },

  whatChedReviews: {
    heading: "What CHED reviews",
    subtitle: "The requirements in CMO No. 46, series of 2012, grouped into three questions.",
    cards: [
      {
        number: "51",
        label: "degree programs",
        title: "Programs and enrollment",
        desc: "Undergraduate and graduate programs across 4 campuses, with 9,953 students enrolled.",
        linkText: "See every program",
        href: "#programs"
      },
      {
        number: "227",
        label: "full-time faculty",
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
        { num: 1, name: "Programs and enrollment", desc: "Curricular offerings and student enrollment across 4 campuses", status: "Open form", isOpen: true, href: "#form1" },
        { num: 2, name: "Faculty", desc: "Faculty profiles, academic ranks, and teaching loads", status: "Open form", isOpen: true, href: "#form2" },
        { num: 3, name: "Research involvement", desc: "Faculty research involvement, researches, and outputs", status: "Open form", isOpen: true, href: "#form3" },
        { num: 4, name: "Research spending", desc: "Annual research expenditures funded through GAA and STF", status: "Open form", isOpen: true, href: "#form4" }
      ] as ChedFormItem[]
    },
    card2: {
      title: "Resources, linkages and outreach",
      forms: [
        { num: 5, name: "Learning resources", desc: "Library holdings, laboratories, and campus facilities", status: "Open form", isOpen: true, href: "#form5" },
        { num: 6, name: "Student support", desc: "Student welfare services, affairs, and campus support", status: "Open form", isOpen: true, href: "#form6" },
        { num: 7, name: "Research linkages", desc: "Active research partnerships and institutional linkages", status: "Open form", isOpen: true, href: "#form7" },
        { num: 8, name: "Outreach", desc: "Community extension programs and outreach initiatives", status: "Open form", isOpen: true, href: "#form8" }
      ] as ChedFormItem[]
    }
  },

  campusesSection: {
    heading: "Program compliance by campus",
    subtitle: "730 of 1,126 requirement checks across 51 program forms are marked complied (65%), with 95 not complied and 301 pending.",
    campuses: [
      { name: "Main", programsCount: 23, percent: 65, complied: 346, notComplied: 31, pending: 158, total: 535, campusFilter: "Main campus" },
      { name: "Dumingag", programsCount: 14, percent: 67, complied: 224, notComplied: 28, pending: 80, total: 332, campusFilter: "Dumingag campus" },
      { name: "Pagadian", programsCount: 6, percent: 81, complied: 109, notComplied: 9, pending: 16, total: 134, campusFilter: "Pagadian campus" },
      { name: "Lakewood", programsCount: 5, percent: 41, complied: 51, notComplied: 27, pending: 47, total: 125, campusFilter: "Lakewood" }
    ] as CampusScorecard[],
    legend: {
      complied: "Complied",
      notComplied: "Not complied",
      pending: "Pending / no data"
    }
  },

  closingPanel: {
    heading: "In review with CHEDRO IX",
    subtitle: "One conversion, four campuses.",
    campuses: ["Main", "Dumingag", "Pagadian", "Lakewood"]
  }
};
