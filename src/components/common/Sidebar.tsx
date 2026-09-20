import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { getRoleMeta } from "../../constants/rbac";
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
  Building2,
  Layers,
  User,
  Ticket,
} from "lucide-react";
import { ActiveTab } from "../../types";

const SIDEBAR_COLLAPSED_KEY = "didar-portal-sidebar-collapsed";

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

type NavItem = {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permissionCheck?: boolean;
};

type NavGroup = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
};

function NavLinkButton({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      id={`sidebar-nav-${item.id}`}
      title={collapsed ? item.label : undefined}
      onClick={onClick}
      className={`group relative w-full flex items-center gap-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
      } ${
        isActive ? "sidebar-nav-item--active" : "sidebar-nav-item"
      }`}
    >
      {isActive && (
        <span className="sidebar-nav-indicator" aria-hidden />
      )}
      <Icon
        className={`w-[18px] h-[18px] shrink-0 ${
          isActive
            ? "text-[#0F786E] dark:text-[#5eead4]"
            : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
        }`}
      />
      {!collapsed && (
        <span className="flex-1 text-right truncate">{item.label}</span>
      )}
    </button>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    currentOrg,
    can,
    currentUser,
    userRole,
  } = useApp();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    reports: true,
    users: true,
    org: true,
    settings: true,
  });
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const primaryItems: NavItem[] = [
    { id: "dashboard", label: "داشبورد", icon: LayoutDashboard },
    { id: "calendar", label: "تقویم", icon: Calendar },
    { id: "rooms", label: "اتاق‌ها", icon: DoorOpen },
    { id: "my-bookings", label: "جلسات من", icon: CalendarCheck },
    { id: "profile", label: "پروفایل من", icon: User },
  ];

  const groups: NavGroup[] = useMemo(() => {
    const raw: NavGroup[] = [
      {
        key: "reports",
        label: "گزارش‌ها",
        icon: BarChart3,
        items: [{ id: "analytics", label: "گزارش‌ها و آمار", icon: BarChart3 }],
      },
      {
        key: "users",
        label: "کاربران",
        icon: ShieldCheck,
        items: [
          {
            id: "admin-rbac",
            label: "مدیریت کاربران",
            icon: ShieldCheck,
            permissionCheck: can("MANAGE_USERS_ROLES"),
          },
        ],
      },
      {
        key: "org",
        label: "سازمان",
        icon: Building2,
        items: [
          {
            id: "admin-rooms",
            label: "مدیریت اتاق‌ها",
            icon: Layers,
            permissionCheck: can("MANAGE_ROOMS"),
          },
          {
            id: "admin-bookings",
            label: "نظارت بر رزروها",
            icon: Calendar,
            permissionCheck: can("APPROVE_BOOKINGS"),
          },
          {
            id: "admin-support-tickets",
            label: "تیکت‌های پشتیبانی",
            icon: Ticket,
            permissionCheck: can("MANAGE_ORG_SETTINGS"),
          },
        ],
      },
      {
        key: "settings",
        label: "تنظیمات",
        icon: Sliders,
        items: [
          {
            id: "admin-settings",
            label: "تنظیمات سازمان",
            icon: Sliders,
            permissionCheck: can("MANAGE_ORG_SETTINGS"),
          },
        ],
      },
    ];

    return raw
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) => i.permissionCheck === undefined || i.permissionCheck,
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [can]);

  const roleMeta = getRoleMeta(userRole);
  const displayName = currentUser?.name || "کاربر دیدار";
  const displayRole =
    roleMeta?.titleFa?.split(" ").slice(0, 2).join(" ") || "مدیر سیستم";

  const goTo = (id: ActiveTab) => {
    setActiveTab(id);
    onClose();
  };

  const toggleGroup = (key: string) => {
    if (collapsed) return;
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isGroupActive = (group: NavGroup) =>
    group.items.some((i) => i.id === activeTab);

  const shellWidth = collapsed ? "w-[4.5rem]" : "w-[260px]";

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="بستن منو"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden cursor-pointer"
          onClick={onClose}
        />
      )}

      <aside
        id="portal-sidebar"
        className={`portal-sidebar fixed top-0 bottom-0 right-0 z-50 shrink-0 flex flex-col shadow-sm dark:shadow-none select-none transition-[width,transform] duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:max-h-screen ${shellWidth} ${
          mobileOpen
            ? "translate-x-0 shadow-2xl"
            : "translate-x-full lg:translate-x-0"
        } ${mobileOpen ? "flex" : "hidden lg:flex"}`}
      >
        {/* Header: logo + collapse */}
        <div
          className={`flex items-center gap-2 border-b border-slate-200 dark:border-[#26364D] shrink-0 ${
            collapsed ? "flex-col py-4 px-2" : "justify-between px-4 py-4"
          }`}
        >
          <button
            type="button"
            onClick={() => goTo("dashboard")}
            className={`flex items-center min-w-0 cursor-pointer ${collapsed ? "justify-center" : "justify-start w-full px-0.5"}`}
            aria-label="اتاق — دیدار"
          >
            {collapsed ? (
              <Logo variant="mark" size="sm" theme="auto" />
            ) : (
              <Logo
                variant="horizontal"
                size="md"
                theme="auto"
                className="max-w-[148px]"
              />
            )}
          </button>

          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-400 dark:hover:text-white cursor-pointer border border-slate-200 dark:border-white/10"
              aria-label="جمع کردن منو"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 cursor-pointer"
            aria-label="بستن منو"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="hidden lg:flex mx-auto mt-2 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-400 cursor-pointer border border-slate-200 dark:border-white/10"
            aria-label="باز کردن منو"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div className="border-b border-slate-200 dark:border-[#26364D] p-2 shrink-0">
          <div
            className={`w-full flex items-center gap-2.5 rounded-xl p-2 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--brand-primary)] to-[var(--brand-primary-light)] dark:from-slate-600 dark:to-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {currentOrg?.name?.charAt(0) || displayName.charAt(0)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 text-right">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {displayName}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-500 truncate">
                  {displayRole}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden px-2 py-3">
          <nav className="space-y-1">
            {primaryItems.map((item) => (
              <NavLinkButton
                key={item.id}
                item={item}
                isActive={activeTab === item.id}
                collapsed={collapsed}
                onClick={() => goTo(item.id)}
              />
            ))}

            {groups.length > 0 && (
              <div
                className="my-3 border-t border-slate-200 dark:border-white/[0.06]"
                aria-hidden
              />
            )}

            {groups.map((group) => {
              const GroupIcon = group.icon;
              const expanded = openGroups[group.key] ?? true;
              const groupActive = isGroupActive(group);

              if (collapsed) {
                const first = group.items[0];
                if (!first) return null;
                return (
                  <NavLinkButton
                    key={group.key}
                    item={{ ...first, label: group.label, icon: group.icon }}
                    isActive={groupActive}
                    collapsed={collapsed}
                    onClick={() => goTo(first.id)}
                  />
                );
              }

              return (
                <div key={group.key} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-colors ${
                      groupActive
                        ? "text-[#0F786E] dark:text-[#99f6e4]"
                        : "sidebar-nav-item"
                    }`}
                  >
                    <GroupIcon className="w-[18px] h-[18px] shrink-0 text-slate-400 dark:text-slate-400" />
                    <span className="flex-1 text-right">{group.label}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expanded &&
                    group.items.map((item) => (
                      <div
                        key={item.id}
                        className="pr-2 mr-1 border-r border-slate-200 dark:border-white/[0.06]"
                      >
                        <NavLinkButton
                          item={item}
                          isActive={activeTab === item.id}
                          collapsed={false}
                          onClick={() => goTo(item.id)}
                        />
                      </div>
                    ))}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
