import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ROLE_DEFINITIONS } from '../../constants/rbac';
import { DidarBrandMark } from './DidarBrandMark';
import { OrgLogoBadge } from './OrgLogoBadge';
import {
  Building2,
  Calendar,
  Layers,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Plus,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
  DoorOpen,
  CalendarCheck,
  Sliders,
  LogIn,
  LogOut,
  UserPlus,
  KeyRound,
  Sun,
  Moon,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import { ActiveTab, UserRole } from '../../types';

export const Header: React.FC = () => {
  const {
    currentOrg,
    organizations,
    switchOrg,
    userRole,
    setUserRole,
    activeTab,
    setActiveTab,
    openBookingModal,
    openProvisioningModal,
    currentUser,
    isAuthenticated,
    openAuthModal,
    logout,
    can,
    theme,
    toggleTheme,
    setViewMode,
  } = useApp();

  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Modular Navigation Tabs based on RBAC permissions
  const navItems: { id: ActiveTab; label: string; icon: any; permissionCheck?: boolean }[] = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'calendar', label: 'تقویم', icon: Calendar },
    { id: 'rooms', label: 'اتاق‌ها', icon: DoorOpen },
    { id: 'my-bookings', label: 'جلسات من', icon: CalendarCheck },
    { id: 'analytics', label: 'گزارش‌ها', icon: BarChart3 },
    {
      id: 'admin-rooms',
      label: 'مدیریت اتاق‌ها',
      icon: Layers,
      permissionCheck: can('MANAGE_ROOMS'),
    },
    {
      id: 'admin-bookings',
      label: 'نظارت بر رزروها',
      icon: Calendar,
      permissionCheck: can('APPROVE_BOOKINGS'),
    },
    {
      id: 'admin-rbac',
      label: 'کاربران (RBAC)',
      icon: ShieldCheck,
      permissionCheck: can('MANAGE_USERS_ROLES'),
    },
    {
      id: 'admin-settings',
      label: 'تنظیمات',
      icon: Sliders,
      permissionCheck: can('MANAGE_ORG_SETTINGS'),
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => item.permissionCheck === undefined || item.permissionCheck === true
  );

  const currentRoleMeta = ROLE_DEFINITIONS[userRole] || ROLE_DEFINITIONS.employee;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-[#0D1B3A]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#1E2E50] shadow-sm transition-colors">
      {/* Top Bar: Brand, Tenant Selector, User & Auth Actions */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-14 sm:h-20 gap-2 sm:gap-3 w-full">
          {/* Right Brand & Organization (RTL Start) */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink">
            {/* Corporate Brand with DidarBrandMark */}
            <div
              className="cursor-pointer flex items-center gap-1 sm:gap-2.5 transition-transform hover:scale-[1.02] shrink-0"
              onClick={() => setActiveTab('dashboard')}
              title="سامانه مدیریت اتاق جلسات دیدار"
            >
              <DidarBrandMark size="md" showText={true} />
            </div>

            <span className="h-5 w-px bg-slate-200 dark:bg-[#1E2E50] hidden sm:block shrink-0"></span>

            {/* Current Organization Badge & Switcher */}
            <div className="relative shrink min-w-0">
              <button
                id="btn-org-dropdown"
                onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#111A2E] hover:bg-slate-200 dark:hover:bg-[#16243F] rounded-lg sm:rounded-xl transition-colors border border-slate-200/60 dark:border-[#1E2E50] cursor-pointer"
                title="تغییر سازمان فعال یا راه‌اندازی سازمان جدید"
              >
                <OrgLogoBadge size="sm" logo={currentOrg?.logo} name={currentOrg?.name} />
                <span className="hidden xs:inline max-w-[65px] sm:max-w-[150px] truncate text-[11px] sm:text-xs font-bold">
                  {currentOrg?.name || 'سازمان'}
                </span>
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              </button>

              {isOrgDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsOrgDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-white dark:bg-[#111A2E] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E2E50] py-2 z-30 divide-y divide-slate-100 dark:divide-[#1E2E50]">
                    <div className="px-4 py-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      سازمان‌های فعال در دیدار:
                    </div>
                    <div className="max-h-56 overflow-y-auto py-1">
                      {organizations.map((org) => (
                        <button
                          key={org.id}
                          id={`select-org-${org.id}`}
                          onClick={() => {
                            switchOrg(org.id);
                            setIsOrgDropdownOpen(false);
                          }}
                          className={`w-full text-right px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-[#16243F] transition-colors ${
                            org.id === currentOrg?.id
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 font-bold text-blue-700 dark:text-[#60A5FA]'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <OrgLogoBadge size="sm" logo={org.logo} name={org.name} />
                            <span className="truncate">{org.name}</span>
                          </div>
                          {org.id === currentOrg?.id && (
                            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                              فعال
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Onboard New Organization CTA */}
                    <div className="p-2.5">
                      <button
                        id="btn-open-provisioning-modal"
                        onClick={() => {
                          setIsOrgDropdownOpen(false);
                          openProvisioningModal();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>خرید و راه‌اندازی برای سازمان شما</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Left Actions Cluster (RTL End) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Standalone Landing Link Button (Visible on medium/large screens) */}
            <button
              onClick={() => setViewMode('landing')}
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] bg-blue-50 dark:bg-[#111A2E] hover:bg-blue-100 dark:hover:bg-[#16243F] border border-blue-200/80 dark:border-[#1E2E50] rounded-xl transition-all shadow-2xs cursor-pointer"
              title="مشاهده صفحه معرفی، مزایا و فروش دیدار"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
              <span>صفحه معرفی</span>
              <ExternalLink className="w-3 h-3 opacity-60 hidden lg:inline" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              id="btn-theme-toggle"
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-600 dark:text-amber-400 bg-slate-100 dark:bg-[#111A2E] hover:bg-slate-200 dark:hover:bg-[#16243F] transition-colors border border-slate-200/80 dark:border-[#1E2E50] cursor-pointer shrink-0"
              title={theme === 'dark' ? 'تغییر به حالت روشن (روز)' : 'تغییر به حالت تاریک (شب)'}
              aria-label="تغییر تم رنگی"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#0D1B3A]" />
              )}
            </button>

            {/* Quick Book Room Button */}
            <button
              id="btn-quick-book"
              onClick={() => openBookingModal()}
              className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-3 sm:py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg sm:rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              title="رزرو سریع اتاق جلسه"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">رزرو اتاق</span>
            </button>

            {/* Auth / Profile Area */}
            {isAuthenticated && currentUser ? (
              <div className="relative shrink-0">
                <button
                  id="btn-user-profile-menu"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-1 sm:gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-900 dark:from-blue-600 dark:to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {currentRoleMeta.titleFa}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                </button>

                {isUserDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsUserDropdownOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-white dark:bg-[#111A2E] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E2E50] py-3 z-30 divide-y divide-slate-100 dark:divide-[#1E2E50]">
                      {/* User Info Header */}
                      <div className="px-4 pb-3">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{currentUser.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono" dir="ltr">
                          {currentUser.email}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentRoleMeta.badgeClass}`}
                          >
                            {currentRoleMeta.titleFa}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0A0F1D] border border-transparent dark:border-[#1E2E50] px-2 py-0.5 rounded-md">
                            {currentUser.department}
                          </span>
                        </div>
                      </div>

                      {/* Quick RBAC Role Switcher for seamless demonstration */}
                      <div className="p-3 bg-slate-50/60 dark:bg-[#0A0F1D]/70">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                          <span>سوییچ زنده نقش (تست RBAC):</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(['super_admin', 'org_admin', 'room_manager', 'employee'] as UserRole[]).map(
                            (r) => {
                              const meta = ROLE_DEFINITIONS[r];
                              const isCur = userRole === r;
                              return (
                                <button
                                  key={r}
                                  onClick={() => {
                                    setUserRole(r);
                                    setIsUserDropdownOpen(false);
                                  }}
                                  className={`px-2 py-1.5 rounded-lg text-right text-[10px] font-bold transition-all border ${
                                    isCur
                                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                                      : 'bg-white dark:bg-[#111A2E] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#1E2E50] hover:border-slate-300 dark:hover:border-slate-600'
                                  }`}
                                >
                                  {meta.titleFa.split(' ')[0]}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>

                      {/* Menu Actions: Landing page link (especially useful on mobile) & Logout */}
                      <div className="p-1.5 divide-y divide-slate-100 dark:divide-[#1E2E50]">
                        <button
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            setViewMode('landing');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />
                          <span>صفحه معرفی و تعرفه‌های دیدار</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>خروج از حساب کاربری</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-header-login"
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>ورود</span>
                </button>
                <button
                  id="btn-header-register"
                  onClick={() => openAuthModal('register')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/60 rounded-xl transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>عضویت</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modular Navigation Bar */}
        <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2 border-t border-slate-100 dark:border-[#1E2E50] no-scrollbar w-full max-w-full scroll-smooth select-none">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#0D1B3A] dark:bg-[#2563EB] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#111A2E]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#14B8A6] dark:text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
