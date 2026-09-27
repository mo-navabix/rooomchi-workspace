import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Sparkles,
  LogIn,
  Menu,
  Sun,
  Moon,
  Bell,
  Calendar,
  CheckCheck,
  X,
} from "lucide-react";
import { ActiveTab } from "../../types";
import { toPersianDigits } from "../../utils/jalali";

type HeaderProps = {
  onOpenSidebar: () => void;
};

const PAGE_META: Partial<
  Record<ActiveTab, { title: string; subtitle: string }>
> = {
  dashboard: {
    title: "داشبورد",
    subtitle: "نمایی از وضعیت جلسات و فعالیت‌های شما",
  },
  calendar: { title: "تقویم جلسات", subtitle: "برنامه زمانی اتاق‌ها و جلسات" },
  rooms: { title: "اتاق‌ها", subtitle: "جستجو و رزرو سالن‌های جلسه" },
  "my-bookings": { title: "جلسات من", subtitle: "رزروها و جلسات شما" },
  teams: { title: "تیم‌ها", subtitle: "مدیریت تیم‌ها و اعضا" },
  analytics: { title: "گزارش‌ها و آمار", subtitle: "تحلیل بهره‌وری و استفاده از فضا" },
  "admin-rooms": {
    title: "مدیریت اتاق‌ها",
    subtitle: "تعریف و ویرایش اتاق‌های سازمان",
  },
  "admin-bookings": {
    title: "نظارت رزروها",
    subtitle: "تأیید و پیگیری درخواست‌ها",
  },
  "admin-rbac": { title: "کاربران", subtitle: "نقش‌ها و دسترسی پرسنل" },
  "access-control": {
    title: "کنترل دسترسی‌ها",
    subtitle: "مدیریت مجوزها و روش‌های ورود",
  },
  "admin-settings": {
    title: "تنظیمات سازمان",
    subtitle: "پیکربندی سیاست‌ها و برندینگ",
  },
  "admin-notifications": {
    title: "مدیریت اعلان‌ها",
    subtitle: "پیکربندی SMS، تلگرام و اعلان داخلی",
  },
  "admin-support-tickets": {
    title: "تیکت‌های پشتیبانی",
    subtitle: "بررسی و پاسخ به درخواست‌های پرسنل",
  },
  profile: { title: "پروفایل من", subtitle: "اطلاعات شخصی و حساب کاربری" },
  "support-ticket": {
    title: "پشتیبانی",
    subtitle: "ثبت درخواست؛ پاسخ تیم در ساعات اداری",
  },
};

function getPageMeta(activeTab: ActiveTab): { title: string; subtitle: string } {
  return (
    PAGE_META[activeTab] ?? {
      title: "روم‌چی",
      subtitle: "سامانه رزرو اتاق جلسات",
    }
  );
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  const {
    activeTab,
    setActiveTab,
    isAuthenticated,
    openAuthModal,
    theme,
    toggleTheme,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
  } = useApp();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const page = getPageMeta(activeTab);
  const isDark = theme === "dark";

  return (
    <header
      className="sticky top-0 z-40 w-full bg-white dark:bg-[#0f172a] border-b border-slate-200/80 dark:border-white/[0.06]"
    >
      <div className="flex w-full items-center justify-between gap-4 h-[4.25rem] sm:h-[4.5rem] px-4 sm:px-5 lg:px-6">
        {/* راست هدر (RTL): خط سبز + عنوان */}
        <div className="flex min-w-0 flex-1 items-center justify-start gap-3">
          <div
            className="w-1 self-stretch min-h-[2.75rem] rounded-full bg-[var(--brand-primary)] shrink-0"
            aria-hidden
          />
          <div className="min-w-0 py-0.5 text-right">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate leading-tight">
              {page.title}
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {page.subtitle}
            </p>
          </div>
          <button
            type="button"
            id="btn-mobile-menu"
            onClick={onOpenSidebar}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer shrink-0 ms-1"
            aria-label="باز کردن منو"
          >
            <Menu className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* چپ هدر (RTL): تم | اعلان | ورود (مهمان) */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            id="btn-theme-toggle"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:text-[var(--brand-primary)] dark:hover:text-amber-300 hover:bg-slate-100/80 dark:hover:bg-white/5 cursor-pointer transition-colors"
            aria-label={isDark ? "تم روشن" : "تم تاریک"}
            title={isDark ? "تم روشن" : "تم تاریک"}
          >
            {isDark ? (
              <Sun className="w-5 h-5" strokeWidth={1.75} />
            ) : (
              <Moon className="w-5 h-5" strokeWidth={1.75} />
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              id="btn-header-notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
              title="اعلان‌ها"
              aria-expanded={isNotificationsOpen}
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <Bell className="w-5 h-5" strokeWidth={1.75} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {unreadNotificationsCount > 9
                    ? `${toPersianDigits(9)}+`
                    : toPersianDigits(unreadNotificationsCount)}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 bg-slate-950/30 sm:bg-transparent cursor-default"
                  onClick={() => setIsNotificationsOpen(false)}
                  aria-label="بستن اعلان‌ها"
                />
                <div className="fixed inset-x-3 top-[4.5rem] sm:absolute sm:inset-auto sm:left-0 sm:mt-2 w-auto sm:w-96 max-h-[80vh] dark-surface-card rounded-2xl shadow-xl z-50 border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[var(--brand-primary)]" />
                      اعلان‌ها
                    </h4>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsAsRead}
                          className="text-[11px] text-[var(--brand-primary)] font-medium cursor-pointer flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          خواندن همه
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="p-1 sm:hidden cursor-pointer"
                        aria-label="بستن"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-72 divide-y divide-slate-100 dark:divide-slate-700">
                    {notifications.length === 0 ? (
                      <p className="py-10 text-center text-xs text-slate-500">اعلانی نیست</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            if (n.type === "meeting_booked") {
                              setActiveTab("calendar");
                              setIsNotificationsOpen(false);
                            }
                          }}
                          className={`p-3 flex gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                            !n.isRead ? "bg-brand-soft/50 dark:bg-[rgb(var(--brand-primary-rgb)/0.1)]" : ""
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-[rgb(var(--brand-primary-rgb)/0.12)] dark:bg-[rgb(var(--brand-primary-rgb)/0.12)] flex items-center justify-center text-[var(--brand-primary)] shrink-0">
                            {n.type === "meeting_booked" ? (
                              <Calendar className="w-4 h-4" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-100 dark:border-slate-700 flex justify-between text-[11px]">
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllNotifications}
                        className="text-slate-500 hover:text-rose-600 cursor-pointer"
                      >
                        پاک کردن همه
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("calendar");
                        setIsNotificationsOpen(false);
                      }}
                      className="font-bold text-slate-600 dark:text-slate-300 cursor-pointer ms-auto"
                    >
                      تقویم
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="flex items-center gap-1.5 h-10 px-4 rounded-full text-xs font-bold text-white btn-brand cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              ورود
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
