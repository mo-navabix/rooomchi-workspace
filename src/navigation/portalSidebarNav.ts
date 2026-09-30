import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BellRing,
  Building2,
  Calendar,
  CalendarCheck,
  DoorOpen,
  History,
  KeyRound,
  Layers,
  LayoutDashboard,
  Plug,
  Server,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  User,
  Sliders,
} from "lucide-react";
import type { ActiveTab, Permission } from "../types";

export type PortalNavItem = {
  id: ActiveTab;
  label: string;
  icon: LucideIcon;
  permission?: Permission;
};

export type PortalNavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: PortalNavItem[];
};

export type PortalSidebarModel = {
  dashboard: PortalNavItem;
  groups: PortalNavGroup[];
  profile: PortalNavItem;
};

type CanFn = (permission: Permission) => boolean;

function visible(item: PortalNavItem, can: CanFn): boolean {
  if (!item.permission) return true;
  return can(item.permission);
}

function filterGroup(group: PortalNavGroup, can: CanFn): PortalNavGroup | null {
  const items = group.items.filter((i) => visible(i, can));
  if (items.length === 0) return null;
  return { ...group, items };
}

export function buildPortalSidebarNav(can: CanFn): PortalSidebarModel {
  const settingsItems: PortalNavItem[] = [
    { id: "admin-settings-org", label: "سازمان", icon: Building2, permission: "MANAGE_ORG_SETTINGS" },
    {
      id: "admin-settings-auth",
      label: "احراز هویت",
      icon: KeyRound,
      permission: "MANAGE_AUTHENTICATION_SETTINGS",
    },
    {
      id: "admin-settings-integrations",
      label: "یکپارچه‌سازی",
      icon: Plug,
      permission: "MANAGE_INTEGRATIONS",
    },
    { id: "admin-settings-system", label: "سامانه", icon: Server, permission: "MANAGE_SYSTEM_SETTINGS" },
    { id: "admin-settings-audit", label: "میزبانی", icon: History, permission: "MANAGE_ORG_SETTINGS" },
  ];

  const groups: PortalNavGroup[] = [
    {
      id: "meetings",
      label: "رزرو و جلسات",
      icon: CalendarCheck,
      items: [
        { id: "rooms", label: "رزرو اتاق‌ها و سالن‌ها", icon: DoorOpen, permission: "BOOK_ROOM" },
        { id: "calendar", label: "تقویم جلسات", icon: Calendar, permission: "BOOK_ROOM" },
        { id: "my-bookings", label: "جلسات من", icon: CalendarCheck, permission: "BOOK_ROOM" },
      ],
    },
    {
      id: "collaboration",
      label: "همکاری و ارتباطات",
      icon: Users,
      items: [
        { id: "teams", label: "تیم‌ها و همکاران", icon: Users },
        { id: "notifications", label: "اعلان‌ها", icon: BellRing },
        { id: "support-ticket", label: "پشتیبانی و تیکت", icon: Ticket },
      ],
    },
    {
      id: "reservation-admin",
      label: "مدیریت رزروها",
      icon: CalendarCheck,
      items: [
        {
          id: "admin-bookings",
          label: "نظارت بر رزروها",
          icon: CalendarCheck,
          permission: "APPROVE_BOOKINGS",
        },
        {
          id: "admin-notifications",
          label: "مدیریت اعلان‌ها",
          icon: BellRing,
          permission: "MANAGE_ORG_SETTINGS",
        },
      ],
    },
    {
      id: "spaces",
      label: "فضاها و تجهیزات",
      icon: Layers,
      items: [
        { id: "admin-rooms", label: "اتاق‌ها و سالن‌ها", icon: DoorOpen, permission: "MANAGE_ROOMS" },
        {
          id: "admin-rooms-campus",
          label: "ساختمان‌ها و طبقات",
          icon: Building2,
          permission: "MANAGE_ROOMS",
        },
        {
          id: "admin-rooms-amenities",
          label: "امکانات و تجهیزات",
          icon: Sparkles,
          permission: "MANAGE_ROOMS",
        },
      ],
    },
    {
      id: "org-admin",
      label: "مدیریت سازمان",
      icon: ShieldCheck,
      items: [
        {
          id: "admin-rbac",
          label: "کاربران و سطوح دسترسی",
          icon: ShieldCheck,
          permission: "MANAGE_USERS_ROLES",
        },
        {
          id: "analytics",
          label: "گزارش‌ها و آمار",
          icon: BarChart3,
          permission: "VIEW_ANALYTICS",
        },
        {
          id: "admin-support-tickets",
          label: "تیکت‌های سازمانی",
          icon: Ticket,
          permission: "MANAGE_ORG_SETTINGS",
        },
      ],
    },
    {
      id: "settings",
      label: "تنظیمات",
      icon: Sliders,
      items: settingsItems,
    },
  ];

  return {
    dashboard: { id: "dashboard", label: "داشبورد", icon: LayoutDashboard },
    groups: groups.map((g) => filterGroup(g, can)).filter(Boolean) as PortalNavGroup[],
    profile: { id: "profile", label: "پروفایل من", icon: User },
  };
}

export function findSidebarGroupForTab(
  model: PortalSidebarModel,
  tab: ActiveTab,
): string | null {
  if (tab === model.dashboard.id || tab === model.profile.id) return null;
  for (const g of model.groups) {
    if (g.items.some((i) => i.id === tab)) return g.id;
  }
  return null;
}

export function flattenSearchableNav(model: PortalSidebarModel): {
  id: ActiveTab;
  label: string;
  category: string;
}[] {
  const out: { id: ActiveTab; label: string; category: string }[] = [
    { id: model.dashboard.id, label: model.dashboard.label, category: "ناوبری" },
    ...model.groups.flatMap((g) =>
      g.items.map((i) => ({ id: i.id, label: i.label, category: g.label })),
    ),
    { id: model.profile.id, label: model.profile.label, category: "حساب" },
  ];
  return out;
}
