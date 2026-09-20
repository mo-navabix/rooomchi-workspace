import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  Building,
} from 'lucide-react';

export const TopHeader: React.FC = () => {
  const {
    currentUser,
    currentOrg,
    theme,
    toggleTheme,
    logout,
    openAuthModal,
    isAuthenticated,
  } = useApp();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white dark:bg-[#111A2E] border-b border-slate-200/80 dark:border-[#1E2E50] px-4 sm:px-6 flex items-center justify-between gap-4 select-none transition-colors">
      {/* Search Input Bar (matching screenshot: right-aligned search with icon) */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="جستجو در جلسات، اتاق‌ها یا افراد..."
            className="w-full pl-3 pr-9 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#16243F] border border-slate-200/80 dark:border-[#1E2E50] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Left-side User Profile & Notification Bell (RTL left end) */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16243F] transition-colors cursor-pointer"
          title="اعلان‌ها"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 border-2 border-white dark:border-[#111A2E]" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#16243F] transition-colors cursor-pointer"
          title="تغییر تم"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Card */}
        {isAuthenticated && currentUser ? (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-[#16243F] transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4F46E5] to-indigo-400 text-white flex items-center justify-center text-xs font-black shadow-xs overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="avatar"
                  className="w-full h-full object-cover"
                  onError={(e: any) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {currentUser.name || 'علی محمدی'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {currentUser.department || 'مدیر کل'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-2xl shadow-xl py-2 z-30 divide-y divide-slate-100 dark:divide-[#1E2E50]">
                  <div className="px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                    {currentUser.name}
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>خروج از سیستم</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] transition-colors"
          >
            ورود به سیستم
          </button>
        )}
      </div>
    </header>
  );
};
