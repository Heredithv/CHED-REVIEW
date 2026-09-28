import React from 'react';
import { siteContent } from '../data/siteContent';

export const RoadIllustration: React.FC = () => {
  // Approximate points along the S-curve
  const stops = [
    { num: 1, cx: 105, cy: 505, href: '' },
    { num: 2, cx: 180, cy: 462, href: '' },
    { num: 3, cx: 255, cy: 422, href: '#form3' },
    { num: 4, cx: 330, cy: 390, href: '#form4' },
    { num: 5, cx: 410, cy: 362, href: '' },
    { num: 6, cx: 480, cy: 320, href: '' },
    { num: 7, cx: 535, cy: 260, href: '' },
    { num: 8, cx: 572, cy: 185, href: '' },
  ];

  const roadD = "M 45 540 C 130 505, 230 445, 340 395 C 450 350, 530 310, 565 220 C 585 160, 600 110, 615 75";

  return (
    <div className="relative w-full max-w-[580px] mx-auto select-none">
      <svg
        viewBox="0 0 680 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto overflow-visible"
        aria-label="Road to University Status timeline from Today to University"
      >
        <defs>
          {/* Soft gold glow filter for the University node */}
          <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#FBF1D2" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* The wide, translucent, lighter-green rounded road stroke */}
        <path
          d={roadD}
          stroke="rgba(47, 125, 78, 0.45)"
          strokeWidth="46"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Thin dotted gold line running down the road center */}
        <path
          d={roadD}
          stroke="#E8AE1F"
          strokeWidth="2.5"
          strokeDasharray="4 6"
          strokeLinecap="round"
        />

        {/* "Today" label at bottom-left */}
        <g transform="translate(45, 575)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill="#F5F2E6"
            className="text-xs font-semibold tracking-wide"
            style={{ fontSize: '13px', fontFamily: 'var(--font-body, Poppins, sans-serif)' }}
          >
            {siteContent.hero.road.startLabel}
          </text>
        </g>

        {/* Eight numbered stops along the road */}
        {stops.map((stop) => {
          const content = (
            <g className={`transition-transform duration-200 ${stop.href ? 'cursor-pointer hover:scale-115' : ''}`}>
              {/* Outer dark-green ring around each */}
              <circle
                cx={stop.cx}
                cy={stop.cy}
                r="15"
                fill="#E8AE1F"
                stroke="#0E3322"
                strokeWidth="3.5"
              />
              {/* Dark bold number */}
              <text
                x={stop.cx}
                y={stop.cy + 4.5}
                textAnchor="middle"
                fill="#15221A"
                className="font-bold text-xs"
                style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-heading, Poppins, sans-serif)' }}
              >
                {stop.num}
              </text>
            </g>
          );

          if (stop.href) {
            return (
              <a key={stop.num} href={stop.href} title={`Open Form ${stop.num}`}>
                {content}
              </a>
            );
          }

          return <g key={stop.num}>{content}</g>;
        })}

        {/* End of Road: University circle */}
        <g transform="translate(615, 75)" className="cursor-default">
          {/* Soft gold halo */}
          <circle cx="0" cy="0" r="46" fill="#FBF1D2" fillOpacity="0.22" filter="url(#goldGlow)" />
          {/* Forest fill circle with thick Chalk ring */}
          <circle
            cx="0"
            cy="0"
            r="38"
            fill="#1E4D2B"
            stroke="#F5F2E6"
            strokeWidth="4"
          />
          {/* JH monogram in Chalk */}
          <text
            x="0"
            y="7"
            textAnchor="middle"
            fill="#F5F2E6"
            style={{
              fontSize: '20px',
              fontWeight: 800,
              fontFamily: 'var(--font-heading, Poppins, sans-serif)',
              letterSpacing: '-0.02em'
            }}
          >
            {siteContent.hero.road.endLogoText}
          </text>
          {/* "University" label below the circle */}
          <text
            x="0"
            y="56"
            textAnchor="middle"
            fill="#F5F2E6"
            style={{
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading, Poppins, sans-serif)',
              letterSpacing: '-0.01em'
            }}
          >
            {siteContent.hero.road.endLabel}
          </text>
        </g>
      </svg>
    </div>
  );
};
