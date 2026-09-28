import type { AppNotification } from "../types";

const LEGACY_KEY = "roomchi_notifications_v1";

export function getNotificationsStorageKey(userId: string): string {
  return `roomchi_notifications_v1_${userId}`;
}

function createWelcomeNotification(userId: string, orgId?: string): AppNotification {
  return {
    id: `notif-welcome-${userId}`,
    userId,
    orgId,
    title: "به سامانه روم‌چی خوش آمدید",
    message: "سامانه مدیریت و رزرو هوشمند اتاق‌های جلسات آماده بهره‌برداری است.",
    type: "system",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  };
}

export function loadNotificationsForUser(
  userId: string,
  orgId?: string,
): AppNotification[] {
  const key = getNotificationsStorageKey(userId);
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved) as AppNotification[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((n) => ({ ...n, userId: n.userId || userId }));
      }
    }
  } catch {
    /* ignore */
  }
  return [createWelcomeNotification(userId, orgId)];
}

export function saveNotificationsForUser(
  userId: string,
  items: AppNotification[],
): void {
  try {
    localStorage.setItem(getNotificationsStorageKey(userId), JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

/** One-time: drop shared inbox so users do not inherit each other's list. */
export function dropLegacySharedNotifications(): void {
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}
