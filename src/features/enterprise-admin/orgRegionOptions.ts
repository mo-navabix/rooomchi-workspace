export const ORG_COUNTRY_OPTIONS: { value: string; label: string }[] = [
  { value: 'IR', label: 'ایران' },
  { value: 'AF', label: 'افغانستان' },
  { value: 'AE', label: 'امارات متحده عربی' },
  { value: 'TR', label: 'ترکیه' },
  { value: 'IQ', label: 'عراق' },
  { value: 'SA', label: 'عربستان سعودی' },
  { value: 'DE', label: 'آلمان' },
  { value: 'GB', label: 'بریتانیا' },
  { value: 'US', label: 'ایالات متحده' },
  { value: 'CA', label: 'کانادا' },
];

export const ORG_TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Asia/Tehran', label: 'تهران (UTC+3:30)' },
  { value: 'Asia/Dubai', label: 'دبی (UTC+4)' },
  { value: 'Asia/Kabul', label: 'کابل (UTC+4:30)' },
  { value: 'Asia/Baghdad', label: 'بغداد (UTC+3)' },
  { value: 'Asia/Riyadh', label: 'ریاض (UTC+3)' },
  { value: 'Europe/Istanbul', label: 'استانبول (UTC+3)' },
  { value: 'Europe/Berlin', label: 'برلین (UTC+1)' },
  { value: 'Europe/London', label: 'لندن (UTC+0)' },
  { value: 'America/New_York', label: 'نیویورک (UTC-5)' },
  { value: 'UTC', label: 'UTC' },
];

export function orgCountrySelectValue(stored: string | undefined): string {
  const v = stored?.trim() || 'IR';
  return ORG_COUNTRY_OPTIONS.some((o) => o.value === v) ? v : 'IR';
}

export function orgTimezoneSelectValue(stored: string | undefined): string {
  const v = stored?.trim() || 'Asia/Tehran';
  return ORG_TIMEZONE_OPTIONS.some((o) => o.value === v) ? v : 'Asia/Tehran';
}
