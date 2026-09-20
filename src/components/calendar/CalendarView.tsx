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
  formatToJalaliDescriptive,
  formatToJalali,
  toPersianDigits,
  getCurrentJalaliDate,
  PERSIAN_WEEK_DAYS,
} from '../../utils/jalali';

export const CalendarView: React.FC = () => {
  const { currentOrg, openBookingModal } = useApp();
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'list'>('week');
  const [currentWeekOffset, setCurrentWeekOffset] = useState<number>(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Hours array from 08:00 to 18:00
  const hours = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ];

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

  // Map each room to an accent color
  const getRoomColorStyle = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room?.color) {
      return {
        borderColor: room.color,
      };
    }
    return {};
  };

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
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#111A2E] rounded-xl border border-slate-200/70 dark:border-[#1E2E50]">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'day'
                ? 'bg-white dark:bg-[#1E2E50] text-[#2563EB] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            روز
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'week'
                ? 'bg-[#4F46E5] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            هفته
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'month'
                ? 'bg-[#4F46E5] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ماه
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#4F46E5] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            لیست
          </button>
        </div>
      </div>

      {/* Action Bar with Date Selector and Add Booking Button */}
      <div className="bg-white dark:bg-[#111A2E] border border-slate-200/80 dark:border-[#1E2E50] rounded-2xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Primary Action Button: + رزرو جلسه */}
          <button
            onClick={() => openBookingModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>رزرو جلسه</span>
          </button>

          {/* Date Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1E2E50] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16243F] cursor-pointer"
              title="هفته قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1E2E50] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16243F] cursor-pointer"
              title="هفته بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentWeekOffset(0)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E2E50] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16243F] cursor-pointer"
            >
              امروز
            </button>
          </div>

          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mr-2">
            {formatToJalali(startDay.isoDate)} الی {formatToJalali(endDay.isoDate)}
            {currentWeekOffset === 0 && (
              <span className="mr-1.5 text-[11px] font-normal text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                (هفته جاری)
              </span>
            )}
          </span>
        </div>

        {/* Room Filter Dropdown & Refresh Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#1E2E50] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#16243F] transition-colors cursor-pointer"
            title="بروزرسانی زنده اطلاعات"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="text-xs font-semibold bg-slate-50 dark:bg-[#16243F] border border-slate-200 dark:border-[#1E2E50] rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
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
      <div className="bg-white dark:bg-[#111A2E] border border-slate-200/80 dark:border-[#1E2E50] rounded-3xl shadow-xs overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Days Header */}
          <div className="grid grid-cols-8 border-b border-slate-200/80 dark:border-[#1E2E50] bg-slate-50/50 dark:bg-[#0E1729]/50 text-center text-xs font-bold text-slate-600 dark:text-slate-300">
            <div className="p-3.5 border-l border-slate-200/80 dark:border-[#1E2E50] text-slate-400">
              ساعت
            </div>
            {weekDays.map((d) => (
              <div
                key={d.isoDate}
                className={`p-3.5 border-l border-slate-200/80 dark:border-[#1E2E50] last:border-l-0 ${
                  d.isToday ? 'bg-indigo-50/60 dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-400 font-black' : ''
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <span>{d.name}</span>
                    {d.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] inline-block animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {formatToJalali(d.isoDate).split('/')[2]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Timetable Rows */}
          <div className="relative divide-y divide-slate-100 dark:divide-[#1E2E50]/60 text-xs">
            {hours.map((hour) => {
              const [hourNum] = hour.split(':').map(Number);

              return (
                <div key={hour} className="grid grid-cols-8 h-20 min-h-[80px]">
                  {/* Hour Label */}
                  <div className="p-2 border-l border-slate-100 dark:border-[#1E2E50]/60 text-center font-mono text-slate-400 dark:text-slate-500 flex items-start justify-center text-[11px]">
                    {hour}
                  </div>

                  {/* 7 Columns for Days */}
                  {weekDays.map((d) => {
                    // Find any booking matching this specific date and hour slot
                    const slotBookings = activeBookings.filter((b) => {
                      if (b.date !== d.isoDate) return false;
                      const [bStartHour] = b.startTime.split(':').map(Number);
                      const [bEndHour] = b.endTime.split(':').map(Number);
                      return hourNum >= bStartHour && hourNum < bEndHour;
                    });

                    // Check if this slot is the START of a booking
                    const startingBookings = activeBookings.filter((b) => {
                      if (b.date !== d.isoDate) return false;
                      const [bStartHour] = b.startTime.split(':').map(Number);
                      return bStartHour === hourNum;
                    });

                    return (
                      <div
                        key={`${hour}-${d.isoDate}`}
                        className={`border-l border-slate-100 dark:border-[#1E2E50]/60 p-1 relative hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors last:border-l-0 cursor-pointer ${
                          d.isToday ? 'bg-indigo-50/10 dark:bg-indigo-950/10' : ''
                        }`}
                        onClick={() => openBookingModal()}
                        title="کلیک برای رزرو در این تاریخ و ساعت"
                      >
                        {startingBookings.map((bk, bkIdx) => {
                          const [sh, sm] = bk.startTime.split(':').map(Number);
                          const [eh, em] = bk.endTime.split(':').map(Number);
                          const durationHours = Math.max(1, (eh * 60 + em - (sh * 60 + sm)) / 60);
                          const heightPx = Math.round(durationHours * 76);

                          // Color variations
                          const bgStyles = [
                            'bg-purple-50 dark:bg-purple-950/70 border-purple-300 dark:border-purple-800/60 text-purple-900 dark:text-purple-200',
                            'bg-blue-50 dark:bg-blue-950/70 border-blue-300 dark:border-blue-800/60 text-blue-900 dark:text-blue-200',
                            'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200',
                            'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200',
                          ];
                          const styleClass = bgStyles[bkIdx % bgStyles.length];

                          return (
                            <div
                              key={bk.id}
                              style={{
                                height: `${heightPx}px`,
                                zIndex: 10 + bkIdx,
                              }}
                              className={`absolute inset-x-1 top-1 rounded-xl p-2 border shadow-xs flex flex-col justify-between overflow-hidden transition-transform hover:scale-[1.02] ${styleClass}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openBookingModal();
                              }}
                            >
                              <div className="font-bold text-[11px] truncate leading-tight">
                                {bk.title}
                              </div>
                              <div className="text-[10px] opacity-80 flex items-center justify-between gap-1 mt-1">
                                <span className="truncate">{bk.roomName}</span>
                                <span className="font-mono text-[9px] shrink-0">
                                  {bk.startTime} - {bk.endTime}
                                </span>
                              </div>
                              {bk.organizerName && (
                                <div className="text-[9px] opacity-70 truncate mt-0.5">
                                  {bk.organizerName}
                                </div>
                              )}
                            </div>
                          );
                        })}
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
      <div className="bg-white dark:bg-[#111A2E] border border-slate-200/80 dark:border-[#1E2E50] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span>
            تعداد کل جلسات ثبت شده در این بازه: <strong>{activeBookings.length}</strong> جلسه
          </span>
        </div>
        <button
          onClick={() => openBookingModal()}
          className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
        >
          + ثبت رزرو برای ساعت‌های خالی
        </button>
      </div>
    </div>
  );
};
