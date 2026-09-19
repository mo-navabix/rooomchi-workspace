import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Booking, Room, Stats } from '../../types';
import {
  DoorOpen,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Building2,
  Coffee,
  Tv,
  Video,
  Wifi,
} from 'lucide-react';
import { DashboardSkeleton } from '../common/Skeletons';

export const DashboardView: React.FC = () => {
  const { currentOrg, openBookingModal, setActiveTab } = useApp();

  const [stats, setStats] = useState<Stats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!currentOrg) return;

    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [statsData, roomsData, bookingsData] = await Promise.all([
          ApiService.getStats(currentOrg.id),
          ApiService.getRooms({ orgId: currentOrg.id }),
          ApiService.getBookings({ orgId: currentOrg.id, date: todayStr }),
        ]);

        setStats(statsData);
        setRooms(roomsData);
        setTodayBookings(bookingsData);
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [currentOrg]);

  // Current time formatted (HH:mm)
  const now = new Date();
  const currentHourStr = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  // Helper to determine room live status
  const getRoomCurrentStatus = (roomId: string) => {
    const roomBookings = todayBookings.filter(
      (b) => b.roomId === roomId && b.status !== 'cancelled'
    );
    const ongoing = roomBookings.find(
      (b) => b.startTime <= currentHourStr && b.endTime >= currentHourStr
    );
    if (ongoing) {
      return {
        status: 'busy',
        label: 'در حال برگزاری جلسه',
        booking: ongoing,
        color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50',
        badge: 'bg-rose-600',
      };
    }
    const nextMeeting = roomBookings.find((b) => b.startTime > currentHourStr);
    if (nextMeeting) {
      return {
        status: 'reserved-later',
        label: `رزرو بعدی ساعت ${nextMeeting.startTime}`,
        booking: nextMeeting,
        color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50',
        badge: 'bg-amber-500',
      };
    }
    return {
      status: 'free',
      label: 'آزاد و آماده استفاده',
      booking: null,
      color: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-[#14B8A6] border-teal-200 dark:border-teal-900/50',
      badge: 'bg-[#14B8A6]',
    };
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-[#111A2E] rounded-2xl p-6 border border-slate-200 dark:border-[#1E2E50] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse"></span>
            <span>داشبورد اختصاصی مدیریت جلسات</span>
            <span>•</span>
            <span>{currentOrg?.buildings[0] || 'شعبه مرکزی'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            خوش‌آمدید به سامانه جلسات {currentOrg?.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            امروز {todayBookings.length} جلسه کاری در سازمان برنامه‌ریزی شده است. وضعیت اتاق‌ها را به صورت لحظه‌ای بررسی کنید یا جلسه جدید رزرو نمایید.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-dash-quick-book"
            onClick={() => openBookingModal()}
            className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#14B8A6]" />
            <span>رزرو فوری اتاق جلسه</span>
          </button>
          <button
            id="btn-dash-view-all-rooms"
            onClick={() => setActiveTab('rooms')}
            className="px-4 py-2.5 bg-slate-100 dark:bg-[#0D1527] hover:bg-slate-200 dark:hover:bg-[#16243F] text-slate-700 dark:text-slate-300 border border-transparent dark:border-[#1E2E50] rounded-xl text-xs font-semibold transition-all"
          >
            مشاهده تقویم تمام اتاق‌ها
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111A2E] p-5 rounded-2xl border border-slate-200 dark:border-[#1E2E50] shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">اتاق‌های آزاد الان</span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#14B8A6] border border-teal-100 dark:border-teal-900/40">
              <DoorOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.availableRoomsNow ?? rooms.length}
            <span className="text-xs font-normal text-slate-400 mr-1.5">
              از {rooms.length} اتاق
            </span>
          </div>
          <div className="text-[11px] text-[#14B8A6] font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>آماده برگزاری جلسه آنی</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111A2E] p-5 rounded-2xl border border-slate-200 dark:border-[#1E2E50] shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">جلسات امروز</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] border border-blue-100 dark:border-blue-900/40">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {todayBookings.length}
            <span className="text-xs font-normal text-slate-400 mr-1.5">جلسه</span>
          </div>
          <div className="text-[11px] text-[#2563EB] dark:text-[#60A5FA] font-medium mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{stats?.activeMeetingsNow || 0} جلسه فعال در حال حاضر</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111A2E] p-5 rounded-2xl border border-slate-200 dark:border-[#1E2E50] shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">تأییدیه در انتظار</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.pendingApprovals ?? 0}
            <span className="text-xs font-normal text-slate-400 mr-1.5">درخواست</span>
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-1">
            نیاز به بررسی توسط ادمین سازمان
          </div>
        </div>

        <div className="bg-white dark:bg-[#111A2E] p-5 rounded-2xl border border-slate-200 dark:border-[#1E2E50] shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ظرفیت دپارتمان‌ها</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {currentOrg?.departments?.length || 5}
            <span className="text-xs font-normal text-slate-400 mr-1.5">واحد سازمانی</span>
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">
            ساعات کاری: {currentOrg?.workHours?.start} الی {currentOrg?.workHours?.end}
          </div>
        </div>
      </div>

      {/* Main Grid: Live Rooms Status & Today Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Rooms Status (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">وضعیت لحظه‌ای اتاق‌های جلسات</h3>
              <span className="text-xs bg-slate-100 dark:bg-[#16243F] text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                {rooms.length} اتاق
              </span>
            </div>
            <button
              onClick={() => setActiveTab('rooms')}
              className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline flex items-center gap-1"
            >
              <span>مشاهده و فیلتر پیشرفته</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {rooms.map((room) => {
              const live = getRoomCurrentStatus(room.id);
              return (
                <div
                  key={room.id}
                  className="bg-white dark:bg-[#111A2E] rounded-2xl border border-slate-200 dark:border-[#1E2E50] p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400">
                          {room.code} • طبقه {room.floor}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{room.name}</h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${live.color}`}
                      >
                        {live.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">
                      {room.building} • ظرفیت: {room.capacity} نفر
                    </p>

                    {/* Amenities Icons */}
                    <div className="flex items-center gap-1.5 text-slate-400 mb-4">
                      {room.amenities.includes('projector') && (
                        <span title="پروژکتور" className="p-1 rounded bg-slate-50 dark:bg-[#0D1527] text-slate-600 dark:text-slate-300">
                          <Tv className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {room.amenities.includes('videoconf') && (
                        <span title="ویدیوکنفرانس" className="p-1 rounded bg-slate-50 dark:bg-[#0D1527] text-slate-600 dark:text-slate-300">
                          <Video className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {room.amenities.includes('wifi') && (
                        <span title="وای‌فای" className="p-1 rounded bg-slate-50 dark:bg-[#0D1527] text-slate-600 dark:text-slate-300">
                          <Wifi className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {room.amenities.includes('catering') && (
                        <span title="پذیرایی" className="p-1 rounded bg-slate-50 dark:bg-[#0D1527] text-slate-600 dark:text-slate-300">
                          <Coffee className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[#1E2E50] flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {live.status === 'busy' && live.booking
                        ? `جلسه: ${live.booking.title}`
                        : live.status === 'reserved-later'
                        ? 'آزاد تا شروع جلسه بعدی'
                        : 'آماده رزرو فوری'}
                    </span>
                    <button
                      onClick={() => openBookingModal(room)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:text-white hover:bg-[#2563EB] border border-blue-200 dark:border-[#1E2E50] hover:border-[#2563EB] rounded-lg transition-all"
                    >
                      رزرو این اتاق
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Agenda (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">برنامه جلسات امروز</h3>
            <span className="text-xs text-slate-400">{todayStr}</span>
          </div>

          <div className="bg-white dark:bg-[#111A2E] rounded-2xl border border-slate-200 dark:border-[#1E2E50] p-4 shadow-xs transition-colors">
            {todayBookings.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                هیچ جلسه‌ای برای امروز ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-3">
                {todayBookings.map((booking) => {
                  const isOngoing =
                    booking.startTime <= currentHourStr && booking.endTime >= currentHourStr;
                  return (
                    <div
                      key={booking.id}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        isOngoing
                          ? 'border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/30'
                          : 'border-slate-100 dark:border-[#1E2E50] bg-slate-50/70 dark:bg-[#0D1527]/80 hover:bg-slate-50 dark:hover:bg-[#16243F]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 dark:text-white">{booking.title}</span>
                        <span className="font-semibold text-[11px] text-[#2563EB] dark:text-[#60A5FA]">
                          {booking.startTime} - {booking.endTime}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>{booking.roomName}</span>
                        <span className="bg-slate-200/70 dark:bg-[#1E2E50] text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
                          {booking.department}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        هماهنگ‌کننده: {booking.organizerName} • {booking.attendeesCount} نفر
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
