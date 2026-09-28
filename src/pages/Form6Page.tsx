import React, { useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { exportForm6ToExcel } from '../utils/excelExport';

interface SupportItem {
  id: string;
  title: string;
  description: string;
  evidenceText: string;
  isLink: boolean;
  status: 'With evidence' | 'Pending';
}

const generalSupportItems: SupportItem[] = [
  {
    id: 'g1',
    title: '1. Counseling and Guidance Services',
    description: 'Provides students with professional psychological and career counseling.',
    evidenceText: 'guidance-manual-2025.pdf',
    isLink: true,
    status: 'With evidence',
  },
  {
    id: 'g2',
    title: '2. Wellness and Recreation Facilities',
    description: 'Spaces and programs promoting physical, mental, and social well-being of students.',
    evidenceText: 'facilities-inventory.pdf',
    isLink: true,
    status: 'With evidence',
  },
  {
    id: 'g3',
    title: '3. Student Information and Communication',
    description: 'Bulletin boards, digital platforms, and other student information channels.',
    evidenceText: 'insert narrative description',
    isLink: false,
    status: 'Pending',
  },
  {
    id: 'g4',
    title: '4. Student Organization and Activities',
    description: 'Active student organizations accredited by the institution with regular activities.',
    evidenceText: 'org-accreditation-list.pdf',
    isLink: true,
    status: 'With evidence',
  },
];

const specialSupportItems: SupportItem[] = [
  {
    id: 's1',
    title: 'Office of Student Affairs',
    description: 'Dedicated office managing student welfare, discipline, and scholarship programs.',
    evidenceText: 'osa-annual-report.pdf',
    isLink: true,
    status: 'With evidence',
  },
  {
    id: 's2',
    title: 'Scholarship and Financial Assistance',
    description: 'Programs providing financial support to qualified students.',
    evidenceText: 'insert narrative description',
    isLink: false,
    status: 'Pending',
  },
];

export const Form6Page: React.FC = () => {
  const [selectedCampus, setSelectedCampus] = useState<string>('Main campus');

  return (
    <div className="w-full bg-[#F4F6F1] pb-16 font-sans">
      {/* Hero Band */}
      <InnerHeroBand
        breadcrumb="Form 6"
        title="Form 6 Student Support Structures"
        subtitle="Complete listing of general and special student support services available on each campus. Same CMO requirements — select a campus to view its records."
      />

      {/* Hero Stats */}
      <div className="max-w-[1136px] mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">4</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Campuses covered</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">10</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">General support areas</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">6</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Special support areas</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">7</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Areas with evidence</div>
          </div>
        </div>

        {/* Card 1: General Support Structures */}
        <div className="bg-white border border-[#E5E9E2] rounded-signature p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)] mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-3 h-3 rounded-full bg-[#E8AE1F]" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#15221A]">General support structures</h2>
            <div className="flex-1 border-b border-dashed border-[#CBD5E1]" />
          </div>

          {/* Filters + Export */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-2">
              {['Main campus', 'Pagadian', 'Dumingag', 'CMSE'].map((campus) => (
                <button
                  key={campus}
                  onClick={() => setSelectedCampus(campus)}
                  type="button"
                  className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    selectedCampus === campus
                      ? 'bg-[#0E3322] text-white shadow-xs'
                      : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {campus}
                </button>
              ))}
            </div>

            <button
              onClick={() => exportForm6ToExcel(selectedCampus)}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs sm:text-sm rounded-lg hover:bg-[#1E4D2B]/5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export this campus</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  <th scope="col" className="py-3 pr-4">Support structure</th>
                  <th scope="col" className="py-3 px-4">Description / evidence</th>
                  <th scope="col" className="py-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm divide-y divide-[#F1F5F9]">
                {generalSupportItems.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-4 pr-4">
                      <div className="font-bold text-[#15221A]">{row.title}</div>
                      <div className="text-xs text-[#64748B] font-normal mt-0.5">{row.description}</div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs">
                      {row.isLink ? (
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="text-[#2563EB] underline hover:text-[#1D4ED8] inline-flex items-center gap-1"
                        >
                          <span>{row.evidenceText}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[#94A3B8] italic">{row.evidenceText}</span>
                      )}
                    </td>
                    <td className="py-4 pl-4 text-right">
                      {row.status === 'With evidence' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
                          ✓ With evidence
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: Special Support Structures */}
        <div className="bg-white border border-[#E5E9E2] rounded-signature p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)]">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-3 h-3 rounded-full bg-[#E8AE1F]" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#15221A]">Special support structures</h2>
            <div className="flex-1 border-b border-dashed border-[#CBD5E1]" />
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  <th scope="col" className="py-3 pr-4">Support structure</th>
                  <th scope="col" className="py-3 px-4">Description / evidence</th>
                  <th scope="col" className="py-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm divide-y divide-[#F1F5F9]">
                {specialSupportItems.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-4 pr-4">
                      <div className="font-bold text-[#15221A]">{row.title}</div>
                      <div className="text-xs text-[#64748B] font-normal mt-0.5">{row.description}</div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs">
                      {row.isLink ? (
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="text-[#2563EB] underline hover:text-[#1D4ED8] inline-flex items-center gap-1"
                        >
                          <span>{row.evidenceText}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[#94A3B8] italic">{row.evidenceText}</span>
                      )}
                    </td>
                    <td className="py-4 pl-4 text-right">
                      {row.status === 'With evidence' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
                          ✓ With evidence
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 pt-4 border-t border-[#E5E9E2] text-xs text-[#64748B]">
            Source: Form 6 — {selectedCampus}.
          </div>
        </div>
      </div>
    </div>
  );
};
