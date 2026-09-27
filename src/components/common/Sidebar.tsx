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
  ChevronDown,
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

const SIDEBAR_COLLAPSED_KEY = "rooomchi-portal-sidebar-collapsed";
const SIDEBAR_STYLE_KEY = "rooomchi-portal-sidebar-style"; // "modern-card" | "classic"

const SIDEBAR_GROUPS_KEY = "rooomchi-portal-sidebar-open-groups";

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

type NavItem = {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
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

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_GROUPS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        return new Set(parsed);
      }
    } catch {
      /* ignore */
    }
    return new Set(["home", "meetings", "admin-ops"]);
  });

  // User dropdown menu
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Quick Search Dialog
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify([...openGroups]));
    } catch {
      /* ignore */
    }
  }, [openGroups]);

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

  const displayName = currentUser?.name || "کاربر روم‌چی";
  const displayEmail = currentUser?.email || "user@rooomchi.ir";
  const displayRole =
    roleMeta?.titleFa?.split(" ").slice(0, 2).join(" ") || "عضو سازمان";

  const navGroups: NavGroup[] = useMemo(() => {
    const groups: NavGroup[] = [
      {
        id: "home",
        title: "خانه",
        icon: LayoutDashboard,
        items: [{ id: "dashboard", label: "داشبورد", icon: LayoutDashboard }],
      },
      {
        id: "meetings",
        title: "رزرو و جلسات",
        icon: Calendar,
        items: [
          { id: "rooms", label: "اتاق‌ها و سالن‌ها", icon: DoorOpen },
          { id: "calendar", label: "تقویم جلسات", icon: Calendar },
          { id: "my-bookings", label: "رزروهای من", icon: CalendarCheck },
        ],
      },
      {
        id: "collab",
        title: "تیم و پشتیبانی",
        icon: Users,
        items: [
          { id: "teams", label: "تیم‌ها", icon: Users },
          { id: "support-ticket", label: "تیکت پشتیبانی", icon: Ticket },
        ],
      },
    ];

    if (!isEmployee) {
      const adminOps: NavItem[] = [];
      if (can("APPROVE_BOOKINGS")) {
        adminOps.push({ id: "admin-bookings", label: "نظارت رزروها", icon: CalendarCheck });
      }
      if (can("MANAGE_ROOMS")) {
        adminOps.push({ id: "admin-rooms", label: "مدیریت اتاق‌ها", icon: Layers });
      }
      adminOps.push({ id: "analytics", label: "گزارش و آمار", icon: BarChart3 });
      if (adminOps.length > 0) {
        groups.push({ id: "admin-ops", title: "مدیریت عملیات", icon: BarChart3, items: adminOps });
      }

      const adminSecurity: NavItem[] = [];
      if (can("MANAGE_USERS_ROLES")) {
        adminSecurity.push({ id: "access-control", label: "کنترل دسترسی", icon: KeyRound });
        adminSecurity.push({ id: "admin-rbac", label: "کاربران و نقش‌ها", icon: ShieldCheck });
      }
      if (adminSecurity.length > 0) {
        groups.push({
          id: "admin-security",
          title: "امنیت و کاربران",
          icon: ShieldCheck,
          items: adminSecurity,
        });
      }

      const adminConfig: NavItem[] = [];
      if (can("MANAGE_ORG_SETTINGS")) {
        adminConfig.push({ id: "admin-notifications", label: "اعلان‌ها", icon: BellRing });
        adminConfig.push({ id: "admin-support-tickets", label: "تیکت‌های سازمان", icon: Ticket });
        adminConfig.push({ id: "admin-settings", label: "تنظیمات سازمان", icon: Sliders });
      }
      if (adminConfig.length > 0) {
        groups.push({ id: "admin-config", title: "پیکربندی", icon: Sliders, items: adminConfig });
      }
    }

    groups.push({
      id: "account",
      title: "حساب من",
      icon: User,
      items: [{ id: "profile", label: "پروفایل", icon: User }],
    });

    return groups.filter((g) => g.items.length > 0);
  }, [can, isEmployee]);

  useEffect(() => {
    const group = navGroups.find((g) => g.items.some((i) => i.id === activeTab));
    if (!group) return;
    setOpenGroups((prev) => {
      if (prev.has(group.id)) return prev;
      const next = new Set(prev);
      next.add(group.id);
      return next;
    });
  }, [activeTab, navGroups]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
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
  const shellWidth = collapsed ? "w-[72px]" : "w-[248px]";

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
              title="سامانه روم‌چی"
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

          {!collapsed && (
            <div className="px-3 pb-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wide">
                منوی سامانه
              </p>
            </div>
          )}
        </div>

        {/* MIDDLE NAVIGATION — expanded scrolls; collapsed shows one icon per group (no scroll) */}
        <div
          className={`flex-1 min-h-0 px-2 py-1 ${
            collapsed ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"
          }`}
        >
          <nav
            className={collapsed ? "space-y-1" : "space-y-2"}
            aria-label="منوی سامانه"
          >
            {collapsed
              ? navGroups.map((group) => {
                  const activeInGroup = group.items.find((i) => i.id === activeTab);
                  const target = activeInGroup ?? group.items[0];
                  const Icon = activeInGroup?.icon ?? group.icon;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      id={`sidebar-nav-group-${group.id}`}
                      title={group.title}
                      onClick={() => goTo(target.id)}
                      className={`relative w-full flex items-center justify-center rounded-lg p-2 cursor-pointer text-slate-600 dark:text-slate-300 ${
                        activeInGroup ? "font-bold" : ""
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px] shrink-0" />
                    </button>
                  );
                })
              : navGroups.map((group) => {
                  const GroupIcon = group.icon;
                  const isOpen = openGroups.has(group.id);
                  const isSingleItem = group.items.length === 1;

                  if (isSingleItem && group.id === "home") {
                    const item = group.items[0];
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        id={`sidebar-nav-${item.id}`}
                        onClick={() => goTo(item.id)}
                        className={`relative w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm cursor-pointer text-slate-700 dark:text-slate-200 ${
                          isActive ? "font-bold" : "font-medium"
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        <span className="flex-1 text-right truncate">{item.label}</span>
                      </button>
                    );
                  }

                  return (
                    <div key={group.id} className="rounded-xl">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 cursor-pointer rounded-xl"
                        aria-expanded={isOpen}
                      >
                        <GroupIcon className="w-4 h-4 shrink-0 text-slate-400" />
                        <span className="flex-1 text-right text-sm font-bold truncate text-slate-600 dark:text-slate-300">
                          {group.title}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <ul className="pb-1.5 pr-1 space-y-0.5">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                              <li key={item.id}>
                                <button
                                  type="button"
                                  id={`sidebar-nav-${item.id}`}
                                  onClick={() => goTo(item.id)}
                                  className={`relative w-full flex items-center gap-2.5 rounded-lg pr-2 pl-2 py-2 mr-3 text-sm cursor-pointer text-slate-700 dark:text-slate-200 ${
                                    isActive ? "font-bold" : "font-medium"
                                  }`}
                                >
                                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                                  <span className="flex-1 text-right truncate">{item.label}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
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
