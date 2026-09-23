import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Clock, Check, X } from 'lucide-react';
import { toPersianDigits } from '../../utils/jalali';

interface TimePickerProps {
  id?: string;
  label?: string;
  value: string; // "HH:MM" e.g. "09:00"
  onChange: (time: string) => void;
  minTime?: string; // e.g. "08:00"
  maxTime?: string; // e.g. "18:00"
  disabled?: boolean;
  required?: boolean;
  isEndTime?: boolean;
  referenceStartTime?: string;
  startTimeReference?: string;
  className?: string;
}

const ITEM_HEIGHT = 44; // Standard height in px for each wheel row
const VISIBLE_COUNT = 5; // Visible items (center is index 2)
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT; // 220px
const WHEEL_PADDING = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2; // 88px (exactly center item)

interface SingleWheelProps {
  items: number[];
  selectedValue: number;
  onSelect: (val: number) => void;
  padZero?: boolean;
}

const SingleWheel: React.FC<SingleWheelProps> = ({
  items,
  selectedValue,
  onSelect,
  padZero = true,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInternalScroll = useRef(false);
  const debounceTimer = useRef<number | null>(null);

  // Scroll to selected value on mount or change
  useEffect(() => {
    const idx = items.indexOf(selectedValue);
    if (idx !== -1 && scrollRef.current) {
      isInternalScroll.current = true;
      scrollRef.current.scrollTo({
        top: idx * ITEM_HEIGHT,
        behavior: 'smooth',
      });
      const timer = window.setTimeout(() => {
        isInternalScroll.current = false;
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [selectedValue, items]);

  const handleScroll = useCallback(() => {
    if (isInternalScroll.current) return;

    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = window.setTimeout(() => {
      if (!scrollRef.current) return;
      const top = scrollRef.current.scrollTop;
      const rawIndex = Math.round(top / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, rawIndex));
      const chosen = items[clampedIndex];
      if (chosen !== undefined && chosen !== selectedValue) {
        onSelect(chosen);
      }
    }, 60);
  }, [items, onSelect, selectedValue]);

  const handleClickItem = (itemVal: number, index: number) => {
    if (scrollRef.current) {
      isInternalScroll.current = true;
      scrollRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth',
      });
      onSelect(itemVal);
      setTimeout(() => {
        isInternalScroll.current = false;
      }, 250);
    }
  };

  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{ height: `${WHEEL_HEIGHT}px` }}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll no-scrollbar select-none"
        style={{
          scrollSnapType: 'y mandatory',
          paddingTop: `${WHEEL_PADDING}px`,
          paddingBottom: `${WHEEL_PADDING}px`,
        }}
      >
        {items.map((item, index) => {
          const isSelected = item === selectedValue;
          const diff = Math.abs(items.indexOf(selectedValue) - index);
          // English (Latin) formatted digits
          const str = padZero ? item.toString().padStart(2, '0') : item.toString();

          let opacity = 1;
          let scale = 1;
          if (isSelected) {
            opacity = 1;
            scale = 1.18;
          } else if (diff === 1) {
            opacity = 0.55;
            scale = 0.96;
          } else if (diff === 2) {
            opacity = 0.28;
            scale = 0.84;
          } else {
            opacity = 0.12;
            scale = 0.72;
          }

          return (
            <div
              key={item}
              onClick={() => handleClickItem(item, index)}
              style={{
                height: `${ITEM_HEIGHT}px`,
                scrollSnapAlign: 'center',
                opacity,
                transform: `scale(${scale})`,
              }}
              className={`flex items-center justify-center cursor-pointer transition-all duration-150 ${
                isSelected
                  ? 'font-black text-slate-900 dark:text-white'
                  : 'font-semibold text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="font-mono text-xl sm:text-2xl tracking-wider select-none text-slate-900 dark:text-white">
                {str}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TimePicker: React.FC<TimePickerProps> = ({
  id,
  label,
  value,
  onChange,
  minTime = '08:00',
  maxTime = '18:00',
  disabled = false,
  required = false,
  isEndTime = false,
  referenceStartTime,
  startTimeReference,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const refStart = referenceStartTime || startTimeReference;

  // Safe parse bounds
  const [minH, minM] = useMemo(() => {
    const [h, m] = (minTime || '08:00').split(':').map(Number);
    return [isNaN(h) ? 8 : h, isNaN(m) ? 0 : m];
  }, [minTime]);

  const [maxH, maxM] = useMemo(() => {
    const [h, m] = (maxTime || '18:00').split(':').map(Number);
    return [isNaN(h) ? 18 : h, isNaN(m) ? 0 : m];
  }, [maxTime]);

  // Current parsed hour and minute
  const [curH, curM] = useMemo(() => {
    const [h, m] = (value || '08:00').split(':').map(Number);
    return [isNaN(h) ? minH : h, isNaN(m) ? 0 : m];
  }, [value, minH]);

  // Temporary state while modal is open
  const [tempH, setTempH] = useState<number>(curH);
  const [tempM, setTempM] = useState<number>(curM);

  // Sync temp values when picker opens
  const openPicker = () => {
    if (disabled) return;
    setTempH(curH);
    setTempM(curM);
    setIsOpen(true);
  };

  // Allowed hours within org bounds
  const allowedHours = useMemo(() => {
    let startH = minH;
    let endH = maxH;

    if (isEndTime && refStart) {
      const [sh] = refStart.split(':').map(Number);
      if (!isNaN(sh) && sh >= startH) {
        startH = sh;
      }
    }

    const list: number[] = [];
    for (let h = startH; h <= endH; h++) {
      list.push(h);
    }
    return list.length > 0 ? list : [minH];
  }, [minH, maxH, isEndTime, refStart]);

  // Allowed minutes (5-minute step increments: 0, 5, 10, ..., 55)
  const allowedMinutes = useMemo(() => {
    const list: number[] = [];
    for (let m = 0; m < 60; m += 5) {
      list.push(m);
    }
    return list;
  }, []);

  // Ensure initial temp values are within bounds
  useEffect(() => {
    if (allowedHours.length > 0 && !allowedHours.includes(tempH)) {
      setTempH(allowedHours[0]);
    }
  }, [allowedHours, tempH]);

  // Confirm selection
  const handleConfirm = () => {
    let finalH = tempH;
    let finalM = tempM;

    // Boundary checks
    if (finalH === minH && finalM < minM) {
      finalM = minM;
    }
    if (finalH === maxH && finalM > maxM) {
      finalM = maxM;
    }

    if (isEndTime && refStart) {
      const [sh, sm] = refStart.split(':').map(Number);
      if (finalH === sh && finalM <= sm) {
        finalM = Math.min(55, sm + 15);
      }
    }

    const formatted = `${finalH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  // Duration label
  const durationText = useMemo(() => {
    if (!isEndTime || !refStart) return '';
    const [sh, sm] = refStart.split(':').map(Number);
    const [eh, em] = value.split(':').map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    if (diff <= 0) return '';
    if (diff < 60) return `${diff} دقیقه`;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return m === 0 ? `${h} ساعت` : `${h} ساعت و ${m} دقیقه`;
  }, [isEndTime, refStart, value]);

  // Duration label for temp selection inside dialog
  const tempDurationText = useMemo(() => {
    if (!isEndTime || !refStart) return '';
    const [sh, sm] = refStart.split(':').map(Number);
    const diff = tempH * 60 + tempM - (sh * 60 + sm);
    if (diff <= 0) return '';
    if (diff < 60) return `${diff} دقیقه`;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return m === 0 ? `${h} ساعت` : `${h} ساعت و ${m} دقیقه`;
  }, [isEndTime, refStart, tempH, tempM]);

  const currentFormatted = `${tempH.toString().padStart(2, '0')}:${tempM.toString().padStart(2, '0')}`;

  return (
    <div className={`space-y-1.5 ${className}`} id={id}>
      {label && (
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#0F786E] dark:text-[#5eead4]" />
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </div>
          {durationText && (
            <span className="text-[10px] font-semibold text-[#0F786E] dark:text-[#5eead4] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50">
              {durationText}
            </span>
          )}
        </div>
      )}

      {/* Button to open Time Picker Dialog with English digits */}
      <button
        type="button"
        disabled={disabled}
        onClick={openPicker}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-bold bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 transition-all cursor-pointer shadow-xs ${
          isOpen
            ? 'border-[#0F786E] ring-2 ring-[#0F786E]/30 bg-emerald-50/20'
            : 'border-slate-200 dark:border-[#334155] hover:border-[#0F786E]/60'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="font-mono text-base font-bold tracking-wider text-slate-800 dark:text-slate-100">
          {value}
        </span>
        <Clock className="w-4 h-4 text-[#0F786E] dark:text-[#5eead4]" />
      </button>

      {/* Centered Modal Dialog for Wheel Picker */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
          {/* Backdrop click dismiss */}
          <div
            className="absolute inset-0"
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog Card */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-[320px] bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#334155] p-5 space-y-4 animate-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#334155]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#0F786E] dark:text-[#5eead4] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {label ? `انتخاب ساعت ${label}` : 'انتخاب ساعت'}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    ساعات کاری: {minTime} الی {maxTime}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* iOS Roller Drum Container */}
            <div className="relative rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-100 dark:border-[#334155] overflow-hidden">
              {/* Center Highlight Selection Bar (Exact match to iOS wheel) */}
              <div
                className="absolute left-2 right-2 rounded-xl bg-slate-200/75 dark:bg-slate-700/60 pointer-events-none z-0 border border-slate-300/40 dark:border-slate-600/40"
                style={{
                  top: `${WHEEL_PADDING}px`,
                  height: `${ITEM_HEIGHT}px`,
                }}
              />

              {/* Top Gradient Fade */}
              <div
                className="absolute top-0 left-0 right-0 pointer-events-none z-10 bg-gradient-to-b from-slate-50 dark:from-[#0F172A] to-transparent"
                style={{ height: `${WHEEL_PADDING - 10}px` }}
              />

              {/* Bottom Gradient Fade */}
              <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none z-10 bg-gradient-to-t from-slate-50 dark:from-[#0F172A] to-transparent"
                style={{ height: `${WHEEL_PADDING - 10}px` }}
              />

              {/* Dual Roller Columns (Hours : Minutes in English LTR) */}
              <div className="flex items-center justify-center px-4 relative z-0" dir="ltr">
                {/* Hour Column */}
                <SingleWheel
                  items={allowedHours}
                  selectedValue={tempH}
                  onSelect={setTempH}
                  padZero={true}
                />

                {/* Colon Separator */}
                <div
                  className="flex items-center justify-center font-mono font-bold text-2xl text-slate-500 dark:text-slate-300 w-8 select-none"
                  style={{ height: `${ITEM_HEIGHT}px` }}
                >
                  :
                </div>

                {/* Minute Column */}
                <SingleWheel
                  items={allowedMinutes}
                  selectedValue={tempM}
                  onSelect={setTempM}
                  padZero={true}
                />
              </div>
            </div>

            {/* Column Labels precisely aligned with columns */}
            <div className="flex items-center px-4" dir="ltr">
              <div className="flex-1 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                ساعت
              </div>
              <div className="w-8" />
              <div className="flex-1 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                دقیقه
              </div>
            </div>

            {/* Live Preview & Duration if end time */}
            {tempDurationText && (
              <div className="text-center text-xs font-bold text-[#0F786E] dark:text-[#5eead4] bg-emerald-50 dark:bg-emerald-950/40 py-1.5 px-3 rounded-xl border border-emerald-200/50">
                مدت زمان جلسه: {tempDurationText}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0F786E] hover:bg-[#0D6B63] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>تأیید ساعت ({currentFormatted})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
