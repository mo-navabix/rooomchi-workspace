import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Room } from '../../types';
import {
  Plus,
  Filter,
  Users,
  Building,
  MoreVertical,
  CheckCircle2,
  Tv,
  Wifi,
  Coffee,
  Video,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/jalali';

export const ModernRoomView: React.FC = () => {
  const { currentOrg, setActiveTab, can, openBookingModal } = useApp();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filterCapacity, setFilterCapacity] = useState<string>('all');
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [filterBuilding, setFilterBuilding] = useState<string>('all');

  useEffect(() => {
    if (!currentOrg) return;
    const loadRooms = async () => {
      try {
        const data = await ApiService.getRooms({ orgId: currentOrg.id });
        setRooms(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadRooms();
  }, [currentOrg]);

  return (
    <div className="space-y-6 select-none" id="modern-room-view">
      {/* Header matching Screenshot: اتاق‌های جلسه + مدیریت و مشاهده تمام اتاق‌های سازمان */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            اتاق‌های جلسه
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            مدیریت و مشاهده تمام اتاق‌های سازمان
          </p>
        </div>

        {/* Action Button: + افزودن اتاق (Dark Blue/Navy pill matching screenshot) */}
        {can('MANAGE_ROOMS') && (
          <button
            type="button"
            onClick={() => setActiveTab('admin-rooms')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--brand-primary)] dark:bg-[var(--brand-primary)] hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن اتاق</span>
          </button>
        )}
      </div>

      {/* Filter Row matching screenshot */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterCapacity}
          onChange={(e) => setFilterCapacity(e.target.value)}
          className="text-xs font-semibold bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 shadow-2xs"
        >
          <option value="all">همه ظرفیت‌ها</option>
          <option value="small">تا ۶ نفر</option>
          <option value="medium">۶ تا ۱۲ نفر</option>
          <option value="large">بیش از ۱۲ نفر</option>
        </select>

        <select
          value={filterFloor}
          onChange={(e) => setFilterFloor(e.target.value)}
          className="text-xs font-semibold bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 shadow-2xs"
        >
          <option value="all">همه طبقه‌ها</option>
          <option value="1">طبقه ۱</option>
          <option value="2">طبقه ۲</option>
          <option value="3">طبقه ۳</option>
        </select>

        <select
          value={filterBuilding}
          onChange={(e) => setFilterBuilding(e.target.value)}
          className="text-xs font-semibold bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 shadow-2xs"
        >
          <option value="all">همه ساختمان‌ها</option>
          <option value="central">ساختمان مرکزی</option>
          <option value="innov">مرکز نوآوری</option>
        </select>
      </div>

      {/* 4 Room Cards Grid matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {rooms.slice(0, 4).map((room, idx) => (
          <div
            key={room.id}
            className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Room Photo with Green Status Badge matching screenshot */}
              <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                <img
                  src={room.imageUrl}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
                {/* Green badge: آزاد */}
                <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[var(--brand-primary)] text-white shadow-2xs">
                  آزاد
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-2 text-right">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {room.name}
                </h3>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  ظرفیت: {toPersianDigits(room.capacity)} نفر
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {room.building} • طبقه {toPersianDigits(room.floor)}
                </div>

                {/* Amenities Icons */}
                <div className="flex items-center gap-2 pt-2 text-slate-400">
                  <Tv className="w-3.5 h-3.5" />
                  <Video className="w-3.5 h-3.5" />
                  <Wifi className="w-3.5 h-3.5" />
                  <Coffee className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 dark:border-[#334155]/60 mt-2">
              <button
                onClick={() => openBookingModal()}
                className="text-xs font-bold text-[var(--brand-primary)] dark:text-[var(--brand-primary-on-dark)] hover:underline cursor-pointer"
              >
                رزرو اتاق
              </button>
              <button className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
