import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, X, Check } from 'lucide-react';
import { formatGregorianIsoLocal } from '../../utils/jalali';
import { formatOrgDigits, type OrgLocalePreferences } from '../../utils/orgLocale';
import { tPortal } from '../../i18n/portalUi';

const POPUP_WIDTH = 320;

interface GregorianDatePickerProps {
  id?: string;
  value: string;
  onChange: (isoDate: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  prefs: OrgLocalePreferences;
}

function parseIso(iso: string): { y: number; m: number; d: number } {
  const [ys, ms, ds] = iso.split('-');
  return { y: parseInt(ys, 10), m: parseInt(ms, 10), d: parseInt(ds, 10) };
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

export const GregorianDatePicker: React.FC<GregorianDatePickerProps> = ({
  id = 'gregorian-datepicker',
  value,
  onChange,
  label,
  placeholder,
  required = false,
  className = '',
  disabled = false,
  prefs,
}) => {
  const today = parseIso(formatGregorianIsoLocal());
  const initial = value ? parseIso(value) : today;
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initial.y);
  const [viewMonth, setViewMonth] = useState(initial.m);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: Math.max(8, r.right - POPUP_WIDTH) });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const monthLabel = new Date(viewYear, viewMonth - 1, 1).toLocaleDateString(
    prefs.language === 'en' ? 'en-US' : 'fa-IR',
    { month: 'long', year: 'numeric' },
  );

  const displayValue = value
    ? formatOrgDigits(
        prefs.language === 'en'
          ? value
          : value.replace(/-/g, '/'),
        prefs.language,
      )
    : '';

  const startWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const weekShort =
    prefs.language === 'en'
      ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
      : ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];

  const selectDay = (day: number) => {
    const mm = viewMonth < 10 ? `0${viewMonth}` : `${viewMonth}`;
    const dd = day < 10 ? `0${day}` : `${day}`;
    onChange(`${viewYear}-${mm}-${dd}`);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
          {label}
        </label>
      )}
      <button
        ref={anchorRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium cursor-pointer disabled:opacity-50"
      >
        <span className={displayValue ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
          {displayValue || placeholder || tPortal(prefs.language, 'pickDate')}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {isOpen &&
        createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[200] cursor-default"
              onClick={() => setIsOpen(false)}
              aria-label="close"
            />
            <div
              className="fixed z-[201] bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-600 rounded-2xl shadow-2xl p-4"
              style={{ top: pos.top, left: pos.left, width: POPUP_WIDTH }}
            >
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => {
                    if (viewMonth === 1) {
                      setViewYear((y) => y - 1);
                      setViewMonth(12);
                    } else setViewMonth((m) => m - 1);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold">
                  {prefs.language === 'fa' ? formatOrgDigits(monthLabel, 'fa') : monthLabel}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (viewMonth === 12) {
                      setViewYear((y) => y + 1);
                      setViewMonth(1);
                    } else setViewMonth((m) => m + 1);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-1">
                {weekShort.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) =>
                  day === null ? (
                    <span key={`e-${i}`} />
                  ) : (
                    <button
                      key={day}
                      type="button"
                      onClick={() => selectDay(day)}
                      className={`h-9 rounded-lg text-sm font-semibold cursor-pointer ${
                        value ===
                        `${viewYear}-${viewMonth < 10 ? `0${viewMonth}` : viewMonth}-${day < 10 ? `0${day}` : day}`
                          ? 'bg-[var(--brand-primary)] text-white'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {formatOrgDigits(day, prefs.language)}
                    </button>
                  ),
                )}
              </div>
              <div className="flex justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-slate-500 flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  {prefs.language === 'en' ? 'Close' : 'بستن'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(formatGregorianIsoLocal());
                    setIsOpen(false);
                  }}
                  className="text-xs font-bold text-brand flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  {tPortal(prefs.language, 'today')}
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
      {required && !value && <input type="text" required className="sr-only" tabIndex={-1} value="" readOnly />}
    </div>
  );
};
