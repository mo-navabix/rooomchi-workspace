import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { Logo } from '../common/Logo';
import {
  X,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  UserPlus,
  LogIn,
  KeyRound,
  RotateCcw,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalView,
    closeAuthModal,
    openAuthModal,
    login,
    sendOtp,
    verifyOtp,
    forgotPassword,
    resetPassword,
    quickLoginAs,
    showToast,
  } = useApp();

  // Internal view state: 'login' | 'register' | 'forgot' | 'reset'
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState<string>('admin@didar.ir');
  const [loginPassword, setLoginPassword] = useState<string>('password123');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Register flow state (Email only -> OTP verification)
  const [regEmail, setRegEmail] = useState<string>('');
  const [regCode, setRegCode] = useState<string>('');
  const [regStep, setRegStep] = useState<'email' | 'code'>('email');
  const [regSimulatedCode, setRegSimulatedCode] = useState<string | null>(null);
  const [regCooldown, setRegCooldown] = useState<number>(0);

  // Forgot / Reset password state
  const [forgotEmail, setForgotEmail] = useState<string>('employee@technova.ir');
  const [resetCode, setResetCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [resetSimulatedCode, setResetSimulatedCode] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync internal view when authModal opens or view changes from outside
  useEffect(() => {
    if (!isAuthModalOpen) return;
    if (authModalView === 'register' || authModalView === 'otp') {
      setCurrentView('register');
      setRegStep('email');
    } else if (authModalView === 'forgot') {
      setCurrentView('forgot');
    } else if (authModalView === 'reset') {
      setCurrentView('reset');
    } else {
      setCurrentView('login');
    }
    setErrorMessage(null);
  }, [authModalView, isAuthModalOpen]);

  // Cooldown countdown for registration OTP resend
  useEffect(() => {
    if (regCooldown <= 0) return;
    const timer = setInterval(() => {
      setRegCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [regCooldown]);

  if (!isAuthModalOpen) return null;

  // -------------------------------------------------------------
  // 1. Password Login Handler
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      setErrorMessage('لطفاً یک آدرس ایمیل معتبر وارد کنید');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('لطفاً رمز عبور را وارد کنید');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email: loginEmail.trim(), password: loginPassword });
    } catch (err: any) {
      setErrorMessage(err.message || 'ایمیل یا رمز عبور اشتباه است');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 2. Fast Email Registration Flow (Email Only -> OTP -> Dashboard)
  // -------------------------------------------------------------
  const handleRegSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('لطفاً یک آدرس ایمیل معتبر وارد کنید');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await sendOtp(regEmail.trim());
      setRegStep('code');
      setRegCooldown(60);
      if (res.simulatedCode) {
        setRegSimulatedCode(res.simulatedCode);
        setRegCode(res.simulatedCode); // autofill for instant preview testing
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ارسال کد تأیید');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regCode.trim()) {
      setErrorMessage('لطفاً کد تأیید ۶ رقمی را وارد کنید');
      return;
    }

    try {
      setIsSubmitting(true);
      await verifyOtp(regEmail.trim(), regCode.trim());
      showToast('ثبت‌نام با موفقیت انجام شد! برای رزرو اتاق‌ها، ابتدا اطلاعات خود را تکمیل فرمایید.', 'info');
    } catch (err: any) {
      setErrorMessage(err.message || 'کد تأیید نامعتبر است یا منقضی شده است');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 3. Forgot & Reset Password Flow
  // -------------------------------------------------------------
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMessage('لطفاً آدرس ایمیل حساب خود را به درستی وارد کنید');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await forgotPassword(forgotEmail.trim());
      if (res.simulatedCode) {
        setResetSimulatedCode(res.simulatedCode);
        setResetCode(res.simulatedCode); // autofill for effortless preview testing
      }
      setCurrentView('reset');
      showToast('کد تأیید بازیابی به ایمیل شما ارسال شد', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'کاربری با این ایمیل یافت نشد');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!resetCode.trim()) {
      setErrorMessage('لطفاً کد تأیید ۶ رقمی را وارد کنید');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setErrorMessage('رمز عبور جدید باید حداقل ۴ کاراکتر باشد');
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword({
        email: forgotEmail.trim(),
        code: resetCode.trim(),
        newPassword: newPassword.trim(),
      });
      // Prepopulate login credentials so user can log in with new password
      setLoginEmail(forgotEmail.trim());
      setLoginPassword(newPassword.trim());
      setCurrentView('login');
      showToast('رمز عبور شما با موفقیت تغییر یافت. اکنون می‌توانید با رمز جدید وارد شوید', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در بازنشانی رمز عبور');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#334155] w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#0F786E] via-[#10B981] to-[#0F786E] text-white relative border-b border-[#334155]">
          <button
            type="button"
            onClick={closeAuthModal}
            className="absolute left-4 top-4 text-emerald-100 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="mb-2">
              <Logo variant="stacked" size="lg" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-2">
              {currentView === 'login' && 'ورود به سامانه دیدار'}
              {currentView === 'register' && 'ساخت اکانت جدید'}
              {currentView === 'forgot' && 'فراموشی رمز عبور'}
              {currentView === 'reset' && 'تعیین رمز عبور جدید'}
            </h3>

            <p className="text-xs text-emerald-100/90 mt-1 max-w-xs leading-relaxed">
              {currentView === 'login' && 'ورود با ایمیل و رمز عبور به سامانه رزرواسیون'}
              {currentView === 'register' && 'ثبت‌نام سریع همکاران — فقط با وارد کردن ایمیل'}
              {currentView === 'forgot' && 'ایمیل حساب خود را جهت دریافت کد تأیید وارد نمایید'}
              {currentView === 'reset' && 'کد تأیید ارسال‌شده و رمز جدید خود را وارد کنید'}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Error Message banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-medium animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 1: LOGIN (فرم ورود با ایمیل و رمز عبور)             */}
          {/* ========================================================= */}
          {currentView === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  آدرس ایمیل *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@company.ir"
                    className="w-full text-xs pr-9 pl-3 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-[#0F172A] focus:ring-2 focus:ring-[#10B981] transition-all text-left"
                    dir="ltr"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  رمز عبور *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pr-9 pl-9 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-[#0F172A] focus:ring-2 focus:ring-[#10B981] transition-all text-left"
                    dir="ltr"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#0F786E] hover:bg-[#0D6B63] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>در حال اعتبارسنجی...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>ورود به حساب</span>
                  </>
                )}
              </button>

              {/* The Two Requested Options: اکانت ندارم! ساخت اکانت & فراموشی رمز عبور */}
              <div className="pt-3 pb-1 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-slate-100 dark:border-[#334155]">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('register');
                    setRegStep('email');
                    setErrorMessage(null);
                  }}
                  className="text-xs font-bold text-[#0F786E] dark:text-[#5eead4] hover:underline flex items-center gap-1.5 cursor-pointer py-1"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>اکانت ندارم! ساخت اکانت</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('forgot');
                    setErrorMessage(null);
                  }}
                  className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:underline cursor-pointer py-1"
                >
                  فراموشی رمز عبور
                </button>
              </div>

              {/* Demo Accounts Bar (Helpful for quick test of roles) */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#334155]">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                  <span>تست سریع با نقش‌های سازمانی (دمو):</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-[#0F172A] text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono border border-slate-200 dark:border-[#334155]">
                    رمز: password123
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => quickLoginAs('super_admin')}
                    className="p-2 text-right rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 text-[11px] font-bold transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>مدیر کل دیدار</span>
                    <span className="text-[9px] bg-emerald-200 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-800 dark:text-emerald-300">
                      Super Admin
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickLoginAs('org_admin')}
                    className="p-2 text-right rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 text-[11px] font-bold transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>مدیر سازمان</span>
                    <span className="text-[9px] bg-emerald-200 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-800 dark:text-emerald-300">
                      Org Admin
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickLoginAs('room_manager')}
                    className="p-2 text-right rounded-lg border border-teal-200 dark:border-teal-800/50 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-900 dark:text-teal-200 text-[11px] font-bold transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>مدیر تشریفات</span>
                    <span className="text-[9px] bg-teal-200 dark:bg-teal-900/60 px-1.5 py-0.5 rounded text-teal-800 dark:text-teal-300">
                      Manager
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickLoginAs('employee')}
                    className="p-2 text-right rounded-lg border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0F172A] hover:bg-slate-100 dark:hover:bg-[#334155] text-slate-800 dark:text-slate-200 text-[11px] font-bold transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>کارمند عادی</span>
                    <span className="text-[9px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                      Staff
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* VIEW 2: REGISTER (فقط ایمیل و کد تأیید OTP)              */}
          {/* ========================================================= */}
          {currentView === 'register' && (
            <div className="space-y-4">
              {regStep === 'email' ? (
                <form onSubmit={handleRegSendOtp} className="space-y-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>ثبت‌نام سریع فقط با ایمیل</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80">
                      تنها با وارد کردن آدرس ایمیل، کد تأیید یکبارمصرف برای شما ارسال شده و بلافاصله وارد داشبورد می‌شوید. (تکمیل نام و تلفن در هنگام اولین رزرو اتاق انجام خواهد شد).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      آدرس ایمیل همکار *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="your-name@company.ir"
                        className="w-full text-xs pr-9 pl-3 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-[#0F172A] focus:ring-2 focus:ring-[#10B981] transition-all text-left"
                        dir="ltr"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-[#0F786E] hover:bg-[#0D6B63] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>در حال ارسال کد تأیید...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>ارسال کد تأیید ۶ رقمی</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2 border-t border-slate-100 dark:border-[#334155]">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('login');
                        setErrorMessage(null);
                      }}
                      className="text-xs font-semibold text-[#0F786E] dark:text-[#5eead4] hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>قبلاً ثبت‌نام کرده‌اید؟ ورود با ایمیل و رمز عبور</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">کد به ایمیل: </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 dir-ltr">{regEmail}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegStep('email')}
                      className="text-[11px] text-[#0F786E] dark:text-[#5eead4] hover:underline cursor-pointer"
                    >
                      ویرایش ایمیل
                    </button>
                  </div>

                  {/* Simulated Code helper for instant test */}
                  {regSimulatedCode && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                      <span>کد آزمایشی دریافتی (تست سریع):</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm bg-emerald-200 dark:bg-emerald-900/60 px-2 py-0.5 rounded tracking-wider">
                          {regSimulatedCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => setRegCode(regSimulatedCode)}
                          className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded font-bold cursor-pointer"
                        >
                          درج خودکار
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      کد تأیید ۶ رقمی *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={regCode}
                      onChange={(e) => setRegCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full text-center text-lg font-mono font-bold tracking-widest py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-[#0F172A] focus:ring-2 focus:ring-[#10B981] transition-all"
                      dir="ltr"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-[#0F786E] hover:bg-[#0D6B63] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>در حال بررسی کد...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تأیید و ورود به سیستم</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-[#334155]">
                    <button
                      type="button"
                      disabled={regCooldown > 0 || isSubmitting}
                      onClick={handleRegSendOtp}
                      className="text-[#0F786E] dark:text-[#5eead4] hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{regCooldown > 0 ? `ارسال مجدد (${regCooldown} ثانیه)` : 'ارسال مجدد کد'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('login');
                        setErrorMessage(null);
                      }}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      بازگشت به ورود
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 3: FORGOT PASSWORD (مرحله ۱: درخواست OTP)           */}
          {/* ========================================================= */}
          {currentView === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>بازیابی رمز عبور با کد یکبارمصرف</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300/80">
                  آدرس ایمیل ثبت‌شده خود را وارد کنید تا کد تأیید ۶ رقمی برای تعیین رمز جدید برایتان ارسال گردد.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  آدرس ایمیل حساب کاربری *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="employee@technova.ir"
                    className="w-full text-xs pr-9 pl-3 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-[#0F172A] focus:ring-2 focus:ring-[#10B981] text-left"
                    dir="ltr"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#0F786E] hover:bg-[#0D6B63] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>در حال ارسال کد بازیابی...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>ارسال کد تأیید بازیابی</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2 border-t border-slate-100 dark:border-[#334155]">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('login');
                    setErrorMessage(null);
                  }}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>بازگشت به صفحه ورود</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* VIEW 4: RESET PASSWORD (مرحله ۲: کد OTP و رمز جدید)       */}
          {/* ========================================================= */}
          {currentView === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">کد به ایمیل: </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 dir-ltr">{forgotEmail}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView('forgot')}
                  className="text-[11px] text-[#0F786E] dark:text-[#5eead4] hover:underline cursor-pointer"
                >
                  تغییر ایمیل
                </button>
              </div>

              {resetSimulatedCode && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                  <span>کد تأیید شبیه‌سازی‌شده (تست):</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm bg-emerald-200 dark:bg-emerald-900/60 px-2 py-0.5 rounded tracking-wider">
                      {resetSimulatedCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => setResetCode(resetSimulatedCode)}
                      className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded font-bold cursor-pointer"
                    >
                      درج خودکار
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  کد تأیید ۶ رقمی دریافتی *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center text-lg font-mono font-bold tracking-widest py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-[#0F172A] focus:ring-2 focus:ring-[#10B981]"
                  dir="ltr"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  رمز عبور جدید * <span className="text-[10px] text-slate-400">(حداقل ۴ کاراکتر)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="رمز جدید دلخواه خود را وارد کنید"
                    className="w-full text-xs pr-9 pl-9 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-[#0F172A] focus:ring-2 focus:ring-[#10B981] text-left"
                    dir="ltr"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#0F786E] hover:bg-[#0D6B63] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>در حال ذخیره رمز جدید...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ثبت رمز عبور جدید و بازگشت به ورود</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2 border-t border-slate-100 dark:border-[#334155]">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('login');
                    setErrorMessage(null);
                  }}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>انصراف و بازگشت به ورود</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
