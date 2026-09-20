import React from 'react';

export interface DidarBrandMarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

/**
 * Didar Brand Mark matching the exact aesthetic from the uploaded UI design:
 * Dark blue semicircle (left) + Violet/Purple full circle (right) + Bold "دیدار" typography.
 */
export const DidarBrandMark: React.FC<DidarBrandMarkProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const sizeMap = {
    sm: {
      svg: 'w-6 h-6',
      text: 'text-base font-black',
    },
    md: {
      svg: 'w-7 h-7 sm:w-8 sm:h-8',
      text: 'text-lg sm:text-xl font-black tracking-tight',
    },
    lg: {
      svg: 'w-9 h-9 sm:w-10 sm:h-10',
      text: 'text-2xl font-black tracking-tight',
    },
    xl: {
      svg: 'w-12 h-12 sm:w-14 sm:h-14',
      text: 'text-3xl font-black tracking-tight',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2 select-none ${className}`} id="didar-brand-mark">
      {/* Visual Logo Mark: Semicircle + Circle */}
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${currentSize.svg} shrink-0`}
      >
        {/* Navy/Deep Blue Left Semi-circle / Moon Crescent */}
        <path
          d="M17 5C10.3726 5 5 10.3726 5 17C5 23.6274 10.3726 29 17 29V5Z"
          fill="#1E293B"
          className="dark:fill-slate-100"
        />
        {/* Purple / Royal Violet Right Circle */}
        <circle
          cx="24"
          cy="17"
          r="7"
          fill="#4F46E5"
        />
      </svg>

      {/* Typography: دیدار */}
      {showText && (
        <span className={`${currentSize.text} text-slate-900 dark:text-white font-black`}>
          دیدار
        </span>
      )}
    </div>
  );
};
