import React from 'react';

export type ComplianceStatus = 'Complied' | 'Not complied' | 'Pending submission' | string;

interface StatusChipProps {
  status: ComplianceStatus | null | undefined;
  className?: string;
}

/**
 * Editorial status display:
 * Small filled square + plain text.
 * No pill chips, no background badges.
 * Dark forest green = Complied (#0e3822)
 * Gold = Not complied (#c59b27)
 * Gray = Pending submission (#94a3b8)
 */
export const StatusChip: React.FC<StatusChipProps> = ({ status, className = '' }) => {
  const normalized = (status || '').trim().toLowerCase();

  if (normalized === 'complied' || normalized === 'fully complied' || normalized === 'passed') {
    return (
      <span className={`inline-flex items-center gap-2 text-xs font-medium text-slate-900 whitespace-nowrap ${className}`}>
        <span className="w-2 h-2 bg-[#0e3822] rounded-[1px] inline-block shrink-0" aria-hidden="true" />
        <span>Complied</span>
      </span>
    );
  }

  if (normalized === 'not complied' || normalized === 'non-compliant' || normalized === 'deficient') {
    return (
      <span className={`inline-flex items-center gap-2 text-xs font-medium text-slate-900 whitespace-nowrap ${className}`}>
        <span className="w-2 h-2 bg-[#c59b27] rounded-[1px] inline-block shrink-0" aria-hidden="true" />
        <span>Not complied</span>
      </span>
    );
  }

  // Pending submission (Default)
  return (
    <span className={`inline-flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap ${className}`}>
      <span className="w-2 h-2 bg-slate-400 rounded-[1px] inline-block shrink-0" aria-hidden="true" />
      <span>Pending submission</span>
    </span>
  );
};
