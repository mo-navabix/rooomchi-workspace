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
  UserCheck,
  AlertCircle,
  Calendar,
  CheckCheck,
} from "lucide-react";
import { ActiveTab } from "../../types";
import { UserAvatar } from "./UserAvatar";

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
  "access-control": {
    title: "کنترل دسترسی‌ها",
    subtitle: "مدیریت مجوزها، امنیت و روش‌های ورود و خروج",
  },
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
    openCompleteProfileModal,
    isRegistrationComplete,
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
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
  } = useApp();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const page = getPageMeta(activeTab, currentOrg?.name);
  const currentRoleMeta = getRoleMeta(userRole);

  return (
    <header className="sticky top-0 z-40 w-full pt-2.5 sm:pt-3.5 px-3 sm:px-6 lg:px-8 pb-1">
      <div className="w-full rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#111C2E]/90 border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-black/20 backdrop-blur-md px-3 sm:px-5">
        <div className="flex items-center gap-2 sm:gap-4 h-14 sm:h-16">
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
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                id="btn-header-notifications"
                className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl portal-icon-btn relative cursor-pointer"
                title="اعلان‌ها"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-[#1E293B] shadow-xs animate-pulse">
                    {unreadNotificationsCount > 9 ? "+9" : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setIsNotificationsOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-80 sm:w-96 dark-surface-card rounded-2xl shadow-2xl z-30 border border-slate-200/90 dark:border-[#334155] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Popover Header */}
                    <div className="p-3.5 border-b border-slate-100 dark:border-[#26364D] flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#0F786E] dark:text-[#5eead4]" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          اعلان‌ها و رویدادهای جلسات
                        </h4>
                        {unreadNotificationsCount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#0F786E] dark:text-[#5eead4] border border-emerald-200 dark:border-emerald-800/40">
                            {unreadNotificationsCount} جدید
                          </span>
                        )}
                      </div>

                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsAsRead}
                          className="text-[11px] font-medium text-[#0F786E] dark:text-[#5eead4] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>خواندن همه</span>
                        </button>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#26364D]">
                      {notifications.length === 0 ? (
                        <div className="py-8 px-4 text-center">
                          <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            هیچ اعلانی در حال حاضر وجود ندارد
                          </p>
                        </div>
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
                            className={`p-3.5 hover:bg-slate-50 dark:hover:bg-[#0F172A] transition-colors cursor-pointer flex items-start gap-3 ${
                              !n.isRead
                                ? "bg-emerald-50/40 dark:bg-emerald-950/20"
                                : ""
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                                !n.isRead
                                  ? "bg-emerald-500/10 text-[#0F786E] dark:text-[#5eead4] border border-emerald-500/20"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                              }`}
                            >
                              {n.type === "meeting_booked" ? (
                                <Calendar className="w-4 h-4" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {n.title}
                                </h5>
                                {!n.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                              {n.roomName && (
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                  <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium text-slate-700 dark:text-slate-300">
                                    {n.roomName}
                                  </span>
                                  {n.date && <span>• {n.date}</span>}
                                  {n.startTime && (
                                    <span>
                                      • ساعت {n.startTime} تا {n.endTime}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="p-2.5 border-t border-slate-100 dark:border-[#26364D] bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={clearAllNotifications}
                          className="text-[11px] text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium cursor-pointer"
                        >
                          پاک کردن همه
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("calendar");
                            setIsNotificationsOpen(false);
                          }}
                          className="text-[11px] font-bold text-[#0F786E] dark:text-[#5eead4] hover:underline cursor-pointer"
                        >
                          مشاهده تقویم جلسات
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              id="btn-theme-toggle"
              onClick={toggleTheme}
              className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl portal-icon-btn cursor-pointer"
              aria-label="تغییر تم"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4 text-[#0F786E]" />
              )}
            </button>

            {/* Quick Book Meeting Button */}
            <button
              type="button"
              id="btn-quick-book"
              onClick={() => openBookingModal()}
              className="portal-btn-primary hidden sm:flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl text-xs font-bold text-white cursor-pointer shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>رزرو جلسه</span>
            </button>

            {/* User Profile Menu Button (The Circled Element) */}
            {isAuthenticated && currentUser ? (
              <div className="relative shrink-0">
                <button
                  type="button"
                  id="btn-user-profile-menu"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="h-10 px-2.5 shrink-0 flex items-center justify-center gap-2 rounded-xl portal-icon-btn hover:border-[#14B8A6]/40 cursor-pointer"
                  title={currentUser.name}
                >
                  <UserAvatar
                    user={currentUser}
                    size="xs"
                    className="w-6 h-6 rounded-lg shrink-0"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {isUserDropdownOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-20 cursor-default"
                      onClick={() => setIsUserDropdownOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 w-64 dark-surface-card rounded-2xl shadow-xl py-2 z-30 border border-slate-200/80 dark:border-white/10">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-[#26364D] flex items-center gap-3">
                        <UserAvatar user={currentUser} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {currentUser.name}
                            </p>
                            {!isRegistrationComplete() && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                                تکمیل‌نشده
                              </span>
                            )}
                          </div>
                          <p
                            className="text-[11px] text-slate-500 font-mono mt-0.5 truncate"
                            dir="ltr"
                          >
                            {currentUser.email}
                          </p>
                          <span
                            className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${currentRoleMeta.badgeClass}`}
                          >
                            {currentRoleMeta.titleFa}
                          </span>
                        </div>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        {!isRegistrationComplete() && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserDropdownOpen(false);
                              openCompleteProfileModal();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer mb-1 border border-amber-200/60 dark:border-amber-800/40"
                          >
                            <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span>تکمیل مشخصات کاربری</span>
                          </button>
                        )}
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
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="h-10 flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-xs font-bold text-white bg-[#0F786E] hover:bg-[#0D6B63] transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  <LogIn className="w-4 h-4" />
                  <span>ورود / ثبت‌نام</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile page title */}
        <div className="sm:hidden pb-2.5 -mt-0.5 min-w-0">
          <h1 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] truncate">
            {page.title}
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] line-clamp-2 leading-relaxed">
            {page.subtitle}
          </p>
        </div>
      </div>
    </header>
  );
};
