import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  KeyRound,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Users,
  LogOut,
  LogIn,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Clock,
  Laptop,
  Smartphone,
  Info,
  Save,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  Calendar,
  Eye,
  Settings,
} from "lucide-react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  size?: "sm" | "md";
  label?: string;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  size = "md",
  label,
  disabled,
}) => {
  const isSm = size === "sm";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`group relative inline-flex items-center shrink-0 cursor-pointer rounded-full border-0 p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.40)] ${
        isSm ? "h-5 w-9" : "h-6 w-11"
      } ${
        checked ? "bg-[var(--brand-primary)]" : "bg-slate-300 dark:bg-slate-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span className="sr-only">{label || "تغییر وضعیت"}</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none block aspect-square shrink-0 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
          isSm ? "h-4 w-4" : "h-5 w-5"
        } ${
          checked ? (isSm ? "-translate-x-4" : "-translate-x-5") : "translate-x-0"
        }`}
      />
    </button>
  );
};

interface AuditLogEntry {
  id: string;
  userName: string;
  userEmail: string;
  method: "google" | "password" | "quick";
  action: "login" | "logout" | "blocked";
  ip: string;
  device: string;
  timestamp: string;
  status: "success" | "warning" | "error";
  details: string;
}

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "log-1",
    userName: "محمد نوابی",
    userEmail: "mohammad.navabi.2025@gmail.com",
    method: "google",
    action: "login",
    ip: "185.120.45.12",
    device: "Chrome / macOS (دسکتاپ)",
    timestamp: "امروز - ۱۰:۲۵",
    status: "success",
    details: "ورود موفق با SSO حساب کاربری گوگل",
  },
  {
    id: "log-2",
    userName: "علی احمدی",
    userEmail: "employee@technova.ir",
    method: "password",
    action: "login",
    ip: "178.252.189.90",
    device: "Firefox / Windows",
    timestamp: "امروز - ۰۹:۱۵",
    status: "success",
    details: "ورود موفق با ایمیل و گذرواژه سازمانی",
  },
  {
    id: "log-3",
    userName: "ناشناس (مهمان)",
    userEmail: "guest@external.com",
    method: "google",
    action: "blocked",
    ip: "91.98.11.23",
    device: "Safari / iPhone",
    timestamp: "دیروز - ۱۸:۴۰",
    status: "warning",
    details: "درخواست ورود به دلیل عدم تطابق دامنه رد شد",
  },
  {
    id: "log-4",
    userName: "سارا مرادی",
    userEmail: "manager@technova.ir",
    method: "password",
    action: "logout",
    ip: "185.120.45.12",
    device: "Chrome / macOS",
    timestamp: "دیروز - ۱۷:۳۰",
    status: "success",
    details: "خروج عادی کاربر از سامانه",
  },
];

import { ApiService } from "../../services/apiService";

export const AccessControlView: React.FC = () => {
  const {
    currentOrg,
    currentUser,
    userRole,
    accessControl,
    updateAccessControl,
    showToast,
    setActiveTab,
  } = useApp();

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [newDomainInput, setNewDomainInput] = useState("");

  const persistOrgAuthFromUi = async (next: Partial<typeof accessControl>) => {
    if (!currentOrg?.id) return;
    const merged = { ...accessControl, ...next };
    try {
      await ApiService.updateOrganizationAuthSettings(currentOrg.id, {
        localEnabled: merged.emailPasswordAuthEnabled,
        googleEnabled: merged.googleAuthEnabled,
        authPolicies: {
          selfRegistrationEnabled: merged.selfRegistrationEnabled,
        },
        googleConfiguration: {
          allowedDomains: merged.allowedGoogleDomains,
        },
      });
    } catch {
      showToast("ذخیره روی سرور ناموفق بود؛ تنظیمات فقط محلی به‌روز شد.", "error");
    }
  };

  const handleToggle = (key: keyof typeof accessControl, label: string) => {
    const currentVal = Boolean(accessControl[key]);
    const nextVal = !currentVal;
    const patch = { [key]: nextVal } as Partial<typeof accessControl>;
    updateAccessControl(patch);
    if (
      key === "googleAuthEnabled" ||
      key === "emailPasswordAuthEnabled" ||
      key === "selfRegistrationEnabled"
    ) {
      void persistOrgAuthFromUi(patch);
    }
    showToast(
      `${label} ${nextVal ? "«فعال»" : "«غیرفعال»"} شد.`,
      nextVal ? "success" : "info"
    );
  };

  const handleTimeoutChange = (minutes: number) => {
    updateAccessControl({ sessionTimeoutMinutes: minutes });
    showToast(
      minutes === 0
        ? "انقضای خودکار نشست غیرفعال شد (نامحدود)"
        : `مدت زمان انقضای خودکار نشست به ${minutes} دقیقه تغییر یافت.`,
      "success"
    );
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const domain = newDomainInput.trim().toLowerCase().replace(/^@/, "");
    if (!domain) return;
    if (accessControl.allowedGoogleDomains.includes(domain)) {
      showToast("این دامنه از قبل در لیست دامنه‌های مجاز وجود دارد.", "info");
      return;
    }
    const updated = [...accessControl.allowedGoogleDomains.filter((d) => d !== "*"), domain];
    updateAccessControl({ allowedGoogleDomains: updated });
    setNewDomainInput("");
    showToast(`دامنه «@${domain}» با موفقیت به دامنه‌های مجاز اضافه شد.`, "success");
  };

  const handleRemoveDomain = (domain: string) => {
    const updated = accessControl.allowedGoogleDomains.filter((d) => d !== domain);
    updateAccessControl({
      allowedGoogleDomains: updated.length === 0 ? ["*"] : updated,
    });
    showToast(`دامنه «@${domain}» از لیست حذف شد.`, "info");
  };

  const handleResetDefaults = () => {
    updateAccessControl({
      googleAuthEnabled: true,
      googleAutoSignOut: true,
      allowedGoogleDomains: ["*"],
      emailPasswordAuthEnabled: true,
      selfRegistrationEnabled: true,
      requireApprovalAfterHours: true,
      guestBookingEnabled: false,
      employeeAnalyticsEnabled: true,
      allowParticipantModifications: false,
      sessionTimeoutMinutes: 60,
      twoFactorAuthRequired: false,
    });
    showToast("کلیه تنظیمات امنیتی و دسترسی‌ها به مقادیر پیش‌فرض بازنشانی شدند.", "success");
  };

  const handleRevokeAllSessions = () => {
    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        userName: currentUser?.name || "مدیر سازمان",
        userEmail: currentUser?.email || "admin@rooomchi.ir",
        method: "quick",
        action: "logout",
        ip: "127.0.0.1",
        device: "فرمان مدیر سامانه",
        timestamp: "اکنون",
        status: "warning",
        details: "ابطال اجباری کلیه نشست‌های فعال سامانه توسط مدیر",
      },
      ...prev,
    ]);
    showToast("دستور ابطال کلیه نشست‌های فعال دیگر در شبکه صادر شد.", "success");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full pb-12" id="access-control-view">
      {/* Top Banner / Navigation Shortcut */}
      <div className="dark-surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--brand-primary-rgb)/0.10)] dark:bg-[rgb(var(--brand-primary-rgb)/0.10)] text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] flex items-center justify-center shrink-0 border border-[rgb(var(--brand-primary-rgb)/0.20)]">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                کنترل دسترسی‌ها و امنیت احراز هویت
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] text-brand dark:text-[var(--brand-primary-on-dark)] border border-brand-soft/60">
                سیاست‌های فعال
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مدیریت ورود و خروج با Google، محدودسازی دسترسی پرسنل و مجوزهای رزرو فضاهای سازمانی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("admin-rbac")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)]" />
            <span>مدیریت نقش‌های کاربران</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="بازگردانی به مقادیر اولیه"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>پیش‌فرض</span>
          </button>
        </div>
      </div>

      {/* Grid: Main Control Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Google Authentication & Sign-in/Sign-out (Requested Feature) */}
        <div className="dark-surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  احراز هویت با گوگل (Google OAuth / Gmail)
                </h3>
                <span className="text-[11px] text-slate-400">
                  تنظیمات ورود و خروج مستقیم با اکانت گوگل
                </span>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                accessControl.googleAuthEnabled
                  ? "bg-brand-soft text-brand dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] dark:text-[var(--brand-primary-on-dark)] border border-brand-soft/60"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60"
              }`}
            >
              {accessControl.googleAuthEnabled ? "فعال" : "غیرفعال"}
            </span>
          </div>

          <div className="space-y-3.5">
            {/* Toggle 1: Google Sign-in Enable/Disable */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/70 dark:border-[#334155]">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <LogIn className="w-3.5 h-3.5 text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)]" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    امکان ورود و ثبت‌نام با حساب گوگل
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  در صورت غیرفعال بودن، دکمه ورود با گوگل در صفحه ورود مسدود شده و اعضا تنها با ایمیل و رمز مجاز خواهند بود.
                </p>
              </div>

              <ToggleSwitch
                checked={accessControl.googleAuthEnabled}
                onChange={() =>
                  handleToggle("googleAuthEnabled", "ورود با حساب گوگل")
                }
                label="امکان ورود و ثبت‌نام با حساب گوگل"
              />
            </div>

            {/* Toggle 2: Google Auto Sign-out on Logout */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/70 dark:border-[#334155]">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    خروج خودکار و لغو نشست گوگل هنگام خروج از سامانه
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  هنگامی که کاربر بر روی «خروج از حساب» کلیک می‌کند، نشست و توکن ورود گوگل نیز باطل می‌شود تا امنیت سیستم در سیستم‌های اشتراکی تضمین شود.
                </p>
              </div>

              <ToggleSwitch
                checked={accessControl.googleAutoSignOut}
                onChange={() =>
                  handleToggle("googleAutoSignOut", "خروج همزمان از حساب گوگل")
                }
                label="خروج خودکار و لغو نشست گوگل"
              />
            </div>

            {/* Allowed Google Domains Restriction */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/70 dark:border-[#334155] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    محدودسازی دامنه‌های ایمیل مجاز گوگل
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {accessControl.allowedGoogleDomains.includes("*")
                    ? "آزاد (همه دامنه‌ها)"
                    : `${accessControl.allowedGoogleDomains.length} دامنه محدودشده`}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {accessControl.allowedGoogleDomains.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    <span>{d === "*" ? "همه دامنه‌ها (*)" : `@${d}`}</span>
                    {d !== "*" && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(d)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer text-xs leading-none"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>

              <form onSubmit={handleAddDomain} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newDomainInput}
                  onChange={(e) => setNewDomainInput(e.target.value)}
                  placeholder="مثال: company.ir"
                  dir="ltr"
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white btn-brand transition-colors cursor-pointer"
                >
                  افزودن دامنه
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Card 2: Standard Auth & Registration Policies */}
        <div className="dark-surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)]" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  روش‌های احراز هویت و عضویت
                </h3>
                <span className="text-[11px] text-slate-400">
                  کنترل ثبت‌نام آزاد و ورود با کلمه عبور
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Toggle 3: Email & Password Authentication */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/70 dark:border-[#334155]">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    ورود با ایمیل و گذرواژه سازمانی
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  امکان ورود از طریق ایمیل پرسنلی و رمز عبور. در صورت غیرفعال بودن، تنها ورود از طریق SSO گوگل مجاز خواهد بود.
                </p>
              </div>

              <ToggleSwitch
                checked={accessControl.emailPasswordAuthEnabled}
                onChange={() =>
                  handleToggle("emailPasswordAuthEnabled", "ورود با کلمه عبور")
                }
                label="ورود با ایمیل و گذرواژه سازمانی"
              />
            </div>

            {/* Toggle 4: Self Registration */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/70 dark:border-[#334155]">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    ثبت‌نام مستقیم و عمومی کاربران (عضویت آزاد)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  اگر غیرفعال شود، هیچ فرد جدیدی نمی‌تواند مستقیماً ثبت‌نام کند و اضافه کردن کاربر فقط توسط مدیر در پنل کاربران صورت می‌گیرد.
                </p>
              </div>

              <ToggleSwitch
                checked={accessControl.selfRegistrationEnabled}
                onChange={() =>
                  handleToggle("selfRegistrationEnabled", "ثبت‌نام مستقیم کاربران")
                }
                label="ثبت‌نام مستقیم و عمومی کاربران"
              />
            </div>

            {/* Toggle 5: Two Factor Auth Requirement */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/70 dark:border-[#334155]">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand dark:text-[var(--brand-primary-on-dark)]" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    الزام ورود دومرحله‌ای (2FA) برای مدیران
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  ارسال کد تایید یکبار مصرف برای نقش‌های با دسترسی حساس قبل از دسترسی به پنل مدیریت.
                </p>
              </div>

              <ToggleSwitch
                checked={accessControl.twoFactorAuthRequired}
                onChange={() =>
                  handleToggle("twoFactorAuthRequired", "احراز هویت دومرحله‌ای")
                }
                label="الزام ورود دومرحله‌ای برای مدیران"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Session Expiry & Security Limits */}
        <div className="dark-surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  مدیریت نشست‌ها و خروج خودکار
                </h3>
                <span className="text-[11px] text-slate-400">
                  انقضای نشست در اثر عدم فعالیت در مرورگر
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              مدت زمان انقضای جلسه کاری کاربر بدون فعالیت:
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "۱۵ دقیقه", val: 15 },
                { label: "۳۰ دقیقه", val: 30 },
                { label: "۱ ساعت", val: 60 },
                { label: "نامحدود", val: 0 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => handleTimeoutChange(opt.val)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border ${
                    accessControl.sessionTimeoutMinutes === opt.val
                      ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs"
                      : "bg-slate-50 dark:bg-[#0F172A] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#334155] hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                خروج اجباری تمامی نشست‌های فعال در سیستم‌های دیگر
              </span>
              <button
                type="button"
                onClick={handleRevokeAllSessions}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
              >
                ابطال همه نشست‌ها
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: Meeting & Booking Access Policies */}
        <div className="dark-surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  سیاست‌های رزرو و مجوزهای جلسات
                </h3>
                <span className="text-[11px] text-slate-400">
                  قوانین رزرو سالن برای کارمندان و مهمانان
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {/* Approval for After Hours */}
            <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/70 dark:border-[#334155]">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  تأییدیه مدیر برای رزروهای خارج از ساعت کاری
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  رزروهای قبل از ۰۸:۰۰ یا بعد از ۱۹:۰۰ در وضعیت «در انتظار تأیید» قرار می‌گیرند.
                </p>
              </div>

              <ToggleSwitch
                size="sm"
                checked={accessControl.requireApprovalAfterHours}
                onChange={() =>
                  handleToggle("requireApprovalAfterHours", "تأییدیه ساعات غیراداری")
                }
                label="تأییدیه ساعات غیراداری"
              />
            </div>

            {/* Guest Booking Access */}
            <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/70 dark:border-[#334155]">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  اجازه ثبت رزرو توسط افراد مهمان (بدون نقش سازمانی)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  امکان رزرو اتاق برای کاربران با نقش مهمان
                </p>
              </div>

              <ToggleSwitch
                size="sm"
                checked={accessControl.guestBookingEnabled}
                onChange={() =>
                  handleToggle("guestBookingEnabled", "رزرو توسط مهمانان")
                }
                label="رزرو توسط افراد مهمان"
              />
            </div>

            {/* Employee Analytics Visibility */}
            <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/70 dark:border-[#334155]">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  دسترسی پرسنل عادی به تب گزارش‌ها و آمار سازمان
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  مشاهده نرخ اشغال اتاق‌ها و آمار بهره‌وری سالن‌ها برای کارمندان
                </p>
              </div>

              <ToggleSwitch
                size="sm"
                checked={accessControl.employeeAnalyticsEnabled}
                onChange={() =>
                  handleToggle("employeeAnalyticsEnabled", "مشاهده آمار توسط پرسنل")
                }
                label="دسترسی پرسنل عادی به گزارش‌ها"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log / Recent Access Table */}
      <div className="dark-surface-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Laptop className="w-5 h-5 text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] shrink-0" />
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                لاگ زنده وقایع احراز هویت و دسترسی‌ها (Audit Trail)
              </h3>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                تاریخچه فعالیت‌های ورود با Google، خروج و ورود با ایمیل
              </span>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 font-mono self-start sm:self-auto bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {auditLogs.length} رویداد ثبت‌شده
          </span>
        </div>

        {/* Mobile View: Dedicated Adaptive Cards */}
        <div className="md:hidden space-y-2.5">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs"
            >
              {/* Header: User & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {log.userName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate" dir="ltr">
                    {log.userEmail}
                  </div>
                </div>

                <div className="shrink-0">
                  {log.action === "login" ? (
                    <span className="text-brand dark:text-[var(--brand-primary-on-dark)] font-bold flex items-center gap-1 text-[11px] bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] px-2.5 py-0.5 rounded-full border border-brand-soft/50">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ورود موفق</span>
                    </span>
                  ) : log.action === "logout" ? (
                    <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                      <LogOut className="w-3.5 h-3.5" />
                      <span>خروج از حساب</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 text-[11px] bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200/50">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>مسدود شد</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Method & Device Details */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 text-[11px]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {log.method === "google" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50">
                      حساب گوگل
                    </span>
                  ) : log.method === "password" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50">
                      ایمیل و کلمه عبور
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      سیستمی
                    </span>
                  )}

                  <span className="text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                    {log.device}
                  </span>
                </div>

                <span className="text-slate-400 text-[10px] font-mono" dir="ltr">
                  {log.timestamp}
                </span>
              </div>

              {/* IP & Details Footer */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span className="font-mono" dir="ltr">IP: {log.ip}</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[200px]">
                  {log.details}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Full Table with proper min-width */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[640px] text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-2 font-bold">کاربر / حساب</th>
                <th className="pb-2 font-bold">روش ورود</th>
                <th className="pb-2 font-bold">عملیات</th>
                <th className="pb-2 font-bold">دستگاه و IP</th>
                <th className="pb-2 font-bold">زمان</th>
                <th className="pb-2 font-bold">شرح رویداد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {log.userName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono" dir="ltr">
                      {log.userEmail}
                    </div>
                  </td>

                  <td className="py-2.5">
                    {log.method === "google" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50">
                        حساب گوگل
                      </span>
                    ) : log.method === "password" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50">
                        ایمیل و کلمه عبور
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        سیستمی
                      </span>
                    )}
                  </td>

                  <td className="py-2.5">
                    {log.action === "login" ? (
                      <span className="text-brand dark:text-[var(--brand-primary-on-dark)] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ورود موفق
                      </span>
                    ) : log.action === "logout" ? (
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <LogOut className="w-3.5 h-3.5" />
                        خروج از حساب
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        مسدود شد
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 text-slate-600 dark:text-slate-300">
                    <div>{log.device}</div>
                    <div className="text-[10px] text-slate-400 font-mono" dir="ltr">
                      {log.ip}
                    </div>
                  </td>

                  <td className="py-2.5 text-slate-500 dark:text-slate-400">
                    {log.timestamp}
                  </td>

                  <td className="py-2.5 text-slate-500 dark:text-slate-400 text-[11px]">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
