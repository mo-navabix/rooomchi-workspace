import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  UserCheck,
  AlertTriangle,
  X,
  Building2,
  Phone,
  User,
  Briefcase,
  ArrowLeft,
  DoorOpen,
} from "lucide-react";

export const CompleteProfileModal: React.FC = () => {
  const {
    isCompleteProfileModalOpen,
    closeCompleteProfileModal,
    completeRegistration,
    currentUser,
    currentOrg,
    pendingRoomForBooking,
  } = useApp();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const departments = currentOrg?.departments && currentOrg.departments.length > 0
    ? currentOrg.departments
    : ["فنی و مهندسی", "محصول و طراحی", "مارکتینگ و فروش", "منابع انسانی", "مالی و اداری", "عمومی"];

  useEffect(() => {
    if (isCompleteProfileModalOpen && currentUser) {
      // Pre-populate existing info if any
      const initialName =
        currentUser.name && currentUser.name !== currentUser.email.split("@")[0]
          ? currentUser.name
          : "";
      setName(initialName);
      setPhone(currentUser.phone || "");
      setDepartment(currentUser.department || departments[0]);
      setJobTitle(currentUser.jobTitle || "");
      setErrorMsg("");
    }
  }, [isCompleteProfileModalOpen, currentUser]);

  if (!isCompleteProfileModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("لطفاً نام و نام خانوادگی خود را وارد کنید");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("لطفاً شماره تماس / همراه خود را وارد کنید");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      await completeRegistration({
        name: name.trim(),
        phone: phone.trim(),
        department: department || departments[0],
        jobTitle: jobTitle.trim() || undefined,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "خطا در ثبت اطلاعات کاربری");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#334155] overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                تکمیل ثبت‌نام و مشخصات کاربری
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                برای رزرو سالن و ثبت رسمی جلسات سازمانی
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCompleteProfileModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Alert Banner */}
        <div className="p-5 pb-0">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <p className="font-bold mb-1">
                ثبت‌نام اولیه شما با ایمیل با موفقیت انجام شده است
              </p>
              <p className="text-amber-800 dark:text-amber-300/90 text-[11px]">
                اما طبق سیاست رزرو سالن‌ها، جهت درج نام برگزارکننده در تقویم و هماهنگی امکانات، لطفاً اطلاعات تکمیلی زیر را کامل کنید.
              </p>
            </div>
          </div>

          {/* Pending room indicator if triggered from room card */}
          {pendingRoomForBooking && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.12)] border border-brand-soft/70 dark:border-[rgb(var(--brand-primary-rgb)/0.35)]/40 flex items-center justify-between text-xs text-brand dark:text-[var(--brand-primary-on-dark)]">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-brand dark:text-[var(--brand-primary-on-dark)]" />
                <span>اتاق انتخابی شما:</span>
                <span className="font-bold">{pendingRoomForBooking.name}</span>
              </div>
              <span className="text-[10px] text-brand dark:text-[var(--brand-primary-on-dark)]">
                (پس از ثبت، فرم رزرو باز می‌شود)
              </span>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* User Email (Read-only) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              ایمیل سازمانی (ثبت‌شده با کد تأیید)
            </label>
            <input
              type="text"
              readOnly
              value={currentUser?.email || ""}
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-mono select-none"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              نام و نام خانوادگی <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: سارا محمدی"
                className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.20)] focus:border-[var(--brand-primary)]"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              شماره تلفن همراه <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912xxxxxxx"
                className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 text-right focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.20)] focus:border-[var(--brand-primary)]"
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              جهت ارسال پیامک یادآوری و هماهنگی ورود مهمانان
            </p>
          </div>

          {/* Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                واحد سازمانی / دپارتمان <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.20)] focus:border-[var(--brand-primary)]"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                سمت شغلی <span className="text-slate-400 text-[10px]">(اختیاری)</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="مثال: مدیر فنی"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.20)] focus:border-[var(--brand-primary)]"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeCompleteProfileModal}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              بعداً تکمیل می‌کنم
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white btn-brand disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>در حال ثبت...</span>
                </>
              ) : (
                <>
                  <span>ثبت نهایی و ادامه</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
