import React from 'react';
import { Download } from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { exportForm4ToExcel } from '../utils/excelExport';

const spendingRows = [
  { sy: 'School Year 2021', faculty: 24, expected: '1,800,000.00', actual: '6,871,216.81', diff: '5,071,216.81', ratio: '3.8×', expectedNum: 1.8, actualNum: 6.87 },
  { sy: 'School Year 2022', faculty: 30, expected: '2,250,000.00', actual: '6,140,857.99', diff: '3,890,857.99', ratio: '2.7×', expectedNum: 2.25, actualNum: 6.14 },
  { sy: 'School Year 2023', faculty: 41, expected: '3,075,000.00', actual: '6,754,058.39', diff: '3,679,058.39', ratio: '2.2×', expectedNum: 3.08, actualNum: 6.75 },
  { sy: 'School Year 2024', faculty: 46, expected: '3,450,000.00', actual: '8,269,307.81', diff: '4,819,307.81', ratio: '2.4×', expectedNum: 3.45, actualNum: 8.27 },
  { sy: 'School Year 2025', faculty: 56, expected: '4,200,000.00', actual: '9,511,178.08', diff: '5,311,178.08', ratio: '2.3×', expectedNum: 4.20, actualNum: 9.51 },
];

export const Form4Page: React.FC = () => {
  const maxVal = 10; // 10M scale for bar heights

  return (
    <div className="w-full bg-[#F4F6F1] pb-16 font-sans">
      {/* Hero Band */}
      <InnerHeroBand
        breadcrumb="Form 4"
        title="Form 4 Research Spending"
        subtitle="Actual annual research cost vs. expected (₱75,000 per research-active faculty). Actual spending exceeded the target in all 5 school years."
      />

      {/* Hero Stats */}
      <div className="max-w-[1136px] mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">₱9.51M</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Actual spend, SY 2025</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">₱4.20M</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Expected, SY 2025</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">2.3×</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Actual vs expected (2025)</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">56</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Research-active faculty (2025)</div>
          </div>
        </div>

        {/* Chart + Table Container */}
        <div className="bg-white border border-[#E5E9E2] rounded-signature p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)]">
          {/* Section Title */}
          <div className="flex items-center gap-3 mb-2">
            <span className="w-3 h-3 rounded-full bg-[#E8AE1F]" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#15221A]">Expected vs. actual research cost</h2>
            <div className="flex-1 border-b border-dashed border-[#CBD5E1]" />
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mb-6">
            Expected = ₱75,000 × number of research-active faculty (CMO No. 46, s. 2012)
          </p>

          {/* Legend */}
          <div className="flex items-center gap-6 mb-8 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[#FEF9C3] border border-[#E8AE1F] rounded-xs" />
              <span className="text-[#334155] font-medium">Expected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[#1E4D2B] rounded-xs" />
              <span className="text-[#334155] font-medium">Actual</span>
            </div>
          </div>

          {/* Dual Bar Chart */}
          <div className="relative pt-8 pb-4 mb-8 border-b border-[#CBD5E1]">
            <div className="grid grid-cols-5 gap-4 sm:gap-8 h-64 items-end max-w-4xl mx-auto">
              {spendingRows.map((item) => {
                const expHeight = (item.expectedNum / maxVal) * 100;
                const actHeight = (item.actualNum / maxVal) * 100;

                return (
                  <div key={item.sy} className="flex flex-col items-center h-full justify-end group">
                    <div className="flex items-end gap-1.5 sm:gap-2.5 w-full justify-center h-full">
                      {/* Expected Bar */}
                      <div className="relative flex flex-col items-center">
                        <span className="absolute -top-6 text-[10px] font-bold text-[#8C660B] bg-[#FFFBEB] px-1 py-0.5 rounded-xs border border-[#FDE68A]">
                          ₱{(Number(item.expectedNum) || 0).toFixed(2)}M
                        </span>
                        <div
                          className="w-5 sm:w-8 bg-[#FEF9C3] border border-[#E8AE1F] rounded-t-xs transition-all duration-500 group-hover:bg-[#FEF08A]"
                          style={{ height: `${expHeight}%` }}
                        />
                      </div>

                      {/* Actual Bar */}
                      <div className="relative flex flex-col items-center">
                        <span className="absolute -top-6 text-[10px] font-bold text-white bg-[#0E3322] px-1 py-0.5 rounded-xs">
                          ₱{(Number(item.actualNum) || 0).toFixed(2)}M
                        </span>
                        <div
                          className="w-6 sm:w-10 bg-[#1E4D2B] rounded-t-xs transition-all duration-500 group-hover:bg-[#0E3322]"
                          style={{ height: `${actHeight}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#475569] mt-3 whitespace-nowrap">
                      {item.sy.replace('School Year ', 'SY ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table Header Row with Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <button
              onClick={exportForm4ToExcel}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs sm:text-sm rounded-lg hover:bg-[#1E4D2B]/5 transition-all cursor-pointer w-fit"
            >
              <Download className="w-4 h-4" />
              <span>Export to Excel</span>
            </button>
            <span className="text-xs text-[#64748B]">Data as of October 1, 2026</span>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  <th scope="col" className="py-3 pr-4">School year</th>
                  <th scope="col" className="py-3 px-4 text-right">Faculty doing research</th>
                  <th scope="col" className="py-3 px-4 text-right">Expected (₱)</th>
                  <th scope="col" className="py-3 px-4 text-right">Actual (₱)</th>
                  <th scope="col" className="py-3 px-4 text-right">Difference (₱)</th>
                  <th scope="col" className="py-3 pl-4 text-right">Actual vs expected</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm divide-y divide-[#F1F5F9]">
                {spendingRows.map((r) => (
                  <tr key={r.sy} className="hover:bg-[#F8FAFC]">
                    <td className="py-3.5 pr-4 font-bold text-[#15221A]">{r.sy}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-[#15221A]">{r.faculty}</td>
                    <td className="py-3.5 px-4 text-right text-[#334155]">{r.expected}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-[#1E4D2B]">{r.actual}</td>
                    <td className="py-3.5 px-4 text-right text-[#334155]">{r.diff}</td>
                    <td className="py-3.5 pl-4 text-right font-extrabold text-[#15221A]">{r.ratio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 pt-4 border-t border-[#E5E9E2] text-xs text-[#64748B]">
            Source: Form 4, annual research cost expenditure.
          </div>
        </div>
      </div>
    </div>
  );
};
