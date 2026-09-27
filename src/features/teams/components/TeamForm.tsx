import React, { useState, useEffect } from 'react';
import { Team, User } from '../../../types';
import { TeamFormData } from '../types';
import {
  Users,
  ArrowRight,
  Save,
  Search,
  Check,
  Building2,
  AlertCircle,
} from 'lucide-react';

interface TeamFormProps {
  initialTeam?: Team | null;
  availableOrgUsers: User[];
  orgName: string;
  isSubmitting: boolean;
  onSave: (data: TeamFormData) => Promise<void>;
  onCancel: () => void;
}

export const TeamForm: React.FC<TeamFormProps> = ({
  initialTeam,
  availableOrgUsers,
  orgName,
  isSubmitting,
  onSave,
  onCancel,
}) => {
  const isEditing = Boolean(initialTeam);

  const [name, setName] = useState(initialTeam?.name || '');
  const [description, setDescription] = useState(initialTeam?.description || '');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialTeam) {
      setName(initialTeam.name);
      setDescription(initialTeam.description || '');
      const existingIds = initialTeam.members?.map((m) => m.userId) || [];
      setSelectedUserIds(existingIds);
    }
  }, [initialTeam]);

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = availableOrgUsers.filter((u) => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('نام تیم الزامی است');
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        memberIds: selectedUserIds,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ثبت اطلاعات تیم');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-[var(--brand-primary)] dark:hover:text-[var(--brand-primary-on-dark)] transition-colors cursor-pointer"
      >
        <ArrowRight className="w-4 h-4" />
        <span>انصراف و بازگشت</span>
      </button>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="pb-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)]">
              <Users className="w-5 h-5" />
            </span>
            {isEditing ? `ویرایش تیم «${initialTeam?.name}»` : 'تعریف تیم / گروه کاری جدید'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            سازمان مربوطه: <span className="font-bold text-slate-700 dark:text-slate-300">{orgName}</span>
          </p>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Team Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="team-name"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              نام تیم یا گروه <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: تیم محصول، تیم فنی و مهندسی، شورای سرمایه‌گذاری..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.40)] dark:text-white"
              required
            />
          </div>

          {/* Team Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="team-description"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              توضیحات و حوزه فعالیت تیم <span className="text-[11px] text-slate-400 font-normal">(اختیاری)</span>
            </label>
            <textarea
              id="team-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="شرح مختصری از اعضا و ماموریت این تیم بنویسید..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.40)] dark:text-white resize-none"
            />
          </div>

          {/* Members Selection (especially for creation, or adjusting members) */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                انتخاب اعضای تیم از بین پرسنل سازمان
              </label>
              <span className="text-[11px] font-bold text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] px-2 py-0.5 rounded-md">
                {selectedUserIds.length} نفر انتخاب شده
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              فقط اعضای همین سازمان در این فهرست نمایش داده می‌شوند.
            </p>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="جستجو در بین همکاران..."
                className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.40)] dark:text-white"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 p-1 border border-slate-200/60 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-[#0F172A]/40">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  کاربری با این مشخصات یافت نشد
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleToggleUser(user.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] border-[rgb(var(--brand-primary-rgb)/0.40)] dark:border-[rgb(var(--brand-primary-rgb)/0.40)]'
                          : 'bg-white dark:bg-[#0F172A] border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate" dir="ltr">
                            {user.email} {user.department ? `· ${user.department}` : ''}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0">
                        {user.jobTitle || 'کارمند'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              id="btn-save-team-form"
              disabled={isSubmitting || !name.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white btn-brand rounded-xl shadow-xs hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ذخیره‌سازی...' : isEditing ? 'ذخیره تغییرات تیم' : 'ایجاد تیم'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
