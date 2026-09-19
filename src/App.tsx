import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Toast } from './components/common/Toast';
import { LandingView } from './components/landing/LandingView';
import { DashboardView } from './components/dashboard/DashboardView';
import { RoomBrowser } from './components/booking/RoomBrowser';
import { MyBookingsView } from './components/booking/MyBookingsView';
import { AdminRoomsView } from './components/admin/AdminRoomsView';
import { AdminBookingsView } from './components/admin/AdminBookingsView';
import { AdminRbacView } from './components/admin/AdminRbacView';
import { AdminSettingsView } from './components/admin/AdminSettingsView';
import { BookingModal } from './components/booking/BookingModal';
import { OrgProvisioningModal } from './components/onboarding/OrgProvisioningModal';
import { AuthModal } from './components/auth/AuthModal';
import { AppLoadingSkeleton } from './components/common/Skeletons';
import {
  Sparkles,
  ShieldCheck,
  KeyRound,
  Layers,
  HeartHandshake,
  Building2,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    activeTab,
    currentOrg,
    isLoading,
    openProvisioningModal,
    openAuthModal,
    isAuthenticated,
    viewMode,
    setViewMode,
  } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0A0F1D] text-slate-900 dark:text-slate-100 font-sans transition-colors overflow-x-clip w-full max-w-full">
      {viewMode === 'landing' ? (
        // Dedicated Standalone Landing Page View
        <LandingView />
      ) : (
        // Enterprise Meeting Rooms Portal View
        <>
          {/* Main App Portal Header */}
          <Header />

          {/* Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {isLoading ? (
              <AppLoadingSkeleton tab={activeTab} />
            ) : (
              <>
                {activeTab === 'dashboard' && <DashboardView />}
                {activeTab === 'rooms' && <RoomBrowser />}
                {activeTab === 'my-bookings' && <MyBookingsView />}
                {activeTab === 'admin-rooms' && <AdminRoomsView />}
                {activeTab === 'admin-bookings' && <AdminBookingsView />}
                {activeTab === 'admin-rbac' && <AdminRbacView />}
                {activeTab === 'admin-settings' && <AdminSettingsView />}
              </>
            )}
          </main>

          {/* Enterprise Portal Footer */}
          <footer className="bg-white dark:bg-[#111A2E] border-t border-slate-200 dark:border-[#1E2E50] mt-auto py-5 sm:py-6 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Brand & Identity */}
                <div className="flex items-center gap-3 text-center sm:text-right">
                  <div className="w-8 h-8 rounded-xl bg-[#0D1B3A] dark:bg-[#2563EB] text-white flex items-center justify-center shadow-xs shrink-0">
                    <Building2 className="w-4 h-4 text-[#2563EB] dark:text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                      سامانه مدیریت هوشمند جلسات دیدار
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      سیستم رزرواسیون سازمانی چندمستاجره (Multi-Tenant)
                    </span>
                  </div>
                </div>

                {/* Quick Action Pills & Portal Links */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                  <button
                    onClick={() => setViewMode('landing')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] dark:text-[#60A5FA] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer border border-blue-200/50 dark:border-blue-900/40"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />
                    <span>صفحه معرفی و تعرفه‌ها</span>
                  </button>

                  {!isAuthenticated ? (
                    <button
                      onClick={() => openAuthModal('login')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0A0F1D] text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-[#16243F] transition-colors cursor-pointer border border-slate-200/60 dark:border-[#1E2E50]"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>ورود پرسنل</span>
                    </button>
                  ) : (
                    <button
                      onClick={openProvisioningModal}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer border border-emerald-200/50 dark:border-emerald-900/40"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>سازمان جدید</span>
                    </button>
                  )}

                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0A0F1D] px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-[#1E2E50]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    نسخه ۳.۰
                  </span>
                </div>
              </div>

              {/* Bottom Copyright and Standards Line */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#1E2E50]/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500 text-center sm:text-right">
                <div>تمامی حقوق برای سامانه یکپارچه مدیریت جلسات «دیدار» محفوظ است.</div>
                <div className="font-mono text-[10px]">Multi-Tenant Architecture • NestJS & PostgreSQL Ready</div>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Global Modals & Notifications */}
      <BookingModal />
      <OrgProvisioningModal />
      <AuthModal />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
