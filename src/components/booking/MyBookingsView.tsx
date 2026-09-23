import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Booking } from '../../types';
import {
  Calendar,
  Clock,
  Users,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Coffee,
  Share2,
  Trash2,
} from 'lucide-react';
import { MyBookingsSkeleton } from '../common/Skeletons';

export const MyBookingsView: React.FC = () => {
  const { currentOrg, showToast } = useApp();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'pending' | 'cancelled'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchBookings = async () => {
    if (!currentOrg) return;
    try {
      setIsLoading(true);
      const data = await ApiService.getBookings({ orgId: currentOrg.id });
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentOrg]);

  const handleCancelBooking = async (id: string, title: string) => {
    if (!window.confirm(`آیا از لغو رزرو جلسه «${title}» اطمینان دارید؟`)) return;

    try {
      await ApiService.cancelBooking(id);
      showToast('جلسه مورد نظر با موفقیت لغو شد', 'success');
      fetchBookings();
    } catch (err: any) {
      showToast(err.message || 'خطا در لغو رزرو', 'error');
    }
  };

  const handleCopyMeetingDetails = (booking: Booking) => {
    const text = `دعوت به جلسه: ${booking.title}\nاتاق: ${booking.roomName}\nتاریخ: ${booking.date}\nساعت: ${booking.startTime} الی ${booking.endTime}\nبرگزارکننده: ${booking.organizerName}`;
    navigator.clipboard.writeText(text);
    showToast('متن دعوتنامه جلسه در کلیپ‌بورد کپی شد', 'info');
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    if (filterTab === 'pending') return b.status === 'pending_approval';
    if (filterTab === 'cancelled') return b.status === 'cancelled';
    if (filterTab === 'upcoming') {
      return b.status !== 'cancelled' && b.date >= todayStr;
    }
    return true;
  });

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تأیید شده</span>
          </span>
        );
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>در انتظار تأیید مدیریت</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/40 px-2.5 py-1 rounded-full">
            <XCircle className="w-3.5 h-3.5" />
            <span>لغو شده</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <MyBookingsSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      {/* Header & Filter Tabs */}
      <div className="bg-white dark:bg-[#1E293B] portal-card-pad rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs flex flex-col gap-3 transition-colors">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 sm:justify-end">
          {/* Tabs */}
          <div className="portal-tabs-scroll bg-slate-100 dark:bg-[#0F172A] p-1 rounded-xl text-xs font-semibold border border-transparent dark:border-[#334155]">
            <button
              onClick={() => setFilterTab('all')}
              className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                filterTab === 'all'
                  ? 'bg-white dark:bg-[#334155] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              همه ({bookings.length})
            </button>
            <button
              onClick={() => setFilterTab('upcoming')}
              className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                filterTab === 'upcoming'
                  ? 'bg-white dark:bg-[#334155] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              پیش‌رو
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                filterTab === 'pending'
                  ? 'bg-white dark:bg-[#334155] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              در انتظار تأیید
            </button>
            <button
              onClick={() => setFilterTab('cancelled')}
              className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                filterTab === 'cancelled'
                  ? 'bg-white dark:bg-[#334155] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              لغو شده
            </button>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-3.5">
        {filteredBookings.map((b) => (
          <div
            key={b.id}
            className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] portal-card-pad shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 min-w-0"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{b.title}</span>
                {getStatusBadge(b.status)}
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-[#0F172A] px-2.5 py-0.5 rounded-md border border-slate-200/40 dark:border-[#334155]">
                  {b.department}
                </span>
              </div>

              {b.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">{b.description}</p>
              )}

              {/* Meta details */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-1.5 font-medium">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-200 font-bold">{b.roomName}</span>
                </div>

                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{b.date}</span>
                </div>

                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {b.startTime} تا {b.endTime}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{b.attendeesCount} نفر حاضرین</span>
                </div>

                {b.cateringNeeded && (
                  <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                    <Coffee className="w-3.5 h-3.5" />
                    <span>پذیرایی درخواست شده</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                type="button"
                onClick={() => handleCopyMeetingDetails(b)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#0F172A] hover:bg-slate-200 dark:hover:bg-[#334155] border border-slate-200/60 dark:border-[#334155] rounded-xl transition-colors flex items-center gap-1.5"
                title="اشتراک مشخصات جلسه با همکاران"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>اشتراک</span>
              </button>

              {b.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => handleCancelBooking(b.id, b.title)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>لغو رزرو</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredBookings.length === 0 && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] p-12 text-center text-slate-400 text-xs">
            هیچ جلسه‌ای در این بخش یافت نشد.
          </div>
        )}
      </div>
    </div>
  );
};
