import { mergeNotificationSettings } from "../../constants/notifications";
import type { Booking, NotificationLogEntry, NotificationSettings } from "../types";
import { getOrgNotificationBundle, saveOrgNotificationBundle } from "../admin/system-settings.store";
import { query } from "../persistence/db";
import * as store from "../persistence/store";
import * as userNotifications from "../persistence/user-notifications.store";
import { logger } from "../logger";

type ReminderDispatchState = Record<string, string>;

function bookingStartMs(booking: Booking): number {
  const datePart = String(booking.date).slice(0, 10);
  const timePart = (booking.startTime || "00:00").slice(0, 5);
  return new Date(`${datePart}T${timePart}:00`).getTime();
}

function applySmsTemplate(template: string, booking: Booking): string {
  return template
    .replace("{نام_جلسه}", booking.title)
    .replace("{اتاق}", booking.roomName)
    .replace("{تاریخ}", String(booking.date).slice(0, 10))
    .replace("{ساعت}", booking.startTime)
    .replace("{هماهنگ‌کننده}", booking.organizerName);
}

function buildTelegramReminderText(booking: Booking, minutesBefore: number): string {
  return (
    `⏰ [یادآوری روم‌چی]\n` +
    `جلسه «${booking.title}» ${minutesBefore} دقیقه دیگر در سالن ${booking.roomName} آغاز می‌شود.\n` +
    `🕐 ساعت: ${booking.startTime}\n` +
    `👤 هماهنگ‌کننده: ${booking.organizerName}`
  );
}

async function loadOrgSettings(organizationId: string): Promise<NotificationSettings> {
  const bundle = await getOrgNotificationBundle(organizationId);
  return mergeNotificationSettings(bundle.settings);
}

async function getReminderDispatchState(organizationId: string): Promise<ReminderDispatchState> {
  const { rows } = await query<{ reminder_dispatch_state: unknown }>(
    `SELECT reminder_dispatch_state FROM system_settings WHERE organization_id = $1`,
    [organizationId],
  );
  const raw = rows[0]?.reminder_dispatch_state;
  return raw && typeof raw === "object" ? (raw as ReminderDispatchState) : {};
}

async function markReminderSlotSent(organizationId: string, slotKey: string): Promise<void> {
  await query(
    `UPDATE system_settings
     SET reminder_dispatch_state = COALESCE(reminder_dispatch_state, '{}'::jsonb) || $2::jsonb,
         updated_at = NOW()
     WHERE organization_id = $1`,
    [organizationId, JSON.stringify({ [slotKey]: new Date().toISOString() })],
  );
}

async function appendNotificationLog(
  organizationId: string,
  entry: Omit<NotificationLogEntry, "id" | "timestamp">,
): Promise<void> {
  const bundle = await getOrgNotificationBundle(organizationId);
  const logs = Array.isArray(bundle.logs) ? (bundle.logs as NotificationLogEntry[]) : [];
  const newEntry: NotificationLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toLocaleString("fa-IR"),
  };
  await saveOrgNotificationBundle(organizationId, bundle.settings, [newEntry, ...logs].slice(0, 200));
}

async function dispatchMeetingReminder(
  organizationId: string,
  booking: Booking,
  settings: NotificationSettings,
  minutesBefore: number,
): Promise<void> {
  const mr = settings.meetingReminders;
  const rule = settings.rules.find((r) => r.eventKey === "meeting_reminder_15m");
  const smsAllowed = mr.channels.sms && settings.sms.enabled && (!rule || rule.sms);
  const telegramAllowed =
    mr.channels.telegram && settings.telegram.enabled && (!rule || rule.telegram);
  const inAppAllowed = mr.channels.inApp && settings.inApp.enabled && (!rule || rule.inApp);

  const title = `یادآوری جلسه: ${booking.title}`;
  const inAppMessage = `جلسه «${booking.title}» ${minutesBefore} دقیقه دیگر در سالن ${booking.roomName} (ساعت ${booking.startTime}) آغاز می‌شود.`;

  if (inAppAllowed && mr.notifyOrganizer) {
    const user = await store.findUserByEmail(booking.organizerEmail);
    if (user?.id) {
      await userNotifications.insertUserNotification(user.id, {
        orgId: organizationId,
        title,
        message: inAppMessage,
        type: "meeting_reminder",
        bookingId: booking.id,
        roomName: booking.roomName,
        date: String(booking.date).slice(0, 10),
        startTime: booking.startTime,
        endTime: booking.endTime,
        organizerName: booking.organizerName,
      });
    }
    await appendNotificationLog(organizationId, {
      channel: "in_app",
      recipient: booking.organizerName,
      title,
      preview: inAppMessage,
      status: "delivered",
      eventType: "meeting_reminder_15m",
    });
  }

  if (smsAllowed) {
    const body = applySmsTemplate(settings.sms.templateReminder, booking);
    const recipient = settings.sms.managerPhone?.trim() || "";
    if (!recipient) {
      await appendNotificationLog(organizationId, {
        channel: "sms",
        recipient: "—",
        title: `یادآوری ${minutesBefore} دقیقه‌ای`,
        preview: body,
        status: "failed",
        eventType: "meeting_reminder_15m",
      });
    } else {
      const { sendOrgSms } = await import("./sms.service");
      const sent = await sendOrgSms(organizationId, recipient, body);
      await appendNotificationLog(organizationId, {
        channel: "sms",
        recipient,
        title: `یادآوری ${minutesBefore} دقیقه‌ای`,
        preview: body,
        status: sent.ok ? "delivered" : "failed",
        eventType: "meeting_reminder_15m",
      });
    }
  }

  if (telegramAllowed) {
    const text = buildTelegramReminderText(booking, minutesBefore);
    await appendNotificationLog(organizationId, {
      channel: "telegram",
      recipient: settings.telegram.targetChatId,
      title: `یادآوری: ${booking.title}`,
      preview: text,
      status: "queued",
      eventType: "meeting_reminder_15m",
    });
  }
}

export async function runMeetingReminderTick(): Promise<number> {
  const orgs = await store.listOrganizations();
  const now = Date.now();
  let dispatched = 0;

  for (const org of orgs) {
    let settings: NotificationSettings;
    try {
      settings = await loadOrgSettings(org.id);
    } catch (err) {
      logger.warn({ err, orgId: org.id }, "meeting_reminder_settings_load_failed");
      continue;
    }

    if (!settings.meetingReminders?.enabled) continue;

    const minutesBefore = settings.meetingReminders.minutesBefore || 15;
    const dispatchState = await getReminderDispatchState(org.id);
    const bookings = await store.listBookings({ orgId: org.id, status: "confirmed" });

    for (const booking of bookings) {
      const startMs = bookingStartMs(booking);
      if (!Number.isFinite(startMs)) continue;

      const fireAt = startMs - minutesBefore * 60 * 1000;
      const slotKey = `${booking.id}:${minutesBefore}`;
      if (dispatchState[slotKey]) continue;
      if (now < fireAt || now > startMs) continue;

      try {
        await dispatchMeetingReminder(org.id, booking, settings, minutesBefore);
        await markReminderSlotSent(org.id, slotKey);
        dispatched += 1;
      } catch (err) {
        logger.warn({ err, bookingId: booking.id, orgId: org.id }, "meeting_reminder_dispatch_failed");
      }
    }
  }

  if (dispatched > 0) {
    logger.info({ dispatched }, "meeting_reminder_tick_complete");
  }
  return dispatched;
}

let schedulerStarted = false;

export function startMeetingReminderScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;
  const intervalMs = Number(process.env.MEETING_REMINDER_TICK_MS) || 60_000;
  setInterval(() => {
    void runMeetingReminderTick().catch((err) =>
      logger.warn({ err }, "meeting_reminder_tick_failed"),
    );
  }, intervalMs);
  void runMeetingReminderTick().catch((err) =>
    logger.warn({ err }, "meeting_reminder_tick_failed"),
  );
}
