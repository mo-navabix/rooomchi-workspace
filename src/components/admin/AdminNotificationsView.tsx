import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  BellRing,
  Smartphone,
  Send,
  CheckCircle2,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Info,
  Calendar,
  Volume2,
  VolumeX,
  Search,
  Trash2,
  Zap,
  Check,
  X,
  Users,
  Building,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import {
  NotificationSettings,
  NotificationChannelRule,
  NotificationLogEntry,
} from '../../types';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  INITIAL_NOTIFICATION_LOGS,
  SMS_PROVIDERS,
} from '../../constants/notifications';
import { toPersianDigits } from '../../utils/jalali';
import { TimePicker } from '../common/TimePicker';
import { ApiService } from '../../services/apiService';

// Custom Accessible RTL-safe Toggle Switch
interface SwitchToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  color?: 'emerald' | 'sky' | 'teal';
  label?: string;
  size?: 'sm' | 'md';
}

const SwitchToggle: React.FC<SwitchToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  color = 'emerald',
  label,
  size = 'md',
}) => {
  const activeBg =
    color === 'sky'
      ? 'bg-sky-500 dark:bg-sky-600'
      : color === 'teal'
      ? 'bg-[var(--brand-primary)] dark:bg-brand-soft0'
      : 'bg-[var(--brand-primary)] dark:bg-[var(--brand-primary)]';

  const isMd = size === 'md';

  return (
    <div className="inline-flex items-center gap-2 select-none">
      {label && (
        <span
          onClick={() => !disabled && onChange(!checked)}
          className={`text-xs font-semibold cursor-pointer ${
            checked
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {label}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex shrink-0 transition-colors duration-200 ease-in-out cursor-pointer rounded-full focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${
          isMd ? 'w-11 h-6' : 'w-9 h-5'
        } ${checked ? activeBg : 'bg-slate-300 dark:bg-slate-700'} ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
        style={{ direction: 'ltr' }}
      >
        <span
          className={`pointer-events-none inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
            isMd ? 'w-5 h-5 mt-0.5' : 'w-4 h-4 mt-0.5'
          } ${
            checked
              ? isMd
                ? 'translate-x-5 ml-0.5'
                : 'translate-x-4 ml-0.5'
              : 'translate-x-0 ml-0.5'
          }`}
        />
      </button>
    </div>
  );
};

export const AdminNotificationsView: React.FC = () => {
  const { currentOrg, showToast, addNotification } = useApp();

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [logs, setLogs] = useState<NotificationLogEntry[]>([]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const bundle = await ApiService.getAdminNotificationSettings();
        if (cancelled) return;
        const s = bundle.settings as NotificationSettings;
        if (s && typeof s === 'object' && Object.keys(s).length > 0) {
          setSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...s });
        }
        if (Array.isArray(bundle.logs) && bundle.logs.length) {
          setLogs(bundle.logs as NotificationLogEntry[]);
        } else {
          setLogs(INITIAL_NOTIFICATION_LOGS);
        }
      } catch {
        setLogs(INITIAL_NOTIFICATION_LOGS);
      } finally {
        if (!cancelled) setSettingsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentOrg?.id]);

  const [activeTab, setActiveInternalTab] = useState<'channels' | 'rules' | 'logs'>('channels');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showBotToken, setShowBotToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Selected SMS template for editing
  const [smsTemplateKey, setSmsTemplateKey] = useState<
    'templateApproval' | 'templateNewBooking' | 'templateCancellation' | 'templateReminder'
  >('templateApproval');

  // Test Modal State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testChannel, setTestChannel] = useState<'sms' | 'telegram' | 'in_app'>('sms');
  const [testPhone, setTestPhone] = useState(settings.sms.managerPhone || '09123456789');
  const [testChatId, setTestChatId] = useState(settings.telegram.targetChatId || '@rooomchi_management');
  const [testEvent, setTestEvent] = useState<string>('booking_approved');
  const [testCustomMessage, setTestCustomMessage] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Filter logs
  const [logFilterChannel, setLogFilterChannel] = useState<'all' | 'sms' | 'telegram' | 'in_app'>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await ApiService.putAdminNotificationSettings({ settings, logs });
      showToast('پیکربندی سیستم اطلاع‌رسانی با موفقیت ذخیره شد', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در ذخیره تنظیمات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!confirm('آیا مایل به بازنشانی تنظیمات نوتیفیکیشن‌ها به حالت پیش‌فرض هستید؟')) return;
    setSettings(DEFAULT_NOTIFICATION_SETTINGS);
    try {
      await ApiService.putAdminNotificationSettings({
        settings: DEFAULT_NOTIFICATION_SETTINGS,
        logs,
      });
      showToast('تنظیمات به حالت پیش‌فرض بازنشانی گردید', 'info');
    } catch {
      showToast('ذخیره روی سرور ناموفق بود', 'error');
    }
  };

  // Toggle Rule in Matrix
  const handleToggleRule = (
    ruleId: string,
    channel: 'sms' | 'telegram' | 'inApp'
  ) => {
    setSettings((prev) => ({
      ...prev,
      rules: prev.rules.map((rule) => {
        if (rule.id === ruleId) {
          return {
            ...rule,
            [channel]: !rule[channel],
          };
        }
        return rule;
      }),
    }));
  };

  // Handle Dispatch Test
  const handleExecuteTest = () => {
    setIsSendingTest(true);

    setTimeout(() => {
      let previewMsg = '';
      let targetRecipient = '';
      let logTitle = '';

      if (testChannel === 'sms') {
        previewMsg =
          testCustomMessage.trim() ||
          `روم‌چی: جلسه تست «بررسی هماهنگی فنی» در سالن کنفرانس برای ساعت ۱۰:۰۰ با موفقیت ثبت شد.`;
        targetRecipient = testPhone;
        logTitle = 'پیامک تست ارسال شد';
      } else if (testChannel === 'telegram') {
        previewMsg =
          testCustomMessage.trim() ||
          `🤖 [ربات تلگرام روم‌چی]\n📌 جلسه تست هماهنگی با موفقیت ثبت گردید.\n🏢 سالن: VIP سپهر\n⏰ ساعت: ۱۰:۰۰ الی ۱۱:۳۰`;
        targetRecipient = testChatId;
        logTitle = 'ارسال تست به تلگرام';
      } else {
        previewMsg =
          testCustomMessage.trim() ||
          `اعلان تستی: هماهنگی سالن کنفرانس اصلی توسط مدیر سیستم تست شد.`;
        targetRecipient = 'کاربر جاری و اعضای سازمان';
        logTitle = 'اعلان درون‌برنامه‌ای آزمایشی';

        // Add real notification to Header Bell
        addNotification({
          title: 'اعلان تست مدیریتی',
          message: previewMsg,
          type: 'system',
        });
      }

      // Record in logs
      const newEntry: NotificationLogEntry = {
        id: `log-${Date.now()}`,
        channel: testChannel,
        recipient: targetRecipient,
        title: logTitle,
        preview: previewMsg,
        timestamp: 'همین الان',
        status: 'delivered',
        eventType: testEvent,
      };

      const updatedLogs = [newEntry, ...logs];
      setLogs(updatedLogs);
      void ApiService.putAdminNotificationSettings({ settings, logs: updatedLogs }).catch(() => undefined);

      setIsSendingTest(false);
      setIsTestModalOpen(false);
      showToast(
        `تست کانال ${testChannel === 'sms' ? 'پیامک' : testChannel === 'telegram' ? 'تلگرام' : 'درون‌برنامه‌ای'} با موفقیت انجام شد`,
        'success'
      );
    }, 700);
  };

  // Clear Logs
  const handleClearLogs = async () => {
    if (!confirm('آیا از پاکسازی تاریخچه لاگ‌های نوتیفیکیشن اطمینان دارید؟')) return;
    setLogs([]);
    try {
      await ApiService.putAdminNotificationSettings({ settings, logs: [] });
      showToast('تاریخچه ارسال اعلان‌ها پاک شد', 'info');
    } catch {
      showToast('پاکسازی روی سرور ناموفق بود', 'error');
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (logFilterChannel !== 'all' && l.channel !== logFilterChannel) return false;
      if (logSearchQuery.trim()) {
        const q = logSearchQuery.toLowerCase();
        return (
          l.title.toLowerCase().includes(q) ||
          l.recipient.toLowerCase().includes(q) ||
          l.preview.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, logFilterChannel, logSearchQuery]);

  // Insert placeholder into active SMS template
  const insertPlaceholder = (tag: string) => {
    setSettings((prev) => ({
      ...prev,
      sms: {
        ...prev.sms,
        [smsTemplateKey]: (prev.sms[smsTemplateKey] || '') + ` ${tag}`,
      },
    }));
  };

  // Template key label map
  const templateTitles = {
    templateApproval: 'تأیید نهایی جلسه',
    templateNewBooking: 'ثبت جلسه جدید نیازمند تأیید',
    templateCancellation: 'لغو جلسه',
    templateReminder: 'یادآوری قبل از جلسه',
  };

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0" dir="rtl">
      {/* ======================================================== */}
      {/* EXECUTIVE COMMAND HEADER BANNER                          */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-[#1E293B] p-5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-[#334155] shadow-xs transition-colors space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] border border-brand-soft/80 dark:border-[rgb(var(--brand-primary-rgb)/0.35)] text-xs font-bold text-[var(--brand-primary)] dark:text-[var(--brand-primary-lighter)]">
              <BellRing className="w-3.5 h-3.5 text-[var(--brand-primary)] dark:text-[var(--brand-primary-lighter)]" />
              <span>مرکز فرماندهی نوتیفیکیشن‌ها و کانال‌های ارتباطی</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              مدیریت و کنترل اعلان‌های {currentOrg?.name || 'روم‌چی'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              پیکربندی هوشمند و یکپارچه ارسال هشدارها از طریق پیامک (SMS)، ربات تلگرام و نوتیفیکیشن‌های درون‌برنامه‌ای به دست مدیر
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsTestModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-brand dark:text-[var(--brand-primary-on-dark)] bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] hover:bg-[rgb(var(--brand-primary-rgb)/0.12)] dark:hover:bg-[rgb(var(--brand-primary-rgb)/0.22)] border border-brand-soft dark:border-[rgb(var(--brand-primary-rgb)/0.4)] transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Zap className="w-4 h-4 text-brand dark:text-[var(--brand-primary-on-dark)]" />
              <span>شبیه‌ساز و ارسال تست</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 bg-[var(--brand-primary-light)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'در حال ذخیره...' : 'ذخیره پیکربندی'}</span>
            </button>
          </div>
        </div>

        {/* Live Channel Status Bar (Clean unboxed typography with typographic separators) */}
        <div className="pt-4 border-t border-slate-100 dark:border-[#334155] flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                settings.sms.enabled ? 'bg-[var(--brand-primary)] ring-2 ring-[rgb(var(--brand-primary-rgb)/0.2)]' : 'bg-slate-400'
              }`}
            />
            <span className="font-medium text-slate-500 dark:text-slate-400">پیامک (SMS):</span>
            <span className={`font-bold ${settings.sms.enabled ? 'text-brand dark:text-[var(--brand-primary-on-dark)]' : 'text-slate-400'}`}>
              {settings.sms.enabled ? `فعال (${SMS_PROVIDERS.find(p => p.id === settings.sms.provider)?.name.split(' ')[0] || 'متصل'})` : 'غیرفعال'}
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-600 select-none" aria-hidden="true">·</span>

          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                settings.telegram.enabled ? 'bg-sky-500 ring-2 ring-sky-500/20' : 'bg-slate-400'
              }`}
            />
            <span className="font-medium text-slate-500 dark:text-slate-400">تلگرام (Telegram):</span>
            <span className={`font-bold ${settings.telegram.enabled ? 'text-sky-700 dark:text-sky-400' : 'text-slate-400'}`}>
              {settings.telegram.enabled ? `${settings.telegram.botUsername} (متصل)` : 'غیرفعال'}
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-600 select-none" aria-hidden="true">·</span>

          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                settings.inApp.enabled ? 'bg-brand-soft0 ring-2 ring-[rgb(var(--brand-primary-rgb)/0.2)]' : 'bg-slate-400'
              }`}
            />
            <span className="font-medium text-slate-500 dark:text-slate-400">اعلان درون اپلیکیشن:</span>
            <span className={`font-bold ${settings.inApp.enabled ? 'text-brand dark:text-[var(--brand-primary-on-dark)]' : 'text-slate-400'}`}>
              {settings.inApp.enabled ? (settings.inApp.soundEnabled ? 'فعال + آلارم صوتی' : 'فعال (بی‌صدا)') : 'غیرفعال'}
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-600 select-none" aria-hidden="true">·</span>

          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>قوانین فعال: {toPersianDigits(settings.rules.filter((r) => r.inApp || r.sms || r.telegram).length)} رویداد</span>
          </div>
        </div>

        {/* View Mode Segmented Controls Bar */}
        <div className="portal-tabs-scroll max-w-full overflow-x-auto flex items-center gap-1.5 bg-slate-100 dark:bg-[#0F172A] p-1.5 rounded-xl border border-slate-200/80 dark:border-[#334155] self-start">
          <button
            type="button"
            onClick={() => setActiveInternalTab('channels')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'channels'
                ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            کانال‌های اطلاع‌رسانی (SMS، تلگرام، درون‌برنامه‌ای)
          </button>
          <button
            type="button"
            onClick={() => setActiveInternalTab('rules')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rules'
                ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ماتریس رویدادها و قوانین ارسال ({toPersianDigits(settings.rules.length)})
          </button>
          <button
            type="button"
            onClick={() => setActiveInternalTab('logs')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            تاریخچه و گزارش ارسال‌ها ({toPersianDigits(logs.length)})
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: 3 CHANNELS CONFIGURATION (Spacious, Elegant Cards) */}
      {/* ======================================================== */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 items-stretch">
          {/* ---------------- CHANNEL 1: SMS GATEWAY ---------------- */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-[#334155] p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
            <div className="space-y-5 text-right">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#334155] gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] text-[var(--brand-primary-light)] flex items-center justify-center shrink-0 border border-brand-soft/60 dark:dark:border-[rgb(var(--brand-primary-rgb)/0.35)]">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      درگاه پیامک سازمانی (SMS)
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
                      ارسال بلادرنگ پیامک به موبایل پرسنل و مدیران
                    </p>
                  </div>
                </div>

                {/* Master Switch */}
                <SwitchToggle
                  checked={settings.sms.enabled}
                  onChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      sms: { ...prev.sms, enabled: checked },
                    }))
                  }
                  color="emerald"
                />
              </div>

              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  سرویس‌دهنده پیامکی (SMS Provider)
                </label>
                <select
                  value={settings.sms.provider}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      sms: {
                        ...prev.sms,
                        provider: e.target.value as any,
                      },
                    }))
                  }
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-brand focus:outline-hidden"
                >
                  {SMS_PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {SMS_PROVIDERS.find((p) => p.id === settings.sms.provider)?.desc}
                </p>
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  کلید دسترسی وب‌سرویس (API Key / Token)
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.sms.apiKey}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        sms: { ...prev.sms, apiKey: e.target.value },
                      }))
                    }
                    placeholder="kav_live_9482..."
                    dir="ltr"
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 font-mono text-left focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-brand focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={showApiKey ? 'مخفی‌سازی' : 'نمایش'}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Line & Phone Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    شماره خط فرستنده
                  </label>
                  <input
                    type="text"
                    value={settings.sms.lineNumber}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        sms: { ...prev.sms, lineNumber: e.target.value },
                      }))
                    }
                    placeholder="3000500600"
                    dir="ltr"
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 font-mono text-left focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-brand focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    موبایل مدیر (هشدارهای فوری)
                  </label>
                  <input
                    type="tel"
                    value={settings.sms.managerPhone}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        sms: { ...prev.sms, managerPhone: e.target.value },
                      }))
                    }
                    placeholder="09123456789"
                    dir="ltr"
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 font-mono text-left focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-brand focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Audience Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#334155]">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  گیرندگان مجاز پیامک‌های اطلاع‌رسانی:
                </span>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      هماهنگ‌کننده و درخواست‌کننده جلسه
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.sms.notifyOrganizer}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          sms: { ...prev.sms, notifyOrganizer: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 rounded text-[var(--brand-primary-light)] focus:ring-[var(--brand-primary-light)] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      شرکت‌کنندگان دعوت‌شده (از لیست مدعوین)
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.sms.notifyParticipants}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          sms: { ...prev.sms, notifyParticipants: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 rounded text-[var(--brand-primary-light)] focus:ring-[var(--brand-primary-light)] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      سرپرست سالن و مسئول تشریفات
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.sms.notifyRoomManager}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          sms: { ...prev.sms, notifyRoomManager: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 rounded text-[var(--brand-primary-light)] focus:ring-[var(--brand-primary-light)] cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* SMS Live Template Editor */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#334155]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    قالب متن پیامک:
                  </span>
                  {/* Template Picker */}
                  <select
                    value={smsTemplateKey}
                    onChange={(e) => setSmsTemplateKey(e.target.value as any)}
                    className="text-[11px] px-2 py-1 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-lg text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <option value="templateApproval">تأیید نهایی جلسه</option>
                    <option value="templateNewBooking">ثبت جلسه جدید</option>
                    <option value="templateCancellation">لغو جلسه</option>
                    <option value="templateReminder">یادآوری قبل از جلسه</option>
                  </select>
                </div>

                {/* Variable insertion tags */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  <span className="text-slate-400">افزودن متغیر:</span>
                  <button
                    type="button"
                    onClick={() => insertPlaceholder('{نام_جلسه}')}
                    className="px-2 py-0.5 rounded bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] text-brand dark:text-[var(--brand-primary-on-dark)] hover:bg-[rgb(var(--brand-primary-rgb)/0.12)] transition-colors cursor-pointer"
                  >
                    + نام جلسه
                  </button>
                  <button
                    type="button"
                    onClick={() => insertPlaceholder('{اتاق}')}
                    className="px-2 py-0.5 rounded bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] text-brand dark:text-[var(--brand-primary-on-dark)] hover:bg-[rgb(var(--brand-primary-rgb)/0.12)] transition-colors cursor-pointer"
                  >
                    + سالن
                  </button>
                  <button
                    type="button"
                    onClick={() => insertPlaceholder('{ساعت}')}
                    className="px-2 py-0.5 rounded bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] text-brand dark:text-[var(--brand-primary-on-dark)] hover:bg-[rgb(var(--brand-primary-rgb)/0.12)] transition-colors cursor-pointer"
                  >
                    + ساعت
                  </button>
                  <button
                    type="button"
                    onClick={() => insertPlaceholder('{تاریخ}')}
                    className="px-2 py-0.5 rounded bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] text-brand dark:text-[var(--brand-primary-on-dark)] hover:bg-[rgb(var(--brand-primary-rgb)/0.12)] transition-colors cursor-pointer"
                  >
                    + تاریخ
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={settings.sms[smsTemplateKey]}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      sms: { ...prev.sms, [smsTemplateKey]: e.target.value },
                    }))
                  }
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 resize-none leading-relaxed focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-brand focus:outline-hidden"
                />

                {/* Smartphone Realistic Bubble Preview */}
                <div className="bg-brand-soft/60 dark:bg-[rgb(var(--brand-primary-rgb)/0.12)] border border-brand-soft/70 dark:dark:border-[rgb(var(--brand-primary-rgb)/0.35)] p-3.5 rounded-xl space-y-1.5">
                  <div className="text-[10px] text-brand dark:text-[var(--brand-primary-on-dark)] font-bold flex items-center justify-between">
                    <span>پیش‌نمایش پیام دریافتی (خط {settings.sms.lineNumber})</span>
                    <span className="text-brand dark:text-[var(--brand-primary-on-dark)] font-mono">همین الان</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-[#1E293B] p-2.5 rounded-lg border border-brand-soft dark:dark:border-[rgb(var(--brand-primary-rgb)/0.25)]">
                    {(settings.sms[smsTemplateKey] || '')
                      .replace('{نام_جلسه}', 'جلسه استراتژی محصول')
                      .replace('{اتاق}', 'سالن سیمرغ')
                      .replace('{تاریخ}', '۱۴۰۳/۰۷/۰۸')
                      .replace('{ساعت}', '۱۰:۳۰')}
                  </p>
                </div>
              </div>
            </div>

            {/* Test SMS Button */}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#334155]">
              <button
                type="button"
                onClick={() => {
                  setTestChannel('sms');
                  setIsTestModalOpen(true);
                }}
                className="w-full py-2.5 px-4 bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] hover:bg-[rgb(var(--brand-primary-rgb)/0.12)] dark:hover:bg-[rgb(var(--brand-primary-rgb)/0.2)] text-brand dark:text-[var(--brand-primary-on-dark)] border border-brand-soft dark:dark:border-[rgb(var(--brand-primary-rgb)/0.4)] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ارسال پیامک آزمایشی (Test SMS)</span>
              </button>
            </div>
          </div>

          {/* ---------------- CHANNEL 2: TELEGRAM BOT ---------------- */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-[#334155] p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
            <div className="space-y-5 text-right">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#334155] gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-200/60 dark:border-sky-900/50">
                    <Send className="w-5 h-5 -rotate-45" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      ربات و کانال تلگرام (Telegram)
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
                      ارسال اعلان‌های تصویری، شیشه‌ای و گزارش‌های روزانه
                    </p>
                  </div>
                </div>

                {/* Master Switch */}
                <SwitchToggle
                  checked={settings.telegram.enabled}
                  onChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      telegram: { ...prev.telegram, enabled: checked },
                    }))
                  }
                  color="sky"
                />
              </div>

              {/* Bot Token */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  توکن ربات تلگرام (Bot Token از BotFather)
                </label>
                <div className="relative">
                  <input
                    type={showBotToken ? 'text' : 'password'}
                    value={settings.telegram.botToken}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        telegram: { ...prev.telegram, botToken: e.target.value },
                      }))
                    }
                    placeholder="6829104821:AAH8fL0wZ..."
                    dir="ltr"
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 font-mono text-left focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBotToken(!showBotToken)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={showBotToken ? 'مخفی‌سازی' : 'نمایش'}
                  >
                    {showBotToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Bot Username & Target Channel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    شناسه ربات (Username)
                  </label>
                  <input
                    type="text"
                    value={settings.telegram.botUsername}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        telegram: { ...prev.telegram, botUsername: e.target.value },
                      }))
                    }
                    placeholder="@RooomchiMeetingBot"
                    dir="ltr"
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 font-mono text-left focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    کانال یا Chat ID مقصد
                  </label>
                  <input
                    type="text"
                    value={settings.telegram.targetChatId}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        telegram: { ...prev.telegram, targetChatId: e.target.value },
                      }))
                    }
                    placeholder="@rooomchi_management"
                    dir="ltr"
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 font-mono text-left focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Target Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  نوع مقصد پیام در تلگرام
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        telegram: { ...prev.telegram, channelType: 'channel' },
                      }))
                    }
                    className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                      settings.telegram.channelType === 'channel'
                        ? 'border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    کانال رسمی
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        telegram: { ...prev.telegram, channelType: 'group' },
                      }))
                    }
                    className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                      settings.telegram.channelType === 'group'
                        ? 'border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    سوپرگروه
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        telegram: { ...prev.telegram, channelType: 'direct' },
                      }))
                    }
                    className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                      settings.telegram.channelType === 'direct'
                        ? 'border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    چت مستقیم
                  </button>
                </div>
              </div>

              {/* Extra Features: Rich Buttons & Daily Digest */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-[#334155] text-xs">
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    دکمه‌های شیشه‌ای لینک مستقیم به جلسه (Inline Buttons)
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.telegram.sendRichButtons}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        telegram: { ...prev.telegram, sendRichButtons: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 cursor-pointer"
                  />
                </label>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none min-w-0">
                    <input
                      type="checkbox"
                      checked={settings.telegram.dailyDigestEnabled}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          telegram: { ...prev.telegram, dailyDigestEnabled: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 cursor-pointer shrink-0"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      گزارش صبحگاهی روزانه سالن‌ها
                    </span>
                  </label>

                  <div className="shrink-0">
                    <TimePicker
                      id="telegram-daily-digest-time"
                      modalTitle="انتخاب ساعت ارسال گزارش صبحگاهی"
                      subtitle="ساعات کاری: 06:00 الی 20:00"
                      value={settings.telegram.dailyDigestTime || '08:00'}
                      onChange={(newTime) =>
                        setSettings((prev) => ({
                          ...prev,
                          telegram: { ...prev.telegram, dailyDigestTime: newTime },
                        }))
                      }
                      minTime="06:00"
                      maxTime="20:00"
                      compact={true}
                      showAmPm={true}
                      disabled={!settings.telegram.dailyDigestEnabled}
                    />
                  </div>
                </div>
              </div>

              {/* Telegram Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#334155]">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  نمونه پیام دریافتی در تلگرام:
                </span>
                <div className="bg-[#17212B] text-[#F5F5F5] p-3.5 rounded-2xl border border-sky-900/40 text-xs space-y-2.5 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold">
                      D
                    </div>
                    <span className="font-bold text-sky-400 text-xs">
                      {settings.telegram.botUsername}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">bot</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-200 whitespace-pre-line">
                    {`📌 درخواست جلسه جدید نیازمند بررسی
🏢 سالن: سالن جلسات مدیران ارشد
👤 هماهنگ‌کننده: احمد کاظمی (واحد مالی)
⏰ زمان: دوشنبه ساعت ۰۹:۰۰ الی ۱۰:۳۰
👥 تعداد حاضرین: ۷ نفر`}
                  </p>
                  {settings.telegram.sendRichButtons && (
                    <div className="pt-1 flex gap-2">
                      <span className="flex-1 text-center py-1.5 bg-[#242F3D] hover:bg-[#2F3D4D] rounded-lg text-[11px] font-semibold text-sky-300 cursor-pointer">
                        🔍 مشاهده در پرتال
                      </span>
                      <span className="flex-1 text-center py-1.5 bg-[#242F3D] hover:bg-[#2F3D4D] rounded-lg text-[11px] font-semibold text-[var(--brand-primary-lighter)] cursor-pointer">
                        ✅ تأیید فوری جلسه
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Test Telegram Button */}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#334155]">
              <button
                type="button"
                onClick={() => {
                  setTestChannel('telegram');
                  setIsTestModalOpen(true);
                }}
                className="w-full py-2.5 px-4 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-900/60 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Send className="w-3.5 h-3.5 -rotate-45" />
                <span>ارسال تست به تلگرام (Test Telegram)</span>
              </button>
            </div>
          </div>

          {/* ---------------- CHANNEL 3: IN-APP PLATFORM ---------------- */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-[#334155] p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
            <div className="space-y-5 text-right">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#334155] gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] text-brand dark:text-[var(--brand-primary-on-dark)] flex items-center justify-center shrink-0 border border-brand-soft/60 dark:border-[rgb(var(--brand-primary-rgb)/0.35)]">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      اعلان‌های درون‌برنامه‌ای (In-App)
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
                      زنگوله بالای صفحه و هشدارهای صوتی لحظه‌ای
                    </p>
                  </div>
                </div>

                {/* Master Switch */}
                <SwitchToggle
                  checked={settings.inApp.enabled}
                  onChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      inApp: { ...prev.inApp, enabled: checked },
                    }))
                  }
                  color="teal"
                />
              </div>

              {/* Sound & Popups Toggles */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[rgb(var(--brand-primary-rgb)/0.15)] dark:bg-[rgb(var(--brand-primary-rgb)/0.2)] flex items-center justify-center text-brand dark:text-[var(--brand-primary-on-dark)] shrink-0">
                      {settings.inApp.soundEnabled ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        پخش صدای هشدار (Sound Alert)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        پخش زنگ کوتاه هنگام وقوع رزرو یا لغو جدید
                      </span>
                    </div>
                  </div>
                  <SwitchToggle
                    checked={settings.inApp.soundEnabled}
                    onChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        inApp: { ...prev.inApp, soundEnabled: checked },
                      }))
                    }
                    color="teal"
                    size="sm"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100/60 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        نمایش پاپ‌آپ و بنر شناور (Toast Popup)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        نمایش کادر اطلاع‌رسانی در بالای صفحه کاربران
                      </span>
                    </div>
                  </div>
                  <SwitchToggle
                    checked={settings.inApp.toastPopupEnabled}
                    onChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        inApp: { ...prev.inApp, toastPopupEnabled: checked },
                      }))
                    }
                    color="teal"
                    size="sm"
                  />
                </div>
              </div>

              {/* Retention Policy */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-[#334155]">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  مدت نگهداری اعلان‌ها در حافظه سیستم
                </label>
                <select
                  value={settings.inApp.retentionDays}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      inApp: { ...prev.inApp, retentionDays: Number(e.target.value) },
                    }))
                  }
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.2)] focus:border-[var(--brand-primary)] focus:outline-hidden"
                >
                  <option value={7}>۷ روز گذشته</option>
                  <option value={14}>۱۴ روز گذشته (پیش‌فرض پیشنهادی)</option>
                  <option value={30}>۳۰ روز گذشته</option>
                  <option value={90}>۳ ماه گذشته</option>
                </select>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  اعلان‌های خوانده‌شده قدیمی‌تر به صورت خودکار بایگانی می‌شوند.
                </p>
              </div>

              {/* In-App Live Dropdown Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#334155]">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  پیش‌نمایش کارت اعلان درون‌برنامه‌ای:
                </span>
                <div className="p-3.5 bg-slate-50 dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-[#334155] flex items-start gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-brand-soft0/10 text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        تأیید جلسه هماهنگی پروژه‌ها
                      </h5>
                      <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      جلسه شما در سالن ابوریحان برای ساعت ۱۴:۰۰ تأیید گردید.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Test In-App Button */}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#334155]">
              <button
                type="button"
                onClick={() => {
                  setTestChannel('in_app');
                  setIsTestModalOpen(true);
                }}
                className="w-full py-2.5 px-4 bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.12)] hover:bg-[rgb(var(--brand-primary-rgb)/0.12)] dark:hover:bg-[rgb(var(--brand-primary-rgb)/0.2)] text-brand dark:text-[var(--brand-primary-on-dark)] border border-brand-soft dark:border-[rgb(var(--brand-primary-rgb)/0.4)] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>ارسال اعلان تستی به هدر (Test In-App)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: RULES MATRIX TABLE                                */}
      {/* ======================================================== */}
      {activeTab === 'rules' && (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-[#334155] shadow-xs overflow-hidden transition-colors">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                ماتریس جامع کنترل کانال‌های ارسال به تفکیک رویداد
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                مشخص کنید هر رخداد سازمانی از چه طریقی (SMS، تلگرام یا درون اپ) و برای چه کسانی ارسال شود
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازنشانی به مقادیر پیش‌فرض</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-[#0D1527] text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-[#334155]">
                <tr>
                  <th className="px-5 py-4 whitespace-nowrap">عنوان رویداد و شرح کاربردی</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-brand" />
                      <span>اعلان درون‌برنامه‌ای</span>
                    </span>
                  </th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-brand" />
                      <span>پیامک (SMS)</span>
                    </span>
                  </th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-sky-600 -rotate-45" />
                      <span>ربات تلگرام</span>
                    </span>
                  </th>
                  <th className="px-5 py-4 text-center whitespace-nowrap">مخاطبان پیش‌فرض</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#334155]">
                {settings.rules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#334155]/40 transition-colors"
                  >
                    {/* Event Title & Desc */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {rule.titleFa}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 max-w-md leading-relaxed">
                        {rule.descriptionFa}
                      </div>
                    </td>

                    {/* In-App Toggle */}
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule.id, 'inApp')}
                        className={`w-9 h-9 rounded-xl inline-flex items-center justify-center transition-all cursor-pointer ${
                          rule.inApp
                            ? 'bg-teal-100 dark:bg-[rgb(var(--brand-primary-rgb)/0.2)] text-brand dark:text-[var(--brand-primary-on-dark)] border border-teal-300 dark:border-teal-800 shadow-2xs'
                            : 'bg-slate-100 dark:bg-[#0F172A] text-slate-400 border border-slate-200 dark:border-slate-800'
                        }`}
                        title={rule.inApp ? 'فعال (کلیک برای غیرفعال‌سازی)' : 'غیرفعال (کلیک برای فعال‌سازی)'}
                      >
                        {rule.inApp ? <Check className="w-4 h-4 stroke-[2.5]" /> : <X className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* SMS Toggle */}
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule.id, 'sms')}
                        className={`w-9 h-9 rounded-xl inline-flex items-center justify-center transition-all cursor-pointer ${
                          rule.sms
                            ? 'bg-[rgb(var(--brand-primary-rgb)/0.12)] dark:bg-[rgb(var(--brand-primary-rgb)/0.2)] text-brand dark:text-[var(--brand-primary-on-dark)] border border-brand-soft dark:border-[rgb(var(--brand-primary-rgb)/0.35)] shadow-2xs'
                            : 'bg-slate-100 dark:bg-[#0F172A] text-slate-400 border border-slate-200 dark:border-slate-800'
                        }`}
                        title={rule.sms ? 'پیامک فعال' : 'پیامک غیرفعال'}
                      >
                        {rule.sms ? <Check className="w-4 h-4 stroke-[2.5]" /> : <X className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* Telegram Toggle */}
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule.id, 'telegram')}
                        className={`w-9 h-9 rounded-xl inline-flex items-center justify-center transition-all cursor-pointer ${
                          rule.telegram
                            ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 shadow-2xs'
                            : 'bg-slate-100 dark:bg-[#0F172A] text-slate-400 border border-slate-200 dark:border-slate-800'
                        }`}
                        title={rule.telegram ? 'تلگرام فعال' : 'تلگرام غیرفعال'}
                      >
                        {rule.telegram ? <Check className="w-4 h-4 stroke-[2.5]" /> : <X className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* Audience Tag */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#0F172A] border border-slate-200/70 dark:border-[#334155] px-3 py-1 rounded-lg">
                        {rule.audience === 'manager' && 'مدیر و مسئول سالن'}
                        {rule.audience === 'organizer' && 'هماهنگ‌کننده جلسه'}
                        {rule.audience === 'participants' && 'شرکت‌کنندگان'}
                        {rule.audience === 'all' && 'تمام طرفین جلسه'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: DISPATCH LOGS & AUDIT                             */}
      {/* ======================================================== */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Logs Filter Bar */}
          <div className="bg-white dark:bg-[#1E293B] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                placeholder="جستجو در گیرنده، عنوان یا متن پیام..."
                className="w-full text-xs pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.2)] focus:border-[var(--brand-primary)] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0F172A] p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLogFilterChannel('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    logFilterChannel === 'all'
                      ? 'bg-white dark:bg-[#334155] text-slate-900 dark:text-white shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  همه کانال‌ها
                </button>
                <button
                  type="button"
                  onClick={() => setLogFilterChannel('sms')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    logFilterChannel === 'sms'
                      ? 'bg-white dark:bg-[#334155] text-brand dark:text-[var(--brand-primary-on-dark)] shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  پیامک
                </button>
                <button
                  type="button"
                  onClick={() => setLogFilterChannel('telegram')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    logFilterChannel === 'telegram'
                      ? 'bg-white dark:bg-[#334155] text-sky-600 dark:text-sky-400 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  تلگرام
                </button>
                <button
                  type="button"
                  onClick={() => setLogFilterChannel('in_app')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    logFilterChannel === 'in_app'
                      ? 'bg-white dark:bg-[#334155] text-brand dark:text-[var(--brand-primary-on-dark)] shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  درون اپ
                </button>
              </div>

              {logs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="p-2 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                  title="پاکسازی تاریخچه لاگ‌ها"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Logs List */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs overflow-hidden">
            {filteredLogs.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Bell className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">هیچ رکوردی در تاریخچه ارسال یافت نشد</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#334155]">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-[#334155]/30 transition-colors flex items-start gap-4 text-right"
                  >
                    {/* Channel Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        log.channel === 'sms'
                          ? 'bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] text-brand dark:text-[var(--brand-primary-on-dark)] border border-brand-soft/60 dark:dark:border-[rgb(var(--brand-primary-rgb)/0.35)]'
                          : log.channel === 'telegram'
                          ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-900/50'
                          : 'bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] text-brand dark:text-[var(--brand-primary-on-dark)] border border-brand-soft/60 dark:border-[rgb(var(--brand-primary-rgb)/0.35)]'
                      }`}
                    >
                      {log.channel === 'sms' && <Smartphone className="w-4 h-4" />}
                      {log.channel === 'telegram' && <Send className="w-4 h-4 -rotate-45" />}
                      {log.channel === 'in_app' && <Bell className="w-4 h-4" />}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {log.title}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
                            {log.recipient}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-brand dark:text-[var(--brand-primary-on-dark)] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تحویل شد</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {log.timestamp}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed bg-slate-50 dark:bg-[#0F172A] p-2.5 rounded-lg border border-slate-200/60 dark:border-[#334155]">
                        {log.preview}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TEST / SIMULATION MODAL                                  */}
      {/* ======================================================== */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-[#334155] w-full max-w-lg overflow-hidden transition-colors text-right">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[var(--brand-primary-light)] text-white flex items-center justify-between border-b border-[var(--brand-primary-hover)]">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5" />
                <h3 className="text-sm font-bold">شبیه‌ساز و ارسال آزمایشی اعلان به کانال‌ها</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTestModalOpen(false)}
                className="text-emerald-100 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Channel Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  انتخاب کانال مورد آزمایش:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTestChannel('sms')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      testChannel === 'sms'
                        ? 'border-brand bg-brand-soft text-[var(--brand-primary)] dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] dark:text-[var(--brand-primary-on-dark)] font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-brand" />
                    <span className="text-xs">پیامک (SMS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestChannel('telegram')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      testChannel === 'telegram'
                        ? 'border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200 font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Send className="w-5 h-5 text-sky-500 -rotate-45" />
                    <span className="text-xs">ربات تلگرام</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestChannel('in_app')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      testChannel === 'in_app'
                        ? 'border-teal-500 bg-brand-soft text-brand dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] dark:text-[var(--brand-primary-on-dark)] font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Bell className="w-5 h-5 text-brand" />
                    <span className="text-xs">درون‌برنامه‌ای</span>
                  </button>
                </div>
              </div>

              {/* Target recipient field */}
              {testChannel === 'sms' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    شماره موبایل گیرنده پیامک تست:
                  </label>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="09123456789"
                    dir="ltr"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white font-mono text-left focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-brand focus:outline-hidden"
                  />
                </div>
              ) : testChannel === 'telegram' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    شناسه چت یا کانال تلگرام:
                  </label>
                  <input
                    type="text"
                    value={testChatId}
                    onChange={(e) => setTestChatId(e.target.value)}
                    placeholder="@rooomchi_management"
                    dir="ltr"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white font-mono text-left focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
              ) : (
                <div className="p-3.5 bg-brand-soft/60 dark:bg-[rgb(var(--brand-primary-rgb)/0.1)] border border-brand-soft/70 dark:border-[rgb(var(--brand-primary-rgb)/0.35)] rounded-xl text-xs text-brand dark:text-[var(--brand-primary-on-dark)] flex items-center gap-2.5">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>این پیام بلافاصله در زنگوله بالای صفحه (Header) برای شما ثبت خواهد شد.</span>
                </div>
              )}

              {/* Custom Message */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  متن پیام سفارشی (اختیاری):
                </label>
                <textarea
                  rows={3}
                  value={testCustomMessage}
                  onChange={(e) => setTestCustomMessage(e.target.value)}
                  placeholder="در صورت خالی بودن، متن استاندارد سامانه روم‌چی ارسال خواهد شد..."
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 resize-none leading-relaxed focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-brand focus:outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-[#334155]">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleExecuteTest}
                  disabled={isSendingTest}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[var(--brand-primary-light)] hover:bg-[var(--brand-primary-hover)] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingTest ? 'در حال ارسال و استعلام...' : 'ارسال تست واقعی'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
