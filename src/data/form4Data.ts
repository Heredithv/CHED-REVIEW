export interface Form4SpendingRow {
  schoolYear: string;
  facultyCount: number;
  expected: number;
  expectedFormatted: string;
  expectedShort: string;
  actual: number;
  actualFormatted: string;
  actualShort: string;
  difference: number;
  differenceFormatted: string;
  ratio: string;
}

export const form4PageData = {
  breadcrumbHome: "Home",
  breadcrumbCurrent: "Form 4",
  title: "Form 4: Research spending",
  subtitle: "Annual research expenditures and faculty involvement for SY 2021–2025, funded through GAA and STF.",
  subtitleHighlight: "2.2 to 3.8 times",

  chartCard: {
    title: "Expected and actual spending by school year",
    desc: "Expected spending is ₱75,000 for each full-time faculty member involved in research (CMO No. 46, series of 2012).",
    legend: {
      expected: "Expected",
      actual: "Actual"
    }
  },

  tableCard: {
    exportButtonText: "Export to Excel",
    exportFileName: "Form-4-Research-Spending.xlsx",
    sheetName: "Form 4 Research Spending",
    note: "Data as of April 22, 2026.",
    columns: {
      schoolYear: "School year",
      facultyCount: "Faculty doing research",
      expected: "Expected",
      actual: "Actual",
      difference: "Difference",
      ratio: "Actual vs expected"
    }
  },

  sourceFootnote: "Source: Form 4, annual research cost expenditure.",

  records: [
    {
      schoolYear: "SY 2021",
      facultyCount: 24,
      expected: 1800000.00,
      expectedFormatted: "₱1,800,000.00",
      expectedShort: "₱1.80M",
      actual: 6871216.81,
      actualFormatted: "₱6,871,216.81",
      actualShort: "₱6.87M",
      difference: 5071216.81,
      differenceFormatted: "₱5,071,216.81",
      ratio: "3.8×"
    },
    {
      schoolYear: "SY 2022",
      facultyCount: 30,
      expected: 2250000.00,
      expectedFormatted: "₱2,250,000.00",
      expectedShort: "₱2.25M",
      actual: 6140857.99,
      actualFormatted: "₱6,140,857.99",
      actualShort: "₱6.14M",
      difference: 3890857.99,
      differenceFormatted: "₱3,890,857.99",
      ratio: "2.7×"
    },
    {
      schoolYear: "SY 2023",
      facultyCount: 41,
      expected: 3075000.00,
      expectedFormatted: "₱3,075,000.00",
      expectedShort: "₱3.08M",
      actual: 6754058.39,
      actualFormatted: "₱6,754,058.39",
      actualShort: "₱6.75M",
      difference: 3679058.39,
      differenceFormatted: "₱3,679,058.39",
      ratio: "2.2×"
    },
    {
      schoolYear: "SY 2024",
      facultyCount: 46,
      expected: 3450000.00,
      expectedFormatted: "₱3,450,000.00",
      expectedShort: "₱3.45M",
      actual: 8269307.81,
      actualFormatted: "₱8,269,307.81",
      actualShort: "₱8.27M",
      difference: 4819307.81,
      differenceFormatted: "₱4,819,307.81",
      ratio: "2.4×"
    },
    {
      schoolYear: "SY 2025",
      facultyCount: 56,
      expected: 4200000.00,
      expectedFormatted: "₱4,200,000.00",
      expectedShort: "₱4.20M",
      actual: 9511178.08,
      actualFormatted: "₱9,511,178.08",
      actualShort: "₱9.51M",
      difference: 5311178.08,
      differenceFormatted: "₱5,311,178.08",
      ratio: "2.3×"
    }
  ] as Form4SpendingRow[]
};
