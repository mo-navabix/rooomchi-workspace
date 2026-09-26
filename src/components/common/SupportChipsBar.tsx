import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Headphones, Mail, Phone, Ticket, X } from 'lucide-react';

const SUPPORT_EMAIL = 'support@rooomchi.ir';
const SUPPORT_PHONE = '021-9100-0000';

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
            className="flex flex-col items-stretch gap-1.5 p-2 rounded-2xl bg-white/95 dark:bg-[#1E293B]/95 border border-slate-200/90 dark:border-[#334155] shadow-lg backdrop-blur-md"
            role="menu"
          >
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] whitespace-nowrap"
              dir="ltr"
              onClick={() => setOpen(false)}
            >
              <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#0F172A] flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5" />
              </span>
              {SUPPORT_EMAIL}
            </a>
            <a
              href={`tel:${SUPPORT_PHONE.replace(/-/g, '')}`}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] whitespace-nowrap"
              dir="ltr"
              onClick={() => setOpen(false)}
            >
              <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#0F172A] flex items-center justify-center shrink-0">
                <Phone className="w-3.5 h-3.5" />
              </span>
              {SUPPORT_PHONE}
            </a>
            <button
              type="button"
              onClick={() => {
                setActiveTab('support-ticket');
                setOpen(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[10px] font-bold text-[#0F786E] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 whitespace-nowrap cursor-pointer"
            >
              <span className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Ticket className="w-3.5 h-3.5" />
              </span>
              ثبت تیکت
            </button>
          </div>
        )}

        <button
          type="button"
          title="پشتیبانی"
          aria-label={open ? 'بستن پشتیبانی' : 'پشتیبانی'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white bg-[#0F786E] hover:bg-[#0D6B63] dark:bg-emerald-600 dark:hover:bg-emerald-500 border border-white/20 shadow-md shadow-emerald-900/20 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          {open ? <X className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
        </button>
      </div>
    </>
  );
};
