import React, { useState, useEffect } from 'react';
import { navigateToAppHome } from '../../utils/appNavigation';
import { ApiService } from '../../services/apiService';
import { useApp } from '../../context/AppContext';
import { RooomchiLogo } from '../common/RooomchiLogo';
import {
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileDown,
  HardDrive,
  Loader2,
  Mail,
  Settings2,
  Shield,
  UserRound,
  X,
} from 'lucide-react';

const SETUP_GUIDE_PDF_URL = '/docs/setup-field-guide.pdf';
import { ORG_COUNTRY_OPTIONS, ORG_TIMEZONE_OPTIONS } from '../../features/enterprise-admin/orgRegionOptions';
import { ToggleSwitch } from '../admin/AccessControlView';

const STEPS = [
  'خوش آمدید',
  'سازمان',
  'مدیر سیستم',
  'احراز هویت',
  'ایمیل',
  'ذخیره‌سازی',
  'بازبینی',
  'پایان',
];

const inputClass =
  'w-full text-sm px-3.5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.35)] focus:outline-hidden';

const selectFieldClass =
  'w-full text-sm py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.35)] focus:outline-hidden appearance-none cursor-pointer';

const labelClass =
  'block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5';

const SetupPasswordField: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  autoComplete?: string;
}> = ({ id, label, value, onChange, className = '', autoComplete }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`${inputClass} pl-10 ${className}`}
          dir="ltr"
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          tabIndex={-1}
          aria-label={visible ? 'پنهان کردن رمز' : 'نمایش رمز'}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

const SetupLabeledInput: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: 'ltr' | 'rtl';
  type?: string;
  placeholder?: string;
}> = ({ id, label, value, onChange, dir, type = 'text', placeholder }) => (
  <div>
    <label htmlFor={id} className={labelClass}>{label}</label>
    <input
      id={id}
      type={type}
      className={inputClass}
      dir={dir}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const authProviderCardClass =
  'rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden bg-slate-50/50 dark:bg-slate-900/20';

const SetupSwitchRow: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}> = ({ label, checked, onChange, className = '' }) => (
  <div className={`flex items-center justify-between gap-4 ${className}`}>
    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
    <ToggleSwitch checked={checked} onChange={() => onChange(!checked)} label={label} />
  </div>
);

const reviewCardClass =
  'rounded-xl border border-slate-200/90 dark:border-slate-600/80 bg-slate-50/40 dark:bg-slate-900/25 overflow-hidden';

const ReviewDetailRow: React.FC<{ label: string; value: React.ReactNode; dir?: 'ltr' | 'rtl' }> = ({
  label,
  value,
  dir = 'rtl',
}) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 py-2 border-b border-slate-200/60 dark:border-slate-600/50 last:border-0">
    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
    <span className={`text-sm font-medium text-slate-800 dark:text-slate-100 sm:text-left break-all ${dir === 'ltr' ? 'text-left' : ''}`} dir={dir}>
      {value}
    </span>
  </div>
);

const ReviewAuthBadge: React.FC<{ active: boolean; label: string }> = ({ active, label }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
      active
        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
    }`}
  >
    {active ? <Check className="w-3.5 h-3.5" aria-hidden /> : <X className="w-3.5 h-3.5 opacity-70" aria-hidden />}
    {label}
  </span>
);

export const SetupWizardView: React.FC = () => {
  const { showToast, finishSetupAndSignIn } = useApp();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [ldapConfigOpen, setLdapConfigOpen] = useState(false);
  const [googleConfigOpen, setGoogleConfigOpen] = useState(false);
  const [preflight, setPreflight] = useState<{
    ok: boolean;
    checks: { id: string; label: string; ok: boolean; detail: string }[];
  } | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(true);

  const [org, setOrg] = useState({
    name: '',
    timezone: 'Asia/Tehran',
    country: 'IR',
    logo: '🏢',
  });

  const [admin, setAdmin] = useState({
    fullName: '',
    email: '',
    username: 'admin',
    password: '',
    confirmPassword: '',
  });

  const [auth, setAuth] = useState({
    localEnabled: true,
    selfRegistrationEnabled: false,
    ldapEnabled: false,
    googleEnabled: false,
    ldap: {
      url: '',
      bindDn: '',
      bindPassword: '',
      baseDn: '',
      userFilter: '(|(sAMAccountName={username})(mail={username}))',
      emailAttribute: 'mail',
      nameAttribute: 'displayName',
      defaultRole: 'EMPLOYEE',
      useTls: false,
    },
    ldapGroupRoleMappings: [] as { ldapGroup: string; role: string }[],
    google: {
      clientId: '',
      clientSecret: '',
      redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google/callback` : '',
    },
  });

  const [smtp, setSmtp] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
  });

  const [storage, setStorage] = useState({
    type: 'local' as const,
    uploadPath: './uploads',
  });

  useEffect(() => {
    ApiService.getSetupStatus().then((s) => {
      if (s.initialized) navigateToAppHome(true);
    });
  }, []);

  useEffect(() => {
    setPreflightLoading(true);
    ApiService.getSetupPreflight()
      .then(setPreflight)
      .catch(() =>
        setPreflight({
          ok: false,
          checks: [
            {
              id: 'preflight',
              label: 'بررسی پیش‌نیازها',
              ok: false,
              detail: 'سرور در دسترس نیست یا نصب قبلاً انجام شده است.',
            },
          ],
        }),
      )
      .finally(() => setPreflightLoading(false));
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const passwordsMismatch =
    admin.confirmPassword.length > 0 && admin.password !== admin.confirmPassword;

  const tryNext = () => {
    setStepError(null);
    if (step === 1) {
      if (!org.name.trim()) {
        setStepError('لطفاً نام سازمان را وارد کنید.');
        return;
      }
    }
    if (step === 2) {
      if (!admin.fullName.trim() || !admin.email.trim() || !admin.username.trim()) {
        setStepError('لطفاً نام، ایمیل و نام کاربری مدیر را وارد کنید.');
        return;
      }
      if (admin.password.length < 8) {
        setStepError('رمز عبور باید حداقل ۸ کاراکتر باشد.');
        return;
      }
      if (!admin.confirmPassword) {
        setStepError('تأیید رمز عبور را وارد کنید.');
        return;
      }
      if (admin.password !== admin.confirmPassword) {
        setStepError('رمز عبور و تأیید آن یکسان نیست.');
        return;
      }
    }
    next();
  };

  const runTest = async (kind: 'ldap' | 'google' | 'smtp') => {
    setBusy(true);
    try {
      const result =
        kind === 'ldap'
          ? await ApiService.testSetupLdap(auth.ldap)
          : kind === 'google'
            ? await ApiService.testSetupGoogle(auth.google)
            : await ApiService.testSetupSmtp(smtp);
      showToast(result.message, result.ok ? 'success' : 'error');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در تست', 'error');
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    if (
      admin.password.length < 8 ||
      !admin.confirmPassword ||
      admin.password !== admin.confirmPassword
    ) {
      setStepError('رمز عبور مدیر نامعتبر است. به مرحله مدیر سیستم برگردید و رمز را اصلاح کنید.');
      setStep(2);
      return;
    }
    setStepError(null);
    setBusy(true);
    try {
      const result = await ApiService.completeSetup({
        organization: org,
        admin,
        auth: {
          localEnabled: auth.localEnabled,
          selfRegistrationEnabled: auth.selfRegistrationEnabled,
          ldapEnabled: auth.ldapEnabled,
          ldap: auth.ldapEnabled ? auth.ldap : undefined,
          ldapGroupRoleMappings: auth.ldapEnabled
            ? auth.ldapGroupRoleMappings.filter((m) => m.ldapGroup.trim())
            : undefined,
          googleEnabled: auth.googleEnabled,
          google: auth.googleEnabled ? auth.google : undefined,
        },
        smtp: smtp.host ? smtp : undefined,
        storage,
      });
      await finishSetupAndSignIn(result.user, result.token);
      showToast(result.message, 'success');
      setStep(7);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در نصب', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <RooomchiLogo className="h-8" />
          <p className="text-xs font-bold text-slate-500">
            مرحله {step + 1} از {STEPS.length}: {STEPS[step]}
          </p>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
          {step === 0 && (
            <div className="space-y-4 text-center sm:text-right">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                به راه‌اندازی سازمانی روم‌چی خوش آمدید
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                راه‌اندازی اولیه: سازمان، مدیر سیستم، روش‌های ورود، ایمیل و ذخیره‌سازی. پس از اتمام، ورود
                عادی فعال می‌شود.
              </p>
              <ul className="text-sm text-slate-500 space-y-1 text-right list-disc list-inside">
                <li>پیکربندی سازمان</li>
                <li>ایجاد مدیر ارشد</li>
                <li>تنظیم احراز هویت (Local / LDAP / Google)</li>
                <li>یکپارچه‌سازی SMTP و فایل</li>
              </ul>
              <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 text-right space-y-2">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">بررسی پیش‌نیاز سرور</p>
                {preflightLoading ? (
                  <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال بررسی…
                  </p>
                ) : (
                  preflight?.checks.map((c) => (
                    <div
                      key={c.id}
                      className={`text-xs rounded-lg px-3 py-2 border ${
                        c.ok
                          ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
                          : 'border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'
                      }`}
                    >
                      <span className="font-bold">{c.label}</span>
                      <span className="block mt-0.5 opacity-90">{c.detail}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center sm:justify-start gap-2">
                <a
                  href={SETUP_GUIDE_PDF_URL}
                  download="rooomchi-setup-field-guide.pdf"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-sm font-bold text-[var(--brand-primary)] hover:bg-[rgb(var(--brand-primary-rgb)/0.08)] transition-colors"
                >
                  <FileDown className="w-4 h-4 shrink-0" />
                  دانلود راهنمای PDF (توضیح فیلدها)
                </a>
                <a
                  href="/docs/setup-field-guide.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline-offset-2 hover:underline"
                >
                  مشاهده در مرورگر
                </a>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">پیکربندی سازمان</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>نام سازمان *</label>
                  <input className={inputClass} value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="setup-org-timezone">منطقه زمانی</label>
                  <div className="relative">
                    <select
                      id="setup-org-timezone"
                      className={`${selectFieldClass} ps-3.5 pe-10`}
                      dir="ltr"
                      value={org.timezone}
                      onChange={(e) => setOrg({ ...org, timezone: e.target.value })}
                    >
                      {ORG_TIMEZONE_OPTIONS.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass} htmlFor="setup-org-country">کشور</label>
                  <div className="relative">
                    <select
                      id="setup-org-country"
                      className={`${selectFieldClass} ps-3.5 pe-10`}
                      value={org.country}
                      onChange={(e) => setOrg({ ...org, country: e.target.value })}
                    >
                      {ORG_COUNTRY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">مدیر اول سیستم</h2>
              <div>
                <label className={labelClass} htmlFor="setup-admin-fullname">نام کامل *</label>
                <input
                  id="setup-admin-fullname"
                  className={inputClass}
                  value={admin.fullName}
                  onChange={(e) => setAdmin({ ...admin, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="setup-admin-email">ایمیل *</label>
                <input
                  id="setup-admin-email"
                  type="email"
                  className={inputClass}
                  dir="ltr"
                  value={admin.email}
                  onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="setup-admin-username">نام کاربری *</label>
                <input
                  id="setup-admin-username"
                  className={inputClass}
                  dir="ltr"
                  value={admin.username}
                  onChange={(e) => setAdmin({ ...admin, username: e.target.value })}
                />
              </div>
              <SetupPasswordField
                id="setup-admin-password"
                label="رمز عبور (حداقل ۸ کاراکتر) *"
                value={admin.password}
                autoComplete="new-password"
                onChange={(password) => {
                  setStepError(null);
                  setAdmin({ ...admin, password });
                }}
              />
              <SetupPasswordField
                id="setup-admin-confirm-password"
                label="تأیید رمز عبور *"
                value={admin.confirmPassword}
                autoComplete="new-password"
                className={passwordsMismatch ? 'border-rose-500 focus:ring-rose-300' : ''}
                onChange={(confirmPassword) => {
                  setStepError(null);
                  setAdmin({ ...admin, confirmPassword });
                }}
              />
              {passwordsMismatch && (
                <p className="text-xs font-semibold text-rose-600">رمز عبور و تأیید آن یکسان نیست.</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">احراز هویت</h2>
              <div className="rounded-xl border border-slate-200 dark:border-slate-600 divide-y divide-slate-200/80 dark:divide-slate-600/80 px-4">
                <SetupSwitchRow
                  className="py-3"
                  label="ورود محلی (ایمیل / رمز)"
                  checked={auth.localEnabled}
                  onChange={(localEnabled) => setAuth({ ...auth, localEnabled })}
                />
                <SetupSwitchRow
                  className="py-3"
                  label="ثبت‌نام خودکار پرسنل"
                  checked={auth.selfRegistrationEnabled}
                  onChange={(selfRegistrationEnabled) =>
                    setAuth({ ...auth, selfRegistrationEnabled })
                  }
                />
              </div>

              <div className={authProviderCardClass}>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200/80 dark:border-slate-600/80">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">LDAP / Active Directory</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {auth.ldapEnabled ? 'فعال برای ورود کاربران' : 'غیرفعال — می‌توانید بعداً فعال کنید'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLdapConfigOpen((open) => !open)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                    aria-expanded={ldapConfigOpen}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    پیکربندی
                  </button>
                </div>
                {ldapConfigOpen && (
                  <div className="px-4 py-4 space-y-3 border-t border-slate-200/60 dark:border-slate-600/60 bg-white dark:bg-slate-900/30">
                    <SetupSwitchRow
                      className="pb-1"
                      label="فعال‌سازی ورود با LDAP"
                      checked={auth.ldapEnabled}
                      onChange={(ldapEnabled) => setAuth({ ...auth, ldapEnabled })}
                    />
                    <SetupLabeledInput
                      id="setup-ldap-url"
                      label="آدرس سرور LDAP (URL)"
                      dir="ltr"
                      placeholder="ldap://..."
                      value={auth.ldap.url}
                      onChange={(url) => setAuth({ ...auth, ldap: { ...auth.ldap, url } })}
                    />
                    <SetupLabeledInput
                      id="setup-ldap-bind-dn"
                      label="Bind DN"
                      dir="ltr"
                      value={auth.ldap.bindDn}
                      onChange={(bindDn) => setAuth({ ...auth, ldap: { ...auth.ldap, bindDn } })}
                    />
                    <SetupPasswordField
                      id="setup-ldap-bind-password"
                      label="رمز Bind"
                      value={auth.ldap.bindPassword}
                      autoComplete="off"
                      onChange={(bindPassword) =>
                        setAuth({ ...auth, ldap: { ...auth.ldap, bindPassword } })
                      }
                    />
                    <SetupLabeledInput
                      id="setup-ldap-base-dn"
                      label="Base DN"
                      dir="ltr"
                      value={auth.ldap.baseDn}
                      onChange={(baseDn) => setAuth({ ...auth, ldap: { ...auth.ldap, baseDn } })}
                    />
                    <SetupLabeledInput
                      id="setup-ldap-user-filter"
                      label="فیلتر کاربر (User filter)"
                      dir="ltr"
                      value={auth.ldap.userFilter}
                      onChange={(userFilter) =>
                        setAuth({ ...auth, ldap: { ...auth.ldap, userFilter } })
                      }
                    />
                    <SetupSwitchRow
                      label="استفاده از TLS / LDAPS"
                      checked={auth.ldap.useTls}
                      onChange={(useTls) => setAuth({ ...auth, ldap: { ...auth.ldap, useTls } })}
                    />
                    <SetupLabeledInput
                      id="setup-ldap-default-role"
                      label="نقش پیش‌فرض کاربران LDAP"
                      dir="ltr"
                      value={auth.ldap.defaultRole}
                      onChange={(defaultRole) =>
                        setAuth({ ...auth, ldap: { ...auth.ldap, defaultRole } })
                      }
                    />
                    <p className="text-xs text-slate-500">
                      نگاشت گروه (اختیاری): نام گروه AD و نقش — مثلاً Roomchi Admins → ORGANIZATION_ADMIN
                    </p>
                    {auth.ldapGroupRoleMappings.map((row, index) => (
                      <div key={`setup-ldap-gr-${index}`} className="flex flex-wrap gap-2 items-end">
                        <SetupLabeledInput
                          id={`setup-ldap-group-${index}`}
                          label="گروه LDAP"
                          dir="ltr"
                          value={row.ldapGroup}
                          onChange={(ldapGroup) => {
                            const next = [...auth.ldapGroupRoleMappings];
                            next[index] = { ...row, ldapGroup };
                            setAuth({ ...auth, ldapGroupRoleMappings: next });
                          }}
                        />
                        <SetupLabeledInput
                          id={`setup-ldap-role-${index}`}
                          label="نقش"
                          dir="ltr"
                          value={row.role}
                          onChange={(role) => {
                            const next = [...auth.ldapGroupRoleMappings];
                            next[index] = { ...row, role };
                            setAuth({ ...auth, ldapGroupRoleMappings: next });
                          }}
                        />
                        <button
                          type="button"
                          className="text-xs font-bold text-red-600 px-2 py-2 cursor-pointer"
                          onClick={() =>
                            setAuth({
                              ...auth,
                              ldapGroupRoleMappings: auth.ldapGroupRoleMappings.filter(
                                (_, i) => i !== index,
                              ),
                            })
                          }
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="text-xs font-bold text-[var(--brand-primary)] cursor-pointer"
                      onClick={() =>
                        setAuth({
                          ...auth,
                          ldapGroupRoleMappings: [
                            ...auth.ldapGroupRoleMappings,
                            { ldapGroup: '', role: 'EMPLOYEE' },
                          ],
                        })
                      }
                    >
                      + افزودن نگاشت گروه
                    </button>
                    <button
                      type="button"
                      onClick={() => runTest('ldap')}
                      disabled={busy}
                      className="text-xs font-bold text-[var(--brand-primary)] cursor-pointer disabled:opacity-50"
                    >
                      تست اتصال LDAP
                    </button>
                  </div>
                )}
              </div>

              <div className={authProviderCardClass}>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200/80 dark:border-slate-600/80">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Google OAuth</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {auth.googleEnabled ? 'فعال برای ورود با گوگل' : 'غیرفعال — می‌توانید بعداً فعال کنید'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGoogleConfigOpen((open) => !open)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                    aria-expanded={googleConfigOpen}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    پیکربندی
                  </button>
                </div>
                {googleConfigOpen && (
                  <div className="px-4 py-4 space-y-3 border-t border-slate-200/60 dark:border-slate-600/60 bg-white dark:bg-slate-900/30">
                    <SetupSwitchRow
                      className="pb-1"
                      label="فعال‌سازی ورود با Google"
                      checked={auth.googleEnabled}
                      onChange={(googleEnabled) => setAuth({ ...auth, googleEnabled })}
                    />
                    <SetupLabeledInput
                      id="setup-google-client-id"
                      label="Client ID"
                      dir="ltr"
                      value={auth.google.clientId}
                      onChange={(clientId) =>
                        setAuth({ ...auth, google: { ...auth.google, clientId } })
                      }
                    />
                    <SetupPasswordField
                      id="setup-google-client-secret"
                      label="Client Secret"
                      value={auth.google.clientSecret}
                      autoComplete="off"
                      onChange={(clientSecret) =>
                        setAuth({ ...auth, google: { ...auth.google, clientSecret } })
                      }
                    />
                    <SetupLabeledInput
                      id="setup-google-redirect"
                      label="آدرس بازگشت (Redirect URL)"
                      dir="ltr"
                      value={auth.google.redirectUri}
                      onChange={(redirectUri) =>
                        setAuth({ ...auth, google: { ...auth.google, redirectUri } })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => runTest('google')}
                      disabled={busy}
                      className="text-xs font-bold text-[var(--brand-primary)] cursor-pointer disabled:opacity-50"
                    >
                      تست اتصال Google
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">SMTP (اختیاری)</h2>
              <p className="text-xs text-slate-500">برای ارسال ایمیل اعلان‌ها؛ در صورت نیاز می‌توانید این مرحله را خالی بگذارید.</p>
              <SetupLabeledInput
                id="setup-smtp-host"
                label="میزبان (Host)"
                dir="ltr"
                placeholder="smtp.example.com"
                value={smtp.host}
                onChange={(host) => setSmtp({ ...smtp, host })}
              />
              <SetupLabeledInput
                id="setup-smtp-port"
                label="پورت"
                type="number"
                dir="ltr"
                value={String(smtp.port)}
                onChange={(v) => setSmtp({ ...smtp, port: Number(v) || 0 })}
              />
              <SetupLabeledInput
                id="setup-smtp-username"
                label="نام کاربری"
                dir="ltr"
                value={smtp.username}
                onChange={(username) => setSmtp({ ...smtp, username })}
              />
              <SetupPasswordField
                id="setup-smtp-password"
                label="رمز عبور"
                value={smtp.password}
                autoComplete="off"
                onChange={(password) => setSmtp({ ...smtp, password })}
              />
              <SetupLabeledInput
                id="setup-smtp-from-email"
                label="ایمیل فرستنده (From Email)"
                type="email"
                dir="ltr"
                value={smtp.fromEmail}
                onChange={(fromEmail) => setSmtp({ ...smtp, fromEmail })}
              />
              <SetupLabeledInput
                id="setup-smtp-from-name"
                label="نام فرستنده (From Name)"
                value={smtp.fromName}
                onChange={(fromName) => setSmtp({ ...smtp, fromName })}
              />
              <button
                type="button"
                onClick={() => runTest('smtp')}
                disabled={busy || !smtp.host}
                className="text-xs font-bold text-[var(--brand-primary)] cursor-pointer disabled:opacity-50"
              >
                تست ارسال ایمیل (بررسی اتصال)
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold">ذخیره‌سازی فایل</h2>
              <p className="text-sm text-slate-500">فعلاً Local Storage؛ معماری آماده S3 / MinIO / Azure است.</p>
              <SetupLabeledInput
                id="setup-storage-path"
                label="مسیر ذخیره‌سازی محلی"
                dir="ltr"
                value={storage.uploadPath}
                onChange={(uploadPath) => setStorage({ ...storage, uploadPath })}
              />
            </div>
          )}

          {step === 6 && (() => {
            const countryLabel =
              ORG_COUNTRY_OPTIONS.find((c) => c.value === org.country)?.label ?? org.country;
            const timezoneLabel =
              ORG_TIMEZONE_OPTIONS.find((t) => t.value === org.timezone)?.label ?? org.timezone;
            const smtpConfigured = Boolean(smtp.host?.trim());
            return (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">بازبینی تنظیمات</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    قبل از اتمام راه‌اندازی، خلاصهٔ پیکربندی را بررسی کنید. در صورت نیاز با دکمهٔ «قبلی» به مراحل قبل برگردید.
                  </p>
                </div>

                <div className="space-y-4">
                  <section className={reviewCardClass}>
                    <header className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/80 dark:border-slate-600/60 bg-white/60 dark:bg-slate-900/40">
                      <Building2 className="w-4 h-4 text-[var(--brand-primary)] shrink-0" aria-hidden />
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">سازمان</h3>
                    </header>
                    <div className="px-4 py-1">
                      <ReviewDetailRow label="نام سازمان" value={org.name || '—'} />
                      <ReviewDetailRow label="کشور" value={countryLabel} />
                      <ReviewDetailRow label="منطقه زمانی" value={timezoneLabel} dir="ltr" />
                    </div>
                  </section>

                  <section className={reviewCardClass}>
                    <header className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/80 dark:border-slate-600/60 bg-white/60 dark:bg-slate-900/40">
                      <UserRound className="w-4 h-4 text-[var(--brand-primary)] shrink-0" aria-hidden />
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">مدیر سیستم</h3>
                    </header>
                    <div className="px-4 py-1">
                      <ReviewDetailRow label="نام کامل" value={admin.fullName || '—'} />
                      <ReviewDetailRow label="ایمیل" value={admin.email || '—'} dir="ltr" />
                      <ReviewDetailRow label="نام کاربری" value={admin.username || '—'} dir="ltr" />
                    </div>
                  </section>

                  <section className={reviewCardClass}>
                    <header className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/80 dark:border-slate-600/60 bg-white/60 dark:bg-slate-900/40">
                      <Shield className="w-4 h-4 text-[var(--brand-primary)] shrink-0" aria-hidden />
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">احراز هویت</h3>
                    </header>
                    <div className="px-4 py-3 flex flex-wrap gap-2">
                      <ReviewAuthBadge active={auth.localEnabled} label="ورود محلی" />
                      <ReviewAuthBadge active={auth.selfRegistrationEnabled} label="ثبت‌نام خودکار" />
                      <ReviewAuthBadge active={auth.ldapEnabled} label="LDAP" />
                      <ReviewAuthBadge active={auth.googleEnabled} label="Google" />
                    </div>
                  </section>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <section className={reviewCardClass}>
                      <header className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/80 dark:border-slate-600/60 bg-white/60 dark:bg-slate-900/40">
                        <Mail className="w-4 h-4 text-[var(--brand-primary)] shrink-0" aria-hidden />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">ایمیل (SMTP)</h3>
                      </header>
                      <div className="px-4 py-3 space-y-2">
                        <ReviewAuthBadge active={smtpConfigured} label={smtpConfigured ? 'پیکربندی شده' : 'رد شده'} />
                        {smtpConfigured && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 dir-ltr text-left break-all">
                            {smtp.host}:{smtp.port}
                          </p>
                        )}
                      </div>
                    </section>

                    <section className={reviewCardClass}>
                      <header className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/80 dark:border-slate-600/60 bg-white/60 dark:bg-slate-900/40">
                        <HardDrive className="w-4 h-4 text-[var(--brand-primary)] shrink-0" aria-hidden />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">ذخیره‌سازی</h3>
                      </header>
                      <div className="px-4 py-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">ذخیره‌سازی محلی</p>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 dir-ltr text-left break-all">
                          {storage.uploadPath}
                        </p>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            );
          })()}

          {step === 7 && (
            <div className="text-center space-y-3 py-6">
              <Check className="w-12 h-12 text-emerald-500 mx-auto" />
              <h2 className="text-lg font-bold">نصب کامل شد</h2>
              <p className="text-sm text-slate-500">در حال ورود به داشبورد…</p>
            </div>
          )}

          {stepError && (
            <p className="mt-4 text-sm font-semibold text-rose-600 text-center sm:text-right" role="alert">
              {stepError}
            </p>
          )}

          {step < 7 && (
            <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
              <button type="button" onClick={back} disabled={step === 0 || busy} className="px-4 py-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-600 disabled:opacity-40 cursor-pointer flex items-center gap-1">
                <ChevronRight className="w-4 h-4" />
                قبلی
              </button>
              {step === 0 && (
                <button type="button" onClick={tryNext} className="px-5 py-2 text-sm font-bold rounded-xl btn-brand text-white cursor-pointer flex items-center gap-1">
                  شروع راه‌اندازی
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {step > 0 && step < 6 && (
                <button type="button" onClick={tryNext} className="px-5 py-2 text-sm font-bold rounded-xl btn-brand text-white cursor-pointer flex items-center gap-1">
                  بعدی
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {step === 6 && (
                <button
                  type="button"
                  onClick={complete}
                  disabled={busy}
                  className="px-5 py-2 text-sm font-bold rounded-xl btn-brand text-white cursor-pointer flex items-center gap-2 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {busy ? 'در حال تکمیل نصب…' : 'تکمیل نصب'}
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
