import React from 'react';
import { RequirementStatus } from '../data/requirementsData';

interface StatusPillProps {
  status: RequirementStatus | 'Needs action' | 'Complied' | 'Statement pending';
  label?: string;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, label, className = '' }) => {
  let normalizedStatus: 'complied' | 'needs-action' | 'pending' = 'pending';

  if (status === 'complied' || status === 'Complied') {
    normalizedStatus = 'complied';
  } else if (status === 'needs-action' || status === 'Needs action') {
    normalizedStatus = 'needs-action';
  } else {
    normalizedStatus = 'pending';
  }

  if (normalizedStatus === 'complied') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#E8F4EC] text-[#1E4D2B] ${className}`}
      >
        <span className="w-2 h-2 rounded-[1.5px] bg-[#1E4D2B] shrink-0" aria-hidden="true" />
        <span>{label || 'Complied'}</span>
      </span>
    );
  }

  if (normalizedStatus === 'needs-action') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FBF1D2] text-[#8C660B] ${className}`}
      >
        <span className="w-2 h-2 rounded-[1.5px] bg-[#E8AE1F] shrink-0" aria-hidden="true" />
        <span>{label || 'Needs action'}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-[#CBD5E1] text-[#64748B] ${className}`}
    >
      <span className="w-2 h-2 rounded-[1.5px] border-[1.5px] border-[#64748B] bg-transparent shrink-0" aria-hidden="true" />
      <span>{label || 'Statement pending'}</span>
    </span>
  );
};
