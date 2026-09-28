import React from 'react';
import { Download, Building2, Users, Clock } from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { exportForm8ToExcel } from '../utils/excelExport';

interface OutreachProgramCardItem {
  id: string;
  title: string;
  description: string;
  moa?: string;
  target: string;
  duration?: string;
  outcomes: string;
}

const outreachData: OutreachProgramCardItem[] = [
  {
    id: 'o1',
    title: 'Climate-Resilient Zampen Native Chicken Production',
    description: 'Baseline vulnerability assessment and climate-resilient poultry production methods for farmers in target communities. Based on faculty research.',
    moa: 'MOA: Katipunan, Mahayag, Mati',
    target: 'Target: Poultry farmers and raisers',
    duration: '1 month, per site',
    outcomes: 'Farmers aware of risks; improved climate-resilient production practices.',
  },
  {
    id: 'o2',
    title: 'E-PHARIAN Program',
    description: 'Digital extension program supporting rural communities. Collaborative outreach with Dumalinao partner organizations.',
    moa: 'MOPA: Dumalinao',
    target: 'Rural community participants',
    outcomes: 'Improved digital access and community services.',
  },
  {
    id: 'o3',
    title: 'AR & Attendance Project LAMDAG',
    description: 'Augmented reality and smart attendance tracking system for schools in partner communities.',
    target: 'School communities',
    duration: 'Ongoing',
    outcomes: 'Modernized attendance systems; improved school administration.',
  },
];

export const Form8Page: React.FC = () => {
  return (
    <div className="w-full bg-[#F4F6F1] pb-16 font-sans">
      {/* Hero Band */}
      <InnerHeroBand
        breadcrumb="Form 8"
        title="Form 8 Outreach Programs"
        subtitle="Community outreach and extension programs based on faculty research, their objectives, target communities, and expected outcomes."
      />

      {/* Hero Stats */}
      <div className="max-w-[1136px] mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">3</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Outreach programs (2026)</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">Main</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Campus covered</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">3</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Collaborating agencies</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">2026</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Reference year</div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-[#E5E9E2] rounded-signature p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)]">
          {/* Section Heading */}
          <div className="flex items-center gap-3 mb-6">
            <span className="w-3 h-3 rounded-full bg-[#E8AE1F]" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#15221A]">Outreach program cards</h2>
            <div className="flex-1 border-b border-dashed border-[#CBD5E1]" />
          </div>

          {/* Export Row */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <button
              onClick={exportForm8ToExcel}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs sm:text-sm rounded-lg hover:bg-[#1E4D2B]/5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export to Excel</span>
            </button>
          </div>

          {/* Cards Grid (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {outreachData.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-[#1E4D2B] mb-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed mb-4">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#64748B] font-medium mb-4">
                    {item.moa && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>{item.moa}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span>{item.target}</span>
                    </div>
                    {item.duration && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>{item.duration}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F1F5F9] text-xs text-[#334155]">
                  <span className="font-bold text-[#15221A]">Expected outcomes: </span>
                  <span>{item.outcomes}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E5E9E2] text-xs text-[#64748B]">
            Source: Form 8 — outreach programs based on faculty research, reference year 2026, Main Campus.
          </div>
        </div>
      </div>
    </div>
  );
};
