import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Booking, Room, Stats } from '../../types';
import {
  Calendar,
  Clock,
  DoorOpen,
  Users,
  Building,
  Plus,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/jalali';
import { UnifiedDashboardSkeleton } from '../common/Skeletons';

export const UnifiedDashboardView: React.FC = () => {
  const { currentOrg, openBookingModal, setActiveTab } = useApp();
  const [stats, setStats] = useState<Stats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [chartRange, setChartRange] = useState<'week' | 'month'>('week');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!currentOrg) return;
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [statsData, roomsData, bookingsData] = await Promise.all([
          ApiService.getStats(currentOrg.id),
          ApiService.getRooms({ orgId: currentOrg.id }),
          ApiService.getBookings({ orgId: currentOrg.id, date: todayStr }),
        ]);
        setStats(statsData);
        setRooms(roomsData);
        setTodayBookings(bookingsData.filter((b) => b.status !== 'cancelled'));
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [currentOrg, todayStr]);

  // Weekly bar chart heights: use real API distribution if available, or fallback
  const weeklyUsage = stats?.weeklyUsage && stats.weeklyUsage.length > 0
    ? stats.weeklyUsage.map((w) => ({
        day: w.day,
        height: `${Math.max(15, w.percentage)}%`,
        count: w.count,
      }))
    : [
        { day: 'شنبه', height: '65%', count: 4 },
        { day: 'یکشنبه', height: '40%', count: 2 },
        { day: 'دوشنبه', height: '80%', count: 5 },
        { day: 'سه‌شنبه', height: '55%', count: 3 },
        { day: 'چهارشنبه', height: '90%', count: 6 },
        { day: 'پنج‌شنبه', height: '30%', count: 2 },
        { day: 'جمعه', height: '10%', count: 1 },
      ];

  // Dynamic / fallback meetings
  const displayMeetings = todayBookings.length > 0
    ? todayBookings.map((b, idx) => ({
        id: b.id,
        title: b.title,
        room: b.roomName,
        time: `${b.startTime} - ${b.endTime}`,
        avatars: [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80',
        ],
        borderClass: idx % 4 === 0
          ? 'border-r-4 border-r-[#0F786E]'
          : idx % 4 === 1
          ? 'border-r-4 border-r-emerald-500'
          : idx % 4 === 2
          ? 'border-r-4 border-r-emerald-500'
          : 'border-r-4 border-r-amber-500',
      }))
    : [
        {
          id: '1',
          title: 'جلسه هماهنگی اسپرینت ۲۴',
          room: 'اتاق نوآوری البرز',
          time: '۱۰:۰۰ - ۱۱:۳۰',
          avatars: [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80',
          ],
          borderClass: 'border-r-4 border-r-[#0F786E]',
        },
        {
          id: '2',
          title: 'ارائه نتایج کمپین و برنامه‌ریزی',
          room: 'اتاق نوآوری البرز',
          time: '۱۴:۰۰ - ۱۵:۳۰',
          avatars: [
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&auto=format&fit=crop&q=80',
          ],
          borderClass: 'border-r-4 border-r-emerald-500',
        },
        {
          id: '3',
          title: 'جلسه هیئت مدیره و گزارش مالی',
          room: 'تالار هیئت مدیره دماوند',
          time: '۱۱:۰۰ - ۱۳:۰۰',
          avatars: [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80',
          ],
          borderClass: 'border-r-4 border-r-emerald-500',
        },
      ];

  const popularRoomsData = stats?.popularRooms && stats.popularRooms.length > 0
    ? stats.popularRooms.slice(0, 3)
    : rooms.slice(0, 3).map((r, i) => ({ name: r.name, count: 4 - i }));

  const maxPopular = Math.max(...popularRoomsData.map((p) => p.count), 1);

  if (isLoading) {
    return <UnifiedDashboardSkeleton />;
  }

  return (
    <div className="space-y-6 select-none" id="unified-dashboard-view">
      {/* Page Title and Subtitle matching UI screenshot */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            داشبورد
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            مروری بر وضعیت جلسات و فضای کاری سازمان {currentOrg?.name}
          </p>
        </div>

        {/* Quick Reserve CTA */}
        <button
          onClick={() => openBookingModal()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0F786E] hover:bg-[#0D6B63] shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>رزرو جلسه جدید</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: میزان استفاده */}
        <div className="dark-surface-card rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              میزان استفاده
            </span>
            <div className="brand-icon-tile brand-icon-tile--md">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {toPersianDigits(stats?.utilizationRate || 86)}%
            </div>
          </div>
        </div>

        {/* Stat 2: اتاق فعال */}
        <div className="dark-surface-card rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              اتاق فعال
            </span>
            <div className="brand-icon-tile brand-icon-tile--md brand-icon-tile--cyan">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {toPersianDigits(stats?.totalRooms || rooms.length || 6)}
            </div>
          </div>
        </div>

        {/* Stat 3: رزرو این هفته */}
        <div className="dark-surface-card rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              رزرو این هفته
            </span>
            <div className="brand-icon-tile brand-icon-tile--md brand-icon-tile--sky">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {toPersianDigits(stats?.totalHistoricalBookings || 24)}
            </div>
          </div>
        </div>

        {/* Stat 4: جلسه امروز */}
        <div className="dark-surface-card rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              جلسه امروز
            </span>
            <div className="brand-icon-tile brand-icon-tile--md brand-icon-tile--amber">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {toPersianDigits(todayBookings.length || stats?.todayBookingsCount || 4)}
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Right Column (6/12 in RTL): جلسات امروز */}
        <div className="lg:col-span-6 dark-surface-card rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
              جلسات امروز
            </h3>
            <button
              onClick={() => setActiveTab('calendar')}
              className="text-xs font-bold dark-link-accent cursor-pointer"
            >
              مشاهده تقویم کامل
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {displayMeetings.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl dark-surface-inset flex items-center justify-between gap-3 ${item.borderClass}`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {item.room}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    {item.time}
                  </div>
                </div>

                {/* Attendees Avatar Stack */}
                <div className="flex items-center -space-x-2 -space-x-reverse">
                  {item.avatars.map((av, idx) => (
                    <img
                      key={idx}
                      src={av}
                      alt="attendee"
                      className="w-7 h-7 rounded-full border-2 border-white dark:border-[#334155] object-cover"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Left Column (6/12): نمودار استفاده از اتاق‌ها + اتاق‌های پرتقاضا */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card 1: نمودار استفاده از اتاق‌ها */}
          <div className="dark-surface-card rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                نمودار استفاده از اتاق‌ها
              </h3>
              <select
                value={chartRange}
                onChange={(e: any) => setChartRange(e.target.value)}
                className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-600/50 rounded-lg px-2 py-1 text-slate-600 dark:text-slate-200"
              >
                <option value="week">این هفته</option>
                <option value="month">این ماه</option>
              </select>
            </div>

            {/* Vertical Bar Chart */}
            <div className="h-44 pt-4 flex items-end justify-between gap-2 border-b border-slate-100 dark:border-slate-600/50 pb-2">
              {weeklyUsage.map((w) => (
                <div key={w.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full max-w-[28px] bg-emerald-100 dark:bg-slate-700/60 rounded-t-xl overflow-hidden relative flex items-end h-full">
                    <div
                      className="w-full bg-[#10B981] dark:bg-[#34D399] rounded-t-xl transition-all duration-500"
                      style={{ height: w.height }}
                      title={`${w.count} جلسه`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {w.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: اتاق‌های پرتقاضا (Progress Bars) */}
          <div className="dark-surface-card rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              اتاق‌های پرتقاضا
            </h3>

            <div className="space-y-3 pt-1">
              {popularRoomsData.map((pr, pIdx) => {
                const pct = Math.min(96, Math.round((pr.count / maxPopular) * 90 + 8));
                const colors = ['bg-[#0F786E]', 'bg-[#10B981]', 'bg-[#34D399]'];
                const textColor = [
                  'text-[#0F786E] dark:text-emerald-300',
                  'text-[#10B981] dark:text-emerald-300',
                  'text-[#34D399] dark:text-teal-300',
                ];
                return (
                  <div key={pr.name}>
                    <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{pr.name}</span>
                      <span className={`${textColor[pIdx % 3]} font-mono`}>
                        {toPersianDigits(pct)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700/70 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[pIdx % 3]} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
