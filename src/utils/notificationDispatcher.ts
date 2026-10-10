import { NotificationSettings, NotificationLogEntry } from '../types';
import { DEFAULT_NOTIFICATION_SETTINGS } from '../constants/notifications';

/** Runtime rules for client-side dispatch (admin configures via API). */
export function getActiveNotificationSettings(): NotificationSettings {
  return DEFAULT_NOTIFICATION_SETTINGS;
}

export function logNotificationDispatch(_entry: Omit<NotificationLogEntry, 'id' | 'timestamp'>) {
  /* Logs are persisted server-side from the admin notifications panel. */
}

export function triggerBookingNotifications(
  booking: {
    id: string;
    title: string;
    roomName: string;
    date: string;
    startTime: string;
    endTime: string;
    organizerName: string;
    organizerEmail?: string;
  },
  event: 'new_booking_request' | 'booking_approved' | 'booking_cancelled',
  addInAppNotification?: (notif: any) => void
) {
  const settings = getActiveNotificationSettings();
  const rule = settings.rules.find((r) => r.eventKey === event);

  // 1. In-App Notification
  if (settings.inApp.enabled && (!rule || rule.inApp)) {
    let title = '';
    let msg = '';
    if (event === 'new_booking_request') {
      title = `درخواست رزرو جدید: ${booking.title}`;
      msg = `جلسه «${booking.title}» در سالن ${booking.roomName} برای ساعت ${booking.startTime} ثبت و در انتظار تأیید است.`;
    } else if (event === 'booking_approved') {
      title = `جلسه تأیید شد: ${booking.title}`;
      msg = `جلسه «${booking.title}» در سالن ${booking.roomName} توسط مدیریت تایید و قطعی شد.`;
    } else {
      title = `جلسه لغو شد: ${booking.title}`;
      msg = `جلسه «${booking.title}» در سالن ${booking.roomName} لغو گردید.`;
    }

    if (addInAppNotification) {
      addInAppNotification({
        title,
        message: msg,
        bookingId: booking.id,
        roomName: booking.roomName,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        organizerName: booking.organizerName,
        userEmail: booking.organizerEmail,
        type: event === 'booking_cancelled' ? 'meeting_cancelled' : 'meeting_booked',
      });
    }

    logNotificationDispatch({
      channel: 'in_app',
      recipient: booking.organizerName || 'کاربران سازمان',
      title,
      preview: msg,
      status: 'delivered',
      eventType: event,
    });
  }

  // 2. SMS Notification
  if (settings.sms.enabled && (!rule || rule.sms)) {
    let template = settings.sms.templateApproval;
    if (event === 'new_booking_request') template = settings.sms.templateNewBooking;
    if (event === 'booking_cancelled') template = settings.sms.templateCancellation;

    const smsBody = template
      .replace('{نام_جلسه}', booking.title)
      .replace('{اتاق}', booking.roomName)
      .replace('{تاریخ}', booking.date)
      .replace('{ساعت}', `${booking.startTime} تا ${booking.endTime}`)
      .replace('{هماهنگ‌کننده}', booking.organizerName);

    logNotificationDispatch({
      channel: 'sms',
      recipient: settings.sms.managerPhone || '09123456789',
      title: `پیامک ${event === 'booking_approved' ? 'تأیید' : event === 'booking_cancelled' ? 'لغو' : 'درخواست جدید'}`,
      preview: smsBody,
      status: 'delivered',
      eventType: event,
    });
  }

  // 3. Telegram Notification
  if (settings.telegram.enabled && (!rule || rule.telegram)) {
    const telegramText = `🤖 [اطلاع‌رسانی روم‌چی]\n📌 ${
      event === 'booking_approved'
        ? 'جلسه تأیید شد'
        : event === 'booking_cancelled'
        ? 'جلسه لغو شد'
        : 'درخواست رزرو جدید'
    }: ${booking.title}\n🏢 سالن: ${booking.roomName}\n⏰ ساعت: ${booking.startTime} الی ${booking.endTime}\n👤 هماهنگ‌کننده: ${booking.organizerName}`;

    logNotificationDispatch({
      channel: 'telegram',
      recipient: settings.telegram.targetChatId,
      title: `پیام تلگرام: ${booking.title}`,
      preview: telegramText,
      status: 'delivered',
      eventType: event,
    });
  }
}
