import React from 'react';

interface TopographicContoursProps {
  className?: string;
  opacity?: number;
}

export const TopographicContours: React.FC<TopographicContoursProps> = ({ className = '', opacity = 0.07 }) => {
  return (
    <svg
      className={`pointer-events-none select-none ${className}`}
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
      aria-hidden="true"
    >
      <path
        d="M 400 120 C 520 110, 650 160, 690 260 C 730 360, 680 470, 560 520 C 440 570, 310 540, 230 470 C 150 400, 140 280, 200 200 C 260 120, 330 125, 400 120 Z"
        stroke="#F5F2E6"
        strokeWidth="1.2"
        strokeDasharray="4 2"
      />
      <path
        d="M 410 160 C 500 155, 600 190, 630 270 C 660 350, 620 440, 520 480 C 420 520, 320 490, 260 430 C 200 370, 190 280, 240 220 C 290 160, 350 165, 410 160 Z"
        stroke="#F5F2E6"
        strokeWidth="1.2"
      />
      <path
        d="M 420 200 C 485 195, 560 220, 580 285 C 600 350, 560 415, 480 445 C 400 475, 330 450, 290 400 C 250 350, 240 280, 280 235 C 320 190, 375 205, 420 200 Z"
        stroke="#F5F2E6"
        strokeWidth="1"
      />
      <path
        d="M 430 240 C 475 235, 520 255, 535 300 C 550 345, 520 390, 460 410 C 400 430, 350 410, 320 375 C 290 340, 285 290, 315 255 C 345 220, 395 242, 430 240 Z"
        stroke="#F5F2E6"
        strokeWidth="1.2"
      />
      <path
        d="M 440 280 C 470 275, 495 290, 500 318 C 505 346, 485 370, 445 380 C 405 390, 375 375, 355 352 C 335 329, 335 298, 355 278 C 375 258, 415 282, 440 280 Z"
        stroke="#F5F2E6"
        strokeWidth="1"
        strokeDasharray="6 3"
      />
      <path
        d="M 445 315 C 460 312, 475 320, 478 333 C 481 346, 470 358, 450 362 C 430 366, 412 358, 402 346 C 392 334, 395 320, 405 312 C 415 304, 435 316, 445 315 Z"
        stroke="#F5F2E6"
        strokeWidth="1"
      />
    </svg>
  );
};
