import React, { useState, useEffect, useRef } from 'react';
import { FileCheck2, ChevronDown, GraduationCap, ArrowUpRight } from 'lucide-react';
import { siteContent } from '../data/siteContent';

interface HeaderProps {
  currentPath: string;
}

const QUICK_JUMP_FORMS = [
  { num: 1, title: 'Programs & Enrollment', href: '#form1', code: 'form1' },
  { num: 2, title: 'Faculty Profile & Ranks', href: '#form2', code: 'form2' },
  { num: 3, title: 'Research Involvement', href: '#form3', code: 'form3' },
  { num: 4, title: 'Research Spending', href: '#form4', code: 'form4' },
  { num: 5, title: 'Learning Resources', href: '#form5', code: 'form5' },
  { num: 6, title: 'Student Support Services', href: '#form6', code: 'form6' },
  { num: 7, title: 'Research Linkages', href: '#form7', code: 'form7' },
  { num: 8, title: 'Community Outreach', href: '#form8', code: 'form8' },
];

export const Header: React.FC<HeaderProps> = ({ currentPath }) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [formsMenuOpen, setFormsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setFormsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      const sections = ['about', 'reviews', 'forms', 'map'];
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
    if (href === '#programs' && currentPath === 'programs') return true;
    if (href === '#forms' && /^form[1-8]$/.test(currentPath)) return true;
    
    if (currentPath === 'home' || currentPath === '') {
      if (href === '#about' && activeSection === 'about') return true;
      if (href === '#reviews' && activeSection === 'reviews') return true;
      if (href === '#forms' && activeSection === 'forms') return true;
      if (href === '#map' && activeSection === 'map') return true;
    }
    return false;
  };

  const activeFormMatch = QUICK_JUMP_FORMS.find((f) => f.code === currentPath);

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
        {/* Left: School Logo + University Conversion title */}
        <a
          href="#home"
          title="Return to University Conversion Evaluation Homepage"
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

        {/* Right: Quick-Jump Evaluation Records Switcher (CHED Forms 1–8 & 51 Program Portfolios) */}
        <div className="relative flex items-center gap-2.5" ref={menuRef}>
          <button
            onClick={() => setFormsMenuOpen((prev) => !prev)}
            type="button"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#0E3322] hover:bg-[#154630] active:bg-[#0A2619] text-[#FFFFFF] text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer group"
            title="Jump directly to any CHED Evaluation Form (1–8) or the 51 Program Compliance Portfolios"
          >
            <FileCheck2 className="w-4 h-4 text-[#E8AE1F] transition-transform duration-300 group-hover:scale-110" />
            <span className="hidden xs:inline sm:inline">
              {activeFormMatch
                ? `CHED Form ${activeFormMatch.num}`
                : currentPath === 'programs'
                ? 'Program Portfolios'
                : 'Evaluation Records'}
            </span>
            <span className="xs:hidden sm:hidden">
              {activeFormMatch
                ? `Form ${activeFormMatch.num}`
                : currentPath === 'programs'
                ? 'Programs'
                : 'Records'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#E8AE1F] transition-transform duration-200 ${
                formsMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {formsMenuOpen && (
            <div className="absolute right-0 top-full mt-2.5 w-76 sm:w-84 bg-white border border-[#E5E9E2] rounded-2xl shadow-[0_20px_50px_rgba(14,51,34,0.18)] overflow-hidden z-50 animate-[fadeIn_0.18s_ease-out]">
              <div className="px-4 py-3 bg-[#0E3322] text-white flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#E8AE1F]">
                  Evaluation Records
                </span>
                <span className="text-[11px] text-white/75 font-medium">
                  Forms 1–8 &amp; Programs
                </span>
              </div>

              {/* Program Compliance Portfolios Section */}
              <div className="p-2 bg-[#F8FAF7] border-b border-[#E5E9E2]">
                <a
                  href="#programs"
                  onClick={() => setFormsMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors ${
                    currentPath === 'programs'
                      ? 'bg-[#FDF6E2] text-[#0E3322] font-bold border border-[#E8AE1F]/40'
                      : 'text-[#0E3322] hover:bg-[#EAF0E8] font-bold'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#0E3322] text-[#E8AE1F] flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </span>
                    <span className="flex flex-col">
                      <span>51 Program Portfolios</span>
                      <span className="text-[10px] font-medium text-[#64748B]">
                        COPC &amp; AACCUP by Campus
                      </span>
                    </span>
                  </span>
                  <span className="text-[11px] text-[#1E4D2B] font-semibold shrink-0 ml-2">
                    Open &rarr;
                  </span>
                </a>
              </div>

              {/* CHED Forms 1-8 List */}
              <div className="px-3.5 pt-2.5 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#64748B]">
                  CHED Forms 1 to 8
                </span>
              </div>
              <div className="px-2 pb-2 grid grid-cols-1 gap-0.5 max-h-[300px] overflow-y-auto">
                {QUICK_JUMP_FORMS.map((form) => {
                  const isCurrent = currentPath === form.code;
                  return (
                    <a
                      key={form.num}
                      href={form.href}
                      onClick={() => setFormsMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                        isCurrent
                          ? 'bg-[#FDF6E2] text-[#0E3322] font-bold'
                          : 'text-[#15221A] hover:bg-[#F4F6F1] font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? 'bg-[#0E3322] text-[#E8AE1F]'
                              : 'bg-[#E8AE1F]/25 text-[#0E3322]'
                          }`}
                        >
                          {form.num}
                        </span>
                        <span className="truncate">{form.title}</span>
                      </div>
                      <span className="text-[11px] text-[#1E4D2B] font-semibold shrink-0 ml-2">
                        Open &rarr;
                      </span>
                    </a>
                  );
                })}
              </div>

              <div className="p-2 bg-[#F8FAF7] border-t border-[#E5E9E2]">
                <a
                  href="https://jhcsc.edu.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setFormsMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-medium text-[#475569] hover:text-[#0E3322] hover:bg-[#EAF0E8]/60 transition-colors"
                >
                  <span>Visit Official JHCSC Website (jhcsc.edu.ph)</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#64748B]" />
                </a>
              </div>
            </div>
          )}
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
