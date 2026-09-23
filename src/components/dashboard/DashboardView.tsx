import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Booking, Room, Stats } from '../../types';
import {
  Calendar,
  Clock,
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  DoorOpen,
  CalendarCheck,
  ChevronLeft,
  Coffee,
  Tv,
  Video,
  Wifi,
  Radio,
} from 'lucide-react';
import { DashboardSkeleton } from '../common/Skeletons';
import {
  formatToJalaliDescriptive,
  getCurrentJalaliDate,
  toPersianDigits,
} from '../../utils/jalali';

export const DashboardView: React.FC = () => {
  const { currentOrg, openBookingModal, setActiveTab, currentUser, userRole } = useApp();

  const [stats, setStats] = useState<Stats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!currentOrg) return;

    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [statsData, roomsData, bookingsData] = await Promise.all([
          ApiService.getStats(currentOrg.id),
          ApiService.getRooms({ orgId: currentOrg.id }),
          ApiService.getBookings({ orgId: currentOrg.id, date: todayStr }),
        ]);

        if (isMounted) {
          setStats(statsData);
          setRooms(roomsData);
          setTodayBookings(bookingsData.filter((b) => b.status !== 'cancelled'));
        }
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [currentOrg, todayStr]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const userName = currentUser?.name || 'کاربر گرامی';

  // Room quick status helper
  const now = new Date();
  const currentHourStr = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const getRoomLiveState = (room: Room) => {
    const activeBooking = todayBookings.find(
      (b) => b.roomId === room.id && b.startTime <= currentHourStr && b.endTime >= currentHourStr
    );
    if (activeBooking) {
      return {
        isBusy: true,
        label: 'در حال برگزاری جلسه',
        booking: activeBooking,
      };
    }
    const upcomingBooking = todayBookings
      .filter((b) => b.roomId === room.id && b.startTime > currentHourStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

    if (upcomingBooking) {
      return {
        isBusy: false,
        label: `رزرو شده از ${toPersianDigits(upcomingBooking.startTime)}`,
        booking: upcomingBooking,
      };
    }

    return {
      isBusy: false,
      label: 'آزاد و در دسترس',
      booking: null,
    };
  };

  return (
    <div className="space-y-6 select-none" id="dashboard-view">
      {/* 1. Welcome Banner */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-colors">
        <div className="space-y-1.5 text-right">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] dark:text-[#34D399] border border-emerald-200/60 dark:border-emerald-800/40">
              <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
              <span>{currentOrg?.name || 'سازمان دیدار'}</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {formatToJalaliDescriptive(todayStr)}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            سلام، {userName} عزیز 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            به سامانه مدیریت و رزرواسیون جلسات کاری دیدار خوش آمدید.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('rooms')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#334155] hover:bg-slate-200 dark:hover:bg-[#334155] transition-colors border border-slate-200/60 dark:border-[#334155] cursor-pointer"
          >
            <DoorOpen className="w-4 h-4" />
            <span>مشاهده همه اتاق‌ها</span>
          </button>
        </div>
      </div>

      {/* 2. Four Metric / KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Rooms */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-2xl p-5 space-y-3 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              کل اتاق‌های فعال
            </span>
            <div className="brand-icon-tile brand-icon-tile--lg flex items-center justify-center">
              <DoorOpen className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {toPersianDigits(stats?.totalRooms ?? rooms.length)}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              سالن‌ها و اتاق‌های آماده بهره‌برداری
            </div>
          </div>
        </div>

        {/* Metric 2: Today's Bookings */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-2xl p-5 space-y-3 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              جلسات امروز
            </span>
            <div className="brand-icon-tile brand-icon-tile--lg flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {toPersianDigits(stats?.todayBookingsCount ?? todayBookings.length)}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              جلسات برنامه‌ریزی‌شده برای امروز
            </div>
          </div>
        </div>

        {/* Metric 3: Active / Meetings Now */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-2xl p-5 space-y-3 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              جلسات فعال هم‌اکنون
            </span>
            <div className="brand-icon-tile brand-icon-tile--lg brand-icon-tile--amber">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {toPersianDigits(stats?.activeMeetingsNow ?? 2)}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              نشست‌های جاری در سازمان
            </div>
          </div>
        </div>

        {/* Metric 4: Total Historical / Platform Activity */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-2xl p-5 space-y-3 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              کل رزروهای ثبت‌شده
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {toPersianDigits(stats?.totalHistoricalBookings ?? 28)}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              مجموع جلسات رسمی در این سازمان
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Today's Schedule (2 cols) & Room Availability (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Column 1: Today's Schedule (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-3xl p-6 shadow-xs space-y-5 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>برنامه جلسات امروز</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  ({toPersianDigits(todayBookings.length)} جلسه)
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                فهرست نشست‌ها و گفتگوهای برنامه‌ریزی‌شده در اتاق‌های مختلف
              </p>
            </div>
            <button
              onClick={() => setActiveTab('my-bookings')}
              className="text-xs font-bold text-[#10B981] dark:text-[#34D399] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>تمام جلسات</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayBookings.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-[#334155] bg-slate-50/50 dark:bg-[#0D1527]/50">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                امروز هنوز جلسه‌ای ثبت نشده است
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                می‌توانید برای برگزاری جلسات هماهنگی، اتاق مورد نظرتان را سریعاً رزرو کنید.
              </p>
              <button
                onClick={() => openBookingModal()}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#10B981] hover:bg-[#0D6B63] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت جلسه جدید</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayBookings.map((booking) => {
                const isNow =
                  booking.startTime <= currentHourStr && booking.endTime >= currentHourStr;

                return (
                  <div
                    key={booking.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isNow
                        ? 'border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs'
                        : 'border-slate-100 dark:border-[#334155]/60 bg-slate-50/70 dark:bg-[#0D1527] hover:bg-slate-100/80 dark:hover:bg-[#334155]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 ${
                          isNow
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-[#10B981] dark:text-[#34D399]'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        <span className="text-[10px] font-mono font-bold mt-0.5">
                          {toPersianDigits(booking.startTime)}
                        </span>
                      </div>

                      <div className="text-right min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {booking.title}
                          </h4>
                          {isNow && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                              <Radio className="w-3 h-3 animate-pulse" />
                              <span>در حال برگزاری</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center gap-1 font-medium">
                            <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                            <span>{booking.roomName}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {toPersianDigits(booking.startTime)} تا {toPersianDigits(booking.endTime)}
                            </span>
                          </span>
                          <span>•</span>
                          <span>برگزارکننده: {booking.organizerName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-200/70 dark:bg-[#334155] text-slate-700 dark:text-slate-300">
                        {toPersianDigits(booking.attendeesCount)} نفر
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 2: Quick Room Availability (1 col) */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-3xl p-6 shadow-xs space-y-5 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              وضعیت لحظه‌ای اتاق‌ها
            </h2>
            <button
              onClick={() => setActiveTab('rooms')}
              className="text-xs font-bold text-[#10B981] dark:text-[#34D399] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>مشاهده همه</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {rooms.slice(0, 5).map((room) => {
              const liveState = getRoomLiveState(room);

              return (
                <div
                  key={room.id}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-[#334155]/60 bg-slate-50/70 dark:bg-[#0D1527] flex items-center justify-between gap-3 hover:bg-slate-100/80 dark:hover:bg-[#334155] transition-colors"
                >
                  <div className="text-right min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {room.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({room.code})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      <span>{room.building}</span>
                      <span>•</span>
                      <span>طبقه {toPersianDigits(room.floor)}</span>
                      <span>•</span>
                      <span>ظرفیت {toPersianDigits(room.capacity)} نفر</span>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    {liveState.isBusy ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/50 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                        <span>مشغول</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => openBookingModal(room)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                        title="رزرو این اتاق"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>آزاد (رزرو)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#334155]">
            <button
              onClick={() => openBookingModal()}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-[#10B981] dark:text-[#34D399] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>رزرو اتاق با جستجوی امکانات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
