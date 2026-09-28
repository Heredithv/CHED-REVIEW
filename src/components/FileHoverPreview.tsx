import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface FileHoverPreviewProps {
  title: string;
  docNumber: string;
  evidenceUrl?: string;
  children: React.ReactNode;
}

export const FileHoverPreview: React.FC<FileHoverPreviewProps> = ({
  title,
  docNumber,
  evidenceUrl = 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing',
  children
}) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="cursor-pointer underline decoration-dotted decoration-[#1E4D2B]/50 hover:text-[#1E4D2B] transition-colors">
        {children}
      </span>

      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 bg-white border border-[#CBD5E1] rounded-xl shadow-2xl p-3 text-left transition-all duration-200 pointer-events-auto">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#E2E8F0]">
            <div className="bg-[#EF4444] text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
              PDF
            </div>
            <div className="text-xs font-bold text-[#15221A] truncate" title={docNumber || title}>
              {docNumber || title}
            </div>
          </div>

          {/* Document Preview Thumbnail Box */}
          <div className="bg-[#FAFBF8] border border-[#E2E8F0] rounded-lg p-4 mb-2.5 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner">
            <div className="w-12 h-12 rounded-full bg-[#1E4D2B]/10 border border-[#1E4D2B]/20 flex items-center justify-center mb-1.5 text-[#1E4D2B] font-serif font-black text-base">
              JHC
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] mb-0.5">
              Republic of the Philippines
            </div>
            <div className="text-xs font-bold text-[#15221A] leading-tight mb-1">
              J.H. CERILLES STATE COLLEGE
            </div>
            <div className="text-[10px] text-[#475569] italic max-w-[220px] line-clamp-2 mb-2">
              Office of Institutional Quality Assurance & Governance — {title}
            </div>
            <div className="text-[9px] font-mono bg-white px-2.5 py-0.5 rounded border border-[#CBD5E1] text-[#1E4D2B] font-semibold shadow-2xs">
              ✓ OFFICIAL VERIFIED EVIDENCE
            </div>
          </div>

          {/* Footer Action */}
          <a
            href={evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-xs font-bold text-[#1E4D2B] hover:text-[#0E3322] bg-[#F4F6F1] px-3 py-1.5 rounded-lg border border-[#E2E8F0] transition-colors"
          >
            <span>Open in Google Drive</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};
