import React from 'react';
import { Settings2 } from 'lucide-react';

export const IntegrationProviderCard: React.FC<{
  title: string;
  description: string;
  enabled: boolean;
  onConfigure: () => void;
}> = ({ title, description, enabled, onConfigure }) => (
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

export function isResendIntegrationActive(integrations: Record<string, unknown>): boolean {
  const resend = (integrations.resend || {}) as Record<string, unknown>;
  if (resend.enabled === false || resend.enabled === 'false') return false;
  return Boolean(String(resend.apiKey || '').trim() && String(resend.fromEmail || '').trim());
}

export function isSmtpIntegrationActive(integrations: Record<string, unknown>): boolean {
  const smtp = (integrations.smtp || {}) as Record<string, unknown>;
  if (smtp.enabled === false || smtp.enabled === 'false') return false;
  return Boolean(String(smtp.host || '').trim() && String(smtp.fromEmail || '').trim());
}
