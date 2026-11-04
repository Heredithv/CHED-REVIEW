import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, FileText, Loader2, Globe } from 'lucide-react';
import {
  parseCellDriveInfo,
  DriveFileInfo,
  EvidenceFile,
  preloadDriveThumbnail
} from '../utils/googleDrivePreview';

interface GoogleDrivePreviewCellProps {
  text?: string | null;
  explicitUrl?: string | null;
  explicitFileId?: string | null;
  evidenceFiles?: EvidenceFile[];
  className?: string;
  iconClassName?: string;
  columnType?: 'major' | 'authority' | 'copc' | 'general';
  variant?: 'light' | 'dark' | 'badge';
}

// Bounded LRU pool of active/pre-warmed iframe instances to keep memory light while making previews instant
const MAX_ACTIVE_IFRAMES = 8;
const activeIframeListeners = new Map<symbol, () => void>();
const activeIframeOrder: symbol[] = [];

function registerActiveIframe(id: symbol, evictCallback: () => void) {
  const existingIdx = activeIframeOrder.indexOf(id);
  if (existingIdx !== -1) {
    activeIframeOrder.splice(existingIdx, 1);
  }
  activeIframeOrder.push(id);
  activeIframeListeners.set(id, evictCallback);

  while (activeIframeOrder.length > MAX_ACTIVE_IFRAMES) {
    const oldest = activeIframeOrder.shift();
    if (oldest && oldest !== id) {
      const cb = activeIframeListeners.get(oldest);
      activeIframeListeners.delete(oldest);
      if (cb) cb();
    }
  }
}

function unregisterActiveIframe(id: symbol) {
  const idx = activeIframeOrder.indexOf(id);
  if (idx !== -1) activeIframeOrder.splice(idx, 1);
  activeIframeListeners.delete(id);
}

export const GoogleDrivePreviewCell: React.FC<GoogleDrivePreviewCellProps> = ({
  text,
  explicitUrl,
  explicitFileId,
  evidenceFiles,
  className = '',
  iconClassName = '',
  variant = 'light'
}) => {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const instanceIdRef = useRef<symbol>(Symbol('drive-preview'));
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isPrewarmed, setIsPrewarmed] = useState<boolean>(false);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const [thumbError, setThumbError] = useState<boolean>(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeBelow: boolean }>({
    top: 0,
    left: 0,
    placeBelow: false
  });

  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Parse text, explicit URL, explicit file ID, or evidenceFiles
  const info: DriveFileInfo = React.useMemo(() => {
    return parseCellDriveInfo(text, explicitUrl, explicitFileId, evidenceFiles);
  }, [text, explicitUrl, explicitFileId, evidenceFiles]);

  const activatePrewarm = useCallback(() => {
    if (info.thumbnailUrl) {
      preloadDriveThumbnail(info.thumbnailUrl);
    }
    setIsPrewarmed(true);
    registerActiveIframe(instanceIdRef.current, () => {
      setIsPrewarmed(false);
      setIframeLoaded(false);
    });
  }, [info.thumbnailUrl]);

  // Preload fast thumbnail when near viewport & pre-warm iframe when user's mouse enters parent Card or Table Row
  useEffect(() => {
    const el = triggerRef.current;
    if (!el || !info.hasLink || info.isPlain || !info.url) return;

    // 1. Preload lightweight thumbnail image as soon as cell approaches viewport
    let observer: IntersectionObserver | null = null;
    if (info.thumbnailUrl && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            preloadDriveThumbnail(info.thumbnailUrl);
            observer?.disconnect();
          }
        },
        { rootMargin: '400px' }
      );
      observer.observe(el);
    }

    // 2. Pre-warm the interactive iframe when mouse enters the enclosing Card or Table Row
    const parentBlock =
      el.closest('tr, [data-program-card]') ||
      el.parentElement?.parentElement?.parentElement;

    const handleParentEnter = () => {
      activatePrewarm();
    };

    if (parentBlock) {
      parentBlock.addEventListener('mouseenter', handleParentEnter, { passive: true });
    }

    return () => {
      observer?.disconnect();
      if (parentBlock) {
        parentBlock.removeEventListener('mouseenter', handleParentEnter);
      }
      unregisterActiveIframe(instanceIdRef.current);
    };
  }, [info.hasLink, info.isPlain, info.url, info.thumbnailUrl, activatePrewarm]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(360, window.innerWidth - 24);
    const popoverHeight = 305;

    const placeBelow = rect.top < popoverHeight + 20;

    const top = placeBelow ? rect.bottom + 8 : rect.top - popoverHeight - 8;
    let left = rect.left + rect.width / 2 - popoverWidth / 2;

    left = Math.max(12, Math.min(window.innerWidth - popoverWidth - 12, left));

    setCoords({ top, left, placeBelow });
  }, []);

  const handleMouseEnter = () => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    activatePrewarm();
    updatePosition();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    exitTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 180);
  };

  useEffect(() => {
    if (isHovered) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isHovered, updatePosition]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  // If plain text with no link, render plain text directly with natural multi-line wrapping
  if (!info.hasLink || info.isPlain || !info.url) {
    if (!text || !text.trim()) {
      return null;
    }
    return (
      <span className={`break-words [overflow-wrap:anywhere] whitespace-normal ${className}`}>
        {text}
      </span>
    );
  }

  const isGoogleDrive =
    info.url.includes('drive.google.com') || info.url.includes('docs.google.com');
  const isFolder = info.url.includes('/folders/');

  const fileTypeLabel = isFolder
    ? 'Google Drive Folder'
    : info.fileType === 'pdf'
    ? 'PDF Document'
    : info.fileType === 'sheet'
    ? 'Google Spreadsheet'
    : info.fileType === 'doc'
    ? 'Google Document'
    : info.fileType === 'slide'
    ? 'Google Presentation'
    : isGoogleDrive
    ? 'Google Drive Document'
    : 'Web Resource';

  // Natural wrapping link styles so long codes/titles never overflow their parent card or table block
  let linkStyle = `underline underline-offset-2 decoration-[#1E4D2B]/40 hover:decoration-[#1E4D2B] font-medium text-[#1E4D2B] hover:text-[#0E3322] transition-colors inline break-words [overflow-wrap:anywhere] whitespace-normal cursor-pointer ${className}`;
  let iconStyle = `w-3 h-3 text-[#1E4D2B]/70 shrink-0 inline-block align-baseline ml-1 ${iconClassName}`;

  if (variant === 'dark') {
    linkStyle = `underline underline-offset-2 decoration-white/60 hover:decoration-white font-semibold text-white hover:text-white/85 transition-colors inline break-words [overflow-wrap:anywhere] whitespace-normal cursor-pointer ${className}`;
    iconStyle = `w-3 h-3 text-white shrink-0 inline-block align-baseline ml-1 ${iconClassName}`;
  } else if (variant === 'badge') {
    linkStyle = `inline-flex flex-wrap items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E3EFE8] text-[#1E4D2B] hover:bg-[#d0e5d8] border border-[#1E4D2B]/20 transition-all max-w-full break-words [overflow-wrap:anywhere] whitespace-normal text-left ${className}`;
    iconStyle = `w-3 h-3 text-[#1E4D2B] shrink-0 inline-block ${iconClassName}`;
  }

  const activePreviewUrl = info.previewUrl || info.url;
  const shouldMountPortal = (isHovered || isPrewarmed) && Boolean(info.url);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative inline max-w-full align-baseline group cursor-pointer break-words [overflow-wrap:anywhere] whitespace-normal"
      >
        <a
          href={info.url}
          target="_blank"
          rel="noopener noreferrer"
          className={linkStyle}
        >
          <span className="break-words [overflow-wrap:anywhere] whitespace-normal">{info.label}</span>
          <ExternalLink className={iconStyle} />
        </a>
      </span>

      {/* Uniform Directly-Interactive Popover Preview Card (Pre-warmed & Keep-Alive) */}
      {shouldMountPortal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            style={
              isHovered
                ? {
                    position: 'fixed',
                    top: `${coords.top}px`,
                    left: `${coords.left}px`,
                    width: `${Math.min(360, window.innerWidth - 24)}px`,
                    zIndex: 99999
                  }
                : {
                    position: 'fixed',
                    top: '-9999px',
                    left: '-9999px',
                    width: '360px',
                    zIndex: -1,
                    opacity: 0,
                    pointerEvents: 'none',
                    visibility: 'hidden'
                  }
            }
            className="bg-white rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.25)] border border-slate-200 p-3.5 flex flex-col gap-2.5 font-sans text-left text-slate-800 transition-opacity duration-100 pointer-events-auto"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-[#E3EFE8] flex items-center justify-center shrink-0 text-[#1E4D2B]">
                  {isGoogleDrive ? <FileText className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate" title={info.fileTitle || info.label}>
                    {info.fileTitle || info.label}
                  </div>
                  <div className="text-[10px] text-[#64748B] font-medium flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1E4D2B]" />
                    <span>{fileTypeLabel}</span>
                  </div>
                </div>
              </div>
              <a
                href={info.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#64748B] hover:text-[#1E4D2B] p-1 rounded hover:bg-slate-100 transition-colors shrink-0"
                title="Open link in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Body Preview Frame — Instant Page Thumbnail + Directly Interactive Iframe */}
            <div className="relative w-full h-[210px] bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center shadow-inner">
              {!iframeLoaded && info.thumbnailUrl && !thumbError && (
                <img
                  src={info.thumbnailUrl}
                  alt={info.fileTitle || info.label}
                  className="absolute inset-0 w-full h-full object-contain object-top bg-white z-10 pointer-events-none"
                  onError={() => setThumbError(true)}
                />
              )}

              {!iframeLoaded && (
                <div
                  className={
                    info.thumbnailUrl && !thumbError
                      ? 'absolute bottom-2 right-2 flex items-center gap-1.5 bg-[#0E3322]/90 text-white px-2.5 py-1 rounded-full shadow-sm z-20 pointer-events-none'
                      : 'absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 text-slate-500 gap-1.5 z-10 pointer-events-none'
                  }
                >
                  <Loader2
                    className={`w-3.5 h-3.5 animate-spin ${
                      info.thumbnailUrl && !thumbError ? 'text-[#E8AE1F]' : 'text-[#1E4D2B]'
                    }`}
                  />
                  <span className="text-[10px] font-medium">
                    {info.thumbnailUrl && !thumbError ? 'Syncing live scroll...' : 'Loading interactive preview...'}
                  </span>
                </div>
              )}

              <iframe
                src={activePreviewUrl}
                title={`Preview ${info.fileTitle || info.label}`}
                className={`w-full h-full rounded border-0 relative z-10 pointer-events-auto transition-opacity duration-150 ${
                  iframeLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setIframeLoaded(true)}
                loading="eager"
              />
            </div>

            {/* Footer Action */}
            <div className="pt-0.5 flex items-center justify-between text-[11px] text-slate-500">
              <span className="text-[10.5px] text-[#64748B] truncate max-w-[175px]" title={info.url}>
                {isGoogleDrive ? 'Interactive Google Drive Preview' : 'Interactive Web Preview'}
              </span>

              <a
                href={info.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-xs text-[#0E3322] bg-[#E3EFE8] hover:bg-[#d0e5d8] px-2.5 py-1 rounded-md transition-colors inline-flex items-center gap-1"
              >
                <span>Open Document</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
