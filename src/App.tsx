import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/common/Header";
import { Sidebar } from "./components/common/Sidebar";
import { Toast } from "./components/common/Toast";
import { LandingView } from "./components/landing/LandingView";
import { UnifiedDashboardView } from "./components/dashboard/UnifiedDashboardView";
import { CalendarView } from "./components/calendar/CalendarView";
import { AnalyticsView } from "./components/analytics/AnalyticsView";
import { RoomBrowser } from "./components/booking/RoomBrowser";
import { MyBookingsView } from "./components/booking/MyBookingsView";
import { AdminRoomsView } from "./components/admin/AdminRoomsView";
import { AdminBookingsView } from "./components/admin/AdminBookingsView";
import { AdminRbacView } from "./components/admin/AdminRbacView";
import { AdminSettingsView } from "./components/admin/AdminSettingsView";
import {
  isAdminSettingsTab,
  sectionFromAdminSettingsTab,
} from "./features/enterprise-admin/adminSettingsTabs";
import { AdminNotificationsView } from "./components/admin/AdminNotificationsView";
import { AdminSupportTicketsView } from "./components/admin/AdminSupportTicketsView";
import { TeamsView } from "./features/teams/TeamsView";
import { UserNotificationsView } from "./components/notifications/UserNotificationsView";
import { ProfileView } from "./components/profile/ProfileView";
import { SupportTicketView } from "./components/support/SupportTicketView";
import { BookingModal } from "./components/booking/BookingModal";
import { OrgProvisioningModal } from "./components/onboarding/OrgProvisioningModal";
import { AuthModal } from "./components/auth/AuthModal";
import { OrgLoginPage } from "./components/auth/OrgLoginPage";
import { SetupWizardView } from "./components/setup/SetupWizardView";
import { AdminCampusView } from "./components/admin/AdminCampusView";
import { AdminAmenitiesView } from "./components/admin/AdminAmenitiesView";
import { isAdminRoomsTab } from "./features/room-admin/adminRoomsTabs";
import { CompleteProfileModal } from "./components/auth/CompleteProfileModal";
import { AppLoadingSkeleton } from "./components/common/Skeletons";
import { SupportChipsBar } from "./components/common/SupportChipsBar";

const MainContent: React.FC = () => {
  const { activeTab, isLoading, viewMode } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="portal-shell min-h-screen flex flex-col font-sans transition-colors overflow-x-clip w-full max-w-full">
      {viewMode === "setup" ? (
        <SetupWizardView />
      ) : viewMode === "landing" ? (
        <LandingView />
      ) : viewMode === "login" ? (
        <OrgLoginPage />
      ) : (
        // Enterprise Meeting Rooms Portal View
        <>
          <div className="flex flex-1 min-h-screen w-full">
            <Sidebar
              mobileOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />

            <div className="flex flex-1 flex-col min-w-0 min-h-screen">
              <Header onOpenSidebar={() => setSidebarOpen(true)} />
              <main
                className={`flex flex-1 flex-col w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-4 sm:pb-6 ${
                  activeTab.startsWith('admin-settings-') || isAdminRoomsTab(activeTab)
                    ? 'max-w-[90rem]'
                    : 'max-w-7xl'
                }`}
              >
                {isLoading ? (
                  <AppLoadingSkeleton tab={activeTab} />
                ) : (
                  <div
                    key={activeTab}
                    className="portal-page flex flex-1 flex-col min-h-0"
                  >
                    {activeTab === "dashboard" && <UnifiedDashboardView />}
                    {activeTab === "calendar" && <CalendarView />}
                    {activeTab === "rooms" && <RoomBrowser />}
                    {activeTab === "my-bookings" && <MyBookingsView />}
                    {activeTab === "analytics" && <AnalyticsView />}
                    {activeTab === "admin-rooms" && <AdminRoomsView />}
                {activeTab === "admin-rooms-campus" && <AdminCampusView />}
                {activeTab === "admin-rooms-amenities" && <AdminAmenitiesView />}
                    {activeTab === "admin-bookings" && <AdminBookingsView />}
                    {activeTab === "admin-rbac" && <AdminRbacView />}
                    {isAdminSettingsTab(activeTab) && (
                      <AdminSettingsView
                        section={sectionFromAdminSettingsTab(activeTab)}
                      />
                    )}
                    {activeTab === "admin-notifications" && (
                      <AdminNotificationsView />
                    )}
                    {activeTab === "admin-support-tickets" && (
                      <AdminSupportTicketsView />
                    )}
                    {activeTab === "teams" && <TeamsView />}
                    {activeTab === "notifications" && <UserNotificationsView />}
                    {activeTab === "profile" && <ProfileView />}
                    {activeTab === "support-ticket" && <SupportTicketView />}
                  </div>
                )}
              </main>

              <SupportChipsBar />
            </div>
          </div>
        </>
      )}

      {/* Global Modals & Notifications */}
      <BookingModal />
      <OrgProvisioningModal />
      <AuthModal />
      <CompleteProfileModal />
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
