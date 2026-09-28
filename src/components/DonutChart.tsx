import React from 'react';

interface DonutChartProps {
  percent: number;
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ percent, size = 110 }) => {
  const strokeWidth = 10;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Not Complied / Remainder Arc: Gold */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#E8AE1F"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="butt"
        />

        {/* Complied Arc: Forest */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#1E4D2B"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="butt"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center Percentage */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-extrabold text-2xl text-[#15221A] tracking-tight">
          {percent}%
        </span>
      </div>
    </div>
  );
};
