import React from 'react';
import { applyOrgBrandTheme } from '../../utils/orgBrandTheme';
import { BRAND_COLOR_PRESETS, adminInputClass } from './adminSettingsLayout';

type Props = {
  color: string;
  onChange: (hex: string) => void;
};

export const OrgBrandThemePicker: React.FC<Props> = ({ color, onChange }) => {
  const primary = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#0f786e';

  const pick = (hex: string) => {
    onChange(hex);
    applyOrgBrandTheme(hex);
  };

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-600/50 p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/20">
      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">رنگ تم سازمان</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {BRAND_COLOR_PRESETS.map((preset) => {
            const active = primary.toLowerCase() === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                title={preset.name}
                onClick={() => pick(preset.value)}
                className={`w-9 h-9 rounded-full border-2 transition-transform cursor-pointer shrink-0 ${
                  active
                    ? 'border-slate-900 dark:border-white scale-110 ring-2 ring-offset-2 ring-slate-300 dark:ring-slate-600'
                    : 'border-white dark:border-slate-700 shadow-sm hover:scale-105'
                }`}
                style={{ backgroundColor: preset.value }}
              />
            );
          })}
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-600 hidden sm:block" aria-hidden />

        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs font-semibold text-slate-500 shrink-0">رنگ دلخواه</span>
          <input
            type="color"
            value={primary}
            onChange={(e) => pick(e.target.value)}
            className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer bg-transparent p-0.5"
            title="انتخاب رنگ"
          />
        </label>

        <input
          className={`${adminInputClass} !py-2 !text-sm font-mono w-[7.5rem] shrink-0`}
          dir="ltr"
          value={primary}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v);
            if (/^#[0-9A-Fa-f]{6}$/i.test(v)) applyOrgBrandTheme(v);
          }}
          aria-label="کد HEX"
        />

        <span
          className="ms-auto hidden md:inline-flex text-xs font-bold text-white px-3 py-1.5 rounded-lg shrink-0"
          style={{ backgroundColor: primary }}
        >
          نمونه
        </span>
      </div>
    </div>
  );
};
