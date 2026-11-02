import React from 'react';
import { Clock } from 'lucide-react';
import type { NotificationSettings } from '../../types';
import { toPersianDigits } from '../../utils/jalali';

type Props = {
  settings: NotificationSettings;
  onChange: (next: NotificationSettings) => void;
  /** بدون کارت و عنوان جدا — داخل همان پنل کانال‌ها */
  embedded?: boolean;
};

function ReminderMasterSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex shrink-0 w-11 h-6 transition-colors rounded-full ${
        checked ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
      } ${disabled ? 'opacity-40' : 'cursor-pointer'}`}
      style={{ direction: 'ltr' }}
    >
      <span
        className={`inline-block w-5 h-5 mt-0.5 rounded-full bg-white shadow transform transition-transform ${
          checked ? 'translate-x-5 ml-0.5' : 'translate-x-0 ml-0.5'
        }`}
      />
    </button>
  );
}

export const MeetingReminderSettingsPanel: React.FC<Props> = ({
  settings,
  onChange,
  embedded = false,
}) => {
  const mr = settings.meetingReminders;

  const patch = (partial: Partial<NotificationSettings['meetingReminders']>) => {
    onChange({
      ...settings,
      meetingReminders: { ...mr, ...partial },
    });
  };

  const patchChannels = (partial: Partial<NotificationSettings['meetingReminders']['channels']>) => {
    onChange({
      ...settings,
      meetingReminders: {
        ...mr,
        channels: { ...mr.channels, ...partial },
      },
    });
  };

  const fields = (
    <>
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${embedded ? '' : 'pt-4'}`}>
        <label className="flex flex-col gap-1.5 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-200">زمان قبل از شروع</span>
          <select
            value={mr.minutesBefore}
            onChange={(e) => patch({ minutesBefore: Number(e.target.value) })}
            disabled={!mr.enabled}
            className="rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0F172A] px-3 py-2 text-slate-800 dark:text-slate-200 disabled:opacity-50"
          >
            <option value={5}>{toPersianDigits(5)} دقیقه</option>
            <option value={15}>{toPersianDigits(15)} دقیقه (پیشنهادی)</option>
            <option value={30}>{toPersianDigits(30)} دقیقه</option>
            <option value={60}>{toPersianDigits(60)} دقیقه</option>
          </select>
        </label>

        <div className="flex flex-col gap-2 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-200">کانال‌های یادآوری</span>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['sms', 'پیامک'],
                ['telegram', 'تلگرام'],
                ['inApp', 'درون‌برنامه‌ای'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                  mr.channels[key]
                    ? 'border-brand-soft bg-brand-soft/40 text-brand dark:text-[var(--brand-primary-on-dark)]'
                    : 'border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-400'
                } ${!mr.enabled ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={mr.channels[key]}
                  onChange={(e) => patchChannels({ [key]: e.target.checked })}
                  className="rounded"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>
      {!embedded && (
        <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
          قالب پیامک در همین تب (گزینه «یادآوری قبل از جلسه») و سایر جزئیات در تب ماتریس رویدادها.
        </p>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="px-5 py-4 border-b border-slate-100 dark:border-[#334155] bg-slate-50/80 dark:bg-[#0F172A]/40 text-right space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">یادآوری خودکار جلسه</span>
          </div>
          <ReminderMasterSwitch checked={mr.enabled} onChange={(checked) => patch({ enabled: checked })} />
        </div>
        {fields}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] p-5 shadow-xs text-right">
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#334155]">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200/70 dark:border-amber-900/50">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">یادآوری خودکار جلسه</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              قبل از شروع جلسه، پیام یادآوری از کانال‌های فعال ارسال می‌شود (زمان‌بندی روی سرور).
            </p>
          </div>
        </div>
        <ReminderMasterSwitch checked={mr.enabled} onChange={(checked) => patch({ enabled: checked })} />
      </div>
      {fields}
    </div>
  );
};
