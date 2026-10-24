import React from "react";
import { Booking, Room } from "../../types";
import { formatToJalali } from "../../utils/jalali";

export type CalendarDayInfo = {
  dayIndex: number;
  name: string;
  short: string;
  isoDate: string;
  isToday: boolean;
};

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 19;
const HOUR_HEIGHT_PX = 68;
const GRID_HEIGHT_PX = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT_PX;

const HOUR_LABELS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR },
  (_, i) => `${String(DAY_START_HOUR + i).padStart(2, "0")}:00`,
);

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

type PlacedBooking = {
  booking: Booking;
  column: number;
  columnCount: number;
};

function layoutDayBookings(dayBookings: Booking[]): PlacedBooking[] {
  const sorted = [...dayBookings].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );
  const placed: PlacedBooking[] = [];

  for (const booking of sorted) {
    const start = timeToMinutes(booking.startTime);
    const end = timeToMinutes(booking.endTime);

    const overlapping = placed.filter((p) => {
      const ps = timeToMinutes(p.booking.startTime);
      const pe = timeToMinutes(p.booking.endTime);
      return start < pe && end > ps;
    });

    const used = new Set(overlapping.map((p) => p.column));
    let column = 0;
    while (used.has(column)) column += 1;

    const columnCount = Math.max(
      column + 1,
      ...overlapping.map((p) => p.columnCount),
      1,
    );
    overlapping.forEach((p) => {
      p.columnCount = Math.max(p.columnCount, columnCount);
    });

    placed.push({ booking, column, columnCount });
  }

  return placed;
}

function bookingBlockStyle(
  booking: Booking,
  rooms: Room[],
  paletteIndex: number,
): string {
  const room = rooms.find((r) => r.id === booking.roomId);
  if (room?.color) {
    return "border-r-[3px] bg-white/95 dark:bg-[#334155]/95 shadow-sm ring-1 ring-slate-200/80 dark:ring-[#334155]";
  }
  const palettes = [
    "border-r-[3px] border-r-[var(--brand-primary)] bg-brand-soft/95 dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] ring-1 ring-[rgb(var(--brand-primary-rgb)/0.25)] dark:ring-[rgb(var(--brand-primary-rgb)/0.3)]",
    "border-r-[3px] border-r-[var(--brand-primary-light)] bg-brand-soft/95 dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] ring-1 ring-[rgb(var(--brand-primary-rgb)/0.25)] dark:ring-[rgb(var(--brand-primary-rgb)/0.3)]",
    "border-r-[3px] border-r-[var(--brand-primary-light)] bg-brand-soft/95 dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] ring-1 ring-[rgb(var(--brand-primary-rgb)/0.25)] dark:ring-[rgb(var(--brand-primary-rgb)/0.3)]",
    "border-r-[3px] border-r-amber-500 bg-amber-50/95 dark:bg-amber-950/40 ring-1 ring-amber-200/60 dark:ring-amber-900/40",
  ];
  return palettes[paletteIndex % palettes.length];
}

type CalendarTimeGridProps = {
  days: CalendarDayInfo[];
  bookingsByDay: Booking[][];
  rooms: Room[];
  className?: string;
  onSlotClick?: (isoDate: string, startTime: string) => void;
};

export const CalendarTimeGrid: React.FC<CalendarTimeGridProps> = ({
  days,
  bookingsByDay,
  rooms,
  className = "",
  onSlotClick,
}) => {
  const colTemplate = `minmax(2.5rem, 3.25rem) repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <div
      className={`bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden ${className}`}
    >
      <div
        className="grid border-b border-slate-200/80 dark:border-[#334155] bg-slate-50/50 dark:bg-[#0F172A]/50 text-center text-xs font-bold text-slate-600 dark:text-slate-300"
        style={{ gridTemplateColumns: colTemplate }}
      >
        <div className="p-2.5 sm:p-3.5 border-l border-slate-200/80 dark:border-[#334155] text-slate-400 text-[10px] sm:text-xs">
          ساعت
        </div>
        {days.map((d) => (
          <div
            key={d.isoDate}
            className={`p-2.5 sm:p-3.5 border-l border-slate-200/80 dark:border-[#334155] last:border-l-0 ${
              d.isToday
                ? "bg-[rgb(var(--brand-primary-rgb)/0.14)] dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] font-black ring-1 ring-inset ring-[rgb(var(--brand-primary-rgb)/0.22)] dark:ring-[rgb(var(--brand-primary-rgb)/0.28)]"
                : ""
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-0.5">
              <div className="flex items-center gap-1">
                <span>{days.length === 1 ? d.name : d.short}</span>
                {d.isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] inline-block animate-pulse" />
                )}
              </div>
              <span
                className={`text-[10px] font-mono ${
                  d.isToday
                    ? "text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] font-bold"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {formatToJalali(d.isoDate).split("/")[2]}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid text-xs" style={{ gridTemplateColumns: colTemplate }}>
        <div
          className="relative border-l border-slate-200/80 dark:border-[#334155] bg-slate-50/30 dark:bg-[#0F172A]/30"
          style={{ height: GRID_HEIGHT_PX }}
        >
          {HOUR_LABELS.map((hour, index) => (
            <div
              key={hour}
              className="absolute inset-x-0 flex items-start justify-center pt-0.5 font-mono text-[10px] text-slate-400 dark:text-slate-500"
              style={{ top: index * HOUR_HEIGHT_PX }}
            >
              {hour}
            </div>
          ))}
        </div>

        {days.map((d, dayIndex) => {
          const placed = layoutDayBookings(bookingsByDay[dayIndex] ?? []);

          return (
            <div
              key={d.isoDate}
              className={`relative border-l border-slate-200/80 dark:border-[#334155] last:border-l-0 ${
                d.isToday
                  ? "bg-[rgb(var(--brand-primary-rgb)/0.07)] dark:bg-[rgb(var(--brand-primary-rgb)/0.08)] shadow-[inset_0_0_0_1px_rgb(var(--brand-primary-rgb)/0.12)] dark:shadow-[inset_0_0_0_1px_rgb(var(--brand-primary-rgb)/0.18)]"
                  : "bg-white dark:bg-[#1E293B]"
              }`}
              style={{ height: GRID_HEIGHT_PX }}
            >
              {HOUR_LABELS.map((hour, index) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-t border-slate-100 dark:border-[#334155]/70 pointer-events-none"
                  style={{ top: index * HOUR_HEIGHT_PX }}
                />
              ))}
              <div
                className="absolute inset-x-0 bottom-0 border-t border-slate-100 dark:border-[#334155]/70 pointer-events-none"
              />

              {onSlotClick &&
                HOUR_LABELS.map((hour, index) => (
                  <button
                    key={`slot-${d.isoDate}-${hour}`}
                    type="button"
                    className="absolute inset-x-0 z-[1] border-0 bg-transparent cursor-pointer hover:bg-[rgb(var(--brand-primary-rgb)/0.08)] dark:hover:bg-[rgb(var(--brand-primary-rgb)/0.12)] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand-primary)] transition-colors"
                    style={{
                      top: index * HOUR_HEIGHT_PX,
                      height: HOUR_HEIGHT_PX,
                    }}
                    onClick={() => onSlotClick(d.isoDate, hour)}
                    aria-label={`رزرو ${d.name} ساعت ${hour}`}
                  />
                ))}

              {placed.map(({ booking: bk, column, columnCount }, bkIdx) => {
                const gridStartMin = DAY_START_HOUR * 60;
                const gridEndMin = DAY_END_HOUR * 60;
                const startMin = Math.max(
                  gridStartMin,
                  timeToMinutes(bk.startTime),
                );
                const endMin = Math.min(
                  gridEndMin,
                  timeToMinutes(bk.endTime),
                );
                const durationMin = Math.max(15, endMin - startMin);

                const topPx =
                  ((startMin - gridStartMin) / 60) * HOUR_HEIGHT_PX + 2;
                const heightPx = Math.max(
                  36,
                  (durationMin / 60) * HOUR_HEIGHT_PX - 4,
                );

                const gap = 4;
                const widthPercent = 100 / columnCount;
                const leftPercent = column * widthPercent;

                const room = rooms.find((r) => r.id === bk.roomId);
                const accentColor = room?.color ?? "var(--brand-primary)";
                const styleClass = bookingBlockStyle(bk, rooms, bkIdx);
                const compact = heightPx < 52;

                return (
                  <div
                    key={bk.id}
                    style={{
                      top: topPx,
                      height: heightPx,
                      left: `calc(${leftPercent}% + ${gap / 2}px)`,
                      width: `calc(${widthPercent}% - ${gap}px)`,
                      borderRightColor: accentColor,
                      zIndex: 10 + column,
                    }}
                    className={`absolute rounded-lg px-2 py-1.5 text-right overflow-hidden pointer-events-auto ${styleClass}`}
                    title={`${bk.title}\n${bk.roomName}\n${bk.startTime} – ${bk.endTime}`}
                  >
                    <p
                      className={`font-bold text-slate-800 dark:text-slate-100 leading-snug ${
                        compact
                          ? "text-[10px] line-clamp-1"
                          : "text-[11px] line-clamp-2"
                      }`}
                    >
                      {bk.title}
                    </p>
                    {!compact && (
                      <>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                          {bk.roomName}
                        </p>
                        <p className="text-[9px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          {bk.startTime} – {bk.endTime}
                        </p>
                        {bk.organizerName && (
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {bk.organizerName}
                          </p>
                        )}
                      </>
                    )}
                    {compact && (
                      <p className="text-[9px] font-mono text-slate-500 dark:text-slate-400 truncate">
                        {bk.startTime} – {bk.endTime}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
