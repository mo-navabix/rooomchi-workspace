import React from 'react';
import { Logo, type LogoSize } from './Logo';

export interface RooomchiLogoProps {
  className?: string;
  size?: LogoSize;
  showText?: boolean;
  textSubtitle?: string;
  hideSubtitleOnMobile?: boolean;
  isDark?: boolean;
}

export const RooomchiLogo: React.FC<RooomchiLogoProps> = ({ className = '', size = 'md' }) => {
  return (
    <div className={`flex justify-center ${className}`} id="rooomchi-brand-logo">
      <Logo variant="stacked" size={size} />
    </div>
  );
};
