import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Booking, Room } from '../../types';
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Clock,
  Users,
  Building,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  formatToJalali,
  PERSIAN_WEEK_DAYS,
} from '../../utils/jalali';
import { CalendarSkeleton } from '../common/Skeletons';

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 19;
const HOUR_HEIGHT_PX = 68;
const GRID_HEIGHT_PX = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT_PX;

const HOUR_LABELS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR },
  (_, i) => `${String(DAY_START_HOUR + i).padStart(2, '0')}:00`,
);

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

type PlacedBooking = {
  booking: Booking;
  column: number;
  columnCount: number;
};

/** Side-by-side lanes for overlapping events on the same day. */
function layoutDayBookings(dayBookings: Booking[]): PlacedBooking[] {
  const sorted = [...dayBookings].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );
  const placed: PlacedBooking[] = [];

  for (const booking of sorted) {
    const start = timeToMinutes(booking.startTime);
    const end = timeToMinutes(booking.endTime);

    const overlapping = placed.filter((p) => {
      const ps = timeToMinutes(p.booking.startTime);
      const pe = timeToMinutes(p.booking.endTime);
      return start < pe && end > ps;
    });

    const used = new Set(overlapping.map((p) => p.column));
    let column = 0;
    while (used.has(column)) column += 1;

    const columnCount = Math.max(column + 1, ...overlapping.map((p) => p.columnCount), 1);
    overlapping.forEach((p) => {
      p.columnCount = Math.max(p.columnCount, columnCount);
    });

    placed.push({ booking, column, columnCount });
  }

  return placed;
}

function bookingBlockStyle(
  booking: Booking,
  rooms: Room[],
  paletteIndex: number,
): string {
  const room = rooms.find((r) => r.id === booking.roomId);
  if (room?.color) {
    return 'border-r-[3px] bg-white/95 dark:bg-[#334155]/95 shadow-sm ring-1 ring-slate-200/80 dark:ring-[#334155]';
  }
  const palettes = [
    'border-r-[3px] border-r-[#0F786E] bg-emerald-50/95 dark:bg-emerald-950/50 ring-1 ring-emerald-200/60 dark:ring-emerald-900/50',
    'border-r-[3px] border-r-[#10B981] bg-emerald-50/95 dark:bg-emerald-950/50 ring-1 ring-emerald-200/60 dark:ring-emerald-900/50',
    'border-r-[3px] border-r-[#10B981] bg-teal-50/95 dark:bg-teal-950/50 ring-1 ring-teal-200/60 dark:ring-teal-900/50',
    'border-r-[3px] border-r-amber-500 bg-amber-50/95 dark:bg-amber-950/40 ring-1 ring-amber-200/60 dark:ring-amber-900/40',
  ];
  return palettes[paletteIndex % palettes.length];
}

export const CalendarView: React.FC = () => {
  const { currentOrg, openBookingModal } = useApp();
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'list'>('week');
  const [currentWeekOffset, setCurrentWeekOffset] = useState<number>(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Calculate 7 days for the selected week offset
  // In Persian calendar, week starts on Saturday (شنبه)
  const getWeekDates = (offsetWeeks: number) => {
    const today = new Date();
    // JavaScript day: 0=Sun, 1=Mon, ..., 6=Sat
    // Persian start of week is Saturday.
    // Days since last Saturday:
    const jsDay = today.getDay();
    const daysSinceShanbeh = (jsDay + 1) % 7;
    
    const shanbeh = new Date(today);
    shanbeh.setDate(today.getDate() - daysSinceShanbeh + offsetWeeks * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(shanbeh);
      d.setDate(shanbeh.getDate() + i);
      const isoStr = d.toISOString().split('T')[0];
      days.push({
        dayIndex: i, // 0 = شنبه, 6 = جمعه
        name: PERSIAN_WEEK_DAYS[i].name,
        short: PERSIAN_WEEK_DAYS[i].short,
        isoDate: isoStr,
        isToday: isoStr === today.toISOString().split('T')[0],
      });
    }
    return days;
  };

  const weekDays = getWeekDates(currentWeekOffset);
  const startDay = weekDays[0];
  const endDay = weekDays[6];

  const loadData = async () => {
    if (!currentOrg) return;
    try {
      setIsLoading(true);
      const [bookingsData, roomsData] = await Promise.all([
        ApiService.getBookings({ orgId: currentOrg.id }),
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

  // Filter by room
  const activeBookings = selectedRoomId === 'all'
    ? bookings
    : bookings.filter((b) => b.roomId === selectedRoomId);

  const weekBookingsByDay = weekDays.map((d) =>
    activeBookings.filter((b) => b.date === d.isoDate),
  );

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="space-y-5 select-none" id="calendar-view">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            تقویم جلسات
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            مشاهده تقویم هفتگی و وضعیت اشغال اتاق‌های {currentOrg?.name}
          </p>
        </div>

        {/* View mode switcher tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#1E293B] rounded-xl border border-slate-200/70 dark:border-[#334155]">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'day'
                ? 'bg-white dark:bg-[#334155] text-[#10B981] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            روز
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'week'
                ? 'bg-[#0F786E] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            هفته
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'month'
                ? 'bg-[#0F786E] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ماه
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#0F786E] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            لیست
          </button>
        </div>
      </div>

      {/* Action Bar with Date Selector and Add Booking Button */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-2xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Primary Action Button: + رزرو جلسه */}
          <button
            onClick={() => openBookingModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0F786E] hover:bg-[#0D6B63] shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>رزرو جلسه</span>
          </button>

          {/* Date Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] cursor-pointer"
              title="هفته قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] cursor-pointer"
              title="هفته بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentWeekOffset(0)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] cursor-pointer"
            >
              امروز
            </button>
          </div>

          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mr-2">
            {formatToJalali(startDay.isoDate)} الی {formatToJalali(endDay.isoDate)}
            {currentWeekOffset === 0 && (
              <span className="mr-1.5 text-[11px] font-normal text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                (هفته جاری)
              </span>
            )}
          </span>
        </div>

        {/* Room Filter Dropdown & Refresh Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#334155] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#334155] transition-colors cursor-pointer"
            title="بروزرسانی زنده اطلاعات"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="text-xs font-semibold bg-slate-50 dark:bg-[#334155] border border-slate-200 dark:border-[#334155] rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0F786E]"
            >
              <option value="all">همه اتاق‌ها و سالن‌ها ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Weekly Calendar Grid */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-3xl shadow-xs overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Days Header */}
          <div className="grid grid-cols-8 border-b border-slate-200/80 dark:border-[#334155] bg-slate-50/50 dark:bg-[#0F172A]/50 text-center text-xs font-bold text-slate-600 dark:text-slate-300">
            <div className="p-3.5 border-l border-slate-200/80 dark:border-[#334155] text-slate-400">
              ساعت
            </div>
            {weekDays.map((d) => (
              <div
                key={d.isoDate}
                className={`p-3.5 border-l border-slate-200/80 dark:border-[#334155] last:border-l-0 ${
                  d.isToday ? 'bg-emerald-50/60 dark:bg-emerald-950/40 text-[#0F786E] dark:text-emerald-300 font-black' : ''
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <span>{d.name}</span>
                    {d.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F786E] inline-block animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {formatToJalali(d.isoDate).split('/')[2]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Timetable — one continuous grid per day (no duplicate absolute blocks) */}
          <div className="grid grid-cols-8 text-xs">
            {/* Hour labels */}
            <div
              className="relative border-l border-slate-200/80 dark:border-[#334155] bg-slate-50/30 dark:bg-[#0F172A]/30"
              style={{ height: GRID_HEIGHT_PX }}
            >
              {HOUR_LABELS.map((hour, index) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 flex items-start justify-center pt-0.5 font-mono text-[10px] text-slate-400 dark:text-slate-500"
                  style={{ top: index * HOUR_HEIGHT_PX }}
                >
                  {hour}
                </div>
              ))}
            </div>

            {weekDays.map((d, dayIndex) => {
              const placed = layoutDayBookings(weekBookingsByDay[dayIndex]);

              return (
                <div
                  key={d.isoDate}
                  className={`relative border-l border-slate-200/80 dark:border-[#334155] last:border-l-0 cursor-pointer ${
                    d.isToday ? 'bg-emerald-50/25 dark:bg-emerald-950/15' : 'bg-white dark:bg-[#1E293B]'
                  }`}
                  style={{ height: GRID_HEIGHT_PX }}
                  onClick={() => openBookingModal()}
                  title="کلیک برای رزرو جدید"
                >
                  {/* Hour grid lines */}
                  {HOUR_LABELS.map((hour, index) => (
                    <div
                      key={hour}
                      className="absolute inset-x-0 border-t border-slate-100 dark:border-[#334155]/70 pointer-events-none"
                      style={{ top: index * HOUR_HEIGHT_PX }}
                    />
                  ))}
                  <div
                    className="absolute inset-x-0 bottom-0 border-t border-slate-100 dark:border-[#334155]/70 pointer-events-none"
                  />

                  {placed.map(({ booking: bk, column, columnCount }, bkIdx) => {
                    const gridStartMin = DAY_START_HOUR * 60;
                    const gridEndMin = DAY_END_HOUR * 60;
                    const startMin = Math.max(gridStartMin, timeToMinutes(bk.startTime));
                    const endMin = Math.min(gridEndMin, timeToMinutes(bk.endTime));
                    const durationMin = Math.max(15, endMin - startMin);

                    const topPx =
                      ((startMin - gridStartMin) / 60) * HOUR_HEIGHT_PX + 2;
                    const heightPx = Math.max(
                      36,
                      (durationMin / 60) * HOUR_HEIGHT_PX - 4,
                    );

                    const gap = 4;
                    const widthPercent = 100 / columnCount;
                    const leftPercent = column * widthPercent;

                    const room = rooms.find((r) => r.id === bk.roomId);
                    const accentColor = room?.color ?? '#0F786E';
                    const styleClass = bookingBlockStyle(bk, rooms, bkIdx);
                    const compact = heightPx < 52;

                    return (
                      <div
                        key={bk.id}
                        role="button"
                        tabIndex={0}
                        style={{
                          top: topPx,
                          height: heightPx,
                          left: `calc(${leftPercent}% + ${gap / 2}px)`,
                          width: `calc(${widthPercent}% - ${gap}px)`,
                          borderRightColor: accentColor,
                          zIndex: 10 + column,
                        }}
                        className={`absolute rounded-lg px-2 py-1.5 text-right overflow-hidden hover:brightness-[0.98] dark:hover:brightness-110 transition-[filter,box-shadow] hover:shadow-md ${styleClass}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openBookingModal();
                        }}
                        title={`${bk.title}\n${bk.roomName}\n${bk.startTime} – ${bk.endTime}`}
                      >
                        <p
                          className={`font-bold text-slate-800 dark:text-slate-100 leading-snug ${
                            compact ? 'text-[10px] line-clamp-1' : 'text-[11px] line-clamp-2'
                          }`}
                        >
                          {bk.title}
                        </p>
                        {!compact && (
                          <>
                            <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                              {bk.roomName}
                            </p>
                            <p className="text-[9px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                              {bk.startTime} – {bk.endTime}
                            </p>
                            {bk.organizerName && (
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {bk.organizerName}
                              </p>
                            )}
                          </>
                        )}
                        {compact && (
                          <p className="text-[9px] font-mono text-slate-500 dark:text-slate-400 truncate">
                            {bk.startTime} – {bk.endTime}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Footer for Quick Booking count */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>
            تعداد کل جلسات ثبت شده در این بازه: <strong>{activeBookings.length}</strong> جلسه
          </span>
        </div>
        <button
          onClick={() => openBookingModal()}
          className="text-emerald-600 dark:text-emerald-300 font-bold hover:underline cursor-pointer"
        >
          + ثبت رزرو برای ساعت‌های خالی
        </button>
      </div>
    </div>
  );
};
