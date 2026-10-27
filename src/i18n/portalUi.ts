import type { ActiveTab } from '../types';
import type { OrgLanguage } from '../types';

type PageMeta = { title: string; subtitle: string };

const FA: Partial<Record<ActiveTab, PageMeta>> = {
  dashboard: { title: 'داشبورد', subtitle: 'نمایی از وضعیت جلسات و فعالیت‌های شما' },
  calendar: { title: 'تقویم جلسات', subtitle: 'برنامه زمانی اتاق‌ها و جلسات' },
  rooms: { title: 'اتاق‌ها', subtitle: 'جستجو و رزرو سالن‌های جلسه' },
  'my-bookings': { title: 'جلسات من', subtitle: 'رزروها و جلسات شما' },
  teams: { title: 'تیم‌ها', subtitle: 'مدیریت تیم‌ها و اعضا' },
  notifications: { title: 'اعلان‌ها', subtitle: 'پیام‌های درون‌برنامه‌ای شما' },
  analytics: { title: 'گزارش‌ها و آمار', subtitle: 'تحلیل بهره‌وری و استفاده از فضا' },
  profile: { title: 'پروفایل من', subtitle: 'اطلاعات شخصی و حساب کاربری' },
  'support-ticket': { title: 'پشتیبانی', subtitle: 'ثبت درخواست؛ پاسخ تیم در ساعات اداری' },
  'admin-rooms': {
    title: 'فهرست اتاق‌ها و سالن‌ها',
    subtitle: 'افزودن، ویرایش و وضعیت اتاق‌های قابل رزرو',
  },
  'admin-rooms-campus': {
    title: 'ساختمان‌ها و طبقات',
    subtitle: 'تعریف ساختمان و شماره طبقات برای فرم اتاق',
  },
  'admin-rooms-amenities': {
    title: 'امکانات و تجهیزات',
    subtitle: 'فهرست امکانات قابل انتخاب برای هر اتاق',
  },
  'admin-bookings': {
    title: 'نظارت بر رزروها',
    subtitle: 'تأیید، لغو و پیگیری رزروهای سازمان',
  },
  'admin-rbac': {
    title: 'کاربران و سطوح دسترسی',
    subtitle: 'مدیریت نقش‌ها و دسترسی پرسنل',
  },
  'admin-notifications': {
    title: 'مدیریت اعلان‌ها',
    subtitle: 'SMS، تلگرام و اعلان درون‌برنامه‌ای',
  },
  'admin-support-tickets': {
    title: 'تیکت‌های سازمانی',
    subtitle: 'پاسخ به درخواست‌های پشتیبانی پرسنل',
  },
  'admin-settings-org': {
    title: 'تنظیمات سازمان',
    subtitle: 'لوگو، رنگ تم و تقویم سازمان',
  },
  'admin-settings-auth': {
    title: 'احراز هویت',
    subtitle: 'ورود محلی، LDAP و Google OAuth',
  },
  'admin-settings-integrations': {
    title: 'یکپارچه‌سازی‌ها',
    subtitle: 'Resend، SMTP (Gmail) و ذخیره‌سازی فایل',
  },
  'admin-settings-system': {
    title: 'تنظیمات سامانه',
    subtitle: 'URL، نشست، آپلود و نگهداری',
  },
  'admin-settings-audit': {
    title: 'ممیزی تنظیمات',
    subtitle: 'تاریخچه تغییرات پیکربندی',
  },
};

const EN: Partial<Record<ActiveTab, PageMeta>> = {
  dashboard: { title: 'Dashboard', subtitle: 'Your meetings and activity at a glance' },
  calendar: { title: 'Meeting calendar', subtitle: 'Room schedules and bookings' },
  rooms: { title: 'Rooms', subtitle: 'Find and book meeting spaces' },
  'my-bookings': { title: 'My meetings', subtitle: 'Your bookings and sessions' },
  teams: { title: 'Teams', subtitle: 'Teams and members' },
  analytics: { title: 'Analytics', subtitle: 'Usage and productivity insights' },
  profile: { title: 'My profile', subtitle: 'Account and personal details' },
  'support-ticket': { title: 'Support', subtitle: 'Submit and track support requests' },
};

export function getPortalPageMeta(
  tab: ActiveTab,
  language: OrgLanguage,
): PageMeta {
  const map = language === 'en' ? EN : FA;
  return (
    map[tab] ?? {
      title: language === 'en' ? 'Rooomchi' : 'روم‌چی',
      subtitle:
        language === 'en' ? 'Enterprise meeting room booking' : 'سامانه رزرو اتاق جلسات',
    }
  );
}

const STRINGS: Record<string, { fa: string; en: string }> = {
  today: { fa: 'امروز', en: 'Today' },
  selectDay: { fa: 'انتخاب روز', en: 'Select day' },
  pickDate: { fa: 'انتخاب تاریخ', en: 'Pick a date' },
  jalaliCalendar: { fa: 'تقویم شمسی', en: 'Jalali calendar' },
  gregorianCalendar: { fa: 'تقویم میلادی', en: 'Gregorian calendar' },
};

export function tPortal(language: OrgLanguage, key: string): string {
  const row = STRINGS[key];
  if (!row) return key;
  return language === 'en' ? row.en : row.fa;
}
