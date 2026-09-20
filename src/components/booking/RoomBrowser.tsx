import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Booking, Room } from '../../types';
import { ALL_AMENITIES } from '../../constants/amenities';
import { PersianDatePicker } from '../common/PersianDatePicker';
import {
  Search,
  Filter,
  Users,
  Building,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  Coffee,
  Tv,
  Video,
  Wifi,
  Layers,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { RoomBrowserSkeleton } from '../common/Skeletons';

export const RoomBrowser: React.FC = () => {
  const { currentOrg, openBookingModal } = useApp();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCapacity, setSelectedCapacity] = useState<string>('all');
  const [selectedAmenity, setSelectedAmenity] = useState<string>('all');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState<string>(todayStr);

  useEffect(() => {
    if (!currentOrg) return;

    const loadRoomsAndSchedule = async () => {
      try {
        setIsLoading(true);
        const [roomsData, bookingsData] = await Promise.all([
          ApiService.getRooms({ orgId: currentOrg.id }),
          ApiService.getBookings({ orgId: currentOrg.id, date: filterDate }),
        ]);
        setRooms(Array.isArray(roomsData) ? roomsData : []);
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      } catch (err) {
        console.error('Error fetching rooms', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoomsAndSchedule();
  }, [currentOrg, filterDate]);

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

  // Calculate timeline slots for a room (e.g. 08:00 to 20:00)
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

  const isSlotBooked = (roomId: string, hour: number) => {
    const slotStart = `${String(hour).padStart(2, '0')}:00`;
    const slotEnd = `${String(hour + 1).padStart(2, '0')}:00`;
    return bookings.some(
      (b) =>
        b.roomId === roomId &&
        b.status !== 'cancelled' &&
        slotStart < b.endTime &&
        slotEnd > b.startTime
    );
  };

  if (isLoading) {
    return <RoomBrowserSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-rooms"
              placeholder="جستجو بر اساس نام اتاق، کد اتاق (مثال: ALB-101) یا ساختمان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#0F172A] focus:outline-hidden focus:ring-2 focus:ring-[#10B981] transition-colors"
            />
          </div>

          <div className="w-full sm:w-auto min-w-[200px]">
            <PersianDatePicker
              id="input-filter-date"
              label="تاریخ بررسی (شمسی)"
              value={filterDate}
              onChange={(d) => setFilterDate(d)}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-3 border-t border-slate-100 dark:border-[#334155] text-xs">
          {/* Capacity */}
          <div className="relative">
            <select
              id="filter-capacity"
              value={selectedCapacity}
              onChange={(e) => setSelectedCapacity(e.target.value)}
              className="w-full text-xs pr-3.5 pl-9 py-2.5 appearance-none bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#10B981] hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
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
              className="w-full text-xs pr-3.5 pl-9 py-2.5 appearance-none bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#10B981] hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
            >
              <option value="all">همه امکانات و تجهیزات</option>
              {ALL_AMENITIES.map((a) => (
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
              className="w-full text-xs pr-3.5 pl-9 py-2.5 appearance-none bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#10B981] hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
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
              setFilterDate(todayStr);
            }}
            className="w-full text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#334155] hover:bg-slate-200 dark:hover:bg-[#334155] border border-slate-200/60 dark:border-[#334155] rounded-xl font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>پاک کردن فیلترها</span>
          </button>
        </div>
      </div>

      {/* Rooms List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRooms.map((room) => {
          const roomBookingsCount = bookings.filter(
            (b) => b.roomId === room.id && b.status !== 'cancelled'
          ).length;

          return (
            <div
              key={room.id}
              className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo & Badge Header */}
                <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={room.imageUrl}
                    alt={room.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/95 dark:bg-[#0F786E]/90 backdrop-blur-md text-slate-900 dark:text-white shadow-xs">
                      {room.code}
                    </span>
                    {room.requiresApproval && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/90 text-white backdrop-blur-md">
                        نیاز به تأیید مدیریت
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 left-3 text-white">
                    <div className="text-[11px] text-white/80 font-medium">
                      {room.building} • طبقه {room.floor}
                    </div>
                    <h3 className="text-base font-bold text-white drop-shadow-xs">{room.name}</h3>
                  </div>
                </div>

                {/* Body Specs */}
                <div className="p-4 space-y-3">
                  {/* Capacity & Amenities Pills */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold bg-slate-100 dark:bg-[#0F172A] px-2.5 py-1 rounded-lg">
                      <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>ظرفیت: {room.capacity} نفر</span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {roomBookingsCount > 0
                        ? `${roomBookingsCount} جلسه در تاریخ ${filterDate}`
                        : 'کل روز آزاد است'}
                    </div>
                  </div>

                  {/* Amenities List */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {room.amenities.map((amId) => {
                      const am = ALL_AMENITIES.find((a) => a.id === amId);
                      if (!am) return null;
                      return (
                        <span
                          key={amId}
                          className="text-[10px] font-medium bg-slate-50 dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-[#334155] px-2 py-0.5 rounded-md"
                        >
                          {am.nameFa}
                        </span>
                      );
                    })}
                  </div>

                  {/* Daily Visual Time Slots Grid */}
                  <div className="pt-2 border-t border-slate-100 dark:border-[#334155]">
                    <div className="text-[10px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>جدول زمانی رزرو (ساعات ۸ الی ۲۰):</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#10B981]"></span> آزاد
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span> پر
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-1">
                      {hours.map((h) => {
                        const booked = isSlotBooked(room.id, h);
                        return (
                          <div
                            key={h}
                            title={`${h}:00 - ${h + 1}:00 : ${booked ? 'رزرو شده' : 'آزاد'}`}
                            className={`h-6 rounded text-[9px] flex items-center justify-center font-bold transition-colors ${
                              booked
                                ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
                                : 'bg-emerald-50 dark:bg-teal-950/40 text-emerald-700 dark:text-[#10B981] border border-emerald-200 dark:border-teal-900/50'
                            }`}
                          >
                            {h}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 bg-slate-50 dark:bg-[#0D1527] border-t border-slate-100 dark:border-[#334155] flex items-center justify-between transition-colors">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {room.status === 'maintenance' ? 'در حال تعمیرات' : 'آماده ثبت سفارش جلسه'}
                </span>
                <button
                  id={`btn-book-room-${room.id}`}
                  disabled={room.status === 'maintenance'}
                  onClick={() => openBookingModal(room)}
                  className="px-4 py-2 bg-[#10B981] hover:bg-[#0D6B63] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>انتخاب و رزرو</span>
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
    </div>
  );
};
