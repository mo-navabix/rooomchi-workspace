import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ApiService } from "../../services/apiService";
import type { Booking, Room } from "../../types";
import { UnifiedDashboardSkeleton } from "../common/Skeletons";

const cellBorder =
  "border-l border-slate-200/90 dark:border-slate-700/70 first:border-l-0";

const filterControlClass =
  "w-full h-10 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-[#1a2438] px-3 text-sm text-slate-800 dark:text-slate-100 shadow-xs transition-[border-color,box-shadow] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.2)] focus:border-[var(--brand-primary-light)] dark:focus:border-[var(--brand-primary-on-dark)]";

const PAGE_SIZE = 15;

function statusLabel(status: Booking["status"]): { text: string; className: string } {
  switch (status) {
    case "confirmed":
      return {
        text: "تأیید شده",
        className: "text-brand dark:text-[var(--brand-primary-on-dark)]",
      };
    case "pending_approval":
      return { text: "در انتظار تأیید", className: "text-amber-700 dark:text-amber-300" };
    case "cancelled":
      return { text: "لغو شده", className: "text-rose-600 dark:text-rose-400" };
    case "completed":
      return { text: "برگزار شده", className: "text-slate-500 dark:text-slate-400" };
    default:
      return { text: status, className: "text-slate-600" };
  }
}

export const MeetingsTableView: React.FC = () => {
  const { currentOrg, orgLocale, bookingsDataVersion } = useApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roomFilterId, setRoomFilterId] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query, roomFilterId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!currentOrg) {
        setBookings([]);
        setRooms([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [data, roomsData] = await Promise.all([
          ApiService.getBookings({
            orgId: currentOrg.id,
            scope: "all",
          }),
          ApiService.getRooms({ orgId: currentOrg.id }),
        ]);
        if (!cancelled) {
          setBookings(data);
          setRooms(roomsData);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setBookings([]);
        if (!cancelled) setRooms([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentOrg?.id, bookingsDataVersion]);

  const roomsSorted = useMemo(
    () => [...rooms].sort((a, b) => a.name.localeCompare(b.name, "fa")),
    [rooms],
  );

  const sorted = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const dateCmp = String(b.date).localeCompare(String(a.date));
      if (dateCmp !== 0) return dateCmp;
      return String(b.startTime).localeCompare(String(a.startTime));
    });
  }, [bookings]);

  const filtered = useMemo(() => {
    let list = sorted;
    if (roomFilterId !== "all") {
      list = list.filter((b) => b.roomId === roomFilterId);
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => {
      const hay = [
        b.title,
        b.roomName,
        b.organizerName,
        b.organizerEmail,
        b.department,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [sorted, query, roomFilterId]);

  const roomFilteredCount = useMemo(() => {
    if (roomFilterId === "all") return sorted.length;
    return sorted.filter((b) => b.roomId === roomFilterId).length;
  }, [sorted, roomFilterId]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  if (isLoading) {
    return <UnifiedDashboardSkeleton />;
  }

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4 min-w-0">
      <div className="flex flex-col gap-3">
        <div className="text-right">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">جدول جلسات</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {orgLocale.formatDigits(filtered.length)} جلسه
            {roomFilterId !== "all" || query.trim()
              ? ` (از ${orgLocale.formatDigits(roomFilteredCount)} در این فیلتر)`
              : ` از ${orgLocale.formatDigits(sorted.length)} رزرو سازمان`}
            {filtered.length > PAGE_SIZE && (
              <>
                {" "}
                · هر صفحه {orgLocale.formatDigits(PAGE_SIZE)} ردیف
              </>
            )}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <label className="block text-right min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              اتاق / سالن
            </span>
            <div className="relative mt-1">
              <select
                value={roomFilterId}
                onChange={(e) => setRoomFilterId(e.target.value)}
                className={`${filterControlClass} appearance-none cursor-pointer pl-10 pr-3 text-right`}
                dir="rtl"
              >
                <option value="all">همه اتاق‌ها</option>
                {roomsSorted.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500"
                aria-hidden
              />
            </div>
          </label>
          <label className="block text-right min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              جستجو
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="عنوان، رزروکننده…"
              className={`${filterControlClass} mt-1 placeholder:text-slate-400 dark:placeholder:text-slate-500`}
              dir="rtl"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-[#1a2438] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm leading-snug border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0D1527] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-[#334155]">
                <th className={`py-2.5 px-2 text-xs font-bold w-8 text-center ${cellBorder}`}>#</th>
                <th className={`py-2.5 px-2 text-xs font-bold w-[22%] ${cellBorder}`}>عنوان</th>
                <th className={`py-2.5 px-2 text-xs font-bold w-[14%] ${cellBorder}`}>تاریخ</th>
                <th className={`py-2.5 px-2 text-xs font-bold w-[16%] ${cellBorder}`}>ساعت</th>
                <th className={`py-2.5 px-2 text-xs font-bold w-[18%] ${cellBorder}`}>رزروکننده</th>
                <th className={`py-2.5 px-2 text-xs font-bold w-[18%] ${cellBorder}`}>اتاق</th>
                <th className={`py-2.5 px-2 text-xs font-bold w-[12%] ${cellBorder}`}>وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                    جلسه‌ای یافت نشد.
                  </td>
                </tr>
              )}
              {pageItems.map((b, index) => {
                const rowNum = (page - 1) * PAGE_SIZE + index + 1;
                const organizer = b.organizerName || b.organizerEmail || "—";
                const st = statusLabel(b.status);
                return (
                  <tr
                    key={b.id}
                    className={`transition-colors hover:bg-[rgb(var(--brand-primary-rgb)/0.06)] dark:hover:bg-[rgb(var(--brand-primary-rgb)/0.1)] ${
                      index % 2 === 1
                        ? "bg-slate-50/95 dark:bg-slate-800/35"
                        : "bg-white dark:bg-[#1a2438]/40"
                    }`}
                  >
                    <td
                      className={`py-2.5 px-2 text-center tabular-nums text-xs text-slate-400 ${cellBorder}`}
                    >
                      {orgLocale.formatDigits(rowNum)}
                    </td>
                    <td className={`py-2.5 px-2 font-semibold text-slate-800 dark:text-slate-100 truncate ${cellBorder}`}>
                      {b.title}
                    </td>
                    <td className={`py-2.5 px-2 whitespace-nowrap font-medium text-slate-800 dark:text-slate-100 text-xs ${cellBorder}`}>
                      {orgLocale.formatDate(b.date)}
                    </td>
                    <td className={`py-2.5 px-2 whitespace-nowrap tabular-nums text-slate-600 dark:text-slate-300 text-xs ${cellBorder}`} dir="ltr">
                      {orgLocale.formatDigits(b.startTime)}
                      <span className="text-slate-300 dark:text-slate-600 mx-1">–</span>
                      {orgLocale.formatDigits(b.endTime)}
                    </td>
                    <td className={`py-2.5 px-2 truncate text-slate-700 dark:text-slate-200 text-xs ${cellBorder}`}>
                      {organizer}
                    </td>
                    <td className={`py-2.5 px-2 truncate text-slate-700 dark:text-slate-200 text-xs ${cellBorder}`}>
                      {b.roomName || "—"}
                    </td>
                    <td className={`py-2.5 px-2 whitespace-nowrap text-[11px] font-bold ${st.className} ${cellBorder}`}>
                      {st.text}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > PAGE_SIZE && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-[#0f172a]/40">
            <p className="text-xs text-slate-500 dark:text-slate-400 order-2 sm:order-1">
              نمایش{" "}
              {orgLocale.formatDigits((page - 1) * PAGE_SIZE + 1)}–
              {orgLocale.formatDigits(Math.min(page * PAGE_SIZE, filtered.length))} از{" "}
              {orgLocale.formatDigits(filtered.length)}
            </p>
            <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-center">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#1a2438] text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                قبلی
              </button>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums px-2">
                {orgLocale.formatDigits(page)} / {orgLocale.formatDigits(pageCount)}
              </span>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#1a2438] text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                بعدی
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
