import React, { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { getRoleMeta } from "../../constants/rbac";
import { OrgLogoBadge } from "../common/OrgLogoBadge";
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Shield,
  Save,
  KeyRound,
  Calendar,
} from "lucide-react";

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    currentOrg,
    userRole,
    isAuthenticated,
    openAuthModal,
    updateCurrentUser,
    showToast,
  } = useApp();

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name || "");
    setDepartment(currentUser.department || "");
    setJobTitle(currentUser.jobTitle || "");
    setPhone(currentUser.phone || "");
  }, [currentUser]);

  const roleMeta = getRoleMeta(userRole);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!name.trim()) {
      showToast("نام و نام خانوادگی الزامی است.", "error");
      return;
    }
    setIsSaving(true);
    try {
      updateCurrentUser({
        name: name.trim(),
        department: department.trim(),
        jobTitle: jobTitle.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      showToast("اطلاعات پروفایل ذخیره شد.", "success");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="dark-surface-card rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl brand-icon-tile brand-icon-tile--lg">
          <User className="w-7 h-7" />
        </div>
        <h1 className="text-lg font-black text-slate-900 dark:text-white">
          پروفایل کاربری
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          برای مشاهده و ویرایش اطلاعات شخصی، ابتدا وارد حساب کاربری شوید.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal("login")}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0F786E] hover:bg-[#0D6B63] cursor-pointer"
        >
          ورود به سیستم
        </button>
      </div>
    );
  }

  const createdLabel = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString("fa-IR")
    : "—";
  const lastLoginLabel = currentUser.lastLogin
    ? new Date(currentUser.lastLogin).toLocaleDateString("fa-IR")
    : "—";

  return (
    <div className="space-y-6 max-w-3xl" id="profile-view">
      <div className="dark-surface-card rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#0F786E] to-emerald-500 text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-md">
          {name.charAt(0) || "?"}
        </div>
        <div className="flex-1 text-center sm:text-right space-y-2 min-w-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {name}
          </h2>
          <p
            className="text-sm text-slate-500 dark:text-slate-400 font-mono"
            dir="ltr"
          >
            {currentUser.email}
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${roleMeta.badgeClass}`}
            >
              {roleMeta.titleFa}
            </span>
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                currentUser.status === "active"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              }`}
            >
              {currentUser.status === "active" ? "حساب فعال" : "معلق"}
            </span>
          </div>
        </div>
        {currentOrg && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/80 dark:border-[#334155] shrink-0">
            <OrgLogoBadge
              size="sm"
              logo={currentOrg.logo}
              name={currentOrg.name}
            />
            <div className="text-right min-w-0">
              <div className="text-[10px] text-slate-400">سازمان</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[8rem]">
                {currentOrg.name}
              </div>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSave}
        className="dark-surface-card rounded-3xl p-5 sm:p-6 space-y-6"
      >
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-[#0F786E]" />
          اطلاعات شخصی
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              نام و نام خانوادگی
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F786E]/40"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              ایمیل (غیرقابل تغییر)
            </span>
            <input
              value={currentUser.email}
              readOnly
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] text-slate-500 cursor-not-allowed"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              شماره تماس
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              placeholder="09xxxxxxxxx"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F786E]/40"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              واحد / دپارتمان
            </span>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F786E]/40"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              عنوان شغلی
            </span>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F786E]/40"
            />
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#10B981] hover:bg-[#0D6B63] disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "در حال ذخیره…" : "ذخیره تغییرات"}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="dark-surface-card rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#0F786E]" />
            امنیت حساب
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            برای تغییر رمز عبور از گزینه «فراموشی رمز» در صفحه ورود استفاده
            کنید.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal("forgot")}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0F786E] dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            بازنشانی رمز عبور
          </button>
        </div>

        <div className="dark-surface-card rounded-2xl p-5 space-y-3 text-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0F786E]" />
            سوابق حساب
          </h3>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">تاریخ عضویت</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {createdLabel}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">آخرین ورود</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {lastLoginLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
