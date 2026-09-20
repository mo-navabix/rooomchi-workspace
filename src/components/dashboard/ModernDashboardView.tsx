import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Booking, Room, Stats } from '../../types';
import {
  Calendar,
  Clock,
  DoorOpen,
  Users,
  ChevronDown,
  Building,
  CheckCircle2,
  TrendingUp,
  MoreVertical,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/jalali';

export const ModernDashboardView: React.FC = () => {
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
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [currentOrg, todayStr]);

  // Weekly room usage bar heights
  const weeklyUsage = [
    { day: 'شنبه', height: '65%' },
    { day: 'یکشنبه', height: '40%' },
    { day: 'دوشنبه', height: '80%' },
    { day: 'سه‌شنبه', height: '55%' },
    { day: 'چهارشنبه', height: '90%' },
    { day: 'پنج‌شنبه', height: '30%' },
    { day: 'جمعه', height: '10%' },
  ];

  // Mock list of meetings matching design
  const sampleMeetings = [
    {
      id: '1',
      title: 'جلسه تیم محصول',
      room: 'اتاق کنفرانس ۱',
      time: '09:00 - 10:00',
      avatars: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&auto=format&fit=crop&q=80',
      ],
      color: 'border-l-4 border-l-emerald-500',
    },
    {
      id: '2',
      title: 'بررسی استراتژی',
      room: 'اتاق جلسات ۲',
      time: '11:00 - 12:00',
      avatars: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&auto=format&fit=crop&q=80',
      ],
      color: 'border-l-4 border-l-emerald-500',
    },
    {
      id: '3',
      title: 'جلسه با کارفرما',
      room: 'اتاق VIP',
      time: '13:30 - 14:30',
      avatars: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&auto=format&fit=crop&q=80',
      ],
      color: 'border-l-4 border-l-emerald-500',
    },
    {
      id: '4',
      title: 'مصاحبه استخدامی',
      room: 'اتاق کوچک',
      time: '16:00 - 17:00',
      avatars: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&auto=format&fit=crop&q=80',
      ],
      color: 'border-l-4 border-l-amber-500',
    },
  ];

  return (
    <div className="space-y-6 select-none" id="modern-dashboard">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          داشبورد
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
          مروری بر وضعیت جلسات و فضای کاری
        </p>
      </div>

      {/* 4 Stat Cards matching screenshot (جلسه امروز, رزرو این هفته, اتاق فعال, میزان استفاده) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: میزان استفاده */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              میزان استفاده
            </span>
            <div className="w-8 h-8 rounded-xl brand-icon-tile brand-icon-tile--md flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              ۸۶%
            </div>
          </div>
        </div>

        {/* Stat 2: اتاق فعال */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              اتاق فعال
            </span>
            <div className="w-8 h-8 rounded-xl brand-icon-tile brand-icon-tile--md flex items-center justify-center">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {toPersianDigits(rooms.length || 8)}
            </div>
          </div>
        </div>

        {/* Stat 3: رزرو این هفته */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              رزرو این هفته
            </span>
            <div className="w-8 h-8 rounded-xl brand-icon-tile brand-icon-tile--md flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              ۲۴
            </div>
          </div>
        </div>

        {/* Stat 4: جلسه امروز */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              جلسه امروز
            </span>
            <div className="w-8 h-8 rounded-xl brand-icon-tile brand-icon-tile--md flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              ۱۲
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section matching UI screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Right Column (6/12): جلسات امروز */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
              جلسات امروز
            </h3>
            <button
              onClick={() => setActiveTab('calendar')}
              className="text-xs font-bold text-[#0F786E] dark:text-emerald-300 hover:underline cursor-pointer"
            >
              مشاهده همه
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {sampleMeetings.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl bg-slate-50 dark:bg-[#334155] border border-slate-200/60 dark:border-[#334155] flex items-center justify-between gap-3 ${item.color}`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {item.room}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
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
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                نمودار استفاده از اتاق‌ها
              </h3>
              <select
                value={chartRange}
                onChange={(e: any) => setChartRange(e.target.value)}
                className="text-[11px] font-bold bg-slate-100 dark:bg-[#334155] border-none rounded-lg px-2 py-1 text-slate-600 dark:text-slate-300"
              >
                <option value="week">این هفته</option>
                <option value="month">این ماه</option>
              </select>
            </div>

            {/* Vertical Bar Chart matching screenshot */}
            <div className="h-44 pt-4 flex items-end justify-between gap-2 border-b border-slate-100 dark:border-[#334155]/60 pb-2">
              {weeklyUsage.map((w) => (
                <div key={w.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full max-w-[28px] bg-emerald-100 dark:bg-emerald-950/60 rounded-t-xl overflow-hidden relative flex items-end h-full">
                    <div
                      className="w-full bg-[#10B981] rounded-t-xl transition-all duration-500"
                      style={{ height: w.height }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {w.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: اتاق‌های پرتقاضا (Progress Bars) */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              اتاق‌های پرتقاضا
            </h3>

            <div className="space-y-3 pt-1">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                  <span className="text-slate-700 dark:text-slate-300">اتاق کنفرانس ۱</span>
                  <span className="text-emerald-600 font-mono">۹۲%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-[#334155] rounded-full overflow-hidden">
                  <div className="h-full bg-[#0F786E] rounded-full w-[92%]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                  <span className="text-slate-700 dark:text-slate-300">اتاق VIP</span>
                  <span className="text-emerald-600 font-mono">۷۸%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-[#334155] rounded-full overflow-hidden">
                  <div className="h-full bg-[#10B981] rounded-full w-[78%]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                  <span className="text-slate-700 dark:text-slate-300">اتاق جلسات ۲</span>
                  <span className="text-emerald-600 font-mono">۶۵%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-[#334155] rounded-full overflow-hidden">
                  <div className="h-full bg-[#34D399] rounded-full w-[65%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
