import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
  title?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message = 'An unexpected error occurred while retrieving submitted compliance data from the CHED review views.',
  onRetry,
  title = 'Data Retrieval Notice'
}) => {
  return (
    <div className="bg-amber-50/70 border border-[#c59b27]/60 rounded-xl p-6 text-slate-800 my-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#b45309] shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Query</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
