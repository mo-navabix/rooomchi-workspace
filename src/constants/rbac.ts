import { Permission, UserRole } from '../types';

export interface RoleMeta {
  role: UserRole;
  titleFa: string;
  titleEn: string;
  badgeClass: string;
  bgLight: string;
  description: string;
  permissions: Permission[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleMeta> = {
  super_admin: {
    role: 'super_admin',
    titleFa: 'مدیر کل پلتفرم روم‌چی',
    titleEn: 'Super Admin',
    badgeClass: 'bg-[rgb(var(--brand-primary-rgb)/0.12)] text-brand border-brand-soft',
    bgLight: 'bg-brand-soft',
    description: 'دسترسی کامل به تمام سازمان‌ها، پیکربندی سیستم، ممیزی و نظارت بر کل پلتفرم روم‌چی',
    permissions: [
      'MANAGE_ORGANIZATIONS',
      'MANAGE_ROOMS',
      'APPROVE_BOOKINGS',
      'CANCEL_ANY_BOOKING',
      'BOOK_ROOM',
      'MANAGE_USERS_ROLES',
      'VIEW_ANALYTICS',
      'MANAGE_CATERING',
      'MANAGE_ORG_SETTINGS',
      'MANAGE_TEAMS',
      'MANAGE_AUTHENTICATION_SETTINGS',
      'MANAGE_INTEGRATIONS',
      'MANAGE_SYSTEM_SETTINGS',
    ],
  },
  org_admin: {
    role: 'org_admin',
    titleFa: 'مدیر ارشد سازمان',
    titleEn: 'Organization Admin',
    badgeClass: 'bg-[rgb(var(--brand-primary-rgb)/0.12)] text-brand border-brand-soft',
    bgLight: 'bg-brand-soft',
    description: 'مدیریت تمام اتاق‌ها، پرسنل، تأیید درخواست‌های رزرو، ساعات کاری و قوانین سازمانی',
    permissions: [
      'MANAGE_ROOMS',
      'APPROVE_BOOKINGS',
      'CANCEL_ANY_BOOKING',
      'BOOK_ROOM',
      'MANAGE_USERS_ROLES',
      'VIEW_ANALYTICS',
      'MANAGE_CATERING',
      'MANAGE_ORG_SETTINGS',
      'MANAGE_TEAMS',
      'MANAGE_AUTHENTICATION_SETTINGS',
      'MANAGE_INTEGRATIONS',
      'MANAGE_SYSTEM_SETTINGS',
    ],
  },
  room_manager: {
    role: 'room_manager',
    titleFa: 'مدیر تشریفات و اتاق‌ها',
    titleEn: 'Room & Facility Manager',
    badgeClass: 'bg-[rgb(var(--brand-primary-rgb)/0.12)] text-brand border-brand-soft',
    bgLight: 'bg-brand-soft',
    description: 'مدیریت تجهیزات فیزیکی اتاق‌ها، تعیین وضعیت تعمیرات، بررسی تشریفات و پذیرایی جلسات',
    permissions: [
      'MANAGE_ROOMS',
      'APPROVE_BOOKINGS',
      'BOOK_ROOM',
      'MANAGE_CATERING',
      'VIEW_ANALYTICS',
      'MANAGE_TEAMS',
    ],
  },
  employee: {
    role: 'employee',
    titleFa: 'کارمند سازمان (کاربر عادی)',
    titleEn: 'Employee',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    bgLight: 'bg-slate-50',
    description: 'مشاهده اتاق‌های آزاد، ثبت رزرو جلسات کاری، دعوت از همکاران و مدیریت جلسات شخصی خود',
    permissions: ['BOOK_ROOM'],
  },
  supervisor: {
    role: 'supervisor',
    titleFa: 'سرپرست',
    titleEn: 'Supervisor',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    bgLight: 'bg-sky-50/80',
    description:
      'همان دسترسی کارمند، به‌علاوهٔ ایجاد و مدیریت تیم‌ها برای رزرو گروهی جلسات',
    permissions: ['BOOK_ROOM', 'MANAGE_TEAMS'],
  },
};

export interface PermissionMeta {
  key: Permission;
  titleFa: string;
  description: string;
  category: 'سازمان' | 'اتاق‌ها' | 'رزرواسیون' | 'کاربران و امنیت';
}

export const PERMISSION_LIST: PermissionMeta[] = [
  {
    key: 'MANAGE_ORGANIZATIONS',
    titleFa: 'مدیریت کل سازمان‌ها',
    description: 'افزودن، ویرایش و راه‌اندازی اشتراک برای سازمان‌های مختلف در روم‌چی',
    category: 'سازمان',
  },
  {
    key: 'MANAGE_ROOMS',
    titleFa: 'مدیریت اتاق‌های جلسات',
    description: 'تعریف اتاق جدید، تغییر ظرفیت و تجهیزات، و فعال‌سازی حالت تعمیرات',
    category: 'اتاق‌ها',
  },
  {
    key: 'APPROVE_BOOKINGS',
    titleFa: 'بررسی و تأیید رزروها',
    description: 'تأیید یا رد جلسات مهم (مانند سالن هیئت مدیره) نیازمند تأیید مدیریت',
    category: 'رزرواسیون',
  },
  {
    key: 'CANCEL_ANY_BOOKING',
    titleFa: 'لغو اضطراری جلسات',
    description: 'لغو یا آزادسازی هرگونه جلسه ثبت‌شده توسط پرسنل دیگر در سازمان',
    category: 'رزرواسیون',
  },
  {
    key: 'BOOK_ROOM',
    titleFa: 'ثبت رزرو جلسه',
    description: 'رزرو اتاق جلسات آزاد، تعیین دستور جلسه و ارسال دعوت‌نامه',
    category: 'رزرواسیون',
  },
  {
    key: 'MANAGE_USERS_ROLES',
    titleFa: 'مدیریت کاربران و نقش‌های RBAC',
    description: 'تخصیص نقش‌ها، تغییر دسترسی‌ها و غیرفعال‌سازی حساب‌های کاربری',
    category: 'کاربران و امنیت',
  },
  {
    key: 'VIEW_ANALYTICS',
    titleFa: 'مشاهده داشبورد تحلیلی',
    description: 'دسترسی به گزارشات نرخ اشغال، ساعات اوج ترافیک و آمار جلسات',
    category: 'سازمان',
  },
  {
    key: 'MANAGE_CATERING',
    titleFa: 'مدیریت تشریفات و پذیرایی',
    description: 'پیگیری و تایید درخواست‌های پذیرایی، قهوه و چیدمان سالن جلسات',
    category: 'اتاق‌ها',
  },
  {
    key: 'MANAGE_ORG_SETTINGS',
    titleFa: 'پیکربندی تنظیمات سازمان',
    description: 'تنظیم برند، رنگ، ساعات کاری مجاز و سیاست‌های تأیید خودکار',
    category: 'سازمان',
  },
  {
    key: 'MANAGE_TEAMS',
    titleFa: 'مدیریت تیم‌ها و گروه‌ها',
    description: 'ایجاد، ویرایش، حذف تیم‌ها و تعریف لیست اعضای ثابت برای تسریع رزرو جلسات',
    category: 'کاربران و امنیت',
  },
  {
    key: 'MANAGE_AUTHENTICATION_SETTINGS',
    titleFa: 'مدیریت احراز هویت سازمان',
    description: 'فعال‌سازی Local، LDAP و Google OAuth و سیاست رمز عبور',
    category: 'کاربران و امنیت',
  },
  {
    key: 'MANAGE_INTEGRATIONS',
    titleFa: 'مدیریت یکپارچه‌سازی‌ها',
    description: 'پیکربندی SMTP، ذخیره‌سازی فایل و سرویس‌های خارجی',
    category: 'سازمان',
  },
  {
    key: 'MANAGE_SYSTEM_SETTINGS',
    titleFa: 'تنظیمات سامانه',
    description: 'URL اپلیکیشن، نگهداری، محدودیت نشست و آپلود',
    category: 'سازمان',
  },
];

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  const meta = ROLE_DEFINITIONS[normalizeUserRole(role)];
  if (!meta) return false;
  return meta.permissions.includes(permission);
};

/** Maps API / JWT role strings to client UserRole keys. */
export function normalizeUserRole(role: string | undefined | null): UserRole {
  const raw = String(role ?? '').trim();
  if (!raw) return 'employee';

  const upper = raw.toUpperCase().replace(/-/g, '_');
  const apiMap: Record<string, UserRole> = {
    SUPER_ADMIN: 'super_admin',
    ORGANIZATION_ADMIN: 'org_admin',
    ORG_ADMIN: 'org_admin',
    MANAGER: 'room_manager',
    ROOM_MANAGER: 'room_manager',
    SUPERVISOR: 'supervisor',
    EMPLOYEE: 'employee',
  };
  if (apiMap[upper]) return apiMap[upper];

  const lower = raw.toLowerCase() as UserRole;
  if (ROLE_DEFINITIONS[lower]) return lower;

  return 'employee';
}

/** Maps DB/API status strings to client `active` | `suspended`. */
export function normalizeUserStatus(status: string | undefined | null): 'active' | 'suspended' {
  const s = String(status ?? '').trim().toUpperCase();
  if (s === 'SUSPENDED' || s === 'INACTIVE') return 'suspended';
  return 'active';
}

export function getRoleMeta(role: string | undefined | null): RoleMeta {
  return ROLE_DEFINITIONS[normalizeUserRole(role)];
}
