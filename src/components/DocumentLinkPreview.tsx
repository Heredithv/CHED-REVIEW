import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, FileText } from 'lucide-react';

export interface DocumentLinkPreviewProps {
  text?: string | null;
  url?: string | null;
  fallbackText?: string;
  className?: string;
}

/**
 * Helper to convert Google Drive / Docs links to embeddable preview URLs (/preview)
 */
export function convertToDrivePreviewUrl(url: string): string {
  if (!url) return '';
  let clean = url.trim();

  // If already ends in /preview
  if (clean.endsWith('/preview')) return clean;

  if (clean.includes('drive.google.com/file/d/')) {
    return clean
      .replace(/\/view(\?.*)?$/, '/preview')
      .replace(/\/edit(\?.*)?$/, '/preview');
  }

  if (clean.includes('drive.google.com/open?id=')) {
    const id = clean.split('id=')[1]?.split('&')[0];
    if (id) {
      return `https://drive.google.com/file/d/${id}/preview`;
    }
  }

  if (clean.includes('docs.google.com/')) {
    return clean
      .replace(/\/edit(\?.*)?$/, '/preview')
      .replace(/\/view(\?.*)?$/, '/preview');
  }

  if (clean.includes('/view')) {
    return clean.replace(/\/view(\?.*)?$/, '/preview');
  }

  return clean;
}

/**
 * Helper to extract Google Drive link and clean text from cell value or separate url prop
 */
export function extractDriveInfo(
  text?: string | null,
  explicitUrl?: string | null
): { displayText: string; driveUrl?: string; previewUrl?: string } {
  const combinedStr = `${text || ''} ${explicitUrl || ''}`.trim();

  // Check explicitUrl first
  if (
    explicitUrl &&
    (explicitUrl.includes('drive.google.com') ||
      explicitUrl.includes('docs.google.com') ||
      explicitUrl.startsWith('http'))
  ) {
    const rawUrl = explicitUrl.trim();
    return {
      displayText: text?.trim() || 'View Document',
      driveUrl: rawUrl,
      previewUrl: convertToDrivePreviewUrl(rawUrl)
    };
  }

  if (!text || !text.trim()) {
    return { displayText: '—' };
  }

  const rawText = text.trim();
  const urlRegex = /(https?:\/\/[^\s<">]+)/g;
  const matches = rawText.match(urlRegex);

  if (matches && matches.length > 0) {
    const rawUrl = matches[0];
    let label = rawText.replace(rawUrl, '').replace(/[|()]/g, '').trim();
    if (!label) label = 'View Document';

    return {
      displayText: label,
      driveUrl: rawUrl,
      previewUrl: convertToDrivePreviewUrl(rawUrl)
    };
  }

  // Plain text
  return { displayText: rawText };
}

export const DocumentLinkPreview: React.FC<DocumentLinkPreviewProps> = ({
  text,
  url,
  fallbackText = '—',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const enterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { displayText, driveUrl, previewUrl } = extractDriveInfo(text, url);

  const handleMouseEnter = () => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    enterTimerRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 150); // 150ms debounce
  };

  const handleMouseLeave = () => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    exitTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200); // 200ms exit delay
  };

  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  // Plain text rendering (no drive URL)
  if (!driveUrl) {
    return (
      <span className={className || 'text-[#334155]'}>
        {displayText || fallbackText}
      </span>
    );
  }

  return (
    <span
      className="relative inline-block group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Underlined link */}
      <a
        href={driveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline underline-offset-2 decoration-[#1E4D2B]/40 hover:decoration-[#1E4D2B] font-medium text-[#1E4D2B] hover:text-[#0E3322] transition-colors inline-flex items-center gap-1 cursor-pointer ${className}`}
      >
        <span>{displayText}</span>
        <ExternalLink className="w-3 h-3 text-[#1E4D2B]/70 shrink-0 inline-block" />
      </a>

      {/* Popover Preview Card */}
      {isHovered && previewUrl && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-[324px] bg-white rounded-xl shadow-xl border border-slate-200 p-3 flex flex-col gap-2 font-sans text-left text-slate-800 animate-in fade-in zoom-in-95 duration-150"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5 min-w-0">
              <FileText className="w-3.5 h-3.5 text-[#1E4D2B] shrink-0" />
              <span className="text-xs font-bold text-slate-900 truncate" title={displayText}>
                {displayText}
              </span>
            </div>
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1E4D2B] hover:text-[#0E3322] shrink-0"
              title="Open in Google Drive"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Body Preview Frame */}
          <div className="relative w-full h-[190px] bg-slate-50 rounded border border-slate-200 overflow-hidden flex items-center justify-center">
            <iframe
              src={previewUrl}
              title={`Preview ${displayText}`}
              className="w-[300px] h-[190px] rounded border border-slate-200 pointer-events-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span className="italic">Google Drive Document</span>
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#1E4D2B] hover:underline inline-flex items-center gap-1"
            >
              <span>Open in Google Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </span>
  );
};
