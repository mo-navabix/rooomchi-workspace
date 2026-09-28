import React, { useState, useEffect, useMemo } from 'react';
import { Team, User } from '../../../types';
import { TeamFormData } from '../types';
import {
  ArrowRight,
  Save,
  Search,
  Check,
  AlertCircle,
  X,
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
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
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

  const selectedUsers = useMemo(
    () =>
      selectedUserIds
        .map((id) => availableOrgUsers.find((u) => u.id === id))
        .filter(Boolean) as User[],
    [selectedUserIds, availableOrgUsers],
  );

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

  const inputClass =
    'w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.40)] dark:text-white';

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 pb-8">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-[var(--brand-primary)] dark:hover:text-[var(--brand-primary-on-dark)] transition-colors cursor-pointer"
      >
        <ArrowRight className="w-4 h-4" />
        <span>بازگشت به لیست تیم‌ها</span>
      </button>

      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-5 sm:px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0F172A]/30">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            {isEditing ? `ویرایش تیم «${initialTeam?.name}»` : 'تیم جدید'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            در سازمان <span className="font-semibold text-slate-700 dark:text-slate-200">{orgName}</span>
            {' — '}
            ابتدا نام تیم را مشخص کنید، سپس همکاران را اضافه کنید.
          </p>
        </div>

        {errorMessage && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-6 space-y-8">
          <section className="space-y-4" aria-labelledby="team-info-heading">
            <h3 id="team-info-heading" className="text-sm font-bold text-slate-800 dark:text-slate-100">
              ۱. مشخصات تیم
            </h3>
            <div className="space-y-1.5">
              <label htmlFor="team-name" className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                نام تیم <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً تیم محصول"
                className={inputClass}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="team-description"
                className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                توضیح کوتاه <span className="text-slate-400 font-normal">(اختیاری)</span>
              </label>
              <textarea
                id="team-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="این تیم برای چه کاری تشکیل شده؟"
                className={`${inputClass} resize-none`}
              />
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="team-members-heading">
            <div>
              <h3 id="team-members-heading" className="text-sm font-bold text-slate-800 dark:text-slate-100">
                ۲. اعضای تیم
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                روی نام هر همکار بزنید تا به تیم اضافه شود. می‌توانید بعداً هم اعضا را تغییر دهید.
              </p>
            </div>

            {selectedUsers.length > 0 && (
              <div className="rounded-xl border border-[rgb(var(--brand-primary-rgb)/0.25)] bg-brand-soft/60 dark:bg-[rgb(var(--brand-primary-rgb)/0.08)] p-3">
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-2">
                  اعضای انتخاب‌شده ({selectedUsers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleToggleUser(user.id)}
                      className="inline-flex items-center gap-1.5 max-w-full px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:border-rose-300 dark:hover:border-rose-700 cursor-pointer transition-colors"
                      title="حذف از تیم"
                    >
                      <span className="truncate">{user.name}</span>
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="جستجوی همکار..."
                className={`${inputClass} pr-9 text-sm`}
              />
            </div>

            <ul className="max-h-56 sm:max-h-72 overflow-y-auto space-y-1.5 list-none p-0 m-0">
              {filteredUsers.length === 0 ? (
                <li className="text-center py-8 text-sm text-slate-400">همکاری پیدا نشد</li>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => handleToggleUser(user.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.12)] border-[rgb(var(--brand-primary-rgb)/0.35)]'
                            : 'bg-slate-50/80 dark:bg-[#0F172A] border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                            isSelected
                              ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold text-slate-800 dark:text-white truncate">
                            {user.name}
                          </span>
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {user.department || user.jobTitle || 'پرسنل سازمان'}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              id="btn-save-team-form"
              disabled={isSubmitting || !name.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white btn-brand rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSubmitting ? 'در حال ذخیره...' : isEditing ? 'ذخیره تغییرات' : 'ایجاد تیم'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
