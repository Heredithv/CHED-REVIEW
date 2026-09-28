import React from 'react';
import { requirementsPageData } from '../data/requirementsData';
import { InnerHeroBand } from '../components/InnerHeroBand';
import { StatusPill } from '../components/StatusPill';

export const RequirementsPage: React.FC = () => {
  return (
    <div className="w-full bg-[#F4F6F1] pb-16">
      {/* Pine hero band with faint contour lines */}
      <InnerHeroBand
        breadcrumb={requirementsPageData.breadcrumbCurrent}
        title={requirementsPageData.title}
        subtitle={requirementsPageData.subtitle}
        highlightNumber={requirementsPageData.subtitleHighlight}
      />

      {/* White rounded card overlapping the bottom ~80px of the Pine band */}
      <div className="max-w-[1136px] mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        <div className="bg-white border border-[#E5E9E2] rounded-signature p-6 sm:p-10 shadow-[0_4px_24px_rgba(21,34,26,0.04)]">
          {/* Card Title & Intro */}
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#1E4D2B] tracking-tight">
            {requirementsPageData.cardTitle}
          </h2>
          <p className="text-xs sm:text-sm text-[#475569] mt-1 mb-8">
            {requirementsPageData.cardIntro}
          </p>

          {/* Table Container */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b-2 border-[#1E4D2B]/20 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  <th scope="col" className="py-3 pr-4 w-40 sm:w-48">
                    {requirementsPageData.tableColumns.area}
                  </th>
                  <th scope="col" className="py-3 px-4">
                    {requirementsPageData.tableColumns.requirement}
                  </th>
                  <th scope="col" className="py-3 pl-4 text-right w-44">
                    {requirementsPageData.tableColumns.status}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9E2] text-sm">
                {requirementsPageData.requirements.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F9FAF8] transition-colors">
                    {/* Area Column: shows only on first row of area group */}
                    <td className="py-4 pr-4 align-top">
                      {item.isFirstInArea ? (
                        <span className="font-sans font-bold text-sm text-[#1E4D2B]">
                          {item.area}
                        </span>
                      ) : null}
                    </td>

                    {/* Requirement and Statement Column */}
                    <td className="py-4 px-4 align-top">
                      <div className="font-sans text-sm sm:text-[14.5px] text-[#15221A] leading-snug">
                        {item.requirement}
                      </div>
                      <div className="text-xs sm:text-[13px] text-[#64748B] mt-1 leading-relaxed">
                        {item.statement}{' '}
                        {item.link && (
                          <a
                            href={item.link.href}
                            className="font-semibold text-[#1E4D2B] underline hover:text-[#2F7D4E] ml-1"
                          >
                            [{item.link.text}]
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="py-4 pl-4 align-top text-right shrink-0">
                      <StatusPill status={item.status} label={item.statusLabel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footnote */}
          <div className="mt-8 pt-4 border-t border-[#E5E9E2] text-xs text-[#64748B]">
            {requirementsPageData.sourceFootnote}
          </div>
        </div>
      </div>
    </div>
  );
};
