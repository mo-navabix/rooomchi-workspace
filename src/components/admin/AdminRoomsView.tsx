import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Room, Amenity } from '../../types';
import {
  ALL_AMENITIES,
  getAllAmenitiesList,
  getAmenityById,
} from '../../constants/amenities';
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  CheckCircle2,
  Wrench,
  X,
  Sparkles,
  ShieldAlert,
  Search,
  Filter,
  Users,
  Building2,
  Tv,
  Wifi,
  Video,
  Mic,
  PenTool,
  Coffee,
  Wind,
  Projector,
  DoorOpen,
  ChevronDown,
  Info,
  Check,
  UploadCloud,
  Link2,
  Image as ImageIcon,
  Monitor,
  Speaker,
  Laptop,
  Cast,
  Loader2,
} from 'lucide-react';
import { AdminRoomsSkeleton } from '../common/Skeletons';
import { resolveBuildingFloors } from '../../utils/buildingFloors';
import { getAmenityIcon } from './adminAmenityUi';

// Shorter Persian names for compact display in the table
const getAmenityShortName = (id: string, fullName: string) => {
  switch (id) {
    case 'projector':
      return 'پروژکتور';
    case 'smart_tv':
      return 'نمایشگر TV';
    case 'videoconf':
      return 'ویدیوکنفرانس';
    case 'mic_system':
      return 'میکروفن';
    case 'whiteboard':
      return 'وایت‌برد';
    case 'wifi':
      return 'Wi-Fi 6';
    case 'catering':
      return 'پذیرایی';
    case 'ac':
      return 'تهویه مطبوع';
    default:
      return fullName;
  }
};

export const AdminRoomsView: React.FC = () => {
  const { currentOrg, showToast, setActiveTab } = useApp();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterBuilding, setFilterBuilding] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCapacity, setFilterCapacity] = useState<string>('all');

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

  // Available amenities (base + custom created by admin)
  const customAmenities = useMemo(() => {
    const raw = (currentOrg?.settings as { customAmenities?: Amenity[] })?.customAmenities;
    return Array.isArray(raw) ? raw : [];
  }, [currentOrg?.settings]);
  const availableAmenities = useMemo(
    () => getAllAmenitiesList(customAmenities),
    [customAmenities],
  );

  // Image upload and input mode state
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [imageUploadLoading, setImageUploadLoading] = useState<boolean>(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal to view detailed amenities for a room
  const [viewAmenitiesRoom, setViewAmenitiesRoom] = useState<Room | null>(null);

  const fetchRooms = async () => {
    if (!currentOrg) return;
    try {
      setIsLoading(true);
      const data = await ApiService.getRooms({ orgId: currentOrg.id });
      setRooms(data);
    } catch (err) {
      console.error(err);
      showToast('خطا در بارگذاری اتاق‌ها از سرور — دادهٔ محلی نمایش داده نمی‌شود', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [currentOrg]);

  const campusBuildings = useMemo(() => {
    return currentOrg?.buildings?.length ? [...currentOrg.buildings] : ['ساختمان مرکزی'];
  }, [currentOrg]);

  const campusFloors = useMemo(
    () => resolveBuildingFloors(campusBuildings, currentOrg?.settings, rooms),
    [campusBuildings, currentOrg?.settings, rooms],
  );

  const handleOpenAddModal = () => {
    setEditingRoom(null);
    setName('');
    setCode(`RM-${Math.floor(100 + Math.random() * 900)}`);
    setCapacity(10);
    setFloor(1);
    const defaultBuilding = campusBuildings[0] || currentOrg?.buildings?.[0] || 'ساختمان مرکزی';
    setBuilding(defaultBuilding);
    setFloor((campusFloors[defaultBuilding] ?? [1])[0]);
    setSelectedAmenities(['projector', 'whiteboard', 'wifi']);
    setRequiresApproval(false);
    setImageUrl(
      'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop&q=80'
    );
    setImageInputMode('upload');
    setImageUploadError(null);
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
    setImageInputMode(room.imageUrl?.startsWith('data:') ? 'upload' : 'url');
    setImageUploadError(null);
    setIsModalOpen(true);
  };

  // Process and compress image file for fast and reliable storage
  const processImageFile = (file: File) => {
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setImageUploadError('فرمت فایل نامعتبر است. لطفاً فایل تصویری (JPG, PNG, WEBP) انتخاب فرمایید.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setImageUploadError('حجم فایل تصویر نباید بیشتر از 8 مگابایت باشد.');
      return;
    }

    setImageUploadError(null);
    setImageUploadLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setImageUrl(compressed);
        } else {
          setImageUrl(rawDataUrl);
        }
        setImageUploadLoading(false);
        showToast('تصویر با موفقیت بارگذاری و تنظیم شد.', 'success');
      };
      img.onerror = () => {
        setImageUrl(rawDataUrl);
        setImageUploadLoading(false);
        showToast('تصویر با موفقیت بارگذاری شد.', 'success');
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      setImageUploadError('خطا در خواندن فایل تصویر.');
      setImageUploadLoading(false);
    };
    reader.readAsDataURL(file);
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

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = room.name.toLowerCase().includes(q);
        const matchCode = room.code.toLowerCase().includes(q);
        const matchBuilding = room.building.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchBuilding) return false;
      }
      // Building
      if (filterBuilding !== 'all' && room.building !== filterBuilding) {
        return false;
      }
      // Status
      if (filterStatus !== 'all' && room.status !== filterStatus) {
        return false;
      }
      // Capacity
      if (filterCapacity === 'small' && room.capacity > 6) return false;
      if (filterCapacity === 'medium' && (room.capacity < 6 || room.capacity > 12)) return false;
      if (filterCapacity === 'large' && room.capacity < 12) return false;

      return true;
    });
  }, [rooms, searchQuery, filterBuilding, filterStatus, filterCapacity]);

  // Unique buildings list
  const buildingOptions = useMemo(() => {
    const list = new Set<string>(campusBuildings);
    rooms.forEach((r) => list.add(r.building));
    return Array.from(list);
  }, [campusBuildings, rooms]);

  const floorOptionsForBuilding = useMemo(() => {
    const fromCampus = campusFloors[building];
    if (fromCampus?.length) return fromCampus;
    return resolveBuildingFloors([building], currentOrg?.settings, rooms)[building] ?? [1];
  }, [building, campusFloors, currentOrg?.settings, rooms]);

  // Stats
  const totalCount = rooms.length;
  const availableCount = rooms.filter((r) => r.status === 'available').length;
  const maintenanceCount = rooms.filter((r) => r.status === 'maintenance').length;
  const totalCapacity = rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);

  if (isLoading) {
    return <AdminRoomsSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0" id="admin-rooms-view">
      {/* Header & Stats Banner */}
      <div className="bg-white dark:bg-[#1E293B] portal-card-pad rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs transition-colors space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-[var(--brand-primary-light)] dark:text-[var(--brand-primary-lighter)] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[var(--brand-primary-light)]" />
              <span>پنل مدیریت منابع فیزیکی</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
              مدیریت اتاق‌ها و سالن‌های جلسه
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تعریف ظرفیت، تجهیزات، سیاست‌های دسترسی و نظارت بر وضعیت سالن‌ها
            </p>
          </div>

          <button
            id="btn-add-room-admin"
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-[var(--brand-primary-light)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن اتاق جدید</span>
          </button>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-[#334155]">
          <div className="bg-slate-50 dark:bg-[#0F172A] p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">کل اتاق‌ها</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {totalCount} اتاق
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[rgb(var(--brand-primary-rgb)/0.12)]/70 dark:bg-[rgb(var(--brand-primary-rgb)/0.2)] flex items-center justify-center text-[var(--brand-primary-light)]">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#0F172A] p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">فعال و در دسترس</div>
              <div className="text-sm font-bold text-brand dark:text-[var(--brand-primary-on-dark)] mt-0.5">
                {availableCount} اتاق
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[rgb(var(--brand-primary-rgb)/0.12)]/70 dark:bg-[rgb(var(--brand-primary-rgb)/0.2)] flex items-center justify-center text-brand dark:text-[var(--brand-primary-on-dark)]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#0F172A] p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">در حال تعمیرات</div>
              <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {maintenanceCount} اتاق
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-100/70 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#0F172A] p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">مجموع ظرفیت</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {totalCapacity} نفر
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-100/70 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 transition-colors">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="جستجو بر اساس نام اتاق، کد یا نام ساختمان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-9 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary-light)] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Building Filter */}
          <div className="relative min-w-[130px] flex-1 sm:flex-initial">
            <select
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
              className="w-full text-xs pr-3 pl-8 py-2.5 appearance-none bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary-light)] cursor-pointer"
            >
              <option value="all">همه ساختمان‌ها</option>
              {buildingOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[120px] flex-1 sm:flex-initial">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs pr-3 pl-8 py-2.5 appearance-none bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary-light)] cursor-pointer"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="available">فعال و آماده</option>
              <option value="maintenance">در حال تعمیرات</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Capacity Filter */}
          <div className="relative min-w-[120px] flex-1 sm:flex-initial">
            <select
              value={filterCapacity}
              onChange={(e) => setFilterCapacity(e.target.value)}
              className="w-full text-xs pr-3 pl-8 py-2.5 appearance-none bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary-light)] cursor-pointer"
            >
              <option value="all">همه ظرفیت‌ها</option>
              <option value="small">تا 6 نفر</option>
              <option value="medium">6 تا 12 نفر</option>
              <option value="large">بیش از 12 نفر</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-[#0D1527] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-[#334155]">
              <tr>
                <th className="px-5 py-4 whitespace-nowrap min-w-[200px]">اتاق و کد</th>
                <th className="px-5 py-4 whitespace-nowrap min-w-[140px]">ساختمان و طبقه</th>
                <th className="px-5 py-4 whitespace-nowrap min-w-[100px]">ظرفیت</th>
                <th className="px-5 py-4 whitespace-nowrap min-w-[220px]">تجهیزات و امکانات</th>
                <th className="px-5 py-4 whitespace-nowrap min-w-[130px]">وضعیت</th>
                <th className="px-5 py-4 whitespace-nowrap min-w-[140px]">سیاست تأیید</th>
                <th className="px-5 py-4 text-left whitespace-nowrap min-w-[120px]">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#334155]">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <DoorOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        اتاقی با فیلترهای مشخص‌شده یافت نشد
                      </div>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setFilterBuilding('all');
                          setFilterStatus('all');
                          setFilterCapacity('all');
                        }}
                        className="text-xs text-[var(--brand-primary-light)] hover:underline font-semibold mt-1"
                      >
                        پاک کردن همه فیلترها
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
                  return (
                    <tr
                      key={room.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#334155]/40 transition-colors group"
                    >
                      {/* Room & Code */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#0F172A] shrink-0 border border-slate-200/70 dark:border-slate-700/80 shadow-2xs">
                            <img
                              src={room.imageUrl}
                              alt={room.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-[13px]">
                              {room.name}
                            </div>
                            <div className="inline-block mt-0.5">
                              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/50">
                                {room.code}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Building & Floor */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 font-medium text-xs">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{room.building}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 pr-5">
                          طبقه {room.floor}
                        </div>
                      </td>

                      {/* Capacity */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/50">
                          <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>{room.capacity} نفر</span>
                        </div>
                      </td>

                      {/* Equipment (Concise: 3 uniform icon capsules + count badge) */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {room.amenities.length === 0 ? (
                          <span className="text-slate-400 text-xs italic">بدون تجهیزات</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {/* Up to 3 icon capsules */}
                            {room.amenities.slice(0, 3).map((amId) => {
                              const am = availableAmenities.find((a) => a.id === amId) || getAmenityById(amId, customAmenities);
                              const IconComponent = getAmenityIcon(am?.icon);
                              const nameFa = am ? am.nameFa : amId;

                              return (
                                <button
                                  type="button"
                                  key={amId}
                                  onClick={() => setViewAmenitiesRoom(room)}
                                  title={`${nameFa} (کلیک جهت مشاهده کامل)`}
                                  className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center hover:bg-brand-soft dark:hover:bg-[rgb(var(--brand-primary-rgb)/0.15)] hover:text-[var(--brand-primary)] dark:hover:text-[var(--brand-primary-lighter)] hover:border-brand-soft dark:hover:border-[rgb(var(--brand-primary-rgb)/0.35)] transition-all cursor-pointer shadow-2xs group shrink-0"
                                >
                                  <IconComponent className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-[var(--brand-primary)] dark:group-hover:text-[var(--brand-primary-lighter)] transition-colors" />
                                </button>
                              );
                            })}

                            {/* +N More Capsule */}
                            {room.amenities.length > 3 ? (
                              <button
                                type="button"
                                onClick={() => setViewAmenitiesRoom(room)}
                                className="h-8 px-2.5 rounded-xl bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] text-[var(--brand-primary)] dark:text-[var(--brand-primary-lighter)] border border-brand-soft/80 dark:border-[rgb(var(--brand-primary-rgb)/0.35)]/60 text-xs font-bold hover:bg-[rgb(var(--brand-primary-rgb)/0.12)] dark:hover:bg-[rgb(var(--brand-primary-rgb)/0.22)] transition-colors flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                                title="مشاهده همه تجهیزات این سالن"
                              >
                                <span>+{room.amenities.length - 3}</span>
                                <span className="text-[10px] font-normal opacity-85">دیگر</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setViewAmenitiesRoom(room)}
                                className="h-8 w-7 rounded-xl text-slate-400 hover:text-[var(--brand-primary)] dark:hover:text-[var(--brand-primary-lighter)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-[11px] font-medium flex items-center justify-center cursor-pointer shrink-0"
                                title="مشاهده جزئیات تجهیزات"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {room.status === 'maintenance' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100/90 dark:bg-amber-950/50 px-2.5 py-1 rounded-xl border border-amber-200/60 dark:border-amber-900/40 whitespace-nowrap">
                            <Wrench className="w-3.5 h-3.5 shrink-0" />
                            <span>تعمیرات</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand dark:text-[var(--brand-primary-on-dark)] bg-[rgb(var(--brand-primary-rgb)/0.12)]/90 dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] px-2.5 py-1 rounded-xl border border-brand-soft/60 dark:dark:border-[rgb(var(--brand-primary-rgb)/0.3)] whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>فعال و آماده</span>
                          </span>
                        )}
                      </td>

                      {/* Approval Policy */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {room.requiresApproval ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-900/60 whitespace-nowrap">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>تأیید مدیریت</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#0F172A] px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-[#334155] whitespace-nowrap">
                            <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />
                            <span>رزرو آنی</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-left whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleMaintenance(room)}
                            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                              room.status === 'maintenance'
                                ? 'text-brand dark:text-[var(--brand-primary-on-dark)] border-brand-soft dark:dark:border-[rgb(var(--brand-primary-rgb)/0.3)] bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.12)] hover:bg-[rgb(var(--brand-primary-rgb)/0.12)]'
                                : 'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100'
                            }`}
                            title={
                              room.status === 'maintenance'
                                ? 'خروج از تعمیرات و فعال‌سازی'
                                : 'تغییر به وضعیت تعمیرات'
                            }
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(room)}
                            className="p-2 text-[var(--brand-primary-light)] dark:text-[var(--brand-primary-lighter)] hover:bg-brand-soft dark:hover:bg-[rgb(var(--brand-primary-rgb)/0.12)] border border-brand-soft dark:dark:border-[rgb(var(--brand-primary-rgb)/0.3)] rounded-xl transition-colors cursor-pointer"
                            title="ویرایش مشخصات اتاق"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteRoom(room)}
                            className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-colors cursor-pointer"
                            title="حذف سالن جلسات"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#334155] w-full max-w-xl overflow-hidden transition-colors">
            <div className="px-6 py-4 bg-[var(--brand-primary)] text-white flex items-center justify-between border-b border-[#334155]">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-[var(--brand-primary-lighter)]" />
                <h3 className="text-sm font-bold">
                  {editingRoom ? 'ویرایش مشخصات اتاق جلسات' : 'افزودن اتاق جلسه جدید'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
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
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--brand-primary-light)] focus:outline-hidden"
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
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--brand-primary-light)] focus:outline-hidden font-mono"
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
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--brand-primary-light)] focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ساختمان
                  </label>
                  <div className="relative">
                    <select
                      value={building}
                      onChange={(e) => {
                        const b = e.target.value;
                        setBuilding(b);
                        const floors = campusFloors[b] ?? resolveBuildingFloors([b], currentOrg?.settings, rooms)[b] ?? [1];
                        if (!floors.includes(floor)) setFloor(floors[0]);
                      }}
                      className="w-full text-xs pr-3 pl-8 py-2.5 appearance-none border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--brand-primary-light)] focus:outline-hidden cursor-pointer"
                    >
                      {buildingOptions.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    طبقه
                  </label>
                  <div className="relative">
                    <select
                      value={floor}
                      onChange={(e) => setFloor(Number(e.target.value))}
                      className="w-full text-xs pr-3 pl-8 py-2.5 appearance-none border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--brand-primary-light)] focus:outline-hidden cursor-pointer"
                      required
                    >
                      {floorOptionsForBuilding.map((f) => (
                        <option key={f} value={f}>
                          طبقه {f}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Image Input Section: Upload & URL Mode */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[var(--brand-primary-light)]" />
                    <span>تصویر سالن جلسه</span>
                  </label>
                  {/* Mode switcher tabs */}
                  <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
                        imageInputMode === 'upload'
                          ? 'bg-white dark:bg-slate-800 text-[var(--brand-primary)] dark:text-[var(--brand-primary-lighter)] shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <UploadCloud className="w-3 h-3" />
                      <span>آپلود فایل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
                        imageInputMode === 'url'
                          ? 'bg-white dark:bg-slate-800 text-[var(--brand-primary)] dark:text-[var(--brand-primary-lighter)] shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Link2 className="w-3 h-3" />
                      <span>لینک اینترنتی (URL)</span>
                    </button>
                  </div>
                </div>

                {/* Upload Mode */}
                {imageInputMode === 'upload' && (
                  <div>
                    {imageUrl ? (
                      /* Preview with change/remove */
                      <div className="relative rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0F172A] p-2.5 flex items-center gap-3">
                        <div className="w-20 h-16 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
                          <img
                            src={imageUrl}
                            alt="پیش‌نمایش اتاق"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />
                            <span className="truncate">تصویر آماده ذخیره است</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            تصویر با موفقیت بارگذاری و تنظیم شد.
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              تغییر تصویر
                            </button>
                            <button
                              type="button"
                              onClick={() => setImageUrl('')}
                              className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            >
                              حذف تصویر
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Drag & Drop Upload Zone */
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) processImageFile(file);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-5 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                          isDragging
                            ? 'border-[var(--brand-primary-light)] bg-brand-soft/60 dark:bg-[rgb(var(--brand-primary-rgb)/0.1)]'
                            : 'border-slate-200 dark:border-[#334155] bg-slate-50/70 dark:bg-[#0F172A]/70 hover:border-[var(--brand-primary-light)] hover:bg-brand-soft/30'
                        }`}
                      >
                        {imageUploadLoading ? (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <Loader2 className="w-7 h-7 text-[var(--brand-primary-light)] animate-spin" />
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                              در حال پردازش و بهینه‌سازی تصویر...
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-primary-rgb)/0.12)] dark:bg-[rgb(var(--brand-primary-rgb)/0.2)] text-[var(--brand-primary)] dark:text-[var(--brand-primary-lighter)] flex items-center justify-center mb-2 shadow-2xs">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              برای انتخاب یا کشیدن تصویر کلیک کنید
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              پشتیبانی از فرمت‌های JPG, PNG, WEBP (حداکثر ۸ مگابایت)
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processImageFile(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </div>
                )}

                {/* URL Mode */}
                {imageInputMode === 'url' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--brand-primary-light)] focus:outline-hidden font-mono text-left"
                      dir="ltr"
                    />
                    {imageUrl && (
                      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                        <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                          <img
                            src={imageUrl}
                            alt="پیش‌نمایش"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex-1 font-mono" dir="ltr">
                          {imageUrl}
                        </div>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="text-xs text-rose-500 hover:text-rose-600 px-2 py-1 cursor-pointer"
                        >
                          پاک کردن
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {imageUploadError && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    {imageUploadError}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary-light)]" />
                    <span>تجهیزات و امکانات اتاق ({selectedAmenities.length} مورد فعال)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setActiveTab('admin-rooms-amenities');
                    }}
                    className="text-xs font-bold text-[var(--brand-primary)] dark:text-[var(--brand-primary-lighter)] hover:underline cursor-pointer"
                  >
                    مدیریت فهرست امکانات
                  </button>
                </div>

                {/* Grid of Amenities */}
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-0.5">
                  {availableAmenities.map((amenity) => {
                    const isChecked = selectedAmenities.includes(amenity.id);
                    const IconComp = getAmenityIcon(amenity.icon);

                    return (
                      <button
                        type="button"
                        key={amenity.id}
                        onClick={() => handleToggleAmenity(amenity.id)}
                        className={`p-2.5 rounded-xl border text-right text-xs flex items-center justify-between transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] border-[var(--brand-primary-light)] text-[var(--brand-primary)] dark:text-[var(--brand-primary-lighter)] font-bold shadow-2xs'
                            : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-[#334155] text-slate-600 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <IconComp
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isChecked ? 'text-[var(--brand-primary-light)]' : 'text-slate-400'
                            }`}
                          />
                          <span className="truncate">{amenity.nameFa}</span>
                        </div>
                        {isChecked && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--brand-primary-light)] dark:text-[var(--brand-primary-lighter)] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-slate-50 dark:bg-[#0F172A] rounded-xl border border-slate-200/60 dark:border-[#334155]">
                  <input
                    type="checkbox"
                    checked={requiresApproval}
                    onChange={(e) => setRequiresApproval(e.target.checked)}
                    className="w-4 h-4 text-[var(--brand-primary-light)] rounded focus:ring-[var(--brand-primary-light)]"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      رزرو این اتاق نیازمند تأیید قبلی مدیریت باشد
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      در صورت فعال بودن، درخواست‌های رزرو ابتدا به کارتابل تأیید ادمین ارسال می‌شوند.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-[#334155]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[var(--brand-primary-light)] hover:bg-[var(--brand-primary-hover)] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'در حال ثبت...' : editingRoom ? 'ذخیره تغییرات' : 'افزودن اتاق'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Amenities Details Modal (Never clipped by table scrolling) */}
      {viewAmenitiesRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setViewAmenitiesRoom(null)}
          />

          <div className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#334155] overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#334155] flex items-center justify-between bg-slate-50/80 dark:bg-[#0F172A]/60">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <img
                    src={viewAmenitiesRoom.imageUrl}
                    alt={viewAmenitiesRoom.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      تجهیزات و امکانات {viewAmenitiesRoom.name}
                    </h3>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {viewAmenitiesRoom.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {viewAmenitiesRoom.building} • طبقه {viewAmenitiesRoom.floor} • ظرفیت {viewAmenitiesRoom.capacity} نفر
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewAmenitiesRoom(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[var(--brand-primary-light)]" />
                  <span>لیست تجهیزات فعال در این سالن ({viewAmenitiesRoom.amenities.length} مورد)</span>
                </span>
                <span className="text-[11px] text-brand dark:text-[var(--brand-primary-on-dark)] font-medium bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] px-2 py-0.5 rounded-md border border-brand-soft dark:border-[rgb(var(--brand-primary-rgb)/0.35)]">
                  آماده استفاده
                </span>
              </div>

              {viewAmenitiesRoom.amenities.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-[#0F172A] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                  هیچ امکانات یا تجهیزاتی برای این اتاق ثبت نشده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {viewAmenitiesRoom.amenities.map((amId) => {
                    const am = availableAmenities.find((a) => a.id === amId) || getAmenityById(amId, customAmenities);
                    const IconComp = getAmenityIcon(am?.icon);
                    const nameFa = am ? am.nameFa : amId;

                    let categoryLabel = 'تجهیزات عمومی';
                    if (am?.category === 'av') categoryLabel = 'صوتی و تصویری';
                    else if (am?.category === 'tech') categoryLabel = 'فناوری و شبکه';
                    else if (am?.category === 'comfort') categoryLabel = 'رفاهی و آسایش';
                    else if (am?.category === 'facility') categoryLabel = 'تجهیزات سالن';

                    return (
                      <div
                        key={amId}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 hover:border-brand-soft dark:hover:border-[rgb(var(--brand-primary-rgb)/0.35)] transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[rgb(var(--brand-primary-rgb)/0.12)] dark:bg-[rgb(var(--brand-primary-rgb)/0.2)] text-[var(--brand-primary)] dark:text-[var(--brand-primary-lighter)] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {nameFa}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {categoryLabel}
                            </div>
                          </div>
                        </div>

                        <div className="w-5 h-5 rounded-full bg-[rgb(var(--brand-primary-rgb)/0.1)] dark:bg-[rgb(var(--brand-primary-rgb)/0.2)] text-brand dark:text-[var(--brand-primary-on-dark)] flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-[#334155] bg-slate-50/50 dark:bg-[#0F172A]/50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const targetRoom = viewAmenitiesRoom;
                  setViewAmenitiesRoom(null);
                  handleOpenEditModal(targetRoom);
                }}
                className="px-4 py-2 bg-brand-soft hover:bg-[rgb(var(--brand-primary-rgb)/0.12)] dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] dark:hover:bg-[rgb(var(--brand-primary-rgb)/0.2)] text-[var(--brand-primary)] dark:text-[var(--brand-primary-lighter)] border border-brand-soft dark:border-[rgb(var(--brand-primary-rgb)/0.35)] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>ویرایش تجهیزات این اتاق</span>
              </button>

              <button
                type="button"
                onClick={() => setViewAmenitiesRoom(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
