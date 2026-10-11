import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { getRoleMeta } from "../../constants/rbac";
import { UserAvatar } from "./UserAvatar";
import { OrgPortalBrand } from "./OrgPortalBrand";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
  MoreHorizontal,
  Sun,
  Moon,
  LogOut,
  User,
} from "lucide-react";
import { ActiveTab } from "../../types";
import {
  buildPortalSidebarNav,
  findSidebarGroupForTab,
  flattenSearchableNav,
  type PortalNavItem,
  type PortalNavGroup,
} from "../../navigation/portalSidebarNav";

const SIDEBAR_COLLAPSED_KEY = "rooomchi-portal-sidebar-collapsed";

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
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
    currentOrg,
  } = useApp();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  const roleMeta = getRoleMeta(userRole);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const portalNav = useMemo(() => buildPortalSidebarNav(can), [can]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const gid = findSidebarGroupForTab(buildPortalSidebarNav(can), activeTab);
    return gid ? { [gid]: true } : {};
  });

  useEffect(() => {
    const gid = findSidebarGroupForTab(portalNav, activeTab);
    if (gid) {
      setExpandedGroups((prev) => (prev[gid] ? prev : { ...prev, [gid]: true }));
    }
  }, [activeTab, portalNav]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const displayName = currentUser?.name || "کاربر روم‌چی";
  const displayEmail = currentUser?.email || "user@rooomchi.ir";
  const displayRole =
    roleMeta?.titleFa?.split(" ").slice(0, 2).join(" ") || "عضو سازمان";

  const goTo = (id: ActiveTab) => {
    setActiveTab(id);
    onClose();
    setSearchModalOpen(false);
  };

  const allSearchableItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return flattenSearchableNav(portalNav).filter((item) =>
      item.label.toLowerCase().includes(q),
    );
  }, [searchQuery, portalNav]);

  const shellWidth = collapsed ? "w-[76px]" : "w-[275px]";

  const renderNavButton = (
    item: PortalNavItem,
    isActive: boolean,
    opts?: { nested?: boolean },
  ) => {
    const Icon = item.icon;
    const nested = opts?.nested;
    return (
      <button
        key={item.id}
        type="button"
        id={`sidebar-nav-${item.id}`}
        title={collapsed ? item.label : undefined}
        onClick={() => goTo(item.id)}
        className={`group relative w-full flex items-center gap-3 rounded-xl font-semibold transition-all cursor-pointer ${
          nested ? "text-[12px]" : "text-[13px]"
        } ${
          collapsed
            ? "justify-center px-2 py-2.5"
            : nested
              ? "pr-6 pl-3 py-2 mt-0.5"
              : "px-3 py-2.5"
        } ${
          isActive
            ? "bg-[rgb(var(--brand-primary-rgb)/0.1)] dark:bg-[rgb(var(--brand-primary-rgb)/0.2)] text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] font-bold shadow-2xs"
            : nested
              ? "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        {isActive && (
          <span
            className={`absolute rounded-full bg-[var(--brand-primary)] dark:bg-[var(--brand-primary-on-dark)] ${
              nested && !collapsed
                ? "right-2 top-2 bottom-2 w-0.5"
                : "right-1 top-2 bottom-2 w-1"
            }`}
            aria-hidden
          />
        )}
        <Icon
          className={`shrink-0 transition-colors ${
            nested ? "w-4 h-4" : "w-[18px] h-[18px]"
          } ${
            isActive
              ? "text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)]"
              : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
          }`}
        />
        {!collapsed && <span className="flex-1 text-right truncate">{item.label}</span>}
      </button>
    );
  };

  const renderGroup = (group: PortalNavGroup) => {
    const GroupIcon = group.icon;
    const isGroupActive = group.items.some((i) => i.id === activeTab);
    const expanded = expandedGroups[group.id] ?? false;

    return (
      <div
        key={group.id}
        className={collapsed ? "pt-2 mt-2 border-t border-slate-200/80 dark:border-white/10 first:mt-0 first:pt-0 first:border-t-0" : "pt-1"}
      >
        {!collapsed && (
          <button
            type="button"
            onClick={() =>
              setExpandedGroups((prev) => ({ ...prev, [group.id]: !expanded }))
            }
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
              isGroupActive
                ? "text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)]"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
            }`}
          >
            <GroupIcon className="w-[18px] h-[18px] shrink-0" />
            <span className="flex-1 text-right truncate">{group.label}</span>
            <ChevronDown
              className={`w-4 h-4 shrink-0 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
        )}

        {(collapsed || expanded) &&
          group.items.map((item) =>
            renderNavButton(item, activeTab === item.id, { nested: !collapsed }),
          )}
      </div>
    );
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="بستن منو"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[3px] lg:hidden cursor-pointer"
          onClick={onClose}
        />
      )}

      <aside
        id="portal-sidebar"
        className={`fixed z-50 shrink-0 select-none transition-all duration-300 ease-out top-0 bottom-0 right-0 lg:sticky lg:top-0 lg:h-screen lg:max-h-screen bg-white dark:bg-[#111C2E] border-s border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between ${shellWidth} ${
          mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        } ${mobileOpen ? "flex" : "hidden lg:flex"}`}
      >
        <div className="flex flex-col shrink-0">
          <div
            className={`pt-3.5 pb-2 px-3.5 flex items-center justify-between gap-2 shrink-0 ${
              collapsed ? "flex-col items-center" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => goTo("dashboard")}
              className="flex items-center cursor-pointer text-right group p-1 rounded-xl hover:opacity-95 transition-opacity"
              title={currentOrg?.name || "سامانه روم‌چی"}
            >
              <OrgPortalBrand collapsed={collapsed} />
            </button>

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
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-1 space-y-1">
          <nav className="space-y-1">
            {renderNavButton(portalNav.dashboard, activeTab === portalNav.dashboard.id)}
            {portalNav.groups.map((group) => renderGroup(group))}
            <div className="pt-2 mt-1 border-t border-slate-100 dark:border-white/5">
              {renderNavButton(portalNav.profile, activeTab === portalNav.profile.id)}
            </div>
          </nav>
        </div>

        <div
          className={`shrink-0 relative ${collapsed ? "px-2 pt-3 pb-5 sm:pb-6" : "p-3"}`}
        >
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
                    ? "right-[calc(100%+0.75rem)] bottom-2 w-64 min-w-[16rem] zoom-in-95"
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
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[rgb(var(--brand-primary-rgb)/0.1)] text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] shrink-0 whitespace-nowrap">
                    {displayRole}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {theme === "dark" ? (
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-brand" />
                    )}
                    <span>حالت نمایش: {theme === "dark" ? "تاریک" : "روشن"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    goTo("profile");
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-brand" />
                  <span>پروفایل کاربری من</span>
                </button>

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

          <div
            className={`border border-slate-200/90 dark:border-white/10 rounded-2xl p-2 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-all cursor-pointer ${
              collapsed ? "flex-col p-1.5" : ""
            }`}
            onClick={() => setUserMenuOpen((v) => !v)}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <UserAvatar user={currentUser} name={displayName} size="sm" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[var(--brand-primary)] border-2 border-white dark:border-[#111C2E] rounded-full" />
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

      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
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

            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {allSearchableItems.length > 0 ? (
                allSearchableItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(item.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-right transition-colors cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[var(--brand-primary)] dark:group-hover:text-[var(--brand-primary-on-dark)]">
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
