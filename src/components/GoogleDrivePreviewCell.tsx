import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Copy, Check, FileText, FileSpreadsheet, Eye, File } from 'lucide-react';
import { parseCellDriveInfo, DriveFileInfo, EvidenceFile } from '../utils/googleDrivePreview';

interface GoogleDrivePreviewCellProps {
  text?: string | null;
  explicitUrl?: string | null;
  explicitFileId?: string | null;
  evidenceFiles?: EvidenceFile[];
  className?: string;
  columnType?: 'major' | 'authority' | 'copc' | 'general';
}

export const GoogleDrivePreviewCell: React.FC<GoogleDrivePreviewCellProps> = ({
  text,
  explicitUrl,
  explicitFileId,
  evidenceFiles,
  className = '',
  columnType = 'general'
}) => {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; showAbove: boolean }>({
    top: 0,
    left: 0,
    showAbove: false
  });
  const [copied, setCopied] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const openTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Parse text, explicit URL, explicit file ID, or evidenceFiles
  const info: DriveFileInfo = React.useMemo(() => {
    return parseCellDriveInfo(text, explicitUrl, explicitFileId, evidenceFiles);
  }, [text, explicitUrl, explicitFileId, evidenceFiles]);

  // If plain text with no link, render plain text directly with zero popover overhead
  if (!info.hasLink || info.isPlain || !info.url) {
    if (!text || !text.trim()) {
      return null;
    }
    return <span className={className}>{text}</span>;
  }

  const updateCoordinates = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverHeight = 270;
    const popoverWidth = 310;

    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < popoverHeight && rect.top > popoverHeight;

    const top = showAbove ? rect.top - popoverHeight - 8 : rect.bottom + 8;
    // Keep horizontally within window bounds
    const left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, rect.left - 10));

    setCoords({ top, left, showAbove });
  };

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    // 0ms delay: Instantaneous opening as soon as cursor moves into the link
    updateCoordinates();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handlePopoverMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (info.url) {
      navigator.clipboard.writeText(info.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Google Drive Colored Icon
  const renderFileIcon = () => {
    if (info.fileType === 'pdf') {
      return (
        <div className="w-6 h-6 rounded bg-[#EA4335]/10 text-[#EA4335] flex items-center justify-center shrink-0">
          <FileText className="w-3.5 h-3.5" />
        </div>
      );
    }
    if (info.fileType === 'sheet') {
      return (
        <div className="w-6 h-6 rounded bg-[#0F9D58]/10 text-[#0F9D58] flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-3.5 h-3.5" />
        </div>
      );
    }
    if (info.fileType === 'doc') {
      return (
        <div className="w-6 h-6 rounded bg-[#4285F4]/10 text-[#4285F4] flex items-center justify-center shrink-0">
          <FileText className="w-3.5 h-3.5" />
        </div>
      );
    }
    // Google Drive 3-color icon
    return (
      <svg className="w-6 h-6 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
      </svg>
    );
  };

  const popoverContent = isOpen && (
    <div
      ref={popoverRef}
      onMouseEnter={handlePopoverMouseEnter}
      onMouseLeave={handlePopoverMouseLeave}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 99999
      }}
      className="w-[310px] bg-white rounded-[14px] border border-[#D1D5DB] shadow-[0_8px_30px_rgba(0,0,0,0.18)] overflow-hidden font-sans transition-all duration-200 animate-in fade-in zoom-in-95 pointer-events-auto"
    >
      {/* Popover Header — Google Sheets style */}
      <div className="p-3 bg-white border-b border-[#F1F5F9] flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {renderFileIcon()}
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-[#1F2937] truncate leading-tight" title={info.fileTitle || info.label}>
              {info.fileTitle || info.label}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-[#6B7280]">Google Drive</span>
              <span className="text-[10px] text-[#9CA3AF]">•</span>
              <span className="text-[10px] font-medium text-[#4B5563] uppercase tracking-wider">
                {info.fileType.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <a
          href={info.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-[#6B7280] hover:text-[#1155cc] hover:bg-[#F3F4F6] rounded-md transition-colors shrink-0 cursor-pointer"
          title="Open in Google Drive"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Popover Preview Frame — Instant Direct Display */}
      <div className="relative w-full h-[160px] bg-[#0F172A] border-b border-[#F1F5F9] overflow-hidden group select-none">
        {/* Instant Document Canvas with official header, title, and seal */}
        <div className="absolute inset-0 p-3.5 bg-gradient-to-b from-[#FAFBF8] to-[#EEF2EA] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-dashed border-[#CBD5E1] pb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#1E4D2B]" />
              <span className="text-[10px] font-bold text-[#1E4D2B] tracking-wider uppercase">JHCSC & CHED Record</span>
            </div>
            <span className="text-[9px] font-mono font-semibold text-[#1E4D2B] bg-[#E3EFE8] px-2 py-0.5 rounded-full uppercase">
              {info.fileType.toUpperCase()} FILE
            </span>
          </div>

          <div className="py-1">
            <div className="text-xs font-extrabold text-[#0E3322] leading-snug line-clamp-2" title={info.fileTitle || info.label}>
              {info.fileTitle || info.label}
            </div>
            <div className="text-[10px] text-[#475569] mt-0.5 line-clamp-1">
              Republic of the Philippines • J.H. Cerilles State College
            </div>
            <div className="text-[9px] text-[#64748B] mt-0.5">
              Official Evaluated Compliance & Academic Document
            </div>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-[#CBD5E1] text-[10px]">
            <span className="text-[#1E4D2B] font-bold flex items-center gap-1">
              ✓ Verified Document
            </span>
            <span className="text-[#1155cc] font-semibold flex items-center gap-1">
              <Eye className="w-3 h-3" /> Ready to View
            </span>
          </div>
        </div>

        {/* Instant Thumbnail overlay if available from Google Drive CDN */}
        {info.thumbnailUrl && !imgError && (
          <img
            src={info.thumbnailUrl}
            alt={info.fileTitle || info.label}
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover object-top opacity-95 transition-opacity duration-200"
            onError={() => setImgError(true)}
          />
        )}

        {/* Hover overlay button to open */}
        <a
          href={info.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 bg-[#0E3322]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold cursor-pointer backdrop-blur-[1px]"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Click to open in Google Drive</span>
        </a>
      </div>

      {/* Popover Footer Action Bar */}
      <div className="p-2.5 bg-[#FAFBF8] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#EEF1EB] rounded-md transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#1E4D2B]" />
              <span className="text-[#1E4D2B] font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Copy link</span>
            </>
          )}
        </button>

        <a
          href={info.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-[11px] font-semibold rounded-md shadow-2xs transition-colors cursor-pointer"
        >
          <span>Open file</span>
          <ExternalLink className="w-3 h-3 ml-0.5" />
        </a>
      </div>
    </div>
  );

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`inline-block text-[#1155cc] hover:text-[#1a73e8] hover:underline cursor-pointer transition-colors ${className}`}
      >
        {info.label}
      </span>

      {typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </>
  );
};
