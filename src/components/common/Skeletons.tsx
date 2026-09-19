import React from 'react';

/**
 * Base Shimmer Skeleton Element
 */
export const Skeleton: React.FC<{
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
}> = ({ className = '', rounded = 'xl' }) => {
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-[#16243F]/80 relative overflow-hidden ${roundedClass} ${className}`}
    >
      {/* Shimmer gradient effect for realistic fluid loading */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
    </div>
  );
};

/**
 * 1. Dashboard Skeleton Loader
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 select-none" id="dashboard-skeleton">
      {/* Welcome Banner Skeleton */}
      <div className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2.5 w-full max-w-md">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Skeleton className="h-10 w-32" rounded="xl" />
          <Skeleton className="h-10 w-28" rounded="xl" />
        </div>
      </div>

      {/* 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-2xl p-5 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="w-10 h-10" rounded="xl" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Today's Meetings & Quick Room Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Column (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-56" />
            </div>
            <Skeleton className="h-8 w-24" rounded="lg" />
          </div>

          {/* List of meeting cards */}
          <div className="space-y-3.5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="p-4 rounded-2xl border border-slate-100 dark:border-[#1E2E50]/60 bg-slate-50/70 dark:bg-[#0D1527] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <Skeleton className="w-12 h-12" rounded="2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-44" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-7 w-20" rounded="full" />
                  <Skeleton className="h-8 w-20" rounded="xl" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room Availability Column (1 col) */}
        <div className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-12" />
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl border border-slate-100 dark:border-[#1E2E50]/60 bg-slate-50/70 dark:bg-[#0D1527] flex items-center justify-between"
              >
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16" rounded="full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 2. Room Browser (سالن‌ها و اتاق‌های جلسات) Skeleton Loader
 */
export const RoomBrowserSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 select-none" id="room-browser-skeleton">
      {/* Top Filter & Search Bar */}
      <div className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <Skeleton className="h-11 w-full md:w-80" rounded="2xl" />

          {/* Action / Date Selector */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Skeleton className="h-10 w-36" rounded="xl" />
            <Skeleton className="h-10 w-28" rounded="xl" />
          </div>
        </div>

        {/* Filter Chips (Capacity, Features, Buildings) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-100 dark:border-[#1E2E50]/60">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-8 w-24 shrink-0" rounded="full" />
          ))}
        </div>
      </div>

      {/* Rooms Grid Skeleton (6 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-3xl overflow-hidden shadow-xs space-y-4 flex flex-col"
          >
            {/* Image Placeholder */}
            <div className="relative h-48 w-full">
              <Skeleton className="w-full h-full rounded-none" />
              <div className="absolute top-3 right-3">
                <Skeleton className="h-6 w-20" rounded="full" />
              </div>
              <div className="absolute top-3 left-3">
                <Skeleton className="h-6 w-16" rounded="full" />
              </div>
            </div>

            {/* Room Info */}
            <div className="p-5 pt-0 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-3/4" />

                {/* Equipment Tags */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <Skeleton className="h-5 w-16" rounded="md" />
                  <Skeleton className="h-5 w-20" rounded="md" />
                  <Skeleton className="h-5 w-14" rounded="md" />
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#1E2E50]/60 flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-28" rounded="xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 3. My Bookings (رزروهای من) Skeleton Loader
 */
export const MyBookingsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 select-none" id="my-bookings-skeleton">
      {/* Top Header & Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-2xl p-4 shadow-xs flex items-center justify-between"
          >
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="w-10 h-10" rounded="xl" />
          </div>
        ))}
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" rounded="xl" />
          <Skeleton className="h-9 w-24" rounded="xl" />
          <Skeleton className="h-9 w-24" rounded="xl" />
        </div>
        <Skeleton className="h-9 w-full sm:w-60" rounded="xl" />
      </div>

      {/* Booking Cards List */}
      <div className="space-y-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              {/* Date Box */}
              <Skeleton className="w-14 h-14 shrink-0" rounded="2xl" />

              {/* Meeting Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-5 w-20" rounded="full" />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <Skeleton className="h-9 w-24" rounded="xl" />
              <Skeleton className="h-9 w-20" rounded="xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 4. Admin Rooms (مدیریت سالن‌ها) Skeleton Loader
 */
export const AdminRoomsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 select-none" id="admin-rooms-skeleton">
      {/* Top Controls */}
      <div className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Skeleton className="h-10 w-64" rounded="xl" />
          <Skeleton className="h-10 w-32" rounded="xl" />
        </div>
        <Skeleton className="h-10 w-40" rounded="xl" />
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-3xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-[#1E2E50] flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-100 dark:divide-[#1E2E50]/60">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10" rounded="xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>

              <Skeleton className="h-4 w-20 hidden md:block" />
              <Skeleton className="h-4 w-16 hidden md:block" />
              <Skeleton className="h-6 w-20" rounded="full" />

              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8" rounded="lg" />
                <Skeleton className="w-8 h-8" rounded="lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * 5. Admin Bookings (مدیریت تمامی رزروها) Skeleton Loader
 */
export const AdminBookingsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 select-none" id="admin-bookings-skeleton">
      {/* Top Filter Strip */}
      <div className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Skeleton className="h-10 w-full sm:w-64" rounded="xl" />
          <Skeleton className="h-10 w-32" rounded="xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" rounded="xl" />
          <Skeleton className="h-9 w-24" rounded="xl" />
          <Skeleton className="h-9 w-24" rounded="xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-3xl overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-100 dark:divide-[#1E2E50]/60">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9" rounded="full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>

              <div className="space-y-1 hidden sm:block">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>

              <Skeleton className="h-4 w-24 hidden md:block" />
              <Skeleton className="h-6 w-20" rounded="full" />

              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16" rounded="lg" />
                <Skeleton className="h-8 w-16" rounded="lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * 6. Admin RBAC (کاربران و سطوح دسترسی) Skeleton Loader
 */
export const AdminRbacSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 select-none" id="admin-rbac-skeleton">
      {/* 4 Role Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-2xl p-4 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="w-8 h-8" rounded="lg" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>

      {/* Top Filter and Add Member Button */}
      <div className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <Skeleton className="h-10 w-full sm:w-80" rounded="xl" />
        <Skeleton className="h-10 w-40" rounded="xl" />
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-3xl overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-100 dark:divide-[#1E2E50]/60">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10" rounded="full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>

              <Skeleton className="h-6 w-24 hidden md:block" rounded="full" />
              <Skeleton className="h-4 w-28 hidden lg:block" />

              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-24" rounded="lg" />
                <Skeleton className="w-8 h-8" rounded="lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * 7. Admin Settings (تنظیمات سامانه) Skeleton Loader
 */
export const AdminSettingsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 select-none" id="admin-settings-skeleton">
      {/* Tabs */}
      <div className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-2xl p-2 shadow-xs flex items-center gap-2">
        <Skeleton className="h-9 w-28" rounded="xl" />
        <Skeleton className="h-9 w-32" rounded="xl" />
        <Skeleton className="h-9 w-32" rounded="xl" />
        <Skeleton className="h-9 w-28" rounded="xl" />
      </div>

      {/* Settings Form Card */}
      <div className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-3xl p-6 shadow-xs space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-80" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-10 w-full" rounded="xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-10 w-full" rounded="xl" />
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-[#1E2E50]/60">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#0D1527]">
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="w-12 h-6" rounded="full" />
            </div>
          ))}
        </div>

        <div className="pt-4 flex justify-end">
          <Skeleton className="h-10 w-32" rounded="xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * 8. Universal Tab-Aware App Loading Skeleton
 */
export const AppLoadingSkeleton: React.FC<{ tab: string }> = ({ tab }) => {
  switch (tab) {
    case 'dashboard':
      return <DashboardSkeleton />;
    case 'rooms':
      return <RoomBrowserSkeleton />;
    case 'my-bookings':
      return <MyBookingsSkeleton />;
    case 'admin-rooms':
      return <AdminRoomsSkeleton />;
    case 'admin-bookings':
      return <AdminBookingsSkeleton />;
    case 'admin-rbac':
      return <AdminRbacSkeleton />;
    case 'admin-settings':
      return <AdminSettingsSkeleton />;
    default:
      return <DashboardSkeleton />;
  }
};
