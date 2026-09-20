import React from 'react';
import { Logo, type LogoSize } from './Logo';

export interface DidarLogoProps {
  className?: string;
  size?: LogoSize;
  showText?: boolean;
  textSubtitle?: string;
  hideSubtitleOnMobile?: boolean;
  isDark?: boolean;
}

export const DidarLogo: React.FC<DidarLogoProps> = ({ className = '', size = 'md' }) => {
  return (
    <div className={`flex justify-center ${className}`} id="didar-brand-logo">
      <Logo variant="stacked" size={size} />
    </div>
  );
};
