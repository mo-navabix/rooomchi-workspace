import React from 'react';

export interface DidarLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textSubtitle?: string;
  hideSubtitleOnMobile?: boolean;
  isDark?: boolean;
}

export const DidarLogo: React.FC<DidarLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textSubtitle = 'سیستم رزرواسیون سازمانی',
  hideSubtitleOnMobile = true,
}) => {
  // Responsive sizes to ensure high visibility without clutter on mobile or desktop
  const sizeMap = {
    sm: {
      box: 'w-8 h-8 sm:w-9 sm:h-9',
      svg: 'w-4.5 h-4.5 sm:w-5 sm:h-5',
      title: 'text-sm sm:text-base font-black',
      sub: 'text-[10px]',
      badge: 'text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5',
    },
    md: {
      box: 'w-8.5 h-8.5 sm:w-12 sm:h-12',
      svg: 'w-5 h-5 sm:w-7 sm:h-7',
      title: 'text-base sm:text-xl font-black tracking-tight',
      sub: 'text-[10px] sm:text-xs font-semibold',
      badge: 'text-[8px] sm:text-[9px] px-1 sm:px-2 py-0.5',
    },
    lg: {
      box: 'w-10 h-10 sm:w-14 sm:h-14',
      svg: 'w-6 h-6 sm:w-9 sm:h-9',
      title: 'text-lg sm:text-2xl font-black tracking-tight',
      sub: 'text-xs sm:text-sm font-semibold',
      badge: 'text-[9px] sm:text-xs px-2 py-0.5 sm:py-1',
    },
    xl: {
      box: 'w-14 h-14 sm:w-20 sm:h-20',
      svg: 'w-8 h-8 sm:w-12 sm:h-12',
      title: 'text-2xl sm:text-4xl font-black tracking-tight',
      sub: 'text-sm font-bold',
      badge: 'text-xs px-3 py-1',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2 sm:gap-3 select-none ${className}`} id="didar-brand-logo">
      {/* Visual Logo Mark: Executive Meeting Hub Symbol */}
      <div
        className={`${currentSize.box} rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0D1B3A] via-[#111A2E] to-[#1E3360] flex items-center justify-center shadow-md border border-[#1E2E50]/60 relative overflow-hidden shrink-0 group transition-transform hover:scale-105`}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#2563EB]/40 rounded-full blur-xs" />
        <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-[#14B8A6]/30 rounded-full blur-xs" />

        {/* Vector SVG Emblem */}
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${currentSize.svg} relative z-10 drop-shadow-xs`}
        >
          {/* Outer Room / Gateway Architectural Frame */}
          <path
            d="M8 14C8 10.6863 10.6863 8 14 8H26C29.3137 8 32 10.6863 32 14V28C32 30.2091 30.2091 32 28 32H12C9.79086 32 8 30.2091 8 28V14Z"
            stroke="url(#didar-blue-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central Conference Oval Table */}
          <rect
            x="14"
            y="17"
            width="12"
            height="7"
            rx="3.5"
            fill="url(#didar-teal-grad)"
          />

          {/* Collaborative Nodes / Attendees surrounding meeting table */}
          <circle cx="20" cy="12" r="1.75" fill="#60A5FA" />
          <circle cx="20" cy="29" r="1.75" fill="#60A5FA" />
          <circle cx="11.5" cy="20.5" r="1.75" fill="#14B8A6" />
          <circle cx="28.5" cy="20.5" r="1.75" fill="#14B8A6" />

          {/* Gradients */}
          <defs>
            <linearGradient id="didar-blue-grad" x1="8" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="60%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="didar-teal-grad" x1="14" y1="17" x2="26" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2DD4BF" />
              <stop offset="100%" stopColor="#14B8A6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Typography Label */}
      {showText && (
        <div className="flex flex-col leading-tight text-right shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={`font-black tracking-tight text-slate-900 dark:text-white ${currentSize.title}`}>
              دیدار
            </span>
            <span className={`font-bold rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] border border-blue-200/50 dark:border-blue-900/50 leading-none ${currentSize.badge}`}>
              DIDAR
            </span>
          </div>
          {textSubtitle && (
            <span className={`text-slate-500 dark:text-slate-400 font-medium mt-0.5 ${currentSize.sub} ${hideSubtitleOnMobile ? 'hidden sm:block' : ''}`}>
              {textSubtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
