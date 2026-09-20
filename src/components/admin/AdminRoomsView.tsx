import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Room } from '../../types';
import { ALL_AMENITIES } from '../../constants/amenities';
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  CheckCircle2,
  AlertTriangle,
  DoorOpen,
  Wrench,
  X,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { AdminRoomsSkeleton } from '../common/Skeletons';

export const AdminRoomsView: React.FC = () => {
  const { currentOrg, showToast } = useApp();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [capacity, setCapacity] = useState<number>(8);
  const [floor, setFloor] = useState<number>(1);
  const [building, setBuilding] = useState<string>('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [requiresApproval, setRequiresApproval] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchRooms = async () => {
    if (!currentOrg) return;
    try {
      setIsLoading(true);
      const data = await ApiService.getRooms({ orgId: currentOrg.id });
      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [currentOrg]);

  const handleOpenAddModal = () => {
    setEditingRoom(null);
    setName('');
    setCode(`RM-${Math.floor(100 + Math.random() * 900)}`);
    setCapacity(10);
    setFloor(1);
    setBuilding(currentOrg?.buildings?.[0] || 'ساختمان اصلی');
    setSelectedAmenities(['projector', 'whiteboard', 'wifi']);
    setRequiresApproval(false);
    setImageUrl(
      'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop&q=80'
    );
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (room: Room) => {
    setEditingRoom(room);
    setName(room.name);
    setCode(room.code);
    setCapacity(room.capacity);
    setFloor(room.floor);
    setBuilding(room.building);
    setSelectedAmenities(room.amenities);
    setRequiresApproval(!!room.requiresApproval);
    setImageUrl(room.imageUrl);
    setIsModalOpen(true);
  };

  const handleToggleAmenity = (id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleMaintenance = async (room: Room) => {
    const newStatus = room.status === 'maintenance' ? 'available' : 'maintenance';
    try {
      await ApiService.updateRoom(room.id, { status: newStatus });
      showToast(
        newStatus === 'maintenance'
          ? `اتاق ${room.name} در وضعیت تعمیرات قرار گرفت`
          : `اتاق ${room.name} مجدداً فعال و آزاد شد`,
        'info'
      );
      fetchRooms();
    } catch (err: any) {
      showToast(err.message || 'خطا در تغییر وضعیت اتاق', 'error');
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    if (!window.confirm(`آیا از حذف اتاق جلسات «${room.name}» اطمینان دارید؟`)) return;
    try {
      await ApiService.deleteRoom(room.id);
      showToast('اتاق با موفقیت حذف شد', 'success');
      fetchRooms();
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف اتاق', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !name.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingRoom) {
        await ApiService.updateRoom(editingRoom.id, {
          name: name.trim(),
          code: code.trim(),
          capacity: Number(capacity),
          floor: Number(floor),
          building,
          amenities: selectedAmenities,
          requiresApproval,
          imageUrl: imageUrl.trim(),
        });
        showToast('مشخصات اتاق با موفقیت بروزرسانی شد', 'success');
      } else {
        await ApiService.createRoom({
          orgId: currentOrg.id,
          name: name.trim(),
          code: code.trim(),
          capacity: Number(capacity),
          floor: Number(floor),
          building,
          amenities: selectedAmenities,
          requiresApproval,
          imageUrl:
            imageUrl.trim() ||
            'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop&q=80',
        });
        showToast('اتاق جدید با موفقیت به سازمان اضافه گردید', 'success');
      }
      setIsModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره مشخصات اتاق', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <AdminRoomsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="text-xs font-semibold text-[#10B981] dark:text-[#34D399] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#10B981]" />
            <span>پنل مدیریت منابع فیزیکی</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تعریف ظرفیت، تجهیزات هوشمند، سیاست‌های دسترسی و وضعیت فعال/تعمیرات
          </p>
        </div>

        <button
          id="btn-add-room-admin"
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-[#10B981] hover:bg-[#0D6B63] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن اتاق جدید</span>
        </button>
      </div>

      {/* Rooms Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-[#0D1527] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-[#334155]">
              <tr>
                <th className="px-5 py-4 whitespace-nowrap">اتاق و کد</th>
                <th className="px-5 py-4 whitespace-nowrap">ساختمان و طبقه</th>
                <th className="px-5 py-4 whitespace-nowrap">ظرفیت</th>
                <th className="px-5 py-4">تجهیزات</th>
                <th className="px-5 py-4 whitespace-nowrap">وضعیت</th>
                <th className="px-5 py-4 whitespace-nowrap min-w-[150px]">سیاست تأیید</th>
                <th className="px-5 py-4 text-left whitespace-nowrap">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#334155]">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-slate-50/70 dark:hover:bg-[#334155]/50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#0F172A] shrink-0 border border-slate-200/60 dark:border-[#334155]">
                        <img
                          src={room.imageUrl}
                          alt={room.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{room.name}</div>
                        <div className="text-[11px] text-slate-400">{room.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    <div>{room.building}</div>
                    <div className="text-[11px] text-slate-400">طبقه {room.floor}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                    {room.capacity} نفر
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {room.amenities.map((amId) => {
                        const am = ALL_AMENITIES.find((a) => a.id === amId);
                        return (
                          <span
                            key={amId}
                            className="text-[11px] bg-slate-100 dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-[#334155] whitespace-nowrap"
                          >
                            {am ? am.nameFa : amId}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {room.status === 'maintenance' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100/90 dark:bg-amber-950/50 px-3 py-1.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40 whitespace-nowrap">
                        <Wrench className="w-3.5 h-3.5 shrink-0" />
                        <span>تعمیرات</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/90 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>فعال و آماده</span>
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {room.requiresApproval ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 whitespace-nowrap shadow-xs">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>نیاز به تأیید ادمین</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#0F172A] px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-[#334155] whitespace-nowrap">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>رزرو آنی خودکار</span>
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-left whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleMaintenance(room)}
                        className={`p-2 rounded-xl border transition-colors ${
                          room.status === 'maintenance'
                            ? 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100'
                            : 'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100'
                        }`}
                        title={
                          room.status === 'maintenance' ? 'خروج از تعمیرات' : 'تغییر به وضعیت تعمیرات'
                        }
                      >
                        <Wrench className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(room)}
                        className="p-2 text-[#10B981] dark:text-[#34D399] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl transition-colors"
                        title="ویرایش اتاق"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteRoom(room)}
                        className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-colors"
                        title="حذف اتاق"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#334155] w-full max-w-xl overflow-hidden transition-colors">
            <div className="px-6 py-4 bg-[#0F786E] text-white flex items-center justify-between border-b border-[#334155]">
              <h3 className="text-sm font-bold">
                {editingRoom ? 'ویرایش مشخصات اتاق' : 'افزودن اتاق جدید به سازمان'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نام اتاق *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: اتاق نوآوری کارون"
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#10B981]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    کد شناسایی اتاق
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="RM-201"
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ظرفیت (تعداد نفرات)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#10B981]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">طبقه</label>
                  <input
                    type="number"
                    value={floor}
                    onChange={(e) => setFloor(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#10B981]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ساختمان</label>
                <select
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white"
                >
                  {(currentOrg?.buildings ?? []).map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  تجهیزات و امکانات اتاق
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_AMENITIES.map((amenity) => {
                    const isChecked = selectedAmenities.includes(amenity.id);
                    return (
                      <button
                        type="button"
                        key={amenity.id}
                        onClick={() => handleToggleAmenity(amenity.id)}
                        className={`p-2 rounded-lg border text-right text-xs flex items-center justify-between ${
                          isChecked
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-[#10B981] text-[#10B981] dark:text-[#34D399] font-bold'
                            : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span>{amenity.nameFa}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] dark:text-[#34D399]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresApproval}
                    onChange={(e) => setRequiresApproval(e.target.checked)}
                    className="w-4 h-4 text-[#10B981] rounded"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    رزرو این اتاق نیازمند تأیید قبلی مدیریت باشد
                  </span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-[#334155]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#10B981] hover:bg-[#0D6B63] rounded-xl"
                >
                  {isSubmitting ? 'در حال ثبت...' : editingRoom ? 'ذخیره تغییرات' : 'افزودن اتاق'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
