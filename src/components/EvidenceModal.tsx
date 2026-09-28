import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { StatusChip } from './StatusChip';

export interface EvidenceModalData {
  title: string;
  code?: string;
  url?: string;
  category?: string;
  formReference?: string;
  status?: string;
  dateVerified?: string;
  description?: string;
}

interface EvidenceModalProps {
  evidence: EvidenceModalData | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ evidence, onClose }) => {
  if (!evidence) return null;

  const targetUrl = evidence.url || 'https://drive.google.com/drive/folders/1-a-lYRJ0jum6N_Y1S0BdQ4GrQRH6VmWF?usp=sharing';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div
        className="relative w-full max-w-xl bg-white border border-slate-300 rounded-[2px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Evidence Record · Republic Act No. 12295
            </div>
            <h3 className="text-base font-semibold text-slate-900 mt-0.5">
              {evidence.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-slate-800 text-xs">
          <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-200">
            <div>
              <span className="text-slate-400 block font-mono text-[10px] uppercase">Control Identifier</span>
              <span className="font-mono font-medium text-slate-900 mt-0.5 block">
                {evidence.code || 'EV-JHCSC-DOC'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-mono text-[10px] uppercase">Evaluation Category</span>
              <span className="font-medium text-slate-900 mt-0.5 block">
                {evidence.formReference || 'CMO 46'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-mono text-[10px] uppercase">Status</span>
              <div className="mt-1">
                <StatusChip status={evidence.status || 'Complied'} />
              </div>
            </div>
            <div>
              <span className="text-slate-400 block font-mono text-[10px] uppercase">Verification</span>
              <span className="font-medium text-slate-900 mt-1 block">
                CHEDRO IX Verified
              </span>
            </div>
          </div>

          {evidence.description && (
            <div className="space-y-1">
              <span className="text-slate-400 block font-mono text-[10px] uppercase">
                Audited Scope & Notes
              </span>
              <p className="text-slate-700 leading-relaxed">
                {evidence.description}
              </p>
            </div>
          )}

          <div className="pt-2 text-[11px] text-slate-500">
            Archived in the certified institutional Google Drive repository for CHED evaluation.
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0e3822] hover:bg-[#14532d] transition-colors"
          >
            <span>Open in Google Drive</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
          </a>
        </div>
      </div>
    </div>
  );
};
