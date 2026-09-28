export interface Form3SchoolRow {
  school: string;
  fullTimeFaculty: number;
  ongoingCount: number;
  ongoingPercent: number;
  completedCount: number;
  completedPercent: number;
  bothCount: number;
  bothPercent: number;
}

export interface Form3CampusGroup {
  campusName: string;
  schools: Form3SchoolRow[];
  total: Form3SchoolRow;
}

export const form3PageData = {
  breadcrumbHome: "Home",
  breadcrumbCurrent: "Form 3",
  title: "Form 3: Research involvement",
  subtitle: "107 of 222 full-time faculty (48%) have ongoing or completed research. CMO No. 46 asks for at least 45, which is 20% of all full-time faculty.",
  subtitleHighlight: "107 of 222",
  exportButtonText: "Export to Excel",
  exportFileName: "Form-3-Research-Involvement.xlsx",
  sheetName: "Form 3 Research Involvement",
  note: "Faculty with both ongoing and completed research are counted once in the headline total. Data as of April 22, 2026.",
  sourceFootnote: "Source: Form 3 summary, prepared by the Research Director.",

  tableColumns: {
    school: "School",
    fullTimeFaculty: "Full-time faculty",
    ongoing: "Ongoing research",
    completed: "Completed research",
    both: "Both"
  },

  campuses: [
    {
      campusName: "Main campus",
      schools: [
        {
          school: "School of Agriculture and Forestry",
          fullTimeFaculty: 39,
          ongoingCount: 14,
          ongoingPercent: 36,
          completedCount: 15,
          completedPercent: 38,
          bothCount: 10,
          bothPercent: 26
        },
        {
          school: "School of Education",
          fullTimeFaculty: 28,
          ongoingCount: 5,
          ongoingPercent: 18,
          completedCount: 12,
          completedPercent: 43,
          bothCount: 3,
          bothPercent: 11
        },
        {
          school: "School of Engineering and Technology",
          fullTimeFaculty: 24,
          ongoingCount: 3,
          ongoingPercent: 13,
          completedCount: 14,
          completedPercent: 58,
          bothCount: 2,
          bothPercent: 8
        },
        {
          school: "School of Arts and Sciences",
          fullTimeFaculty: 19,
          ongoingCount: 2,
          ongoingPercent: 11,
          completedCount: 9,
          completedPercent: 47,
          bothCount: 1,
          bothPercent: 5
        },
        {
          school: "School of Business and Management",
          fullTimeFaculty: 15,
          ongoingCount: 1,
          ongoingPercent: 7,
          completedCount: 8,
          completedPercent: 53,
          bothCount: 1,
          bothPercent: 7
        }
      ],
      total: {
        school: "Campus total",
        fullTimeFaculty: 125,
        ongoingCount: 25,
        ongoingPercent: 20,
        completedCount: 58,
        completedPercent: 46,
        bothCount: 17,
        bothPercent: 14
      }
    },
    {
      campusName: "Pagadian campus",
      schools: [
        {
          school: "School of Education",
          fullTimeFaculty: 12,
          ongoingCount: 1,
          ongoingPercent: 8,
          completedCount: 7,
          completedPercent: 58,
          bothCount: 1,
          bothPercent: 8
        },
        {
          school: "School of Business and Management",
          fullTimeFaculty: 9,
          ongoingCount: 0,
          ongoingPercent: 0,
          completedCount: 5,
          completedPercent: 56,
          bothCount: 0,
          bothPercent: 0
        }
      ],
      total: {
        school: "Campus total",
        fullTimeFaculty: 21,
        ongoingCount: 1,
        ongoingPercent: 5,
        completedCount: 12,
        completedPercent: 57,
        bothCount: 1,
        bothPercent: 5
      }
    },
    {
      campusName: "CMSE (Lakewood)",
      schools: [
        {
          school: "School of Environmental Science",
          fullTimeFaculty: 14,
          ongoingCount: 1,
          ongoingPercent: 7,
          completedCount: 5,
          completedPercent: 36,
          bothCount: 1,
          bothPercent: 7
        }
      ],
      total: {
        school: "Campus total",
        fullTimeFaculty: 14,
        ongoingCount: 1,
        ongoingPercent: 7,
        completedCount: 5,
        completedPercent: 36,
        bothCount: 1,
        bothPercent: 7
      }
    },
    {
      campusName: "Dumingag campus",
      schools: [
        {
          school: "School of Agriculture",
          fullTimeFaculty: 32,
          ongoingCount: 3,
          ongoingPercent: 9,
          completedCount: 12,
          completedPercent: 38,
          bothCount: 1,
          bothPercent: 3
        },
        {
          school: "School of Criminology",
          fullTimeFaculty: 18,
          ongoingCount: 1,
          ongoingPercent: 6,
          completedCount: 5,
          completedPercent: 28,
          bothCount: 0,
          bothPercent: 0
        },
        {
          school: "School of Arts and Sciences",
          fullTimeFaculty: 12,
          ongoingCount: 0,
          ongoingPercent: 0,
          completedCount: 4,
          completedPercent: 33,
          bothCount: 0,
          bothPercent: 0
        }
      ],
      total: {
        school: "Campus total",
        fullTimeFaculty: 62,
        ongoingCount: 4,
        ongoingPercent: 6,
        completedCount: 21,
        completedPercent: 34,
        bothCount: 1,
        bothPercent: 2
      }
    }
  ] as Form3CampusGroup[],

  allCampusesTotal: {
    school: "All campuses",
    fullTimeFaculty: 222,
    ongoingCount: 31,
    ongoingPercent: 14,
    completedCount: 96,
    completedPercent: 43,
    bothCount: 20,
    bothPercent: 9
  } as Form3SchoolRow
};
