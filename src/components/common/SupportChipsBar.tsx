import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Headphones, Mail, Phone, Ticket, X } from 'lucide-react';

const SUPPORT_EMAIL = 'mohammad.navabi.2025@gmail.com';
const SUPPORT_PHONE = '09908624033';

export const SupportChipsBar: React.FC = () => {
  const { setActiveTab } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="بستن منو پشتیبانی"
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-4 left-3 sm:bottom-6 sm:left-6 z-50 flex flex-col items-center gap-2 pb-[env(safe-area-inset-bottom,0px)]">
        {open && (
          <div
            className="flex flex-col items-stretch gap-1 p-2 min-w-[13.75rem] rounded-2xl bg-white/95 dark:bg-[#1E293B]/95 border border-slate-200/90 dark:border-[#334155] shadow-lg backdrop-blur-md"
            role="menu"
          >
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155]"
              dir="ltr"
              onClick={() => setOpen(false)}
            >
              <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#0F172A] flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5" />
              </span>
              <span className="flex-1 min-w-0 text-left truncate font-mono">{SUPPORT_EMAIL}</span>
            </a>
            <a
              href={`tel:${SUPPORT_PHONE.replace(/-/g, '')}`}
              className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155]"
              dir="ltr"
              onClick={() => setOpen(false)}
            >
              <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#0F172A] flex items-center justify-center shrink-0">
                <Phone className="w-3.5 h-3.5" />
              </span>
              <span className="flex-1 min-w-0 text-left truncate font-mono">{SUPPORT_PHONE}</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setActiveTab('support-ticket');
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded-xl text-[11px] font-bold text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] hover:bg-brand-soft dark:hover:bg-[rgb(var(--brand-primary-rgb)/0.15)] cursor-pointer"
              dir="ltr"
            >
              <span className="w-8 h-8 rounded-full bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] flex items-center justify-center shrink-0">
                <Ticket className="w-3.5 h-3.5" />
              </span>
              <span className="flex-1 min-w-0 text-left">ثبت تیکت</span>
            </button>
          </div>
        )}

        <button
          type="button"
          title="پشتیبانی"
          aria-label={open ? 'بستن پشتیبانی' : 'پشتیبانی'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white btn-brand dark:bg-[var(--brand-primary)] dark:hover:bg-[var(--brand-primary-light)] border border-white/20 shadow-md shadow-[rgb(var(--brand-primary-rgb)/0.2)] transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          {open ? <X className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
        </button>
      </div>
    </>
  );
};
