import type { AppNotification } from "../types";

const LEGACY_KEY = "roomchi_notifications_v1";

export function getNotificationsStorageKey(userId: string): string {
  return `roomchi_notifications_v1_${userId}`;
}

export function loadNotificationsForUser(
  userId: string,
  _orgId?: string,
): AppNotification[] {
  const key = getNotificationsStorageKey(userId);
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved) as AppNotification[];
      if (Array.isArray(parsed)) {
        return parsed.map((n) => ({ ...n, userId: n.userId || userId }));
      }
    }
  } catch {
    /* ignore */
  }
  return [];
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
