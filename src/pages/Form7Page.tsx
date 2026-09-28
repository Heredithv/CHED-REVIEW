import React from 'react';
import { Download, Calendar } from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { exportForm7ToExcel } from '../utils/excelExport';

interface PartnershipCardItem {
  id: string;
  category: string;
  title: string;
  description: string;
  dateProgram: string;
}

const partnershipsData: PartnershipCardItem[] = [
  {
    id: 'p1',
    category: 'Research & Development',
    title: 'Department of Agriculture — Bureau of Agricultural Research',
    description: 'Crop-Land Suitability Assessment research partnership. Soil test results and fertilizer recommendations.',
    dateProgram: 'Nov 2021 – Jun 2023 · BS Agriculture',
  },
  {
    id: 'p2',
    category: 'Technology Transfer',
    title: 'Jose Rizal Memorial State University (Siocon)',
    description: 'Technology transfer, technology incubation. Supports BSEntrep, BSHM, BSA, BSIT, BTVTED-FSM programs.',
    dateProgram: 'Aug 2025 – Aug 2030',
  },
  {
    id: 'p3',
    category: 'Research, Development & Extension',
    title: 'Jose Rizal Memorial State University',
    description: 'Collaborative research, development and extension activities across programs.',
    dateProgram: 'Aug 2025 – Aug 2030',
  },
  {
    id: 'p4',
    category: 'Research, Development & Extension',
    title: 'Agriculture & Fisheries Research Institute (AFRI)',
    description: 'Research, development and extension in agriculture and fisheries. BS Agriculture supported.',
    dateProgram: 'Apr 2025 – Apr 2028',
  },
  {
    id: 'p5',
    category: 'Research & Extension',
    title: 'University of Rizal System — Research Center',
    description: 'Research, extension, resource sharing and academic exchange partnership.',
    dateProgram: 'Mar 2022 – Mar 2027',
  },
  {
    id: 'p6',
    category: 'Research & Development',
    title: 'Philippine Coconut Authority',
    description: 'Seed Farm Development Project — establishment of coconut seed farm. BS Agriculture.',
    dateProgram: 'Oct 2024 – Oct 2059',
  },
];

export const Form7Page: React.FC = () => {
  return (
    <div className="w-full bg-[#F4F6F1] pb-16 font-sans">
      {/* Hero Band */}
      <InnerHeroBand
        breadcrumb="Form 7"
        title="Form 7 Research Linkages"
        subtitle="Research partnerships and memoranda of agreement with local and international institutions. 11 active linkages supporting academic programs."
      />

      {/* Hero Stats */}
      <div className="max-w-[1136px] mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">11</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Total linkages</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">11</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Local institutions</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">0</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">International</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">6</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Active MOAs</div>
          </div>
        </div>

        {/* Main White Card Container */}
        <div className="bg-white border border-[#E5E9E2] rounded-signature p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)]">
          {/* Section Heading */}
          <div className="flex items-center gap-3 mb-6">
            <span className="w-3 h-3 rounded-full bg-[#E8AE1F]" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#15221A]">Partnership cards</h2>
            <div className="flex-1 border-b border-dashed border-[#CBD5E1]" />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <button
              onClick={exportForm7ToExcel}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs sm:text-sm rounded-lg hover:bg-[#1E4D2B]/5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export to Excel</span>
            </button>
            <span className="text-xs sm:text-sm text-[#64748B]">11 partnerships listed</span>
          </div>

          {/* Cards Grid (3 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {partnershipsData.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#E2E8F0] border-l-4 border-l-[#E8AE1F] rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#DCFCE7] text-[#166534] mb-3">
                    {item.category}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-[#15221A] leading-snug mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium pt-3 border-t border-[#F1F5F9]">
                  <Calendar className="w-3.5 h-3.5 text-[#E8AE1F] shrink-0" />
                  <span>{item.dateProgram}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E5E9E2] text-xs text-[#64748B]">
            Source: Form 7 — complete listing of research linkages.
          </div>
        </div>
      </div>
    </div>
  );
};
