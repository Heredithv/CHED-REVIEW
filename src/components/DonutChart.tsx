import React from 'react';

interface DonutChartProps {
  percent: number;
  complied?: number;
  notComplied?: number;
  pending?: number;
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  percent,
  complied = 0,
  notComplied = 0,
  pending = 0,
  size = 110
}) => {
  const strokeWidth = 10;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  const total = complied + notComplied + pending;
  const compliedRatio = total > 0 ? complied / total : percent / 100;
  const notCompliedRatio = total > 0 ? notComplied / total : Math.max(0, 1 - compliedRatio);

  const compliedLength = compliedRatio * circumference;
  const notCompliedLength = notCompliedRatio * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Base Track (Pending / No Data): Soft Slate */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#DCE3D9"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Not Complied Segment: Gold */}
        {notCompliedLength > 0 && (
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#E8AE1F"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${notCompliedLength} ${circumference}`}
            strokeDashoffset={-compliedLength}
            strokeLinecap="butt"
            className="transition-all duration-700 ease-out"
          />
        )}

        {/* Complied Segment: Forest Green */}
        {compliedLength > 0 && (
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#1E4D2B"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${compliedLength} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="butt"
            className="transition-all duration-700 ease-out"
          />
        )}
      </svg>

      {/* Center Percentage */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-extrabold text-2xl text-[#15221A] tracking-tight tabular-nums">
          {percent}%
        </span>
      </div>
    </div>
  );
};
