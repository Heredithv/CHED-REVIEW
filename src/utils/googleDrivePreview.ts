// Strict Google Drive link parsing and preview utility with evidence_files integration
// NOTE: Strictly matches ONLY against genuine files in evidence_files. No mock or fallback links.

export interface EvidenceFile {
  id: string;
  file_name: string;
  file_type?: string | null;
  mime_type?: string | null;
  description?: string | null;
  drive_file_id?: string | null;
  drive_url: string;
  drive_folder_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DriveFileInfo {
  hasLink: boolean;
  label: string;
  url?: string;
  fileId?: string;
  fileType: 'pdf' | 'doc' | 'sheet' | 'slide' | 'drive' | 'link';
  fileTitle?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  isPlain: boolean;
}

/**
 * Extracts Google Drive ID and file type from any URL
 */
export function parseDriveUrl(url: string, fallbackTitle?: string): Omit<DriveFileInfo, 'isPlain'> {
  let fileId = '';
  let fileType: DriveFileInfo['fileType'] = 'drive';

  // Match Google Drive file: /file/d/{id}
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    fileId = fileMatch[1];
    fileType = 'pdf';
  }

  // Match open?id={id} or uc?id={id}
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (!fileId && idMatch) {
    fileId = idMatch[1];
    fileType = 'drive';
  }

  // Match Google Docs: /document/d/{id}
  const docMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch) {
    fileId = docMatch[1];
    fileType = 'doc';
  }

  // Match Google Sheets: /spreadsheets/d/{id}
  const sheetMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetMatch) {
    fileId = sheetMatch[1];
    fileType = 'sheet';
  }

  // Match Google Slides: /presentation/d/{id}
  const slideMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (slideMatch) {
    fileId = slideMatch[1];
    fileType = 'slide';
  }

  // Match Google Drive folder: /drive/folders/{id}
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  const isFolder = Boolean(folderMatch);
  if (folderMatch) {
    fileId = folderMatch[1];
    fileType = 'drive';
  }

  let previewUrl: string | undefined = undefined;
  let thumbnailUrl: string | undefined = undefined;

  if (fileId) {
    if (isFolder) {
      previewUrl = `https://drive.google.com/embeddedfolderview?id=${fileId}#list`;
    } else if (fileType === 'doc') {
      previewUrl = `https://docs.google.com/document/d/${fileId}/preview`;
    } else if (fileType === 'sheet') {
      previewUrl = `https://docs.google.com/spreadsheets/d/${fileId}/preview`;
    } else if (fileType === 'slide') {
      previewUrl = `https://docs.google.com/presentation/d/${fileId}/preview`;
    } else {
      previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    }
    if (!isFolder) {
      thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`;
    }
  } else if (url.trim().includes('/view')) {
    previewUrl = url.trim().replace(/\/view(\?.*)?$/, '/preview');
  } else {
    previewUrl = url.trim();
  }

  return {
    hasLink: true,
    label: fallbackTitle || 'View File',
    url,
    fileId: fileId || undefined,
    fileType,
    fileTitle: fallbackTitle || 'Google Drive Document',
    previewUrl,
    thumbnailUrl
  };
}

/**
 * Strictly normalizes text to match ONLY against existing evidence_files in Supabase.
 * Returns null if the item has no genuine file in evidence_files.
 */
export function findEvidenceFileMatch(
  text: string | null | undefined,
  evidenceFiles: EvidenceFile[] = []
): { drive_url: string; drive_file_id?: string; file_name?: string } | null {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  // Plain text indicators that explicitly should NEVER have a preview or link
  if (
    lower === 'ongoing' ||
    lower.startsWith('ongoing') ||
    lower === 'for application after approval' ||
    lower.includes('for application after approval') ||
    lower.includes('for application') ||
    lower.includes('pending') ||
    lower === 'none' ||
    lower === 'n/a' ||
    lower === '—' ||
    lower === '-'
  ) {
    return null;
  }

  // 1. Direct case-insensitive match against evidence_files
  for (const f of evidenceFiles) {
    if (f.file_name && f.file_name.trim().toLowerCase() === lower && f.drive_url) {
      return { drive_url: f.drive_url, drive_file_id: f.drive_file_id || undefined, file_name: f.file_name };
    }
  }

  // 2. Clean key match (ignores leading "1. ", "2. ")
  const cleanKey = (str: string) =>
    str
      .toLowerCase()
      .replace(/^[0-9]+[\.\)\s\-]*/, '')
      .replace(/\s+/g, ' ')
      .trim();

  const vClean = cleanKey(trimmed);
  for (const f of evidenceFiles) {
    if (f.file_name && cleanKey(f.file_name) === vClean && f.drive_url) {
      return { drive_url: f.drive_url, drive_file_id: f.drive_file_id || undefined, file_name: f.file_name };
    }
  }

  // 3. Strict alphanumeric match (e.g. "BR # 148, s. 2025" vs "1. BRN 148, s. 2025")
  const cleanStrict = (str: string) =>
    str
      .toLowerCase()
      .replace(/^[0-9]+[\.\)\s\-]*/, '')
      .replace(/^(brn|br#|br\s*#|br\s*no|brno|reso|resolution)/, 'br')
      .replace(/[^a-z0-9]/g, '')
      .trim();

  const vStrict = cleanStrict(trimmed);
  for (const f of evidenceFiles) {
    if (f.file_name && cleanStrict(f.file_name) === vStrict && f.drive_url) {
      return { drive_url: f.drive_url, drive_file_id: f.drive_file_id || undefined, file_name: f.file_name };
    }
  }

  // If no match in evidence_files, IT HAS NO FILE: Return null (strictly plain text)
  return null;
}

/**
 * Checks a cell string. Returns whether it has a verified link or is plain text.
 */
export function parseCellDriveInfo(
  rawText: string | null | undefined,
  explicitUrl?: string | null,
  explicitFileId?: string | null,
  evidenceFiles?: EvidenceFile[]
): DriveFileInfo {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return {
      hasLink: false,
      label: '',
      fileType: 'link',
      isPlain: true
    };
  }

  const trimmed = rawText.trim();
  const lower = trimmed.toLowerCase();

  // Plain text indicators that explicitly should NEVER have a preview
  if (
    lower === 'ongoing' ||
    lower.startsWith('ongoing') ||
    lower === 'for application after approval' ||
    lower.includes('for application after approval') ||
    lower.includes('for application') ||
    lower.includes('pending') ||
    lower === 'none' ||
    lower === 'n/a' ||
    lower === '—' ||
    lower === '-'
  ) {
    return {
      hasLink: false,
      label: trimmed,
      fileType: 'link',
      isPlain: true
    };
  }

  // 1. If explicit URL was supplied from a real evidence_files match
  if (explicitUrl) {
    const parsed = parseDriveUrl(explicitUrl, trimmed);
    const resolvedId = explicitFileId || parsed.fileId;
    return {
      ...parsed,
      fileId: resolvedId,
      previewUrl: parsed.previewUrl || (resolvedId ? `https://drive.google.com/file/d/${resolvedId}/preview` : explicitUrl.trim()),
      thumbnailUrl: parsed.thumbnailUrl || (resolvedId ? `https://drive.google.com/thumbnail?id=${resolvedId}&sz=w600` : undefined),
      label: trimmed,
      fileTitle: trimmed,
      isPlain: false
    };
  }

  // 2. Check for explicit Markdown link in text: [Title](https://...)
  const mdMatch = trimmed.match(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/);
  if (mdMatch) {
    const label = mdMatch[1];
    const url = mdMatch[2];
    const parsed = parseDriveUrl(url, label);
    return {
      ...parsed,
      label,
      isPlain: false
    };
  }

  // 3. Check for explicit URL inside the text
  const urlMatch = trimmed.match(/(https?:\/\/[^\s<>"']+)/);
  if (urlMatch) {
    const url = urlMatch[1];
    let label = trimmed.replace(url, '').replace(/[()[\]|]/g, '').trim();
    if (!label) {
      label = trimmed;
    }
    const parsed = parseDriveUrl(url, label);
    return {
      ...parsed,
      label,
      isPlain: false
    };
  }

  // 4. Check evidence_files table if provided
  if (evidenceFiles && evidenceFiles.length > 0) {
    const match = findEvidenceFileMatch(trimmed, evidenceFiles);
    if (match && match.drive_url) {
      const parsed = parseDriveUrl(match.drive_url, trimmed);
      const resolvedId = match.drive_file_id || parsed.fileId;
      return {
        ...parsed,
        fileId: resolvedId,
        previewUrl: resolvedId ? `https://drive.google.com/file/d/${resolvedId}/preview` : parsed.previewUrl,
        thumbnailUrl: resolvedId ? `https://drive.google.com/thumbnail?id=${resolvedId}&sz=w600` : parsed.thumbnailUrl,
        label: trimmed,
        fileTitle: match.file_name || trimmed,
        isPlain: false
      };
    }
  }

  // Pure plain text without a link
  return {
    hasLink: false,
    label: trimmed,
    fileType: 'link',
    isPlain: true
  };
}

// Fast image thumbnail preloader cache
const preloadedThumbnails = new Set<string>();

export function preloadDriveThumbnail(thumbnailUrl?: string) {
  if (!thumbnailUrl || typeof window === 'undefined' || preloadedThumbnails.has(thumbnailUrl)) return;
  preloadedThumbnails.add(thumbnailUrl);
  const img = new Image();
  img.decoding = 'async';
  img.src = thumbnailUrl;
}

