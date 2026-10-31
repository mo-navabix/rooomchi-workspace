import { formatGregorianIsoLocal } from './jalali';

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map((x) => parseInt(x, 10));
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function latestEndTimeForStart(
  startTime: string,
  workEnd: string,
  maxBookingHours: number,
): string {
  const startMin = parseTimeToMinutes(startTime);
  const workEndMin = parseTimeToMinutes(workEnd);
  const capMin = startMin + Math.max(0.25, maxBookingHours) * 60;
  return minutesToTime(Math.min(workEndMin, capMin));
}

export function validateBookingTimes(
  startTime: string,
  endTime: string,
  workStart: string,
  workEnd: string,
  maxBookingHours: number,
): string | null {
  if (!startTime || !endTime) return 'ساعت شروع و پایان را مشخص کنید';
  if (startTime >= endTime) return 'ساعت پایان باید بعد از شروع باشد';

  const s = parseTimeToMinutes(startTime);
  const e = parseTimeToMinutes(endTime);
  const ws = parseTimeToMinutes(workStart);
  const we = parseTimeToMinutes(workEnd);

  if (s < ws || e > we) {
    return `رزرو فقط در بازه ${workStart} تا ${workEnd} مجاز است`;
  }

  const durationHours = (e - s) / 60;
  if (durationHours > maxBookingHours) {
    return `حداکثر طول هر جلسه ${maxBookingHours} ساعت است`;
  }

  return null;
}

export function minBookableDateIso(now: Date = new Date()): string {
  return formatGregorianIsoLocal(now);
}

/** Round up to next slot (default 15 minutes) for “earliest bookable” today. */
export function roundMinutesUpToSlot(totalMinutes: number, slotMinutes = 15): number {
  const slot = Math.max(1, slotMinutes);
  return Math.ceil(totalMinutes / slot) * slot;
}

export function localMinutesNow(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

/** Earliest allowed start time on `date` (local calendar), within work hours. */
export function earliestStartTimeForDate(
  date: string,
  workStart: string,
  workEnd: string,
  now: Date = new Date(),
): string {
  const today = minBookableDateIso(now);
  const ws = parseTimeToMinutes(workStart);
  const we = parseTimeToMinutes(workEnd);

  if (date < today) return workEnd;
  if (date > today) return workStart;

  const earliest = Math.max(ws, roundMinutesUpToSlot(localMinutesNow(now), 15));
  if (earliest >= we) return workEnd;
  return minutesToTime(earliest);
}

export function validateBookingSchedule(params: {
  date: string;
  startTime: string;
  endTime: string;
  workStart: string;
  workEnd: string;
  maxBookingHours: number;
  now?: Date;
}): string | null {
  const { date, startTime, endTime, workStart, workEnd, maxBookingHours } = params;
  const now = params.now ?? new Date();
  const today = minBookableDateIso(now);

  if (date < today) {
    return 'امکان رزرو برای تاریخ گذشته وجود ندارد';
  }

  const rulesError = validateBookingTimes(
    startTime,
    endTime,
    workStart,
    workEnd,
    maxBookingHours,
  );
  if (rulesError) return rulesError;

  if (date === today) {
    const nowMin = localMinutesNow(now);
    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);
    if (startMin < nowMin) {
      return 'ساعت شروع نمی‌تواند در گذشته باشد';
    }
    if (endMin <= nowMin) {
      return 'بازه زمانی انتخاب‌شده در گذشته است';
    }
  }

  return null;
}

/** Clamp start/end when user picks today or changes date to today. */
export function clampBookingTimesForDate(
  date: string,
  startTime: string,
  endTime: string,
  workStart: string,
  workEnd: string,
  maxBookingHours: number,
  now: Date = new Date(),
): { startTime: string; endTime: string } {
  const earliest = earliestStartTimeForDate(date, workStart, workEnd, now);
  let start = startTime;
  if (parseTimeToMinutes(start) < parseTimeToMinutes(earliest)) {
    start = earliest;
  }
  let end = endTime;
  if (end <= start) {
    end = latestEndTimeForStart(start, workEnd, maxBookingHours);
    if (end <= start) {
      const [sh, sm] = start.split(':').map(Number);
      end = minutesToTime((sh || 0) * 60 + (sm || 0) + 60);
      if (end > workEnd) end = workEnd;
    }
  }
  return { startTime: start, endTime: end };
}

/** Whether a calendar hour slot can start a new booking. */
export function isCalendarSlotBookable(
  isoDate: string,
  slotStartTime: string,
  now: Date = new Date(),
): boolean {
  const today = minBookableDateIso(now);
  if (isoDate < today) return false;
  if (isoDate > today) return true;
  return parseTimeToMinutes(slotStartTime) >= localMinutesNow(now);
}
