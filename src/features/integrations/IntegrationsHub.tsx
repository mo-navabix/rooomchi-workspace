import React from 'react';
import { INTEGRATION_CATALOG, type IntegrationCatalogId } from './integrationCatalog';
import {
  IntegrationProviderCard,
  isResendIntegrationActive,
  isSmtpIntegrationActive,
} from '../enterprise-admin/IntegrationProviderCard';
import {
  isSmsIntegrationConfigured,
  isTelegramIntegrationConfigured,
  isStorageIntegrationConfigured,
} from './integrationStatus';

const GROUP_LABELS: Record<string, string> = {
  email: 'ایمیل',
  messaging: 'پیام‌رسانی',
  storage: 'ذخیره‌سازی',
};

function isIntegrationActive(id: IntegrationCatalogId, integrations: Record<string, unknown>): boolean {
  switch (id) {
    case 'resend':
      return isResendIntegrationActive(integrations);
    case 'smtp':
      return isSmtpIntegrationActive(integrations);
    case 'sms':
      return isSmsIntegrationConfigured(integrations);
    case 'telegram':
      return isTelegramIntegrationConfigured(integrations);
    case 'storage':
      return isStorageIntegrationConfigured(integrations);
    default:
      return false;
  }
}

export const IntegrationsHub: React.FC<{
  integrations: Record<string, unknown>;
  configView: IntegrationCatalogId | null;
  onConfigure: (id: IntegrationCatalogId) => void;
}> = ({ integrations, configView, onConfigure }) => {
  if (configView) return null;

  const groups = ['email', 'messaging', 'storage'] as const;

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const items = INTEGRATION_CATALOG.filter((i) => i.group === group);
        if (!items.length) return null;
        return (
          <section key={group}>
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">
              {GROUP_LABELS[group]}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {items.map((item) => (
                <IntegrationProviderCard
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  enabled={isIntegrationActive(item.id, integrations)}
                  onConfigure={() => onConfigure(item.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
