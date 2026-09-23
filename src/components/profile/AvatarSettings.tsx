import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { getGravatarUrl } from '../../utils/avatar';
import {
  Camera,
  Upload,
  Globe,
  Trash2,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

type AvatarMode = 'initials' | 'google' | 'custom' | 'gravatar';

interface Props {
  onClose?: () => void;
}

export const AvatarSettings: React.FC<Props> = ({ onClose }) => {
  const { currentUser, updateCurrentUser, showToast, syncGoogleProfile } = useApp();

  const currentType: AvatarMode = (currentUser?.avatarType as AvatarMode) || (currentUser?.avatar ? 'custom' : 'initials');
  const [selectedMode, setSelectedMode] = useState<AvatarMode>(currentType);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>(currentUser?.avatar || '');
  const [gravatarStyle, setGravatarStyle] = useState<'identicon' | 'retro' | 'robohash' | 'mp'>('identicon');
  const [isUploading, setIsUploading] = useState(false);

  if (!currentUser) return null;

  // Compute preview URL based on selected mode
  const getPreviewAvatar = (): { url: string | undefined; type: AvatarMode } => {
    if (selectedMode === 'google') {
      return {
        url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80',
        type: 'google',
      };
    }
    if (selectedMode === 'gravatar') {
      return {
        url: getGravatarUrl(currentUser.email, 200, gravatarStyle),
        type: 'gravatar',
      };
    }
    if (selectedMode === 'custom') {
      return {
        url: customAvatarUrl.trim() || undefined,
        type: 'custom',
      };
    }
    return {
      url: undefined,
      type: 'initials',
    };
  };

  const preview = getPreviewAvatar();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('لطفاً یک فایل تصویری معتبر انتخاب کنید', 'error');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      showToast('حجم تصویر نباید بیشتر از ۲.۵ مگابایت باشد', 'error');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomAvatarUrl(dataUrl);
      setSelectedMode('custom');
      setIsUploading(false);
      showToast('تصویر بارگذاری شد', 'success');
    };
    reader.onerror = () => {
      setIsUploading(false);
      showToast('خطا در خواندن فایل تصویر', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (selectedMode === 'google') {
      updateCurrentUser({
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80',
        avatarType: 'google',
      });
      showToast('تصویر نمایه گوگل (Gmail) تنظیم شد', 'success');
    } else if (selectedMode === 'gravatar') {
      const gravatarUrl = getGravatarUrl(currentUser.email, 200, gravatarStyle);
      updateCurrentUser({
        avatar: gravatarUrl,
        avatarType: 'gravatar',
      });
      showToast('گراواتار با موفقیت فعال شد', 'success');
    } else if (selectedMode === 'custom') {
      if (!customAvatarUrl.trim()) {
        showToast('لطفاً یک تصویر بارگذاری کنید یا آدرس آن را وارد نمایید', 'error');
        return;
      }
      updateCurrentUser({
        avatar: customAvatarUrl.trim(),
        avatarType: 'custom',
      });
      showToast('آواتار اختصاصی شما ذخیره شد', 'success');
    } else {
      // Default initials
      updateCurrentUser({
        avatar: undefined,
        avatarType: 'initials',
      });
      showToast('حالت حروف اول نام (پیش‌فرض سیستم) فعال شد', 'info');
    }

    if (onClose) onClose();
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#334155] shadow-xs space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0F786E]/10 text-[#0F786E] dark:text-[#5eead4] flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              تنظیمات تصویر پروفایل
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              پیش‌فرض سیستم، اتصال به گوگل یا آپلود تصویر دلخواه
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mode selection pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setSelectedMode('initials')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            selectedMode === 'initials'
              ? 'bg-[#0F786E] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>حروف اول نام (پیش‌فرض)</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedMode('google')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            selectedMode === 'google'
              ? 'bg-[#0F786E] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>تصویر حساب گوگل</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedMode('custom')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            selectedMode === 'custom'
              ? 'bg-[#0F786E] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>آپلود تصویر</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedMode('gravatar')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            selectedMode === 'gravatar'
              ? 'bg-[#0F786E] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>گراواتار</span>
        </button>
      </div>

      {/* Mode Details Section */}
      <div className="bg-slate-50 dark:bg-[#0F172A] rounded-xl p-3 sm:p-4 border border-slate-200/60 dark:border-slate-800">
        {selectedMode === 'initials' && (
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            هیچ عکسی ذخیره نمی‌شود و حرف ابتدای نام شما با گرادیان رنگی سازمانی روم‌چی نمایش داده می‌شود (حالت پیش‌فرض پیشنهادی سیستم).
          </p>
        )}

        {selectedMode === 'google' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                همگام‌سازی با حساب Google / Gmail:
              </span>{' '}
              تصویر نمایه حساب گوگل شما به عنوان آواتار اختصاصی تنظیم می‌شود.
            </div>
            <button
              type="button"
              onClick={() => syncGoogleProfile(currentUser.email)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
            >
              همگام‌سازی فوری
            </button>
          </div>
        )}

        {selectedMode === 'custom' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-[#0F786E]" />
                <span>{isUploading ? 'در حال پردازش...' : 'انتخاب فایل از دستگاه'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              <span className="text-[11px] text-slate-400">فرمت‌های مجاز: PNG, JPG, WebP (حداکثر ۲.۵ مگابایت)</span>
            </div>

            <input
              type="url"
              placeholder="یا لینک اینترنتی تصویر را اینجا وارد کنید (https://...)"
              value={customAvatarUrl}
              onChange={(e) => setCustomAvatarUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0F786E]"
              dir="ltr"
            />
          </div>
        )}

        {selectedMode === 'gravatar' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-600 dark:text-slate-400">
              متصل به ایمیل <span className="font-mono font-bold text-slate-800 dark:text-slate-200" dir="ltr">{currentUser.email}</span> در شبکه جهانی Gravatar.
            </div>
            <select
              value={gravatarStyle}
              onChange={(e) => setGravatarStyle(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="identicon">طرح هندسی (Identicon)</option>
              <option value="retro">طرح رترو (Retro 8-bit)</option>
              <option value="robohash">ربات هوشمند (Robohash)</option>
              <option value="mp">سایه ناشناس (Mystery Person)</option>
            </select>
          </div>
        )}
      </div>

      {/* Footer & Live Preview Bar */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={currentUser.name}
            email={currentUser.email}
            avatar={preview.url}
            avatarType={preview.type}
            size="md"
            showBorder
          />
          <div className="text-right">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              پیش‌نمایش تصویر انتخابی
            </span>
            <span className="text-[11px] text-slate-400">
              {currentUser.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              انصراف
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-[#0F786E] hover:bg-[#0d6b63] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>ذخیره تغییرات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
