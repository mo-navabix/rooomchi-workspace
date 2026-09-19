import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LogIn,
  Calendar,
  CalendarCheck,
  ArrowLeft,
  Zap,
  Play,
  Lock,
  RefreshCw,
  Maximize2,
  Tv,
  Radio,
  XCircle,
  X,
  CheckCircle2,
  ArrowLeftRight,
  Mail,
  MessageSquare,
  Tablet,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Key,
  Coffee,
  ChevronLeft,
  PlusCircle,
  Quote,
  Clock,
  Send,
  Phone,
  MapPin,
  Sun,
  Moon,
  Sparkles,
  Check,
  Building2,
  ExternalLink,
  ChevronDown,
  Database,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const {
    setActiveTab,
    openProvisioningModal,
    openAuthModal,
    isAuthenticated,
    setViewMode,
    theme,
    toggleTheme,
    showToast,
  } = useApp();

  // Demo Lead Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    companyName: '',
    roomCount: '4-10',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Interactive Tablet Simulation State
  const [tabletStatus, setTabletStatus] = useState<'occupied' | 'available'>('occupied');
  const [minutesRemaining, setMinutesRemaining] = useState(25);

  const handleEnterPortal = () => {
    setActiveTab('dashboard');
    setViewMode('app');
  };

  const handleExtendMeeting = () => {
    setMinutesRemaining((prev) => prev + 15);
    showToast('جلسه با موفقیت ۱۵ دقیقه تمدید شد', 'success');
  };

  const handleEndEarly = () => {
    setTabletStatus('available');
    showToast('جلسه پایان یافت و اتاق برای همکاران آزاد شد', 'success');
  };

  const handleQuickBookFromTablet = () => {
    setTabletStatus('occupied');
    setMinutesRemaining(30);
    showToast('اتاق به مدت ۳۰ دقیقه برای شما رزرو شد', 'success');
  };

  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) {
      showToast('لطفاً نام و شماره همراه سازمانی را وارد کنید', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      showToast('درخواست دموی شما ثبت شد. کارشناسان ما ظرف ۲ ساعت کاری با شما تماس می‌گیرند', 'success');
    }, 800);
  };

  const didarLogoUrl =
    'https://lh3.googleusercontent.com/aida/AEtjO1U_lbHLMAGHC30MWikg2vt3F_djKRoNSMjjTPLVYPYRgyUXDLwkbTWcsqVA5eCJ5d_ExVpbeQbsYJqtVgfDCz2_J2PK-Xe9uCbBoghHYxRStkiC4SEddx-P9Uyrtawaf5aa2AszIWSb7Gbp8n7UAnQayhV-cqm0UJacW-xTvFk4M_GT6dq1BY3M0-evOnXtUpCop722jQwTqvXgnUWJbcMBbqTI7tKYOb9y2Kiu-ZW3OqBi1BwBC6LONg';

  const heroRoomImageUrl =
    'https://lh3.googleusercontent.com/aida/AEtjO1XSLw-50gP2bxQapRwPemj8OLMQ4xMUvVkYS4STQxKkHkOxcPDoOzC341G4N2uBOC9ceU3zPOCTGuV7lbfIUZWpq16625uyIEQKO3hZb0M0dIORAt6CwBUmABsA1Fqd2PklBZzClZgZn6JAeplv1vDujhsatHDApBvGRmHTqgUbAqMgEozt_ZOqo_JDNRG7-vfYsSsfJ4ZkkCjYSJnO0kGGHHFT2FeYloOzJpuX-4A0FydgKxOBXW251Hs';

  return (
    <div className="bg-[#faf8ff] dark:bg-[#0b1326] text-[#0f172a] dark:text-[#dae2fd] antialiased selection:bg-blue-600 selection:text-white relative overflow-x-clip min-h-screen transition-colors duration-300 font-sans">
      {/* Ambient Atmospheric Lighting Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-96 h-96 bg-blue-100/70 dark:bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-[-5%] w-[500px] h-[500px] bg-teal-50/80 dark:bg-teal-400/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-indigo-50/70 dark:bg-[#0d1b3a]/40 rounded-full blur-[140px]"></div>
      </div>

      {/* MAIN WRAPPER */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 1. TOP NAVIGATION BAR (STICKY FIXED AT TOP) */}
        <header className="sticky top-0 z-50 flex items-center justify-between h-20 px-4 sm:px-6 lg:px-12 w-full rtl bg-white/95 dark:bg-[#0b1326]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/60 shadow-md transition-colors">
          <div className="flex items-center gap-6 lg:gap-10">
            {/* Brand Logo & Identity */}
            <a href="#" className="flex items-center gap-3.5 group">
              <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/40 flex items-center justify-center p-1 shadow-sm transition-transform duration-200 group-hover:scale-105 shrink-0">
                <img
                  src={didarLogoUrl}
                  alt="لوگوی پلتفرم دیدار"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-teal-400 transition-colors">
                  دیدار
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 -mt-1 font-medium">
                  مدیریت هوشمند فضا
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7">
              <a
                href="#features"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1 transition-colors"
              >
                امکانات و ویژگی‌ها
              </a>
              <a
                href="#solutions"
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                راهکارها
              </a>
              <a
                href="#tablet-showcase"
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                نمایشگرهای لمسی
              </a>
              <a
                href="#pricing"
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                تعرفه و پلن‌ها
              </a>
              <a
                href="#customers"
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                مشتریان سازمانی
              </a>
            </nav>
          </div>

          {/* Action Buttons Cluster */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'حالت روز (روشن)' : 'حالت شب (تاریک)'}
              aria-label="تغییر تم رنگی"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Enter Portal Live Demo Link */}
            <button
              onClick={handleEnterPortal}
              className="hidden md:inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
              title="مشاهده مستقیم پرتال عملیاتی سالن‌های جلسات"
            >
              <Play className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>پرتال جلسات</span>
            </button>

            {/* Login Button */}
            <button
              onClick={() => openAuthModal('login')}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all duration-150 active:scale-[0.98] cursor-pointer"
            >
              <LogIn className="w-4 h-4 ml-1.5" />
              <span>ورود به سامانه</span>
            </button>

            {/* Request Demo Button */}
            <a
              href="#demo-form"
              className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 text-xs font-bold transition-all duration-150 shadow-xs hover:shadow-md hover:shadow-blue-600/20 active:scale-[0.98]"
            >
              <CalendarCheck className="w-4 h-4 ml-1.5" />
              <span>درخواست دمو رایگان</span>
            </a>
          </div>
        </header>

        {/* 2. HERO SECTION */}
        <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6">
            {/* Live Status Announcement Tag */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50/80 dark:bg-[#171f33] border border-blue-200 dark:border-slate-700/60 shadow-2xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600 dark:bg-teal-400"></span>
              </span>
              <span className="text-xs text-blue-700 dark:text-blue-300 font-bold">
                نسخه سازمانی ۳.۴ دیدار رونمایی شد
              </span>
              <span className="text-slate-300 dark:text-slate-600 text-xs">|</span>
              <span className="text-xs text-teal-700 dark:text-teal-400 flex items-center font-medium">
                یکپارچه‌سازی با Microsoft Teams و Exchange
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.25] sm:leading-[1.25]">
              سامانه هوشمند{' '}
              <span className="bg-gradient-to-l from-blue-700 via-blue-600 to-teal-600 dark:from-blue-400 dark:via-teal-300 dark:to-indigo-300 bg-clip-text text-transparent">
                رزرو اتاق جلسات
              </span>{' '}
              و مدیریت فضاهای سازمانی
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              خداحافظی همیشگی با تداخل جلسات، بی‌نظمی سالن‌ها و اتلاف وقت ارزشمند تیم‌ها.
              یکپارچه‌سازی بی‌درنگ با گوگل کلندر، مایکروسافت اوت‌لوک و تبلت‌های هوشمند دم‌درب سالن‌های کنفرانس.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto">
              <button
                onClick={openProvisioningModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white text-sm sm:text-base font-bold transition-all duration-200 shadow-xl shadow-blue-600/25 hover:shadow-blue-600/35 active:scale-[0.98] cursor-pointer"
              >
                <Zap className="w-5 h-5" />
                <span>شروع آزمایشی رایگان ۱۴ روزه</span>
              </button>

              <button
                onClick={handleEnterPortal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-white dark:bg-[#171f33] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#222a3d] text-slate-800 dark:text-slate-100 text-sm sm:text-base font-semibold transition-all duration-200 shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <Play className="w-5 h-5 text-blue-600 dark:text-teal-400" />
                <span>مشاهده دموی تعاملی پلتفرم</span>
              </button>
            </div>

            {/* Trust Badges Strip */}
            <div className="pt-8 flex flex-col items-center gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                مورد اعتماد بیش از ۵۰۰ هلدینگ، شرکت فناوری و سازمان پیشرو در ایران
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 opacity-70 dark:opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
                <span className="text-sm font-extrabold tracking-widest text-slate-700 dark:text-slate-300">
                  DIGIKALA
                </span>
                <span className="text-sm font-extrabold tracking-wider text-slate-700 dark:text-slate-300">
                  SNAPP!
                </span>
                <span className="text-sm font-extrabold tracking-widest text-slate-700 dark:text-slate-300">
                  DIVAR
                </span>
                <span className="text-sm font-extrabold tracking-wider text-slate-700 dark:text-slate-300">
                  MAPNA GROUP
                </span>
                <span className="text-sm font-extrabold tracking-wider text-slate-700 dark:text-slate-300">
                  IRANCELL
                </span>
                <span className="text-sm font-extrabold tracking-wider text-slate-700 dark:text-slate-300">
                  BAZAR
                </span>
              </div>
            </div>
          </div>

          {/* Hero Visual Showcase: Floating Dashboard + Hero Real Image */}
          <div className="mt-14 relative mx-auto max-w-5xl">
            {/* Ambient back-glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-400 dark:from-blue-600 dark:via-teal-500 dark:to-indigo-600 rounded-3xl blur-2xl opacity-20 dark:opacity-30"></div>
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#0f172a] shadow-2xl">
              {/* Mockup Window Bar */}
              <div className="h-11 bg-slate-100 dark:bg-[#131b2e] px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs shadow-2xs font-mono" dir="ltr">
                  <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>app.didarspace.ir/enterprise/dashboard</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Hero Content Frame Featuring Meeting Room Image */}
              <div className="relative aspect-[16/9] w-full overflow-hidden group">
                <img
                  src={heroRoomImageUrl}
                  alt="اتاق کنفرانس هوشمند مجهز به سامانه دیدار"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                {/* Gentle gradient vignette for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent"></div>

                {/* Live Floating Room Badge 1: Top Right (Persian Inline-Start) */}
                <div className="absolute top-4 sm:top-6 right-4 sm:right-6 p-3 sm:p-4 rounded-xl bg-white/95 dark:bg-[#171f33]/90 backdrop-blur-md text-right shadow-xl max-w-xs border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                      </span>
                      <span className="text-xs text-rose-700 dark:text-rose-400 font-bold">
                        در حال برگزاری جلسه
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      10:30 - 12:00
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    اتاق کنفرانس ونوس (طبقه ۴)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    نشست هفتگی استراتژی مارکتینگ هلدینگ
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <div className="flex -space-x-2 -space-x-reverse overflow-hidden">
                      <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-800 bg-blue-600 text-[10px] text-white font-bold flex items-center justify-center">
                        ام
                      </span>
                      <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-800 bg-teal-600 text-[10px] text-white font-bold flex items-center justify-center">
                        س‌ر
                      </span>
                      <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-800 bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center">
                        +۴
                      </span>
                    </div>
                    <span className="text-xs text-teal-700 dark:text-teal-400 flex items-center gap-1 font-semibold">
                      <Tv className="w-3.5 h-3.5" />
                      ویدیو وال فعال
                    </span>
                  </div>
                </div>

                {/* Live Floating Badge 2: Quick NFC Booking Indicator Bottom Left */}
                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 p-3 sm:p-4 rounded-xl bg-white/95 dark:bg-[#171f33]/90 backdrop-blur-md shadow-2xl border border-slate-200 dark:border-slate-700 hidden sm:flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        رزرو فوری بدون هماهنگی
                      </span>
                      <span className="px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 text-[10px] font-bold">
                        NFC & QR
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      کارت پرسنلی خود را به تبلت درب ورودی نزدیک کنید
                    </p>
                  </div>
                </div>

                {/* Floating Schedule Telemetry Bar */}
                <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 left-auto hidden md:flex items-center gap-2 p-2 rounded-lg bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 shadow-md text-xs">
                  <span className="px-2.5 py-1 rounded bg-blue-600 text-white font-medium">
                    اتاق‌های آزاد: ۸ سالن
                  </span>
                  <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    در حال استفاده: ۱۴ سالن
                  </span>
                  <span className="px-2.5 py-1 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-medium border border-teal-100 dark:border-teal-900">
                    میانگین بهره‌وری: ۸۴٪
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. PROBLEM & SOLUTION / VALUE PROPOSITION */}
        <section className="py-24 px-4 sm:px-6 lg:px-12 bg-slate-50/70 dark:bg-[#060e20]/80 border-y border-slate-200/80 dark:border-slate-800/60 relative transition-colors" id="solutions">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-xs font-bold text-blue-700 dark:text-blue-300">
                تفاوت دیدار در تجربه کاربری
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                چرا سامانه‌های سنتی و دستی پاسخگوی سازمان شما نیستند؟
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                مقایسه شیوه پراسترس گذشته با جریان خودکار و بدون اصطکاک دیدار
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Old Chaotic Method Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#131b2e] border border-rose-200 dark:border-rose-900/40 shadow-xs relative overflow-hidden space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    روش سنتی، دستی و خسته‌کننده
                  </h3>
                </div>

                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                    <X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>تداخل همزمان دو تیم برای یک سالن و ایجاد مشاجره و اتلاف وقت مدیران</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                    <X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>جلسات رزرو شده روح (Ghost Meetings): رزرو سالن اما عدم حضور اعضا و خالی ماندن بیهوده</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                    <X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>سرگردانی مهمانان خارجی و عدم آگاهی مسئولین تشریفات و پذیرایی از شروع جلسه</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                    <X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>فقدان هرگونه آمار و تحلیل از میزان استفاده واقعی و هزینه‌های سالن‌ها</span>
                  </li>
                </ul>
              </div>

              {/* Modern Didar Automated Solution Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#171f33] border-2 border-teal-500/40 dark:border-teal-500/50 relative overflow-hidden space-y-6 neon-glow-teal shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    راهکار مدرن و هوشمند پلتفرم دیدار
                  </h3>
                </div>

                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span>رزرو فوری با یک کلیک از تقویم گوگل، اوت‌لوک، پنل وب یا تبلت ورودی سالن</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-teal-700 dark:text-teal-300">آزادسازی هوشمند خودکار (Auto-Release):</strong>{' '}
                      در صورت عدم Check-in تا ۱۰ دقیقه، اتاق آزاد می‌شود
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span>اطلاع‌رسانی خودکار به پذیرایی و خدمات همراه با تجهیز سالن طبق چک‌لیست درخواستی</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span>داشبورد تحلیلی حرارتی (Heatmaps) از نرخ بهره‌وری، ساعات شلوغ و بهینه‌سازی فضا</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 4. CORE FEATURES BENTO GRID */}
        <section className="py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full" id="features">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-xs font-bold text-blue-700 dark:text-blue-300">
              امکانات سازمانی پلتفرم
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              زیرساختی همه‌جانبه برای کارایی صددرصدی سالن‌ها
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              طراحی شده مطابق با سخت‌گیرانه‌ترین استانداردهای امنیت شبکه و سادگی کاربری
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento 1: Calendar 2-Way Sync (Wide) */}
            <div className="md:col-span-2 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#171f33] border border-slate-200 dark:border-slate-800 shadow-xs glass-card-hover relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 flex items-center justify-center mb-6">
                  <ArrowLeftRight className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
                  همگام‌سازی دوطرفه بدون تأخیر با گوگل و اوت‌لوک
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                  هر رزروی که در تقویم کاری جاری خود (Google Calendar یا Microsoft Exchange 365) ثبت کنید،
                  بلافاصله روی نمایشگرهای سالن و داشبورد دیدار اعمال می‌شود و بالعکس. بدون نیاز به نصب نرم‌افزارهای پیچیده.
                </p>
              </div>

              {/* Visual Sync Badge Cluster */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#111625] border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Google Workspace
                  </span>
                </div>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#111625] border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Microsoft Outlook / 365
                  </span>
                </div>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#111625] border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    ربات تلگرام و بله سازمانی
                  </span>
                </div>
              </div>
            </div>

            {/* Bento 2: Smart Room Displays (Tall/Standard) */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#171f33] border border-slate-200 dark:border-slate-800 shadow-xs glass-card-hover relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800 flex items-center justify-center mb-6">
                  <Tablet className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  تبلت‌های لمسی دم‌درب سالن
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  نشانگر نوری سبز (آزاد) و قرمز (مشغول). مشاهده فهرست جلسات روز و ثبت رزرو در ۱۰ ثانیه روی نمایشگر اختصاصی درب ورودی.
                </p>
              </div>
              <a
                href="#tablet-showcase"
                className="mt-6 flex items-center gap-2 text-teal-700 dark:text-teal-400 text-xs font-bold hover:underline"
              >
                <span>بررسی مدل‌های سخت‌افزاری</span>
                <ChevronLeft className="w-4 h-4" />
              </a>
            </div>

            {/* Bento 3: Space Analytics & Heatmaps */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#171f33] border border-slate-200 dark:border-slate-800 shadow-xs glass-card-hover relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  تحلیل داده و گزارش‌گیری پیشرفته
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  کدام اتاق بیشترین تقاضا را دارد؟ چه دپارتمان‌هایی جلسات بیهوده رزرو می‌کنند؟ گزارش‌های دقیق جهت کاهش متراژ اضافی و بهینه‌سازی اجاره.
                </p>
              </div>
              <div className="mt-6 font-mono text-xs text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 p-2.5 rounded-lg font-bold">
                ROI Tracker: +۴۲٪ راندمان مصرف فضای جلسات
              </div>
            </div>

            {/* Bento 4: Enterprise SSO & On-Premise */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#171f33] border border-slate-200 dark:border-slate-800 shadow-xs glass-card-hover relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  امنیت سازمانی و On-Premise
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  امکان پیاده‌سازی روی سرورهای محلی سازمان (Local Network)، ورود یکپارچه با Active Directory و پروتکل‌های SAML 2.0 / OAuth.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-teal-700 dark:text-teal-400 text-xs font-semibold">
                <Key className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>رمزنگاری انتها به انتها (E2EE)</span>
              </div>
            </div>

            {/* Bento 5: Catering & Equipment Management */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#171f33] border border-slate-200 dark:border-slate-800 shadow-xs glass-card-hover relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 flex items-center justify-center mb-6">
                  <Coffee className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  مدیریت تشریفات و تجهیزات
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  ثبت سفارش پذیرایی اختصاصی، بررسی موجود بودن کابل HDMI، میکروفون بیسیم، ویدیو پروژکتور و درخواست پشتیبانی فنی با یک تیک.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>ارسال نوتیفیکیشن اختصاصی به واحد خدمات</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. INTERACTIVE HARDWARE & TABLET SHOWCASE */}
        <section className="py-24 px-4 sm:px-6 lg:px-12 bg-slate-50/80 dark:bg-[#081022] border-t border-slate-200/80 dark:border-slate-800/60 relative transition-colors" id="tablet-showcase">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Showcase Copy (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <span className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs font-bold text-teal-700 dark:text-teal-300">
                سخت‌افزار اختصاصی و تبلت‌ها
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-snug">
                اتاق‌های جلسات را به تبلت‌های هوشمند تعاملی دیدار مجهز کنید
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                پایان در زدن‌های بی‌موقع و باز کردن سرزده درب سالن! تبلت‌های لمسی ۱۰ اینچی دیدار در کنار درب هر اتاق، وضعیت جاری و جلسات آینده را با نورپردازی متغیر نمایش می‌دهند.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-teal-500 shrink-0 shadow-[0_0_10px_#14b8a6]"></span>
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                    <strong>نوار نور سبز:</strong> اتاق کاملاً آزاد است، آماده رزرو فوری
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0 shadow-[0_0_10px_#f43f5e]"></span>
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                    <strong>نوار نور قرمز:</strong> جلسه محرمانه یا عمومی در حال برگزاری است
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0 shadow-[0_0_10px_#3b82f6]"></span>
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                    <strong>احراز هویت سریع:</strong> با کارت پرسنلی RFID یا اسکن کد QR
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <a
                  href="#demo-form"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 dark:hover:bg-blue-500 transition-all shadow-md shadow-blue-600/20"
                >
                  <span>سفارش نمونه تبلت سازمانی برای تست</span>
                  <ChevronLeft className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Interactive Tablet UI Simulation (7 cols) */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-xl bg-[#0f172a] dark:bg-[#111625] p-5 rounded-3xl tablet-screen-bezel border-4 border-slate-800 dark:border-[#242b3d] relative text-slate-100 shadow-2xl">
                {/* Side LED Indicator Bar (Dynamic Red or Green Status) */}
                <div
                  className={`absolute -right-3 top-10 bottom-10 w-2 rounded-r-full transition-all duration-300 ${
                    tabletStatus === 'occupied'
                      ? 'bg-rose-500 shadow-[0_0_20px_#f43f5e] animate-pulse'
                      : 'bg-teal-500 shadow-[0_0_20px_#14b8a6]'
                  }`}
                ></div>

                {/* Tablet Top Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-slate-400 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        tabletStatus === 'occupied' ? 'bg-rose-500' : 'bg-teal-500'
                      }`}
                    ></span>
                    <span className="text-slate-100 font-bold">سالن جلسات شماره ۳ - دماوند</span>
                  </div>
                  <div className="font-mono text-slate-200 font-semibold text-[11px]">
                    ۱۱:۴۵ قبل‌ازظهر | چهارشنبه ۱۲ اردیبهشت
                  </div>
                </div>

                {/* Tablet Main Canvas */}
                {tabletStatus === 'occupied' ? (
                  <div className="py-8 text-center space-y-3">
                    <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold inline-block border border-rose-500/30">
                      غیرقابل رزرو | در حال برگزاری
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      جلسه بررسی صورت‌های مالی فصلی
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400">
                      برگزارکننده: دکتر علیرضا کاظمی (معاونت مالی)
                    </p>

                    {/* Progress Countdown Bar */}
                    <div className="max-w-md mx-auto pt-4">
                      <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                        <span>شروع: ۱۱:۰۰</span>
                        <span className="text-blue-400 font-bold">{minutesRemaining} دقیقه باقی‌مانده</span>
                        <span>پایان: ۱۲:۱۵</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(20, (1 - minutesRemaining / 75) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-4">
                    <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold inline-block border border-teal-500/30">
                      اتاق آزاد است | آماده رزرو فوری
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      سالن آماده برگزاری جلسه بعدی
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400">
                      کارت پرسنلی خود را نزدیک کنید یا دکمه رزرو سریع را بزنید
                    </p>
                    <button
                      onClick={handleQuickBookFromTablet}
                      className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      رزرو فوری ۳۰ دقیقه‌ای همین سالن
                    </button>
                  </div>
                )}

                {/* Tablet Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={handleExtendMeeting}
                    className="py-3 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 text-center text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-700/50 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-blue-400" />
                    <span>تمدید ۱۵ دقیقه‌ای</span>
                  </button>
                  <button
                    onClick={tabletStatus === 'occupied' ? handleEndEarly : handleQuickBookFromTablet}
                    className="py-3 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 text-center text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-700/50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{tabletStatus === 'occupied' ? 'پایان زودهنگام جلسه' : 'رزرو سریع'}</span>
                  </button>
                </div>

                {/* Next Up Meeting Sneak Peek */}
                <div className="mt-4 p-3 rounded-lg bg-slate-800/60 flex items-center justify-between text-xs border border-slate-800">
                  <span className="text-slate-400">جلسه بعدی: ۱۲:۳۰ تا ۱۳:۳۰</span>
                  <span className="text-slate-200 font-semibold">مصاحبه فنی نیروی ارشد دواپس</span>
                  <span className="text-teal-400 font-mono text-[11px]">ثبت با تقویم اوت‌لوک</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. STATS TICKER & SOCIAL PROOF */}
        <section className="py-20 px-4 sm:px-6 lg:px-12 bg-white dark:bg-[#060e20] border-y border-slate-200 dark:border-slate-800/60 transition-colors">
          <div className="max-w-7xl mx-auto">
            {/* Stat Numbers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight font-mono">
                  ۹۹.۹۸٪
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  پایداری تضمین‌شده سرور (SLA)
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-teal-600 dark:text-teal-400 tracking-tight font-mono">
                  +۴۵٪
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  کاهش زمان هماهنگی جلسات
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight font-mono">
                  ۰ مورد
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  تداخل و نشست همزمان گزارش‌شده
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
                  +۲۵۰,۰۰۰
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  جلسه موفق ثبت‌شده در سال گذشته
                </div>
              </div>
            </div>

            {/* Executive Testimonials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-20" id="customers">
              {/* Testimonial 1 */}
              <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 dark:bg-[#171f33] border border-slate-200 dark:border-slate-800 shadow-xs relative space-y-4">
                <Quote className="w-9 h-9 text-blue-600 dark:text-blue-400" />
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                  «قبل از پیاده‌سازی دیدار، بیش از ۳۰ درصد جلسات هیئت مدیره و مدیران ارشد ما به خاطر عدم هماهنگی اتاق‌ها با تاخیر مواجه می‌شد. اکنون با همگام‌سازی مستقیم اوت‌لوک و تبلت‌های دم‌درب، انضباط کامل بر فضای کار اشتراکی حاکم شده است.»
                </p>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                    م‌ر
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      مهندس محمدرضا راد
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      مدیر ارشد فناوری (CTO) هلدینگ ارتباطات نوین
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 dark:bg-[#171f33] border border-slate-200 dark:border-slate-800 shadow-xs relative space-y-4">
                <Quote className="w-9 h-9 text-teal-600 dark:text-teal-400" />
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                  «ویژگی آزادسازی خودکار سالن‌ها در صورت عدم حضور اعضا، انقلابی در بازدهی فضاهای ما بود. قبلاً اتاق‌ها تا پایان روز اشغال ثبت می‌شدند اما هیچکس در آن‌ها نبود! این سیستم سرمایه ما را به بهترین شکل حفظ کرد.»
                </p>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
                    س‌ن
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">سارا نادری</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      معاون منابع انسانی و تسهیلات در شرکت پردازش داده پویا
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. TRANSPARENT PRICING & PLANS */}
        <section className="py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full" id="pricing">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-xs font-bold text-blue-700 dark:text-blue-300">
              تعرفه‌های سازمانی منعطف
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              پلنی متناسب با اندازه و مقیاس فضای کاری شما
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              امکان تغییر پلن یا افزودن سالن در هر زمان بدون جریمه
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Plan 1: Starter */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">
                  استارتاپ و تیم‌های رشد
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  پلن پایه (تیم‌های تا ۵ اتاق)
                </h3>
                <div className="pt-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                    ۴۹۰,۰۰۰
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs mr-1.5">
                    تومان / ماهانه به ازای هر اتاق
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  ایده‌آل برای استارتاپ‌ها، شرکت‌های زیر ۵۰ نفر و فضاهای کاری اشتراکی نوپا
                </p>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>سامانه رزرو وب و موبایل واکنش‌گرا</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>سینک با Google Calendar</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>پشتیبانی تیکتی ساعات اداری</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-400 dark:text-slate-600">
                    <X className="w-4 h-4 shrink-0" />
                    <span className="line-through">قابلیت اتصال تبلت دم‌درب</span>
                  </div>
                </div>
              </div>

              <button
                onClick={openProvisioningModal}
                className="w-full py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-center text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                انتخاب پلن استارتاپ
              </button>
            </div>

            {/* Plan 2: Professional (Featured & Most Popular) */}
            <div className="p-6 sm:p-8 rounded-2xl bg-blue-50/70 dark:bg-[#171f33] border-2 border-blue-600 dark:border-blue-500 relative flex flex-col justify-between space-y-8 neon-glow-blue shadow-lg">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold shadow-md">
                بیشترین انتخاب سازمان‌ها
              </div>

              <div className="space-y-4">
                <span className="text-xs text-blue-700 dark:text-blue-400 uppercase font-semibold">
                  شرکت‌های در حال توسعه
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  پلن حرفه‌ای و سازمانی
                </h3>
                <div className="pt-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                    ۸۹۰,۰۰۰
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 text-xs mr-1.5">
                    تومان / ماهانه به ازای هر اتاق
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  کامل‌ترین پکیج مدیریت هوشمند سالن‌ها همراه با تبلت دم‌درب
                </p>

                <div className="pt-4 border-t border-blue-100 dark:border-slate-700 space-y-3 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100 font-medium">
                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>همگام‌سازی کامل Google Calendar و Outlook</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100 font-medium">
                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>پشتیبانی نامحدود از تبلت‌های هوشمند ورودی</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100 font-medium">
                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>آزادسازی خودکار سالن‌های خالی (Auto-Release)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100 font-medium">
                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>داشبورد آماری، گزارش نقشه حرارتی سالن‌ها</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100 font-medium">
                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>پشتیبانی تلفنی و اختصاصی ۲۴/۷</span>
                  </div>
                </div>
              </div>

              <a
                href="#demo-form"
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-center text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                درخواست دمو و فعال‌سازی آزمایشی
              </a>
            </div>

            {/* Plan 3: Enterprise / Holding */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">
                  هلدینگ‌ها و بانک‌ها
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  پلن سازمان‌های بزرگ
                </h3>
                <div className="pt-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                    سفارشی
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs mr-1.5">
                    قرارداد و SLA اختصاصی
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  برای سازمان‌های با بیش از ۳۰ سالن، ساختمان‌های متعدد یا الزامات سرور محلی
                </p>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>نصب در بستر اختصاصی On-Premise داخل دیتاسنتر کارفرما</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>یکپارچگی با سامانه‌های حضور و غیاب، اتوماسیون اداری و RFID</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>توسعه فیچرهای اختصاصی و مدیریت چندین شعبه</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>مدیر موفقیت مشتری (Account Manager) مقیم</span>
                  </div>
                </div>
              </div>

              <a
                href="#demo-form"
                className="w-full py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-center text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                تماس با مدیر فروش سازمانی
              </a>
            </div>
          </div>
        </section>

        {/* 8. HIGH-CONVERTING FINAL CTA & DEMO REQUEST FORM */}
        <section className="py-20 px-4 sm:px-6 lg:px-12 bg-slate-100/70 dark:bg-[#060e20] relative overflow-hidden transition-colors" id="demo-form">
          <div className="max-w-5xl mx-auto rounded-3xl p-6 sm:p-8 lg:p-14 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-700/80 relative shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-4">
                <span className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs text-teal-700 dark:text-teal-300 font-bold">
                  مشاوره و استقرار رایگان
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                  فضای کاری و سالن‌های جلسات سازمان خود را در کمتر از ۱۰ دقیقه متحول کنید
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  فرم زیر را تکمیل کنید تا کارشناسان ما جهت ارائه دموی زنده و نیازسنجی سالن‌های کنفرانس در کمتر از ۲ ساعت کاری با شما تماس بگیرند.
                </p>

                <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    بدون نیاز به کارت اعتباری
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    راه‌اندازی ظرف ۱ روز کاری
                  </span>
                </div>
              </div>

              {/* Quick Lead Form (5 cols) */}
              <div className="lg:col-span-5 bg-slate-50 dark:bg-[#0b1326] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                {isSubmitted ? (
                  <div className="text-center py-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      درخواست شما با موفقیت ثبت شد
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      کارشناسان ما به زودی با شماره تماس اعلام‌شده هماهنگی‌های لازم را انجام خواهند داد.
                    </p>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline pt-2 cursor-pointer"
                    >
                      ثبت درخواست جدید
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitLead} className="space-y-3.5">
                    <div>
                      <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1.5 font-semibold">
                        نام و نام خانوادگی
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        placeholder="مثال: سهراب سپهری"
                        className="w-full h-10 px-3.5 rounded-lg bg-white dark:bg-[#171f33] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1.5 font-semibold">
                        شماره همراه سازمانی
                      </label>
                      <input
                        type="tel"
                        dir="ltr"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        placeholder="0912xxxxxxx"
                        className="w-full h-10 px-3.5 rounded-lg bg-white dark:bg-[#171f33] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs text-right focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1.5 font-semibold">
                        نام سازمان / شرکت
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="نام هلدینگ یا استارتاپ"
                        className="w-full h-10 px-3.5 rounded-lg bg-white dark:bg-[#171f33] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1.5 font-semibold">
                        تعداد اتاق‌های جلسات
                      </label>
                      <select
                        value={formData.roomCount}
                        onChange={(e) => setFormData({ ...formData, roomCount: e.target.value })}
                        className="w-full h-10 px-3.5 rounded-lg bg-white dark:bg-[#171f33] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
                      >
                        <option value="1-3">۱ تا ۳ اتاق</option>
                        <option value="4-10">۴ تا ۱۰ اتاق</option>
                        <option value="11-30">۱۱ تا ۳۰ اتاق</option>
                        <option value="30+">بیش از ۳۰ اتاق (هلدینگ چندطبقه)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'در حال ارسال...' : 'ثبت درخواست و هماهنگی جلسه دمو'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 9. COMPREHENSIVE ENTERPRISE FOOTER */}
        <footer className="bg-slate-50 dark:bg-[#060e20] border-t border-slate-200 dark:border-slate-800 pt-16 pb-12 px-4 sm:px-6 lg:px-12 text-slate-600 dark:text-slate-400 transition-colors">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            {/* Brand identity and summary */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/40 flex items-center justify-center p-1 shadow-xs">
                  <img
                    src={didarLogoUrl}
                    alt="لوگوی دیدار"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">دیدار</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed max-w-sm text-slate-600 dark:text-slate-300">
                سامانه هوشمند و جامع رزرو اتاق جلسات، مدیریت فضاهای کار اشتراکی و مانیتورینگ سخت‌افزاری نمایشگرهای اداری. توسعه‌یافته برای ارتقای بهره‌وری سازمان‌های ایرانی.
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-2 text-slate-700 dark:text-slate-300">
                <span className="px-2.5 py-1 rounded bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 text-[11px] font-mono font-medium">
                  ISO 27001 Certified
                </span>
                <span className="px-2.5 py-1 rounded bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 text-[11px] font-mono font-medium">
                  SOC 2 Type II
                </span>
                <span className="px-2.5 py-1 rounded bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 text-[11px] font-medium">
                  ساخت ایران با افتخار
                </span>
              </div>
            </div>

            {/* Col 1: Product */}
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                محصول و فناوری
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#features" className="hover:text-blue-600 dark:hover:text-teal-400 transition-colors">
                    رزرو آنلاین و وب‌اپ
                  </a>
                </li>
                <li>
                  <a href="#tablet-showcase" className="hover:text-blue-600 dark:hover:text-teal-400 transition-colors">
                    تبلت‌های نمایشگر دم‌درب
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-blue-600 dark:hover:text-teal-400 transition-colors">
                    سینک با گوگل کلندر و اوت‌لوک
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-blue-600 dark:hover:text-teal-400 transition-colors">
                    سنسورهای حضور IoT
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-blue-600 dark:hover:text-teal-400 transition-colors">
                    نسخه محلی (On-Premise)
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 2: Solutions */}
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                راهکارهای صنعتی
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#solutions" className="hover:text-blue-600 dark:hover:text-teal-400 transition-colors">
                    شرکت‌های فناوری و IT
                  </a>
                </li>
                <li>
                  <a href="#solutions" className="hover:text-blue-600 dark:hover:text-teal-400 transition-colors">
                    بانک‌ها و موسسات مالی
                  </a>
                </li>
                <li>
                  <a href="#solutions" className="hover:text-blue-600 dark:hover:text-teal-400 transition-colors">
                    هلدینگ‌های پتروشیمی و صنعتی
                  </a>
                </li>
                <li>
                  <a href="#solutions" className="hover:text-blue-600 dark:hover:text-teal-400 transition-colors">
                    فضاهای کار اشتراکی (Coworking)
                  </a>
                </li>
                <li>
                  <a href="#solutions" className="hover:text-blue-600 dark:hover:text-teal-400 transition-colors">
                    دانشگاه‌ها و مراکز نوآوری
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Contact & Support */}
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                تماس و پشتیبانی
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="font-mono text-[11px]" dir="ltr">
                    ۰۲۱ - ۸۸۹۹ ۳۴۲۱
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="font-mono text-[11px]">sales@didarspace.ir</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <span>تهران، پارک فناوری پردیس، مجتمع مروارید</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright Bar */}
          <div className="max-w-7xl mx-auto pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <p>© ۱۴۰۳ دیدار (سامانه مدیریت هوشمند فضاهای کاری). تمامی حقوق محفوظ است.</p>
            <div className="flex flex-wrap items-center gap-6">
              <a href="#" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                حریم خصوصی
              </a>
              <a href="#" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                شرایط استفاده و SLA
              </a>
              <a href="#" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                مستندات API برای توسعه‌دهندگان
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
