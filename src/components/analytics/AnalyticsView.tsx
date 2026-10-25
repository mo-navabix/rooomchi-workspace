import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Stats, Room } from '../../types';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  Building,
  RefreshCw,
  BarChart2,
} from 'lucide-react';
import { AnalyticsSkeleton } from '../common/Skeletons';

const RANGE_LABELS: Record<'week' | 'month' | 'quarter', string> = {
  week: 'هفته جاری',
  month: 'ماه جاری',
  quarter: 'سه‌ماهه اخیر',
};

export const AnalyticsView: React.FC = () => {
  const { currentOrg, bookingsDataVersion } = useApp();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [stats, setStats] = useState<Stats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    if (!currentOrg?.id) return;
    try {
      setIsLoading(true);
      const [statsData, roomsData] = await Promise.all([
        ApiService.getStats(currentOrg.id, { scope: 'all', range: timeRange }),
        ApiService.getRooms({ orgId: currentOrg.id }),
      ]);
      setStats(statsData);
      setRooms(roomsData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg?.id, timeRange, bookingsDataVersion]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalMeetingsCount =
    stats?.periodBookingsCount ?? stats?.totalHistoricalBookings ?? 0;
  const avgDurationMinutes = stats?.avgMeetingDurationMinutes ?? 0;
  const topRoomName = stats?.topRoom?.name ?? '—';
  const topRoomOccupancy = stats?.topRoom?.occupancyRate ?? 0;
  const popularRooms = stats?.popularRooms ?? [];
  const departmentStats = stats?.departmentStats ?? {};

  const chartBuckets = useMemo(() => {
    if (!stats) return [];
    if (timeRange === 'week') return stats.weeklyUsage ?? [];
    if (timeRange === 'quarter') return stats.quarterlyUsage ?? stats.monthlyUsage ?? [];
    return stats.monthlyUsage ?? [];
  }, [stats, timeRange]);

  const monthlyTrend = chartBuckets.map((b) => ({
    label: b.day,
    count: b.count,
  }));

  const maxVal = Math.max(...monthlyTrend.map((m) => m.count), 1);
  const points = monthlyTrend.map((pt, i) => {
    const span = Math.max(monthlyTrend.length - 1, 1);
    const x = 50 + (i / span) * 500;
    const y = 170 - (pt.count / maxVal) * 110;
    return { x, y, count: pt.count, label: pt.label };
  });

  const pathD =
    points.length > 0
      ? points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '')
      : '';
  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} 190 L ${points[0].x} 190 Z`
      : '';

  if (isLoading && !stats) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 select-none min-w-0" id="analytics-view">
      <div className="flex justify-stretch sm:justify-end">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#334155] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#334155] transition-colors cursor-pointer"
            title="بروزرسانی زنده آمار"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
            className="text-xs font-bold bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-700 dark:text-slate-200 shadow-2xs focus:outline-none"
          >
            <option value="week">هفته جاری</option>
            <option value="month">ماه جاری</option>
            <option value="quarter">سه‌ماهه اخیر</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-2xl portal-card-pad shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              بیشترین استفاده
            </span>
            <div className="w-8 h-8 rounded-xl brand-icon-tile brand-icon-tile--md flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div
              className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 truncate"
              title={topRoomName}
            >
              {topRoomName}
            </div>
            <div className="text-xs font-bold text-brand dark:text-[var(--brand-primary-on-dark)] mt-1 flex items-center gap-1">
              <span className="font-mono tabular-nums" dir="ltr">
                {topRoomOccupancy}% سهم از رزروها
              </span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-2xl portal-card-pad shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              میانگین مدت جلسه
            </span>
            <div className="w-8 h-8 rounded-xl brand-icon-tile brand-icon-tile--md flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 font-mono tabular-nums" dir="ltr">
              {avgDurationMinutes} دقیقه
            </div>
            <div className="text-xs font-bold text-brand dark:text-[var(--brand-primary-on-dark)] mt-1">
              {RANGE_LABELS[timeRange]}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-2xl portal-card-pad shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              جلسات در بازه انتخابی
            </span>
            <div className="w-8 h-8 rounded-xl brand-icon-tile brand-icon-tile--md flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 font-mono tabular-nums" dir="ltr">
              {totalMeetingsCount} جلسه
            </div>
            <div className="text-xs font-bold text-brand dark:text-[var(--brand-primary-on-dark)] mt-1 font-mono tabular-nums" dir="ltr">
              در {rooms.length} اتاق فعال سازمان
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-2xl sm:rounded-3xl portal-card-pad-lg shadow-xs min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
              روند تعداد جلسات
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              داده واقعی رزروهای {currentOrg?.name ?? 'سازمان'} — {RANGE_LABELS[timeRange]}
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-[#334155] px-3 py-1.5 rounded-xl">
            {RANGE_LABELS[timeRange]}
          </span>
        </div>

        {monthlyTrend.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-16">
            در این بازه هنوز جلسه‌ای ثبت نشده است.
          </p>
        ) : (
          <>
            <div className="w-full h-64 relative flex items-end">
              <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible" fill="none">
                <line x1="0" y1="40" x2="600" y2="40" stroke="currentColor" strokeOpacity="0.08" />
                <line x1="0" y1="90" x2="600" y2="90" stroke="currentColor" strokeOpacity="0.08" />
                <line x1="0" y1="140" x2="600" y2="140" stroke="currentColor" strokeOpacity="0.08" />
                {areaD && <path d={areaD} fill="url(#chart-grad-meetings)" />}
                {pathD && (
                  <path
                    d={pathD}
                    stroke="var(--brand-primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {points.map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.x} cy={pt.y} r="5" fill="var(--brand-primary)" />
                    <circle cx={pt.x} cy={pt.y} r="2.5" fill="#FFFFFF" />
                  </g>
                ))}
                <defs>
                  <linearGradient id="chart-grad-meetings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-primary-lighter)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--brand-primary-lighter)" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="portal-tabs-scroll justify-between gap-2 text-[10px] sm:text-xs text-slate-400 font-medium mt-4 pt-2 border-t border-slate-100 dark:border-[#334155]">
              {monthlyTrend.map((t) => (
                <span key={t.label} className="shrink-0 whitespace-nowrap font-mono tabular-nums" dir="ltr">
                  {t.label} ({t.count})
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              محبوب‌ترین اتاق‌ها (تعداد رزرو)
            </h3>
            <BarChart2 className="w-4 h-4 text-brand" />
          </div>

          <div className="space-y-3 pt-1">
            {popularRooms.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">در این بازه رزروی ثبت نشده است.</p>
            ) : (
              popularRooms.map((item, idx) => {
                const maxPopular = Math.max(...popularRooms.map((p) => p.count), 1);
                const percentage = Math.min(100, Math.round((item.count / maxPopular) * 100));
                return (
                  <div key={`${item.name}-${idx}`}>
                    <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                      <span className="text-[var(--brand-primary)] font-mono tabular-nums" dir="ltr">
                        {item.count} رزرو
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-[#334155] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--brand-primary)] rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              میزان استفاده بر اساس دپارتمان‌ها
            </h3>
            <Users className="w-4 h-4 text-[var(--brand-primary)]" />
          </div>

          <div className="space-y-3 pt-1">
            {Object.keys(departmentStats).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">داده دپارتمان در این بازه موجود نیست.</p>
            ) : (
              Object.entries(departmentStats).map(([deptName, count], idx) => {
                const totalDepts = Object.values(departmentStats).reduce((a, b) => a + b, 0);
                const percent = Math.min(100, Math.round((count / Math.max(1, totalDepts)) * 100));
                const colors = [
                  'bg-[var(--brand-primary-light)]',
                  'bg-[var(--brand-primary)]',
                  'bg-[var(--brand-primary)]',
                  'bg-amber-500',
                ];
                const barColor = colors[idx % colors.length];

                return (
                  <div key={deptName}>
                    <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{deptName}</span>
                      <span className="text-slate-600 dark:text-slate-400 font-mono tabular-nums" dir="ltr">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-[#334155] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
