import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Amenity } from '../../types';
import { getAllAmenitiesList, isBaseAmenity } from '../../constants/amenities';
import { ApiService } from '../../services/apiService';
import {
  AMENITY_CATEGORY_LABELS,
  AMENITY_ICON_OPTIONS,
  getAmenityIcon,
} from './adminAmenityUi';
import { ChevronDown, Plus, Sparkles, Trash2, X } from 'lucide-react';

export const AdminAmenitiesView: React.FC = () => {
  const { showToast, currentOrg, updateCurrentOrgData } = useApp();
  const customFromOrg = useMemo(() => {
    const raw = (currentOrg?.settings as { customAmenities?: Amenity[] })?.customAmenities;
    return Array.isArray(raw) ? raw : [];
  }, [currentOrg?.settings]);
  const [customAmenities, setCustomAmenities] = useState<Amenity[]>(customFromOrg);
  const amenities = useMemo(
    () => getAllAmenitiesList(customAmenities),
    [customAmenities],
  );

  useEffect(() => {
    setCustomAmenities(customFromOrg);
  }, [customFromOrg]);

  const persistCustom = async (nextCustom: Amenity[]) => {
    const org = await ApiService.getAdminOrganization();
    await ApiService.putAdminOrganization({ ...org, customAmenities: nextCustom });
    setCustomAmenities(nextCustom);
    if (currentOrg) {
      updateCurrentOrgData({
        settings: { ...currentOrg.settings, customAmenities: nextCustom },
      });
    }
  };
  const [newAmenityName, setNewAmenityName] = useState('');
  const [newAmenityCategory, setNewAmenityCategory] = useState<
    'av' | 'tech' | 'comfort' | 'facility'
  >('tech');
  const [newAmenityIcon, setNewAmenityIcon] = useState('Sparkles');
  const [formOpen, setFormOpen] = useState(false);

  const handleAdd = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newAmenityName.trim()) {
      showToast('عنوان امکانات را وارد کنید', 'error');
      return;
    }
    const newAmenity: Amenity = {
      id: `custom_${Date.now()}`,
      name: newAmenityName.trim(),
      nameFa: newAmenityName.trim(),
      icon: newAmenityIcon,
      category: newAmenityCategory,
    };
    const existingIdx = customAmenities.findIndex((a) => a.id === newAmenity.id);
    const nextCustom =
      existingIdx >= 0
        ? customAmenities.map((a, i) => (i === existingIdx ? newAmenity : a))
        : [...customAmenities, newAmenity];
    try {
      await persistCustom(nextCustom);
      setNewAmenityName('');
      setFormOpen(false);
      showToast(`«${newAmenity.nameFa}» به فهرست امکانات اضافه شد`, 'success');
    } catch {
      showToast('ذخیره روی سرور ناموفق بود', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (isBaseAmenity(id)) {
      showToast('امکانات پیش‌فرض سیستم قابل حذف نیست', 'error');
      return;
    }
    const nextCustom = customAmenities.filter((a) => a.id !== id);
    try {
      await persistCustom(nextCustom);
      showToast('امکانات سفارشی حذف شد', 'success');
    } catch {
      showToast('حذف انجام نشد', 'error');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0" id="admin-amenities-view">
      <div className="bg-white dark:bg-[#1E293B] portal-card-pad rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--brand-primary)]" />
            امکانات و تجهیزات اتاق
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
            فهرست امکاناتی که هنگام تعریف اتاق یا رزرو سالن قابل انتخاب است. موارد پیش‌فرض ثابت
            هستند؛ امکانات سفارشی را می‌توانید اضافه یا حذف کنید.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--brand-primary)] text-white hover:opacity-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          امکانات جدید
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleAdd}
          className="bg-white dark:bg-[#1E293B] p-4 sm:p-5 rounded-2xl border border-brand-soft dark:border-[rgb(var(--brand-primary-rgb)/0.35)] space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">تعریف امکانات جدید</span>
            <button type="button" onClick={() => setFormOpen(false)} className="text-slate-400 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                عنوان *
              </label>
              <input
                className="w-full text-sm px-3.5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900"
                value={newAmenityName}
                onChange={(e) => setNewAmenityName(e.target.value)}
                placeholder="مثال: دوربین PTZ"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                دسته‌بندی
              </label>
              <div className="relative">
                <select
                  className="w-full text-sm appearance-none ps-3.5 pe-10 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 cursor-pointer"
                  value={newAmenityCategory}
                  onChange={(e) =>
                    setNewAmenityCategory(e.target.value as 'av' | 'tech' | 'comfort' | 'facility')
                  }
                >
                  <option value="av">صوتی و تصویری</option>
                  <option value="tech">فناوری و شبکه</option>
                  <option value="facility">تجهیزات و مبلمان</option>
                  <option value="comfort">رفاهی و آسایش</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              آیکون
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AMENITY_ICON_OPTIONS.map((item) => {
                const IconC = item.Icon;
                const selected = newAmenityIcon === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setNewAmenityIcon(item.id)}
                    className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 border cursor-pointer ${
                      selected
                        ? 'bg-[var(--brand-primary)] text-white border-transparent'
                        : 'border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    <IconC className="w-3 h-3" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--brand-primary)] text-white cursor-pointer"
          >
            ذخیره امکانات
          </button>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {amenities.map((amenity) => {
          const Icon = getAmenityIcon(amenity.icon);
          const custom = !isBaseAmenity(amenity.id);
          return (
            <div
              key={amenity.id}
              className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-[#334155] flex gap-3 items-start"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-[var(--brand-primary)]">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {amenity.nameFa}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {AMENITY_CATEGORY_LABELS[amenity.category] ?? amenity.category}
                  {custom ? ' · سفارشی' : ' · پیش‌فرض'}
                </div>
              </div>
              {custom && (
                <button
                  type="button"
                  title="حذف"
                  onClick={() => handleDelete(amenity.id)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
