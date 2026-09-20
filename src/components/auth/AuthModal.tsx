import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { DidarLogo } from '../common/DidarLogo';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Briefcase,
  Building2,
  KeyRound,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalView,
    closeAuthModal,
    openAuthModal,
    login,
    register,
    forgotPassword,
    resetPassword,
    quickLoginAs,
    currentOrg,
    showToast,
  } = useApp();

  // Form states
  const [email, setEmail] = useState<string>('admin@didar.ir');
  const [password, setPassword] = useState<string>('password123');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Registration extra states
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('employee');

  // Forgot / Reset Password states
  const [forgotEmail, setForgotEmail] = useState<string>('employee@technova.ir');
  const [resetCode, setResetCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      setIsSubmitting(true);
      await login({ email: email.trim(), password });
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ورود به سامانه');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('رمز عبور و تکرار آن با یکدیگر یکسان نیستند');
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        department: department.trim() || currentOrg?.departments?.[0] || 'فنی و مهندسی',
        jobTitle: jobTitle.trim() || 'کارشناس',
        phone: phone.trim(),
        role: regRole,
        orgId: currentOrg?.id,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ثبت‌نام کاربر');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      setIsSubmitting(true);
      const res = await forgotPassword(forgotEmail.trim());
      if (res.simulatedCode) {
        setSimulatedCode(res.simulatedCode);
        setResetCode(res.simulatedCode); // Pre-fill for instant test convenience
      }
      showToast('کد تأیید به ایمیل شما ارسال شد', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ارسال کد بازیابی');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      setIsSubmitting(true);
      await resetPassword({
        email: forgotEmail.trim(),
        code: resetCode.trim(),
        newPassword,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در بازنشانی رمز عبور');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111A2E] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#1E2E50] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header with Didar Branding */}
        <div className="p-6 bg-gradient-to-r from-[#0D1B3A] via-[#1E3360] to-[#0D1B3A] text-white relative border-b border-[#1E2E50]">
          <button
            onClick={closeAuthModal}
            className="absolute left-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="mb-2">
              <DidarLogo size="lg" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-2">
              {authModalView === 'login' && 'ورود به سامانه مدیریت جلسات'}
              {authModalView === 'register' && 'عضویت در پرتال سازمانی'}
              {authModalView === 'forgot' && 'فراموشی و بازیابی رمز عبور'}
              {authModalView === 'reset' && 'تنظیم رمز عبور جدید'}
            </h3>
            <p className="text-xs text-blue-200/80 mt-1 max-w-xs">
              {authModalView === 'login' && 'مدیریت هوشمند اتاق جلسات و هماهنگی سازمانی'}
              {authModalView === 'register' && `ایجاد حساب کاربری در پرتال سازمانی ${currentOrg?.name || ''}`}
              {authModalView === 'forgot' && 'ایمیل سازمانی خود را جهت دریافت کد تأیید ۶ رقمی وارد کنید'}
              {authModalView === 'reset' && 'کد تأیید ارسال‌شده را وارد نموده و رمز جدیدی انتخاب کنید'}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {authModalView === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ایمیل سازمانی *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.ir"
                    className="w-full text-xs pr-9 pl-3 py-2.5 bg-slate-50 dark:bg-[#0A0F1D] border border-slate-200 dark:border-[#1E2E50] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-[#0A0F1D] focus:ring-2 focus:ring-[#2563EB] transition-all text-left"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">رمز عبور *</label>
                  <button
                    type="button"
                    onClick={() => openAuthModal('forgot')}
                    className="text-[11px] font-medium text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                  >
                    فراموشی رمز عبور؟
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pr-9 pl-9 py-2.5 bg-slate-50 dark:bg-[#0A0F1D] border border-slate-200 dark:border-[#1E2E50] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-[#0A0F1D] focus:ring-2 focus:ring-[#2563EB] transition-all text-left"
                    dir="ltr"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <span>در حال ورود...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>ورود به حساب کاربری</span>
                  </>
                )}
              </button>

              {/* Demo Accounts Bar for instantaneous preview testing */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#1E2E50]">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                  <span>تست سریع با نقش‌های سازمانی (دمو):</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-[#0A0F1D] text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono border border-slate-200 dark:border-[#1E2E50]">
                    رمز: password123
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => quickLoginAs('super_admin')}
                    className="p-2 text-right rounded-lg border border-purple-200 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-900 dark:text-purple-200 text-[11px] font-bold transition-colors flex items-center justify-between"
                  >
                    <span>مدیر کل دیدار</span>
                    <span className="text-[9px] bg-purple-200 dark:bg-purple-900/60 px-1.5 py-0.5 rounded text-purple-800 dark:text-purple-300">
                      Super Admin
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickLoginAs('org_admin')}
                    className="p-2 text-right rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-900 dark:text-blue-200 text-[11px] font-bold transition-colors flex items-center justify-between"
                  >
                    <span>مدیر سازمان</span>
                    <span className="text-[9px] bg-blue-200 dark:bg-blue-900/60 px-1.5 py-0.5 rounded text-blue-800 dark:text-blue-300">
                      Org Admin
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickLoginAs('room_manager')}
                    className="p-2 text-right rounded-lg border border-teal-200 dark:border-teal-800/50 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-900 dark:text-teal-200 text-[11px] font-bold transition-colors flex items-center justify-between"
                  >
                    <span>مدیر تشریفات</span>
                    <span className="text-[9px] bg-teal-200 dark:bg-teal-900/60 px-1.5 py-0.5 rounded text-teal-800 dark:text-teal-300">
                      Manager
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickLoginAs('employee')}
                    className="p-2 text-right rounded-lg border border-slate-200 dark:border-[#1E2E50] bg-slate-50 dark:bg-[#0A0F1D] hover:bg-slate-100 dark:hover:bg-[#16243F] text-slate-800 dark:text-slate-200 text-[11px] font-bold transition-colors flex items-center justify-between"
                  >
                    <span>کارمند عادی</span>
                    <span className="text-[9px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                      Staff
                    </span>
                  </button>
                </div>
              </div>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">حساب کاربری ندارید؟ </span>
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline underline-offset-4"
                >
                  ثبت‌نام پرسنل جدید
                </button>
              </div>
            </form>
          )}

          {/* VIEW: REGISTER */}
          {authModalView === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام و نام خانوادگی *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: سارا محمدی"
                    className="w-full text-xs pr-9 pl-3 py-2.5 bg-slate-50 dark:bg-[#0A0F1D] border border-slate-200 dark:border-[#1E2E50] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-[#0A0F1D] focus:ring-2 focus:ring-[#2563EB]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ایمیل سازمانی *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sara@company.ir"
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-[#0A0F1D] border border-slate-200 dark:border-[#1E2E50] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-[#0A0F1D] focus:ring-2 focus:ring-[#2563EB] text-left"
                    dir="ltr"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    شماره همراه
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-[#0A0F1D] border border-slate-200 dark:border-[#1E2E50] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-[#0A0F1D] focus:ring-2 focus:ring-[#2563EB] text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    واحد / دپارتمان *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-[#0A0F1D] border border-slate-200 dark:border-[#1E2E50] text-slate-900 dark:text-white rounded-xl focus:bg-white"
                  >
                    {(currentOrg?.departments ?? []).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نقش درخواستی در سامانه
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-[#0A0F1D] border border-slate-200 dark:border-[#1E2E50] text-slate-900 dark:text-white rounded-xl focus:bg-white"
                  >
                    <option value="employee">کارمند عادی (رزرو جلسات)</option>
                    <option value="room_manager">مدیر تشریفات و اتاق‌ها</option>
                    <option value="org_admin">مدیر سازمان (دسترسی کامل)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    رمز عبور *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="حداقل ۶ کاراکتر"
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-[#0A0F1D] border border-slate-200 dark:border-[#1E2E50] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-[#0A0F1D] focus:ring-2 focus:ring-[#2563EB] text-left"
                    dir="ltr"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تکرار رمز عبور *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="تکرار رمز"
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-[#0A0F1D] border border-slate-200 dark:border-[#1E2E50] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-[#0A0F1D] focus:ring-2 focus:ring-[#2563EB] text-left"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <span>در حال ایجاد حساب...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تکمیل ثبت‌نام و ورود</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">قبلاً ثبت‌نام کرده‌اید؟ </span>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline underline-offset-4"
                >
                  ورود به حساب
                </button>
              </div>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {authModalView === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  آدرس ایمیل سازمانی حساب شما *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="employee@technova.ir"
                    className="w-full text-xs pr-9 pl-3 py-2.5 bg-slate-50 dark:bg-[#0A0F1D] border border-slate-200 dark:border-[#1E2E50] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-[#0A0F1D] focus:ring-2 focus:ring-[#2563EB] text-left"
                    dir="ltr"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  یک کد امنیتی ۶ رقمی به این آدرس ایمیل ارسال خواهد شد تا هویت شما را تأیید کند.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>در حال ارسال کد...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>ارسال کد تأیید ۶ رقمی</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>بازگشت به صفحه ورود</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW: RESET PASSWORD */}
          {authModalView === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              {simulatedCode && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                  <span>کد تأیید شبیه‌سازی‌شده جهت آزمایش:</span>
                  <span className="font-mono font-black text-sm bg-emerald-200 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                    {simulatedCode}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  کد تأیید ۶ رقمی دریافتی *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-sm font-mono tracking-widest text-center py-2.5 bg-slate-50 dark:bg-[#0A0F1D] border border-slate-200 dark:border-[#1E2E50] text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-[#0A0F1D] focus:ring-2 focus:ring-[#2563EB] font-bold"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  رمز عبور جدید *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-[#0A0F1D] border border-slate-200 dark:border-[#1E2E50] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-[#0A0F1D] focus:ring-2 focus:ring-[#2563EB] text-left"
                  dir="ltr"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>در حال ذخیره...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأیید و ذخیره رمز جدید</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
