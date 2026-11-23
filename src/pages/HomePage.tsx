import React, { useEffect, useState, useRef } from 'react';
import { Calendar, FileText, Download, ExternalLink, Play, Pause, Volume2, VolumeX, Maximize2, ChevronRight, ChevronLeft, MapPin, Clock, BookOpen, LayoutGrid } from 'lucide-react';
import { siteContent, CampusScorecard } from '../data/siteContent';
import { SectionHeading } from '../components/SectionHeading';
import { DonutChart } from '../components/DonutChart';
import { getSupabaseClient } from '../data/api';
import { preloadProgramsData, CampusId } from './ProgramsPage';

interface Campus3DSiteVideo {
  id: string;
  tabLabel: string;
  overlayTitle: string;
  shortSiteName: string;
  municipality: string;
  defaultDuration: string;
  description: string;
  highlights: string[];
  videoUrl: string;
}

interface Campus3DTourGroup {
  campusName: string;
  buttonName: string;
  shortName: string;
  municipality: string;
  sites: Campus3DSiteVideo[];
}

const CAMPUS_3D_TOURS: Campus3DTourGroup[] = [
  {
    campusName: 'Main Campus',
    buttonName: 'Main Campus',
    shortName: 'Main',
    municipality: 'Mati, San Miguel, Zamboanga del Sur',
    sites: [
      {
        id: 'main-campus',
        tabLabel: 'Main Campus 3D Map',
        overlayTitle: 'Main Campus 3D Map',
        shortSiteName: 'Mati, San Miguel',
        municipality: 'Mati, San Miguel, Zamboanga del Sur',
        defaultDuration: '4:06',
        description:
          'This video presents the JHCSC Main Campus entrance gate and aerial grounds, featuring the IT Building, Fitness Gym, Farmers Training building, Viewing Deck, Mural Statue, High Impact Research Building (Research & Innovation Center), and Sports Oval.',
        highlights: [],
        videoUrl: 'https://wvonwulrshllpcngveaw.supabase.co/storage/v1/object/public/campus-videos/Main%20Campus.mp4',
      },
    ],
  },
  {
    campusName: 'Dumingag Campus',
    buttonName: 'Dumingag Campus',
    shortName: 'Dumingag',
    municipality: 'Dumingag, Zamboanga del Sur',
    sites: [
      {
        id: 'dumingag-caridad',
        tabLabel: 'Caridad Campus 3D Map',
        overlayTitle: 'Caridad Campus — Dumingag',
        shortSiteName: 'Caridad',
        municipality: 'Caridad, Dumingag, Zamboanga del Sur',
        defaultDuration: '1:30',
        description:
          'This video shows the aerial view of the Caridad Campus in Dumingag, featuring the JHCSC Caridad IT Building, the JHCSC Caridad Admin, QA and Academic Building, and the JHCSC Caridad Campus Gymnasium.',
        highlights: [],
        videoUrl: 'https://wvonwulrshllpcngveaw.supabase.co/storage/v1/object/public/campus-videos/Jhcsc%20Caridad%20Campus.mp4',
      },
      {
        id: 'dumingag-dapiwak',
        tabLabel: 'Dapiwak Site 3D Map',
        overlayTitle: 'Dapiwak Site — Dumingag',
        shortSiteName: 'Dapiwak',
        municipality: 'Dapiwak, Dumingag, Zamboanga del Sur',
        defaultDuration: '3:01',
        description:
          'This video presents the JHCSC Dapiwak Campus gate and grounds, featuring the Campus Clinic, Academic Building, Integrated Laboratory Building, Student Center Building, Library Building, Multi-Purpose Building (Academic), Agri-Research Center Building, and Sports Oval.',
        highlights: [],
        videoUrl: 'https://wvonwulrshllpcngveaw.supabase.co/storage/v1/object/public/campus-videos/Dapiwak-avg.mp4',
      },
    ],
  },
  {
    campusName: 'Pagadian Campus',
    buttonName: 'Pagadian Campus',
    shortName: 'Pagadian',
    municipality: 'Pagadian City, Zamboanga del Sur',
    sites: [
      {
        id: 'pagadian-3d',
        tabLabel: 'Pagadian Campus 3D Map',
        overlayTitle: 'Pagadian Campus 3D Map',
        shortSiteName: 'Pagadian City',
        municipality: 'Pagadian City, Zamboanga del Sur',
        defaultDuration: '3:36',
        description:
          'This video features the JHCSC Pagadian Campus entrance and courtyard grounds, showing the Amphitheater, Academic Building, Admin Building, and SBM Building.',
        highlights: [],
        videoUrl: 'https://wvonwulrshllpcngveaw.supabase.co/storage/v1/object/public/campus-videos/Jhcsc%20%20Pagadian%203D-.mp4',
      },
    ],
  },
  {
    campusName: 'Lakewood Campus',
    buttonName: 'Lakewood Campus',
    shortName: 'Lakewood',
    municipality: 'Lakewood, Zamboanga del Sur',
    sites: [
      {
        id: 'cmse-lakewood-pob',
        tabLabel: 'Poblacion Lakewood 3D Map',
        overlayTitle: 'Multi Purpose Center — Poblacion Lakewood',
        shortSiteName: 'Poblacion',
        municipality: 'Poblacion, Lakewood, Zamboanga del Sur',
        defaultDuration: '2:26',
        description:
          'This video presents the Multi-Purpose Center in Poblacion Lakewood, featuring the Multi-Purpose Training Center, Multi-Purpose Covered Court, and IGP Building.',
        highlights: [],
        videoUrl: 'https://wvonwulrshllpcngveaw.supabase.co/storage/v1/object/public/campus-videos/POBLACION.mp4',
      },
      {
        id: 'cmse-biswangan',
        tabLabel: 'Biswangan Campus 3D Map',
        overlayTitle: 'Biswangan Campus — Lakewood',
        shortSiteName: 'Biswangan',
        municipality: 'Biswangan, Lakewood, Zamboanga del Sur',
        defaultDuration: '2:05',
        description:
          'This video shows the JHCSC Biswangan Lakewood Campus gate and aerial grounds, featuring the Library Building, Student Center, Multi-Purpose Building, Academic Building with Laboratories, Dormitory, and Employees Housing.',
        highlights: [],
        videoUrl: 'https://wvonwulrshllpcngveaw.supabase.co/storage/v1/object/public/campus-videos/Jhcsc%20Biswangan-avg.mp4',
      },
    ],
  },
];

function formatSeconds(sec: number): string {
  if (!sec || !isFinite(sec) || sec <= 0) return '';
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

interface StatCounterProps {
  value: string;
  className?: string;
  style?: React.CSSProperties;
}

const StatCounter: React.FC<StatCounterProps> = ({ value, className, style }) => {
  return (
    <span className={className} style={style}>
      {value}
    </span>
  );
};

let cachedHomeStats: { value: string; label: string }[] | null = null;
let cachedHomeCampusCards: CampusScorecard[] | null = null;
let cachedHomeCampusSubtitle: string | null = null;
const HOME_STATS_CACHE_KEY = 'jhcsc_home_live_stats_v2';

export const HomePage: React.FC = () => {
  // Intersection observer to add reveal transitions as sections enter/exit viewport
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  const [scrollY, setScrollY] = useState(0);

  const [stats, setStats] = useState<{ value: string; label: string }[]>(() => {
    if (cachedHomeStats && cachedHomeStats.length > 0) return cachedHomeStats;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(HOME_STATS_CACHE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 4) {
            cachedHomeStats = parsed;
            return parsed;
          }
        }
      } catch {}
    }
    return siteContent.hero.stats;
  });
  const [loadingStats, setLoadingStats] = useState<boolean>(() => !cachedHomeStats);
  const [campusCards, setCampusCards] = useState<CampusScorecard[]>(
    () => cachedHomeCampusCards || siteContent.campusesSection.campuses
  );
  const [campusSubtitle, setCampusSubtitle] = useState<string>(
    () => cachedHomeCampusSubtitle || siteContent.campusesSection.subtitle
  );
  const [showFullMessage, setShowFullMessage] = useState(false);

  // Interactive 3D Campus Map Walkthrough state
  const [activeTourCampusIdx, setActiveTourCampusIdx] = useState<number>(0);
  const [activeTourSiteIdx, setActiveTourSiteIdx] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [videoDurations, setVideoDurations] = useState<Record<string, string>>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchLiveDatabaseAnalytics() {
      try {
        const client = getSupabaseClient();
        if (!client) {
          if (isMounted) setLoadingStats(false);
          return;
        }

        // Step 1: Immediately fetch lightweight Form 1 & Form 2 counts for the top stats bar
        const [form1Res, form2Res] = await Promise.all([
          client
            .from('form1')
            .select('row_id,campus_name,program_offering,enrollees_sy26_27,enrollees_sy25_26,average_enrollees'),
          client
            .from('form2')
            .select('row_id,is_full_time_permanent,is_full_time_contractual,is_part_time')
        ]);

        const form1Rows = form1Res.data || [];
        const form2Rows = form2Res.data || [];

        if (form1Rows.length > 0 || form2Rows.length > 0) {
          const sy2526Sum = form1Rows.reduce(
            (sum: number, r: any) => sum + (Number(r.enrollees_sy25_26) || 0),
            0
          );
          const sy2627Sum = form1Rows.reduce(
            (sum: number, r: any) => sum + (Number(r.enrollees_sy26_27) || 0),
            0
          );
          const totalEnrollment = sy2526Sum > 0 ? sy2526Sum : sy2627Sum;

          const totalPrograms = form1Rows.length;

          const fullTimeFacultyCount =
            form2Rows.filter(
              (r: any) => Boolean(r.is_full_time_permanent) || Boolean(r.is_full_time_contractual)
            ).length || form2Rows.length;

          const campusSet = new Set<string>();
          form1Rows.forEach((r: any) => {
            const raw = String(r.campus_name || '').toLowerCase();
            if (raw.includes('pagadian')) campusSet.add('Pagadian');
            else if (raw.includes('dumingag')) campusSet.add('Dumingag');
            else if (raw.includes('cmse') || raw.includes('lakewood') || raw.includes('enerio')) campusSet.add('CMSE');
            else if (raw.trim()) campusSet.add('Main');
          });
          const campusesCount = campusSet.size || 4;

          const nextStats = [
            { value: totalEnrollment.toLocaleString('en-US'), label: 'students enrolled' },
            { value: totalPrograms.toLocaleString('en-US'), label: 'degree programs' },
            { value: fullTimeFacultyCount.toLocaleString('en-US'), label: 'full-time faculty' },
            { value: campusesCount.toLocaleString('en-US'), label: 'campuses' }
          ];

          cachedHomeStats = nextStats;
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem(HOME_STATS_CACHE_KEY, JSON.stringify(nextStats));
            }
          } catch {}

          if (isMounted) {
            setStats(nextStats);
            setLoadingStats(false);
          }
        } else if (isMounted) {
          setLoadingStats(false);
        }

        // Step 2: Load programmatic compliance sheets in the background for the campus scorecards section
        const programSheets = await preloadProgramsData(false);

        if (programSheets && programSheets.length > 0) {
          const campusDefs: { name: string; campusId: CampusId; campusFilter: string }[] = [
            { name: 'Main', campusId: 'Main Campus', campusFilter: 'Main campus' },
            { name: 'Dumingag', campusId: 'Dumingag Campus', campusFilter: 'Dumingag campus' },
            { name: 'Pagadian', campusId: 'Pagadian Campus', campusFilter: 'Pagadian campus' },
            { name: 'Lakewood', campusId: 'CMSE Campus', campusFilter: 'Lakewood' }
          ];

          let allComplied = 0;
          let allNotComplied = 0;
          let allPending = 0;
          let allTotal = 0;
          let allPrograms = 0;

          const liveCards: CampusScorecard[] = campusDefs.map((def) => {
            const cSheets = programSheets.filter((s) => s.campus === def.campusId);
            const programsCount = cSheets.length;

            let complied = 0;
            let notComplied = 0;
            let pending = 0;
            let areasComplied = 0;
            let areasNotComplied = 0;
            let areasPending = 0;
            let areasTotal = 0;

            cSheets.forEach((s) => {
              areasComplied += s.areasCompliedCount;
              areasNotComplied += s.areasNotCompliedCount;
              areasPending += s.areasPendingCount;
              areasTotal += s.areas.length;

              s.areas.forEach((area) => {
                complied += area.compliedCount;
                notComplied += area.notCompliedCount;
                pending += area.pendingCount;
              });
            });

            const total = complied + notComplied + pending;
            const percent = total > 0 ? Math.round((complied / total) * 100) : 0;

            allComplied += complied;
            allNotComplied += notComplied;
            allPending += pending;
            allTotal += total;
            allPrograms += programsCount;

            return {
              name: def.name,
              programsCount,
              percent,
              complied,
              notComplied,
              pending,
              total,
              areasComplied,
              areasNotComplied,
              areasPending,
              areasTotal,
              campusFilter: def.campusFilter
            };
          });

          const overallPercent = allTotal > 0 ? Math.round((allComplied / allTotal) * 100) : 0;
          const nextSubtitle = `${allComplied.toLocaleString('en-US')} of ${allTotal.toLocaleString('en-US')} requirement checks across ${allPrograms} program forms are marked complied (${overallPercent}%), with ${allNotComplied.toLocaleString('en-US')} not complied and ${allPending.toLocaleString('en-US')} pending.`;
          cachedHomeCampusCards = liveCards;
          cachedHomeCampusSubtitle = nextSubtitle;
          if (isMounted) {
            setCampusCards(liveCards);
            setCampusSubtitle(nextSubtitle);
          }
        }
      } catch (err) {
        console.error('Error loading live database analytics from Supabase:', err);
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    }
    fetchLiveDatabaseAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

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
                  Data as of <strong className="font-bold text-white">{siteContent.dataAsOf}</strong>
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
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={`flex flex-col justify-center py-3 md:py-0 transition-transform duration-200 hover:-translate-y-0.5 group ${
                  idx === 0 ? 'md:pr-6' : idx === 3 ? 'md:pl-6' : 'md:px-6'
                }`}
              >
                {loadingStats ? (
                  <div className="h-[56px] flex items-center mb-2">
                    <div className="h-10 w-24 bg-[#EEF1EB] rounded animate-pulse" />
                  </div>
                ) : (
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
                )}
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

              {/* Card 2: Verified Cloud Spreadsheets */}
              <div className="bg-white border border-[#E5E9E2] rounded-signature p-5 shadow-[0_2px_12px_rgba(21,34,26,0.03)] flex items-start gap-4 hover-lift">
                <div className="w-10 h-10 rounded-full bg-[#FBF1D2] flex items-center justify-center text-[#8C660B] shrink-0 mt-0.5">
                  <ExternalLink className="w-5 h-5 text-[#E8AE1F]" />
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
            3. MESSAGE FROM THE COLLEGE PRESIDENT
           ======================================================== */}
        <section
          id="reviews"
          data-reveal
          data-section="reviews"
          className={`scroll-mt-28 py-4 sm:py-6 transition-all duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            visibleSections['reviews'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left Column: Dark Green Portrait Card with Gold L-Corner Accents */}
            <div className="lg:col-span-4 flex justify-center lg:justify-start">
              <div className="relative w-full max-w-[330px] m-3">
                {/* Top-Left Gold L-Bracket */}
                <div
                  className="absolute -top-3.5 -left-3.5 w-12 h-12 border-t-[3px] border-l-[3px] border-[#E8AE1F] rounded-tl-[6px] pointer-events-none"
                  aria-hidden="true"
                />

                {/* Bottom-Right Gold L-Bracket */}
                <div
                  className="absolute -bottom-3.5 -right-3.5 w-12 h-12 border-b-[3px] border-r-[3px] border-[#E8AE1F] rounded-br-[6px] pointer-events-none"
                  aria-hidden="true"
                />

                {/* Main Dark Green Portrait Container */}
                <div className="relative w-full h-[430px] rounded-t-[24px] rounded-br-[24px] rounded-bl-none overflow-hidden bg-gradient-to-b from-[#173E26] via-[#133520] to-[#0C2415] shadow-[0_18px_40px_rgba(14,51,34,0.16)] flex items-end justify-center pt-6">
                  {/* Subtle radial glow behind portrait */}
                  <div
                    className="absolute inset-x-6 top-10 h-60 rounded-full bg-[#245838]/35 blur-2xl pointer-events-none"
                    aria-hidden="true"
                  />

                  {/* Transparent Cutout Portrait of the College President */}
                  <img
                    src={siteContent.presidentMessage.photoUrl}
                    alt={`${siteContent.presidentMessage.presidentName} — ${siteContent.presidentMessage.presidentRole}`}
                    className="relative z-10 w-full h-[395px] object-contain object-bottom select-none"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.src.indexOf('/public/assets') === -1) {
                        img.src = `/public${siteContent.presidentMessage.photoUrl}`;
                      }
                    }}
                  />

                  {/* Bottom Dark Pine Gradient Overlay & Caption */}
                  <div className="absolute inset-x-0 bottom-0 z-20 pt-16 pb-5 px-5 bg-gradient-to-t from-[#081C10] via-[#0B2314]/90 to-transparent">
                    <div className="font-extrabold text-sm sm:text-[15px] text-white tracking-tight leading-snug">
                      {siteContent.presidentMessage.presidentName}
                    </div>
                    <div className="text-xs text-[#D5E0D7]/80 font-normal mt-0.5">
                      {siteContent.presidentMessage.presidentRole}, JHCSC
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Eyebrow, Heading, Pull-Quote, Message & Attribution */}
            <div className="lg:col-span-8 flex flex-col justify-center lg:pt-2">
              {/* Eyebrow */}
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F] shrink-0" />
                <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#1E4D2B]">
                  {siteContent.presidentMessage.eyebrow}
                </span>
              </div>

              {/* Display Heading */}
              <h2 className="font-extrabold text-3xl sm:text-4xl lg:text-[42px] text-[#0E3322] leading-[1.12] tracking-tight mt-3 mb-6 whitespace-pre-line">
                {siteContent.presidentMessage.heading}
              </h2>

              {/* Pull Quote with Gold Left Rule */}
              <div className="border-l-[3.5px] border-[#E8AE1F] pl-5 py-0.5 mb-6">
                <p className="font-serif italic font-semibold text-base sm:text-[17.5px] text-[#15221A] leading-relaxed">
                  &ldquo;{siteContent.presidentMessage.pullQuote}&rdquo;
                </p>
              </div>

              {/* Body Paragraphs */}
              <div className="space-y-4 text-sm sm:text-[15.5px] text-[#475569] leading-[1.75] font-normal max-w-[720px]">
                {siteContent.presidentMessage.paragraphs.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}

                {showFullMessage &&
                  siteContent.presidentMessage.fullMessageParagraphs?.map((paragraph, idx) => (
                    <p key={`full-${idx}`}>{paragraph}</p>
                  ))}
              </div>

              {/* Sign-off & Dashed Horizontal Line */}
              <div className="mt-7 flex items-center gap-6 max-w-[720px]">
                <div className="shrink-0">
                  <div className="font-extrabold text-sm sm:text-base text-[#0E3322] tracking-tight">
                    {siteContent.presidentMessage.presidentName}
                  </div>
                  <div className="text-xs text-[#64748B] mt-0.5">
                    {siteContent.presidentMessage.presidentRole} &middot; {siteContent.presidentMessage.institution}
                  </div>
                </div>
                <div className="flex-1 border-b border-dashed border-[#CBD5E1]" aria-hidden="true" />
              </div>

              {/* Read full message link with gold underline */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setShowFullMessage((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0E3322] pb-1 border-b-2 border-[#E8AE1F] hover:text-[#1E4D2B] transition-colors cursor-pointer"
                >
                  <span>{showFullMessage ? 'Show less' : 'Read full message'}</span>
                  <span aria-hidden="true">{showFullMessage ? '↑' : '→'}</span>
                </button>
              </div>
            </div>
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
                {campusSubtitle}
              </p>
            </div>

            {/* Responsive CSS Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {campusCards.map((campus, idx) => (
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
                      <DonutChart
                        percent={campus.percent}
                        complied={campus.complied}
                        notComplied={campus.notComplied}
                        pending={campus.pending}
                      />
                    </div>

                    <p className="text-xs text-[#15221A] mt-5 font-semibold tabular-nums">
                      {campus.complied} of {campus.total} requirement checks complied
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-1 mb-5 font-medium tabular-nums">
                      <span className="text-[#1E4D2B] font-semibold">{campus.complied}</span> complied &middot;{' '}
                      <span className="text-[#B45309] font-semibold">{campus.notComplied}</span> not complied &middot;{' '}
                      <span>{campus.pending}</span> pending
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
              className={`flex flex-wrap items-center justify-center gap-6 mt-6 text-xs text-[#475569] will-change-transform transition-all duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] transform ${
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
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#DCE3D9]" />
                <span>Pending / no data</span>
              </div>
            </div>
          </section>


        {/* ========================================================
            6. 3D CAMPUS WALKTHROUGHS SECTION
           ======================================================== */}
        <section
          id="map"
          data-reveal
          data-section="map"
          className="scroll-mt-28 pt-2"
        >
          {(() => {
            const activeGroup = CAMPUS_3D_TOURS[activeTourCampusIdx] || CAMPUS_3D_TOURS[0];
            const activeSite = activeGroup.sites[activeTourSiteIdx] || activeGroup.sites[0];
            const nextCampusIdx = (activeTourCampusIdx + 1) % CAMPUS_3D_TOURS.length;
            const prevCampusIdx = (activeTourCampusIdx - 1 + CAMPUS_3D_TOURS.length) % CAMPUS_3D_TOURS.length;
            const activeDuration = videoDurations[activeSite.id] || activeSite.defaultDuration;

            const handleSelectCampus = (idx: number) => {
              setActiveTourCampusIdx(idx);
              setActiveTourSiteIdx(0);
              setIsPlaying(false);
            };

            const handleSelectSite = (sIdx: number) => {
              setActiveTourSiteIdx(sIdx);
              setIsPlaying(false);
            };

            const handleNextTour = () => {
              setIsPlaying(false);
              if (activeTourSiteIdx + 1 < activeGroup.sites.length) {
                setActiveTourSiteIdx(activeTourSiteIdx + 1);
              } else {
                setActiveTourCampusIdx(nextCampusIdx);
                setActiveTourSiteIdx(0);
              }
            };

            const handlePrevTour = () => {
              setIsPlaying(false);
              if (activeTourSiteIdx > 0) {
                setActiveTourSiteIdx(activeTourSiteIdx - 1);
              } else {
                const prevGroup = CAMPUS_3D_TOURS[prevCampusIdx];
                setActiveTourCampusIdx(prevCampusIdx);
                setActiveTourSiteIdx(prevGroup.sites.length - 1);
              }
            };

            const startVideoPlayback = () => {
              const v = videoRef.current;
              setIsPlaying(true);
              if (v) {
                v.play().catch(() => {});
              }
            };

            return (
              <div>
                {/* Section Header with Scroll Reveal */}
                <div
                  style={{
                    transitionDelay: visibleSections['map'] ? '0ms' : '0ms',
                    transitionProperty: 'opacity, transform',
                  }}
                  className={`max-w-xl will-change-transform transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
                    visibleSections['map'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  }`}
                >
                  <div className="inline-flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F] shrink-0 animate-pulse" />
                    <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#1E4D2B]">
                      3D CAMPUS WALKTHROUGHS
                    </span>
                  </div>
                  <h2 className="font-extrabold text-3xl sm:text-4xl lg:text-[42px] text-[#0E3322] leading-[1.12] tracking-tight mt-3">
                    Explore every campus
                    <br />
                    in three dimensions
                  </h2>
                  <p className="text-sm sm:text-[15.5px] text-[#475569] leading-[1.7] mt-3 font-normal max-w-[520px]">
                    3D walkthrough videos of J.H. Cerilles State College buildings and facilities across Main, Dumingag, Pagadian, and Lakewood.
                  </p>
                </div>

                {/* 4 Campus Selector Buttons Row with Staggered Reveal */}
                <div
                  style={{
                    transitionDelay: visibleSections['map'] ? '140ms' : '0ms',
                    transitionProperty: 'opacity, transform',
                  }}
                  className={`flex flex-wrap items-center gap-3 mt-7 mb-6 will-change-transform transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
                    visibleSections['map'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  }`}
                >
                  {CAMPUS_3D_TOURS.map((tour, idx) => {
                    const isSelected = idx === activeTourCampusIdx;
                    const countLabel = tour.sites.length === 1 ? '1 video' : `${tour.sites.length} videos`;
                    return (
                      <button
                        key={tour.campusName}
                        type="button"
                        onClick={() => handleSelectCampus(idx)}
                        className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-xs sm:text-[13px] font-bold transition-all duration-300 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                          isSelected
                            ? 'bg-[#0E3322] text-white border border-[#0E3322] shadow-md'
                            : 'bg-white text-[#15221A] border border-[#CBD5E1] hover:border-[#0E3322]/45 hover:shadow-xs'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 transition-transform duration-300 ${
                            isSelected ? 'bg-[#E8AE1F] scale-110' : 'bg-[#CBD5E1]'
                          }`}
                        />
                        <span>{tour.buttonName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                            isSelected
                              ? 'bg-white/15 text-white/90'
                              : 'bg-[#F1F5F9] text-[#475569]'
                          }`}
                        >
                          {countLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Main 2-Column Split Grid: 8-Col Dark Pine Video Stage + 4-Col Architectural Brief & Walkthroughs */}
                <div
                  style={{
                    transitionDelay: visibleSections['map'] ? '280ms' : '0ms',
                    transitionProperty: 'opacity, transform',
                  }}
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch will-change-transform transition-all duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
                    visibleSections['map'] ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-[0.99]'
                  }`}
                >
                  {/* Left 8 Columns: Dark Pine Video Player Card */}
                  <div className="lg:col-span-8 bg-[#0E3322] rounded-[18px] overflow-hidden shadow-md hover:shadow-[0_20px_48px_rgba(14,51,34,0.22)] border border-[#0E3322] flex flex-col justify-between transition-shadow duration-500">
                    {/* Top Tab Bar inside Dark Pine Card */}
                    <div className="bg-[#0A2619] border-b border-white/10 px-5 flex items-center gap-6 overflow-x-auto no-scrollbar">
                      {activeGroup.sites.map((site, sIdx) => {
                        const isSiteActive = sIdx === activeTourSiteIdx;
                        return (
                          <button
                            key={site.id}
                            type="button"
                            onClick={() => handleSelectSite(sIdx)}
                            className={`inline-flex items-center gap-2 py-3.5 text-xs sm:text-[13px] border-b-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${
                              isSiteActive
                                ? 'border-[#E8AE1F] text-white font-bold'
                                : 'border-transparent text-white/55 hover:text-white/85 font-medium'
                            }`}
                          >
                            <LayoutGrid className="w-3.5 h-3.5 opacity-80" />
                            <span>{site.tabLabel}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* 16:9 Video Viewport */}
                    <div
                      key={`${activeTourCampusIdx}-${activeTourSiteIdx}`}
                      className="relative w-full aspect-video bg-[#113825] overflow-hidden animate-[fadeIn_0.35s_ease-out]"
                    >
                      <video
                        ref={videoRef}
                        key={activeSite.videoUrl}
                        src={activeSite.videoUrl}
                        controls={isPlaying}
                        playsInline
                        muted={isMuted}
                        preload="metadata"
                        onPlay={() => setIsPlaying(true)}
                        onEnded={handleNextTour}
                        onLoadedMetadata={(e) => {
                          const v = e.currentTarget;
                          const formatted = formatSeconds(v.duration);
                          if (formatted) {
                            setVideoDurations((prev) => ({ ...prev, [activeSite.id]: formatted }));
                          }
                          if (!isPlaying && v.paused && v.currentTime < 0.2) {
                            try {
                              v.currentTime = 1.2;
                            } catch {}
                          }
                        }}
                        className="w-full h-full object-cover bg-[#113825]"
                      />

                      {/* Top-right Duration Badge */}
                      <div className="absolute top-4 right-4 z-20 bg-[#05140D]/85 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-[7px] flex items-center gap-1.5 pointer-events-none">
                        <Clock className="w-3.5 h-3.5 text-white/85" />
                        <span className="tabular-nums">{activeDuration}</span>
                      </div>

                      {/* Initial Cover Overlay before video is started */}
                      {!isPlaying && (
                        <div
                          onClick={startVideoPlayback}
                          className="absolute inset-0 z-10 flex flex-col justify-between p-5 sm:p-6 bg-gradient-to-t from-[#061A10]/90 via-[#0A2619]/30 to-transparent cursor-pointer group select-none"
                        >
                          <div />

                          {/* Centered Gold Play Button with Halo */}
                          <div className="self-center flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-[#E8AE1F] text-[#0E3322] ring-8 ring-[#E8AE1F]/20 group-hover:ring-[#E8AE1F]/35 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                              <Play className="w-6 h-6 fill-[#0E3322] ml-0.5" />
                            </div>
                          </div>

                          {/* Bottom-Left Overlay Caption */}
                          <div className="transition-transform duration-300 group-hover:-translate-y-0.5">
                            <h3 className="font-extrabold text-lg sm:text-xl text-white tracking-tight drop-shadow-xs">
                              {activeSite.overlayTitle}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-white/75 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-[#E8AE1F]" />
                              <span>{activeSite.municipality}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Controls Bar inside Dark Pine Card */}
                    <div className="bg-[#0A2619] border-t border-white/10 px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePrevTour}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] border border-white/20 text-white/90 hover:bg-white/10 hover:-translate-x-0.5 active:scale-95 text-xs font-semibold transition-all duration-200 cursor-pointer"
                        >
                          <span>&larr; Prev</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleNextTour}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] border border-white/20 text-white/90 hover:bg-white/10 hover:translate-x-0.5 active:scale-95 text-xs font-semibold transition-all duration-200 cursor-pointer"
                        >
                          <span>Next &rarr;</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsMuted((m) => !m)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] border border-white/20 text-white/90 hover:bg-white/10 active:scale-95 text-xs font-semibold transition-all duration-200 cursor-pointer"
                        >
                          {isMuted ? (
                            <VolumeX className="w-3.5 h-3.5 text-[#E8AE1F]" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-white/80" />
                          )}
                          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => videoRef.current?.requestFullscreen?.()}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] bg-[#E8AE1F] hover:bg-[#d9a016] hover:-translate-y-0.5 active:scale-95 text-[#0E3322] text-xs font-extrabold transition-all duration-200 cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Fullscreen</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right 4 Columns: Campus Architectural Card + Included Walkthroughs Card + Next Campus Button */}
                  <div className="lg:col-span-4 flex flex-col justify-between gap-4">
                    <div
                      key={`info-${activeTourCampusIdx}-${activeTourSiteIdx}`}
                      className="flex flex-col gap-4 animate-[fadeIn_0.35s_ease-out]"
                    >
                      {/* Card 1: Campus Architectural Overview Card with Gold Top Border (Purely Map-Focused) */}
                      <div className="bg-white border border-[#E5E9E2] border-t-4 border-t-[#E8AE1F] rounded-[16px] p-5 shadow-[0_4px_16px_rgba(21,34,26,0.03)] hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(14,51,34,0.10)] transition-all duration-300">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#1E4D2B]">
                            Campus 0{activeTourCampusIdx + 1} of 0{CAMPUS_3D_TOURS.length}
                          </span>
                          <span className="text-[11px] font-semibold text-[#64748B]">
                            {activeGroup.sites.length === 1 ? '1 Site Map' : `${activeGroup.sites.length} Site Maps`}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-xl text-[#0E3322] tracking-tight">
                          {activeGroup.campusName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#C58B12] shrink-0" />
                          <span>{activeSite.municipality}</span>
                        </div>

                        <p className="text-xs text-[#475569] leading-relaxed mt-3.5 pt-3.5 border-t border-[#E5E9E2]">
                          {activeSite.description}
                        </p>
                      </div>

                      {/* Card 2: Included 3D Walkthroughs */}
                      <div className="bg-white border border-[#E5E9E2] rounded-[16px] overflow-hidden shadow-[0_4px_16px_rgba(21,34,26,0.03)] hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(14,51,34,0.10)] transition-all duration-300">
                        <div className="px-4 py-3 border-b border-[#E5E9E2] flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#475569]">
                            INCLUDED 3D WALKTHROUGHS
                          </span>
                          <span className="w-5 h-5 rounded-full bg-[#E8AE1F] text-[#0E3322] text-[11px] font-extrabold flex items-center justify-center">
                            {activeGroup.sites.length}
                          </span>
                        </div>

                        <div className="divide-y divide-[#E5E9E2]">
                          {activeGroup.sites.map((site, sIdx) => {
                            const isSiteActive = sIdx === activeTourSiteIdx;
                            const siteDur = videoDurations[site.id] || site.defaultDuration;
                            return (
                              <button
                                key={site.id}
                                type="button"
                                onClick={() => handleSelectSite(sIdx)}
                                className={`group/item w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left transition-all duration-200 cursor-pointer ${
                                  isSiteActive ? 'bg-[#FDF6E2]' : 'bg-white hover:bg-[#F8FAF7]'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-9 h-7 rounded-[6px] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover/item:scale-105 ${
                                      isSiteActive
                                        ? 'bg-[#0E3322] text-white'
                                        : 'bg-[#1E4D2B] text-[#E8AE1F]'
                                    }`}
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-xs text-[#15221A] group-hover/item:text-[#1E4D2B] transition-colors truncate">
                                      {site.tabLabel}
                                    </div>
                                    <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                                      {activeGroup.sites.length > 1
                                        ? `3D Walkthrough · ${site.shortSiteName}`
                                        : '3D Walkthrough'}
                                    </div>
                                  </div>
                                </div>

                                <span
                                  className={`px-2 py-0.5 rounded-[5px] text-[11px] font-extrabold tabular-nums shrink-0 transition-colors ${
                                    isSiteActive
                                      ? 'bg-[#E8AE1F] text-[#0E3322]'
                                      : 'bg-[#F1F5F9] text-[#475569]'
                                  }`}
                                >
                                  {siteDur}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Button: Step to Next Campus */}
                    <button
                      type="button"
                      onClick={() => handleSelectCampus(nextCampusIdx)}
                      className="group w-full py-3 px-4 rounded-[12px] bg-[#0E3322] hover:bg-[#16442E] text-white font-bold text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-98 cursor-pointer"
                    >
                      <span>Next Campus: {CAMPUS_3D_TOURS[nextCampusIdx].buttonName}</span>
                      <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
                    </button>
                  </div>
                </div>

                {/* Bottom 4-Campus Thumbnail Cards Row with Staggered Entrance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  {CAMPUS_3D_TOURS.map((tour, idx) => {
                    const isSelected = idx === activeTourCampusIdx;
                    const countLabel = tour.sites.length === 1 ? '1 video' : `${tour.sites.length} videos`;
                    return (
                      <button
                        key={tour.campusName}
                        type="button"
                        onClick={() => handleSelectCampus(idx)}
                        style={{
                          transitionDelay: visibleSections['map'] ? `${(idx + 1) * 140 + 380}ms` : '0ms',
                          transitionProperty: 'opacity, transform, box-shadow, border-color',
                        }}
                        className={`relative group rounded-[14px] overflow-hidden bg-white text-left will-change-transform transition-all duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] transform hover:-translate-y-2 hover:shadow-[0_16px_34px_rgba(14,51,34,0.16)] cursor-pointer ${
                          visibleSections['map']
                            ? 'opacity-100 translate-y-0 scale-100'
                            : 'opacity-0 translate-y-3 scale-[0.98]'
                        } ${
                          isSelected
                            ? 'border-2 border-[#E8AE1F] shadow-md'
                            : 'border border-[#E5E9E2] hover:border-[#0E3322]/40 shadow-[0_2px_10px_rgba(21,34,26,0.03)]'
                        }`}
                      >
                        {/* Top Thumbnail Area */}
                        <div className="relative h-28 bg-gradient-to-br from-[#0E3322] to-[#1E4D2B] flex items-center justify-center overflow-hidden">
                          <video
                            src={tour.sites[0].videoUrl}
                            preload="metadata"
                            muted
                            playsInline
                            onLoadedMetadata={(e) => {
                              try {
                                e.currentTarget.currentTime = 1.2;
                              } catch {}
                            }}
                            className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-75 group-hover:scale-110 transition-all duration-500 pointer-events-none"
                          />
                          {isSelected && (
                            <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-[5px] bg-[#E8AE1F] text-[#0E3322] text-[10px] font-extrabold uppercase tracking-wide shadow-xs">
                              NOW VIEWING
                            </span>
                          )}
                          <span className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-[5px] bg-[#05140D]/80 text-white text-[10px] font-semibold">
                            {countLabel}
                          </span>
                          <div className="relative z-10 w-10 h-10 rounded-full bg-[#E8AE1F] text-[#0E3322] flex items-center justify-center shadow-md group-hover:scale-115 group-hover:ring-4 group-hover:ring-[#E8AE1F]/30 transition-all duration-300">
                            <Play className="w-4 h-4 fill-[#0E3322] ml-0.5" />
                          </div>
                        </div>

                        {/* Bottom White Caption */}
                        <div className="p-3.5 bg-white">
                          <div className="font-extrabold text-xs sm:text-sm text-[#15221A] group-hover:text-[#1E4D2B] transition-colors">
                            {tour.buttonName}
                          </div>
                          <div className="text-[11px] text-[#64748B] mt-0.5 truncate">
                            {tour.municipality}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </section>

        {/* ========================================================
            7. CLOSING PANEL — IN REVIEW WITH CHEDRO IX
           ======================================================== */}
        <section
          data-reveal
          data-section="closing"
          className={`relative bg-[#0E3322] text-[#F5F2E6] rounded-signature p-8 sm:p-10 overflow-hidden shadow-lg border-t-4 border-[#E8AE1F] will-change-transform transition-all duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform hover:shadow-[0_24px_56px_rgba(14,51,34,0.32)] ${
            visibleSections['closing']
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-[0.98]'
          }`}
        >
          {/* Ambient radial glow */}
          <div
            className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#245838]/35 blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div
              style={{
                transitionDelay: visibleSections['closing'] ? '100ms' : '0ms',
                transitionProperty: 'opacity, transform',
              }}
              className={`lg:col-span-6 transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
                visibleSections['closing'] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'
              }`}
            >
              <h2 className="font-extrabold text-2xl sm:text-3xl lg:text-[32px] text-[#F5F2E6] tracking-tight">
                {siteContent.closingPanel.heading}
              </h2>
              <p className="text-sm text-[#F5F2E6]/75 mt-1.5 font-normal">
                {siteContent.closingPanel.subtitle}
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="relative flex items-center justify-between w-full">
                <div
                  style={{
                    transitionDelay: visibleSections['closing'] ? '250ms' : '0ms',
                  }}
                  className={`absolute left-4 right-4 top-2.5 border-t-2 border-dashed border-[#BCC7B9]/60 z-0 transition-opacity duration-1000 ${
                    visibleSections['closing'] ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {siteContent.closingPanel.campuses.map((cName, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveTourCampusIdx(idx);
                      setActiveTourSiteIdx(0);
                      setIsPlaying(false);
                      document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      transitionDelay: visibleSections['closing'] ? `${(idx + 1) * 160 + 220}ms` : '0ms',
                      transitionProperty: 'opacity, transform',
                    }}
                    className={`relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none will-change-transform transition-all duration-[900ms] ease-[cubic-bezier(0.25,1,0.5,1)] transform hover:-translate-y-1 ${
                      visibleSections['closing']
                        ? 'opacity-100 translate-y-0 scale-100'
                        : 'opacity-0 translate-y-3 scale-90'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-[#FBF1D2] flex items-center justify-center shrink-0 group-hover:scale-125 group-hover:ring-4 group-hover:ring-[#E8AE1F]/35 transition-all duration-300 shadow-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#E8AE1F]" />
                    </div>
                    <span className="font-semibold text-xs sm:text-[13px] text-[#F5F2E6] mt-2.5 text-center whitespace-nowrap group-hover:text-[#E8AE1F] transition-colors duration-200">
                      {cName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};