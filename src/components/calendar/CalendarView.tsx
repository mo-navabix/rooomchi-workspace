import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Booking, Room } from '../../types';
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Clock,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  formatGregorianIsoLocal,
  formatToJalali,
  formatToJalaliDescriptive,
  PERSIAN_WEEK_DAYS,
} from '../../utils/jalali';
import { CalendarSkeleton } from '../common/Skeletons';
import { PersianDatePicker } from '../common/PersianDatePicker';
import {
  CalendarDayInfo,
  CalendarTimeGrid,
} from './CalendarTimeGrid';

function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

function todayIso(): string {
  return formatGregorianIsoLocal();
}

function addDaysToIso(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return formatGregorianIsoLocal(d);
}

function dayInfoFromIso(isoDate: string): CalendarDayInfo {
  const d = new Date(`${isoDate}T12:00:00`);
  const jsDay = d.getDay();
  const dayIndex = (jsDay + 1) % 7;
  return {
    dayIndex,
    name: PERSIAN_WEEK_DAYS[dayIndex].name,
    short: PERSIAN_WEEK_DAYS[dayIndex].short,
    isoDate,
    isToday: isoDate === todayIso(),
  };
}

export const CalendarView: React.FC = () => {
  const { currentOrg } = useApp();
  const isNarrow = useMatchMedia('(max-width: 767px)');
  const [currentWeekOffset, setCurrentWeekOffset] = useState<number>(0);
  const [focusDateIso, setFocusDateIso] = useState<string>(() => todayIso());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getWeekDates = useCallback((offsetWeeks: number) => {
    const today = new Date();
    const jsDay = today.getDay();
    const daysSinceShanbeh = (jsDay + 1) % 7;

    const shanbeh = new Date(today);
    shanbeh.setDate(today.getDate() - daysSinceShanbeh + offsetWeeks * 7);

    const days: CalendarDayInfo[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(shanbeh);
      d.setDate(shanbeh.getDate() + i);
      const isoStr = formatGregorianIsoLocal(d);
      days.push({
        dayIndex: i,
        name: PERSIAN_WEEK_DAYS[i].name,
        short: PERSIAN_WEEK_DAYS[i].short,
        isoDate: isoStr,
        isToday: isoStr === todayIso(),
      });
    }
    return days;
  }, []);

  const weekDays = useMemo(
    () => getWeekDates(currentWeekOffset),
    [currentWeekOffset, getWeekDates],
  );
  const startDay = weekDays[0];
  const endDay = weekDays[6];

  const showDayView = isNarrow;

  const gridDays = useMemo(() => {
    if (showDayView) return [dayInfoFromIso(focusDateIso)];
    return weekDays;
  }, [showDayView, focusDateIso, weekDays]);

  const loadData = async () => {
    if (!currentOrg) return;
    try {
      setIsLoading(true);
      const [bookingsData, roomsData] = await Promise.all([
        ApiService.getBookings({ orgId: currentOrg.id, scope: 'all' }),
        ApiService.getRooms({ orgId: currentOrg.id }),
      ]);
      setBookings(bookingsData.filter((b) => b.status !== 'cancelled'));
      setRooms(roomsData);
    } catch (err) {
      console.error('Error loading calendar data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOrg]);

  const activeBookings =
    selectedRoomId === 'all'
      ? bookings
      : bookings.filter((b) => b.roomId === selectedRoomId);

  const gridBookingsByDay = useMemo(
    () =>
      gridDays.map((d) => activeBookings.filter((b) => b.date === d.isoDate)),
    [gridDays, activeBookings],
  );

  const visibleBookingCount = useMemo(() => {
    if (showDayView) {
      return activeBookings.filter((b) => b.date === focusDateIso).length;
    }
    const weekSet = new Set(weekDays.map((d) => d.isoDate));
    return activeBookings.filter((b) => weekSet.has(b.date)).length;
  }, [showDayView, focusDateIso, activeBookings, weekDays]);

  const goToToday = () => {
    setFocusDateIso(todayIso());
    setCurrentWeekOffset(0);
  };

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-5 select-none min-w-0" id="calendar-view">
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-2xl portal-card-pad shadow-xs flex flex-col gap-3">
        <div className="flex flex-col gap-3 min-w-0">
          {showDayView ? (
            <div className="space-y-3">
              <PersianDatePicker
                id="calendar-focus-date"
                label="انتخاب روز"
                value={focusDateIso}
                onChange={setFocusDateIso}
                className="w-full"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFocusDateIso((d) => addDaysToIso(d, -1))}
                  className="p-2 rounded-xl border border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] cursor-pointer"
                  aria-label="روز قبل"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={goToToday}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-[#334155] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] cursor-pointer"
                >
                  امروز
                </button>
                <button
                  type="button"
                  onClick={() => setFocusDateIso((d) => addDaysToIso(d, 1))}
                  className="p-2 rounded-xl border border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] cursor-pointer"
                  aria-label="روز بعد"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 text-center sm:text-right">
                {formatToJalaliDescriptive(focusDateIso)}
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] cursor-pointer"
                  title="هفته قبل"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] cursor-pointer"
                  title="هفته بعد"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={goToToday}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] cursor-pointer"
                >
                  امروز
                </button>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 text-center sm:text-right leading-relaxed">
                {formatToJalali(startDay.isoDate)} الی {formatToJalali(endDay.isoDate)}
                {currentWeekOffset === 0 && (
                  <span className="mr-1.5 text-[11px] font-normal text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    (هفته جاری)
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#334155]">
          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#334155] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#334155] transition-colors cursor-pointer self-end sm:self-auto"
            title="بروزرسانی"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div className="relative flex-1 min-w-0">
            <Filter className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full min-w-0 appearance-none text-xs font-semibold bg-slate-50 dark:bg-[#334155] border border-slate-200 dark:border-[#334155] rounded-xl pr-10 pl-9 py-2.5 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0F786E] cursor-pointer transition-all shadow-2xs"
            >
              <option value="all">همه اتاق‌ها و سالن‌ها ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {showDayView ? (
        <CalendarTimeGrid
          days={gridDays}
          bookingsByDay={gridBookingsByDay}
          rooms={rooms}
        />
      ) : (
        <div className="overflow-x-auto">
          <CalendarTimeGrid
            days={gridDays}
            bookingsByDay={gridBookingsByDay}
            rooms={rooms}
            className="min-w-[760px]"
          />
        </div>
      )}

      <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-2xl portal-card-pad flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {showDayView ? (
              <>
                جلسات این روز: <strong>{visibleBookingCount}</strong>
              </>
            ) : (
              <>
                جلسات این هفته: <strong>{visibleBookingCount}</strong>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
