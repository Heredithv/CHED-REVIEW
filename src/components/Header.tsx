import React, { useState, useEffect } from 'react';
import { ArrowDownToLine } from 'lucide-react';
import { siteContent } from '../data/siteContent';
import { downloadAllSiteData } from '../utils/excelExport';

interface HeaderProps {
  currentPath: string;
}

export const Header: React.FC<HeaderProps> = ({ currentPath }) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Scrollspy to detect currently active section on home page + scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((scrollY / totalScroll) * 100);
      }

      if (currentPath !== 'home' && currentPath !== '') {
        return;
      }

      const sections = ['about', 'reviews', 'forms'];
      const spyY = scrollY + 140;
      let current = '';

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (spyY >= top && spyY < top + height) {
            current = sectionId;
            break;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPath]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isHashScroll?: boolean) => {
    if (isHashScroll) {
      if (currentPath === 'home' || currentPath === '') {
        e.preventDefault();
        const targetId = href.replace('#', '');
        const elem = document.getElementById(targetId);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', href);
        }
      } else {
        window.location.hash = href;
      }
    }
  };

  const isNavActive = (href: string) => {
    if (href === '#requirements' && currentPath === 'requirements') return true;
    if (href === '#programs' && currentPath === 'programs') return true;
    if (href === '#forms' && (currentPath === 'form3' || currentPath === 'form4')) return true;
    
    if (currentPath === 'home' || currentPath === '') {
      if (href === '#about' && activeSection === 'about') return true;
      if (href === '#reviews' && activeSection === 'reviews') return true;
      if (href === '#forms' && activeSection === 'forms') return true;
    }
    return false;
  };

  return (
    <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E9E2] transition-all duration-300 ${
      isScrolled ? 'shadow-md border-[#CBD5E1]' : ''
    }`}>
      {/* Interactive Scroll Progress Line */}
      <div
        className="absolute top-0 left-0 h-[2.5px] bg-gradient-to-r from-[#1E4D2B] via-[#E8AE1F] to-[#1E4D2B] transition-all duration-150 z-50"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Top Bar with wide width for edge alignment */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        {/* Left: School Logo + University Conversion title linking to jhcsc.edu.ph */}
        <a
          href="https://jhcsc.edu.ph/"
          target="_blank"
          rel="noopener noreferrer"
          title="Visit J.H. Cerilles State College Official Website (jhcsc.edu.ph)"
          className="flex items-center gap-3.5 group focus:outline-none transition-transform active:scale-95 cursor-pointer"
        >
          <div className="relative">
            <img
              src="/assets/SCHOOL_LOGO.png"
              alt="J.H. Cerilles State College Logo"
              className="w-11 h-11 object-contain shrink-0 drop-shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src.indexOf('/public/assets') === -1) {
                  img.src = '/public/assets/SCHOOL_LOGO.png';
                }
              }}
            />
            <div className="absolute inset-0 rounded-full bg-[#E8AE1F]/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xs pointer-events-none" />
          </div>

          <div className="flex flex-col">
            <span className="font-bold text-[15px] sm:text-[17px] text-[#0E3322] leading-tight group-hover:text-[#1E4D2B] transition-colors">
              {siteContent.collegeName}
            </span>
            <span className="font-semibold text-[10px] sm:text-[11px] text-[#C58B12] uppercase tracking-wider leading-none mt-1 group-hover:tracking-widest transition-all">
              UNIVERSITY CONVERSION
            </span>
          </div>
        </a>

        {/* Center Nav (Desktop) */}
        <nav className="hidden lg:flex items-center gap-8 h-full">
          {siteContent.navItems.map((item) => {
            const active = isNavActive(item.href);
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href, item.isHashScroll)}
                className={`text-sm font-medium transition-all duration-200 relative py-1.5 hover:-translate-y-0.5 ${
                  active
                    ? 'text-[#0E3322] font-semibold'
                    : 'text-[#475569] hover:text-[#0E3322]'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C58B12] rounded-full transition-all duration-300" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right: Download all data button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={downloadAllSiteData}
            type="button"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#0E3322] hover:bg-[#154630] active:bg-[#0A2619] text-[#FFFFFF] text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer group"
            title="Download full compliance workbook"
          >
            <ArrowDownToLine className="w-4 h-4 text-[#E8AE1F] transition-transform duration-300 group-hover:translate-y-0.5" />
            <span className="hidden xs:inline sm:inline">Download all data</span>
            <span className="xs:hidden sm:hidden">Download</span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Horizontally Scrollable Row */}
      <div className="lg:hidden border-t border-[#E5E9E2] bg-white/95 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-6 px-4 py-2.5 whitespace-nowrap min-w-max">
          {siteContent.navItems.map((item) => {
            const active = isNavActive(item.href);
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href, item.isHashScroll)}
                className={`text-xs sm:text-sm transition-all duration-200 py-1 ${
                  active
                    ? 'text-[#0E3322] font-bold border-b-2 border-[#C58B12]'
                    : 'text-[#475569] font-medium hover:text-[#0E3322]'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </div>
    </header>
  );
};
