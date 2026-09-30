import React from "react";
import { Calendar, CheckCheck, Sparkles } from "lucide-react";
import { useApp } from "../../context/AppContext";

export const UserNotificationsView: React.FC = () => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    setActiveTab,
  } = useApp();

  return (
    <div className="flex flex-1 flex-col min-h-0 p-4 sm:p-6 max-w-3xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">اعلان‌ها</h1>
          <p className="text-xs text-slate-500 mt-0.5">پیام‌های درون‌برنامه‌ای شما</p>
        </div>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsAsRead}
            className="text-xs text-[var(--brand-primary)] font-semibold cursor-pointer flex items-center gap-1"
          >
            <CheckCheck className="w-4 h-4" />
            خواندن همه
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111C2E] overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
        {notifications.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">اعلانی نیست</p>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                markNotificationAsRead(n.id);
                if (n.type === "meeting_booked") setActiveTab("calendar");
              }}
              className={`w-full p-4 flex gap-3 text-right cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                !n.isRead ? "bg-[rgb(var(--brand-primary-rgb)/0.06)]" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-primary-rgb)/0.12)] flex items-center justify-center text-[var(--brand-primary)] shrink-0">
                {n.type === "meeting_booked" ? (
                  <Calendar className="w-5 h-5" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</p>
                <p className="text-xs text-slate-500 mt-1">{n.message}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={clearAllNotifications}
            className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer"
          >
            پاک کردن همه
          </button>
        </div>
      )}
    </div>
  );
};
