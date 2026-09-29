import React, { useRef, useState } from 'react';
import { Loader2, Trash2, ImageIcon, Sun, Moon } from 'lucide-react';
import { OrgLogoBadge, isImageLogo } from '../../components/common/OrgLogoBadge';
import { fileToLogoDataUrl } from '../../utils/imageDataUrl';

type Props = {
  logoLight: string;
  logoDark: string;
  orgName: string;
  onChangeLight: (logo: string) => void;
  onChangeDark: (logo: string) => void;
};

function hasStoredLogo(value: string): boolean {
  if (!value?.trim()) return false;
  return value.startsWith('data:') || isImageLogo(value);
}

type SlotProps = {
  label: string;
  hint: string;
  value: string;
  fallbackLogo?: string;
  orgName: string;
  previewTheme: 'light' | 'dark';
  onChange: (logo: string) => void;
};

const LogoSlot: React.FC<SlotProps> = ({
  label,
  hint,
  value,
  fallbackLogo,
  orgName,
  previewTheme,
  onChange,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLogo = hasStoredLogo(value);

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const dataUrl = await fileToLogoDataUrl(file, 400);
      onChange(dataUrl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در آپلود');
    } finally {
      setLoading(false);
    }
  };

  const previewBg =
    previewTheme === 'dark'
      ? 'bg-[#0f172a] border-slate-600'
      : 'bg-white border-slate-200';

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-600/50 p-4 bg-white/50 dark:bg-slate-900/30 space-y-3">
      <div className="flex items-center gap-2">
        {previewTheme === 'light' ? (
          <Sun className="w-4 h-4 text-amber-500" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-400" />
        )}
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</p>
      </div>
      <p className="text-[11px] text-slate-500 -mt-1">{hint}</p>

      <div className={`flex items-center gap-3 p-3 rounded-xl border ${previewBg}`}>
        <OrgLogoBadge
          logo={previewTheme === 'dark' ? fallbackLogo || '🏢' : hasLogo ? value : '🏢'}
          logoDark={previewTheme === 'dark' && hasLogo ? value : undefined}
          previewTheme={previewTheme}
          name={orgName}
          size="lg"
          className={previewTheme === 'dark' ? '!bg-[#1e293b]' : ''}
        />
        <span className="text-xs text-slate-500">پیش‌نمایش</span>
      </div>

      {hasLogo ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer"
          >
            تغییر فایل
          </button>
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs font-bold text-rose-600 flex items-center gap-1 px-2 py-2 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            حذف
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void handleFile(f);
          }}
          onClick={() => fileRef.current?.click()}
          className={`min-h-[72px] rounded-xl border-2 border-dashed flex items-center justify-center gap-2 px-3 cursor-pointer transition-colors ${
            dragging
              ? 'border-[var(--brand-primary)] bg-[rgb(var(--brand-primary-rgb)/0.08)]'
              : 'border-slate-300 dark:border-slate-600 hover:border-[var(--brand-primary)]/60'
          }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-[var(--brand-primary)]" />
          ) : (
            <>
              <ImageIcon className="w-5 h-5 text-[var(--brand-primary)] shrink-0" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                انتخاب یا رها کردن فایل
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = '';
        }}
      />
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};

export const OrgLogoUploader: React.FC<Props> = ({
  logoLight,
  logoDark,
  orgName,
  onChangeLight,
  onChangeDark,
}) => {
  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-600/50 p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">لوگوی سازمان</p>
        <p className="text-[11px] text-slate-500 mt-1">
          PNG، JPG، WEBP یا SVG — حداکثر ۴ مگابایت (رستر) / ۵۱۲KB (SVG). در تم تاریک اگر لوگوی
          جدا نباشد، لوگوی روشن استفاده می‌شود.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LogoSlot
          label="لوگو — تم روشن"
          hint="در پس‌زمینه روشن و حالت لایت پورتال"
          value={logoLight}
          orgName={orgName}
          previewTheme="light"
          onChange={onChangeLight}
        />
        <LogoSlot
          label="لوگو — تم تاریک"
          hint="در پس‌زمینه تیره و حالت دارک پورتال (اختیاری)"
          value={logoDark}
          fallbackLogo={logoLight}
          orgName={orgName}
          previewTheme="dark"
          onChange={onChangeDark}
        />
      </div>
    </div>
  );
};
