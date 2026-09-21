import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Logo } from "../common/Logo";
import {
  LogIn,
  Play,
  ShieldCheck,
  Users,
  Zap,
  LayoutGrid,
  CalendarCheck,
  BarChart3,
  Plug,
  ArrowLeft,
  Plus,
  Instagram,
  Linkedin,
  Twitter,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";

const navLinks = [
  { href: "#product", label: "محصول" },
  { href: "#features", label: "امکانات" },
  { href: "#pricing", label: "قیمت‌گذاری" },
  { href: "#customers", label: "مشتریان" },
  { href: "#resources", label: "منابع" },
  { href: "#about", label: "درباره ما" },
  { href: "#contact", label: "تماس با ما" },
];

const trustBrands = ["نماوا", "تپسی", "فیلیمو", "اسنپ", "دیجی‌کالا"];

const features = [
  {
    title: "مدیریت هوشمند",
    desc: "کنترل یکپارچه اتاق‌ها، ظرفیت و وضعیت اشغال در یک داشبورد ساده.",
    icon: LayoutGrid,
    tone: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  },
  {
    title: "رزرو آسان",
    desc: "رزرو جلسه در چند ثانیه با تقویم تعاملی و تأیید خودکار.",
    icon: CalendarCheck,
    tone: "bg-emerald-50 text-[#0F786E] dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  {
    title: "گزارش‌های دقیق",
    desc: "تحلیل بهره‌وری فضاها و الگوی استفاده تیم‌ها برای تصمیم بهتر.",
    icon: BarChart3,
    tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  },
  {
    title: "یکپارچه‌سازی",
    desc: "اتصال به تقویم سازمانی، SSO و ابزارهای محبوب تیم شما.",
    icon: Plug,
    tone: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  },
];

const solutions = [
  {
    title: "فضاهای مشترک",
    desc: "مناسب تیم‌های کوچک و فضاهای باز.",
    capacity: "۴–۶ نفر",
    image:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "اتاق‌های جلسه",
    desc: "جلسات تیمی با تجهیزات استاندارد.",
    capacity: "۶–۱۲ نفر",
    image:
      "https://images.unsplash.com/photo-1431540015161-0bf6a63ab739?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "اتاق‌های کنفرانس",
    desc: "جلسات رسمی و ارائه‌های سازمانی.",
    capacity: "۱۲–۳۰ نفر",
    image:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e0?auto=format&fit=crop&w=600&q=80",
  },
];

export const LandingView: React.FC = () => {
  const {
    openAuthModal,
    openProvisioningModal,
    setViewMode,
    setActiveTab,
    showToast,
  } = useApp();
  const [newsletterEmail, setNewsletterEmail] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const startFree = () => {
    openProvisioningModal();
  };

  const enterApp = () => {
    setActiveTab("dashboard");
    setViewMode("app");
  };

  const onNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    showToast("ایمیل شما برای خبرنامه ثبت شد.", "success");
    setNewsletterEmail("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-[#0F172A] text-[#0F172A] dark:text-slate-100 font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={enterApp}
            className="shrink-0 cursor-pointer"
            aria-label="دیدار"
          >
            <Logo variant="horizontal" size="md" showTagline={false} />
          </button>

          <nav className="hidden xl:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-[#0F786E] dark:hover:text-emerald-300 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#0F786E] dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>ورود / ثبت‌نام</span>
            </button>
            <button
              type="button"
              onClick={startFree}
              className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold text-white bg-[#0F786E] hover:bg-[#0D6B63] shadow-sm transition-colors cursor-pointer"
            >
              شروع رایگان
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        id="product"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-16 sm:pb-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="order-2 lg:order-1 text-right space-y-6">
            <span className="inline-block text-[11px] font-bold text-[#0F786E] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">
              مدیریت هوشمند فضاهای اداری
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black leading-tight tracking-tight text-[#0F172A] dark:text-white">
              فضایی بهتر برای
              <br />
              <span className="text-[#0F786E] dark:text-emerald-400">
                تصمیم‌های بهتر
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
              دیدار به تیم شما کمک می‌کند اتاق جلسه را سریع رزرو کنید، از تداخل
              جلسات جلوگیری کنید و بهره‌وری فضاهای سازمانی را افزایش دهید.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={startFree}
                className="px-6 py-3 rounded-full bg-[#0F786E] hover:bg-[#0D6B63] text-white text-sm font-bold shadow-md shadow-emerald-900/10 transition-colors cursor-pointer"
              >
                شروع رایگان
              </button>
              <button
                type="button"
                onClick={enterApp}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 text-[#0F786E]" />
                تماشای ویدیو
              </button>
            </div>
            <ul className="flex flex-wrap gap-4 sm:gap-6 pt-2 text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                امن و قابل اعتماد
              </li>
              <li className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#10B981]" />
                مناسب برای همه تیم‌ها
              </li>
              <li className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#10B981]" />
                نصب سریع
              </li>
            </ul>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-200/80 dark:border-slate-700/60 aspect-[4/3]">
              <img
                src={HERO_IMAGE}
                alt="اتاق جلسه مدرن"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -right-2 sm:right-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-3 w-[min(100%,220px)]">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                اتاق ۱
              </p>
              <p className="text-xs font-black text-[#0F786E] dark:text-emerald-300 mt-0.5">
                در حال استفاده
              </p>
              <p className="text-[10px] font-mono text-slate-500 mt-1">
                ۱۰:۳۰ – ۱۱:۴۵
              </p>
            </div>
            <div className="absolute top-6 -left-2 sm:left-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-3 w-[min(100%,200px)] hidden sm:block">
              <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                جلسات امروز
              </p>
              <div className="mt-2 space-y-1.5">
                <div className="h-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 w-full" />
                <div className="h-2 rounded-full bg-emerald-200 dark:bg-emerald-800/50 w-4/5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section
        id="customers"
        className="border-y border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-[#1E293B]/40 py-8"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-5">
            مورد اعتماد تیم‌های پیشرو
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-70 grayscale">
            {trustBrands.map((brand) => (
              <span
                key={brand}
                className="text-lg sm:text-xl font-black text-slate-400 dark:text-slate-500 tracking-tight"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="text-right space-y-4 lg:sticky lg:top-24">
            <span className="text-[11px] font-bold text-[#0F786E] dark:text-emerald-300">
              چرا دیدار؟
            </span>
            <h2 className="text-2xl sm:text-3xl font-black leading-snug">
              تمام آنچه برای مدیریت جلسات نیاز دارید
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              از رزرو تا گزارش‌گیری، همه‌چیز در یک پلتفرم یکپارچه و سازگار با
              نیاز سازمان‌های ایرانی.
            </p>
            <a
              href="#solutions"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#0F786E] dark:text-emerald-300 hover:underline"
            >
              آشنایی بیشتر با امکانات
              <ArrowLeft className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-600/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow text-right"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${f.tone}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black mb-1.5">{f.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mobile app */}
      <section
        id="resources"
        className="bg-[#ECFDF5] dark:bg-emerald-950/20 border-y border-emerald-100/80 dark:border-emerald-900/30"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="flex justify-center gap-4 order-2 lg:order-1">
            <div className="w-[140px] sm:w-[160px] h-[280px] sm:h-[320px] rounded-[2rem] bg-slate-900 border-4 border-slate-800 shadow-2xl p-2">
              <div className="w-full h-full rounded-[1.4rem] bg-white dark:bg-slate-800 overflow-hidden p-3">
                <div className="h-3 w-16 rounded bg-emerald-100 dark:bg-emerald-900/50 mb-3" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-8 rounded-lg bg-slate-100 dark:bg-slate-700/60"
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="w-[140px] sm:w-[160px] h-[280px] sm:h-[320px] rounded-[2rem] bg-slate-900 border-4 border-slate-800 shadow-2xl p-2 mt-8">
              <div className="w-full h-full rounded-[1.4rem] bg-[#0F786E] flex flex-col items-center justify-center text-white p-4 text-center">
                <p className="text-xs font-bold">رزرو موفق</p>
                <p className="text-[10px] mt-2 opacity-90">
                  اتاق نوآوری — ۱۴:۰۰
                </p>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 text-right space-y-5">
            <h2 className="text-2xl sm:text-3xl font-black leading-snug">
              مدیریت جلسات در هر زمان و از هر مکان
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              با اپلیکیشن موبایل دیدار، وضعیت اتاق‌ها را ببینید، جلسه رزرو کنید
              و اعلان‌ها را در لحظه دریافت کنید.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-default"
              >
                Google Play
              </button>
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-default"
              >
                App Store
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section
        id="solutions"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-end mb-10">
          <div className="text-right space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black">
              مناسب هر نوع سازمان
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              از استارتاپ‌های کوچک تا سازمان‌های بزرگ — دیدار با شما مقیاس
              می‌گیرد.
            </p>
            <button
              type="button"
              onClick={enterApp}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#0F786E] dark:text-emerald-300 hover:underline cursor-pointer"
            >
              مشاهده راهکارها
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {solutions.map((s) => (
            <article
              key={s.title}
              className="group rounded-2xl overflow-hidden bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-600/50 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={s.image}
                  alt={s.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5 text-right">
                <h3 className="text-sm font-black mb-1">{s.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {s.desc}
                </p>
                <span className="inline-flex text-[10px] font-bold text-[#0F786E] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  ظرفیت {s.capacity}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        id="pricing"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20"
      >
        <div className="rounded-3xl bg-[#ECFDF5] dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/40 p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="text-right space-y-4">
            <h2 className="text-xl sm:text-2xl font-black">
              همین حالا شروع کنید و بهره‌وری تیم خود را افزایش دهید
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startFree}
                className="px-6 py-3 rounded-full bg-[#0F786E] hover:bg-[#0D6B63] text-white text-sm font-bold cursor-pointer"
              >
                شروع رایگان
              </button>
              <a
                href="#contact"
                className="px-6 py-3 rounded-full border-2 border-[#0F786E] text-[#0F786E] dark:text-emerald-300 dark:border-emerald-500 text-sm font-bold inline-flex items-center justify-center hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
              >
                تماس با ما
              </a>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-xs rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 p-6 text-center">
              <Logo variant="stacked" size="md" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
                داشبورد رزرو و مدیریت جلسات
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="about"
        className="bg-white dark:bg-[#0F172A] border-t border-slate-200 dark:border-slate-700/60 pt-12 pb-8"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
            <div className="lg:col-span-4 text-right space-y-4">
              <Logo variant="horizontal" size="md" showTagline />
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                سامانه هوشمند رزرو اتاق جلسات و مدیریت فضاهای سازمانی.
              </p>
            </div>
            <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-6 text-right text-xs">
              <div>
                <p className="font-black mb-3">محصول</p>
                <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                  <li>
                    <a href="#features" className="hover:text-[#0F786E]">
                      امکانات
                    </a>
                  </li>
                  <li>
                    <a href="#pricing" className="hover:text-[#0F786E]">
                      قیمت‌گذاری
                    </a>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={enterApp}
                      className="hover:text-[#0F786E] cursor-pointer"
                    >
                      دمو
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-black mb-3">منابع</p>
                <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                  <li>
                    <a href="#resources" className="hover:text-[#0F786E]">
                      راهنما
                    </a>
                  </li>
                  <li>
                    <a href="#customers" className="hover:text-[#0F786E]">
                      مشتریان
                    </a>
                  </li>
                </ul>
              </div>
              <div id="contact">
                <p className="font-black mb-3">تماس</p>
                <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                  <li className="flex items-center gap-2 justify-end">
                    <Mail className="w-3.5 h-3.5" />
                    info@didar.ir
                  </li>
                  <li className="flex items-center gap-2 justify-end">
                    <Phone className="w-3.5 h-3.5" />
                    ۰۲۱-۹۱۰۰۰۰۰۰
                  </li>
                  <li className="flex items-center gap-2 justify-end">
                    <MapPin className="w-3.5 h-3.5" />
                    تهران، ایران
                  </li>
                </ul>
              </div>
            </div>
            <div className="lg:col-span-3 text-right">
              <p className="font-black text-sm mb-3">با خبر شوید</p>
              <form onSubmit={onNewsletter} className="flex gap-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="ایمیل شما"
                  className="flex-1 min-w-0 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:border-[#0F786E]"
                />
                <button
                  type="submit"
                  className="h-10 w-10 shrink-0 rounded-xl bg-[#0F786E] text-white flex items-center justify-center cursor-pointer"
                  aria-label="ثبت ایمیل"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} دیدار. تمامی حقوق محفوظ است.</p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
