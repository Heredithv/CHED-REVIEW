import React, { useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { exportForm5ToExcel } from '../utils/excelExport';

interface ResourceRequirement {
  id: string;
  title: string;
  description: string;
  evidenceText: string;
  isLink: boolean;
  status: 'With evidence' | 'Pending';
}

const form5Requirements: ResourceRequirement[] = [
  {
    id: 'r1',
    title: 'Library — Vision, Mission, Goals',
    description: "Section 1 of CMO 46: The library's VMG must be documented and publicly posted.",
    evidenceText: 'view_link_to_evidence.pdf',
    isLink: true,
    status: 'With evidence',
  },
  {
    id: 'r2',
    title: 'Library — Administration',
    description: 'Supervision of the library by a qualified librarian.',
    evidenceText: 'insert narrative description',
    isLink: false,
    status: 'Pending',
  },
  {
    id: 'r3',
    title: 'Library — Collection Development',
    description: 'Policy on acquisition, weeding, and budget allocation for library materials.',
    evidenceText: 'collection-policy.pdf',
    isLink: true,
    status: 'With evidence',
  },
  {
    id: 'r4',
    title: 'Online Academic Databases',
    description: 'Subscriptions to indexed online journals and databases accessible to faculty and students.',
    evidenceText: 'insert narrative description',
    isLink: false,
    status: 'Pending',
  },
  {
    id: 'r5',
    title: 'Laboratories and Facilities',
    description: 'Adequately equipped classrooms and laboratories for the programs being offered.',
    evidenceText: 'lab-inventory-2026.pdf',
    isLink: true,
    status: 'With evidence',
  },
];

export const Form5Page: React.FC = () => {
  const [selectedCampus, setSelectedCampus] = useState<string>('Main campus');

  return (
    <div className="w-full bg-[#F4F6F1] pb-16 font-sans">
      {/* Hero Band */}
      <InnerHeroBand
        breadcrumb="Form 5"
        title="Form 5 Learning Resources"
        subtitle="Complete listing of library holdings, online databases, laboratories, and other learning resources. Same requirements across all campuses — select a campus to view its records."
      />

      {/* Hero Stats */}
      <div className="max-w-[1136px] mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">4</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Campuses covered</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">12</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Requirement areas</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">8</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Areas with evidence</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">4</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Pending description</div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-[#E5E9E2] rounded-signature p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)]">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-3 h-3 rounded-full bg-[#E8AE1F]" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#15221A]">Learning resources by campus</h2>
            <div className="flex-1 border-b border-dashed border-[#CBD5E1]" />
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mb-6">
            All campuses follow the same requirement list from CMO No. 46. Select a campus to view its submitted descriptions and evidence links.
          </p>

          {/* Filter Bar + Export */}
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
              onClick={() => exportForm5ToExcel(selectedCampus)}
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
                  <th scope="col" className="py-3 pr-4">Requirement</th>
                  <th scope="col" className="py-3 px-4">Evidence / link</th>
                  <th scope="col" className="py-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm divide-y divide-[#F1F5F9]">
                {form5Requirements.map((row) => (
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
            Source: Form 5 — {selectedCampus}. Same requirement structure applies to all four campuses.
          </div>
        </div>
      </div>
    </div>
  );
};
