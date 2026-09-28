import React, { useState, useEffect, useRef } from 'react';
import { Type, Check, ChevronDown } from 'lucide-react';

export interface FontOption {
  id: string;
  name: string;
  fontFamily: string;
  description: string;
  badge?: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'poppins',
    name: 'Poppins',
    fontFamily: "'Poppins', sans-serif",
    description: 'Geometric sans from the presentation graphics & PNGs',
    badge: 'Matches PNGs'
  },
  {
    id: 'plus-jakarta',
    name: 'Plus Jakarta Sans',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    description: 'Modern crisp geometric UI sans',
  },
  {
    id: 'inter',
    name: 'Inter',
    fontFamily: "'Inter', sans-serif",
    description: 'Clean neutral workhorse sans (Figma default)',
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    fontFamily: "'Montserrat', sans-serif",
    description: 'Wide architectural geometric sans',
  }
];

export const FontSwitcher: React.FC = () => {
  const [selectedFont, setSelectedFont] = useState<string>('poppins');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('jhcsc_font') || 'poppins';
    setSelectedFont(saved);
    document.documentElement.setAttribute('data-font', saved);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    setSelectedFont(id);
    document.documentElement.setAttribute('data-font', id);
    localStorage.setItem('jhcsc_font', id);
    setIsOpen(false);
  };

  const currentOption = FONT_OPTIONS.find((f) => f.id === selectedFont) || FONT_OPTIONS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Desktop Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-label="Select typography style"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E9E2] bg-white hover:border-[#1E4D2B] text-xs font-medium text-[#15221A] transition-all shadow-2xs hover:bg-[#F9FAF8] active:scale-95"
        title="Change typography style to match PNGs or preferences"
      >
        <Type className="w-3.5 h-3.5 text-[#1E4D2B]" />
        <span className="hidden lg:inline text-[#64748B]">Font:</span>
        <span className="font-semibold text-[#1E4D2B]">{currentOption.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#E5E9E2] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-[#F1F5F0] mb-1">
            <span className="text-xs font-bold text-[#1E4D2B] uppercase tracking-wider block">
              Typography Style
            </span>
            <span className="text-[11px] text-[#64748B]">
              Imitating the fonts used in your source graphics
            </span>
          </div>

          <div className="flex flex-col space-y-1">
            {FONT_OPTIONS.map((font) => {
              const isSelected = font.id === selectedFont;
              return (
                <button
                  key={font.id}
                  onClick={() => handleSelect(font.id)}
                  type="button"
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start justify-between group ${
                    isSelected
                      ? 'bg-[#FBF1D2]/50 text-[#1E4D2B]'
                      : 'hover:bg-[#F4F6F1] text-[#15221A]'
                  }`}
                  style={{ fontFamily: font.fontFamily }}
                >
                  <div className="flex flex-col pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm leading-tight text-[#15221A]">
                        {font.name}
                      </span>
                      {font.badge && (
                        <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded-md bg-[#1E4D2B] text-[#F5F2E6]">
                          {font.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-sans text-[#64748B] mt-0.5 leading-tight">
                      {font.description}
                    </span>
                  </div>

                  <div className="w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">
                    {isSelected ? (
                      <Check className="w-4 h-4 text-[#1E4D2B]" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-transparent group-hover:bg-[#CBD5E1]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
