import React from 'react';
import { siteContent } from '../data/siteContent';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#F4F6F1] border-t border-[#E5E9E2]/60 py-4 sm:py-5">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B] font-medium">
        <div>{siteContent.footerText}</div>
        <div>{siteContent.footerDate}</div>
      </div>
    </footer>
  );
};
