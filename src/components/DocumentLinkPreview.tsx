import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, FileText, Loader2, Globe } from 'lucide-react';
import { preloadDriveThumbnail } from '../utils/googleDrivePreview';

export interface DocumentLinkPreviewProps {
  text?: string | null;
  url?: string | null;
  title?: string | null;
  fallbackText?: string;
  className?: string;
  children?: React.ReactNode;
}

// Bounded LRU pool of active/pre-warmed iframe instances
const MAX_ACTIVE_DOC_IFRAMES = 8;
const activeDocListeners = new Map<symbol, () => void>();
const activeDocOrder: symbol[] = [];

function registerDocIframe(id: symbol, evictCallback: () => void) {
  const existingIdx = activeDocOrder.indexOf(id);
  if (existingIdx !== -1) activeDocOrder.splice(existingIdx, 1);
  activeDocOrder.push(id);
  activeDocListeners.set(id, evictCallback);

  while (activeDocOrder.length > MAX_ACTIVE_DOC_IFRAMES) {
    const oldest = activeDocOrder.shift();
    if (oldest && oldest !== id) {
      const cb = activeDocListeners.get(oldest);
      activeDocListeners.delete(oldest);
      if (cb) cb();
    }
  }
}

function unregisterDocIframe(id: symbol) {
  const idx = activeDocOrder.indexOf(id);
  if (idx !== -1) activeDocOrder.splice(idx, 1);
  activeDocListeners.delete(id);
}

/**
 * Helper to convert Google Drive / Docs / Sheets / Slides links to embeddable preview URLs (/preview)
 */
export function convertToDrivePreviewUrl(url: string): {
  previewUrl: string;
  thumbnailUrl?: string;
  fileType: string;
} {
  if (!url) return { previewUrl: '', fileType: 'Document' };
  const clean = url.trim();

  // Google Drive File
  const fileMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    return {
      previewUrl: `https://drive.google.com/file/d/${fileMatch[1]}/preview`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w600`,
      fileType: 'PDF Document'
    };
  }

  // Google Drive open?id=
  const idMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    return {
      previewUrl: `https://drive.google.com/file/d/${idMatch[1]}/preview`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w600`,
      fileType: 'Google Drive Document'
    };
  }

  // Google Docs
  const docMatch = clean.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch) {
    return {
      previewUrl: `https://docs.google.com/document/d/${docMatch[1]}/preview`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${docMatch[1]}&sz=w600`,
      fileType: 'Google Document'
    };
  }

  // Google Sheets
  const sheetMatch = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetMatch) {
    return {
      previewUrl: `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/preview`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${sheetMatch[1]}&sz=w600`,
      fileType: 'Google Spreadsheet'
    };
  }

  // Google Slides
  const slideMatch = clean.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (slideMatch) {
    return {
      previewUrl: `https://docs.google.com/presentation/d/${slideMatch[1]}/preview`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${slideMatch[1]}&sz=w600`,
      fileType: 'Google Presentation'
    };
  }

  // Google Drive Folder
  const folderMatch = clean.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) {
    return {
      previewUrl: `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#list`,
      fileType: 'Google Drive Folder'
    };
  }

  // If already ends in /preview
  if (clean.endsWith('/preview')) {
    return { previewUrl: clean, fileType: 'Google Drive Document' };
  }

  if (clean.includes('/view')) {
    return {
      previewUrl: clean.replace(/\/view(\?.*)?$/, '/preview'),
      fileType: 'Document Preview'
    };
  }

  // General web URL
  return {
    previewUrl: clean,
    fileType: 'Web Resource'
  };
}

/**
 * Helper to extract link info, display text, and embed preview URL
 */
export function extractDriveInfo(
  text?: string | null,
  explicitUrl?: string | null,
  customTitle?: string | null
): {
  displayText: string;
  driveUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  fileType: string;
} {
  // Check explicitUrl first
  if (explicitUrl && explicitUrl.trim()) {
    const rawUrl = explicitUrl.trim();
    const { previewUrl, thumbnailUrl, fileType } = convertToDrivePreviewUrl(rawUrl);
    return {
      displayText: customTitle?.trim() || text?.trim() || 'View Document',
      driveUrl: rawUrl,
      previewUrl,
      thumbnailUrl,
      fileType
    };
  }

  if (!text || !text.trim()) {
    return { displayText: '—', fileType: 'Document' };
  }

  const rawText = text.trim();
  const urlRegex = /(https?:\/\/[^\s<">]+)/g;
  const matches = rawText.match(urlRegex);

  if (matches && matches.length > 0) {
    const rawUrl = matches[0];
    let label = rawText.replace(rawUrl, '').replace(/[|()]/g, '').trim();
    if (!label) label = customTitle?.trim() || 'View Document';

    const { previewUrl, thumbnailUrl, fileType } = convertToDrivePreviewUrl(rawUrl);
    return {
      displayText: label,
      driveUrl: rawUrl,
      previewUrl,
      thumbnailUrl,
      fileType
    };
  }

  // Plain text
  return { displayText: rawText, fileType: 'Text' };
}

export const DocumentLinkPreview: React.FC<DocumentLinkPreviewProps> = ({
  text,
  url,
  title,
  fallbackText = '—',
  className = '',
  children
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isPrewarmed, setIsPrewarmed] = useState<boolean>(false);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const [thumbError, setThumbError] = useState<boolean>(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeBelow: boolean }>({
    top: 0,
    left: 0,
    placeBelow: false
  });

  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const instanceIdRef = useRef<symbol>(Symbol('doc-preview'));
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { displayText, driveUrl, previewUrl, thumbnailUrl, fileType } = extractDriveInfo(
    text,
    url,
    title
  );
  const isGoogleDrive =
    driveUrl?.includes('drive.google.com') || driveUrl?.includes('docs.google.com');

  const activatePrewarm = useCallback(() => {
    if (thumbnailUrl) {
      preloadDriveThumbnail(thumbnailUrl);
    }
    setIsPrewarmed(true);
    registerDocIframe(instanceIdRef.current, () => {
      setIsPrewarmed(false);
      setIframeLoaded(false);
    });
  }, [thumbnailUrl]);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el || !driveUrl) return;

    let observer: IntersectionObserver | null = null;
    if (thumbnailUrl && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            preloadDriveThumbnail(thumbnailUrl);
            observer?.disconnect();
          }
        },
        { rootMargin: '400px' }
      );
      observer.observe(el);
    }

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
      unregisterDocIframe(instanceIdRef.current);
    };
  }, [driveUrl, thumbnailUrl, activatePrewarm]);

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

  // If no valid URL, render plain content with clean word wrapping
  if (!driveUrl) {
    if (children) return <>{children}</>;
    return (
      <span className={`break-words [overflow-wrap:anywhere] whitespace-normal ${className || 'text-[#334155]'}`}>
        {displayText || fallbackText}
      </span>
    );
  }

  const shouldMountPortal = (isHovered || isPrewarmed) && Boolean(previewUrl);

  return (
    <>
      <span
        ref={triggerRef}
        className={`relative ${
          children ? 'block w-full' : 'inline max-w-full align-baseline'
        } group cursor-pointer break-words [overflow-wrap:anywhere] whitespace-normal`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Trigger: Children or default styled anchor */}
        {children ? (
          children
        ) : (
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline underline-offset-2 decoration-[#1E4D2B]/40 hover:decoration-[#1E4D2B] font-medium text-[#1E4D2B] hover:text-[#0E3322] transition-colors inline break-words [overflow-wrap:anywhere] whitespace-normal cursor-pointer ${className}`}
          >
            <span className="break-words [overflow-wrap:anywhere] whitespace-normal">{displayText}</span>
            <ExternalLink className="w-3 h-3 text-[#1E4D2B]/70 shrink-0 inline-block align-baseline ml-1" />
          </a>
        )}
      </span>

      {/* Uniform Directly-Interactive Popover Preview Card rendered via Portal */}
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
                  <div className="text-xs font-bold text-slate-900 truncate" title={displayText}>
                    {displayText}
                  </div>
                  <div className="text-[10px] text-[#64748B] font-medium flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1E4D2B]" />
                    <span>{fileType}</span>
                  </div>
                </div>
              </div>
              <a
                href={driveUrl}
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
              {!iframeLoaded && thumbnailUrl && !thumbError && (
                <img
                  src={thumbnailUrl}
                  alt={displayText}
                  className="absolute inset-0 w-full h-full object-contain object-top bg-white z-10 pointer-events-none"
                  onError={() => setThumbError(true)}
                />
              )}

              {!iframeLoaded && (
                <div
                  className={
                    thumbnailUrl && !thumbError
                      ? 'absolute bottom-2 right-2 flex items-center gap-1.5 bg-[#0E3322]/90 text-white px-2.5 py-1 rounded-full shadow-sm z-20 pointer-events-none'
                      : 'absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 text-slate-500 gap-1.5 z-10 pointer-events-none'
                  }
                >
                  <Loader2
                    className={`w-3.5 h-3.5 animate-spin ${
                      thumbnailUrl && !thumbError ? 'text-[#E8AE1F]' : 'text-[#1E4D2B]'
                    }`}
                  />
                  <span className="text-[10px] font-medium">
                    {thumbnailUrl && !thumbError ? 'Syncing live scroll...' : 'Loading interactive preview...'}
                  </span>
                </div>
              )}

              <iframe
                src={previewUrl}
                title={`Preview ${displayText}`}
                className={`w-full h-full rounded border-0 relative z-10 pointer-events-auto transition-opacity duration-150 ${
                  iframeLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setIframeLoaded(true)}
                loading="eager"
              />
            </div>

            {/* Footer Action */}
            <div className="pt-0.5 flex items-center justify-between text-[11px] text-slate-500">
              <span className="text-[10.5px] text-[#64748B] truncate max-w-[175px]" title={driveUrl}>
                {isGoogleDrive ? 'Interactive Google Drive Preview' : 'Interactive Web Preview'}
              </span>
              <a
                href={driveUrl}
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
