import React from 'react';
import { ChevronRight, Save } from 'lucide-react';
import { ToggleSwitch } from '../../components/admin/AccessControlView';
import { ApiService } from '../../services/apiService';
import {
  AdminSection,
  FormField,
  FormGrid,
  adminInputClass,
} from './adminSettingsLayout';
import {
  IntegrationProviderCard,
  isResendIntegrationActive,
  isSmtpIntegrationActive,
} from './IntegrationProviderCard';

type EmailChannelsSettingsProps = {
  integrations: Record<string, unknown>;
  setIntegrations: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  /** When true, omit outer section titles (e.g. nested inside notifications) */
  embedded?: boolean;
  mode?: 'all' | 'resend' | 'smtp';
};

export const EmailChannelsSettings: React.FC<EmailChannelsSettingsProps> = ({
  integrations,
  setIntegrations,
  showToast,
  embedded = false,
  mode = 'all',
}) => {
  const resend = (integrations.resend || { enabled: false }) as Record<string, unknown>;
  const smtp = (integrations.smtp || { enabled: false }) as Record<string, unknown>;

  const resendEnabled = resend.enabled !== false && resend.enabled !== 'false';
  const smtpEnabled = smtp.enabled !== false && smtp.enabled !== 'false';

  const wrap = (title: string, children: React.ReactNode) =>
    embedded ? (
      <div className="space-y-4">{children}</div>
    ) : (
      <AdminSection title={title}>{children}</AdminSection>
    );

  const showResend = mode === 'all' || mode === 'resend';
  const showSmtp = mode === 'all' || mode === 'smtp';

  return (
    <div className="space-y-6">
      {showResend &&
        wrap(
        'Resend — ارسال ایمیل (اولویت اول)',
        <>
          {!embedded && (
            <p className="text-xs text-slate-500 mb-3">
              OTP ثبت‌نام و بازنشانی رمز. دامنه باید در Resend تأیید شده باشد.
            </p>
          )}
          <div className="flex items-center justify-between gap-4 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">فعال‌سازی Resend</span>
            <ToggleSwitch
              checked={resendEnabled}
              onChange={() =>
                setIntegrations({
                  ...integrations,
                  resend: { ...resend, enabled: !resendEnabled },
                })
              }
              label={resendEnabled ? 'فعال' : 'غیرفعال'}
            />
          </div>
          <FormGrid>
            <FormField label="API Key" className="lg:col-span-2">
              <input
                type="password"
                className={adminInputClass}
                dir="ltr"
                autoComplete="off"
                value={String(resend.apiKey || '')}
                onChange={(e) =>
                  setIntegrations({
                    ...integrations,
                    resend: { ...resend, enabled: resendEnabled, apiKey: e.target.value },
                  })
                }
              />
            </FormField>
            <FormField label="From Email" className="lg:col-span-2">
              <input
                className={adminInputClass}
                dir="ltr"
                placeholder="onboarding@yourdomain.com"
                value={String(resend.fromEmail || '')}
                onChange={(e) =>
                  setIntegrations({
                    ...integrations,
                    resend: { ...resend, enabled: resendEnabled, fromEmail: e.target.value },
                  })
                }
              />
            </FormField>
            <FormField label="From Name" className="lg:col-span-2">
              <input
                className={adminInputClass}
                value={String(resend.fromName || '')}
                onChange={(e) =>
                  setIntegrations({
                    ...integrations,
                    resend: { ...resend, enabled: resendEnabled, fromName: e.target.value },
                  })
                }
              />
            </FormField>
            <FormField label="ایمیل تست (اختیاری)" className="lg:col-span-2">
              <input
                type="email"
                className={adminInputClass}
                dir="ltr"
                placeholder="برای ارسال واقعی در تست"
                value={String(resend.testRecipient || '')}
                onChange={(e) =>
                  setIntegrations({
                    ...integrations,
                    resend: { ...resend, enabled: resendEnabled, testRecipient: e.target.value },
                  })
                }
              />
            </FormField>
          </FormGrid>
          <button
            type="button"
            className="text-sm font-bold text-brand cursor-pointer mt-2"
            onClick={async () => {
              const r = await ApiService.postAdminTest('integrations/test-resend', {
                resend: integrations.resend,
              });
              showToast(r.message, r.ok ? 'success' : 'error');
            }}
          >
            تست اتصال Resend
          </button>
        </>,
      )}

      {showSmtp &&
        wrap(
        'SMTP — پشتیبان (Gmail و سایر)',
        <>
          {!embedded && (
            <p className="text-xs text-slate-500 mb-3">
              در صورت خطای Resend از SMTP استفاده می‌شود. Gmail:{' '}
              <span dir="ltr" className="font-mono">smtp.gmail.com</span>، پورت 587، App Password.
            </p>
          )}
          <div className="flex items-center justify-between gap-4 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">فعال‌سازی SMTP</span>
            <ToggleSwitch
              checked={smtpEnabled}
              onChange={() =>
                setIntegrations({
                  ...integrations,
                  smtp: { ...smtp, enabled: !smtpEnabled },
                })
              }
              label={smtpEnabled ? 'فعال' : 'غیرفعال'}
            />
          </div>
          <FormGrid>
            <FormField label="Host">
              <input
                className={adminInputClass}
                dir="ltr"
                placeholder="smtp.gmail.com"
                value={String(smtp.host || '')}
                onChange={(e) =>
                  setIntegrations({
                    ...integrations,
                    smtp: { ...smtp, enabled: smtpEnabled, host: e.target.value },
                  })
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
                    smtp: { ...smtp, enabled: smtpEnabled, port: Number(e.target.value) },
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
                  setIntegrations({
                    ...integrations,
                    smtp: { ...smtp, enabled: smtpEnabled, username: e.target.value },
                  })
                }
              />
            </FormField>
            <FormField label="Password">
              <input
                type="password"
                className={adminInputClass}
                autoComplete="off"
                value={String(smtp.password || '')}
                onChange={(e) =>
                  setIntegrations({
                    ...integrations,
                    smtp: { ...smtp, enabled: smtpEnabled, password: e.target.value },
                  })
                }
              />
            </FormField>
            <FormField label="From Email" className="lg:col-span-2">
              <input
                className={adminInputClass}
                dir="ltr"
                value={String(smtp.fromEmail || '')}
                onChange={(e) =>
                  setIntegrations({
                    ...integrations,
                    smtp: { ...smtp, enabled: smtpEnabled, fromEmail: e.target.value },
                  })
                }
              />
            </FormField>
            <FormField label="From Name" className="lg:col-span-2">
              <input
                className={adminInputClass}
                value={String(smtp.fromName || '')}
                onChange={(e) =>
                  setIntegrations({
                    ...integrations,
                    smtp: { ...smtp, enabled: smtpEnabled, fromName: e.target.value },
                  })
                }
              />
            </FormField>
            <FormField label="ایمیل تست (اختیاری)" className="lg:col-span-2">
              <input
                type="email"
                className={adminInputClass}
                dir="ltr"
                value={String(smtp.testRecipient || '')}
                onChange={(e) =>
                  setIntegrations({
                    ...integrations,
                    smtp: { ...smtp, enabled: smtpEnabled, testRecipient: e.target.value },
                  })
                }
              />
            </FormField>
          </FormGrid>
          <button
            type="button"
            className="text-sm font-bold text-brand cursor-pointer mt-2"
            onClick={async () => {
              const r = await ApiService.postAdminTest('integrations/test-smtp', {
                smtp: integrations.smtp,
              });
              showToast(r.message, r.ok ? 'success' : 'error');
            }}
          >
            تست اتصال SMTP
          </button>
        </>,
      )}
    </div>
  );
};

export const EmailIntegrationsOverview: React.FC<{
  integrations: Record<string, unknown>;
  configView: 'resend' | 'smtp' | null;
  onConfigure: (view: 'resend' | 'smtp') => void;
}> = ({ integrations, configView, onConfigure }) => {
  if (configView) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <IntegrationProviderCard
        title="Resend"
        description="ارسال OTP ثبت‌نام و بازنشانی رمز (اولویت اول)"
        enabled={isResendIntegrationActive(integrations)}
        onConfigure={() => onConfigure('resend')}
      />
      <IntegrationProviderCard
        title="SMTP / Gmail"
        description="پشتیبان ارسال ایمیل؛ مناسب Gmail و سرور SMTP سازمانی"
        enabled={isSmtpIntegrationActive(integrations)}
        onConfigure={() => onConfigure('smtp')}
      />
    </div>
  );
};

export const EmailChannelsSettingsPanel: React.FC<{
  integrations: Record<string, unknown>;
  setIntegrations: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  configView: 'resend' | 'smtp' | null;
  onBack: () => void;
  onSave: () => void | Promise<void>;
  saving?: boolean;
  backLabel?: string;
}> = ({ integrations, setIntegrations, showToast, configView, onBack, onSave, saving, backLabel }) => {
  if (!configView) return null;
  const title =
    configView === 'resend' ? 'پیکربندی Resend' : 'پیکربندی SMTP / Gmail';
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--brand-primary)] hover:opacity-80 cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
        {backLabel || 'بازگشت به یکپارچه‌سازی‌ها'}
      </button>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      <EmailChannelsSettings
        embedded
        mode={configView}
        integrations={integrations}
        setIntegrations={setIntegrations}
        showToast={showToast}
      />
      <button
        type="button"
        disabled={saving}
        onClick={() => void onSave()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
      >
        <Save className="w-4 h-4" />
        ذخیره
      </button>
    </div>
  );
};
