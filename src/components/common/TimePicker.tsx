import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clock, ChevronDown } from 'lucide-react';
import { toPersianDigits, toEnglishDigits } from '../../utils/jalali';

interface TimePickerProps {
  id?: string;
  label?: string;
  value: string; // HH:MM in 24h format e.g. "10:00"
  onChange: (time: string) => void;
  minTime?: string;
  maxTime?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  isEndTime?: boolean;
  startTimeReference?: string;
  referenceStartTime?: string;
}

const ITEM_HEIGHT = 42; // height of each roller item in px
const VISIBLE_COUNT = 7; // 3 above, 1 center, 3 below (matching user's screenshot)
const ROLLER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT; // 294px
const HALF_PADDING = (ROLLER_HEIGHT - ITEM_HEIGHT) / 2; // 126px top & bottom spacer

const HOURS = Array.from({ length: 24 }, (_, i) => (i < 10 ? `0${i}` : `${i}`));
const MINUTES = Array.from({ length: 60 }, (_, i) => (i < 10 ? `0${i}` : `${i}`));

interface WheelColumnProps {
  items: string[];
  selectedValue: string;
  onSelect: (val: string) => void;
  label: string;
}

const WheelColumn: React.FC<WheelColumnProps> = ({
  items,
  selectedValue,
  onSelect,
  label,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = items.indexOf(selectedValue);
    return idx >= 0 ? idx : 0;
  });

  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startScrollTopRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync scroll position with external selectedValue without animation
  useEffect(() => {
    const idx = items.indexOf(selectedValue);
    if (idx >= 0) {
      setActiveIndex(idx);
      if (containerRef.current) {
        const targetScroll = idx * ITEM_HEIGHT;
        if (Math.abs(containerRef.current.scrollTop - targetScroll) > 1) {
          containerRef.current.scrollTop = targetScroll;
        }
      }
    }
  }, [selectedValue, items]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const currentIdx = Math.max(0, Math.min(items.length - 1, Math.round(scrollTop / ITEM_HEIGHT)));
    setActiveIndex(currentIdx);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (items[currentIdx] && items[currentIdx] !== selectedValue) {
        onSelect(items[currentIdx]);
      }
    }, 50);
  };

  const handleItemClick = (idx: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = idx * ITEM_HEIGHT;
    }
    setActiveIndex(idx);
    onSelect(items[idx]);
  };

  // Mouse Dragging Support for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    if (containerRef.current) {
      startScrollTopRef.current = containerRef.current.scrollTop;
    }

    const handleMouseMove = (moveEvt: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const delta = moveEvt.clientY - startYRef.current;
      containerRef.current.scrollTop = startScrollTopRef.current - delta;
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        const finalIdx = Math.max(0, Math.min(items.length - 1, Math.round(scrollTop / ITEM_HEIGHT)));
        containerRef.current.scrollTop = finalIdx * ITEM_HEIGHT;
        setActiveIndex(finalIdx);
        onSelect(items[finalIdx]);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="flex-1 flex flex-col items-center select-none relative">
      <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1">
        {label}
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        className="w-full relative overflow-y-auto cursor-grab active:cursor-grabbing snap-y snap-mandatory touch-pan-y"
        style={{
          height: `${ROLLER_HEIGHT}px`,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div style={{ height: `${HALF_PADDING}px` }} />

        {items.map((item, idx) => {
          const diff = Math.abs(idx - activeIndex);

          // 3D Drum Roller perspective matching the user's screenshot
          let opacity = 1;
          let scale = 1;
          let colorClass = 'text-slate-900 dark:text-white font-bold';

          if (diff === 0) {
            opacity = 1;
            scale = 1.18;
            colorClass = 'text-slate-900 dark:text-white font-black text-2xl';
          } else if (diff === 1) {
            opacity = 0.55;
            scale = 0.96;
            colorClass = 'text-slate-500 dark:text-slate-400 font-medium text-lg';
          } else if (diff === 2) {
            opacity = 0.32;
            scale = 0.86;
            colorClass = 'text-slate-400 dark:text-slate-500 font-normal text-base';
          } else if (diff === 3) {
            opacity = 0.16;
            scale = 0.76;
            colorClass = 'text-slate-300 dark:text-slate-600 font-light text-sm';
          } else {
            opacity = 0.06;
            scale = 0.68;
            colorClass = 'text-slate-200 dark:text-slate-700 font-light text-xs';
          }

          return (
            <div
              key={item}
              onClick={() => handleItemClick(idx)}
              style={{
                height: `${ITEM_HEIGHT}px`,
                opacity,
                transform: `scale(${scale})`,
                transition: 'none',
              }}
              className={`flex items-center justify-center snap-center cursor-pointer select-none tracking-wider ${colorClass}`}
            >
              {item}
            </div>
          );
        })}

        <div style={{ height: `${HALF_PADDING}px` }} />
      </div>
    </div>
  );
};

export const TimePicker: React.FC<TimePickerProps> = ({
  id = 'time-picker',
  label,
  value = '10:00',
  onChange,
  minTime,
  maxTime,
  disabled = false,
  required = false,
  placeholder = 'انتخاب زمان',
  className = '',
  isEndTime = false,
  startTimeReference,
  referenceStartTime,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const refStart = startTimeReference || referenceStartTime;
  const [typedValue, setTypedValue] = useState(value);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // Parse current hour and minute
  const [currentHour, currentMinute] = (() => {
    const parts = (value || '10:00').split(':');
    const h = parts[0] || '10';
    const m = parts[1] || '00';
    return [h.padStart(2, '0'), m.padStart(2, '0')];
  })();

  useEffect(() => {
    setTypedValue(value);
  }, [value]);

  const updatePanelPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const panelWidth = 310;
    const panelHeight = 390;

    let left = rect.right - panelWidth;
    if (left < 10) left = 10;
    if (left + panelWidth > window.innerWidth - 10) {
      left = window.innerWidth - panelWidth - 10;
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < panelHeight && rect.top > panelHeight;

    const top = openAbove
      ? Math.max(10, rect.top - panelHeight - 6)
      : Math.min(window.innerHeight - panelHeight - 10, rect.bottom + 6);

    setPanelPos({ top, left, width: panelWidth });
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
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
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

  const handleHourSelect = useCallback((newH: string) => {
    const newTime = `${newH}:${currentMinute}`;
    onChange(newTime);
  }, [currentMinute, onChange]);

  const handleMinuteSelect = useCallback((newM: string) => {
    const newTime = `${currentHour}:${newM}`;
    onChange(newTime);
  }, [currentHour, onChange]);

  const handleDirectInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toEnglishDigits(e.target.value).trim();
    setTypedValue(raw);

    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(raw)) {
      const [h, m] = raw.split(':');
      const formatted = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
      onChange(formatted);
    }
  };

  const handleDirectInputBlur = () => {
    const raw = toEnglishDigits(typedValue).trim();
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(raw)) {
      const [h, m] = raw.split(':');
      const formatted = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
      onChange(formatted);
      setTypedValue(formatted);
    } else {
      setTypedValue(value);
    }
  };

  const timePanel = isOpen && panelPos ? (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      className="fixed z-[130] bg-[#F8F9FA] dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-3xl shadow-2xl p-4 select-none animate-in fade-in zoom-in-95 duration-150"
      style={{
        top: panelPos.top,
        left: panelPos.left,
        width: panelPos.width,
      }}
    >
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-2.5 mb-3 border border-slate-200/80 dark:border-[#334155] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
          <Clock className="w-4 h-4 text-[#10B981]" />
          <span className="font-bold">{isEndTime ? 'ساعت پایان' : 'ساعت شروع'}:</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 dir-ltr font-black text-lg text-slate-900 dark:text-white">
            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] dark:text-[#34D399]">
              {currentHour}:{currentMinute}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            ({toPersianDigits(currentHour)}:{toPersianDigits(currentMinute)})
          </span>
        </div>
      </div>

      {/* iOS Wheel Drum Roller View (Matching exact user screenshot) */}
      <div className="relative bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/80 dark:border-[#334155] overflow-hidden p-2">
        {/* Horizontal Center Selection Lens (Matching exact soft rounded gray capsule in screenshot) */}
        <div
          className="absolute inset-x-3 pointer-events-none rounded-2xl bg-slate-200/65 dark:bg-slate-700/60 shadow-xs"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            height: `${ITEM_HEIGHT}px`,
            marginTop: '10px', // adjustment for label header above
          }}
        />

        {/* Top Cylindrical Vignette Fade */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none z-10 bg-gradient-to-b from-white dark:from-[#0F172A] via-white/85 dark:via-[#0F172A]/85 to-transparent"
          style={{ height: '80px' }}
        />

        {/* Bottom Cylindrical Vignette Fade */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none z-10 bg-gradient-to-t from-white dark:from-[#0F172A] via-white/85 dark:via-[#0F172A]/85 to-transparent"
          style={{ height: '80px' }}
        />

        {/* Two Roller Columns (Hours on the Left, Minutes on the Right) */}
        <div
          dir="ltr"
          className="flex items-center justify-center gap-6 relative z-0 dir-ltr"
        >
          {/* Hours Roller (Left) */}
          <WheelColumn
            items={HOURS}
            selectedValue={currentHour}
            onSelect={handleHourSelect}
            label="ساعت"
          />

          {/* Colon Separator in center */}
          <div
            className="flex items-center justify-center font-black text-2xl text-slate-400 dark:text-slate-500 select-none pb-1"
            style={{ marginTop: '16px' }}
          >
            :
          </div>

          {/* Minutes Roller (Right) */}
          <WheelColumn
            items={MINUTES}
            selectedValue={currentMinute}
            onSelect={handleMinuteSelect}
            label="دقیقه"
          />
        </div>
      </div>

      {/* Footer Controls */}
      <div className="mt-3 pt-2 border-t border-slate-200/70 dark:border-[#334155]">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="w-full py-2 rounded-xl bg-[#10B981] hover:bg-[#0D6B63] text-white text-xs font-bold transition-all cursor-pointer shadow-xs text-center"
        >
          تأیید زمان
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div
        ref={triggerRef}
        className={`w-full flex items-center justify-between rounded-xl border transition-all ${
          isOpen
            ? 'border-[#10B981] ring-2 ring-[#10B981]/20 bg-white dark:bg-[#0F172A]'
            : 'border-slate-200 dark:border-[#334155] bg-white dark:bg-[#0F172A] hover:border-slate-300 dark:hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <div className="flex-1 flex items-center gap-2 px-3 py-2">
          <Clock className="w-4 h-4 text-[#10B981] dark:text-[#34D399] shrink-0 pointer-events-none" />
          <input
            id={id}
            type="text"
            disabled={disabled}
            value={isFocused ? typedValue : toPersianDigits(typedValue)}
            onChange={handleDirectInputChange}
            onBlur={() => {
              setIsFocused(false);
              handleDirectInputBlur();
            }}
            onFocus={() => {
              if (!disabled) {
                setIsFocused(true);
                setIsOpen(true);
              }
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer tracking-wider text-left dir-ltr"
          />
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          tabIndex={-1}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {timePanel && createPortal(timePanel, document.body)}
    </div>
  );
};
