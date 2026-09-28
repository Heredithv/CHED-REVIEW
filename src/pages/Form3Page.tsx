import React, { useState, useMemo } from 'react';
import { Download, Search, ChevronDown } from 'lucide-react';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { exportForm3ToExcel } from '../utils/excelExport';

interface SummaryRow {
  school: string;
  faculty: number;
  ongoing: number;
  ongoingPct: string;
  completed: number;
  completedPct: string;
  both: number;
  bothPct: string;
}

interface SummaryCampusGroup {
  campusName: string;
  rows: SummaryRow[];
  total: SummaryRow;
}

const summaryData: SummaryCampusGroup[] = [
  {
    campusName: 'Main Campus',
    rows: [
      { school: 'School of Teacher Education (STE)', faculty: 39, ongoing: 4, ongoingPct: '10.3%', completed: 14, completedPct: '35.9%', both: 4, bothPct: '10.3%' },
      { school: 'School of Arts & Sciences (SAS)', faculty: 16, ongoing: 1, ongoingPct: '6.3%', completed: 9, completedPct: '56.3%', both: 0, bothPct: '0%' },
      { school: 'School of Computer Studies (SCS)', faculty: 6, ongoing: 0, ongoingPct: '0%', completed: 4, completedPct: '66.7%', both: 0, bothPct: '0%' },
      { school: 'GEC & PathFit', faculty: 10, ongoing: 0, ongoingPct: '0%', completed: 2, completedPct: '20%', both: 0, bothPct: '0%' },
    ],
    total: { school: 'Main Campus Total', faculty: 96, ongoing: 14, ongoingPct: '14.6%', completed: 39, completedPct: '40.6%', both: 7, bothPct: '7.3%' },
  },
  {
    campusName: 'Pagadian Campus',
    rows: [
      { school: 'School of Nursing (SON)', faculty: 17, ongoing: 1, ongoingPct: '5.9%', completed: 5, completedPct: '29.4%', both: 0, bothPct: '0%' },
      { school: 'School of Business Management (SBM)', faculty: 13, ongoing: 2, ongoingPct: '15.4%', completed: 10, completedPct: '76.9%', both: 1, bothPct: '7.7%' },
    ],
    total: { school: 'Pagadian Campus Total', faculty: 40, ongoing: 7, ongoingPct: '17.5%', completed: 21, completedPct: '52.5%', both: 4, bothPct: '10%' },
  },
];

interface DetailedFacultyRow {
  id: string;
  name: string;
  rank: string;
  status: 'Permanent' | 'Contractual';
  ongoingTitle: string;
  syStarted: string;
  completedTitle: string;
  year: string;
  campus: 'Main' | 'Pagadian' | 'Dumingag' | 'CMSE';
  groupName: string;
}

const detailedFacultyData: DetailedFacultyRow[] = [
  {
    id: 'f1',
    name: 'Bahian, Patricia D.',
    rank: 'Assoc. Prof. V',
    status: 'Permanent',
    ongoingTitle: '—',
    syStarted: '—',
    completedTitle: 'Print Media Utilization of Acad. Performance',
    year: '2016',
    campus: 'Main',
    groupName: 'Main Campus — School of Teacher Education',
  },
  {
    id: 'f2',
    name: 'Bahian, Patricia D.',
    rank: 'Assoc. Prof. V',
    status: 'Permanent',
    ongoingTitle: '—',
    syStarted: '—',
    completedTitle: 'Social Media Preference and Academic Performance',
    year: '2015',
    campus: 'Main',
    groupName: 'Main Campus — School of Teacher Education',
  },
  {
    id: 'f3',
    name: 'Adlawon, Jerson B.',
    rank: 'Assoc. Prof. I',
    status: 'Permanent',
    ongoingTitle: '—',
    syStarted: '—',
    completedTitle: '—',
    year: '—',
    campus: 'Main',
    groupName: 'Main Campus — School of Teacher Education',
  },
];

export const Form3Page: React.FC = () => {
  const [selectedCampus, setSelectedCampus] = useState<string>('All campuses');
  const [selectedStatus, setSelectedStatus] = useState<string>('All status');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredDetailed = useMemo(() => {
    return detailedFacultyData.filter((item) => {
      const matchCampus =
        selectedCampus === 'All campuses' ||
        (selectedCampus === 'Main' && item.campus === 'Main') ||
        (selectedCampus === 'Pagadian' && item.campus === 'Pagadian') ||
        (selectedCampus === 'Dumingag' && item.campus === 'Dumingag') ||
        (selectedCampus === 'CMSE' && item.campus === 'CMSE');

      const matchStatus =
        selectedStatus === 'All status' || item.status === selectedStatus;

      const matchQuery =
        !searchQuery ||
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.completedTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.ongoingTitle || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchCampus && matchStatus && matchQuery;
    });
  }, [selectedCampus, selectedStatus, searchQuery]);

  const groupedDetailed = useMemo(() => {
    const groups: { [key: string]: DetailedFacultyRow[] } = {};
    filteredDetailed.forEach((row) => {
      if (!groups[row.groupName]) {
        groups[row.groupName] = [];
      }
      groups[row.groupName].push(row);
    });
    return groups;
  }, [filteredDetailed]);

  return (
    <div className="w-full bg-[#F4F6F1] pb-16 font-sans">
      {/* Hero Band */}
      <InnerHeroBand
        breadcrumb="Form 3"
        title="Form 3 Research Involvement"
        subtitle="Full-time faculty with ongoing and completed research. 107 of 222 (48%) are actively involved. CMO 46 requires at least 30 or 20%, whichever is higher."
      />

      {/* Hero Stats */}
      <div className="max-w-[1136px] mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">222</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Full-time faculty</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">45</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Ongoing research</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">96</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Completed research</div>
          </div>
          <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-2xl p-5 shadow-sm">
            <div className="text-3xl sm:text-4xl font-bold text-[#15221A]">48%</div>
            <div className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">Actively involved</div>
          </div>
        </div>

        {/* Card 1: Summary by campus and school */}
        <div className="bg-white border border-[#E5E9E2] rounded-signature p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)] mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-3 h-3 rounded-full bg-[#E8AE1F]" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#15221A]">Summary by campus and school</h2>
            <div className="flex-1 border-b border-dashed border-[#CBD5E1]" />
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mb-6">
            Faculty count and research engagement rate per school, aggregated from all campuses.
          </p>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  <th scope="col" className="py-3 pr-4">Campus / School</th>
                  <th scope="col" className="py-3 px-4 text-right">Faculty</th>
                  <th scope="col" className="py-3 px-4 text-right">Ongoing</th>
                  <th scope="col" className="py-3 px-2 text-right">%</th>
                  <th scope="col" className="py-3 px-4 text-right">Completed</th>
                  <th scope="col" className="py-3 px-2 text-right">%</th>
                  <th scope="col" className="py-3 px-4 text-right">Both</th>
                  <th scope="col" className="py-3 pl-2 text-right">%</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm divide-y divide-[#F1F5F9]">
                {summaryData.map((group) => (
                  <React.Fragment key={group.campusName}>
                    <tr>
                      <td colSpan={8} className="pt-4 pb-2">
                        <div className="font-bold text-[#1E4D2B] text-sm border-b border-dashed border-[#E8AE1F] pb-1">
                          {group.campusName}
                        </div>
                      </td>
                    </tr>
                    {group.rows.map((r) => (
                      <tr key={r.school} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 pr-4 text-[#15221A]">{r.school}</td>
                        <td className="py-2.5 px-4 text-right font-medium">{r.faculty}</td>
                        <td className="py-2.5 px-4 text-right">{r.ongoing}</td>
                        <td className="py-2.5 px-2 text-right text-[#64748B]">{r.ongoingPct}</td>
                        <td className="py-2.5 px-4 text-right">{r.completed}</td>
                        <td className="py-2.5 px-2 text-right text-[#64748B]">{r.completedPct}</td>
                        <td className="py-2.5 px-4 text-right">{r.both}</td>
                        <td className="py-2.5 pl-2 text-right text-[#64748B]">{r.bothPct}</td>
                      </tr>
                    ))}
                    <tr className="bg-[#FAFBF8] font-bold text-[#15221A]">
                      <td className="py-3 pr-4">{group.total.school}</td>
                      <td className="py-3 px-4 text-right">{group.total.faculty}</td>
                      <td className="py-3 px-4 text-right">{group.total.ongoing}</td>
                      <td className="py-3 px-2 text-right">{group.total.ongoingPct}</td>
                      <td className="py-3 px-4 text-right">{group.total.completed}</td>
                      <td className="py-3 px-2 text-right">{group.total.completedPct}</td>
                      <td className="py-3 px-4 text-right">{group.total.both}</td>
                      <td className="py-3 pl-2 text-right">{group.total.bothPct}</td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: Detailed faculty research list */}
        <div className="bg-white border border-[#E5E9E2] rounded-signature p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)]">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-3 h-3 rounded-full bg-[#E8AE1F]" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#15221A]">Detailed faculty research list</h2>
            <div className="flex-1 border-b border-dashed border-[#CBD5E1]" />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-2">
              {['All campuses', 'Main', 'Pagadian', 'Dumingag', 'CMSE'].map((campus) => (
                <button
                  key={campus}
                  onClick={() => setSelectedCampus(campus)}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    selectedCampus === campus
                      ? 'bg-[#0E3322] text-white shadow-xs'
                      : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {campus}
                </button>
              ))}

              <div className="relative inline-block ml-1">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="appearance-none bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] text-xs sm:text-sm font-medium py-1.5 pl-3.5 pr-8 rounded-lg border-none focus:ring-2 focus:ring-[#1E4D2B] cursor-pointer"
                >
                  <option value="All status">All status</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Contractual">Contractual</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search faculty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#1E4D2B]"
                />
              </div>

              <button
                onClick={exportForm3ToExcel}
                type="button"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs sm:text-sm rounded-lg hover:bg-[#1E4D2B]/5 transition-all cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Export to Excel</span>
              </button>
            </div>
          </div>

          {/* Detailed table */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  <th scope="col" className="py-3 pr-4">Faculty name</th>
                  <th scope="col" className="py-3 px-4">Rank</th>
                  <th scope="col" className="py-3 px-4 text-center">Status</th>
                  <th scope="col" className="py-3 px-4">Ongoing research title</th>
                  <th scope="col" className="py-3 px-2 text-center">SY started</th>
                  <th scope="col" className="py-3 px-4">Completed research title</th>
                  <th scope="col" className="py-3 pl-2 text-center">Year</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm divide-y divide-[#F1F5F9]">
                {Object.entries(groupedDetailed).map(([groupTitle, list]) => (
                  <React.Fragment key={groupTitle}>
                    <tr className="bg-[#FAFBF8]">
                      <td colSpan={7} className="py-2.5 px-4">
                        <div className="font-bold text-[#1E4D2B] text-xs sm:text-sm flex items-center gap-1.5 border-b border-dashed border-[#E8AE1F]/80 pb-1">
                          <span>▸ {groupTitle}</span>
                        </div>
                      </td>
                    </tr>
                    {list.map((row) => (
                      <tr key={row.id + row.completedTitle} className="hover:bg-[#F8FAFC]">
                        <td className="py-3.5 pr-4 font-bold text-[#15221A]">{row.name}</td>
                        <td className="py-3.5 px-4 text-[#334155]">{row.rank}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#334155]">{row.ongoingTitle}</td>
                        <td className="py-3.5 px-2 text-center text-[#64748B]">{row.syStarted}</td>
                        <td className="py-3.5 px-4 text-[#334155] font-medium">{row.completedTitle}</td>
                        <td className="py-3.5 pl-2 text-center text-[#64748B]">{row.year}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 pt-4 border-t border-[#E5E9E2] text-xs text-[#64748B]">
            Source: Form 3 detailed listing. Faculty with both ongoing and completed research are counted once in the headline total.
          </div>
        </div>
      </div>
    </div>
  );
};
