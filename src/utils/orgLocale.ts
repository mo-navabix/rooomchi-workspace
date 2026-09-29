import type { Organization, OrgCalendar, OrgLanguage } from '../types';
import {
  formatToJalali,
  formatToJalaliDescriptive,
  gregorianToJalali,
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEK_DAYS,
  toPersianDigits,
} from './jalali';

export type OrgLocalePreferences = {
  language: OrgLanguage;
  calendar: OrgCalendar;
};

export function getOrgLocalePreferences(org: Organization | null | undefined): OrgLocalePreferences {
  const s = org?.settings as Record<string, unknown> | undefined;
  const calendar: OrgCalendar = s?.dateFormat === 'gregorian' ? 'gregorian' : 'jalali';
  return { language: 'fa', calendar };
}

export function formatOrgDigits(
  value: number | string | null | undefined,
  language: OrgLanguage,
): string {
  if (value === null || value === undefined) return '';
  return language === 'fa' ? toPersianDigits(value) : String(value);
}

export function formatOrgDate(
  iso: string | null | undefined,
  prefs: OrgLocalePreferences,
): string {
  if (!iso) return '';
  if (prefs.calendar === 'jalali') {
    const j = formatToJalali(iso);
    return prefs.language === 'fa' ? toPersianDigits(j) : j;
  }
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  const display = prefs.language === 'en' ? `${m}/${d}/${y}` : `${y}/${m}/${d}`;
  return prefs.language === 'fa' ? toPersianDigits(display) : display;
}

export function formatOrgDateLong(
  iso: string | null | undefined,
  prefs: OrgLocalePreferences,
): string {
  if (!iso) return '';
  if (prefs.calendar === 'jalali') {
    return formatToJalaliDescriptive(iso);
  }
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const gy = parseInt(parts[0], 10);
  const gm = parseInt(parts[1], 10);
  const gd = parseInt(parts[2], 10);
  if (Number.isNaN(gy) || Number.isNaN(gm) || Number.isNaN(gd)) return iso;
  const d = new Date(gy, gm - 1, gd);
  if (prefs.language === 'en') {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  const weekFa = PERSIAN_WEEK_DAYS[(d.getDay() + 1) % 7]?.name || '';
  const monthFa = [
    'ژانویه',
    'فوریه',
    'مارس',
    'آوریل',
    'مه',
    'ژوئن',
    'ژوئیه',
    'اوت',
    'سپتامبر',
    'اکتبر',
    'نوامبر',
    'دسامبر',
  ][gm - 1];
  return `${weekFa} ${toPersianDigits(gd)} ${monthFa} ${toPersianDigits(gy)}`;
}

export type WeekDayLabel = { short: string; name: string };

export function getOrgWeekDays(prefs: OrgLocalePreferences): WeekDayLabel[] {
  if (prefs.calendar === 'jalali') {
    return PERSIAN_WEEK_DAYS.map((d) => ({ short: d.short, name: d.name }));
  }
  if (prefs.language === 'en') {
    return [
      { short: 'Su', name: 'Sunday' },
      { short: 'Mo', name: 'Monday' },
      { short: 'Tu', name: 'Tuesday' },
      { short: 'We', name: 'Wednesday' },
      { short: 'Th', name: 'Thursday' },
      { short: 'Fr', name: 'Friday' },
      { short: 'Sa', name: 'Saturday' },
    ];
  }
  return [
    { short: 'ش', name: 'شنبه' },
    { short: 'ی', name: 'یکشنبه' },
    { short: 'د', name: 'دوشنبه' },
    { short: 'س', name: 'سه‌شنبه' },
    { short: 'چ', name: 'چهارشنبه' },
    { short: 'پ', name: 'پنج‌شنبه' },
    { short: 'ج', name: 'جمعه' },
  ];
}

/** Week starts on Saturday for jalali / Persian UX; Sunday for English gregorian. */
export function weekStartsOnSaturday(prefs: OrgLocalePreferences): boolean {
  return prefs.calendar === 'jalali' || prefs.language === 'fa';
}

export function jalaliMonthYearLabel(
  iso: string,
  language: OrgLanguage,
): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const j = gregorianToJalali(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10),
    parseInt(parts[2], 10),
  );
  const month = PERSIAN_MONTH_NAMES[j.month - 1] || '';
  const label = `${month} ${j.year}`;
  return language === 'fa' ? toPersianDigits(label) : label;
}

export function gregorianMonthYearLabel(
  iso: string,
  language: OrgLanguage,
): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const d = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
  );
  const label = d.toLocaleDateString(language === 'en' ? 'en-US' : 'fa-IR', {
    month: 'long',
    year: 'numeric',
  });
  return language === 'fa' ? toPersianDigits(label) : label;
}
