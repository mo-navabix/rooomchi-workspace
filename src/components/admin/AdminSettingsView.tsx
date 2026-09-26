import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { OrgLogoBadge, isImageLogo } from '../common/OrgLogoBadge';
import {
  Sliders,
  Building2,
  Users,
  Shield,
  Clock,
  Sparkles,
  Check,
  Save,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  RotateCcw,
  ChevronDown,
  Info,
  CheckCircle2,
  QrCode,
  Printer,
  ExternalLink,
  Copy,
  BellRing,
  Send,
  Smartphone,
} from 'lucide-react';
import { AdminSettingsSkeleton } from '../common/Skeletons';
import { OrgLoginQrModal } from './OrgLoginQrModal';

export const AdminSettingsView: React.FC = () => {
  const { currentOrg, updateCurrentOrgData, showToast, setActiveTab } = useApp();

  const [isLoading, setIsLoading] = useState<boolean>(!currentOrg);
  const [orgName, setOrgName] = useState<string>('');
  const [logo, setLogo] = useState<string>('🏢');
  const [logoTab, setLogoTab] = useState<'presets' | 'custom'>('presets');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState<string>('#2563eb');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [startHour, setStartHour] = useState<string>('08:00');
  const [endHour, setEndHour] = useState<string>('19:00');
  const [autoApprove, setAutoApprove] = useState<boolean>(true);
  const [maxBookingHours, setMaxBookingHours] = useState<number>(4);
  const [allowWeekend, setAllowWeekend] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentOrg) return;
    setOrgName(currentOrg.name);
    setLogo(currentOrg.logo);
    if (isImageLogo(currentOrg.logo)) {
      setLogoTab('custom');
      if (!currentOrg.logo.startsWith('data:image/')) {
        setCustomLogoUrl(currentOrg.logo);
      }
    } else {
      setLogoTab('presets');
    }
    setPrimaryColor(currentOrg.primaryColor);
    setContactEmail(currentOrg.contactEmail);
    setStartHour(currentOrg.workHours?.start || '08:00');
    setEndHour(currentOrg.workHours?.end || '19:00');
    setAutoApprove(currentOrg.settings?.autoApprove ?? true);
    setMaxBookingHours(currentOrg.settings?.maxBookingHours || 4);
    setAllowWeekend(currentOrg.settings?.allowWeekend || false);
  }, [currentOrg]);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('لطفاً یک فایل تصویری معتبر (PNG، JPG، SVG یا WebP) انتخاب کنید.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('حجم فایل تصویر نباید بیشتر از ۲ مگابایت باشد.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setLogo(dataUrl);
        setLogoTab('custom');
        showToast('لوگوی سازمانی با موفقیت بارگذاری شد.', 'success');
      }
    };
    reader.onerror = () => {
      showToast('خطا در خواندن فایل تصویر.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    const trimmed = customLogoUrl.trim();
    if (!trimmed) {
      showToast('لطفاً آدرس تصویر لوگو را وارد کنید.', 'error');
      return;
    }
    setLogo(trimmed);
    showToast('آدرس تصویر لوگو تنظیم شد.', 'success');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    try {
      setIsSaving(true);
      const updated = await ApiService.updateOrganization(currentOrg.id, {
        name: orgName,
        logo,
        primaryColor,
        contactEmail,
        workHours: { start: startHour, end: endHour },
        settings: {
          autoApprove,
          maxBookingHours,
          allowWeekend,
        },
      });

      updateCurrentOrgData(updated);
      showToast('تنظیمات سازمان با موفقیت ذخیره شد', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره تنظیمات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const logoOptions = ['🏢', '🏛️', '🚀', '💼', '🌐', '🏦', '⚡', '💻', '🩺', '🎓'];
  const colorOptions = ['#2563eb', '#059669', '#7c3aed', '#dc2626', '#d97706', '#0891b2'];

  if (isLoading) {
    return <AdminSettingsSkeleton />;
  }

  const isCustomLogo = isImageLogo(logo);

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      {/* Header */}
      <div className="bg-white dark:bg-[#1E293B] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <OrgLogoBadge logo={logo} name={orgName || currentOrg?.name} size="lg" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-[#10B981] dark:text-[#34D399] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span>پیکربندی اختصاصی سازمان</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 break-words">
              تنظیمات و سفارشی‌سازی {currentOrg?.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
              تغییر برندینگ، رنگ سازمانی، ساعات کاری مجاز و قوانین رزرواسیون
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#0F786E] dark:text-[#34D399] border border-emerald-200 dark:border-emerald-800/70 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow cursor-pointer shrink-0"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>بارکد اختصاصی ورود (QR)</span>
          </button>

          <span className="text-xs font-bold px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#10B981] dark:text-[#34D399] border border-emerald-200 dark:border-emerald-900/50 shrink-0 text-center">
            اشتراک: {(currentOrg?.plan ?? 'business').toUpperCase()}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Branding Box */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] p-6 shadow-xs space-y-5 transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#334155] pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#10B981]" />
            <span>هویت و برندینگ سازمانی (White-labeling)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نام رسمی سازمان *
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#10B981] focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ایمیل مدیر سازمان *
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#10B981] focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Org Logo / Symbol Section with Custom Logo Support */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#334155] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white">
                  نماد یا لوگوی اختصاصی سازمان
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  می‌توانید از آیکون‌های استاندارد سیستم انتخاب کنید یا لوگوی رسمی سازمان خود را با سایز استاندارد بارگذاری نمایید.
                </p>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#0F172A] rounded-xl border border-slate-200/80 dark:border-[#334155] shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => setLogoTab('presets')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    logoTab === 'presets'
                      ? 'bg-white dark:bg-[#334155] text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  آیکون‌های آماده
                </button>
                <button
                  type="button"
                  onClick={() => setLogoTab('custom')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    logoTab === 'custom'
                      ? 'bg-white dark:bg-[#334155] text-[#10B981] dark:text-[#34D399] shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>لوگوی کاستوم سازمانی</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Presets */}
            {logoTab === 'presets' && (
              <div className="p-4 bg-slate-50 dark:bg-[#0F172A]/60 rounded-2xl border border-slate-200/80 dark:border-[#334155] space-y-3">
                <div className="flex flex-wrap gap-2.5">
                  {logoOptions.map((icon) => (
                    <button
                      type="button"
                      key={icon}
                      onClick={() => setLogo(icon)}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl border transition-all ${
                        logo === icon
                          ? 'border-[#10B981] bg-emerald-50 dark:bg-emerald-950/60 shadow-xs ring-2 ring-[#10B981]/40 scale-105'
                          : 'border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>آیکون انتخابی در تمامی هدرها، کارت‌ها و منوهای کشویی سازمان نمایش داده می‌شود.</span>
                </div>
              </div>
            )}

            {/* Tab 2: Custom Logo Upload & Direct URL */}
            {logoTab === 'custom' && (
              <div className="p-4 bg-slate-50 dark:bg-[#0F172A]/60 rounded-2xl border border-slate-200/80 dark:border-[#334155] space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Upload Box */}
                  <div className="lg:col-span-7 space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml, image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />

                    {/* Drag and drop zone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className={`p-5 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-[#10B981] bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'border-slate-300 dark:border-[#334155] hover:border-emerald-400 dark:hover:border-emerald-600 bg-white dark:bg-[#1E293B]'
                      }`}
                    >
                      <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-[#10B981] dark:text-[#34D399] mb-2">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        برای بارگذاری لوگوی سازمان کلیک کنید یا فایل را اینجا بکشید
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        فرمت‌های مجاز: PNG ،SVG ،JPG ،WebP (حداکثر ۲ مگابایت)
                      </div>
                    </div>

                    {/* Or URL input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <LinkIcon className="w-3 h-3 text-slate-400" />
                        <span>یا درج آدرس مستقیم تصویر لوگو (URL)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/logo.png"
                          value={customLogoUrl}
                          onChange={(e) => setCustomLogoUrl(e.target.value)}
                          className="flex-1 text-xs px-3.5 py-2 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#10B981] focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={handleApplyUrl}
                          className="px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-[#0D6B63] text-white rounded-xl transition-colors shrink-0 cursor-pointer"
                        >
                          اعمال لینک
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Standard Preview Card & Specifications */}
                  <div className="lg:col-span-5 bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-[#334155] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>پیش‌نمایش در سایزهای استاندارد</span>
                      </span>

                      {isCustomLogo && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogo('🏢');
                            setCustomLogoUrl('');
                            showToast('لوگو به آیکون پیش‌فرض بازگردانده شد', 'info');
                          }}
                          className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>بازنشانی</span>
                        </button>
                      )}
                    </div>

                    {/* Standardized Preview Renders */}
                    <div className="flex items-center justify-around py-3 px-2 bg-slate-50 dark:bg-[#0F172A] rounded-xl border border-slate-100 dark:border-[#334155]/70">
                      {/* Small/Header */}
                      <div className="text-center space-y-1">
                        <OrgLogoBadge logo={logo} name={orgName} size="sm" className="mx-auto" />
                        <span className="text-[10px] text-slate-400 block">هدر (۲۸px)</span>
                      </div>

                      {/* Medium */}
                      <div className="text-center space-y-1">
                        <OrgLogoBadge logo={logo} name={orgName} size="md" className="mx-auto" />
                        <span className="text-[10px] text-slate-400 block">فهرست (۳۶px)</span>
                      </div>

                      {/* Large */}
                      <div className="text-center space-y-1">
                        <OrgLogoBadge logo={logo} name={orgName} size="lg" className="mx-auto" />
                        <span className="text-[10px] text-slate-400 block">پروفایل (۴۸px)</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                      <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>مشخصات استاندارد لوگو:</span>
                      </div>
                      <p>
                        نسبت تصویر پیشنهادی ۱:۱ (مربع مانند ۱۲۸×۱۲۸ الی ۵۱۲×۵۱۲ پیکسل) با پس‌زمینه شفاف (Transparent) برای هماهنگی کامل با تم روشن و تاریک.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Corporate Primary Color */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                رنگ سازمانی
              </label>
              <div className="flex items-center gap-2.5">
                {colorOptions.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setPrimaryColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                      primaryColor === c
                        ? 'border-slate-900 dark:border-white scale-110 shadow-md ring-2 ring-emerald-500/30'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {primaryColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Smart QR Code & Organization Portal Access Box */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-[#334155] gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#10B981]" />
              <span>بارکد اختصاصی ورود هوشمند به سازمان (QR Code)</span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#10B981] hover:bg-[#0D6B63] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>مدیریت، چاپ و خروجی QR</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-8 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                مدیران سازمان می‌توانند بارکد اختصاصی ورود به پورتال <strong>{currentOrg?.name}</strong> را با رنگ‌بندی دلخواه و تیتر سفارشی استخراج، چاپ و در قالب استند رومیزی، پوستر دیواری یا راهنمای ورود پرسنل در ورودی اتاق جلسات نصب نمایند.
              </p>

              <div className="p-3 bg-slate-50 dark:bg-[#0F172A] rounded-xl border border-slate-200/80 dark:border-[#334155] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    لینک مستقیم ورود پرسنل:
                  </span>
                  <span
                    className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate direction-ltr text-left select-all"
                    dir="ltr"
                  >
                    {typeof window !== 'undefined' ? window.location.origin : 'https://rooomchi.ir'}?auth=login&org={encodeURIComponent(currentOrg?.slug || currentOrg?.id || '')}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://rooomchi.ir'}?auth=login&org=${encodeURIComponent(currentOrg?.slug || currentOrg?.id || '')}`;
                      try {
                        await navigator.clipboard.writeText(url);
                        showToast('لینک مستقیم ورود در حافظه کپی شد', 'success');
                      } catch {
                        showToast('خطا در کپی لینک', 'error');
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>کپی لینک</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>مشاهده پیش‌نمایش بارکد</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>انتقال آنی به فرم لاگین با اسکن دوربین</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>خروجی باکیفیت وکتور SVG و پوستر PNG</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>سازگار با چاپگرهای اداری سایز A4 / A5</span>
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="group relative p-4 bg-slate-50 dark:bg-[#0F172A] hover:bg-emerald-50/50 dark:hover:bg-[#0F172A]/80 border-2 border-dashed border-slate-200 dark:border-[#334155] hover:border-emerald-400 rounded-2xl transition-all text-center flex flex-col items-center gap-2 cursor-pointer w-full max-w-[220px]"
              >
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1E293B] shadow-xs border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <QrCode className="w-9 h-9" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    چاپ و تنظیم بارکد ورود
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    کلیک جهت باز کردن پنل چاپ
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications & Messaging Channels Control Box */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#334155]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  کانال‌های اطلاع‌رسانی و پیام‌ها (SMS، تلگرام و اعلان درون‌برنامه‌ای)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ارسال پیامک‌های تأیید و لغو، هشدارهای ربات تلگرام و آلارم‌های بلادرنگ سامانه
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('admin-notifications')}
              className="px-3.5 py-1.5 bg-[#10B981] hover:bg-[#0D6B63] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>مدیریت و پیکربندی کانال‌ها</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* SMS Status */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/80 dark:border-[#334155] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  پیامک (SMS Gateway)
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  وب‌سرویس فعال (کاوه‌نگار)
                </span>
              </div>
            </div>

            {/* Telegram Status */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/80 dark:border-[#334155] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Send className="w-4 h-4 -rotate-45" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  ربات تلگرام
                </span>
                <span className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">
                  متصل به کانال سازمانی
                </span>
              </div>
            </div>

            {/* In-App Status */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/80 dark:border-[#334155] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  نوتیفیکیشن پلتفرم
                </span>
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                  زنگوله + پاپ‌آپ فعال
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Policies Box */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] p-6 shadow-xs space-y-4 transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#334155] pb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#10B981]" />
            <span>سیاست‌ها و محدودیت‌های زمانی رزرواسیون</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ساعات مجاز رزرو جلسات
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#10B981] focus:outline-hidden"
                />
                <span className="text-xs text-slate-400 font-medium">تا</span>
                <input
                  type="time"
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#10B981] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                حداکثر مدت زمان هر جلسه
              </label>
              <div className="relative">
                <select
                  value={maxBookingHours}
                  onChange={(e) => setMaxBookingHours(Number(e.target.value))}
                  className="w-full text-xs pr-3.5 pl-9 py-2.5 appearance-none border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#10B981] focus:outline-hidden cursor-pointer"
                >
                  <option value={2}>حداکثر ۲ ساعت</option>
                  <option value={3}>حداکثر ۳ ساعت</option>
                  <option value={4}>حداکثر ۴ ساعت</option>
                  <option value={8}>تمام روز کاری (۸ ساعت)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="w-4 h-4 text-[#10B981] rounded cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
                تأیید خودکار رزروها برای تمام پرسنل سازمان
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowWeekend}
                onChange={(e) => setAllowWeekend(e.target.checked)}
                className="w-4 h-4 text-[#10B981] rounded cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
                امکان رزرو در روزهای تعطیل و آخر هفته
              </span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            id="btn-save-org-settings"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#10B981] hover:bg-[#0D6B63] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره تنظیمات سازمان'}</span>
          </button>
        </div>
      </form>

      {/* Organization Login QR Code Modal */}
      <OrgLoginQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        organization={currentOrg}
        onShowToast={showToast}
      />
    </div>
  );
};
