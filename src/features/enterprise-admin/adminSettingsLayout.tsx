import React from 'react';

export const adminInputClass =
  'w-full text-base px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.35)] focus:border-transparent focus:outline-hidden';

export const AdminPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-full max-w-6xl mx-auto pb-12 min-w-0 px-0 sm:px-1" id="enterprise-admin-settings">
    {children}
  </div>
);

export const AdminPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-w-0 bg-white dark:bg-[#1a2438] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-700/80 shadow-sm overflow-hidden">
    {children}
  </div>
);

export const AdminPanelHeader: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => (
  <header className="px-6 sm:px-8 py-6 sm:py-7 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-900/30">
    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">{title}</h1>
    {subtitle && <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1.5">{subtitle}</p>}
  </header>
);

export const AdminPanelBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`px-6 sm:px-8 py-6 sm:py-8 space-y-8 ${className}`}>{children}</div>
);

export const AdminSection: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <section className="space-y-4">
    <div>
      <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h2>
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

export const FormField: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, hint, children, className }) => (
  <label className={`block space-y-2 ${className ?? ''}`}>
    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
    {children}
    {hint && <span className="block text-xs text-slate-500">{hint}</span>}
  </label>
);

export const FormGrid: React.FC<{ children: React.ReactNode; cols?: 1 | 2 }> = ({
  children,
  cols = 2,
}) => (
  <div className={cols === 2 ? 'grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6' : 'space-y-5'}>
    {children}
  </div>
);

export const AdminFormFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
    {children}
  </div>
);

export const BRAND_COLOR_PRESETS = [
  { name: 'روم‌چی', value: '#0f786e' },
  { name: 'آبی', value: '#2563eb' },
  { name: 'بنفش', value: '#7c3aed' },
  { name: 'فیروزه‌ای', value: '#0d9488' },
  { name: 'نارنجی', value: '#ea580c' },
  { name: 'سرخابی', value: '#db2777' },
  { name: 'خاکستری', value: '#475569' },
] as const;
