import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { OrgLogoBadge } from '../../components/common/OrgLogoBadge';
import { Save, Loader2 } from 'lucide-react';
import { ToggleSwitch } from '../../components/admin/AccessControlView';
import type { AdminSettingsSection } from './adminSettingsTabs';

const inputClass =
  'w-full text-sm px-3.5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.35)] focus:outline-hidden';

export const EnterpriseAdminSettingsView: React.FC<{
  section: AdminSettingsSection;
}> = ({ section }) => {
  const { showToast, updateCurrentOrgData, currentOrg } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [orgForm, setOrgForm] = useState<Record<string, unknown>>({});
  const [authForm, setAuthForm] = useState<Record<string, unknown>>({});
  const [integrations, setIntegrations] = useState<Record<string, unknown>>({});
  const [systemForm, setSystemForm] = useState<Record<string, unknown>>({});
  const [auditLogs, setAuditLogs] = useState<
    { id: string; eventType: string; summary: string; userName: string; createdAt: string }[]
  >([]);
  const [ldapTestUser, setLdapTestUser] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [org, auth, integ, sys, audit] = await Promise.all([
        ApiService.getAdminOrganization(),
        ApiService.getAdminAuthSettings(),
        ApiService.getAdminIntegrations(),
        ApiService.getAdminSystemSettings(),
        ApiService.getAdminConfigAudit(),
      ]);
      setOrgForm(org);
      setAuthForm(auth);
      setIntegrations(integ);
      setSystemForm(sys);
      setAuditLogs(audit);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در بارگذاری', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const saveOrganization = async () => {
    setSaving(true);
    try {
      const updated = await ApiService.putAdminOrganization(orgForm);
      setOrgForm(updated);
      if (currentOrg) {
        updateCurrentOrgData({
          name: updated.name,
          logo: updated.logo,
          primaryColor: updated.primaryColor,
          contactEmail: updated.contactEmail,
          code: updated.code,
          settings: updated.bookingSettings,
          workHours: updated.workHours,
        } as Partial<import('../../types').Organization>);
      }
      showToast('تنظیمات سازمان ذخیره شد', 'success');
      const audit = await ApiService.getAdminConfigAudit();
      setAuditLogs(audit);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveAuth = async () => {
    setSaving(true);
    try {
      await ApiService.putAdminAuthSettings(authForm);
      showToast('تنظیمات احراز هویت ذخیره شد', 'success');
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveIntegrations = async () => {
    setSaving(true);
    try {
      await ApiService.putAdminIntegrations(integrations);
      showToast('یکپارچه‌سازی‌ها ذخیره شد', 'success');
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveSystem = async () => {
    setSaving(true);
    try {
      await ApiService.putAdminSystemSettings(systemForm);
      showToast('تنظیمات سامانه ذخیره شد', 'success');
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const ldap = (authForm.ldapConfiguration || {}) as Record<string, string>;
  const google = (authForm.googleConfiguration || {}) as Record<string, string>;
  const policies = (authForm.authPolicies || {}) as Record<string, boolean>;
  const pwdPolicy = (authForm.passwordPolicy || {}) as Record<string, boolean | number>;
  const smtp = (integrations.smtp || {}) as Record<string, unknown>;
  const storage = (integrations.storage || {}) as Record<string, unknown>;

  return (
    <div className="max-w-4xl mx-auto pb-10 min-w-0" id="enterprise-admin-settings">
      <div className="min-w-0 bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-xs space-y-5">
        {section === 'organization' && (
          <>
            <header>
              <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">تنظیمات سازمان</h1>
              <p className="text-sm text-slate-500 mt-1">نام، برند، دامنه و تقویم سازمان</p>
            </header>
            <div className="flex items-center gap-3">
              <OrgLogoBadge logo={String(orgForm.logo || '🏢')} name={String(orgForm.name)} size="lg" />
              <input className={inputClass} value={String(orgForm.logo || '')} onChange={(e) => setOrgForm({ ...orgForm, logo: e.target.value })} placeholder="لوگو (emoji یا URL)" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input className={inputClass} placeholder="نام سازمان" value={String(orgForm.name || '')} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
              <input className={inputClass} placeholder="کد سازمان" value={String(orgForm.code || '')} onChange={(e) => setOrgForm({ ...orgForm, code: e.target.value })} />
              <input className={inputClass} placeholder="ایمیل شرکت" dir="ltr" value={String(orgForm.contactEmail || '')} onChange={(e) => setOrgForm({ ...orgForm, contactEmail: e.target.value })} />
              <input className={inputClass} placeholder="دامنه" dir="ltr" value={String(orgForm.domain || '')} onChange={(e) => setOrgForm({ ...orgForm, domain: e.target.value })} />
              <input className={inputClass} placeholder="کشور" value={String(orgForm.country || '')} onChange={(e) => setOrgForm({ ...orgForm, country: e.target.value })} />
              <input className={inputClass} placeholder="Timezone" dir="ltr" value={String(orgForm.timezone || '')} onChange={(e) => setOrgForm({ ...orgForm, timezone: e.target.value })} />
              <select className={inputClass} value={String(orgForm.language || 'fa')} onChange={(e) => setOrgForm({ ...orgForm, language: e.target.value })}>
                <option value="fa">فارسی</option>
                <option value="en">English</option>
              </select>
              <select className={inputClass} value={String(orgForm.dateFormat || 'jalali')} onChange={(e) => setOrgForm({ ...orgForm, dateFormat: e.target.value })}>
                <option value="jalali">تقویم شمسی</option>
                <option value="gregorian">میلادی</option>
              </select>
            </div>
            <button type="button" onClick={saveOrganization} disabled={saving} className="btn-brand text-white px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50">
              <Save className="w-4 h-4" />
              ذخیره
            </button>
          </>
        )}

        {section === 'authentication' && (
          <>
            <header>
              <h1 className="text-lg font-extrabold">احراز هویت</h1>
              <p className="text-sm text-slate-500 mt-1">Local، LDAP و Google OAuth</p>
            </header>
            <div className="space-y-3">
              <label className="flex items-center justify-between text-sm">
                <span>ورود محلی (رمز عبور)</span>
                <ToggleSwitch checked={authForm.localEnabled !== false} onChange={() => setAuthForm({ ...authForm, localEnabled: !authForm.localEnabled })} />
              </label>
              <label className="flex items-center justify-between text-sm">
                <span>ثبت‌نام خودکار</span>
                <ToggleSwitch checked={policies.selfRegistrationEnabled === true} onChange={() => setAuthForm({ ...authForm, authPolicies: { ...policies, selfRegistrationEnabled: !policies.selfRegistrationEnabled } })} />
              </label>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-2">
              <p className="text-xs font-bold text-slate-600">سیاست رمز عبور</p>
              <input type="number" className={inputClass} placeholder="حداقل طول" value={Number(pwdPolicy.passwordMinLength || 8)} onChange={(e) => setAuthForm({ ...authForm, passwordPolicy: { ...pwdPolicy, passwordMinLength: Number(e.target.value) } })} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pwdPolicy.passwordRequireNumber === true} onChange={(e) => setAuthForm({ ...authForm, passwordPolicy: { ...pwdPolicy, passwordRequireNumber: e.target.checked } })} /> عدد الزامی</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pwdPolicy.passwordRequireUppercase === true} onChange={(e) => setAuthForm({ ...authForm, passwordPolicy: { ...pwdPolicy, passwordRequireUppercase: e.target.checked } })} /> حروف بزرگ</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pwdPolicy.passwordRequireSpecial === true} onChange={(e) => setAuthForm({ ...authForm, passwordPolicy: { ...pwdPolicy, passwordRequireSpecial: e.target.checked } })} /> کاراکتر خاص</label>
            </div>
            <div className="border-t pt-4 space-y-2">
              <label className="flex items-center justify-between text-sm font-bold">
                LDAP
                <ToggleSwitch checked={authForm.ldapEnabled === true} onChange={() => setAuthForm({ ...authForm, ldapEnabled: !authForm.ldapEnabled })} />
              </label>
              {authForm.ldapEnabled === true && (
                <>
                  <input className={inputClass} dir="ltr" placeholder="LDAP URL" value={ldap.url || ''} onChange={(e) => setAuthForm({ ...authForm, ldapConfiguration: { ...ldap, url: e.target.value } })} />
                  <input className={inputClass} dir="ltr" placeholder="Bind DN" value={ldap.bindDn || ''} onChange={(e) => setAuthForm({ ...authForm, ldapConfiguration: { ...ldap, bindDn: e.target.value } })} />
                  <input type="password" className={inputClass} placeholder="Bind Password" value={ldap.bindPassword || ''} onChange={(e) => setAuthForm({ ...authForm, ldapConfiguration: { ...ldap, bindPassword: e.target.value } })} />
                  <input className={inputClass} dir="ltr" placeholder="Base DN" value={ldap.baseDn || ''} onChange={(e) => setAuthForm({ ...authForm, ldapConfiguration: { ...ldap, baseDn: e.target.value } })} />
                  <input className={inputClass} dir="ltr" placeholder="User filter" value={ldap.userFilter || ''} onChange={(e) => setAuthForm({ ...authForm, ldapConfiguration: { ...ldap, userFilter: e.target.value } })} />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="text-xs font-bold text-brand cursor-pointer" onClick={async () => { const r = await ApiService.postAdminTest('auth-settings/test-ldap', { ldap: authForm.ldapConfiguration }); showToast(r.message, r.ok ? 'success' : 'error'); }}>Test LDAP</button>
                    <input className={`${inputClass} max-w-[140px]`} placeholder="کاربر تست" value={ldapTestUser} onChange={(e) => setLdapTestUser(e.target.value)} />
                    <button type="button" className="text-xs font-bold text-brand cursor-pointer" onClick={async () => { const r = await ApiService.postAdminTest('auth-settings/test-ldap-user', { ldap: authForm.ldapConfiguration, username: ldapTestUser }); showToast(r.message, r.ok ? 'success' : 'error'); }}>جستجوی کاربر</button>
                  </div>
                </>
              )}
            </div>
            <div className="border-t pt-4 space-y-2">
              <label className="flex items-center justify-between text-sm font-bold">
                Google OAuth
                <ToggleSwitch checked={authForm.googleEnabled === true} onChange={() => setAuthForm({ ...authForm, googleEnabled: !authForm.googleEnabled })} />
              </label>
              {authForm.googleEnabled === true && (
                <>
                  <input className={inputClass} dir="ltr" placeholder="Client ID" value={google.clientId || ''} onChange={(e) => setAuthForm({ ...authForm, googleConfiguration: { ...google, clientId: e.target.value } })} />
                  <input type="password" className={inputClass} placeholder="Client Secret" value={google.clientSecret || ''} onChange={(e) => setAuthForm({ ...authForm, googleConfiguration: { ...google, clientSecret: e.target.value } })} />
                  <input className={inputClass} dir="ltr" placeholder="Redirect URL" value={google.redirectUri || ''} onChange={(e) => setAuthForm({ ...authForm, googleConfiguration: { ...google, redirectUri: e.target.value } })} />
                  <button type="button" className="text-xs font-bold text-brand cursor-pointer" onClick={async () => { const r = await ApiService.postAdminTest('auth-settings/test-google', { google: authForm.googleConfiguration }); showToast(r.message, r.ok ? 'success' : 'error'); }}>Test Google</button>
                </>
              )}
            </div>
            <button type="button" onClick={saveAuth} disabled={saving} className="btn-brand text-white px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer">
              <Save className="w-4 h-4" />
              ذخیره احراز هویت
            </button>
          </>
        )}

        {section === 'integrations' && (
          <>
            <header>
              <h1 className="text-lg font-extrabold">یکپارچه‌سازی‌ها</h1>
              <p className="text-sm text-slate-500">SMTP و ذخیره‌سازی فایل</p>
            </header>
            <div className="space-y-2">
              <p className="text-xs font-bold">SMTP</p>
              <input className={inputClass} dir="ltr" placeholder="Host" value={String(smtp.host || '')} onChange={(e) => setIntegrations({ ...integrations, smtp: { ...smtp, host: e.target.value } })} />
              <input type="number" className={inputClass} placeholder="Port" value={Number(smtp.port || 587)} onChange={(e) => setIntegrations({ ...integrations, smtp: { ...smtp, port: Number(e.target.value) } })} />
              <input className={inputClass} dir="ltr" placeholder="Username" value={String(smtp.username || '')} onChange={(e) => setIntegrations({ ...integrations, smtp: { ...smtp, username: e.target.value } })} />
              <input type="password" className={inputClass} placeholder="Password" value={String(smtp.password || '')} onChange={(e) => setIntegrations({ ...integrations, smtp: { ...smtp, password: e.target.value } })} />
              <input className={inputClass} dir="ltr" placeholder="From Email" value={String(smtp.fromEmail || '')} onChange={(e) => setIntegrations({ ...integrations, smtp: { ...smtp, fromEmail: e.target.value } })} />
              <button type="button" className="text-xs font-bold text-brand cursor-pointer" onClick={async () => { const r = await ApiService.postAdminTest('integrations/test-smtp', { smtp: integrations.smtp }); showToast(r.message, r.ok ? 'success' : 'error'); }}>Test SMTP</button>
            </div>
            <div className="space-y-2 border-t pt-4">
              <p className="text-xs font-bold">Storage</p>
              <select className={inputClass} value={String(storage.type || 'local')} onChange={(e) => setIntegrations({ ...integrations, storage: { ...storage, type: e.target.value } })}>
                <option value="local">Local</option>
                <option value="s3">S3 (آینده)</option>
                <option value="minio">MinIO (آینده)</option>
              </select>
              <input className={inputClass} dir="ltr" placeholder="Upload path / bucket" value={String(storage.uploadPath || storage.bucketName || '')} onChange={(e) => setIntegrations({ ...integrations, storage: { ...storage, uploadPath: e.target.value } })} />
              <button type="button" className="text-xs font-bold text-brand cursor-pointer" onClick={async () => { const r = await ApiService.postAdminTest('integrations/test-storage', integrations.storage as Record<string, unknown>); showToast(r.message, r.ok ? 'success' : 'error'); }}>Test storage</button>
            </div>
            <button type="button" onClick={saveIntegrations} disabled={saving} className="btn-brand text-white px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer">
              <Save className="w-4 h-4" />
              ذخیره یکپارچه‌سازی
            </button>
          </>
        )}

        {section === 'system' && (
          <>
            <header>
              <h1 className="text-lg font-extrabold">تنظیمات سامانه</h1>
            </header>
            <input className={inputClass} dir="ltr" placeholder="Application URL" value={String(systemForm.appUrl || '')} onChange={(e) => setSystemForm({ ...systemForm, appUrl: e.target.value })} />
            <input className={inputClass} dir="ltr" placeholder="Default timezone" value={String(systemForm.defaultTimezone || '')} onChange={(e) => setSystemForm({ ...systemForm, defaultTimezone: e.target.value })} />
            <input type="number" className={inputClass} placeholder="Session timeout (minutes)" value={Number(systemForm.sessionTimeoutMinutes || 60)} onChange={(e) => setSystemForm({ ...systemForm, sessionTimeoutMinutes: Number(e.target.value) })} />
            <input type="number" className={inputClass} placeholder="Max upload MB" value={Number(systemForm.maxUploadMb || 10)} onChange={(e) => setSystemForm({ ...systemForm, maxUploadMb: Number(e.target.value) })} />
            <label className="flex items-center justify-between text-sm">
              <span>حالت نگهداری (Maintenance)</span>
              <ToggleSwitch checked={systemForm.maintenanceMode === true} onChange={() => setSystemForm({ ...systemForm, maintenanceMode: !systemForm.maintenanceMode })} />
            </label>
            <button type="button" onClick={saveSystem} disabled={saving} className="btn-brand text-white px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer">
              <Save className="w-4 h-4" />
              ذخیره سامانه
            </button>
          </>
        )}

        {section === 'audit' && (
          <>
            <header>
              <h1 className="text-lg font-extrabold">ممیزی تنظیمات</h1>
              <p className="text-sm text-slate-500">تغییرات پیکربندی سازمان</p>
            </header>
            <ul className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
              {auditLogs.length === 0 && <li className="py-6 text-center text-slate-500">هنوز رویدادی ثبت نشده است.</li>}
              {auditLogs.map((log) => (
                <li key={log.id} className="py-3">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{log.summary}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {log.eventType} · {log.userName} · {new Date(log.createdAt).toLocaleString('fa-IR')}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};
