/** Didar brand — visual identity tokens */

export const BRAND_COLORS = {
  primary: '#0F786E',
  primaryHover: '#0D6B63',
  primaryLight: '#10B981',
  primaryLighter: '#34D399',
  primaryUltraLight: '#D1FAE5',
  secondary: '#10B981',
  navy: '#0F172A',
  slate: '#334155',
  gray: '#64748B',
  muted: '#94A3B8',
  border: '#E2E8F0',
  surface: '#FFFFFF',
  surfaceCard: '#F8FAF9',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#0F172A',
  textBody: '#334155',
} as const;

export const DIDAR_LOGO_ALT = 'اتاق — سامانه رزرو اتاق جلسات دیدار';

/** لوگوی تم روشن: متن تیره — برای پس‌زمینه روشن */
export const DIDAR_LOGO_SRC_LIGHT = '/assets/logo/didar-logo-light.png';

/** لوگوی تم تاریک: متن روشن — برای پس‌زمینه تیره */
export const DIDAR_LOGO_SRC_DARK = '/assets/logo/didar-logo-dark.png';

/** @deprecated Use resolveLogoSrc(theme) */
export const DIDAR_LOGO_SRC = DIDAR_LOGO_SRC_LIGHT;

export const DIDAR_LOGO_SVG = '/assets/logo/didar-logo.svg';
export const DIDAR_LOGO_MARK_SVG = '/assets/logo/didar-mark.svg';

export type BrandThemeMode = 'light' | 'dark';

export function resolveLogoSrc(theme: BrandThemeMode): string {
  return theme === 'dark' ? DIDAR_LOGO_SRC_DARK : DIDAR_LOGO_SRC_LIGHT;
}
