import React, { useMemo, useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ApiService } from "../../services/apiService";
import { Booking, Room, Stats, User } from "../../types";
import {
  Calendar,
  CalendarDays,
  Plus,
  AlertTriangle,
  ArrowLeft,
  Table2,
} from "lucide-react";
import { UserAvatar } from "../common/UserAvatar";
import {
  formatGregorianIsoLocal,
  formatToJalaliDescriptive,
  toPersianDigits,
} from "../../utils/jalali";
import { UnifiedDashboardSkeleton } from "../common/Skeletons";

function resolveAttendeesForBooking(
  booking: Pick<
    Booking,
    "organizerEmail" | "organizerName" | "attendeeEmails" | "attendeesCount"
  >,
  usersByEmail: Map<string, User>,
  allActiveUsers: User[],
  rowIndex: number,
  max = 3,
): User[] {
  const emails: string[] = [];
  if (booking.organizerEmail?.trim()) {
    emails.push(booking.organizerEmail.trim().toLowerCase());
  }
  for (const e of booking.attendeeEmails ?? []) {
    if (e?.trim()) emails.push(e.trim().toLowerCase());
  }
  const seen = new Set<string>();
  const resolved: User[] = [];
  for (const email of emails) {
    if (seen.has(email)) continue;
    seen.add(email);
    const u = usersByEmail.get(email);
    if (u) resolved.push(u);
    else if (email === booking.organizerEmail?.trim().toLowerCase()) {
      resolved.push({
        id: `org-${email}`,
        name: booking.organizerName || "برگزارکننده",
        email,
        orgId: "",
        role: "employee",
        department: "",
        status: "active",
        createdAt: "",
      });
    }
  }
  if (resolved.length > 0) return resolved.slice(0, max);

  const count = Math.min(
    max,
    Math.max(1, booking.attendeesCount || 1),
    allActiveUsers.length || max,
  );
  if (allActiveUsers.length > 0) {
    const out: User[] = [];
    for (let i = 0; i < count; i++) {
      out.push(allActiveUsers[(rowIndex + i) % allActiveUsers.length]);
    }
    return out;
  }
  return [];
}

export const UnifiedDashboardView: React.FC = () => {
  const {
    currentOrg,
    orgLocale,
    setActiveTab,
    currentUser,
    isRegistrationComplete,
    openCompleteProfileModal,
    openBookingModal,
    bookingsDataVersion,
  } = useApp();

  const [stats, setStats] = useState<Stats | null>(null);
  const [, setRooms] = useState<Room[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const todayStr = formatGregorianIsoLocal();
  const todayDateLabel = useMemo(
    () => formatToJalaliDescriptive(todayStr),
    [todayStr],
  );
  const firstName = currentUser?.name?.split(" ")[0] || "کاربر";

  useEffect(() => {
    if (!currentOrg) return;
    const loadData = async (silent = false) => {
      try {
        if (!silent) setIsLoading(true);
        const [statsData, roomsData, bookingsData, allBookingsData, usersData] =
          await Promise.all([
            ApiService.getStats(currentOrg.id),
            ApiService.getRooms({ orgId: currentOrg.id }),
            ApiService.getBookings({ orgId: currentOrg.id, date: todayStr }),
            ApiService.getBookings({
              orgId: currentOrg.id,
              scope: "all",
            }).catch(() => [] as Booking[]),
            ApiService.getUsers(currentOrg.id).catch(() => [] as User[]),
          ]);
        setStats(statsData);
        setRooms(roomsData);
        setTodayBookings(bookingsData.filter((b) => b.status !== "cancelled"));
        setRecentBookings(allBookingsData);
        setOrgUsers(usersData.filter((u) => u.status === "active"));
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData(bookingsDataVersion > 0);
  }, [currentOrg, todayStr, currentUser?.id, bookingsDataVersion]);

  const lastTenReservations = useMemo(() => {
    const sessionStartMs = (b: Booking) => {
      const datePart = String(b.date).slice(0, 10);
      const timePart = (b.startTime || "00:00").slice(0, 5);
      return new Date(`${datePart}T${timePart}:00`).getTime();
    };
    return [...recentBookings]
      .filter((b) => b.status !== "cancelled")
      .sort((a, b) => sessionStartMs(a) - sessionStartMs(b))
      .slice(-10);
  }, [recentBookings]);

  const usersByEmail = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of orgUsers) {
      if (u.email?.trim()) map.set(u.email.trim().toLowerCase(), u);
    }
    return map;
  }, [orgUsers]);

  const displayMeetings = useMemo(() => {
    return todayBookings.slice(0, 4).map((b, idx) => ({
      id: b.id,
      title: b.title,
      room: b.roomName,
      time: `${toPersianDigits(b.startTime)} - ${toPersianDigits(b.endTime)}`,
      attendees: resolveAttendeesForBooking(b, usersByEmail, orgUsers, idx),
    }));
  }, [todayBookings, orgUsers, usersByEmail]);

  const monthlyBookings = stats?.thisMonthBookingsCount ?? 0;

  if (isLoading) {
    return <UnifiedDashboardSkeleton />;
  }

  return (
    <div
      className="space-y-5 sm:space-y-6 select-none pb-4"
      id="unified-dashboard-view"
    >
      {currentUser && !isRegistrationComplete() && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 dark:text-amber-200">
              برای رزرو اتاق، مشخصات حساب خود را تکمیل کنید.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCompleteProfileModal()}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold cursor-pointer shrink-0"
          >
            تکمیل مشخصات
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-right min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            سلام، {firstName} عزیز
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {formatToJalaliDescriptive(todayStr)} — خلاصهٔ فعالیت‌های امروز شما
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            isRegistrationComplete()
              ? openBookingModal()
              : openCompleteProfileModal()
          }
          className="portal-btn-primary flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-bold cursor-pointer shadow-sm shadow-[rgb(var(--brand-primary-rgb)/0.15)] dark:shadow-black/30 shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>رزرو اتاق جلسه جدید</span>
        </button>
      </div>

      {/* Recent reservations table + today's meetings */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
        <div className="xl:col-span-7 flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-[#1a2438] p-5 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                ده جلسهٔ آخر رزرو شده
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {lastTenReservations.length > 0
                  ? `${orgLocale.formatDigits(lastTenReservations.length)} رزرو اخیر سازمان`
                  : "لیست به‌روز رزروهای ثبت‌شده"}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-700/70">
            <table className="w-full min-w-[480px] text-right text-sm leading-snug border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0D1527] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-[#334155]">
                  <th className="py-2.5 px-3 text-xs font-bold whitespace-nowrap w-9 text-center border-l border-slate-200/90 dark:border-slate-700/70 first:border-l-0">
                    #
                  </th>
                  <th className="py-2.5 px-3 text-xs font-bold whitespace-nowrap border-l border-slate-200/90 dark:border-slate-700/70 first:border-l-0">
                    تاریخ
                  </th>
                  <th className="py-2.5 px-3 text-xs font-bold whitespace-nowrap border-l border-slate-200/90 dark:border-slate-700/70 first:border-l-0">
                    ساعت
                  </th>
                  <th className="py-2.5 px-3 text-xs font-bold whitespace-nowrap border-l border-slate-200/90 dark:border-slate-700/70 first:border-l-0">
                    رزروکننده
                  </th>
                  <th className="py-2.5 px-3 text-xs font-bold whitespace-nowrap border-l border-slate-200/90 dark:border-slate-700/70 first:border-l-0">
                    نام اتاق
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {lastTenReservations.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      <p className="text-sm font-medium">
                        هنوز رزروی ثبت نشده است.
                      </p>
                    </td>
                  </tr>
                )}
                {lastTenReservations.map((b, index) => {
                  const organizer = b.organizerName || b.organizerEmail || "—";
                  return (
                    <tr
                      key={b.id}
                      className={`transition-colors hover:bg-[rgb(var(--brand-primary-rgb)/0.06)] dark:hover:bg-[rgb(var(--brand-primary-rgb)/0.1)] ${
                        index % 2 === 1
                          ? "bg-slate-50/95 dark:bg-slate-800/35"
                          : "bg-white dark:bg-[#1a2438]/40"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center tabular-nums text-xs text-slate-400 dark:text-slate-500 border-l border-slate-200/90 dark:border-slate-700/70 first:border-l-0">
                        {orgLocale.formatDigits(index + 1)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-100 border-l border-slate-200/90 dark:border-slate-700/70 first:border-l-0">
                        {orgLocale.formatDate(b.date)}
                      </td>
                      <td
                        className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 tabular-nums border-l border-slate-200/90 dark:border-slate-700/70 first:border-l-0"
                        dir="ltr"
                      >
                        {orgLocale.formatDigits(b.startTime)}
                        <span className="text-slate-300 dark:text-slate-600 mx-1.5">
                          –
                        </span>
                        {orgLocale.formatDigits(b.endTime)}
                      </td>
                      <td className="py-2.5 px-3 max-w-[11rem] font-medium text-slate-700 dark:text-slate-200 truncate border-l border-slate-200/90 dark:border-slate-700/70 first:border-l-0">
                        {organizer}
                      </td>
                      <td className="py-2.5 px-3 max-w-[12rem] text-slate-700 dark:text-slate-200 truncate border-l border-slate-200/90 dark:border-slate-700/70 first:border-l-0">
                        {b.roomName || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveTab("meetings-table")}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold border border-slate-200/90 dark:border-slate-600 bg-white dark:bg-[#1a2438] text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#0f172a]/80 transition-colors cursor-pointer shadow-xs"
            >
              <Table2 className="w-4 h-4 text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)]" />
              جدول جلسات
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("calendar")}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold border border-slate-200/90 dark:border-slate-600 bg-white dark:bg-[#1a2438] text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#0f172a]/80 transition-colors cursor-pointer shadow-xs"
            >
              <Calendar className="w-4 h-4 text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)]" />
              تقویم جلسات
            </button>
          </div>
        </div>

        <div className="xl:col-span-5 flex flex-col gap-3 xl:min-h-0">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-[#1a2438] px-3 py-3 sm:px-4 sm:py-3.5 shadow-sm">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[rgb(var(--brand-primary-rgb)/0.12)] dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] flex items-center justify-center text-brand shrink-0">
                <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-right min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 leading-tight truncate">
                  جلسات این ماه
                </p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                  {toPersianDigits(monthlyBookings)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-[#1a2438] px-3 py-3 sm:px-4 sm:py-3.5 shadow-sm">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 shrink-0">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-right min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 leading-tight truncate">
                  جلسات امروز
                </p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                  {toPersianDigits(
                    todayBookings.length || stats?.todayBookingsCount || 0,
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col flex-1 min-h-[18rem] rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-[#1a2438] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white min-w-0 truncate">
                <span>جلسات امروز</span>
                {todayDateLabel ? (
                  <>
                    <span
                      className="text-slate-300 dark:text-slate-600 font-normal mx-1.5"
                      aria-hidden="true"
                    >
                      ·
                    </span>
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-xs sm:text-[13px]">
                      {todayDateLabel}
                    </span>
                  </>
                ) : null}
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab("calendar")}
                className="text-xs font-bold text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] cursor-pointer"
              >
                مشاهده همه
              </button>
            </div>
            <div className="space-y-3 flex-1 min-h-0">
              {displayMeetings.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
                  برای امروز جلسه‌ای در تقویم شما ثبت نشده است.
                </p>
              )}
              {displayMeetings.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50"
                >
                  <div className="shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400 min-w-[4.5rem] text-left tabular-nums">
                    {m.time}
                  </div>
                  <div className="flex-1 min-w-0 text-center px-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      <span>{m.title}</span>
                      <span
                        className="text-slate-400 dark:text-slate-500 font-normal mx-1.5"
                        aria-hidden="true"
                      >
                        ·
                      </span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {m.room}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center -space-x-2 -space-x-reverse shrink-0">
                    {m.attendees.length > 0 ? (
                      m.attendees.map((u, i) => (
                        <UserAvatar
                          key={u.id || `${m.id}-av-${i}`}
                          user={u}
                          size="xs"
                          shape="circle"
                          showBorder
                          className="!w-8 !h-8 ring-2 ring-white dark:ring-slate-800"
                        />
                      ))
                    ) : (
                      <UserAvatar
                        name={m.title}
                        size="xs"
                        shape="circle"
                        showBorder
                        className="!w-8 !h-8 ring-2 ring-white dark:ring-slate-800"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
