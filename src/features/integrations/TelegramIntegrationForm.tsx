import React from 'react';
import { ToggleSwitch } from '../../components/admin/AccessControlView';
import { FormField, FormGrid, adminInputClass } from '../enterprise-admin/adminSettingsLayout';

export const TelegramIntegrationForm: React.FC<{
  telegram: Record<string, unknown>;
  setIntegrations: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  integrations: Record<string, unknown>;
}> = ({ telegram, setIntegrations, integrations }) => {
  const enabled = telegram.enabled !== false && telegram.enabled !== 'false';
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
        <span className="text-sm font-bold">فعال‌سازی اتصال Telegram</span>
        <ToggleSwitch
          checked={enabled}
          onChange={() =>
            setIntegrations({
              ...integrations,
              telegram: { ...telegram, enabled: !enabled },
            })
          }
        />
      </div>
      <FormGrid>
        <FormField label="Bot Token" className="lg:col-span-2">
          <input
            type="password"
            className={adminInputClass}
            dir="ltr"
            autoComplete="off"
            value={String(telegram.botToken || '')}
            onChange={(e) =>
              setIntegrations({
                ...integrations,
                telegram: { ...telegram, enabled, botToken: e.target.value },
              })
            }
          />
        </FormField>
        <FormField label="Bot Username">
          <input
            className={adminInputClass}
            dir="ltr"
            placeholder="@MyBot"
            value={String(telegram.botUsername || '')}
            onChange={(e) =>
              setIntegrations({
                ...integrations,
                telegram: { ...telegram, enabled, botUsername: e.target.value },
              })
            }
          />
        </FormField>
        <FormField label="Chat / Channel ID">
          <input
            className={adminInputClass}
            dir="ltr"
            value={String(telegram.targetChatId || '')}
            onChange={(e) =>
              setIntegrations({
                ...integrations,
                telegram: { ...telegram, enabled, targetChatId: e.target.value },
              })
            }
          />
        </FormField>
        <FormField label="نوع مقصد" className="lg:col-span-2">
          <select
            className={adminInputClass}
            value={String(telegram.channelType || 'channel')}
            onChange={(e) =>
              setIntegrations({
                ...integrations,
                telegram: { ...telegram, enabled, channelType: e.target.value },
              })
            }
          >
            <option value="channel">کانال رسمی</option>
            <option value="group">سوپرگروه</option>
            <option value="direct">چت مستقیم</option>
          </select>
        </FormField>
      </FormGrid>
    </div>
  );
};
