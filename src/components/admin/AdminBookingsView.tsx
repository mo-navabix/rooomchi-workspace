import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Booking } from '../../types';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Building,
  Users,
  Search,
  Check,
  X,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { AdminBookingsSkeleton } from '../common/Skeletons';

export const AdminBookingsView: React.FC = () => {
  const { currentOrg, showToast } = useApp();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBookings = async () => {
    if (!currentOrg) return;
    try {
      setIsLoading(true);
      const data = await ApiService.getBookings({ orgId: currentOrg.id });
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentOrg]);

  const handleUpdateStatus = async (id: string, newStatus: Booking['status'], title: string) => {
    try {
      await ApiService.updateBookingStatus(id, newStatus);
      showToast(
        newStatus === 'confirmed'
          ? `جلسه «${title}» با موفقیت تأیید شد`
          : `وضعیت جلسه «${title}» به ${newStatus} تغییر یافت`,
        'success'
      );
      fetchBookings();
    } catch (err: any) {
      showToast(err.message || 'خطا در تغییر وضعیت رزرو', 'error');
    }
  };

  const filtered = bookings.filter((b) => {
    if (filterDepartment !== 'all' && b.department !== filterDepartment) return false;
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = b.title.toLowerCase().includes(q);
      const matchOrg = b.organizerName.toLowerCase().includes(q);
      const matchRoom = b.roomName.toLowerCase().includes(q);
      if (!matchTitle && !matchOrg && !matchRoom) return false;
    }
    return true;
  });

  if (isLoading) {
    return <AdminBookingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs space-y-4 transition-colors">
        <div>
          <div className="text-xs font-semibold text-[#10B981] dark:text-[#34D399] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
            <span>نظارت جامع رزروهای سازمانی</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            مدیریت تمام جلسات و درخواست‌های {currentOrg?.name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            بررسی و تأیید جلسات هیئت مدیره، جلسات پرسنل و نظارت بر تداخل‌ها
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-[#334155]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="جستجو بر اساس عنوان، برگزارکننده یا اتاق..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-3 pr-9 py-2 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="relative">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full text-xs pr-3.5 pl-9 py-2.5 appearance-none bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#10B981] cursor-pointer"
            >
              <option value="all">همه دپارتمان‌ها و واحدها</option>
              {(currentOrg?.departments ?? []).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs pr-3.5 pl-9 py-2.5 appearance-none bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#10B981] cursor-pointer"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="pending_approval">در انتظار تأیید مدیریت (نیاز به اقدام)</option>
              <option value="confirmed">تأیید شده و نهایی</option>
              <option value="cancelled">لغو شده</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-[#0D1527] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-[#334155]">
              <tr>
                <th className="px-5 py-4 whitespace-nowrap">عنوان جلسه</th>
                <th className="px-5 py-4 whitespace-nowrap">اتاق و محل</th>
                <th className="px-5 py-4 whitespace-nowrap">زمان و تاریخ</th>
                <th className="px-5 py-4 whitespace-nowrap">هماهنگ‌کننده و واحد</th>
                <th className="px-5 py-4 whitespace-nowrap">حاضرین</th>
                <th className="px-5 py-4 whitespace-nowrap">وضعیت</th>
                <th className="px-5 py-4 text-left whitespace-nowrap">اقدام ادمین</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#334155]">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-[#334155]/50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900 dark:text-white">{b.title}</div>
                    {b.description && (
                      <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                        {b.description}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">{b.roomName}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{b.date}</div>
                    <div className="text-[11px] text-[#10B981] dark:text-[#34D399] mt-0.5">
                      {b.startTime} الی {b.endTime}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{b.organizerName}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{b.department}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">{b.attendeesCount} نفر</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {b.status === 'confirmed' && (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/90 dark:bg-emerald-950/50 px-3 py-1 rounded-xl whitespace-nowrap border border-emerald-200/50 dark:border-emerald-900/40 inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>تأیید شده</span>
                      </span>
                    )}
                    {b.status === 'pending_approval' && (
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/50 px-3 py-1 rounded-xl whitespace-nowrap border border-amber-200/60 dark:border-amber-900/40 inline-flex items-center gap-1 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        <span>در انتظار تأیید</span>
                      </span>
                    )}
                    {b.status === 'cancelled' && (
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-100/90 dark:bg-rose-950/50 px-3 py-1 rounded-xl whitespace-nowrap border border-rose-200/50 dark:border-rose-900/40 inline-flex items-center gap-1">
                        <X className="w-3.5 h-3.5" />
                        <span>لغو شده</span>
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-left whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {b.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'confirmed', b.title)}
                            className="px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 hover:bg-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="تأیید این جلسه"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تأیید</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'cancelled', b.title)}
                            className="px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/50 hover:bg-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="رد درخواست"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>رد</span>
                          </button>
                        </>
                      )}

                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'cancelled', b.title)}
                          className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-colors cursor-pointer"
                          title="لغو اضطراری جلسه"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
