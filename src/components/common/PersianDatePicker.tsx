import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Check,
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse current selected value to Jalali, or fallback to today
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

  const [viewYear, setViewYear] = useState<number>(() => (selectedJalali ? selectedJalali.year : todayJalali.year));
  const [viewMonth, setViewMonth] = useState<number>(() => (selectedJalali ? selectedJalali.month : todayJalali.month));

  // Close calendar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Navigate months
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

  // Select day
  const handleSelectDay = (day: number) => {
    const iso = jalaliToIsoString(viewYear, viewMonth, day);
    onChange(iso);
    setIsOpen(false);
  };

  // Select Today
  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = getCurrentJalaliDate();
    setViewYear(today.year);
    setViewMonth(today.month);
    const iso = jalaliToIsoString(today.year, today.month, today.day);
    onChange(iso);
    setIsOpen(false);
  };

  // Clear date
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Calendar calculations
  const totalDays = getJalaliDaysInMonth(viewYear, viewMonth);
  const startWeekday = getJalaliMonthStartWeekday(viewYear, viewMonth); // 0..6 (0 is شنبه)

  const emptyDaysBefore = Array.from({ length: startWeekday }, (_, i) => i);
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  const formattedDisplay = value ? formatToJalali(value) : '';
  const descriptiveDisplay = value ? formatToJalaliDescriptive(value) : '';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Input button triggering the dropdown */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full text-right flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs transition-all ${
          isOpen
            ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20 bg-white dark:bg-[#0A0F1D]'
            : 'border-slate-300 dark:border-[#1E2E50] bg-white dark:bg-[#0A0F1D] hover:border-slate-400 dark:hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA] shrink-0" />
          {value ? (
            <div className="flex items-baseline gap-1.5 truncate text-slate-900 dark:text-slate-100 font-medium">
              <span className="font-mono font-bold text-[#2563EB] dark:text-[#60A5FA]">
                {toPersianDigits(formattedDisplay)}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
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

      {/* Dropdown Calendar Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 right-0 w-72 bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-2xl shadow-xl p-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header with Month/Year and navigation */}
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 dark:border-[#1E2E50]">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16243F] transition-colors"
              title="ماه قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="text-xs font-black text-slate-900 dark:text-slate-100">
              <span>{PERSIAN_MONTH_NAMES[viewMonth - 1]}</span>{' '}
              <span className="font-mono text-[#2563EB] dark:text-[#60A5FA]">{toPersianDigits(viewYear)}</span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16243F] transition-colors"
              title="ماه بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
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

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for start weekday */}
            {emptyDaysBefore.map((idx) => (
              <div key={`empty-${idx}`} className="h-7 w-7"></div>
            ))}

            {/* Month days */}
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

              // Day of week index
              const dIndex = (startWeekday + day - 1) % 7;
              const isFriday = dIndex === 6;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 mx-auto rounded-lg text-xs font-mono font-medium flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#2563EB] text-white font-bold shadow-xs'
                      : isToday
                      ? 'border border-[#2563EB] text-[#2563EB] dark:text-[#60A5FA] font-bold bg-blue-50/50 dark:bg-blue-950/30'
                      : isFriday
                      ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16243F]'
                  }`}
                >
                  {toPersianDigits(day)}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#1E2E50] flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[#2563EB] dark:text-[#60A5FA] font-bold hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>انتخاب امروز</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
