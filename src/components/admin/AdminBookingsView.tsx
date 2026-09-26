import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Booking } from '../../types';
import {
  Calendar,
  Clock,
  Building,
  Users,
  Search,
  Check,
  X,
  Trash2,
  ChevronDown,
  LayoutGrid,
  Table as TableIcon,
  User,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { AdminBookingsSkeleton } from '../common/Skeletons';
import { toPersianDigits } from '../../utils/jalali';
import { triggerBookingNotifications } from '../../utils/notificationDispatcher';

export const AdminBookingsView: React.FC = () => {
  const { currentOrg, showToast, addNotification } = useApp();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [userPreferredView, setUserPreferredView] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Auto-detect mobile screen for initial default view mode
  useEffect(() => {
    if (!userPreferredView && typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 1024;
      setViewMode(isMobile ? 'cards' : 'table');
    }
  }, [userPreferredView]);

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
          : `وضعیت جلسه «${title}» تغییر یافت`,
        newStatus === 'confirmed' ? 'success' : 'info'
      );

      // Trigger multi-channel notifications (In-App, SMS, Telegram)
      const targetBooking = bookings.find((b) => b.id === id);
      if (targetBooking) {
        triggerBookingNotifications(
          targetBooking,
          newStatus === 'confirmed' ? 'booking_approved' : 'booking_cancelled',
          addNotification
        );
      }

      fetchBookings();
    } catch (err: any) {
      showToast(err.message || 'خطا در تغییر وضعیت رزرو', 'error');
    }
  };

  const counts = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'pending_approval').length;
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    return { total, pending, confirmed, cancelled };
  }, [bookings]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filterDepartment !== 'all' && b.department !== filterDepartment) return false;
      if (filterStatus !== 'all' && b.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchOrg = b.organizerName.toLowerCase().includes(q);
        const matchRoom = b.roomName.toLowerCase().includes(q);
        const matchDept = b.department?.toLowerCase().includes(q);
        if (!matchTitle && !matchOrg && !matchRoom && !matchDept) return false;
      }
      return true;
    });
  }, [bookings, filterDepartment, filterStatus, searchQuery]);

  if (isLoading) {
    return <AdminBookingsSkeleton />;
  }

  const renderStatusBadge = (status: Booking['status']) => {
    if (status === 'confirmed') {
      return (
        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/90 dark:bg-emerald-950/60 px-3.5 py-1.5 rounded-xl whitespace-nowrap border border-emerald-200/60 dark:border-emerald-900/50 inline-flex items-center gap-1.5 shadow-2xs">
          <Check className="w-3.5 h-3.5" />
          <span>تأیید شده</span>
        </span>
      );
    }
    if (status === 'pending_approval') {
      return (
        <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/60 px-3.5 py-1.5 rounded-xl whitespace-nowrap border border-amber-200/70 dark:border-amber-900/50 inline-flex items-center gap-1.5 shadow-2xs animate-pulse">
          <Clock className="w-3.5 h-3.5" />
          <span>در انتظار تأیید</span>
        </span>
      );
    }
    return (
      <span className="text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-100/90 dark:bg-rose-950/60 px-3.5 py-1.5 rounded-xl whitespace-nowrap border border-rose-200/60 dark:border-rose-900/50 inline-flex items-center gap-1.5 shadow-2xs">
        <X className="w-3.5 h-3.5" />
        <span>لغو شده</span>
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5 min-w-0">
      {/* Header */}
      <div className="bg-white dark:bg-[#1E293B] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[#10B981] dark:text-[#34D399] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#10B981]" />
              <span>نظارت جامع و مدیریت رزروهای سازمانی</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              جلسات و سالن‌های {currentOrg?.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              بررسی، تأیید درخواست‌های جلسات، مدیریت تداخل‌ها و نظارت بر برگزاری
            </p>
          </div>

          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-100 dark:bg-[#0F172A] p-1 rounded-xl border border-slate-200/80 dark:border-[#334155]">
            <button
              type="button"
              onClick={() => {
                setViewMode('cards');
                setUserPreferredView(true);
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-[#334155] text-[#0F786E] dark:text-[#34D399] shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="نمایش کارتی بهینه‌سازی‌شده برای موبایل و تبلت"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>نمای کارتی</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('table');
                setUserPreferredView(true);
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#334155] text-[#0F786E] dark:text-[#34D399] shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="نمایش جدولی فشرده"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>نمای جدول</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Badges Row (Lightweight, Modern, Informative Badges with generous padding-inline) */}
      <div className="bg-white dark:bg-[#1E293B] p-3.5 sm:p-4 px-4 sm:px-5 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Badge 1: کل جلسات */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/90 dark:bg-[#0F172A] border border-slate-200/80 dark:border-[#334155] text-xs">
            <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">کل جلسات:</span>
            <span className="font-extrabold text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-white dark:bg-[#1E293B] shadow-2xs">
              {toPersianDigits(counts.total)}
            </span>
          </div>

          {/* Badge 2: در انتظار بررسی */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-amber-800 dark:text-amber-300 font-medium">نیاز به تأیید:</span>
            <span className="font-extrabold text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-lg bg-white dark:bg-amber-900/50 shadow-2xs">
              {toPersianDigits(counts.pending)}
            </span>
            {counts.pending > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white animate-pulse">
                اقدام فوری
              </span>
            )}
          </div>

          {/* Badge 3: تأیید شده */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-emerald-800 dark:text-emerald-300 font-medium">تأیید شده:</span>
            <span className="font-extrabold text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-lg bg-white dark:bg-emerald-900/50 shadow-2xs">
              {toPersianDigits(counts.confirmed)}
            </span>
          </div>

          {/* Badge 4: لغو شده */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50 text-xs">
            <X className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="text-rose-800 dark:text-rose-300 font-medium">لغو شده:</span>
            <span className="font-extrabold text-rose-900 dark:text-rose-200 px-2 py-0.5 rounded-lg bg-white dark:bg-rose-900/40 shadow-2xs">
              {toPersianDigits(counts.cancelled)}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Department Filters Box */}
      <div className="bg-white dark:bg-[#1E293B] p-4 sm:p-5 px-4 sm:px-6 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="جستجوی عنوان، هماهنگ‌کننده یا اتاق..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#10B981] focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="relative">
            <Building className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full text-xs pr-10 pl-10 py-2.5 appearance-none bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#10B981] cursor-pointer"
            >
              <option value="all">همه دپارتمان‌ها و واحدها</option>
              {(currentOrg?.departments ?? []).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs pr-10 pl-10 py-2.5 appearance-none bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#10B981] cursor-pointer"
            >
              <option value="all">همه وضعیت‌های ثبت‌شده</option>
              <option value="pending_approval">در انتظار تأیید مدیریت (اقدام فوری)</option>
              <option value="confirmed">تأیید شده و نهایی</option>
              <option value="cancelled">لغو شده</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Content: Card View (Mobile & Tablet Friendly) OR Table View */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            جلسه‌ای مطابق فیلترهای انتخابی یافت نشد
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            می‌توانید عبارت جستجو را پاک کنید یا فیلتر وضعیت و دپارتمان را تغییر دهید.
          </p>
          {(searchQuery || filterDepartment !== 'all' || filterStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterDepartment('all');
                setFilterStatus('all');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#10B981] dark:text-[#34D399] bg-emerald-50 dark:bg-emerald-950/40 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>پاکسازی فیلترها</span>
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* ======================================================== */
        /* MOBILE & RESPONSIVE CARDS VIEW                           */
        /* ======================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filtered.map((b) => (
            <div
              key={b.id}
              className={`bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl border transition-all p-4.5 sm:p-5.5 px-4.5 sm:px-6 flex flex-col justify-between shadow-xs hover:shadow-md ${
                b.status === 'pending_approval'
                  ? 'border-amber-300/80 dark:border-amber-700/60 ring-2 ring-amber-400/20'
                  : 'border-slate-200 dark:border-[#334155]'
              }`}
            >
              <div className="space-y-3.5">
                {/* Card Header: Title & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {b.title}
                    </h3>
                    {b.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {b.description}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">{renderStatusBadge(b.status)}</div>
                </div>

                {/* Card Details Grid with individual cell inline-padding */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#0F172A]/70 border border-slate-100 dark:border-slate-800 text-xs">
                  {/* Room & Location */}
                  <div className="p-2.5 px-3 rounded-xl bg-white/90 dark:bg-[#1E293B]/90 border border-slate-100 dark:border-slate-800/80 shadow-2xs space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>اتاق و سالن:</span>
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block text-xs">
                      {b.roomName}
                    </span>
                  </div>

                  {/* Attendees */}
                  <div className="p-2.5 px-3 rounded-xl bg-white/90 dark:bg-[#1E293B]/90 border border-slate-100 dark:border-slate-800/80 shadow-2xs space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>تعداد حاضرین:</span>
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                      {toPersianDigits(b.attendeesCount)} نفر
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div className="p-2.5 px-3 rounded-xl bg-white/90 dark:bg-[#1E293B]/90 border border-slate-100 dark:border-slate-800/80 shadow-2xs space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>زمان جلسه:</span>
                    </span>
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {b.date}
                      </span>
                      <span className="text-[11px] text-[#10B981] dark:text-[#34D399] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40">
                        {b.startTime} الی {b.endTime}
                      </span>
                    </div>
                  </div>

                  {/* Coordinator & Department */}
                  <div className="p-2.5 px-3 rounded-xl bg-white/90 dark:bg-[#1E293B]/90 border border-slate-100 dark:border-slate-800/80 shadow-2xs space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>هماهنگ‌کننده:</span>
                    </span>
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate text-xs">
                        {b.organizerName}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 truncate">
                        {b.department || 'عمومی'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions (Touch-friendly and prominent on mobile with generous inline padding) */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-[#334155] flex items-center justify-between gap-2.5">
                {b.status === 'pending_approval' ? (
                  <div className="grid grid-cols-2 gap-2.5 w-full">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(b.id, 'confirmed', b.title)}
                      className="w-full py-2.5 px-4 bg-[#10B981] hover:bg-[#0D6B63] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>تأیید جلسه</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(b.id, 'cancelled', b.title)}
                      className="w-full py-2.5 px-4 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <X className="w-4 h-4" />
                      <span>رد درخواست</span>
                    </button>
                  </div>
                ) : b.status === 'confirmed' ? (
                  <div className="flex items-center justify-between w-full px-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>جلسه نهایی و در تقویم ثبت شده</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(b.id, 'cancelled', b.title)}
                      className="px-3.5 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="لغو اضطراری این جلسه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>لغو جلسه</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full px-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>این رزرو لغو گردیده است</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(b.id, 'confirmed', b.title)}
                      className="px-3.5 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>فعال‌سازی مجدد</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ======================================================== */
        /* DESKTOP TABLE VIEW                                       */
        /* ======================================================== */
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
                    <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {b.roomName}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200" dir="ltr">
                        {b.date}
                      </div>
                      <div className="text-[11px] text-[#10B981] dark:text-[#34D399] mt-0.5">
                        {b.startTime} الی {b.endTime}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{b.organizerName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{b.department || 'عمومی'}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                      {b.attendeesCount} نفر
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {renderStatusBadge(b.status)}
                    </td>
                    <td className="px-5 py-4 text-left whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {b.status === 'pending_approval' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(b.id, 'confirmed', b.title)}
                              className="px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 hover:bg-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title="تأیید این جلسه"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>تأیید</span>
                            </button>
                            <button
                              type="button"
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
                            type="button"
                            onClick={() => handleUpdateStatus(b.id, 'cancelled', b.title)}
                            className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-colors cursor-pointer"
                            title="لغو اضطراری جلسه"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {b.status === 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(b.id, 'confirmed', b.title)}
                            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            title="فعال‌سازی مجدد"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
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
      )}
    </div>
  );
};
