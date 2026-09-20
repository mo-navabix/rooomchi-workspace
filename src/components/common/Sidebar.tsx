import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Calendar,
  DoorOpen,
  CalendarCheck,
  Users,
  BarChart3,
  Sliders,
  Plus,
  ShieldCheck,
  Building,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { DidarBrandMark } from './DidarBrandMark';
import { OrgLogoBadge } from './OrgLogoBadge';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentOrg,
    openBookingModal,
    setViewMode,
  } = useApp();

  // Navigation Items exactly matching the UI image
  const menuItems: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'calendar', label: 'تقویم', icon: Calendar },
    { id: 'rooms', label: 'اتاق‌ها', icon: DoorOpen },
    { id: 'admin-rbac', label: 'کاربران', icon: Users },
    { id: 'analytics', label: 'گزارش‌ها', icon: BarChart3 },
    { id: 'admin-settings', label: 'تنظیمات', icon: Sliders },
  ];

  return (
    <aside
      id="portal-sidebar"
      className="w-56 shrink-0 bg-white dark:bg-[#111A2E] border-l border-slate-200/80 dark:border-[#1E2E50] min-h-screen flex flex-col justify-between py-6 px-3 select-none transition-colors"
    >
      {/* Top Brand & Menu List */}
      <div className="space-y-6">
        {/* Brand Header: Exact Didar Logo */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 px-3 cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <DidarBrandMark size="md" showText={true} />
        </div>

        {/* Primary Action Button: + رزرو جلسه (Purple matching UI design) */}
        <div className="px-1">
          <button
            id="sidebar-btn-booking"
            onClick={() => openBookingModal()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-bold text-xs text-white bg-[#4F46E5] hover:bg-[#4338CA] shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>رزرو جلسه</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-300 font-black shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#16243F]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#4F46E5] dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Tenant Footer Card (سازمان: پلنیک آسمان) */}
      <div className="pt-4 border-t border-slate-100 dark:border-[#1E2E50]/60 space-y-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-[#16243F] border border-slate-200/60 dark:border-[#1E2E50]">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-[#4F46E5] flex items-center justify-center text-xs shrink-0 font-black">
            🏢
          </div>
          <div className="flex flex-col text-right overflow-hidden">
            <span className="text-[10px] text-slate-400 font-medium">سازمان فعال:</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {currentOrg?.name || 'پلنیک آسمان'}
            </span>
          </div>
        </div>

        {/* Back to Landing Page Button */}
        <button
          onClick={() => setViewMode('landing')}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-[#4F46E5] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
          <span>صفحه معرفی دیدار</span>
        </button>
      </div>
    </aside>
  );
};
