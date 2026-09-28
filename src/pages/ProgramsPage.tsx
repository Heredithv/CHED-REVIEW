import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, ChevronRight, ChevronDown } from 'lucide-react';
import { programsPageData, ProgramItem } from '../data/programsData';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { StatusPill } from '../components/StatusPill';
import { exportFilteredProgramsToExcel } from '../utils/excelExport';

interface ProgramsPageProps {
  initialCampus?: string;
}

export const ProgramsPage: React.FC<ProgramsPageProps> = ({ initialCampus }) => {
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('All levels');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const effectivePrograms = programsPageData.programs;

  // Show BSIT expanded by default on load
  const [expandedProgramIds, setExpandedProgramIds] = useState<Set<string>>(
    new Set(['main-bsit'])
  );

  useEffect(() => {
    if (initialCampus) {
      setSelectedCampus(initialCampus);
    }
  }, [initialCampus]);

  const toggleExpand = (id: string) => {
    setExpandedProgramIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter programs based on campus tab, level dropdown, and search query
  const filteredPrograms = useMemo(() => {
    return effectivePrograms.filter((prog) => {
      // Campus tab filter
      if (selectedCampus !== 'all' && prog.campus !== selectedCampus) {
        return false;
      }

      // Level filter
      if (selectedLevel !== 'All levels' && prog.level !== selectedLevel) {
        return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchName = (prog.name || '').toLowerCase().includes(query);
        const matchCode = (prog.code || '').toLowerCase().includes(query);
        const matchCampus = (prog.campus || '').toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchCampus) {
          return false;
        }
      }

      return true;
    });
  }, [effectivePrograms, selectedCampus, selectedLevel, searchQuery]);

  // Group filtered programs by campus
  const groupedPrograms = useMemo(() => {
    const groups: { [key: string]: ProgramItem[] } = {};
    filteredPrograms.forEach((prog) => {
      if (!groups[prog.campus]) {
        groups[prog.campus] = [];
      }
      groups[prog.campus].push(prog);
    });
    return groups;
  }, [filteredPrograms]);

  const handleExport = () => {
    const campusLabel = selectedCampus === 'all' ? 'All-Campuses' : selectedCampus;
    exportFilteredProgramsToExcel(filteredPrograms, campusLabel);
  };

  return (
    <div className="w-full bg-[#F4F6F1] pb-16">
      {/* Pine hero band with faint contour lines */}
      <InnerHeroBand
        breadcrumb={programsPageData.breadcrumbCurrent}
        title={programsPageData.title}
        subtitle={programsPageData.subtitle}
        highlightNumber={programsPageData.subtitleHighlight}
      />

      {/* White rounded card overlapping bottom ~80px of Pine band */}
      <div className="max-w-[1136px] mx-auto px-4 sm:px-6 -mt-20 relative z-20 flex flex-col space-y-6">
        <div className="bg-white border border-[#E5E9E2] rounded-signature p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)]">
          {/* Row of pill tabs with counts */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
            {programsPageData.filterTabs.map((tab) => {
              const isActive = selectedCampus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCampus(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#0E3322] text-[#F5F2E6] font-bold shadow-xs'
                      : 'bg-white border border-[#CBD5E1] text-[#334155] hover:border-[#1E4D2B] hover:text-[#1E4D2B]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-[#F5F2E6]' : 'bg-[#E2E8F0] text-[#475569]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, Filter Level, Export to Excel */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-lg">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={programsPageData.searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B] bg-white placeholder:text-[#94A3B8]"
                />
              </div>

              {/* All levels dropdown */}
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="py-2 px-3 text-xs sm:text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B] bg-white text-[#334155] font-medium"
              >
                {programsPageData.levels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* Export to Excel button */}
            <button
              onClick={handleExport}
              type="button"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs sm:text-sm rounded-[12px] hover:bg-[#1E4D2B]/5 active:scale-95 transition-all self-start sm:self-auto"
            >
              <Download className="w-4 h-4 text-[#1E4D2B]" />
              <span>{programsPageData.exportButtonText}</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-[#1E4D2B]/20 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  <th scope="col" className="py-3 pr-4">
                    Program
                  </th>
                  <th scope="col" className="py-3 px-4 w-36">
                    Level
                  </th>
                  <th scope="col" className="py-3 pl-4 text-right w-64">
                    Requirements complied
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {Object.keys(groupedPrograms).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-[#64748B]">
                      No programs match the selected filters.
                    </td>
                  </tr>
                ) : (
                  Object.entries(groupedPrograms).map(([campusName, programs]) => {
                    const summary = programsPageData.campusSummaries[campusName];

                    return (
                      <React.Fragment key={campusName}>
                        {/* Campus Header Row */}
                        <tr>
                          <td colSpan={3} className="pt-6 pb-2">
                            <div className="flex items-center justify-between border-b border-dashed border-[#E8AE1F] pb-1">
                              <span className="font-display font-bold text-base text-[#1E4D2B]">
                                {campusName}
                              </span>
                              {summary && (
                                <span className="text-xs text-[#64748B] font-normal">
                                  {summary.note}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Program Rows */}
                        {programs.map((prog) => {
                          const isExpanded = expandedProgramIds.has(prog.id);
                          const hasUnmet = prog.unmetItems && prog.unmetItems.length > 0;
                          const percent = prog.totalChecks > 0 ? (prog.compliedChecks / prog.totalChecks) * 100 : 0;

                          return (
                            <React.Fragment key={prog.id}>
                              <tr
                                onClick={() => hasUnmet && toggleExpand(prog.id)}
                                className={`border-b border-[#E5E9E2]/70 transition-colors ${
                                  hasUnmet ? 'cursor-pointer' : ''
                                } ${isExpanded ? 'bg-[#FBF1D2]/25' : 'hover:bg-[#F9FAF8]'}`}
                              >
                                {/* Program name & Code */}
                                <td className="py-3.5 pr-4 align-middle">
                                  <div className="font-sans font-bold text-sm text-[#15221A] leading-snug">
                                    {prog.name}
                                  </div>
                                  <div className="text-xs text-[#64748B] font-medium mt-0.5">
                                    {prog.code}
                                  </div>
                                </td>

                                {/* Level */}
                                <td className="py-3.5 px-4 align-middle text-xs sm:text-sm text-[#475569] font-medium">
                                  {prog.level}
                                </td>

                                {/* Compliance Progress Bar or Status Pill */}
                                <td className="py-3.5 pl-4 align-middle text-right">
                                  {prog.status === 'Statement pending' ? (
                                    <div className="inline-flex justify-end">
                                      <StatusPill status="pending" label="Statement pending" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end gap-3">
                                      <div className="flex flex-col items-end">
                                        <span className="font-sans font-medium text-xs text-[#15221A]">
                                          {prog.compliedChecks} of {prog.totalChecks}
                                        </span>
                                        {/* Progress bar: Forest for complied, Gold for remainder */}
                                        <div className="w-28 sm:w-36 h-2 bg-[#E8AE1F] rounded-full overflow-hidden mt-1 flex">
                                          <div
                                            className="h-full bg-[#1E4D2B]"
                                            style={{ width: `${percent}%` }}
                                          />
                                        </div>
                                      </div>

                                      {/* Chevron indicator */}
                                      <div className="w-5 flex items-center justify-center text-[#64748B]">
                                        {hasUnmet ? (
                                          isExpanded ? (
                                            <ChevronDown className="w-4 h-4 text-[#1E4D2B]" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4" />
                                          )
                                        ) : (
                                          <div className="w-4" />
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>

                              {/* Expanded Row: 4px gold left border */}
                              {isExpanded && hasUnmet && (
                                <tr>
                                  <td colSpan={3} className="p-0 border-b border-[#E5E9E2]">
                                    <div className="bg-[#FAFBF9] border-l-4 border-[#E8AE1F] p-5 pl-8 sm:pl-10">
                                      <h4 className="font-display font-bold text-sm text-[#1E4D2B] mb-3">
                                        Needs action ({prog.unmetItems!.length})
                                      </h4>

                                      <div className="divide-y divide-[#E5E9E2]/80">
                                        {(prog.unmetItems || []).map((item) => (
                                          <div key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                                            <div className="text-xs sm:text-[13px] text-[#15221A] leading-snug">
                                              <span className="font-semibold text-[#1E4D2B]">
                                                {item.area}:
                                              </span>{' '}
                                              <span>{item.requirement}</span>
                                            </div>

                                            {item.chedroRemark && (
                                              <div className="text-xs text-[#8C660B] font-medium mt-1 bg-[#FBF1D2]/60 px-2.5 py-1 rounded-sm w-fit">
                                                CHEDRO remark: {item.chedroRemark}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
