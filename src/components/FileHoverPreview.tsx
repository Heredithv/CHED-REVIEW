import React from 'react';
import { DocumentLinkPreview } from './DocumentLinkPreview';

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
  return (
    <DocumentLinkPreview url={evidenceUrl} title={docNumber || title}>
      {children}
    </DocumentLinkPreview>
  );
};
