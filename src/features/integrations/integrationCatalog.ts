export type IntegrationCatalogId = 'resend' | 'smtp' | 'sms' | 'telegram' | 'storage';

export type IntegrationCatalogItem = {
  id: IntegrationCatalogId;
  title: string;
  description: string;
  group: 'email' | 'messaging' | 'storage';
};

export const INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
  {
    id: 'resend',
    title: 'Resend',
    description: 'ارسال ایمیل (OTP ثبت‌نام، بازنشانی رمز، اعلان‌ها)',
    group: 'email',
  },
  {
    id: 'smtp',
    title: 'SMTP / Gmail',
    description: 'پشتیبان ارسال ایمیل از سرور SMTP سازمانی',
    group: 'email',
  },
  {
    id: 'sms',
    title: 'درگاه پیامک (SMS)',
    description: 'کاوه‌نگار، مگفا، فرازاس‌ام‌اس و سایر سرویس‌دهندگان',
    group: 'messaging',
  },
  {
    id: 'telegram',
    title: 'Telegram',
    description: 'ربات و کانال تلگرام برای اعلان‌های رزرو',
    group: 'messaging',
  },
  {
    id: 'storage',
    title: 'ذخیره‌سازی فایل',
    description: 'مسیر محلی یا S3/MinIO (آینده)',
    group: 'storage',
  },
];
