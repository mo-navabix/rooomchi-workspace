import React from 'react';
import { Settings2 } from 'lucide-react';
import type { IntegrationCatalogId } from '../integrations/integrationCatalog';
import { queueIntegrationConfigView } from '../integrations/integrationNavigation';
import type { ActiveTab } from '../../types';

export const IntegrationConnectHint: React.FC<{
  integrationId: IntegrationCatalogId;
  label: string;
  configured: boolean;
  setActiveTab: (tab: ActiveTab) => void;
}> = ({ integrationId, label, configured, setActiveTab }) => (
  <div
    className={`rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${
      configured
        ? 'border-emerald-200/80 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
        : 'border-amber-200/80 bg-amber-50/80 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'
    }`}
  >
    <p className="font-bold mb-1">{configured ? 'اتصال برقرار است' : 'اتصال پیکربندی نشده'}</p>
    <p className="mb-2 opacity-90">
      {label} — کلید API و توکن در بخش یکپارچه‌سازی ذخیره می‌شود.
    </p>
    <button
      type="button"
      className="inline-flex items-center gap-1.5 font-bold text-[var(--brand-primary)] cursor-pointer"
      onClick={() => {
        queueIntegrationConfigView(integrationId);
        setActiveTab('admin-settings-integrations');
      }}
    >
      <Settings2 className="w-3.5 h-3.5" />
      پیکربندی در یکپارچه‌سازی
    </button>
  </div>
);
