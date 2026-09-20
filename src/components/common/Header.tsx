import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { getRoleMeta } from "../../constants/rbac";
import { Logo } from "./Logo";
import {
  Plus,
  ChevronDown,
  Sparkles,
  LogIn,
  Menu,
  LogOut,
  UserPlus,
  Sun,
  Moon,
  Bell,
  Search,
  User,
} from "lucide-react";
import { ActiveTab } from "../../types";

type HeaderProps = {
  onOpenSidebar: () => void;
};

const PAGE_META: Partial<
  Record<ActiveTab, { title: string; subtitle: string }>
> = {
  dashboard: { title: "داشبورد", subtitle: "نمای کلی جلسات و وضعیت فضاها" },
  calendar: { title: "تقویم جلسات", subtitle: "برنامه زمانی اتاق‌ها و جلسات" },
  rooms: { title: "اتاق‌ها", subtitle: "جستجو و رزرو سالن‌های جلسه" },
  "my-bookings": { title: "جلسات من", subtitle: "رزروها و جلسات شما" },
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
  "admin-settings": {
    title: "تنظیمات سازمان",
    subtitle: "پیکربندی سیاست‌ها و برندینگ",
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

function getPageMeta(
  activeTab: ActiveTab,
  orgName?: string,
): { title: string; subtitle: string } {
  const fallback = {
    title: "دیدار",
    subtitle: "سامانه رزرو اتاق جلسات",
  };
  const base = PAGE_META[activeTab] ?? fallback;
  if (!orgName) return base;

  const orgSubtitles: Partial<Record<ActiveTab, string>> = {
    dashboard: `مروری بر وضعیت جلسات و فضای کاری ${orgName}`,
    calendar: `مشاهده تقویم هفتگی و وضعیت اشغال اتاق‌های ${orgName}`,
    analytics: `تحلیل هوشمند استفاده از اتاق‌های ${orgName}`,
    "my-bookings": `مدیریت و پیگیری جلسات ثبت‌شده در ${orgName}`,
  };

  const subtitle = orgSubtitles[activeTab];
  return subtitle ? { ...base, subtitle } : base;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  const {
    userRole,
    activeTab,
    setActiveTab,
    openBookingModal,
    currentUser,
    currentOrg,
    isAuthenticated,
    openAuthModal,
    logout,
    theme,
    toggleTheme,
    setViewMode,
    searchQuery,
    setSearchQuery,
  } = useApp();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const page = getPageMeta(activeTab, currentOrg?.name);
  const currentRoleMeta = getRoleMeta(userRole);

  return (
    <header className="portal-header sticky top-0 z-40 w-full">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 sm:gap-4 h-[4.25rem]">
          {/* RTL start: menu + page context */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
              id="btn-mobile-menu"
              onClick={onOpenSidebar}
              className="portal-icon-btn lg:hidden cursor-pointer shrink-0"
              aria-label="باز کردن منو"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className="lg:hidden shrink-0 cursor-pointer"
              aria-label="دیدار"
            >
              <Logo variant="mark" size="sm" />
            </button>

            <div className="min-w-0 hidden sm:block">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC] truncate leading-tight">
                {page.title}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#94A3B8] truncate">
                {page.subtitle}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در جلسات، اتاق‌ها، افراد..."
                className="portal-search pr-10 pl-3 py-2.5 focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              className="portal-icon-btn hidden sm:flex relative cursor-pointer"
              title="اعلان‌ها"
              onClick={() => {}}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-rose-500 border-2 border-white dark:border-[#1E293B]" />
            </button>

            <button
              type="button"
              id="btn-theme-toggle"
              onClick={toggleTheme}
              className="portal-icon-btn cursor-pointer"
              aria-label="تغییر تم"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4 text-[#0F786E]" />
              )}
            </button>

            <button
              type="button"
              id="btn-quick-book"
              onClick={() => openBookingModal()}
              className="portal-btn-primary hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              رزرو جلسه
            </button>

            {isAuthenticated && currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  id="btn-user-profile-menu"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl portal-icon-btn hover:border-[#14B8A6]/30 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#14B8A6] to-[#0F766E] text-white text-xs font-black flex items-center justify-center">
                    {currentUser.name.charAt(0)}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {isUserDropdownOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-20 cursor-default"
                      onClick={() => setIsUserDropdownOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 w-64 dark-surface-card rounded-2xl shadow-xl py-2 z-30">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-[#26364D]">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {currentUser.name}
                        </p>
                        <p
                          className="text-[11px] text-slate-500 font-mono mt-0.5"
                          dir="ltr"
                        >
                          {currentUser.email}
                        </p>
                        <span
                          className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${currentRoleMeta.badgeClass}`}
                        >
                          {currentRoleMeta.titleFa}
                        </span>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            setActiveTab("profile");
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-[#334155] cursor-pointer"
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
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#0F786E] dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer"
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
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
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
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="p-2.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] cursor-pointer"
                >
                  <LogIn className="w-4 h-4 sm:hidden" />
                  <span className="hidden sm:inline">ورود</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal("register")}
                  className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#0F786E] hover:bg-[#0D6B63] cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  عضویت
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile page title */}
        <div className="sm:hidden pb-3 -mt-1">
          <h1 className="text-base font-black text-slate-900 dark:text-white">
            {page.title}
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {page.subtitle}
          </p>
        </div>
      </div>
    </header>
  );
};
