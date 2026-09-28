import React from 'react';

export const SkeletonKPI: React.FC = () => {
  return (
    <div className="border-y border-slate-200 py-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-4 py-2 space-y-2">
            <div className="h-8 bg-slate-200 w-24"></div>
            <div className="h-3 bg-slate-100 w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="border border-slate-200 animate-pulse">
      <div className="h-10 bg-slate-50 border-b border-slate-200"></div>
      <div className="divide-y divide-slate-200">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-11 px-4 flex items-center justify-between">
            <div className="h-3 bg-slate-200 w-16"></div>
            <div className="h-3 bg-slate-200 w-48"></div>
            <div className="h-3 bg-slate-100 w-24"></div>
            <div className="h-3 bg-slate-100 w-16"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonCardGrid: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="border border-slate-200 divide-y divide-slate-200 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-12 px-4 flex items-center justify-between">
          <div className="h-4 bg-slate-200 w-32"></div>
          <div className="h-4 bg-slate-100 w-48"></div>
          <div className="h-4 bg-slate-200 w-20"></div>
        </div>
      ))}
    </div>
  );
};
