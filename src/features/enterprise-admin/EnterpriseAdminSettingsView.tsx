import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Save, Loader2, ChevronRight, Settings2 } from 'lucide-react';
import { OrgLogoUploader } from './OrgLogoUploader';
import { OrgBrandThemePicker } from './OrgBrandThemePicker';
import {
  ORG_COUNTRY_OPTIONS,
  ORG_TIMEZONE_OPTIONS,
  orgCountrySelectValue,
  orgTimezoneSelectValue,
} from './orgRegionOptions';
import { ToggleSwitch } from '../../components/admin/AccessControlView';
import type { AdminSettingsSection } from './adminSettingsTabs';
import { applyOrgBrandTheme } from '../../utils/orgBrandTheme';
import {
  adminInputClass,
  AdminFormFooter,
  AdminPage,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminSection,
  FormField,
  FormGrid,
} from './adminSettingsLayout';

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
  const [authConfigView, setAuthConfigView] = useState<'ldap' | 'google' | null>(null);

  useEffect(() => {
    if (section !== 'authentication') setAuthConfigView(null);
  }, [section]);

  const primaryColor = String(orgForm.primaryColor || '#0f786e');

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
      if (updated.primaryColor) {
        applyOrgBrandTheme(String(updated.primaryColor));
      }
      if (currentOrg) {
        const booking = (updated.bookingSettings || {}) as import('../../types').Organization['settings'];
        updateCurrentOrgData({
          name: updated.name,
          logo: updated.logo,
          primaryColor: updated.primaryColor,
          contactEmail: updated.contactEmail,
          code: updated.code,
          workHours: updated.workHours,
          settings: {
            ...currentOrg.settings,
            ...booking,
            autoApprove: booking?.autoApprove ?? currentOrg.settings?.autoApprove ?? true,
            maxBookingHours:
              booking?.maxBookingHours ?? currentOrg.settings?.maxBookingHours ?? 4,
            allowWeekend: booking?.allowWeekend ?? currentOrg.settings?.allowWeekend ?? false,
            dateFormat: (updated.dateFormat as 'jalali' | 'gregorian') || 'jalali',
            timezone: String(updated.timezone || currentOrg.settings?.timezone || 'Asia/Tehran'),
            country: String(updated.country || currentOrg.settings?.country || 'IR'),
            logoDark: String(updated.logoDark ?? currentOrg.settings?.logoDark ?? ''),
          },
        });
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

  const saveButton = (onClick: () => void | Promise<void>, label: string) => (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="btn-brand text-white px-6 py-3 rounded-xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
    >
      <Save className="w-4 h-4" />
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const ldap = (authForm.ldapConfiguration || {}) as Record<string, string>;
  const google = (authForm.googleConfiguration || {}) as Record<string, string>;
  const policies = (authForm.authPolicies || {}) as Record<string, boolean>;
  const pwdPolicy = (authForm.passwordPolicy || {}) as Record<string, boolean | number>;
  const smtp = (integrations.smtp || {}) as Record<string, unknown>;
  const storage = (integrations.storage || {}) as Record<string, unknown>;

  const sectionMeta: Record<
    AdminSettingsSection,
    { title: string; subtitle: string }
  > = {
    organization: {
      title: 'تنظیمات سازمان',
      subtitle: 'لوگو، رنگ تم، دامنه و تقویم سازمان',
    },
    authentication: {
      title: 'احراز هویت',
      subtitle: 'ورود محلی، LDAP و Google OAuth',
    },
    integrations: {
      title: 'یکپارچه‌سازی‌ها',
      subtitle: 'SMTP و ذخیره‌سازی فایل',
    },
    system: {
      title: 'تنظیمات سامانه',
      subtitle: 'URL، نشست، آپلود و نگهداری',
    },
    audit: {
      title: 'ممیزی تنظیمات',
      subtitle: 'تاریخچه تغییرات پیکربندی',
    },
  };

  const authPanelMeta =
    section === 'authentication' && authConfigView === 'ldap'
      ? { title: 'پیکربندی LDAP', subtitle: 'اتصال به Active Directory / دایرکتوری سازمان' }
      : section === 'authentication' && authConfigView === 'google'
        ? { title: 'پیکربندی Google OAuth', subtitle: 'ورود با حساب Google Workspace' }
        : sectionMeta[section];

  const meta = authPanelMeta;

  const authProviderCard = (
    title: string,
    description: string,
    enabled: boolean,
    onConfigure: () => void,
  ) => (
    <div
      className="rounded-2xl border border-slate-200/80 dark:border-slate-600/50 p-5 sm:p-6 flex flex-col gap-4 bg-slate-50/40 dark:bg-slate-900/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        <span
          className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${
            enabled
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
          }`}
        >
          {enabled ? 'فعال' : 'غیرفعال'}
        </span>
      </div>
      <button
        type="button"
        onClick={onConfigure}
        className="self-start inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[rgb(var(--brand-primary-rgb)/0.08)] transition-colors cursor-pointer"
      >
        <Settings2 className="w-4 h-4" />
        پیکربندی
      </button>
    </div>
  );

  const authBackButton = (
    <button
      type="button"
      onClick={() => setAuthConfigView(null)}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--brand-primary)] hover:opacity-80 mb-2 cursor-pointer"
    >
      <ChevronRight className="w-4 h-4" />
      بازگشت به احراز هویت
    </button>
  );

  return (
    <AdminPage>
      <AdminPanel>
        <AdminPanelHeader title={meta.title} subtitle={meta.subtitle} />
        <AdminPanelBody>
          {section === 'organization' && (
            <>
              <AdminSection title="هویت و برند">
                <div className="space-y-4">
                  <OrgLogoUploader
                    logoLight={String(orgForm.logo || '')}
                    logoDark={String(orgForm.logoDark || '')}
                    orgName={String(orgForm.name || 'سازمان')}
                    onChangeLight={(logo) => setOrgForm({ ...orgForm, logo })}
                    onChangeDark={(logoDark) => setOrgForm({ ...orgForm, logoDark })}
                  />
                  <OrgBrandThemePicker
                    color={primaryColor}
                    onChange={(c) => setOrgForm({ ...orgForm, primaryColor: c })}
                  />
                </div>
              </AdminSection>

              <AdminSection title="اطلاعات سازمان">
                <FormGrid>
                  <FormField label="نام سازمان">
                    <input
                      className={adminInputClass}
                      value={String(orgForm.name || '')}
                      onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    />
                  </FormField>
                  <FormField label="کد سازمان">
                    <input
                      className={adminInputClass}
                      dir="ltr"
                      value={String(orgForm.code || '')}
                      onChange={(e) => setOrgForm({ ...orgForm, code: e.target.value })}
                    />
                  </FormField>
                  <FormField label="ایمیل شرکت">
                    <input
                      className={adminInputClass}
                      dir="ltr"
                      value={String(orgForm.contactEmail || '')}
                      onChange={(e) => setOrgForm({ ...orgForm, contactEmail: e.target.value })}
                    />
                  </FormField>
                  <FormField label="دامنه">
                    <input
                      className={adminInputClass}
                      dir="ltr"
                      value={String(orgForm.domain || '')}
                      onChange={(e) => setOrgForm({ ...orgForm, domain: e.target.value })}
                    />
                  </FormField>
                  <FormField label="کشور">
                    <select
                      className={adminInputClass}
                      value={orgCountrySelectValue(String(orgForm.country || ''))}
                      onChange={(e) => setOrgForm({ ...orgForm, country: e.target.value })}
                    >
                      {ORG_COUNTRY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="منطقه زمانی">
                    <select
                      className={adminInputClass}
                      dir="ltr"
                      value={orgTimezoneSelectValue(String(orgForm.timezone || ''))}
                      onChange={(e) => setOrgForm({ ...orgForm, timezone: e.target.value })}
                    >
                      {ORG_TIMEZONE_OPTIONS.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="تقویم">
                    <select
                      className={adminInputClass}
                      value={String(orgForm.dateFormat || 'jalali')}
                      onChange={(e) => setOrgForm({ ...orgForm, dateFormat: e.target.value })}
                    >
                      <option value="jalali">تقویم شمسی</option>
                      <option value="gregorian">میلادی</option>
                    </select>
                  </FormField>
                </FormGrid>
              </AdminSection>

              <AdminFormFooter>{saveButton(saveOrganization, 'ذخیره تنظیمات سازمان')}</AdminFormFooter>
            </>
          )}

          {section === 'authentication' && authConfigView === null && (
            <>
              <AdminSection title="روش‌های ورود">
                <div className="space-y-4 rounded-2xl border border-slate-200/80 dark:border-slate-600/50 p-5 sm:p-6">
                  <label className="flex items-center justify-between text-base py-1">
                    <span className="font-semibold">ورود محلی (رمز عبور)</span>
                    <ToggleSwitch
                      checked={authForm.localEnabled !== false}
                      onChange={() => setAuthForm({ ...authForm, localEnabled: !authForm.localEnabled })}
                    />
                  </label>
                  <label className="flex items-center justify-between text-base py-1">
                    <span className="font-semibold">ثبت‌نام خودکار</span>
                    <ToggleSwitch
                      checked={policies.selfRegistrationEnabled === true}
                      onChange={() =>
                        setAuthForm({
                          ...authForm,
                          authPolicies: {
                            ...policies,
                            selfRegistrationEnabled: !policies.selfRegistrationEnabled,
                          },
                        })
                      }
                    />
                  </label>
                </div>
              </AdminSection>

              <AdminSection title="سیاست رمز عبور">
                <FormGrid cols={1}>
                  <FormField label="حداقل طول">
                    <input
                      type="number"
                      className={adminInputClass}
                      value={Number(pwdPolicy.passwordMinLength || 8)}
                      onChange={(e) =>
                        setAuthForm({
                          ...authForm,
                          passwordPolicy: { ...pwdPolicy, passwordMinLength: Number(e.target.value) },
                        })
                      }
                    />
                  </FormField>
                  <div className="flex flex-wrap gap-6 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pwdPolicy.passwordRequireNumber === true}
                        onChange={(e) =>
                          setAuthForm({
                            ...authForm,
                            passwordPolicy: { ...pwdPolicy, passwordRequireNumber: e.target.checked },
                          })
                        }
                      />
                      عدد الزامی
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pwdPolicy.passwordRequireUppercase === true}
                        onChange={(e) =>
                          setAuthForm({
                            ...authForm,
                            passwordPolicy: { ...pwdPolicy, passwordRequireUppercase: e.target.checked },
                          })
                        }
                      />
                      حروف بزرگ
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pwdPolicy.passwordRequireSpecial === true}
                        onChange={(e) =>
                          setAuthForm({
                            ...authForm,
                            passwordPolicy: { ...pwdPolicy, passwordRequireSpecial: e.target.checked },
                          })
                        }
                      />
                      کاراکتر خاص
                    </label>
                  </div>
                </FormGrid>
              </AdminSection>

              <AdminSection
                title="ورود سازمانی پیشرفته"
                description="تنظیمات LDAP و Google در صفحه جداگانه انجام می‌شود."
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {authProviderCard(
                    'LDAP / Active Directory',
                    'احراز هویت کاربران از دایرکتوری سازمان',
                    authForm.ldapEnabled === true,
                    () => setAuthConfigView('ldap'),
                  )}
                  {authProviderCard(
                    'Google OAuth',
                    'ورود با حساب Google سازمانی',
                    authForm.googleEnabled === true,
                    () => setAuthConfigView('google'),
                  )}
                </div>
              </AdminSection>

              <AdminFormFooter>{saveButton(saveAuth, 'ذخیره احراز هویت')}</AdminFormFooter>
            </>
          )}

          {section === 'authentication' && authConfigView === 'ldap' && (
            <>
              {authBackButton}
              <AdminSection title="فعال‌سازی و اتصال">
                <label className="flex items-center justify-between text-base font-bold py-2 px-1">
                  <span>استفاده از LDAP برای ورود</span>
                  <ToggleSwitch
                    checked={authForm.ldapEnabled === true}
                    onChange={() => setAuthForm({ ...authForm, ldapEnabled: !authForm.ldapEnabled })}
                  />
                </label>
                <FormGrid>
                  <FormField label="LDAP URL">
                    <input
                      className={adminInputClass}
                      dir="ltr"
                      value={ldap.url || ''}
                      onChange={(e) =>
                        setAuthForm({ ...authForm, ldapConfiguration: { ...ldap, url: e.target.value } })
                      }
                    />
                  </FormField>
                  <FormField label="Bind DN">
                    <input
                      className={adminInputClass}
                      dir="ltr"
                      value={ldap.bindDn || ''}
                      onChange={(e) =>
                        setAuthForm({ ...authForm, ldapConfiguration: { ...ldap, bindDn: e.target.value } })
                      }
                    />
                  </FormField>
                  <FormField label="Bind Password">
                    <input
                      type="password"
                      className={adminInputClass}
                      value={ldap.bindPassword || ''}
                      onChange={(e) =>
                        setAuthForm({
                          ...authForm,
                          ldapConfiguration: { ...ldap, bindPassword: e.target.value },
                        })
                      }
                    />
                  </FormField>
                  <FormField label="Base DN">
                    <input
                      className={adminInputClass}
                      dir="ltr"
                      value={ldap.baseDn || ''}
                      onChange={(e) =>
                        setAuthForm({ ...authForm, ldapConfiguration: { ...ldap, baseDn: e.target.value } })
                      }
                    />
                  </FormField>
                  <FormField label="User filter" className="lg:col-span-2">
                    <input
                      className={adminInputClass}
                      dir="ltr"
                      value={ldap.userFilter || ''}
                      onChange={(e) =>
                        setAuthForm({
                          ...authForm,
                          ldapConfiguration: { ...ldap, userFilter: e.target.value },
                        })
                      }
                    />
                  </FormField>
                </FormGrid>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    className="text-sm font-bold text-brand cursor-pointer px-4 py-2 rounded-xl bg-brand-soft"
                    onClick={async () => {
                      const r = await ApiService.postAdminTest('auth-settings/test-ldap', {
                        ldap: authForm.ldapConfiguration,
                      });
                      showToast(r.message, r.ok ? 'success' : 'error');
                    }}
                  >
                    Test LDAP
                  </button>
                  <input
                    className={`${adminInputClass} max-w-[180px]`}
                    placeholder="کاربر تست"
                    value={ldapTestUser}
                    onChange={(e) => setLdapTestUser(e.target.value)}
                  />
                  <button
                    type="button"
                    className="text-sm font-bold text-brand cursor-pointer"
                    onClick={async () => {
                      const r = await ApiService.postAdminTest('auth-settings/test-ldap-user', {
                        ldap: authForm.ldapConfiguration,
                        username: ldapTestUser,
                      });
                      showToast(r.message, r.ok ? 'success' : 'error');
                    }}
                  >
                    جستجوی کاربر
                  </button>
                </div>
              </AdminSection>
              <AdminFormFooter>
                {saveButton(async () => {
                  await saveAuth();
                  setAuthConfigView(null);
                }, 'ذخیره LDAP')}
              </AdminFormFooter>
            </>
          )}

          {section === 'authentication' && authConfigView === 'google' && (
            <>
              {authBackButton}
              <AdminSection title="فعال‌سازی و اتصال">
                <label className="flex items-center justify-between text-base font-bold py-2 px-1">
                  <span>استفاده از Google برای ورود</span>
                  <ToggleSwitch
                    checked={authForm.googleEnabled === true}
                    onChange={() => setAuthForm({ ...authForm, googleEnabled: !authForm.googleEnabled })}
                  />
                </label>
                <FormGrid>
                  <FormField label="Client ID">
                    <input
                      className={adminInputClass}
                      dir="ltr"
                      value={google.clientId || ''}
                      onChange={(e) =>
                        setAuthForm({
                          ...authForm,
                          googleConfiguration: { ...google, clientId: e.target.value },
                        })
                      }
                    />
                  </FormField>
                  <FormField label="Client Secret">
                    <input
                      type="password"
                      className={adminInputClass}
                      value={google.clientSecret || ''}
                      onChange={(e) =>
                        setAuthForm({
                          ...authForm,
                          googleConfiguration: { ...google, clientSecret: e.target.value },
                        })
                      }
                    />
                  </FormField>
                  <FormField label="Redirect URL" className="lg:col-span-2">
                    <input
                      className={adminInputClass}
                      dir="ltr"
                      value={google.redirectUri || ''}
                      onChange={(e) =>
                        setAuthForm({
                          ...authForm,
                          googleConfiguration: { ...google, redirectUri: e.target.value },
                        })
                      }
                    />
                  </FormField>
                </FormGrid>
                <button
                  type="button"
                  className="text-sm font-bold text-brand cursor-pointer"
                  onClick={async () => {
                    const r = await ApiService.postAdminTest('auth-settings/test-google', {
                      google: authForm.googleConfiguration,
                    });
                    showToast(r.message, r.ok ? 'success' : 'error');
                  }}
                >
                  Test Google
                </button>
              </AdminSection>
              <AdminFormFooter>
                {saveButton(async () => {
                  await saveAuth();
                  setAuthConfigView(null);
                }, 'ذخیره Google')}
              </AdminFormFooter>
            </>
          )}

          {section === 'integrations' && (
            <>
              <AdminSection title="SMTP">
                <FormGrid>
                  <FormField label="Host">
                    <input
                      className={adminInputClass}
                      dir="ltr"
                      value={String(smtp.host || '')}
                      onChange={(e) =>
                        setIntegrations({ ...integrations, smtp: { ...smtp, host: e.target.value } })
                      }
                    />
                  </FormField>
                  <FormField label="Port">
                    <input
                      type="number"
                      className={adminInputClass}
                      value={Number(smtp.port || 587)}
                      onChange={(e) =>
                        setIntegrations({
                          ...integrations,
                          smtp: { ...smtp, port: Number(e.target.value) },
                        })
                      }
                    />
                  </FormField>
                  <FormField label="Username">
                    <input
                      className={adminInputClass}
                      dir="ltr"
                      value={String(smtp.username || '')}
                      onChange={(e) =>
                        setIntegrations({ ...integrations, smtp: { ...smtp, username: e.target.value } })
                      }
                    />
                  </FormField>
                  <FormField label="Password">
                    <input
                      type="password"
                      className={adminInputClass}
                      value={String(smtp.password || '')}
                      onChange={(e) =>
                        setIntegrations({ ...integrations, smtp: { ...smtp, password: e.target.value } })
                      }
                    />
                  </FormField>
                  <FormField label="From Email" className="lg:col-span-2">
                    <input
                      className={adminInputClass}
                      dir="ltr"
                      value={String(smtp.fromEmail || '')}
                      onChange={(e) =>
                        setIntegrations({ ...integrations, smtp: { ...smtp, fromEmail: e.target.value } })
                      }
                    />
                  </FormField>
                </FormGrid>
                <button
                  type="button"
                  className="text-sm font-bold text-brand cursor-pointer"
                  onClick={async () => {
                    const r = await ApiService.postAdminTest('integrations/test-smtp', {
                      smtp: integrations.smtp,
                    });
                    showToast(r.message, r.ok ? 'success' : 'error');
                  }}
                >
                  Test SMTP
                </button>
              </AdminSection>

              <AdminSection title="Storage">
                <FormGrid cols={1}>
                  <FormField label="نوع ذخیره‌سازی">
                    <select
                      className={adminInputClass}
                      value={String(storage.type || 'local')}
                      onChange={(e) =>
                        setIntegrations({ ...integrations, storage: { ...storage, type: e.target.value } })
                      }
                    >
                      <option value="local">Local</option>
                      <option value="s3">S3 (آینده)</option>
                      <option value="minio">MinIO (آینده)</option>
                    </select>
                  </FormField>
                  <FormField label="مسیر / bucket">
                    <input
                      className={adminInputClass}
                      dir="ltr"
                      value={String(storage.uploadPath || storage.bucketName || '')}
                      onChange={(e) =>
                        setIntegrations({
                          ...integrations,
                          storage: { ...storage, uploadPath: e.target.value },
                        })
                      }
                    />
                  </FormField>
                </FormGrid>
                <button
                  type="button"
                  className="text-sm font-bold text-brand cursor-pointer"
                  onClick={async () => {
                    const r = await ApiService.postAdminTest(
                      'integrations/test-storage',
                      integrations.storage as Record<string, unknown>,
                    );
                    showToast(r.message, r.ok ? 'success' : 'error');
                  }}
                >
                  Test storage
                </button>
              </AdminSection>

              <AdminFormFooter>{saveButton(saveIntegrations, 'ذخیره یکپارچه‌سازی')}</AdminFormFooter>
            </>
          )}

          {section === 'system' && (
            <>
              <FormGrid>
                <FormField label="Application URL">
                  <input
                    className={adminInputClass}
                    dir="ltr"
                    value={String(systemForm.appUrl || '')}
                    onChange={(e) => setSystemForm({ ...systemForm, appUrl: e.target.value })}
                  />
                </FormField>
                <FormField label="Default timezone">
                  <input
                    className={adminInputClass}
                    dir="ltr"
                    value={String(systemForm.defaultTimezone || '')}
                    onChange={(e) => setSystemForm({ ...systemForm, defaultTimezone: e.target.value })}
                  />
                </FormField>
                <FormField label="Session timeout (minutes)">
                  <input
                    type="number"
                    className={adminInputClass}
                    value={Number(systemForm.sessionTimeoutMinutes || 60)}
                    onChange={(e) =>
                      setSystemForm({ ...systemForm, sessionTimeoutMinutes: Number(e.target.value) })
                    }
                  />
                </FormField>
                <FormField label="Max upload (MB)">
                  <input
                    type="number"
                    className={adminInputClass}
                    value={Number(systemForm.maxUploadMb || 10)}
                    onChange={(e) => setSystemForm({ ...systemForm, maxUploadMb: Number(e.target.value) })}
                  />
                </FormField>
              </FormGrid>
              <label className="flex items-center justify-between text-base py-2">
                <span className="font-semibold">حالت نگهداری (Maintenance)</span>
                <ToggleSwitch
                  checked={systemForm.maintenanceMode === true}
                  onChange={() =>
                    setSystemForm({ ...systemForm, maintenanceMode: !systemForm.maintenanceMode })
                  }
                />
              </label>
              <AdminFormFooter>{saveButton(saveSystem, 'ذخیره سامانه')}</AdminFormFooter>
            </>
          )}

          {section === 'audit' && (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
              {auditLogs.length === 0 && (
                <li className="py-12 text-center text-slate-500">هنوز رویدادی ثبت نشده است.</li>
              )}
              {auditLogs.map((log) => (
                <li key={log.id} className="py-4">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-base">{log.summary}</p>
                  <p className="text-xs text-slate-500 mt-1.5">
                    {log.eventType} · {log.userName} ·{' '}
                    {new Date(log.createdAt).toLocaleString('fa-IR')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </AdminPanelBody>
      </AdminPanel>
    </AdminPage>
  );
};
