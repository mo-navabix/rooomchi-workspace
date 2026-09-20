import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Room } from '../../types';
import { ALL_AMENITIES } from '../../constants/amenities';
import { OrgLogoBadge, isImageLogo } from '../common/OrgLogoBadge';
import {
  X,
  Sparkles,
  Building2,
  Users,
  Check,
  Plus,
  Trash2,
  Clock,
  Layers,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';

export const OrgProvisioningModal: React.FC = () => {
  const {
    isProvisioningModalOpen,
    closeProvisioningModal,
    refreshOrganizations,
    switchOrg,
    showToast,
    setActiveTab,
  } = useApp();

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Step 1: Basics & Plan
  const [orgName, setOrgName] = useState<string>('');
  const [orgSlug, setOrgSlug] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [selectedLogo, setSelectedLogo] = useState<string>('🏢');
  const [logoTab, setLogoTab] = useState<'presets' | 'custom'>('presets');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState<string>('#2563eb');
  const [plan, setPlan] = useState<'starter' | 'business' | 'enterprise'>('business');

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
        setSelectedLogo(dataUrl);
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
    setSelectedLogo(trimmed);
    showToast('آدرس تصویر لوگو تنظیم شد.', 'success');
  };

  // Step 2: Structure
  const [buildings, setBuildings] = useState<string[]>(['ساختمان مرکزی']);
  const [buildingInput, setBuildingInput] = useState<string>('');
  const [departments, setDepartments] = useState<string[]>([
    'فنی و مهندسی',
    'محصول و طراحی',
    'مارکتینگ و فروش',
    'منابع انسانی',
    'مالی و اداری',
  ]);
  const [departmentInput, setDepartmentInput] = useState<string>('');
  const [workStart, setWorkStart] = useState<string>('08:00');
  const [workEnd, setWorkEnd] = useState<string>('19:00');
  const [autoApprove, setAutoApprove] = useState<boolean>(true);

  // Step 3: Custom Organization Rooms Data
  const [initialRooms, setInitialRooms] = useState<
    Array<{
      name: string;
      code: string;
      capacity: number;
      floor: number;
      amenities: string[];
      requiresApproval: boolean;
    }>
  >([
    {
      name: 'اتاق جلسات اصلی',
      code: 'M-101',
      capacity: 10,
      floor: 1,
      amenities: ['projector', 'whiteboard', 'videoconf', 'wifi'],
      requiresApproval: false,
    },
    {
      name: 'اتاق کنفرانس هیئت مدیره',
      code: 'VIP-201',
      capacity: 20,
      floor: 2,
      amenities: ['projector', 'smart_tv', 'whiteboard', 'videoconf', 'catering', 'mic_system'],
      requiresApproval: true,
    },
  ]);

  if (!isProvisioningModalOpen) return null;

  const handleAddBuilding = () => {
    if (buildingInput.trim() && !buildings.includes(buildingInput.trim())) {
      setBuildings([...buildings, buildingInput.trim()]);
      setBuildingInput('');
    }
  };

  const handleRemoveBuilding = (b: string) => {
    if (buildings.length <= 1) return;
    setBuildings(buildings.filter((item) => item !== b));
  };

  const handleAddDepartment = () => {
    if (departmentInput.trim() && !departments.includes(departmentInput.trim())) {
      setDepartments([...departments, departmentInput.trim()]);
      setDepartmentInput('');
    }
  };

  const handleRemoveDepartment = (d: string) => {
    if (departments.length <= 1) return;
    setDepartments(departments.filter((item) => item !== d));
  };

  const handleAddCustomRoom = () => {
    const num = initialRooms.length + 1;
    setInitialRooms([
      ...initialRooms,
      {
        name: `اتاق جلسات ${num}`,
        code: `RM-${100 + num}`,
        capacity: 8,
        floor: 1,
        amenities: ['whiteboard', 'wifi'],
        requiresApproval: false,
      },
    ]);
  };

  const handleRemoveCustomRoom = (index: number) => {
    if (initialRooms.length <= 1) return;
    setInitialRooms(initialRooms.filter((_, i) => i !== index));
  };

  const handleUpdateRoomField = (index: number, field: string, value: any) => {
    const updated = [...initialRooms];
    (updated[index] as any)[field] = value;
    setInitialRooms(updated);
  };

  const handleToggleRoomAmenity = (index: number, amenityId: string) => {
    const updated = [...initialRooms];
    const currentAmenities = updated[index].amenities;
    if (currentAmenities.includes(amenityId)) {
      updated[index].amenities = currentAmenities.filter((a) => a !== amenityId);
    } else {
      updated[index].amenities = [...currentAmenities, amenityId];
    }
    setInitialRooms(updated);
  };

  const handleProvisionSubmit = async () => {
    if (!orgName.trim() || !contactEmail.trim()) {
      showToast('لطفاً نام سازمان و ایمیل مدیر را وارد فرمایید', 'error');
      setStep(1);
      return;
    }

    try {
      setIsSubmitting(true);
      const newOrg = await ApiService.provisionOrganization({
        name: orgName.trim(),
        slug: orgSlug.trim() || undefined,
        logo: selectedLogo,
        primaryColor,
        plan,
        contactEmail: contactEmail.trim(),
        buildings,
        departments,
        workHours: { start: workStart, end: workEnd },
        settings: {
          autoApprove,
          maxBookingHours: 4,
          allowWeekend: false,
        },
        initialRooms: initialRooms.map((r) => ({
          ...r,
          building: buildings[0],
          color: primaryColor,
        })),
      });

      await refreshOrganizations();
      switchOrg(newOrg.id);
      showToast(`سازمان «${newOrg.name}» با موفقیت راه‌اندازی و تجهیز شد!`, 'success');
      closeProvisioningModal();
      setActiveTab('dashboard');
    } catch (err: any) {
      showToast(err.message || 'خطا در ثبت سازمان', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const logoOptions = ['🏢', '🏛️', '🚀', '💼', '🌐', '🏦', '⚡', '💻', '🩺', '🎓'];
  const colorOptions = ['#2563eb', '#059669', '#7c3aed', '#dc2626', '#d97706', '#0891b2'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/75 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#334155] overflow-hidden my-6 transition-colors">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#0F786E] via-[#10B981] to-[#0F786E] text-white flex items-center justify-between border-b border-[#334155]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/30 text-[#10B981] border border-emerald-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-emerald-300 dark:text-[#34D399]">
                سیستم چندمستأجره ماژولار (Multi-Tenant Onboarding)
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                خرید اشتراک و آماده‌سازی سیستم برای سازمان شما
              </h2>
            </div>
          </div>
          <button
            id="btn-close-provisioning"
            onClick={closeProvisioningModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Progress */}
        <div className="bg-slate-50 dark:bg-[#0D1527] px-6 py-3 border-b border-slate-200 dark:border-[#334155] flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            {[
              { num: 1, label: 'اطلاعات و برند سازمان' },
              { num: 2, label: 'شعب و دپارتمان‌ها' },
              { num: 3, label: 'دیتای اتاق‌های جلسات' },
              { num: 4, label: 'تأیید و راه‌اندازی' },
            ].map((s) => (
              <div
                key={s.num}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                  step === s.num
                    ? 'bg-[#10B981] text-white shadow-xs'
                    : step > s.num
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <span>{s.num}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-[11px]">مرحله {step} از ۴</div>
        </div>

        {/* Wizard Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
          {/* STEP 1: Organization & Plan */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                هر سازمانی که سامانه را تهیه کند، یک محیط کاری کاملاً ایزوله با دیتای ساختمان‌ها، دپارتمان‌ها، اتاق‌ها و تم رنگی خودش دریافت خواهد کرد.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نام سازمان یا شرکت *
                  </label>
                  <input
                    type="text"
                    id="input-new-org-name"
                    placeholder="مثال: شرکت ارتباطات پیشتاز ایران"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#10B981] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ایمیل رسمی مدیر سازمان *
                  </label>
                  <input
                    type="email"
                    id="input-new-org-email"
                    placeholder="admin@yourcompany.ir"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#10B981] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-left"
                    dir="ltr"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    شناسه سیستمی (دامنه اختصاصی)
                  </label>
                  <input
                    type="text"
                    id="input-new-org-slug"
                    placeholder="your-company"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#10B981] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    بسته اشتراک سازمانی
                  </label>
                  <div className="relative">
                    <select
                      id="select-new-org-plan"
                      value={plan}
                      onChange={(e: any) => setPlan(e.target.value)}
                      className="w-full text-xs pr-3.5 pl-9 py-2.5 appearance-none border border-slate-200 dark:border-[#334155] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#10B981] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white cursor-pointer font-medium"
                    >
                      <option value="starter">پلن استارتر (تا ۵ اتاق جلسه - تیم‌های نوپا)</option>
                      <option value="business">پلن تجاری (تا ۲۰ اتاق جلسه + تأیید ادمین)</option>
                      <option value="enterprise">پلن سازمانی نامحدود (شعبات متعدد + پشتیبانی اختصاصی)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Plan Cards Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPlan('starter')}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    plan === 'starter'
                      ? 'border-[#10B981] bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-[#334155] bg-white dark:bg-[#0F172A] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">استارتر</span>
                    {plan === 'starter' && <Check className="w-3.5 h-3.5 text-[#10B981] dark:text-[#34D399]" />}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">تا ۵ اتاق جلسه</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">تیم‌های در حال رشد</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPlan('business')}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    plan === 'business'
                      ? 'border-[#10B981] bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-[#334155] bg-white dark:bg-[#0F172A] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">تجاری (پیشنهادی)</span>
                    {plan === 'business' && <Check className="w-3.5 h-3.5 text-[#10B981] dark:text-[#34D399]" />}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">تا ۲۰ اتاق جلسه</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">تأیید هوشمند + گزارشات</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPlan('enterprise')}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    plan === 'enterprise'
                      ? 'border-[#10B981] bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-[#334155] bg-white dark:bg-[#0F172A] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">سازمانی نامحدود</span>
                    {plan === 'enterprise' && <Check className="w-3.5 h-3.5 text-[#10B981] dark:text-[#34D399]" />}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">اتاق‌ها و شعبات نامحدود</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">شعبات متعدد + پشتیبانی ۲۴/۷</div>
                </button>
              </div>

              {/* Logo and Brand Color with Custom Logo Option */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#334155] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-white">
                      انتخاب نماد یا لوگوی اختصاصی سازمان
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      امکان انتخاب از آیکون‌های پیش‌فرض یا بارگذاری تصویر لوگوی رسمی سازمان
                    </p>
                  </div>

                  {/* Mode Toggle Tabs */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#0F172A] rounded-xl border border-slate-200/80 dark:border-[#334155] shrink-0 text-xs">
                    <button
                      type="button"
                      onClick={() => setLogoTab('presets')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
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
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                        logoTab === 'custom'
                          ? 'bg-white dark:bg-[#334155] text-slate-900 dark:text-white shadow-xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      لوگوی اختصاصی
                    </button>
                  </div>
                </div>

                {logoTab === 'presets' ? (
                  <div className="flex flex-wrap gap-2">
                    {logoOptions.map((icon) => (
                      <button
                        type="button"
                        key={icon}
                        onClick={() => setSelectedLogo(icon)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all cursor-pointer ${
                          selectedLogo === icon
                            ? 'border-[#10B981] bg-emerald-50 dark:bg-emerald-950/60 shadow-xs ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-[#334155] bg-white dark:bg-[#0F172A] hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-[#334155] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          بارگذاری فایل تصویر (حداکثر ۲ مگابایت)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(f);
                          }}
                          className="w-full text-xs text-slate-500 file:mr-0 file:ml-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-[#10B981] dark:file:bg-emerald-950/50 dark:file:text-[#34D399] hover:file:bg-emerald-100 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          یا آدرس اینترنتی تصویر لوگو
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="url"
                            dir="ltr"
                            placeholder="https://example.com/logo.png"
                            value={customLogoUrl}
                            onChange={(e) => setCustomLogoUrl(e.target.value)}
                            className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={handleApplyUrl}
                            className="px-2.5 py-1.5 bg-[#10B981] text-white rounded-lg text-xs font-semibold hover:bg-[#0D6B63]"
                          >
                            تأیید
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60 dark:border-[#334155]">
                      <span className="text-xs text-slate-500 dark:text-slate-400">پیش‌نمایش در سایز استاندارد:</span>
                      <OrgLogoBadge logo={selectedLogo} name={orgName || 'سازمان'} size="lg" />
                    </div>
                  </div>
                )}

                {/* Corporate Primary Color */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    رنگ شاخص برند سازمان
                  </label>
                  <div className="flex items-center gap-2">
                    {colorOptions.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setPrimaryColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                          primaryColor === c ? 'border-slate-900 dark:border-white scale-110 shadow-xs' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {primaryColor === c && <Check className="w-3 h-3 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Buildings & Departments */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Buildings */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ساختمان‌ها یا شعبات سازمان شما
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    id="input-building-name"
                    placeholder="نام ساختمان (مثال: برج مرکزی سعادت‌آباد، کارخانه پردیس)"
                    value={buildingInput}
                    onChange={(e) => setBuildingInput(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#10B981] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                  <button
                    type="button"
                    id="btn-add-building"
                    onClick={handleAddBuilding}
                    className="px-3.5 py-2 bg-[#10B981] text-white rounded-lg text-xs font-semibold hover:bg-[#0D6B63] flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {buildings.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-[#0F172A] text-slate-700 dark:text-slate-300 text-xs rounded-lg border border-slate-200 dark:border-[#334155]"
                    >
                      <Building2 className="w-3.5 h-3.5 text-[#10B981] dark:text-[#10B981]" />
                      <span>{b}</span>
                      {buildings.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBuilding(b)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Departments */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  واحدهای سازمانی / دپارتمان‌ها
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    id="input-dept-name"
                    placeholder="نام واحد (مثال: تحقیق و توسعه، امور قراردادها)"
                    value={departmentInput}
                    onChange={(e) => setDepartmentInput(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#10B981] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                  <button
                    type="button"
                    id="btn-add-dept"
                    onClick={handleAddDepartment}
                    className="px-3.5 py-2 bg-[#10B981] text-white rounded-lg text-xs font-semibold hover:bg-[#0D6B63] flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {departments.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-[#0F172A] text-slate-700 dark:text-slate-300 text-xs rounded-lg border border-slate-200 dark:border-[#334155]"
                    >
                      <Users className="w-3.5 h-3.5 text-[#10B981] dark:text-[#10B981]" />
                      <span>{d}</span>
                      {departments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDepartment(d)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Work Hours & Policy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-[#334155]">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ساعت کاری مجاز رزرو جلسات
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={workStart}
                      onChange={(e) => setWorkStart(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">تا</span>
                    <input
                      type="time"
                      value={workEnd}
                      onChange={(e) => setWorkEnd(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    سیاست تأیید رزرو
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="checkbox-auto-approve"
                      checked={autoApprove}
                      onChange={(e) => setAutoApprove(e.target.checked)}
                      className="w-4 h-4 text-[#10B981] rounded"
                    />
                    <label htmlFor="checkbox-auto-approve" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      تأیید خودکار رزروها (بدون نیاز به تأیید دستی ادمین)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Initial Rooms Customization */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    تعریف اتاق‌های جلسات اولیه بر اساس دیتای سازمان
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    مشخصات، ظرفیت و تجهیزات اتاق‌های واقعی سازمان خود را در اینجا ثبت کنید.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-add-room-row"
                  onClick={handleAddCustomRoom}
                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-[#10B981] dark:text-[#34D399] hover:bg-emerald-100 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن اتاق دیگر</span>
                </button>
              </div>

              <div className="space-y-3">
                {initialRooms.map((room, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50/70 dark:bg-[#0D1527] border border-slate-200 dark:border-[#334155] rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[#10B981] dark:text-[#34D399] flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{room.name || `اتاق ${idx + 1}`}</span>
                      </div>
                      {initialRooms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomRoom(idx)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          title="حذف این اتاق"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          نام اتاق
                        </label>
                        <input
                          type="text"
                          value={room.name}
                          onChange={(e) => handleUpdateRoomField(idx, 'name', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white border border-slate-200 dark:border-[#334155] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          ظرفیت (نفر)
                        </label>
                        <input
                          type="number"
                          min="2"
                          max="100"
                          value={room.capacity}
                          onChange={(e) =>
                            handleUpdateRoomField(idx, 'capacity', Number(e.target.value))
                          }
                          className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white border border-slate-200 dark:border-[#334155] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          طبقه
                        </label>
                        <input
                          type="number"
                          value={room.floor}
                          onChange={(e) =>
                            handleUpdateRoomField(idx, 'floor', Number(e.target.value))
                          }
                          className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white border border-slate-200 dark:border-[#334155] rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Amenities Checklist */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        تجهیزات این اتاق:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_AMENITIES.map((amenity) => {
                          const hasIt = room.amenities.includes(amenity.id);
                          return (
                            <button
                              type="button"
                              key={amenity.id}
                              onClick={() => handleToggleRoomAmenity(idx, amenity.id)}
                              className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                                hasIt
                                  ? 'bg-[#10B981] text-white border-[#10B981]'
                                  : 'bg-white dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#334155] hover:bg-slate-100 dark:hover:bg-[#334155]'
                              }`}
                            >
                              {amenity.nameFa}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Review & Provision */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                  <div className="font-bold mb-1">آماده استقرار و تحویل سامانه به سازمان شما!</div>
                  تمام اطلاعات سازمانی، ساختار شعب، واحدهای سازمانی و اتاق‌های جلسات ثبت شدند. با کلیک بر روی دکمه زیر، سامانه به شکل کامل کانفیگ شده و تحویل داده می‌شود.
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-[#334155] space-y-1.5">
                  <div className="text-slate-400 dark:text-slate-500 font-semibold text-[11px]">مشخصات سازمان</div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedLogo}</span>
                    <span>{orgName || 'بدون نام'}</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">ایمیل مدیر: {contactEmail}</div>
                  <div className="text-slate-600 dark:text-slate-300">پلن: {plan.toUpperCase()}</div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-[#334155] space-y-1.5">
                  <div className="text-slate-400 dark:text-slate-500 font-semibold text-[11px]">منابع پیکربندی شده</div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium">
                    تعداد ساختمان‌ها: {buildings.length} شعبه
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium">
                    تعداد دپارتمان‌ها: {departments.length} واحد
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium">
                    تعداد اتاق‌های آماده رزرو: {initialRooms.length} اتاق
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Navigation Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#0D1527] border-t border-slate-200 dark:border-[#334155] flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                id="btn-provision-prev"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-xl hover:bg-slate-100 dark:hover:bg-[#334155] transition-colors flex items-center gap-1.5"
              >
                <ChevronRight className="w-4 h-4" />
                <span>مرحله قبل</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-provision-cancel"
              onClick={closeProvisioningModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              انصراف
            </button>

            {step < 4 ? (
              <button
                type="button"
                id="btn-provision-next"
                onClick={() => {
                  if (step === 1 && (!orgName.trim() || !contactEmail.trim())) {
                    showToast('لطفاً نام سازمان و ایمیل مدیر را وارد فرمایید', 'error');
                    return;
                  }
                  setStep(step + 1);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-[#10B981] hover:bg-[#0D6B63] rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>مرحله بعد</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                id="btn-provision-finish"
                disabled={isSubmitting}
                onClick={handleProvisionSubmit}
                className="px-6 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <span>در حال آماده‌سازی و بارگذاری داده‌ها...</span>
                ) : (
                  <>
                    <span>تکمیل خرید و راه‌اندازی آنی سازمان</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
