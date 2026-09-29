import type { AppNotification } from "../types";
import { query } from "./db";

type NotifRow = {
  id: string;
  user_id: string;
  organization_id: string | null;
  title: string;
  message: string;
  type: string;
  booking_id: string | null;
  room_name: string | null;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  organizer_name: string | null;
  is_read: boolean;
  created_at: Date | string;
};

function mapRow(row: NotifRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    orgId: row.organization_id ?? undefined,
    title: row.title,
    message: row.message,
    type: row.type as AppNotification["type"],
    bookingId: row.booking_id ?? undefined,
    roomName: row.room_name ?? undefined,
    date: row.booking_date ? String(row.booking_date).slice(0, 10) : undefined,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    organizerName: row.organizer_name ?? undefined,
    isRead: row.is_read,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function listUserNotifications(userId: string, limit = 50): Promise<AppNotification[]> {
  const { rows } = await query<NotifRow>(
    `SELECT * FROM user_in_app_notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit],
  );
  return rows.map(mapRow);
}

export async function insertUserNotification(
  userId: string,
  item: Omit<AppNotification, "id" | "createdAt" | "isRead" | "userId">,
): Promise<AppNotification> {
  const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const { rows } = await query<NotifRow>(
    `INSERT INTO user_in_app_notifications (
      id, user_id, organization_id, title, message, type,
      booking_id, room_name, booking_date, start_time, end_time, organizer_name
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *`,
    [
      id,
      userId,
      item.orgId ?? null,
      item.title,
      item.message,
      item.type,
      item.bookingId ?? null,
      item.roomName ?? null,
      item.date ?? null,
      item.startTime ?? null,
      item.endTime ?? null,
      item.organizerName ?? null,
    ],
  );
  return mapRow(rows[0]);
}

export async function markUserNotificationRead(userId: string, notificationId: string): Promise<void> {
  await query(
    `UPDATE user_in_app_notifications SET is_read = true
     WHERE id = $1 AND user_id = $2`,
    [notificationId, userId],
  );
}

export async function markAllUserNotificationsRead(userId: string): Promise<void> {
  await query(`UPDATE user_in_app_notifications SET is_read = true WHERE user_id = $1`, [userId]);
}

export async function clearUserNotifications(userId: string): Promise<void> {
  await query(`DELETE FROM user_in_app_notifications WHERE user_id = $1`, [userId]);
}
