import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEK_DAYS,
  gregorianToJalali,
  jalaliToIsoString,
  getJalaliDaysInMonth,
  getJalaliMonthStartWeekday,
  formatToJalali,
  formatToJalaliDescriptive,
  getCurrentJalaliDate,
  toPersianDigits,
} from '../../utils/jalali';

const PANEL_MIN_WIDTH = 288;
const PANEL_ESTIMATED_HEIGHT = 340;

interface PersianDatePickerProps {
  id?: string;
  value: string; // ISO format: YYYY-MM-DD
  onChange: (isoDate: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  id = 'persian-datepicker',
  value,
  onChange,
  label,
  placeholder = 'انتخاب تاریخ شمسی',
  required = false,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(
    null
  );

  const getInitialJalaliState = () => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const gy = parseInt(parts[0], 10);
        const gm = parseInt(parts[1], 10);
        const gd = parseInt(parts[2], 10);
        if (!isNaN(gy) && !isNaN(gm) && !isNaN(gd)) {
          return gregorianToJalali(gy, gm, gd);
        }
      }
    }
    return getCurrentJalaliDate();
  };

  const todayJalali = getCurrentJalaliDate();
  const selectedJalali = value ? getInitialJalaliState() : null;

  const [viewYear, setViewYear] = useState<number>(() =>
    selectedJalali ? selectedJalali.year : todayJalali.year
  );
  const [viewMonth, setViewMonth] = useState<number>(() =>
    selectedJalali ? selectedJalali.month : todayJalali.month
  );

  const updatePanelPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, PANEL_MIN_WIDTH);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < PANEL_ESTIMATED_HEIGHT && rect.top > PANEL_ESTIMATED_HEIGHT;

    let left = rect.right - width;
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8);

    const top = openAbove
      ? Math.max(8, rect.top - PANEL_ESTIMATED_HEIGHT - 6)
      : Math.min(window.innerHeight - PANEL_ESTIMATED_HEIGHT - 8, rect.bottom + 6);

    setPanelPos({ top, left, width });
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      setPanelPos(null);
      return;
    }
    updatePanelPosition();
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);
    return () => {
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const iso = jalaliToIsoString(viewYear, viewMonth, day);
    onChange(iso);
    setIsOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = getCurrentJalaliDate();
    setViewYear(today.year);
    setViewMonth(today.month);
    const iso = jalaliToIsoString(today.year, today.month, today.day);
    onChange(iso);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const totalDays = getJalaliDaysInMonth(viewYear, viewMonth);
  const startWeekday = getJalaliMonthStartWeekday(viewYear, viewMonth);

  const emptyDaysBefore = Array.from({ length: startWeekday }, (_, i) => i);
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  const formattedDisplay = value ? formatToJalali(value) : '';
  const descriptiveDisplay = value ? formatToJalaliDescriptive(value) : '';

  const calendarPanel = isOpen && panelPos ? (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      className="fixed z-[120] bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-2xl shadow-2xl p-3.5"
      style={{
        top: panelPos.top,
        left: panelPos.left,
        width: panelPos.width,
        maxHeight: `min(${PANEL_ESTIMATED_HEIGHT}px, calc(100vh - 16px))`,
        overflowY: 'auto',
      }}
    >
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 dark:border-[#334155]">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] transition-colors cursor-pointer"
          title="ماه قبل"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="text-xs font-black text-slate-900 dark:text-slate-100">
          <span>{PERSIAN_MONTH_NAMES[viewMonth - 1]}</span>{' '}
          <span className="font-mono text-[#10B981] dark:text-[#34D399]">{toPersianDigits(viewYear)}</span>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] transition-colors cursor-pointer"
          title="ماه بعد"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
        {PERSIAN_WEEK_DAYS.map((wd, index) => (
          <div
            key={index}
            className={`text-[10px] font-bold py-1 ${
              index === 6 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
            }`}
            title={wd.name}
          >
            {wd.short}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {emptyDaysBefore.map((idx) => (
          <div key={`empty-${idx}`} className="h-8 w-8" />
        ))}

        {daysArray.map((day) => {
          const isSelected =
            selectedJalali &&
            selectedJalali.year === viewYear &&
            selectedJalali.month === viewMonth &&
            selectedJalali.day === day;

          const isToday =
            todayJalali.year === viewYear &&
            todayJalali.month === viewMonth &&
            todayJalali.day === day;

          const dIndex = (startWeekday + day - 1) % 7;
          const isFriday = dIndex === 6;

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleSelectDay(day)}
              className={`h-8 w-8 mx-auto rounded-lg text-xs font-mono font-medium flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#10B981] text-white font-bold shadow-xs'
                  : isToday
                    ? 'border border-[#10B981] text-[#10B981] dark:text-[#34D399] font-bold bg-emerald-50/50 dark:bg-emerald-950/30'
                    : isFriday
                      ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155]'
              }`}
            >
              {toPersianDigits(day)}
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#334155] flex items-center justify-between text-[11px]">
        <button
          type="button"
          onClick={handleSelectToday}
          className="text-[#10B981] dark:text-[#34D399] font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>انتخاب امروز</span>
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium cursor-pointer"
        >
          بستن
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <button
        type="button"
        id={id}
        ref={triggerRef}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full text-right flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs transition-all ${
          isOpen
            ? 'border-[#10B981] ring-2 ring-[#10B981]/20 bg-white dark:bg-[#0F172A]'
            : 'border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0F172A] hover:border-slate-400 dark:hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          <CalendarIcon className="w-4 h-4 text-[#10B981] dark:text-[#34D399] shrink-0" />
          {value ? (
            <div className="flex items-baseline gap-1.5 truncate text-slate-900 dark:text-slate-100 font-medium min-w-0">
              <span className="font-mono font-bold text-[#10B981] dark:text-[#34D399] shrink-0">
                {toPersianDigits(formattedDisplay)}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
                ({descriptiveDisplay})
              </span>
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors"
              title="پاک کردن تاریخ"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </button>

      {calendarPanel && createPortal(calendarPanel, document.body)}
    </div>
  );
};
