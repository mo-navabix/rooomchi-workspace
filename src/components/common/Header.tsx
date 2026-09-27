import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { getRoleMeta } from "../../constants/rbac";
import {
  Sparkles,
  LogIn,
  Menu,
  LogOut,
  Sun,
  Moon,
  Bell,
  User,
  UserCheck,
  Calendar,
  CheckCheck,
  X,
  ChevronDown,
} from "lucide-react";
import { ActiveTab } from "../../types";
import { UserAvatar } from "./UserAvatar";
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
    userRole,
    activeTab,
    setActiveTab,
    openCompleteProfileModal,
    isRegistrationComplete,
    currentUser,
    isAuthenticated,
    openAuthModal,
    logout,
    theme,
    toggleTheme,
    setViewMode,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
  } = useApp();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const page = getPageMeta(activeTab);
  const currentRoleMeta = getRoleMeta(userRole);
  const isDark = theme === "dark";

  return (
    <header
      className="sticky top-0 z-40 w-full bg-white dark:bg-[#0f172a] border-b border-slate-200/80 dark:border-white/[0.06]"
    >
      <div className="flex w-full items-center justify-between gap-4 h-[4.25rem] sm:h-[4.5rem] px-4 sm:px-5 lg:px-6">
        {/* راست هدر (RTL): خط سبز + عنوان */}
        <div className="flex min-w-0 flex-1 items-center justify-start gap-3">
          <div
            className="w-1 self-stretch min-h-[2.75rem] rounded-full bg-[#0F786E] shrink-0"
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

        {/* چپ هدر (RTL): تم | اعلان | پروفایل */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            id="btn-theme-toggle"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:text-[#0F786E] dark:hover:text-amber-300 hover:bg-slate-100/80 dark:hover:bg-white/5 cursor-pointer transition-colors"
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
                      <Bell className="w-4 h-4 text-[#0F786E]" />
                      اعلان‌ها
                    </h4>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsAsRead}
                          className="text-[11px] text-[#0F786E] font-medium cursor-pointer flex items-center gap-1"
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
                            !n.isRead ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[#0F786E] shrink-0">
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

          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                type="button"
                id="btn-user-profile-menu"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-0.5 rounded-full hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                aria-expanded={isUserDropdownOpen}
              >
                <UserAvatar
                  user={currentUser}
                  size="sm"
                  shape="rounded"
                  className="w-9 h-9 sm:w-10 sm:h-10 !rounded-xl"
                />
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" strokeWidth={2} />
              </button>

              {isUserDropdownOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setIsUserDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-64 dark-surface-card rounded-2xl shadow-xl py-2 z-30 border border-slate-200 dark:border-white/10">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex gap-3">
                      <UserAvatar user={currentUser} size="md" shape="circle" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-500 truncate" dir="ltr">{currentUser.email}</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${currentRoleMeta.badgeClass}`}>
                          {currentRoleMeta.titleFa}
                        </span>
                      </div>
                    </div>
                    <div className="p-1.5">
                      {!isRegistrationComplete() && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            openCompleteProfileModal();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-700 rounded-lg bg-amber-50 dark:bg-amber-950/30 cursor-pointer mb-1"
                        >
                          <UserCheck className="w-4 h-4" />
                          تکمیل مشخصات
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setActiveTab("profile");
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        پروفایل من
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setViewMode("landing");
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#0F786E] rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        صفحه معرفی
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        خروج
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="flex items-center gap-1.5 h-10 px-4 rounded-full text-xs font-bold text-white bg-[#0F786E] hover:bg-[#0D6B63] cursor-pointer"
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
