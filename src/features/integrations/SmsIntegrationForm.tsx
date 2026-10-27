import React from 'react';
import { ToggleSwitch } from '../../components/admin/AccessControlView';
import { FormField, FormGrid, adminInputClass } from '../enterprise-admin/adminSettingsLayout';
import { SMS_PROVIDERS } from '../../constants/notifications';

export const SmsIntegrationForm: React.FC<{
  sms: Record<string, unknown>;
  setIntegrations: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  integrations: Record<string, unknown>;
}> = ({ sms, setIntegrations, integrations }) => {
  const enabled = sms.enabled !== false && sms.enabled !== 'false';
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
        <span className="text-sm font-bold">فعال‌سازی اتصال SMS</span>
        <ToggleSwitch
          checked={enabled}
          onChange={() =>
            setIntegrations({
              ...integrations,
              sms: { ...sms, enabled: !enabled },
            })
          }
        />
      </div>
      <FormGrid>
        <FormField label="سرویس‌دهنده" className="lg:col-span-2">
          <select
            className={adminInputClass}
            value={String(sms.provider || 'kavenegar')}
            onChange={(e) =>
              setIntegrations({
                ...integrations,
                sms: { ...sms, enabled, provider: e.target.value },
              })
            }
          >
            {SMS_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="API Key / Token" className="lg:col-span-2">
          <input
            type="password"
            className={adminInputClass}
            dir="ltr"
            autoComplete="off"
            value={String(sms.apiKey || '')}
            onChange={(e) =>
              setIntegrations({
                ...integrations,
                sms: { ...sms, enabled, apiKey: e.target.value },
              })
            }
          />
        </FormField>
        <FormField label="شماره خط / Sender">
          <input
            className={adminInputClass}
            dir="ltr"
            value={String(sms.lineNumber || '')}
            onChange={(e) =>
              setIntegrations({
                ...integrations,
                sms: { ...sms, enabled, lineNumber: e.target.value },
              })
            }
          />
        </FormField>
        <FormField label="موبایل مدیر (تست)">
          <input
            className={adminInputClass}
            dir="ltr"
            value={String(sms.managerPhone || '')}
            onChange={(e) =>
              setIntegrations({
                ...integrations,
                sms: { ...sms, enabled, managerPhone: e.target.value },
              })
            }
          />
        </FormField>
      </FormGrid>
    </div>
  );
};
