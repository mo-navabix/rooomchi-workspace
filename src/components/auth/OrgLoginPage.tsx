import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { OrgLogoBadge } from "../common/OrgLogoBadge";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  Moon,
  Sun,
  UserPlus,
} from "lucide-react";
import { navigateToAppHome } from "../../utils/appNavigation";
import { ApiService } from "../../services/apiService";
import type { OrganizationAuthSettingsPublic } from "../../types/orgAuth";

export const OrgLoginPage: React.FC = () => {
  const {
    login,
    completeAuthLogin,
    loginWithGoogle,
    openAuthModal,
    goToLanding,
    organizations,
    currentOrg,
    switchOrg,
    theme,
    toggleTheme,
    showToast,
    isAuthenticated,
    setViewMode,
  } = useApp();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orgAuth, setOrgAuth] = useState<OrganizationAuthSettingsPublic | null>(null);
  const [authMode, setAuthMode] = useState<"local" | "ldap">("local");
  const [ldapUsername, setLdapUsername] = useState("");
  const [ldapPassword, setLdapPassword] = useState("");

  useEffect(() => {
    const orgId = currentOrg?.id;
    if (!orgId) {
      setOrgAuth(null);
      return;
    }
    ApiService.getOrganizationAuthSettings(orgId)
      .then(setOrgAuth)
      .catch(() =>
        setOrgAuth({
          organizationId: orgId,
          localEnabled: true,
          ldapEnabled: false,
          googleEnabled: false,
          authPolicies: { selfRegistrationEnabled: true, emailVerificationRequired: false },
          ldap: null,
          google: null,
        }),
      );
  }, [currentOrg?.id]);

  useEffect(() => {
    if (!orgAuth) return;
    if (!orgAuth.localEnabled && orgAuth.ldapEnabled) setAuthMode("ldap");
    if (orgAuth.localEnabled) setAuthMode("local");
  }, [orgAuth?.localEnabled, orgAuth?.ldapEnabled]);

  const orgOptions = useMemo(
    () =>
      organizations.map((o) => ({
        id: o.id,
        label: o.name,
        value: o.slug || o.id,
      })),
    [organizations],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setViewMode("app");
      navigateToAppHome(true);
    }
  }, [isAuthenticated, setViewMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!loginEmail.trim() || !loginEmail.includes("@")) {
      setErrorMessage("لطفاً یک ایمیل معتبر وارد کنید.");
      return;
    }
    if (!loginPassword) {
      setErrorMessage("رمز عبور را وارد کنید.");
      return;
    }
    try {
      setIsSubmitting(true);
      await login({
        email: loginEmail.trim(),
        password: loginPassword,
        organizationSlug: currentOrg?.slug,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "خطا در ورود به سامانه";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onOrgChange = (orgKey: string) => {
    const matched = organizations.find(
      (o) => o.id === orgKey || o.slug === orgKey,
    );
    if (matched) {
      switchOrg(matched.id);
      showToast(`سازمان «${matched.name}» انتخاب شد`, "info");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-[#F8FAF9] dark:bg-[#0b1220] text-slate-900 dark:text-slate-100"
      dir="rtl"
    >
      <main className="flex-1 flex items-center justify-center min-h-screen p-4 sm:p-8">
        <div className="w-full max-w-[920px] grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-700/70 shadow-xl bg-white dark:bg-[#1a2438]">
          <div
            className="hidden lg:flex flex-col justify-between p-8 sm:p-10 text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(145deg, var(--brand-primary) 0%, var(--brand-primary-hover) 55%, var(--brand-primary-light) 100%)`,
            }}
          >
            <div className="relative z-10 space-y-6">
              {currentOrg ? (
                <div className="flex items-center gap-3">
                  <OrgLogoBadge
                    logo={currentOrg.logo}
                    logoDark={currentOrg.settings?.logoDark}
                    name={currentOrg.name}
                    size="lg"
                  />
                  <div>
                    <p className="text-xs text-white/75 font-medium">ورود پرسنل</p>
                    <h2 className="text-lg font-bold">{currentOrg.name}</h2>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-white/90">
                  <Building2 className="w-5 h-5" />
                  <span className="text-sm font-semibold">پورتال سازمانی روم‌چی</span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-black leading-snug">
                  ورود به سامانه
                  <br />
                  رزرو اتاق جلسه
                </h1>
                <p className="text-sm text-white/85 mt-3 leading-relaxed max-w-sm">
                  از این صفحه وارد پورتال سازمان خود شوید. صفحه معرفی روم‌چی فقط
                  برای آشنایی با محصول است و ورود از آن انجام نمی‌شود.
                </p>
              </div>
            </div>
            <p className="relative z-10 text-[11px] text-white/70">
              پشتیبانی: support@rooomchi.ir
            </p>
            <div
              className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/10 blur-2xl"
              aria-hidden
            />
          </div>

          <div className="relative p-6 sm:p-8 lg:p-10 pt-14 sm:pt-14">
            <button
              type="button"
              onClick={toggleTheme}
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/80 dark:border-slate-600/80 cursor-pointer transition-colors"
              aria-label="تغییر تم"
              title={theme === "dark" ? "تم روشن" : "تم تاریک"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => goToLanding()}
              className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-[var(--brand-primary)] dark:hover:text-[var(--brand-primary-on-dark)] cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              صفحه معرفی
            </button>

            <div className="lg:hidden mb-6 flex items-center gap-3">
              {currentOrg ? (
                <>
                  <OrgLogoBadge
                    logo={currentOrg.logo}
                    logoDark={currentOrg.settings?.logoDark}
                    name={currentOrg.name}
                    size="md"
                  />
                  <div>
                    <p className="text-[11px] text-slate-500">سازمان</p>
                    <p className="text-sm font-bold">{currentOrg.name}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  ورود پرسنل سازمان
                </p>
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {authMode === "ldap" ? "ورود با حساب سازمانی" : "ورود با ایمیل سازمانی"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              روش‌های ورود بر اساس تنظیمات سازمان شما نمایش داده می‌شود.
            </p>

            {orgAuth && (orgAuth.localEnabled || orgAuth.ldapEnabled) && (
              <div className="flex gap-2 mb-4">
                {orgAuth.localEnabled && (
                  <button
                    type="button"
                    onClick={() => setAuthMode("local")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                      authMode === "local"
                        ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                        : "border-slate-200 dark:border-slate-700 text-slate-500"
                    }`}
                  >
                    ایمیل و رمز
                  </button>
                )}
                {orgAuth.ldapEnabled && (
                  <button
                    type="button"
                    onClick={() => setAuthMode("ldap")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                      authMode === "ldap"
                        ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                        : "border-slate-200 dark:border-slate-700 text-slate-500"
                    }`}
                  >
                    LDAP / AD
                  </button>
                )}
              </div>
            )}

            {orgOptions.length > 1 && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  سازمان
                </label>
                <select
                  className="portal-select-compact w-full max-w-none"
                  value={currentOrg?.slug || currentOrg?.id || ""}
                  onChange={(e) => onOrgChange(e.target.value)}
                  aria-label="انتخاب سازمان"
                >
                  {orgOptions.map((o) => (
                    <option key={o.id} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {authMode === "ldap" && orgAuth?.ldapEnabled ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setErrorMessage(null);
                  if (!currentOrg) {
                    setErrorMessage("سازمان را انتخاب کنید.");
                    return;
                  }
                  try {
                    setIsSubmitting(true);
                    const res = await ApiService.ldapLogin({
                      username: ldapUsername.trim(),
                      password: ldapPassword,
                      organizationId: currentOrg.id,
                      organizationSlug: currentOrg.slug,
                    });
                    completeAuthLogin(res);
                  } catch (err: unknown) {
                    setErrorMessage(err instanceof Error ? err.message : "خطا در ورود LDAP");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold mb-1.5">نام کاربری سازمانی</label>
                  <input
                    value={ldapUsername}
                    onChange={(e) => setLdapUsername(e.target.value)}
                    className="portal-auth-input px-3 py-2.5"
                    dir="ltr"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">رمز عبور</label>
                  <input
                    type="password"
                    value={ldapPassword}
                    onChange={(e) => setLdapPassword(e.target.value)}
                    className="portal-auth-input px-3 py-2.5"
                    dir="ltr"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 btn-brand text-white rounded-xl text-sm font-bold"
                >
                  ورود با حساب سازمانی
                </button>
              </form>
            ) : orgAuth && !orgAuth.localEnabled && !orgAuth.ldapEnabled && !orgAuth.googleEnabled ? (
              <p className="text-sm text-rose-600">هیچ روش ورودی برای این سازمان فعال نیست.</p>
            ) : (!orgAuth || orgAuth.localEnabled) && authMode === "local" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  آدرس ایمیل
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@company.ir"
                    className="portal-auth-input pr-10 pl-3 py-2.5 text-left"
                    dir="ltr"
                    autoComplete="email"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  رمز عبور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="portal-auth-input pr-10 pl-10 py-2.5 text-left"
                    dir="ltr"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 btn-brand text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  "در حال ورود..."
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    ورود به پورتال
                  </>
                )}
              </button>
            </form>
            ) : null}

            {orgAuth?.googleEnabled && (
              <>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white dark:bg-[#1a2438] px-2 text-slate-400">
                      یا
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  className="w-full py-2.5 px-4 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  ورود با حساب گوگل
                </button>
              </>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {orgAuth?.localEnabled && orgAuth.authPolicies.selfRegistrationEnabled && (
              <button
                type="button"
                onClick={() => openAuthModal("register")}
                className="font-bold text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                ساخت حساب کاربری
              </button>
              )}
              <button
                type="button"
                onClick={() => openAuthModal("forgot")}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline cursor-pointer"
              >
                فراموشی رمز عبور
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-[11px] text-slate-400">
        <button
          type="button"
          onClick={() => goToLanding()}
          className="hover:text-[var(--brand-primary)] cursor-pointer"
        >
          rooomchi.ir — صفحه ورود سازمانی
        </button>
      </footer>
    </div>
  );
};
