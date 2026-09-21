import React from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from './Logo';
import { Sparkles } from 'lucide-react';

export const PortalFooter: React.FC = () => {
  const { setViewMode, showToast } = useApp();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200/80 dark:border-[#26364D] bg-white/80 dark:bg-[#111C2E]/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
          <div className="md:col-span-4 space-y-3 text-center md:text-right">
            <Logo variant="horizontal" size="sm" showTagline={false} className="mx-auto md:mx-0 md:mr-0" />
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto md:mx-0">
              سامانه یکپارچه رزرو اتاق جلسه و مدیریت فضاهای کاری برای تیم‌های سازمانی.
            </p>
          </div>

          <div className="md:col-span-4 space-y-3 text-center md:text-right">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">دسترسی سریع</h3>
            <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => setViewMode('landing')}
                  className="inline-flex items-center gap-1.5 hover:text-[#0F786E] dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  صفحه معرفی دیدار
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => showToast('راهنمای کاربری به‌زودی منتشر می‌شود.', 'info')}
                  className="hover:text-[#0F786E] dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  راهنمای استفاده
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => showToast('نسخه ۳.۰ — پایدار', 'info')}
                  className="hover:text-[#0F786E] dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  تاریخچه نسخه‌ها
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3 text-center md:text-right">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">تماس با ما</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              اطلاعات پشتیبانی در نوار چیپس پایین صفحه در دسترس است.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-slate-100 dark:border-[#334155]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 dark:text-slate-500">
          <span>© {year} دیدار — تمامی حقوق محفوظ است.</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            سرویس فعال · نسخه ۳.۰
          </span>
        </div>
      </div>
    </footer>
  );
};
