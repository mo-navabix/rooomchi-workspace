import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ROOOMCHI_LOGO_ALT,
  resolveLogoSrc,
  resolveLogoMarkSrc,
  type BrandThemeMode,
} from '../../constants/brand';

export type LogoVariant = 'horizontal' | 'stacked' | 'mark';
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
export type LogoTheme = 'light' | 'dark' | 'auto';

export interface LogoProps {
  className?: string;
  size?: LogoSize;
  variant?: LogoVariant;
  showTagline?: boolean;
  /** @deprecated Use `variant="mark"` instead. */
  showText?: boolean;
  theme?: LogoTheme;
  id?: string;
}

const compactHeight: Record<LogoSize, string> = {
  sm: 'h-8 sm:h-9',
  md: 'h-9 sm:h-10',
  lg: 'h-11 sm:h-12',
  xl: 'h-12 sm:h-14',
};

const stackedHeight: Record<LogoSize, string> = {
  sm: 'h-10 sm:h-11',
  md: 'h-11 sm:h-12',
  lg: 'h-12 sm:h-14',
  xl: 'h-14 sm:h-16',
};

const markFrame: Record<LogoSize, string> = {
  sm: 'h-8 w-[2.35rem]',
  md: 'h-9 w-[2.65rem]',
  lg: 'h-11 w-[3.25rem]',
  xl: 'h-12 w-[3.5rem]',
};

function useResolvedTheme(logoTheme: LogoTheme): BrandThemeMode {
  const { theme: appTheme } = useApp();
  if (logoTheme === 'auto') return appTheme;
  return logoTheme;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  variant = 'horizontal',
  showText = true,
  theme: logoTheme = 'auto',
  id = 'rooomchi-logo',
}) => {
  const resolvedVariant =
    variant === 'horizontal' && showText === false ? 'mark' : variant;

  const mode = useResolvedTheme(logoTheme);
  const src = resolveLogoSrc(mode);

  if (resolvedVariant === 'mark') {
    const markSrc = resolveLogoMarkSrc(mode);
    return (
      <div
        id={id}
        className={`inline-flex shrink-0 overflow-hidden rounded-md select-none ${markFrame[size]} ${className}`}
        role="img"
        aria-label={ROOOMCHI_LOGO_ALT}
      >
        <img
          src={markSrc}
          alt=""
          draggable={false}
          className="h-full w-auto max-w-none object-contain"
        />
      </div>
    );
  }

  const heightClass =
    resolvedVariant === 'stacked' ? stackedHeight[size] : compactHeight[size];

  return (
    <img
      id={id}
      src={src}
      alt={ROOOMCHI_LOGO_ALT}
      draggable={false}
      className={`w-auto max-w-[min(100%,200px)] ${heightClass} object-contain object-right select-none ${className}`}
    />
  );
};
