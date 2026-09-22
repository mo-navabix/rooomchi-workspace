import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  X,
  Check,
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

const POPUP_WIDTH = 320;
const POPUP_ESTIMATED_HEIGHT = 380;

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
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
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

  // Synchronize when value changes externally
  useEffect(() => {
    if (value) {
      const j = getInitialJalaliState();
      setViewYear(j.year);
      setViewMonth(j.month);
    }
  }, [value]);

  const updatePanelPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, POPUP_WIDTH), 360);

    let left = rect.right - width;
    if (left < 10) left = 10;
    if (left + width > window.innerWidth - 10) {
      left = window.innerWidth - width - 10;
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < POPUP_ESTIMATED_HEIGHT && rect.top > POPUP_ESTIMATED_HEIGHT;

    const top = openAbove
      ? Math.max(10, rect.top - POPUP_ESTIMATED_HEIGHT - 6)
      : Math.min(window.innerHeight - POPUP_ESTIMATED_HEIGHT - 10, rect.bottom + 6);

    setPanelPos({ top, left, width });
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      setPanelPos(null);
      setViewMode('days');
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

  // Years for quick year picker (-5 to +5 years)
  const yearsList = Array.from({ length: 12 }, (_, i) => todayJalali.year - 4 + i);

  const calendarPanel = isOpen && panelPos ? (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      className="fixed z-[130] bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-2xl shadow-2xl p-4 select-none animate-in fade-in zoom-in-95 duration-150"
      style={{
        top: panelPos.top,
        left: panelPos.left,
        width: panelPos.width,
        maxHeight: `min(${POPUP_ESTIMATED_HEIGHT + 40}px, calc(100vh - 20px))`,
        overflowY: 'auto',
      }}
    >
      {/* Header with Month/Year Navigation */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-[#334155]">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] transition-colors cursor-pointer"
          title="ماه قبل"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Clickable Month & Year for quick-select mode */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'months'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#334155]'
            }`}
          >
            {PERSIAN_MONTH_NAMES[viewMonth - 1]}
          </button>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'years'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'text-[#10B981] dark:text-[#34D399] hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            {toPersianDigits(viewYear)}
          </button>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] transition-colors cursor-pointer"
          title="ماه بعد"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Month Selection Mode */}
      {viewMode === 'months' && (
        <div className="grid grid-cols-3 gap-2 py-2">
          {PERSIAN_MONTH_NAMES.map((name, index) => {
            const mIndex = index + 1;
            const isSelected = mIndex === viewMonth;
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setViewMonth(mIndex);
                  setViewMode('days');
                }}
                className={`py-2 px-1 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#10B981] text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-[#0F172A] text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-[#10B981]/20 hover:text-[#10B981]'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}

      {/* Year Selection Mode */}
      {viewMode === 'years' && (
        <div className="grid grid-cols-3 gap-2 py-2">
          {yearsList.map((yr) => {
            const isSelected = yr === viewYear;
            return (
              <button
                key={yr}
                type="button"
                onClick={() => {
                  setViewYear(yr);
                  setViewMode('days');
                }}
                className={`py-2 px-1 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#10B981] text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-[#0F172A] text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-[#10B981]/20 hover:text-[#10B981]'
                }`}
              >
                {toPersianDigits(yr)}
              </button>
            );
          })}
        </div>
      )}

      {/* Days Selection Mode (Standard Calendar) */}
      {viewMode === 'days' && (
        <>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {PERSIAN_WEEK_DAYS.map((wd, index) => (
              <div
                key={index}
                className={`text-[11px] font-bold py-1 ${
                  index === 6
                    ? 'text-rose-500 dark:text-rose-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
                title={wd.name}
              >
                {wd.short}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {emptyDaysBefore.map((idx) => (
              <div key={`empty-${idx}`} className="h-9 w-9" />
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
                  className={`h-9 w-9 mx-auto rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#10B981] text-white font-black shadow-xs scale-105'
                      : isToday
                        ? 'border-2 border-[#10B981] text-[#10B981] dark:text-[#34D399] font-bold bg-emerald-50/60 dark:bg-emerald-950/40'
                        : isFriday
                          ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#334155]'
                  }`}
                >
                  <span>{toPersianDigits(day)}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Footer Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#334155] flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={handleSelectToday}
          className="text-[#10B981] dark:text-[#34D399] font-bold hover:underline flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>امروز ({toPersianDigits(todayJalali.day)} {PERSIAN_MONTH_NAMES[todayJalali.month - 1]})</span>
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#0F172A] dark:hover:bg-[#334155] text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
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
          className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5"
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
            : 'border-slate-200 dark:border-[#334155] bg-white dark:bg-[#0F172A] hover:border-slate-300 dark:hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          <CalendarIcon className="w-4 h-4 text-[#10B981] dark:text-[#34D399] shrink-0" />
          {value ? (
            <div className="flex items-baseline gap-1.5 truncate text-slate-900 dark:text-slate-100 font-medium min-w-0">
              <span className="font-bold text-[#10B981] dark:text-[#34D399] shrink-0 text-sm">
                {toPersianDigits(formattedDisplay)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
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
