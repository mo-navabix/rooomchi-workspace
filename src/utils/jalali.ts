/**
 * Jalali (Shamsi / Persian) Calendar Utility
 * Provides fast, standalone algorithms for Gregorian <-> Jalali conversion,
 * formatting, month day calculation, and leap year checks.
 */

export interface JalaliDate {
  year: number;
  month: number; // 1 to 12
  day: number; // 1 to 31
}

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const PERSIAN_WEEK_DAYS = [
  { short: 'ش', name: 'شنبه' },
  { short: 'ی', name: 'یکشنبه' },
  { short: 'د', name: 'دوشنبه' },
  { short: 'س', name: 'سه‌شنبه' },
  { short: 'چ', name: 'چهارشنبه' },
  { short: 'پ', name: 'پنج‌شنبه' },
  { short: 'ج', name: 'جمعه' },
];

/**
 * Check if Jalali year is leap (کبیسه)
 */
export function isJalaliLeapYear(jy: number): boolean {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  let jp = breaks[0];
  let jump = 0;
  if (jy < jp || jy >= breaks[breaks.length - 1]) return false;

  for (let i = 1; i < breaks.length; i++) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    jp = jm;
  }
  let n = jy - jp;
  if (jump - n < 6) n = n - jump + (Math.floor(jump / 33) * 33 + 4);
  let leap = ((n + 1) % 33) - 1;
  if (leap === -1) leap = 4;
  return leap % 4 === 0 && leap !== 0;
}

/**
 * Returns total days in a Jalali month
 */
export function getJalaliDaysInMonth(jy: number, jm: number): number {
  if (jm >= 1 && jm <= 6) return 31;
  if (jm >= 7 && jm <= 11) return 30;
  if (jm === 12) return isJalaliLeapYear(jy) ? 30 : 29;
  return 30;
}

/**
 * Convert Gregorian date (gy, gm, gd) to Jalali (jy, jm, jd)
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    (365 * gy) +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { year: jy, month: jm, day: jd };
}

/**
 * Convert Jalali date (jy, jm, jd) to Gregorian (gy, gm, gd)
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): { year: number; month: number; day: number } {
  let jy2 = jy - 979;
  let days =
    (365 * jy2) +
    (Math.floor(jy2 / 33) * 8) +
    Math.floor(((jy2 % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  let gy = 1600 + 400 * Math.floor(days / 146097);
  days %= 146097;
  let leap = true;
  if (days >= 36525) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days++;
    else leap = false;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days >= 366) {
    leap = false;
    days--;
    gy += Math.floor(days / 365);
    days %= 365;
  }
  const sal_a = [
    0,
    31,
    leap ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  while (gm < 12 && days >= sal_a[gm + 1]) {
    days -= sal_a[gm + 1];
    gm++;
  }
  return { year: gy, month: gm + 1, day: days + 1 };
}

/**
 * Format standard YYYY-MM-DD string to Jalali string YYYY/MM/DD
 */
export function formatToJalali(dateStr?: string | null): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const gy = parseInt(parts[0], 10);
  const gm = parseInt(parts[1], 10);
  const gd = parseInt(parts[2], 10);
  if (isNaN(gy) || isNaN(gm) || isNaN(gd)) return dateStr;

  const j = gregorianToJalali(gy, gm, gd);
  const mm = j.month < 10 ? `0${j.month}` : `${j.month}`;
  const dd = j.day < 10 ? `0${j.day}` : `${j.day}`;
  return `${j.year}/${mm}/${dd}`;
}

/**
 * Format standard YYYY-MM-DD to full descriptive Persian date (e.g. "پنج‌شنبه ۲۶ شهریور ۱۴۰۵")
 */
export function formatToJalaliDescriptive(dateStr?: string | null): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const gy = parseInt(parts[0], 10);
  const gm = parseInt(parts[1], 10);
  const gd = parseInt(parts[2], 10);
  if (isNaN(gy) || isNaN(gm) || isNaN(gd)) return dateStr;

  const d = new Date(gy, gm - 1, gd);
  const dayOfWeekIndex = (d.getDay() + 1) % 7; // 0 is Saturday in Persian week (Saturday=6 in JS getDay() is 6 -> (6+1)%7 = 0)
  const weekDayName = PERSIAN_WEEK_DAYS[dayOfWeekIndex]?.name || '';

  const j = gregorianToJalali(gy, gm, gd);
  const monthName = PERSIAN_MONTH_NAMES[j.month - 1] || '';

  return `${weekDayName} ${toPersianDigits(j.day)} ${monthName} ${toPersianDigits(j.year)}`;
}

/**
 * Convert Jalali (year, month, day) to standard ISO date string YYYY-MM-DD
 */
export function jalaliToIsoString(jy: number, jm: number, jd: number): string {
  const g = jalaliToGregorian(jy, jm, jd);
  const mm = g.month < 10 ? `0${g.month}` : `${g.month}`;
  const dd = g.day < 10 ? `0${g.day}` : `${g.day}`;
  return `${g.year}-${mm}-${dd}`;
}

/**
 * Get current Jalali date
 */
export function getCurrentJalaliDate(): JalaliDate {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Get weekday offset for the first day of a given Jalali month (0 = شنبه, 6 = جمعه)
 */
export function getJalaliMonthStartWeekday(jy: number, jm: number): number {
  const g = jalaliToGregorian(jy, jm, 1);
  const d = new Date(g.year, g.month - 1, g.day);
  return (d.getDay() + 1) % 7;
}

/**
 * Converts English digits in a string to Persian digits
 */
export function toPersianDigits(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return '';
  const str = String(n);
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => farsiDigits[+w]);
}

/**
 * Converts Persian and Arabic digits in a string to standard English digits
 */
export function toEnglishDigits(str: string | null | undefined): string {
  if (!str) return '';
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  let res = String(str);
  for (let i = 0; i < 10; i++) {
    res = res.replace(persianDigits[i], String(i)).replace(arabicDigits[i], String(i));
  }
  return res;
}
