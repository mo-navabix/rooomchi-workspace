import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Room } from '../../types';
import {
  ALL_AMENITIES,
  getAllAmenitiesList,
  getAmenityById,
} from '../../constants/amenities';
import {
  Search,
  Users,
  Sparkles,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  X,
  ArrowLeft,
  Tv,
  Video,
  Mic,
  PenTool,
  Wifi,
  Coffee,
  Wind,
  Layers,
  Check,
  Building2,
  Info,
  ShieldAlert,
  CalendarCheck,
  Monitor,
  Speaker,
  Laptop,
  Cast,
} from 'lucide-react';
import { RoomBrowserSkeleton } from '../common/Skeletons';

export const RoomBrowser: React.FC = () => {
  const { currentOrg, openBookingModal } = useApp();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [amenitiesModalRoom, setAmenitiesModalRoom] = useState<Room | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCapacity, setSelectedCapacity] = useState<string>('all');
  const [selectedAmenity, setSelectedAmenity] = useState<string>('all');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');

  useEffect(() => {
    if (!currentOrg) return;

    const loadRooms = async () => {
      try {
        setIsLoading(true);
        const roomsData = await ApiService.getRooms({ orgId: currentOrg.id });
        setRooms(Array.isArray(roomsData) ? roomsData : []);
      } catch (err) {
        console.error('Error fetching rooms', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadRooms();
  }, [currentOrg]);

  // Filtering Logic
  const filteredRooms = rooms.filter((room) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = room.name.toLowerCase().includes(q);
      const matchCode = room.code.toLowerCase().includes(q);
      const matchBuilding = room.building.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchBuilding) return false;
    }

    // Capacity
    if (selectedCapacity === 'small' && room.capacity > 6) return false;
    if (selectedCapacity === 'medium' && (room.capacity <= 6 || room.capacity > 12)) return false;
    if (selectedCapacity === 'large' && room.capacity <= 12) return false;

    // Amenity
    if (selectedAmenity !== 'all' && !(room.amenities ?? []).includes(selectedAmenity))
      return false;

    // Building
    if (selectedBuilding !== 'all' && room.building !== selectedBuilding) return false;

    // Floor
    if (selectedFloor !== 'all' && room.floor !== Number(selectedFloor)) return false;

    return true;
  });

  if (isLoading) {
    return <RoomBrowserSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-[#1E293B] portal-card-pad rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs space-y-4 transition-colors">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            id="input-search-rooms"
            placeholder="جستجو بر اساس نام اتاق، کد اتاق (مثال: ALB-101) یا ساختمان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#0F172A] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary-light)] transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-3 border-t border-slate-100 dark:border-[#334155] text-xs">
          {/* Capacity */}
          <div className="relative">
            <select
              id="filter-capacity"
              value={selectedCapacity}
              onChange={(e) => setSelectedCapacity(e.target.value)}
              className="w-full text-xs pr-3.5 pl-9 py-2.5 appearance-none bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary-light)] hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
            >
              <option value="all">همه ظرفیت‌ها</option>
              <option value="small">جلسات کوچک (تا ۶ نفر)</option>
              <option value="medium">جلسات متوسط (۶ تا ۱۲ نفر)</option>
              <option value="large">سالن و کنفرانس (بالای ۱۲ نفر)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Amenities */}
          <div className="relative">
            <select
              id="filter-amenity"
              value={selectedAmenity}
              onChange={(e) => setSelectedAmenity(e.target.value)}
              className="w-full text-xs pr-3.5 pl-9 py-2.5 appearance-none bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary-light)] hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
            >
              <option value="all">همه امکانات و تجهیزات</option>
              {getAllAmenitiesList().map((a) => (
                <option key={a.id} value={a.id}>
                  دارای {a.nameFa}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Building */}
          <div className="relative">
            <select
              id="filter-building"
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full text-xs pr-3.5 pl-9 py-2.5 appearance-none bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary-light)] hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
            >
              <option value="all">همه ساختمان‌ها</option>
              {(currentOrg?.buildings ?? []).map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCapacity('all');
              setSelectedAmenity('all');
              setSelectedBuilding('all');
              setSelectedFloor('all');
            }}
            className="w-full text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#334155] hover:bg-slate-200 dark:hover:bg-[#334155] border border-slate-200/60 dark:border-[#334155] rounded-xl font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>پاک کردن فیلترها</span>
          </button>
        </div>
      </div>

      {/* Rooms List Grid - Compact, Clean, and Simplified */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredRooms.map((room) => {
          const isMaintenance = room.status === 'maintenance';
          const amenityCount = room.amenities?.length || 0;

          return (
            <div
              key={room.id}
              className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/90 dark:border-[#334155] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Photo & Badge Header (Compact h-36) */}
                <div className="relative h-36 sm:h-40 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={room.imageUrl}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between pointer-events-none">
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-xs">
                      {room.code}
                    </span>
                    {room.requiresApproval && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/90 text-white backdrop-blur-md shadow-xs">
                        نیاز به تأیید
                      </span>
                    )}
                  </div>

                  {/* Bottom Image Info */}
                  <div className="absolute bottom-2.5 right-3 left-3 text-white">
                    <div className="text-[11px] text-white/80 font-medium truncate">
                      {room.building} • طبقه {room.floor}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white drop-shadow-xs truncate">
                      {room.name}
                    </h3>
                  </div>
                </div>

                {/* Body - Clean & Simplified */}
                <div className="p-3.5 space-y-2.5">
                  {/* Capacity & Status */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold bg-slate-100 dark:bg-[#0F172A] px-2.5 py-1 rounded-lg">
                      <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>ظرفیت: {room.capacity} نفر</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-semibold">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isMaintenance ? 'bg-amber-500 animate-pulse' : 'bg-[var(--brand-primary)]'
                        }`}
                      />
                      <span
                        className={
                          isMaintenance
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-brand dark:text-[var(--brand-primary-on-dark)]'
                        }
                      >
                        {isMaintenance ? 'تعمیرات' : 'آماده رزرو'}
                      </span>
                    </div>
                  </div>

                  {/* Simplified Amenities Strip with Icon Previews */}
                  <div
                    onClick={() => setAmenitiesModalRoom(room)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#0F172A] hover:bg-brand-soft/70 dark:hover:bg-[rgb(var(--brand-primary-rgb)/0.12)] border border-slate-200/80 dark:border-white/5 transition-colors cursor-pointer group/btn"
                    title="مشاهده جزئیات امکانات و تجهیزات"
                  >
                    <div className="flex items-center gap-1 overflow-hidden">
                      {room.amenities.slice(0, 3).map((amId) => {
                        const am = getAmenityById(amId);
                        let IconComp = Check;
                        if (am?.icon === 'Wifi' || amId.includes('wifi')) IconComp = Wifi;
                        else if (am?.icon === 'Projector' || amId.includes('projector') || am?.icon === 'Tv' || amId.includes('tv')) IconComp = Tv;
                        else if (am?.icon === 'Video' || amId.includes('video')) IconComp = Video;
                        else if (am?.icon === 'Mic' || amId.includes('mic')) IconComp = Mic;
                        else if (am?.icon === 'Speaker') IconComp = Speaker;
                        else if (am?.icon === 'Monitor') IconComp = Monitor;
                        else if (am?.icon === 'Laptop') IconComp = Laptop;
                        else if (am?.icon === 'Cast') IconComp = Cast;
                        else if (am?.icon === 'PenTool' || amId.includes('whiteboard')) IconComp = PenTool;
                        else if (am?.icon === 'Coffee' || amId.includes('catering') || amId.includes('coffee')) IconComp = Coffee;
                        else if (am?.icon === 'Wind' || amId.includes('ac')) IconComp = Wind;

                        return (
                          <div
                            key={amId}
                            title={am?.nameFa || amId}
                            className="w-6.5 h-6.5 rounded-lg bg-white dark:bg-slate-800 text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] border border-slate-200/70 dark:border-white/10 flex items-center justify-center shrink-0 shadow-2xs group-hover/btn:border-brand-soft"
                          >
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                        );
                      })}
                      {room.amenities.length > 3 && (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1">
                          +{room.amenities.length - 3}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] group-hover/btn:underline shrink-0 flex items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>{amenityCount} قابلیت</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-3 pt-0">
                <button
                  id={`btn-book-room-${room.id}`}
                  disabled={isMaintenance}
                  onClick={() => openBookingModal(room)}
                  className="w-full py-2 px-3 btn-brand disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>{isMaintenance ? 'غیرقابل رزرو (تعمیرات)' : 'رزرو این اتاق'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">هیچ اتاقی با فیلترهای انتخابی یافت نشد</p>
          <p className="text-xs text-slate-400">
            فیلترها را ریست کنید یا با عبارت دیگری جستجو فرمایید.
          </p>
        </div>
      )}

      {/* Small Amenities Popup Modal (Close button removed per user request) */}
      {amenitiesModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setAmenitiesModalRoom(null)}
          />

          <div className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Header (No top-right close X button) */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[rgb(var(--brand-primary-rgb)/0.12)] dark:bg-[rgb(var(--brand-primary-rgb)/0.2)] text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    امکانات {amenitiesModalRoom.name}
                  </h4>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    کد: {amenitiesModalRoom.code} • ظرفیت {amenitiesModalRoom.capacity} نفر
                  </div>
                </div>
              </div>
            </div>

            {/* Content List */}
            <div className="p-4 overflow-y-auto space-y-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                <span>تجهیزات و امکانات فعال اتاق:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {amenitiesModalRoom.amenities.map((amId) => {
                  const am = getAmenityById(amId);
                  const nameFa = am ? am.nameFa : amId;

                  let IconComp = Check;
                  if (am?.icon === 'Wifi' || amId.includes('wifi')) IconComp = Wifi;
                  else if (am?.icon === 'Projector' || amId.includes('projector') || am?.icon === 'Tv' || amId.includes('tv')) IconComp = Tv;
                  else if (am?.icon === 'Video' || amId.includes('video')) IconComp = Video;
                  else if (am?.icon === 'Mic' || amId.includes('mic')) IconComp = Mic;
                  else if (am?.icon === 'Speaker') IconComp = Speaker;
                  else if (am?.icon === 'Monitor') IconComp = Monitor;
                  else if (am?.icon === 'Laptop') IconComp = Laptop;
                  else if (am?.icon === 'Cast') IconComp = Cast;
                  else if (am?.icon === 'PenTool' || amId.includes('whiteboard')) IconComp = PenTool;
                  else if (am?.icon === 'Coffee' || amId.includes('catering') || amId.includes('coffee')) IconComp = Coffee;
                  else if (am?.icon === 'Wind' || amId.includes('ac')) IconComp = Wind;

                  return (
                    <div
                      key={amId}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <div className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] shrink-0 shadow-2xs">
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-[11px] leading-snug">
                        {nameFa}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Location & Policies */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>موقعیت فیزیکی: {amenitiesModalRoom.building}، طبقه {amenitiesModalRoom.floor}</span>
                </div>
                {amenitiesModalRoom.requiresApproval && (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>رزرو این اتاق منوط به تأیید نهایی واحد مدیریت است.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Close Button */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setAmenitiesModalRoom(null)}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
