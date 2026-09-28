import React from 'react';

interface SectionHeadingProps {
  title: string;
  className?: string;
  id?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ title, className = '', id }) => {
  return (
    <div id={id} className={`flex items-center gap-3 w-full scroll-mt-24 ${className}`}>
      {/* Gold dot with soft gold-tint halo */}
      <div className="relative flex items-center justify-center w-5 h-5 shrink-0" aria-hidden="true">
        <div className="w-5 h-5 rounded-full bg-[#FBF1D2] flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F]" />
        </div>
      </div>

      {/* Heading in Forest */}
      <h2 className="font-display font-bold text-2xl sm:text-[28px] text-[#1E4D2B] tracking-tight whitespace-nowrap">
        {title}
      </h2>

      {/* Dashed Line-colored rule stretching to the right edge */}
      <div className="flex-1 border-t-2 border-dashed border-[#BCC7B9] ml-2" />
    </div>
  );
};
