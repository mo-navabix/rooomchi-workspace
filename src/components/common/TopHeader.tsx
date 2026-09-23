import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { UserAvatar } from "./UserAvatar";
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  Building,
  LogIn,
} from "lucide-react";

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
    <header className="h-16 bg-white dark:bg-[#1E293B] border-b border-slate-200/80 dark:border-[#334155] px-4 sm:px-6 flex items-center justify-between gap-4 select-none transition-colors">
      {/* Search Input Bar (matching screenshot: right-aligned search with icon) */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="جستجو در جلسات، اتاق‌ها یا افراد..."
            className="w-full pl-3 pr-9 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#334155] border border-slate-200/80 dark:border-[#334155] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F786E] transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Left-side User Profile & Notification Bell (RTL left end) */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#334155] transition-colors cursor-pointer"
          title="اعلان‌ها"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 border-2 border-white dark:border-[#1E293B]" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#334155] transition-colors cursor-pointer"
          title="تغییر تم"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* User Card */}
        {isAuthenticated && currentUser ? (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-[#334155] transition-colors cursor-pointer"
            >
              <UserAvatar user={currentUser} size="sm" shape="circle" />
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {currentUser.name || "علی محمدی"}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {currentUser.department || "مدیر کل"}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-2xl shadow-xl py-2 z-30 divide-y divide-slate-100 dark:divide-[#334155]">
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
            onClick={() => openAuthModal("login")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0F786E] hover:bg-[#0D6B63] transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>ورود / ثبت‌نام</span>
          </button>
        )}
      </div>
    </header>
  );
};
