/** Rooomchi brand — visual identity tokens */

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

export const ROOOMCHI_LOGO_ALT = 'Rooomchi روم‌چی — سامانه هوشمند رزرو اتاق جلسات';

/** لوگوی تم روشن: متن تیره — برای پس‌زمینه روشن */
export const ROOOMCHI_LOGO_SRC_LIGHT = '/assets/logo/rooomchi-logo-light.svg';

/** لوگوی تم تاریک: متن روشن — برای پس‌زمینه تیره */
export const ROOOMCHI_LOGO_SRC_DARK = '/assets/logo/rooomchi-logo-dark.svg';

/** @deprecated Use resolveLogoSrc(theme) */
export const ROOOMCHI_LOGO_SRC = ROOOMCHI_LOGO_SRC_LIGHT;

export const ROOOMCHI_LOGO_SVG = '/assets/logo/rooomchi-logo-light.svg';
export const ROOOMCHI_LOGO_MARK_SVG = '/assets/logo/rooomchi-logo-light.svg';

export type BrandThemeMode = 'light' | 'dark';

export function resolveLogoSrc(theme: BrandThemeMode): string {
  return theme === 'dark' ? ROOOMCHI_LOGO_SRC_DARK : ROOOMCHI_LOGO_SRC_LIGHT;
}

export function resolveLogoMarkSrc(theme: BrandThemeMode): string {
  return theme === 'dark'
    ? '/assets/logo/rooomchi-mark-dark.svg'
    : '/assets/logo/rooomchi-mark-light.svg';
}

