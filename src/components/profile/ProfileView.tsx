import React, { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { ApiService } from "../../services/apiService";
import { getRoleMeta } from "../../constants/rbac";
import { OrgLogoBadge } from "../common/OrgLogoBadge";
import { UserAvatar } from "../common/UserAvatar";
import { AvatarSettings } from "./AvatarSettings";
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
  Camera,
} from "lucide-react";

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    currentOrg,
    userRole,
    isAuthenticated,
    openAuthModal,
    completeAuthLogin,
    showToast,
  } = useApp();

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarSection, setShowAvatarSection] = useState(false);

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
      const res = await ApiService.updateProfile({
        name: name.trim(),
        department: department.trim(),
        jobTitle: jobTitle.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      completeAuthLogin({ user: res.user, message: res.message });
      showToast(
        res.message || "اطلاعات پروفایل با موفقیت ذخیره شد.",
        "success",
      );
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "خطا در ذخیره پروفایل",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="dark-surface-card rounded-2xl p-6 sm:p-8 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl brand-icon-tile brand-icon-tile--lg">
          <User className="w-6 h-6" />
        </div>
        <h1 className="text-base font-bold text-slate-900 dark:text-white">
          پروفایل کاربری
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          برای مشاهده و ویرایش اطلاعات شخصی، ابتدا وارد حساب کاربری شوید.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal("login")}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white btn-brand cursor-pointer shadow-xs"
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
    : "امروز";

  return (
    <div
      className="space-y-4 max-w-3xl min-w-0 mx-auto w-full pb-8"
      id="profile-view"
    >
      {/* Compact User Header Card */}
      <div className="dark-surface-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative group shrink-0">
            <UserAvatar
              user={currentUser}
              name={name}
              size="lg"
              className="shadow-xs ring-2 ring-[rgb(var(--brand-primary-rgb)/0.20)]"
            />
            <button
              type="button"
              onClick={() => setShowAvatarSection((prev) => !prev)}
              className="absolute -bottom-1 -left-1 p-1.5 rounded-lg bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] shadow-xs border-2 border-white dark:border-[#0F172A] cursor-pointer transition-transform hover:scale-105"
              title="تغییر تصویر نمایه"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          <div className="text-right space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {name}
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleMeta.badgeClass}`}
              >
                {roleMeta.titleFa}
              </span>
            </div>

            <p
              className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate"
              dir="ltr"
            >
              {currentUser.email}
            </p>
          </div>
        </div>

        {currentOrg && (
          <div
            id="profile-org-badge"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/80 dark:border-[#334155] sm:self-center shrink-0"
          >
            <OrgLogoBadge
              size="sm"
              logo={currentOrg.logo}
              logoDark={currentOrg.settings?.logoDark}
              name={currentOrg.name}
            />
            <div className="text-right">
              <span className="block text-[10px] text-slate-400 font-medium">
                سازمان
              </span>
              <span
                className="block text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap"
                title={currentOrg.name}
              >
                {currentOrg.name}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Conditionally Expanded Compact Avatar Editor */}
      {showAvatarSection && (
        <AvatarSettings onClose={() => setShowAvatarSection(false)} />
      )}

      {/* Personal Info Form */}
      <form
        onSubmit={handleSave}
        className="dark-surface-card rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200/80 dark:border-white/10 shadow-xs"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            مشخصات کاربری و پرسنلی
          </h3>
          <span className="text-[11px] text-slate-400">
            اطلاعات هویتی جهت ثبت در جلسات
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <label className="space-y-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              نام و نام خانوادگی *
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              ایمیل سازمانی (شناسه حساب)
            </span>
            <input
              value={currentUser.email}
              readOnly
              dir="ltr"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] text-slate-500 cursor-not-allowed font-mono"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              شماره همراه
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              placeholder="09xxxxxxxxx"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              واحد / دپارتمان
            </span>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="مثال: توسعه محصول"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
            />
          </label>

          <label className="space-y-1 sm:col-span-2">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              سمت شغلی
            </span>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="مثال: سرپرست تیم فنی"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
            />
          </label>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white btn-brand disabled:opacity-60 cursor-pointer shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "در حال ثبت…" : "ذخیره تغییرات"}</span>
          </button>
        </div>
      </form>

      {/* Security & Account History in 1 Compact Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="dark-surface-card rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              امنیت حساب
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              تغییر یا بازیابی رمز عبور
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal("forgot")}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <KeyRound className="w-3 h-3" />
            <span>بازنشانی رمز</span>
          </button>
        </div>

        <div className="dark-surface-card rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              سوابق دسترسی
            </h4>
            <span className="text-[11px] text-slate-500">
              تاریخ عضویت: {createdLabel}
            </span>
          </div>
          <span className="text-[11px] font-bold text-brand dark:text-[var(--brand-primary-on-dark)] bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] px-2 py-1 rounded-md border border-brand-soft/50">
            ورود موفق
          </span>
        </div>
      </div>
    </div>
  );
};
