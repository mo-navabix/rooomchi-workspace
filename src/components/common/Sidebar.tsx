import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { getRoleMeta, normalizeUserRole } from "../../constants/rbac";
import { UserAvatar } from "./UserAvatar";
import { Logo } from "./Logo";
import {
  LayoutDashboard,
  Calendar,
  DoorOpen,
  CalendarCheck,
  BarChart3,
  Sliders,
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  User,
  Ticket,
  Users,
  KeyRound,
  Search,
  MoreHorizontal,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  BellRing,
} from "lucide-react";
import { ActiveTab } from "../../types";

const SIDEBAR_COLLAPSED_KEY = "didar-portal-sidebar-collapsed";
const SIDEBAR_STYLE_KEY = "didar-portal-sidebar-style"; // "modern-card" | "classic"

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

type NavItem = {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: { text: string; color: "green" | "yellow" | "blue" };
  permissionCheck?: boolean;
};

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    can,
    currentUser,
    userRole,
    theme,
    toggleTheme,
    logout,
  } = useApp();

  // Collapsed state
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  // Sidebar visual style
  const [sidebarStyle, setSidebarStyle] = useState<"modern-card" | "classic">(() => {
    try {
      return (localStorage.getItem(SIDEBAR_STYLE_KEY) as "modern-card" | "classic") || "modern-card";
    } catch {
      return "modern-card";
    }
  });

  const roleMeta = getRoleMeta(userRole);
  const normalizedRole = normalizeUserRole(userRole);
  const isEmployee = normalizedRole === "employee";

  // Segmented mode switcher: personal vs business (employees are always personal)
  const [mode, setMode] = useState<"personal" | "business">("personal");

  // User dropdown menu
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Quick Search Dialog
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-sync mode with activeTab
  useEffect(() => {
    if (isEmployee) {
      setMode("personal");
      return;
    }
    const businessTabs: ActiveTab[] = [
      "admin-bookings",
      "admin-rooms",
      "access-control",
      "admin-rbac",
      "analytics",
      "admin-notifications",
      "admin-support-tickets",
      "admin-settings",
    ];
    if (businessTabs.includes(activeTab)) {
      setMode("business");
    } else if (
      ["rooms", "calendar", "my-bookings", "teams", "support-ticket", "profile"].includes(
        activeTab
      )
    ) {
      setMode("personal");
    }
  }, [activeTab, isEmployee]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STYLE_KEY, sidebarStyle);
    } catch {
      /* ignore */
    }
  }, [sidebarStyle]);

  const displayName = currentUser?.name || "کاربر دیدار";
  const displayEmail = currentUser?.email || "user@didar.ir";
  const displayRole =
    roleMeta?.titleFa?.split(" ").slice(0, 2).join(" ") || "عضو سازمان";

  // Orderly Navigation items for PERSONAL mode
  const personalNavItems: NavItem[] = useMemo(() => [
    { id: "dashboard", label: "داشبورد", icon: LayoutDashboard },
    { id: "rooms", label: "رزرو اتاق‌ها و سالن‌ها", icon: DoorOpen },
    { id: "calendar", label: "تقویم جلسات", icon: Calendar },
    { id: "my-bookings", label: "جلسات من", icon: CalendarCheck },
    { id: "teams", label: "تیم‌ها و همکاران", icon: Users },
    { id: "support-ticket", label: "پشتیبانی و تیکت من", icon: Ticket },
    { id: "profile", label: "پروفایل من", icon: User },
  ], []);

  // Orderly Navigation items for BUSINESS / ENTERPRISE mode
  const businessNavItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      {
        id: "admin-bookings",
        label: "نظارت بر رزروها",
        icon: CalendarCheck,
        permissionCheck: can("APPROVE_BOOKINGS"),
      },
      {
        id: "admin-rooms",
        label: "مدیریت اتاق‌ها و تجهیزات",
        icon: Layers,
        permissionCheck: can("MANAGE_ROOMS"),
      },
      {
        id: "access-control",
        label: "کنترل دسترسی‌ها و امنیت",
        icon: KeyRound,
        permissionCheck: can("MANAGE_USERS_ROLES"),
      },
      {
        id: "admin-rbac",
        label: "کاربران و سطوح دسترسی",
        icon: ShieldCheck,
        permissionCheck: can("MANAGE_USERS_ROLES"),
      },
      {
        id: "analytics",
        label: "گزارش‌ها و آمار سازمان",
        icon: BarChart3,
      },
      {
        id: "admin-notifications",
        label: "مدیریت اعلان‌ها (SMS و تلگرام)",
        icon: BellRing,
        permissionCheck: can("MANAGE_ORG_SETTINGS"),
      },
      {
        id: "admin-support-tickets",
        label: "تیکت‌های سازمانی",
        icon: Ticket,
        permissionCheck: can("MANAGE_ORG_SETTINGS"),
      },
      {
        id: "admin-settings",
        label: "تنظیمات سازمان",
        icon: Sliders,
        permissionCheck: can("MANAGE_ORG_SETTINGS"),
      },
    ];
    return items.filter((i) => i.permissionCheck === undefined || i.permissionCheck);
  }, [can]);

  const activeMainItems = isEmployee || mode === "personal" ? personalNavItems : businessNavItems;

  const handleSwitchToBusiness = () => {
    setMode("business");
    const businessTabs: ActiveTab[] = [
      "admin-bookings",
      "admin-rooms",
      "access-control",
      "admin-rbac",
      "analytics",
      "admin-notifications",
      "admin-support-tickets",
      "admin-settings",
    ];
    if (!businessTabs.includes(activeTab)) {
      const firstTab = businessNavItems[0]?.id || "admin-bookings";
      setActiveTab(firstTab);
    }
  };

  const handleSwitchToPersonal = () => {
    setMode("personal");
    const personalTabs: ActiveTab[] = [
      "dashboard",
      "rooms",
      "calendar",
      "my-bookings",
      "teams",
      "support-ticket",
      "profile",
    ];
    if (!personalTabs.includes(activeTab)) {
      setActiveTab("dashboard");
    }
  };

  const goTo = (id: ActiveTab) => {
    setActiveTab(id);
    onClose();
    setSearchModalOpen(false);
  };

  // Filter searchable items for Command Palette / Quick Search
  const allSearchableItems = useMemo(() => {
    const items = [
      { id: "dashboard" as ActiveTab, label: "داشبورد اصلی", category: "ناوبری", forEmployee: true },
      { id: "rooms" as ActiveTab, label: "رزرو اتاق‌ها و فضاها", category: "جلسات", forEmployee: true },
      { id: "calendar" as ActiveTab, label: "تقویم جلسات و هماهنگی", category: "جلسات", forEmployee: true },
      { id: "my-bookings" as ActiveTab, label: "جلسات و رزروهای من", category: "جلسات", forEmployee: true },
      { id: "teams" as ActiveTab, label: "تیم‌ها و همکاران", category: "سازمان", forEmployee: true },
      { id: "support-ticket" as ActiveTab, label: "ثبت و پیگیری تیکت پشتیبانی", category: "پشتیبانی", forEmployee: true },
      { id: "admin-bookings" as ActiveTab, label: "نظارت و تأیید رزروها", category: "مدیریت", forEmployee: false },
      { id: "admin-rooms" as ActiveTab, label: "مدیریت اتاق‌ها و تجهیزات", category: "مدیریت", forEmployee: false },
      { id: "access-control" as ActiveTab, label: "کنترل دسترسی‌ها و ورود با گوگل", category: "امنیت", forEmployee: false },
      { id: "admin-rbac" as ActiveTab, label: "مدیریت کاربران و نقش‌ها", category: "امنیت", forEmployee: false },
      { id: "analytics" as ActiveTab, label: "گزارش‌ها و آمار بهره‌وری", category: "تحلیل", forEmployee: false },
      { id: "admin-support-tickets" as ActiveTab, label: "مدیریت تیکت‌های پرسنل", category: "پشتیبانی", forEmployee: false },
      { id: "admin-settings" as ActiveTab, label: "تنظیمات سازمان و زمان‌بندی", category: "تنظیمات", forEmployee: false },
      { id: "profile" as ActiveTab, label: "پروفایل من و امنیت حساب", category: "حساب", forEmployee: true },
    ];
    return items
      .filter((item) => !isEmployee || item.forEmployee)
      .filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
  }, [searchQuery, isEmployee]);

  const isModern = sidebarStyle === "modern-card";
  const shellWidth = collapsed ? "w-[76px]" : "w-[275px]";

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="بستن منو"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[3px] lg:hidden cursor-pointer"
          onClick={onClose}
        />
      )}

      {/* Floating Card Sidebar Container */}
      <aside
        id="portal-sidebar"
        className={`fixed z-50 shrink-0 select-none transition-all duration-300 ease-out ${
          isModern
            ? `top-2.5 bottom-2.5 right-2.5 sm:top-3.5 sm:bottom-3.5 sm:right-3.5 lg:sticky lg:h-[calc(100vh-1.75rem)] lg:max-h-[calc(100vh-1.75rem)] rounded-[26px] bg-white/95 dark:bg-[#111C2E]/95 border border-slate-200/90 dark:border-white/10 shadow-xl shadow-slate-200/60 dark:shadow-black/50 backdrop-blur-md flex flex-col justify-between ${shellWidth} ${
                mobileOpen
                  ? "translate-x-0"
                  : "translate-x-[calc(100%+2rem)] lg:translate-x-0"
              }`
            : `top-0 bottom-0 right-0 lg:sticky lg:top-0 lg:h-screen lg:max-h-screen bg-white dark:bg-[#111C2E] border-s border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between ${shellWidth} ${
                mobileOpen
                  ? "translate-x-0"
                  : "translate-x-full lg:translate-x-0"
              }`
        } ${mobileOpen ? "flex" : "hidden lg:flex"}`}
      >
        {/* TOP SECTION */}
        <div className="flex flex-col shrink-0">
          {/* Logo & Top Controls (Dots removed as requested) */}
          <div
            className={`pt-3.5 pb-2 px-3.5 flex items-center justify-between gap-2 shrink-0 ${
              collapsed ? "flex-col items-center" : ""
            }`}
          >
            {/* Site Official Logo */}
            <button
              type="button"
              onClick={() => goTo("dashboard")}
              className="flex items-center cursor-pointer text-right group p-1 rounded-xl hover:opacity-95 transition-opacity"
              title="سامانه دیدار"
            >
              {collapsed ? (
                <Logo variant="mark" size="sm" />
              ) : (
                <Logo variant="horizontal" size="sm" />
              )}
            </button>

            {/* Quick Action Icons: Search & Collapse + Mobile Close */}
            <div
              className={`flex items-center gap-1 ${
                collapsed ? "flex-col mt-2" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="جستجوی سریع (Ctrl+K)"
                aria-label="جستجو"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title={collapsed ? "گسترش منو" : "جمع کردن منو"}
                aria-label={collapsed ? "گسترش منو" : "جمع کردن منو"}
              >
                {collapsed ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* Mobile close button */}
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Segmented Mode Switcher: PERSONAL / BUSINESS (Only for admins/managers, hidden for employee) */}
          {!isEmployee && (
            !collapsed ? (
              <div className="px-3.5 pt-1 pb-2.5">
                <div className="bg-slate-100/90 dark:bg-slate-800/70 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/50 dark:border-white/5">
                  <button
                    type="button"
                    onClick={handleSwitchToPersonal}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      mode === "personal"
                        ? "bg-[#0F786E] text-white shadow-sm shadow-[#0F786E]/30"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    شخصی
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchToBusiness}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      mode === "business"
                        ? "bg-[#0F786E] text-white shadow-sm shadow-[#0F786E]/30"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    سازمانی
                  </button>
                </div>
              </div>
            ) : (
              /* Collapsed mini toggle button */
              <div className="py-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    if (mode === "personal") {
                      handleSwitchToBusiness();
                    } else {
                      handleSwitchToPersonal();
                    }
                  }}
                  title={`حالت فعلی: ${
                    mode === "personal" ? "شخصی" : "سازمانی"
                  } (برای تغییر کلیک کنید)`}
                  className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full p-0.5 cursor-pointer transition-colors relative"
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-[#0F786E] shadow-sm transition-transform duration-200 ${
                      mode === "business" ? "-translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )
          )}
        </div>

        {/* MIDDLE SCROLLABLE NAVIGATION */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-1 space-y-3">
          {/* Main Navigation List */}
          <nav className="space-y-1">
            {activeMainItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`sidebar-nav-${item.id}`}
                  title={collapsed ? item.label : undefined}
                  onClick={() => goTo(item.id)}
                  className={`group relative w-full flex items-center gap-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                    collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                  } ${
                    isActive
                      ? "bg-[#0F786E]/10 dark:bg-[#0F786E]/20 text-[#0F786E] dark:text-[#5eead4] font-bold shadow-2xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <span
                      className="absolute right-1 top-2 bottom-2 w-1 rounded-full bg-[#0F786E] dark:bg-[#5eead4]"
                      aria-hidden
                    />
                  )}
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                      isActive
                        ? "text-[#0F786E] dark:text-[#5eead4]"
                        : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                    }`}
                  />
                  {!collapsed && (
                    <span className="flex-1 text-right truncate">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM USER PROFILE CARD */}
        <div className="p-3 shrink-0 relative">
          {/* User Options Popover Menu */}
          {userMenuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setUserMenuOpen(false)}
              />
              <div
                className={`absolute z-50 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in duration-150 space-y-1 ${
                  collapsed
                    ? "right-[calc(100%+0.6rem)] bottom-0 w-64 min-w-[16rem] zoom-in-95"
                    : "bottom-16 right-3 left-3 slide-in-from-bottom-2"
                }`}
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {displayName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {displayEmail}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0F786E]/10 text-[#0F786E] dark:text-[#5eead4] shrink-0 whitespace-nowrap">
                    {displayRole}
                  </span>
                </div>

                {/* Sidebar Style Switcher */}
                <button
                  type="button"
                  onClick={() =>
                    setSidebarStyle((s) =>
                      s === "modern-card" ? "classic" : "modern-card"
                    )
                  }
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>استایل منو: {isModern ? "کارت معلق" : "کلاسیک"}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">تغییر</span>
                </button>

                {/* Theme Toggle */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {theme === "dark" ? (
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-teal-600" />
                    )}
                    <span>حالت نمایش: {theme === "dark" ? "تاریک" : "روشن"}</span>
                  </div>
                </button>

                {/* My Profile */}
                <button
                  type="button"
                  onClick={() => {
                    goTo("profile");
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <span>پروفایل کاربری من</span>
                </button>

                {/* Logout */}
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>خروج از حساب</span>
                </button>
              </div>
            </>
          )}

          {/* Profile Card Pill */}
          <div
            className={`border border-slate-200/90 dark:border-white/10 rounded-2xl p-2 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-all cursor-pointer ${
              collapsed ? "flex-col p-1.5" : ""
            }`}
            onClick={() => setUserMenuOpen((v) => !v)}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <UserAvatar user={currentUser} name={displayName} size="sm" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#111C2E] rounded-full" />
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0 text-right">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {displayEmail}
                  </div>
                </div>
              )}
            </div>

            {/* Three dots button */}
            <button
              type="button"
              aria-label="گزینه‌های بیشتر"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* QUICK COMMAND PALETTE / SEARCH MODAL */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="جستجوی بخش‌ها، اتاق‌ها، جلسات یا تنظیمات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Results */}
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {allSearchableItems.length > 0 ? (
                allSearchableItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(item.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-right transition-colors cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#0F786E] dark:group-hover:text-[#5eead4]">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {item.category}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  موردی یافت نشد.
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400">
              برای بستن کلید Esc یا علامت ضربدر را بزنید
            </div>
          </div>
        </div>
      )}
    </>
  );
};
