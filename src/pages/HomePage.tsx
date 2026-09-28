import React, { useEffect, useState, useRef } from 'react';
import { Calendar, FileText, Download, ExternalLink } from 'lucide-react';
import { siteContent } from '../data/siteContent';
import { SectionHeading } from '../components/SectionHeading';
import { DonutChart } from '../components/DonutChart';

interface StatCounterProps {
  value: string;
  className?: string;
  style?: React.CSSProperties;
}

const StatCounter: React.FC<StatCounterProps> = ({ value, className, style }) => {
  const targetNum = parseInt(value.replace(/[^0-9]/g, ''), 10);
  const [displayValue, setDisplayValue] = useState<string>('0');
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef<boolean>(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || isNaN(targetNum)) return;

    // easeOutQuart over 1.2 seconds (1200ms)
    const duration = 1200;
    const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);
    let animationFrameId: number | null = null;

    const startAnimation = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);
        const currentVal = Math.round(easedProgress * targetNum);

        setDisplayValue(currentVal.toLocaleString('en-US'));

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          setDisplayValue(targetNum.toLocaleString('en-US'));
        }
      };

      animationFrameId = requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startAnimation();
          } else {
            hasAnimated.current = false;
            setDisplayValue('0');
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [targetNum]);

  return (
    <span ref={ref} className={className} style={style}>
      {displayValue}
    </span>
  );
};

export const HomePage: React.FC = () => {
  // Intersection observer to add reveal transitions as sections enter/exit viewport
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const key = entry.target.id || entry.target.getAttribute('data-section') || '';
          if (key) {
            setVisibleSections((prev) => ({ ...prev, [key]: entry.isIntersecting }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -20px 0px' }
    );

    const elements = document.querySelectorAll('[data-reveal]');
    elements.forEach((el) => observer.observe(el));

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="w-full bg-[#F4F6F1] flex flex-col relative">
      {/* ========================================================
          1. HERO SECTION (WITH BUILDING PHOTO & GRADIENT OVERLAY)
         ======================================================== */}
      <section className="relative w-full h-[520px] overflow-hidden">
        {/* Full-width background image with subtle parallax */}
        <img
          src="/assets/BUILDING_IMAGE.jpg"
          alt="J.H. Cerilles State College Main Campus"
          className="absolute inset-0 w-full h-[560px] object-cover transition-transform duration-300 ease-out will-change-transform"
          style={{
            objectPosition: 'center 20%',
            transform: `translateY(${Math.min(scrollY * 0.15, 60)}px) scale(1.03)`,
          }}
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src.indexOf('/public/assets') === -1) {
              img.src = '/public/assets/BUILDING_IMAGE.jpg';
            }
          }}
        />

        {/* Gradient overlay placed directly over the photo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(8,32,20,0.72) 44%, rgba(8,32,20,0.97) 100%)',
          }}
        />

        {/* Hero Text Content (aligned with leftmost logo in nav) */}
        <div className="relative z-10 w-full max-w-[1440px] h-full mx-auto px-4 sm:px-8 lg:px-12 flex flex-col justify-end pb-12 sm:pb-14">
          <div className="max-w-3xl">
            <h1 className="font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-[70px] leading-[1.02] tracking-tight text-white mb-3 drop-shadow-sm">
              University<br className="hidden sm:inline" /> Conversion
            </h1>

            <p className="text-base sm:text-lg text-[#F5F2E6]/90 font-normal leading-relaxed mb-6 max-w-[500px]">
              Official compliance and evidence records submitted to CHED under Republic Act No. 12295.
            </p>

            {/* Two interactive pill chips */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-white">
              <div className="flex items-center gap-2 bg-[#082014]/70 hover:bg-[#082014]/90 backdrop-blur-xs py-2 px-4 rounded-full border border-white/20 transition-all duration-200 shadow-sm cursor-default">
                <Calendar className="w-3.5 h-3.5 text-[#E8AE1F]" />
                <span>
                  Data as of <strong className="font-bold text-white">October 1, 2026</strong>
                </span>
              </div>

              {/* Clickable Republic Act link opening official gazette */}
              <a
                href="https://www.officialgazette.gov.ph/2025/09/15/republic-act-no-12295/"
                target="_blank"
                rel="noopener noreferrer"
                title="View Republic Act No. 12295 on Official Gazette"
                className="group flex items-center gap-2 bg-[#082014]/70 hover:bg-[#0E3322] hover:border-[#E8AE1F] backdrop-blur-xs py-2 px-4 rounded-full border border-white/20 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#E8AE1F] group-hover:scale-110 transition-transform" />
                <strong className="font-bold text-white group-hover:text-[#E8AE1F] transition-colors">Republic Act No. 12295</strong>
                <ExternalLink className="w-3 h-3 text-[#E8AE1F] opacity-70 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          STATS STRIP (WHITE ROUNDED CARD OVERLAPPING PHOTO)
         ======================================================== */}
      <div className="relative z-20 w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            borderTop: '5px solid #E8AE1F',
            boxShadow: '0 24px 60px -24px rgba(14,51,34,0.5)',
            marginTop: '-22px',
          }}
          className="w-full transition-all duration-300 hover:shadow-[0_28px_70px_-20px_rgba(14,51,34,0.6)]"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#DCE3D9] p-6 sm:p-8">
            {siteContent.hero.stats.map((stat, idx) => (
              <div
                key={idx}
                className={`flex flex-col justify-center py-3 md:py-0 transition-transform duration-200 hover:-translate-y-0.5 group ${
                  idx === 0 ? 'md:pr-6' : idx === 3 ? 'md:pl-6' : 'md:px-6'
                }`}
              >
                <StatCounter
                  value={stat.value}
                  style={{
                    fontSize: '56px',
                    fontWeight: 800,
                    color: '#1E4D2B',
                    lineHeight: 1,
                  }}
                  className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight mb-2 group-hover:text-[#0E3322] transition-colors inline-block"
                />
                <span
                  style={{
                    fontSize: '14px',
                    color: '#56635A',
                  }}
                  className="font-normal group-hover:text-[#15221A] transition-colors"
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Page Container for Sections 2-6 with Smooth Transitions */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col space-y-16 sm:space-y-24 pt-16 sm:pt-20 pb-10 sm:pb-12">
        {/* ========================================================
            2. ABOUT THE CONVERSION
           ======================================================== */}
        <section
          id="about"
          data-reveal
          data-section="about"
          className={`scroll-mt-28 transition-all duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            visibleSections['about'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <SectionHeading title={siteContent.about.heading} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
            {/* Left Paragraph */}
            <div className="lg:col-span-7">
              <p className="text-base sm:text-lg text-[#15221A] leading-relaxed font-normal">
                {siteContent.about.body}
              </p>
            </div>

            {/* Right: Two stacked white cards */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              {/* Card 1: Complete records */}
              <div className="bg-white border border-[#E5E9E2] rounded-signature p-5 shadow-[0_2px_12px_rgba(21,34,26,0.03)] flex items-start gap-4 hover-lift">
                <div className="w-10 h-10 rounded-full bg-[#FBF1D2] flex items-center justify-center text-[#8C660B] shrink-0 mt-0.5">
                  <FileText className="w-5 h-5 text-[#E8AE1F]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1E4D2B]">
                    {siteContent.about.cards[0].title}
                  </h3>
                  <p className="text-sm text-[#475569] mt-1 leading-normal">
                    {siteContent.about.cards[0].description}
                  </p>
                </div>
              </div>

              {/* Card 2: Ready to download */}
              <div className="bg-white border border-[#E5E9E2] rounded-signature p-5 shadow-[0_2px_12px_rgba(21,34,26,0.03)] flex items-start gap-4 hover-lift">
                <div className="w-10 h-10 rounded-full bg-[#FBF1D2] flex items-center justify-center text-[#8C660B] shrink-0 mt-0.5">
                  <Download className="w-5 h-5 text-[#E8AE1F]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1E4D2B]">
                    {siteContent.about.cards[1].title}
                  </h3>
                  <p className="text-sm text-[#475569] mt-1 leading-normal">
                    {siteContent.about.cards[1].description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            3. WHAT CHED REVIEWS
           ======================================================== */}
        <section
          id="reviews"
          data-reveal
          data-section="reviews"
          className={`scroll-mt-28 transition-all duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            visibleSections['reviews'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <SectionHeading title={siteContent.whatChedReviews.heading} />
          <p className="text-sm sm:text-base text-[#475569] mt-2 mb-6 font-normal">
            {siteContent.whatChedReviews.subtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {siteContent.whatChedReviews.cards.map((card, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E5E9E2] border-t-[5px] border-t-[#E8AE1F] rounded-signature p-6 sm:p-7 shadow-[0_4px_16px_rgba(21,34,26,0.03)] flex flex-col justify-between hover-lift transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-extrabold text-5xl sm:text-6xl text-[#1E4D2B] tracking-tight leading-none group-hover:text-[#0E3322] transition-colors">
                      {card.number}
                    </span>
                    {card.subNumber && (
                      <span className="text-xl sm:text-2xl font-semibold text-[#64748B]">
                        {card.subNumber}
                      </span>
                    )}
                  </div>

                  <span className="block text-xs text-[#64748B] mt-1 font-medium">
                    {card.label}
                  </span>

                  <h3 className="font-bold text-lg sm:text-xl text-[#15221A] mt-5 mb-2 leading-snug">
                    {card.title}
                  </h3>

                  <p className="text-sm text-[#475569] leading-relaxed mb-6">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href={card.href}
                    className="inline-flex items-center text-sm font-semibold text-[#1E4D2B] hover:text-[#C58B12] hover:translate-x-0.5 transition-all"
                  >
                    <span className="underline">{card.linkText}</span>
                    <span className="ml-1 text-xs">→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            4. CHED FORMS 1 TO 8
           ======================================================== */}
        <section
          id="forms"
          data-reveal
          data-section="forms"
          className={`scroll-mt-28 transition-all duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            visibleSections['forms'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <SectionHeading title={siteContent.formsSection.heading} />
          <p className="text-sm sm:text-base text-[#475569] mt-2 mb-6 font-normal">
            {siteContent.formsSection.subtitle}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Programs, faculty and research */}
            <div className="bg-white border border-[#E5E9E2] rounded-signature p-6 sm:p-7 shadow-[0_4px_16px_rgba(21,34,26,0.03)] hover-lift">
              <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-6">
                {siteContent.formsSection.card1.title}
              </h3>

              <div className="relative flex flex-col space-y-6">
                {/* Vertical dashed line */}
                <div className="absolute left-[15px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-[#BCC7B9] -z-0" />

                {siteContent.formsSection.card1.forms.map((item) => (
                  <div key={item.num} className="relative z-10 flex items-start justify-between gap-4 group">
                    <div className="flex items-start gap-4">
                      {/* Numbered stop */}
                      {item.isOpen ? (
                        <div className="w-8 h-8 rounded-full bg-[#E8AE1F] text-[#15221A] font-extrabold text-xs flex items-center justify-center ring-2 ring-[#0E3322] shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                          {item.num}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-[#CBD5E1] text-[#64748B] font-bold text-xs flex items-center justify-center shrink-0 group-hover:border-[#94A3B8] transition-colors">
                          {item.num}
                        </div>
                      )}

                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-[#15221A] leading-tight group-hover:text-[#1E4D2B] transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                          {item.desc}
                        </p>
                        {/* Mobile status underneath */}
                        <div className="sm:hidden mt-1.5">
                          {item.isOpen ? (
                            <a
                              href={item.href}
                              className="font-bold text-xs text-[#1E4D2B] underline hover:text-[#2F7D4E]"
                            >
                              Open form →
                            </a>
                          ) : (
                            <span className="text-xs text-[#64748B] font-medium">
                              Next phase
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Desktop right-aligned status */}
                    <div className="hidden sm:block shrink-0 text-right pt-0.5">
                      {item.isOpen ? (
                        <a
                          href={item.href}
                          className="font-bold text-sm text-[#1E4D2B] hover:text-[#C58B12] transition-colors inline-flex items-center gap-1 group-hover:translate-x-0.5"
                        >
                          <span className="underline">Open form</span>
                          <span className="text-xs">→</span>
                        </a>
                      ) : (
                        <span className="text-xs sm:text-sm text-[#64748B] font-medium">
                          Next phase
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Resources, linkages and outreach */}
            <div className="bg-white border border-[#E5E9E2] rounded-signature p-6 sm:p-7 shadow-[0_4px_16px_rgba(21,34,26,0.03)] hover-lift">
              <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-6">
                {siteContent.formsSection.card2.title}
              </h3>

              <div className="relative flex flex-col space-y-6">
                {/* Vertical dashed line */}
                <div className="absolute left-[15px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-[#BCC7B9] -z-0" />

                {siteContent.formsSection.card2.forms.map((item) => (
                  <div key={item.num} className="relative z-10 flex items-start justify-between gap-4 group">
                    <div className="flex items-start gap-4">
                      {/* Numbered stop */}
                      {item.isOpen ? (
                        <div className="w-8 h-8 rounded-full bg-[#E8AE1F] text-[#15221A] font-extrabold text-xs flex items-center justify-center ring-2 ring-[#0E3322] shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                          {item.num}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-[#CBD5E1] text-[#64748B] font-bold text-xs flex items-center justify-center shrink-0 group-hover:border-[#94A3B8] transition-colors">
                          {item.num}
                        </div>
                      )}

                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-[#15221A] leading-tight group-hover:text-[#1E4D2B] transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                          {item.desc}
                        </p>
                        {/* Mobile status underneath */}
                        <div className="sm:hidden mt-1.5">
                          {item.isOpen ? (
                            <a
                              href={item.href}
                              className="font-bold text-xs text-[#1E4D2B] underline hover:text-[#2F7D4E]"
                            >
                              Open form →
                            </a>
                          ) : (
                            <span className="text-xs text-[#64748B] font-medium">
                              Next phase
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Desktop right-aligned status */}
                    <div className="hidden sm:block shrink-0 text-right pt-0.5">
                      {item.isOpen ? (
                        <a
                          href={item.href}
                          className="font-bold text-sm text-[#1E4D2B] hover:text-[#C58B12] transition-colors inline-flex items-center gap-1 group-hover:translate-x-0.5 cursor-pointer"
                        >
                          <span className="underline">Open form</span>
                          <span className="text-xs">→</span>
                        </a>
                      ) : (
                        <span className="text-xs sm:text-sm text-[#64748B] font-medium">
                          Next phase
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        
        {/* ========================================================
              5. PROGRAM COMPLIANCE BY CAMPUS
            ======================================================== */}
          <section
            id="campuses"
            data-reveal
            data-section="campuses"
            className="scroll-mt-28"
          >
            {/* Header renders first at 0s */}
            <div
              style={{
                transitionDelay: visibleSections['campuses'] ? '0ms' : '0ms',
                transitionProperty: 'opacity, transform',
              }}
              className={`will-change-transform transition-all duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] transform ${
                visibleSections['campuses'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <SectionHeading title={siteContent.campusesSection.heading} />
              <p className="text-sm sm:text-base text-[#475569] mt-2 mb-6 font-normal">
                {siteContent.campusesSection.subtitle}
              </p>
            </div>

            {/* Responsive CSS Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {siteContent.campusesSection.campuses.map((campus, idx) => (
                <div
                  key={campus.name}
                  style={{
                    transitionDelay: visibleSections['campuses'] ? `${(idx + 1) * 180}ms` : '0ms',
                    transitionProperty: 'opacity, transform',
                  }}
                  className={`relative group bg-white border border-[#E5E9E2] rounded-signature p-6 shadow-[0_4px_16px_rgba(21,34,26,0.03)] flex flex-col items-center text-center justify-between will-change-transform transition-all duration-[1100ms] ease-[cubic-bezier(0.25,1,0.5,1)] transform hover:-translate-y-2 hover:shadow-[0_16px_36px_rgba(30,77,43,0.14)] hover:border-[#1E4D2B]/40 hover:bg-gradient-to-b hover:from-white hover:to-[#FAFBF9] ${
                    visibleSections['campuses']
                      ? 'opacity-100 translate-y-0 scale-100'
                      : 'opacity-0 translate-y-2 scale-[0.99]'
                  }`}
                >
                  {/* Subtle Gold Accent Bar on Hover */}
                  <div className="absolute top-0 left-8 right-8 h-1 rounded-b-full bg-[#E8AE1F] opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-1 group-hover:translate-y-0" />

                  <div className="flex flex-col items-center w-full">
                    <h3 className="font-bold text-lg text-[#15221A] group-hover:text-[#1E4D2B] transition-colors duration-300">
                      {campus.name}
                    </h3>
                    <span className="text-xs text-[#64748B] mt-0.5 mb-5 font-normal group-hover:text-[#475569] transition-colors">
                      {campus.programsCount} programs
                    </span>

                    {/* Donut chart with smooth hover scaling */}
                    <div className="transform group-hover:scale-105 transition-transform duration-300">
                      <DonutChart percent={campus.percent} />
                    </div>

                    <p className="text-xs text-[#475569] mt-5 mb-5 font-medium">
                      {campus.complied} of {campus.total} requirement checks complied
                    </p>
                  </div>

                  <a
                    href={`#programs?campus=${encodeURIComponent(campus.campusFilter)}`}
                    className="w-full py-2.5 px-4 rounded-[12px] border border-[#1E4D2B] text-[#1E4D2B] font-bold text-xs sm:text-sm group-hover:bg-[#1E4D2B] group-hover:text-white group-hover:shadow-md hover:bg-[#0E3322] active:scale-98 transition-all duration-300 text-center cursor-pointer"
                  >
                    View programs
                  </a>
                </div>
              ))}
            </div>

            {/* Legend renders sequentially after cards */}
            <div
              style={{
                transitionDelay: visibleSections['campuses'] ? '900ms' : '0ms',
                transitionProperty: 'opacity, transform',
              }}
              className={`flex items-center justify-center gap-6 mt-6 text-xs text-[#475569] will-change-transform transition-all duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] transform ${
                visibleSections['campuses'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#1E4D2B]" />
                <span>Complied</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#E8AE1F]" />
                <span>Not complied</span>
              </div>
            </div>
          </section>


        {/* ========================================================
            6. CLOSING PANEL
           ======================================================== */}
        <section
          data-reveal
          data-section="closing"
          className={`relative bg-[#0E3322] text-[#F5F2E6] rounded-signature p-8 sm:p-10 overflow-hidden shadow-lg transition-all duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] transform ${
            visibleSections['closing'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column */}
            <div className="lg:col-span-6">
              <h2 className="font-extrabold text-2xl sm:text-3xl lg:text-[32px] text-[#F5F2E6] tracking-tight">
                {siteContent.closingPanel.heading}
              </h2>
              <p className="text-sm text-[#F5F2E6]/75 mt-1.5 font-normal">
                {siteContent.closingPanel.subtitle}
              </p>
            </div>

            {/* Right Column: 4 gold dots with halos joined by dashed line */}
            <div className="lg:col-span-6">
              <div className="relative flex items-center justify-between w-full">
                {/* Dashed Connecting Line with left-to-right scaleX animation */}
                <div
                  style={{
                    transform: visibleSections['closing'] ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 900ms cubic-bezier(0.25, 1, 0.5, 1)',
                    transitionDelay: visibleSections['closing'] ? '250ms' : '0ms',
                  }}
                  className="absolute left-4 right-4 top-2.5 border-t-2 border-dashed border-[#BCC7B9]/60 z-0"
                />

                {siteContent.closingPanel.campuses.map((cName, idx) => (
                  <div
                    key={idx}
                    style={{
                      transitionDelay: visibleSections['closing'] ? `${350 + idx * 150}ms` : '0ms',
                      transitionProperty: 'opacity, transform',
                    }}
                    className={`relative z-10 flex flex-col items-center group cursor-default transition-all duration-[700ms] ease-[cubic-bezier(0.25,1,0.5,1)] transform ${
                      visibleSections['closing'] ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-1'
                    }`}
                  >
                    {/* Gold dot with soft halo */}
                    <div className="w-5 h-5 rounded-full bg-[#FBF1D2] flex items-center justify-center shrink-0 group-hover:scale-125 transition-transform duration-300 shadow-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F]" />
                    </div>
                    {/* Campus Label */}
                    <span className="font-semibold text-xs sm:text-[13px] text-[#F5F2E6] mt-2.5 text-center whitespace-nowrap group-hover:text-[#E8AE1F] transition-colors">
                      {cName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};