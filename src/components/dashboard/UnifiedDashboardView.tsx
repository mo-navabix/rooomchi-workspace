import React, { useMemo, useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ApiService } from "../../services/apiService";
import { Booking, Room, Stats, Team, User } from "../../types";
import {
  Activity,
  Bell,
  Calendar,
  CalendarDays,
  DoorOpen,
  Handshake,
  Megaphone,
  Palette,
  Plus,
  UserRound,
  Users,
  AlertTriangle,
  ArrowLeft,
  Code2,
  Package,
  type LucideIcon,
} from "lucide-react";
import { UserAvatar } from "../common/UserAvatar";
import {
  formatGregorianIsoLocal,
  formatToJalaliDescriptive,
  toPersianDigits,
} from "../../utils/jalali";
import { UnifiedDashboardSkeleton } from "../common/Skeletons";

const MEETING_ICON_STYLES = [
  "bg-[rgb(var(--brand-primary-rgb)/0.12)] text-brand dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] dark:text-[var(--brand-primary-on-dark)]",
  "bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
  "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
];

const TEAM_ICONS = [Megaphone, Palette, Package, Code2];

function meetingVisualForTitle(title: string, index: number): {
  Icon: LucideIcon;
  iconStyle: string;
} {
  const styles = MEETING_ICON_STYLES;
  const style = styles[index % styles.length];
  if (/مشتری|کارفرما|فروش/i.test(title)) {
    return { Icon: Handshake, iconStyle: style };
  }
  if (/مارکتینگ|بازاریابی/i.test(title)) {
    return { Icon: Megaphone, iconStyle: style };
  }
  if (/مصاحبه|استخدام/i.test(title)) {
    return { Icon: UserRound, iconStyle: style };
  }
  if (/تیم|اسپرینت|محصول|هماهنگی/i.test(title)) {
    return { Icon: Users, iconStyle: style };
  }
  return { Icon: DoorOpen, iconStyle: style };
}

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
    setActiveTab,
    currentUser,
    isRegistrationComplete,
    openCompleteProfileModal,
    openBookingModal,
  } = useApp();
  const [stats, setStats] = useState<Stats | null>(null);
  const [, setRooms] = useState<Room[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartRange, setChartRange] = useState<"week" | "month">("week");

  const todayStr = formatGregorianIsoLocal();
  const firstName = currentUser?.name?.split(" ")[0] || "کاربر";

  useEffect(() => {
    if (!currentOrg) return;
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [statsData, roomsData, bookingsData, teamsData, usersData] =
          await Promise.all([
            ApiService.getStats(currentOrg.id),
            ApiService.getRooms({ orgId: currentOrg.id }),
            ApiService.getBookings({ orgId: currentOrg.id, date: todayStr }),
            ApiService.getTeams(currentOrg.id).catch(() => [] as Team[]),
            ApiService.getUsers(currentOrg.id).catch(() => [] as User[]),
          ]);
        setStats(statsData);
        setRooms(roomsData);
        setTodayBookings(bookingsData.filter((b) => b.status !== "cancelled"));
        setTeams(teamsData);
        setOrgUsers(usersData.filter((u) => u.status === "active"));
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [currentOrg, todayStr, currentUser?.id]);

  const chartData =
    chartRange === "week"
      ? stats?.weeklyUsage ?? []
      : stats?.monthlyUsage ?? [];

  const monthlyGoals = stats?.monthlyGoals ?? [];

  const usersByEmail = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of orgUsers) {
      if (u.email?.trim()) map.set(u.email.trim().toLowerCase(), u);
    }
    return map;
  }, [orgUsers]);

  const displayMeetings = useMemo(() => {
    return todayBookings.slice(0, 4).map((b, idx) => {
      const { Icon, iconStyle } = meetingVisualForTitle(b.title, idx);
      return {
        id: b.id,
        title: b.title,
        room: b.roomName,
        time: `${toPersianDigits(b.startTime)} - ${toPersianDigits(b.endTime)}`,
        Icon,
        iconStyle,
        attendees: resolveAttendeesForBooking(b, usersByEmail, orgUsers, idx),
      };
    });
  }, [todayBookings, orgUsers, usersByEmail]);

  const notifications = [
    { text: "جلسه جدید ایجاد شد", time: "۱۰ دقیقه پیش", tone: "emerald" },
    { text: "علی کریمی به تیم اضافه شد", time: "۱ ساعت پیش", tone: "sky" },
    { text: "یادآوری جلسه فردا", time: "۳ ساعت پیش", tone: "amber" },
  ];

  const teamCards = teams.length > 0 ? teams.slice(0, 3) : [
    { id: "t1", name: "مارکتینگ", memberCount: 8 },
    { id: "t2", name: "طراحی", memberCount: 6 },
    { id: "t3", name: "محصول", memberCount: 5 },
  ];

  const utilization = stats?.utilizationRate ?? 0;
  const todayCount = todayBookings.length || stats?.todayBookingsCount || 0;
  const monthlyBookings = stats?.thisMonthBookingsCount ?? 0;
  const teamCount = teams.length || 5;
  const memberCount = orgUsers.length > 0 ? orgUsers.length * 6 : 32;

  if (isLoading) {
    return <UnifiedDashboardSkeleton />;
  }

  return (
    <div className="space-y-5 sm:space-y-6 select-none pb-4" id="unified-dashboard-view">
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
        <div className="text-right min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            سلام، {firstName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {formatToJalaliDescriptive(todayStr)} — خلاصهٔ فعالیت‌های امروز شما
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            isRegistrationComplete() ? openBookingModal() : openCompleteProfileModal()
          }
          className="portal-btn-primary flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-bold cursor-pointer shadow-sm shadow-[rgb(var(--brand-primary-rgb)/0.15)] dark:shadow-black/30 shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>رزرو اتاق جلسه جدید</span>
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-[#1a2438] p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">میزان استفاده</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {toPersianDigits(utilization)}٪
              </p>
              <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgb(var(--brand-primary-rgb)/0.12)] text-brand dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] dark:text-[var(--brand-primary-on-dark)]">
                فعالیت بهینه
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center text-violet-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-[#1a2438] p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">جلسات این ماه</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {toPersianDigits(monthlyBookings)}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                جلسات مرتبط با حساب شما در این ماه
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-primary-rgb)/0.12)] dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] flex items-center justify-center text-brand">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-[#1a2438] p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">تیم‌های من</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {toPersianDigits(teamCount)}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                {toPersianDigits(memberCount)} عضو
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center text-sky-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-[#1a2438] p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">جلسات امروز</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {toPersianDigits(todayCount)}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">نسبت به دیروز</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart + today's meetings */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
        <div className="xl:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-[#1a2438] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4 min-h-8">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-8 m-0">
                فعالیت جلسات
              </h2>
              <select
                value={chartRange}
                onChange={(e) => setChartRange(e.target.value as "week" | "month")}
                className="portal-select-compact"
                aria-label="بازه نمایش نمودار"
              >
                <option value="week">هفتگی</option>
                <option value="month">ماهانه</option>
              </select>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-500 mb-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--brand-primary)]" />
                برگزار شده
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[rgb(var(--brand-primary-rgb)/0.25)] dark:bg-[rgb(var(--brand-primary-rgb)/0.4)]" />
                برنامه‌ریزی شده
              </span>
            </div>
            <div className="h-48 flex items-end justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
              {chartData.length === 0 && (
                <p className="text-xs text-slate-500 w-full text-center py-10">
                  هنوز داده‌ای برای نمایش نمودار ثبت نشده است.
                </p>
              )}
              {chartData.map((w) => {
                const planned = w.percentage;
                const done = w.completedPercentage ?? 0;
                return (
                  <div
                    key={`${w.date}-${w.day}`}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end min-w-0"
                  >
                    <div
                      className="w-full max-w-[32px] h-full flex flex-col justify-end rounded-t-lg overflow-hidden bg-[rgb(var(--brand-primary-rgb)/0.12)]/80 dark:bg-[rgb(var(--brand-primary-rgb)/0.12)]"
                    >
                      <div
                        className="w-full bg-[rgb(var(--brand-primary-rgb)/0.35)] dark:bg-[rgb(var(--brand-primary-rgb)/0.18)]"
                        style={{ height: `${Math.max(0, planned - done)}%` }}
                      />
                      <div
                        className="w-full bg-[var(--brand-primary)]"
                        style={{ height: `${done}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium truncate w-full text-center">
                      {w.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-[#1a2438] p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              اهداف ماهانه
            </h2>
            <div className="space-y-4">
              {monthlyGoals.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">
                  برای این ماه هنوز جلسه‌ای ثبت نشده است.
                </p>
              )}
              {monthlyGoals.map((g) => (
                <div key={g.label}>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    <span>{g.label}</span>
                    <span>
                      {toPersianDigits(g.pct)}٪ ({toPersianDigits(g.count)} از{" "}
                      {toPersianDigits(g.target)})
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-[var(--brand-primary)] to-[var(--brand-primary-lighter)]"
                      style={{ width: `${g.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-[#1a2438] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              جلسات امروز
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab("calendar")}
              className="text-xs font-bold text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] cursor-pointer"
            >
              مشاهده همه
            </button>
          </div>
          <div className="space-y-3">
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
                <div className="text-left shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400 min-w-[72px]">
                  {m.time}
                </div>
                <div className="flex items-center -space-x-2 -space-x-reverse shrink-0 min-w-[4.5rem] justify-end">
                  {m.attendees.length > 0
                    ? m.attendees.map((u, i) => (
                        <UserAvatar
                          key={u.id || `${m.id}-av-${i}`}
                          user={u}
                          size="xs"
                          shape="circle"
                          showBorder
                          className="!w-7 !h-7 ring-2 ring-white dark:ring-slate-800"
                        />
                      ))
                    : (
                        <UserAvatar
                          name={m.title}
                          size="xs"
                          shape="circle"
                          showBorder
                          className="!w-7 !h-7 ring-2 ring-white dark:ring-slate-800"
                        />
                      )}
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {m.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{m.room}</p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.iconStyle}`}
                  title={m.room}
                >
                  <m.Icon className="w-5 h-5" strokeWidth={2} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-[#1a2438] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">تیم‌های من</h2>
            <button
              type="button"
              onClick={() => setActiveTab("teams")}
              className="text-xs font-bold text-[var(--brand-primary)] cursor-pointer"
            >
              مدیریت
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {teamCards.map((t, idx) => {
              const Icon = TEAM_ICONS[idx % TEAM_ICONS.length];
              const count =
                "memberCount" in t && typeof t.memberCount === "number"
                  ? t.memberCount
                  : (t as Team).members?.length ?? 0;
              return (
                <div
                  key={t.id}
                  className="min-w-[100px] flex-1 rounded-xl border border-slate-200 dark:border-slate-600 p-3 bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <Icon className="w-5 h-5 text-[var(--brand-primary)] mb-2" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {t.name}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {toPersianDigits(count)} نفر
                  </p>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setActiveTab("teams")}
              className="min-w-[72px] rounded-xl border border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span className="text-[10px] font-bold mt-1">تیم</span>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-[#1a2438] p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            اعضای فعال
          </h2>
          <ul className="divide-y divide-slate-200/90 dark:divide-slate-700/60">
            {(orgUsers.length > 0
              ? orgUsers
              : [
                  { id: "1", name: "سارا حسینی", jobTitle: "طراح محصول" },
                  { id: "2", name: "امیر کریمی", jobTitle: "توسعه‌دهنده" },
                  { id: "3", name: "مریم احمدی", jobTitle: "مارکتینگ" },
                ]
            ).slice(0, 4).map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <UserAvatar
                  user={u as User}
                  name={(u as User).name}
                  size="sm"
                  shape="circle"
                  className="shrink-0"
                />
                <div className="text-right min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {u.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {(u as User).jobTitle || "عضو تیم"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-[#1a2438] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">اعلان‌ها</h2>
          </div>
          <ul className="divide-y divide-slate-200/90 dark:divide-slate-700/60">
            {notifications.map((n, i) => (
              <li key={i} className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
                <span
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    n.tone === "emerald"
                      ? "bg-[var(--brand-primary)]"
                      : n.tone === "sky"
                        ? "bg-sky-500"
                        : "bg-amber-500"
                  }`}
                />
                <div className="text-right flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {n.text}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{n.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
