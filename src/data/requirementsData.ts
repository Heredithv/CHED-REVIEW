export type RequirementStatus = 'needs-action' | 'complied' | 'pending';

export interface RequirementItem {
  id: number;
  area: string;
  isFirstInArea: boolean;
  requirement: string;
  statement: string;
  status: RequirementStatus;
  statusLabel: string;
  link?: {
    text: string;
    href: string;
  };
}

export const requirementsPageData = {
  breadcrumbHome: "Home",
  breadcrumbCurrent: "Requirements",
  title: "Requirements for university classification",
  subtitle: "2 of 14 requirements are marked complied, 3 need action, and 9 are waiting for a statement from the college.",
  subtitleHighlight: "2 of 14",
  cardTitle: "Basis: CMO No. 46, series of 2012",
  cardIntro: "Each requirement, the college's statement, and where the evidence sits. Data as of April 22, 2026.",
  sourceFootnote: "Source: Institutional sheet, compliance as of April 22, 2026.",
  
  tableColumns: {
    area: "Area",
    requirement: "Requirement and the college's statement",
    status: "Status"
  },

  requirements: [
    {
      id: 1,
      area: "Enrollments",
      isFirstInArea: true,
      requirement: "Graduate students are trained for professional practice and/or research",
      statement: "6 graduate programs active. Evidence in Form 1.",
      status: "needs-action",
      statusLabel: "Needs action"
    },
    {
      id: 2,
      area: "Enrollments",
      isFirstInArea: false,
      requirement: "Total enrollments of at least 5,000 students in all campuses and sites",
      statement: "9,587 students enrolled across 4 campuses. Form 1 lists all counts.",
      status: "needs-action",
      statusLabel: "Needs action"
    },
    {
      id: 3,
      area: "Enrollments",
      isFirstInArea: false,
      requirement: "At least 20% of all students are enrolled in graduate programs",
      statement: "Currently 8.2% (786 graduate students of 9,587 total). Action plan underway.",
      status: "needs-action",
      statusLabel: "Needs action"
    },
    {
      id: 4,
      area: "Programs",
      isFirstInArea: true,
      requirement: "Offers undergraduate and graduate degree programs in several disciplines",
      statement: "34 undergraduate and 8 graduate programs offered across agriculture, education, technology, arts and sciences.",
      status: "complied",
      statusLabel: "Complied"
    },
    {
      id: 5,
      area: "Programs",
      isFirstInArea: false,
      requirement: "At least 20% of degree programs are accredited at Level II or higher",
      statement: "14 of 42 programs (33.3%) hold AACCUP Level II or higher accreditation.",
      status: "complied",
      statusLabel: "Complied"
    },
    {
      id: 6,
      area: "Faculty",
      isFirstInArea: true,
      requirement: "Full-time faculty meet minimum qualification standards",
      statement: "Master's and doctorate degree holder profiles submitted under Form 2.",
      status: "pending",
      statusLabel: "Statement pending"
    },
    {
      id: 7,
      area: "Faculty",
      isFirstInArea: false,
      requirement: "Faculty development plan is implemented and funded",
      statement: "Faculty scholarship and development fund documentation in Form 2.",
      status: "pending",
      statusLabel: "Statement pending"
    },
    {
      id: 8,
      area: "Faculty",
      isFirstInArea: false,
      requirement: "Appropriate faculty rank and tenure distribution",
      statement: "Plantilla item allocation and NBC 461 reclassification sheets in Form 2.",
      status: "pending",
      statusLabel: "Statement pending"
    },
    {
      id: 9,
      area: "Faculty",
      isFirstInArea: false,
      requirement: "Faculty workload policy complies with CHED guidelines",
      statement: "Faculty load assignments across regular and overload hours in Form 2.",
      status: "pending",
      statusLabel: "Statement pending"
    },
    {
      id: 10,
      area: "Research",
      isFirstInArea: true,
      requirement: "Full-time faculty actively engaged in research and development",
      statement: "Form 3 lists 107 of 222 faculty (48%) with ongoing or completed research.",
      status: "pending",
      statusLabel: "Statement pending",
      link: {
        text: "Open Form 3",
        href: "#form3"
      }
    },
    {
      id: 11,
      area: "Research",
      isFirstInArea: false,
      requirement: "Adequate institutional budget allocated to research activities",
      statement: "Form 4 lists actual spending above the expected amount in each of the last five school years.",
      status: "pending",
      statusLabel: "Statement pending",
      link: {
        text: "Open Form 4",
        href: "#form4"
      }
    },
    {
      id: 12,
      area: "Learning resources",
      isFirstInArea: true,
      requirement: "Library collections, holdings, and digital resources meet institutional standards",
      statement: "Library holdings inventory per campus submitted in Form 5.",
      status: "pending",
      statusLabel: "Statement pending"
    },
    {
      id: 13,
      area: "Student services",
      isFirstInArea: true,
      requirement: "Comprehensive student welfare and development programs",
      statement: "Guidance, career placement, health and student org records in Form 6.",
      status: "pending",
      statusLabel: "Statement pending"
    },
    {
      id: 14,
      area: "Linkages & Extension",
      isFirstInArea: true,
      requirement: "Active linkages with industry, LGUs, and research institutions",
      statement: "11 institutional research and extension linkages listed in Form 7 and Form 8.",
      status: "pending",
      statusLabel: "Statement pending"
    }
  ] as RequirementItem[]
};
