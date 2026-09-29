import { formatGregorianIsoLocal } from '../../utils/jalali';
import {
  getOrgWeekDays,
  weekStartsOnSaturday,
  type OrgLocalePreferences,
} from '../../utils/orgLocale';
import type { CalendarDayInfo } from './CalendarTimeGrid';

export function todayIso(): string {
  return formatGregorianIsoLocal();
}

export function addDaysToIso(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return formatGregorianIsoLocal(d);
}

export function dayInfoFromIso(isoDate: string, prefs: OrgLocalePreferences): CalendarDayInfo {
  const d = new Date(`${isoDate}T12:00:00`);
  const jsDay = d.getDay();
  const weekDays = getOrgWeekDays(prefs);
  const dayIndex = weekStartsOnSaturday(prefs) ? (jsDay + 1) % 7 : jsDay;
  const labels = weekDays[dayIndex] ?? weekDays[0];
  return {
    dayIndex,
    name: labels.name,
    short: labels.short,
    isoDate,
    isToday: isoDate === todayIso(),
  };
}

export function getWeekDates(offsetWeeks: number, prefs: OrgLocalePreferences): CalendarDayInfo[] {
  const today = new Date();
  const jsDay = today.getDay();
  const weekStart = new Date(today);

  if (weekStartsOnSaturday(prefs)) {
    const daysSinceShanbeh = (jsDay + 1) % 7;
    weekStart.setDate(today.getDate() - daysSinceShanbeh + offsetWeeks * 7);
  } else {
    weekStart.setDate(today.getDate() - jsDay + offsetWeeks * 7);
  }

  const weekDays = getOrgWeekDays(prefs);
  const days: CalendarDayInfo[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const isoStr = formatGregorianIsoLocal(d);
    const js = d.getDay();
    const dayIndex = weekStartsOnSaturday(prefs) ? (js + 1) % 7 : js;
    days.push({
      dayIndex,
      name: weekDays[dayIndex]?.name ?? '',
      short: weekDays[dayIndex]?.short ?? '',
      isoDate: isoStr,
      isToday: isoStr === todayIso(),
    });
  }
  return days;
}
