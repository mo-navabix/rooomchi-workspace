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
