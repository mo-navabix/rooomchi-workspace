import React, { useRef, useState } from 'react';
import { Loader2, Trash2, ImageIcon } from 'lucide-react';
import { OrgLogoBadge, isImageLogo } from '../../components/common/OrgLogoBadge';
import { fileToLogoDataUrl } from '../../utils/imageDataUrl';

type Props = {
  logo: string;
  orgName: string;
  onChange: (logo: string) => void;
};

function hasStoredLogo(value: string): boolean {
  if (!value?.trim()) return false;
  return value.startsWith('data:') || isImageLogo(value);
}

function isSvgFile(file: File): boolean {
  return file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);
}

export const OrgLogoUploader: React.FC<Props> = ({ logo, orgName, onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLogo = hasStoredLogo(logo);

  const handleFile = async (file: File) => {
    setError(null);
    if (!isSvgFile(file)) {
      setError('فقط فایل SVG مجاز است.');
      return;
    }
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

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-600/50 p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/20 space-y-4">
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">لوگوی سازمان (SVG)</p>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
          یک فایل SVG با پس‌زمینه شفاف — در تم روشن و تاریک پورتال استفاده می‌شود. حداکثر ۵۱۲
          کیلوبایت.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white">
          <OrgLogoBadge logo={hasLogo ? logo : '🏢'} name={orgName} size="lg" previewTheme="light" />
          <span className="text-xs text-slate-500">پیش‌نمایش — تم روشن</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-600 bg-[#0f172a]">
          <OrgLogoBadge logo={hasLogo ? logo : '🏢'} name={orgName} size="lg" previewTheme="dark" />
          <span className="text-xs text-slate-400">پیش‌نمایش — تم تاریک</span>
        </div>
      </div>

      {hasLogo ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer"
          >
            تغییر فایل SVG
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
          className={`min-h-[88px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 px-4 cursor-pointer transition-colors ${
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
                انتخاب یا رها کردن فایل SVG
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/svg+xml,.svg"
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
