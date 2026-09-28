import React, { useState, useEffect } from 'react';
import { navigateToAppHome } from '../../utils/appNavigation';
import { ApiService } from '../../services/apiService';
import { useApp } from '../../context/AppContext';
import { RooomchiLogo } from '../common/RooomchiLogo';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const STEPS = [
  'خوش‌آمدگید',
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

export const SetupWizardView: React.FC = () => {
  const { showToast, finishSetupAndSignIn } = useApp();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [org, setOrg] = useState({
    name: '',
    code: '',
    contactEmail: '',
    domain: '',
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
      useTls: true,
    },
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

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

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
                Welcome to Rooomchi Enterprise Setup
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
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">پیکربندی سازمان</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600">نام سازمان *</label>
                  <input className={inputClass} value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">کد سازمان *</label>
                  <input className={inputClass} value={org.code} onChange={(e) => setOrg({ ...org, code: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">دامنه شرکت *</label>
                  <input className={inputClass} placeholder="company.com" dir="ltr" value={org.domain} onChange={(e) => setOrg({ ...org, domain: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">ایمیل شرکت *</label>
                  <input type="email" className={inputClass} dir="ltr" value={org.contactEmail} onChange={(e) => setOrg({ ...org, contactEmail: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">منطقه زمانی</label>
                  <input className={inputClass} dir="ltr" value={org.timezone} onChange={(e) => setOrg({ ...org, timezone: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">کشور</label>
                  <input className={inputClass} value={org.country} onChange={(e) => setOrg({ ...org, country: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">مدیر اول سیستم</h2>
              <input className={inputClass} placeholder="نام کامل *" value={admin.fullName} onChange={(e) => setAdmin({ ...admin, fullName: e.target.value })} />
              <input type="email" className={inputClass} placeholder="ایمیل *" dir="ltr" value={admin.email} onChange={(e) => setAdmin({ ...admin, email: e.target.value })} />
              <input className={inputClass} placeholder="نام کاربری *" value={admin.username} onChange={(e) => setAdmin({ ...admin, username: e.target.value })} />
              <input type="password" className={inputClass} placeholder="رمز عبور (حداقل ۸ کاراکتر) *" value={admin.password} onChange={(e) => setAdmin({ ...admin, password: e.target.value })} />
              <input type="password" className={inputClass} placeholder="تأیید رمز عبور *" value={admin.confirmPassword} onChange={(e) => setAdmin({ ...admin, confirmPassword: e.target.value })} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">احراز هویت</h2>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={auth.localEnabled} onChange={(e) => setAuth({ ...auth, localEnabled: e.target.checked })} />
                ورود محلی (ایمیل / رمز)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={auth.selfRegistrationEnabled} onChange={(e) => setAuth({ ...auth, selfRegistrationEnabled: e.target.checked })} />
                ثبت‌نام خودکار پرسنل
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold mt-2">
                <input type="checkbox" checked={auth.ldapEnabled} onChange={(e) => setAuth({ ...auth, ldapEnabled: e.target.checked })} />
                LDAP / Active Directory
              </label>
              {auth.ldapEnabled && (
                <div className="space-y-2 pl-2 border-r-2 border-slate-200 dark:border-slate-600">
                  <input className={inputClass} placeholder="LDAP URL" dir="ltr" value={auth.ldap.url} onChange={(e) => setAuth({ ...auth, ldap: { ...auth.ldap, url: e.target.value } })} />
                  <input className={inputClass} placeholder="Bind DN" dir="ltr" value={auth.ldap.bindDn} onChange={(e) => setAuth({ ...auth, ldap: { ...auth.ldap, bindDn: e.target.value } })} />
                  <input type="password" className={inputClass} placeholder="Bind Password" value={auth.ldap.bindPassword} onChange={(e) => setAuth({ ...auth, ldap: { ...auth.ldap, bindPassword: e.target.value } })} />
                  <input className={inputClass} placeholder="Base DN" dir="ltr" value={auth.ldap.baseDn} onChange={(e) => setAuth({ ...auth, ldap: { ...auth.ldap, baseDn: e.target.value } })} />
                  <input className={inputClass} placeholder="User filter" dir="ltr" value={auth.ldap.userFilter} onChange={(e) => setAuth({ ...auth, ldap: { ...auth.ldap, userFilter: e.target.value } })} />
                  <button type="button" onClick={() => runTest('ldap')} disabled={busy} className="text-xs font-bold text-[var(--brand-primary)] cursor-pointer">
                    Test LDAP Connection
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={auth.googleEnabled} onChange={(e) => setAuth({ ...auth, googleEnabled: e.target.checked })} />
                Google OAuth
              </label>
              {auth.googleEnabled && (
                <div className="space-y-2 pl-2 border-r-2 border-slate-200">
                  <input className={inputClass} placeholder="Client ID" dir="ltr" value={auth.google.clientId} onChange={(e) => setAuth({ ...auth, google: { ...auth.google, clientId: e.target.value } })} />
                  <input type="password" className={inputClass} placeholder="Client Secret" value={auth.google.clientSecret} onChange={(e) => setAuth({ ...auth, google: { ...auth.google, clientSecret: e.target.value } })} />
                  <input className={inputClass} placeholder="Redirect URL" dir="ltr" value={auth.google.redirectUri} onChange={(e) => setAuth({ ...auth, google: { ...auth.google, redirectUri: e.target.value } })} />
                  <button type="button" onClick={() => runTest('google')} disabled={busy} className="text-xs font-bold text-[var(--brand-primary)] cursor-pointer">
                    Test Google Connection
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold">SMTP (اختیاری)</h2>
              <input className={inputClass} placeholder="Host" dir="ltr" value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} />
              <input type="number" className={inputClass} placeholder="Port" value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })} />
              <input className={inputClass} placeholder="Username" dir="ltr" value={smtp.username} onChange={(e) => setSmtp({ ...smtp, username: e.target.value })} />
              <input type="password" className={inputClass} placeholder="Password" value={smtp.password} onChange={(e) => setSmtp({ ...smtp, password: e.target.value })} />
              <input type="email" className={inputClass} placeholder="From Email" dir="ltr" value={smtp.fromEmail} onChange={(e) => setSmtp({ ...smtp, fromEmail: e.target.value })} />
              <input className={inputClass} placeholder="From Name" value={smtp.fromName} onChange={(e) => setSmtp({ ...smtp, fromName: e.target.value })} />
              <button type="button" onClick={() => runTest('smtp')} disabled={busy || !smtp.host} className="text-xs font-bold text-[var(--brand-primary)] cursor-pointer">
                Send Test Email (connection check)
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold">ذخیره‌سازی فایل</h2>
              <p className="text-sm text-slate-500">فعلاً Local Storage؛ معماری آماده S3 / MinIO / Azure است.</p>
              <input className={inputClass} value={storage.uploadPath} dir="ltr" onChange={(e) => setStorage({ ...storage, uploadPath: e.target.value })} />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3 text-sm">
              <h2 className="text-lg font-bold">بازبینی</h2>
              <p><strong>سازمان:</strong> {org.name} ({org.code})</p>
              <p><strong>مدیر:</strong> {admin.email}</p>
              <p>
                <strong>احراز هویت:</strong>{' '}
                {auth.localEnabled ? '✓ Local' : '✗ Local'}{' '}
                {auth.ldapEnabled ? '✓ LDAP' : '✗ LDAP'}{' '}
                {auth.googleEnabled ? '✓ Google' : '✗ Google'}
              </p>
              <p><strong>ایمیل:</strong> {smtp.host ? 'Configured' : 'Skipped'}</p>
              <p><strong>Storage:</strong> Local — {storage.uploadPath}</p>
            </div>
          )}

          {step === 7 && (
            <div className="text-center space-y-3 py-6">
              <Check className="w-12 h-12 text-emerald-500 mx-auto" />
              <h2 className="text-lg font-bold">نصب کامل شد</h2>
              <p className="text-sm text-slate-500">در حال ورود به داشبورد…</p>
            </div>
          )}

          {step < 7 && (
            <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
              <button type="button" onClick={back} disabled={step === 0 || busy} className="px-4 py-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-600 disabled:opacity-40 cursor-pointer flex items-center gap-1">
                <ChevronRight className="w-4 h-4" />
                قبلی
              </button>
              {step === 0 && (
                <button type="button" onClick={next} className="px-5 py-2 text-sm font-bold rounded-xl btn-brand text-white cursor-pointer flex items-center gap-1">
                  Start Setup
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {step > 0 && step < 6 && (
                <button type="button" onClick={next} className="px-5 py-2 text-sm font-bold rounded-xl btn-brand text-white cursor-pointer flex items-center gap-1">
                  بعدی
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {step === 6 && (
                <button type="button" onClick={complete} disabled={busy} className="px-5 py-2 text-sm font-bold rounded-xl btn-brand text-white cursor-pointer flex items-center gap-2">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Complete Installation
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
