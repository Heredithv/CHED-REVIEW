import React from 'react';
import { TopographicContours } from './TopographicContours';

interface InnerHeroBandProps {
  breadcrumb: string;
  title: string;
  subtitle: string;
  highlightNumber?: string;
}

export const InnerHeroBand: React.FC<InnerHeroBandProps> = ({
  breadcrumb,
  title,
  subtitle,
  highlightNumber
}) => {
  // Render subtitle with highlighted text in bold gold
  const renderSubtitle = () => {
    if (!highlightNumber || !subtitle.includes(highlightNumber)) {
      return <span>{subtitle}</span>;
    }

    const parts = subtitle.split(highlightNumber);
    return (
      <>
        {parts[0]}
        <strong className="text-[#E8AE1F] font-bold">{highlightNumber}</strong>
        {parts.slice(1).join(highlightNumber)}
      </>
    );
  };

  return (
    <section className="relative bg-[#0E3322] text-[#F5F2E6] pt-10 pb-28 overflow-hidden">
      {/* Faint contour lines background */}
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-2/3 pointer-events-none overflow-hidden flex justify-end">
        <TopographicContours className="w-full h-full max-w-xl object-contain translate-x-12 -translate-y-6" opacity={0.06} />
      </div>

      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 z-10">
        {/* Breadcrumb */}
        <nav className="text-xs sm:text-sm text-[#F5F2E6]/80 mb-4" aria-label="Breadcrumb">
          <a href="#home" className="underline hover:text-[#E8AE1F] transition-colors">
            Home
          </a>
          <span className="mx-2 text-[#F5F2E6]/50">/</span>
          <span className="text-[#F5F2E6]">{breadcrumb}</span>
        </nav>

        {/* Big Chalk H1 */}
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-[46px] text-[#F5F2E6] tracking-tight leading-tight mb-3">
          {title}
        </h1>

        {/* Chalk subtitle with key numbers in bold gold */}
        <p className="text-sm sm:text-base text-[#F5F2E6]/90 max-w-2xl font-normal leading-relaxed">
          {renderSubtitle()}
        </p>
      </div>
    </section>
  );
};
