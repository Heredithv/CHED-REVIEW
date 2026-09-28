import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { RequirementsPage } from './pages/RequirementsPage';
import { Form1Page } from './pages/Form1Page';
import { Form2Page } from './pages/Form2Page';
import { Form3Page } from './pages/Form3Page';
import { Form4Page } from './pages/Form4Page';
import { Form5Page } from './pages/Form5Page';
import { Form6Page } from './pages/Form6Page';
import { Form7Page } from './pages/Form7Page';
import { Form8Page } from './pages/Form8Page';
import { ProgramsPage } from './pages/ProgramsPage';

export function initAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Mark every major content block for animation
  const targets = document.querySelectorAll(
    '.section, .panel, .fact, .stat, .cc, .road, ' +
    '.trio > *, .idx > *, .cgrid > *, .facts-l > *, .close'
  );

  targets.forEach(el => {
    el.classList.remove('visible');
    el.classList.add('reveal');
  });

  // Stagger siblings inside grids
  ['.trio', '.idx', '.cgrid', '.facts-l'].forEach(parent => {
    document.querySelectorAll(parent).forEach(grid => {
      Array.from(grid.children).forEach((child, i) => {
        if (i > 0) child.setAttribute('data-delay', String(Math.min(i, 4)));
      });
    });
  });

  // Observe every reveal element
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Counter animation on stats numbers
  function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
  function runCounter(el: HTMLElement, target: number) {
    const start = performance.now();
    const duration = 1400;
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(easeOut(p) * target).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString();
    }
    requestAnimationFrame(tick);
  }

  const statEls = document.querySelectorAll<HTMLElement>('.strip b, .stats b');
  if (statEls.length > 0) {
    statEls.forEach(el => {
      const val = parseInt(el.textContent?.replace(/[^0-9]/g, '') || '0', 10);
      if (!isNaN(val) && val > 0) el.dataset.target = String(val);
    });
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          statEls.forEach(el => {
            if (el.dataset.target) runCounter(el, parseInt(el.dataset.target, 10));
          });
          counterObserver.disconnect();
        }
      });
    }, { threshold: 0.4 });
    counterObserver.observe(statEls[0].closest('div') || statEls[0]);
  }
}

export function App() {
  const [currentHash, setCurrentHash] = useState<string>(window.location.hash || '#home');

  useEffect(() => {
    // Ensure font preset is applied immediately
    const savedFont = localStorage.getItem('jhcsc_font') || 'poppins';
    document.documentElement.setAttribute('data-font', savedFont);

    const handleHashChange = () => {
      const hash = window.location.hash || '#home';
      setCurrentHash(hash);

      // Smooth scroll if hash is an in-page anchor on home
      if (hash.startsWith('#about') || hash.startsWith('#reviews') || hash.startsWith('#forms')) {
        const targetId = hash.replace('#', '').split('?')[0];
        setTimeout(() => {
          const elem = document.getElementById(targetId);
          if (elem) {
            elem.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        // Scroll to top on page navigation
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Re-trigger scroll animations on route change
      setTimeout(initAnimations, 60);
    };

    window.addEventListener('hashchange', handleHashChange);

    // Initial check and animation run on page load
    handleHashChange();
    initAnimations();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Parse path & params from hash
  const rawHash = currentHash.replace(/^#/, '');
  const [pathPart, queryPart] = rawHash.split('?');
  const path = pathPart || 'home';

  let initialCampus: string | undefined;
  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    initialCampus = params.get('campus') || undefined;
  }

  // Determine active page
  let currentPage = 'home';
  if (path === 'requirements') {
    currentPage = 'requirements';
  } else if (path === 'form1') {
    currentPage = 'form1';
  } else if (path === 'form2') {
    currentPage = 'form2';
  } else if (path === 'form3') {
    currentPage = 'form3';
  } else if (path === 'form4') {
    currentPage = 'form4';
  } else if (path === 'form5') {
    currentPage = 'form5';
  } else if (path === 'form6') {
    currentPage = 'form6';
  } else if (path === 'form7') {
    currentPage = 'form7';
  } else if (path === 'form8') {
    currentPage = 'form8';
  } else if (path === 'programs') {
    currentPage = 'programs';
  } else {
    currentPage = 'home';
  }

  // Re-run animations whenever currentPage changes
  useEffect(() => {
    const t = setTimeout(initAnimations, 50);
    return () => clearTimeout(t);
  }, [currentPage]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F1] text-[#15221A] font-sans">
      {/* Shared Header across all pages */}
      <Header currentPath={currentPage} />

      {/* Main Content Area */}
      <main key={currentPage} className="flex-1 w-full animate-[fadeIn_0.35s_ease-out]">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'requirements' && <RequirementsPage />}
        {currentPage === 'form1' && <Form1Page />}
        {currentPage === 'form2' && <Form2Page />}
        {currentPage === 'form3' && <Form3Page />}
        {currentPage === 'form4' && <Form4Page />}
        {currentPage === 'form5' && <Form5Page />}
        {currentPage === 'form6' && <Form6Page />}
        {currentPage === 'form7' && <Form7Page />}
        {currentPage === 'form8' && <Form8Page />}
        {currentPage === 'programs' && <ProgramsPage initialCampus={initialCampus} />}
      </main>

      {/* Shared Footer across all pages */}
      <Footer />
    </div>
  );
}

export default App;
