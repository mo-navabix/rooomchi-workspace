import React from 'react';
import { ChevronRight, Save } from 'lucide-react';
import type { IntegrationCatalogId } from './integrationCatalog';
import { INTEGRATION_CATALOG } from './integrationCatalog';
import { EmailChannelsSettings } from '../enterprise-admin/EmailChannelsSettings';
import { SmsIntegrationForm } from './SmsIntegrationForm';
import { TelegramIntegrationForm } from './TelegramIntegrationForm';
import { FormField, FormGrid, adminInputClass, AdminSection } from '../enterprise-admin/adminSettingsLayout';

export const IntegrationConfigPanel: React.FC<{
  configView: IntegrationCatalogId;
  integrations: Record<string, unknown>;
  setIntegrations: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onBack: () => void;
  onSave: () => void | Promise<void>;
  saving?: boolean;
  backLabel?: string;
}> = ({
  configView,
  integrations,
  setIntegrations,
  showToast,
  onBack,
  onSave,
  saving,
  backLabel,
}) => {
  const meta = INTEGRATION_CATALOG.find((i) => i.id === configView);
  const storage = (integrations.storage || {}) as Record<string, unknown>;

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
      <h3 className="text-base font-bold text-slate-900 dark:text-white">
        پیکربندی {meta?.title || configView}
      </h3>

      {configView === 'resend' || configView === 'smtp' ? (
        <EmailChannelsSettings
          embedded
          mode={configView}
          integrations={integrations}
          setIntegrations={setIntegrations}
          showToast={showToast}
        />
      ) : null}

      {configView === 'sms' ? (
        <SmsIntegrationForm
          sms={(integrations.sms || {}) as Record<string, unknown>}
          integrations={integrations}
          setIntegrations={setIntegrations}
        />
      ) : null}

      {configView === 'telegram' ? (
        <TelegramIntegrationForm
          telegram={(integrations.telegram || {}) as Record<string, unknown>}
          integrations={integrations}
          setIntegrations={setIntegrations}
        />
      ) : null}

      {configView === 'storage' ? (
        <AdminSection title="ذخیره‌سازی">
          <FormGrid cols={1}>
            <FormField label="نوع">
              <select
                className={adminInputClass}
                value={String(storage.type || 'local')}
                onChange={(e) =>
                  setIntegrations({
                    ...integrations,
                    storage: { ...storage, type: e.target.value },
                  })
                }
              >
                <option value="local">Local</option>
                <option value="s3">S3 (آینده)</option>
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
        </AdminSection>
      ) : null}

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
