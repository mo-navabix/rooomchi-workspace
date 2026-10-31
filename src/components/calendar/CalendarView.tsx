import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Booking, Room } from '../../types';
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Clock,
  Filter,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { CalendarSkeleton } from '../common/Skeletons';
import { OrgDatePicker } from '../common/OrgDatePicker';
import {
  CalendarTimeGrid,
} from './CalendarTimeGrid';
import {
  addDaysToIso,
  dayInfoFromIso,
  getWeekDates,
  todayIso,
} from './calendarWeekUtils';
import {
  minutesToTime,
  parseTimeToMinutes,
  isCalendarSlotBookable,
  minBookableDateIso,
} from '../../utils/bookingRules';

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

export const CalendarView: React.FC = () => {
  const { currentOrg, orgLocale, openBookingModal, bookingsDataVersion } =
    useApp();
  const isNarrow = useMatchMedia('(max-width: 767px)');
  const [currentWeekOffset, setCurrentWeekOffset] = useState<number>(0);
  const [focusDateIso, setFocusDateIso] = useState<string>(() => todayIso());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const weekDays = useMemo(
    () => getWeekDates(currentWeekOffset, orgLocale),
    [currentWeekOffset, orgLocale],
  );
  const startDay = weekDays[0];
  const endDay = weekDays[6];

  const showDayView = isNarrow;

  const gridDays = useMemo(() => {
    if (showDayView) return [dayInfoFromIso(focusDateIso, orgLocale)];
    return weekDays;
  }, [showDayView, focusDateIso, weekDays, orgLocale]);

  const loadData = async (silent = false) => {
    if (!currentOrg) return;
    try {
      if (!silent) setIsLoading(true);
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
    loadData(bookingsDataVersion > 0);
  }, [currentOrg, bookingsDataVersion]);

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

  const handleReserveRoom = () => {
    if (selectedRoomId !== 'all') {
      const room = rooms.find((r) => r.id === selectedRoomId);
      openBookingModal(room);
      return;
    }
    openBookingModal();
  };

  const handleCalendarSlotClick = (isoDate: string, startTime: string) => {
    if (!isCalendarSlotBookable(isoDate, startTime)) {
      return;
    }
    const workEnd = currentOrg?.workHours?.end ?? '18:00';
    const oneHourEnd = minutesToTime(parseTimeToMinutes(startTime) + 60);
    const endTime =
      parseTimeToMinutes(oneHourEnd) <= parseTimeToMinutes(workEnd)
        ? oneHourEnd
        : workEnd;
    const room =
      selectedRoomId !== 'all'
        ? rooms.find((r) => r.id === selectedRoomId)
        : undefined;
    openBookingModal(room, { date: isoDate, startTime, endTime });
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
              <OrgDatePicker
                id="calendar-focus-date"
                label={orgLocale.t('selectDay')}
                value={focusDateIso}
                minDate={minBookableDateIso()}
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
                  {orgLocale.t('today')}
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
                {orgLocale.formatDateLong(focusDateIso)}
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
                  {orgLocale.t('today')}
                </button>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 text-center sm:text-right leading-relaxed">
                {orgLocale.formatDate(startDay.isoDate)}
                {orgLocale.language === 'en' ? ' – ' : ' الی '}
                {orgLocale.formatDate(endDay.isoDate)}
                {currentWeekOffset === 0 && (
                  <span className="mr-1.5 text-[11px] font-normal text-brand dark:text-[var(--brand-primary-on-dark)] bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.2)] px-2 py-0.5 rounded-md">
                    {orgLocale.language === 'en' ? '(This week)' : '(هفته جاری)'}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#334155]">
          <button
            type="button"
            onClick={handleReserveRoom}
            className="portal-btn-primary flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs sm:text-sm font-bold cursor-pointer shadow-sm shadow-[rgb(var(--brand-primary-rgb)/0.15)] dark:shadow-black/30 shrink-0 w-full sm:w-auto sm:ms-auto order-first sm:order-last"
          >
            <Plus className="w-4 h-4" />
            <span>رزرو اتاق</span>
          </button>
          <button
            type="button"
            onClick={() => loadData()}
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
              className="w-full min-w-0 appearance-none text-xs font-semibold bg-slate-50 dark:bg-[#334155] border border-slate-200 dark:border-[#334155] rounded-xl pr-10 pl-9 py-2.5 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary)] cursor-pointer transition-all shadow-2xs"
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
          onSlotClick={handleCalendarSlotClick}
        />
      ) : (
        <div className="overflow-x-auto">
          <CalendarTimeGrid
            days={gridDays}
            bookingsByDay={gridBookingsByDay}
            rooms={rooms}
            className="min-w-[760px]"
            onSlotClick={handleCalendarSlotClick}
          />
        </div>
      )}

      <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-2xl portal-card-pad flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Clock className="w-4 h-4 text-brand shrink-0" />
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
