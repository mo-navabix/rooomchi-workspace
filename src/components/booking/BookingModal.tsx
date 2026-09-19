import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { ALL_AMENITIES } from '../../constants/amenities';
import { Room, Booking } from '../../types';
import { PersianDatePicker } from '../common/PersianDatePicker';
import {
  X,
  Calendar,
  Clock,
  Users,
  Building,
  CheckCircle2,
  AlertTriangle,
  Coffee,
  Sparkles,
  Info,
  ChevronDown,
} from 'lucide-react';

interface Props {
  onSuccess?: () => void;
}

export const BookingModal: React.FC<Props> = ({ onSuccess }) => {
  const {
    currentOrg,
    selectedRoomForBooking,
    isBookingModalOpen,
    closeBookingModal,
    showToast,
  } = useApp();

  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);

  // Form State
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(today);
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('11:00');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [organizerName, setOrganizerName] = useState<string>('علی احمدی');
  const [organizerEmail, setOrganizerEmail] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [attendeesCount, setAttendeesCount] = useState<number>(4);
  const [attendeeEmailInput, setAttendeeEmailInput] = useState<string>('');
  const [attendeeEmails, setAttendeeEmails] = useState<string[]>([]);
  const [equipmentNeeded, setEquipmentNeeded] = useState<string[]>([]);
  const [cateringNeeded, setCateringNeeded] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  // Load Rooms & Bookings for conflict check
  useEffect(() => {
    if (!currentOrg || !isBookingModalOpen) return;

    // Default department
    if (currentOrg.departments?.length > 0 && !department) {
      setDepartment(currentOrg.departments[0]);
    }
    if (!organizerEmail) {
      setOrganizerEmail(`a.ahmadi@${currentOrg.slug || 'company'}.ir`);
    }

    const loadData = async () => {
      try {
        const [roomsData, bookingsData] = await Promise.all([
          ApiService.getRooms({ orgId: currentOrg.id, status: 'available' }),
          ApiService.getBookings({ orgId: currentOrg.id, date }),
        ]);
        setAvailableRooms(roomsData);
        setExistingBookings(bookingsData);

        if (selectedRoomForBooking) {
          setSelectedRoomId(selectedRoomForBooking.id);
        } else if (roomsData.length > 0 && !selectedRoomId) {
          setSelectedRoomId(roomsData[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, [currentOrg, isBookingModalOpen, selectedRoomForBooking, date]);

  // Check for conflicts whenever room, date, startTime, endTime change
  useEffect(() => {
    if (!selectedRoomId || !date || !startTime || !endTime) {
      setConflictMessage(null);
      return;
    }

    if (startTime >= endTime) {
      setConflictMessage('ساعت شروع باید قبل از ساعت پایان باشد');
      return;
    }

    const conflict = existingBookings.find((b) => {
      if (b.roomId !== selectedRoomId || b.date !== date || b.status === 'cancelled') {
        return false;
      }
      return startTime < b.endTime && endTime > b.startTime;
    });

    if (conflict) {
      setConflictMessage(
        `تداخل زمانی! این اتاق در ساعت ${conflict.startTime} تا ${conflict.endTime} برای «${conflict.title}» رزرو شده است.`
      );
    } else {
      setConflictMessage(null);
    }
  }, [selectedRoomId, date, startTime, endTime, existingBookings]);

  if (!isBookingModalOpen) return null;

  const activeRoom = availableRooms.find((r) => r.id === selectedRoomId);

  const handleAddAttendee = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && attendeeEmailInput.trim()) {
      e.preventDefault();
      if (!attendeeEmails.includes(attendeeEmailInput.trim())) {
        setAttendeeEmails([...attendeeEmails, attendeeEmailInput.trim()]);
      }
      setAttendeeEmailInput('');
    }
  };

  const handleRemoveAttendee = (email: string) => {
    setAttendeeEmails(attendeeEmails.filter((e) => e !== email));
  };

  const handleToggleEquipment = (amenityId: string) => {
    setEquipmentNeeded((prev) =>
      prev.includes(amenityId) ? prev.filter((id) => id !== amenityId) : [...prev, amenityId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !selectedRoomId || !title.trim()) {
      showToast('لطفاً عنوان جلسه و اتاق را مشخص کنید', 'error');
      return;
    }

    if (conflictMessage) {
      showToast(conflictMessage, 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const newBooking = await ApiService.createBooking({
        orgId: currentOrg.id,
        roomId: selectedRoomId,
        title: title.trim(),
        description: description.trim(),
        organizerName,
        organizerEmail,
        department,
        date,
        startTime,
        endTime,
        attendeesCount,
        attendeeEmails,
        equipmentNeeded,
        cateringNeeded,
      });

      showToast(
        newBooking.status === 'pending_approval'
          ? 'درخواست رزرو ثبت شد و در انتظار تأیید مدیر قرار گرفت'
          : 'رزرو اتاق با موفقیت نهایی و ثبت شد',
        'success'
      );

      closeBookingModal();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || 'خطا در ثبت رزرو', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate hourly options
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111A2E] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E2E50] overflow-hidden my-8 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0D1B3A] text-white flex items-center justify-between border-b border-[#1E2E50]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
              <Calendar className="w-5 h-5 text-[#14B8A6]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">رزرو اتاق جلسات</h2>
              <p className="text-xs text-slate-300">
                {currentOrg?.name} • ثبت جلسه کاری و هماهنگی تجهیزات
              </p>
            </div>
          </div>
          <button
            id="btn-close-booking-modal"
            onClick={closeBookingModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-slate-900 dark:text-slate-100">
          {/* Room Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              انتخاب اتاق جلسه *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableRooms.map((room) => {
                const isSelected = room.id === selectedRoomId;
                return (
                  <button
                    type="button"
                    key={room.id}
                    id={`modal-room-card-${room.id}`}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`text-right p-3 rounded-xl border text-xs transition-all flex items-start justify-between ${
                      isSelected
                        ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/50 shadow-xs'
                        : 'border-slate-200 dark:border-[#1E2E50] hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#0D1527]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{room.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {room.building} • طبقه {room.floor} • ظرفیت {room.capacity} نفر
                      </div>
                      {room.requiresApproval && (
                        <span className="inline-block mt-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 rounded font-medium">
                          نیاز به تأیید مدیریت
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <PersianDatePicker
                id="input-booking-date"
                label="تاریخ جلسه (تقویم شمسی) *"
                value={date}
                onChange={(newDate) => setDate(newDate)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ساعت شروع *
              </label>
              <div className="relative">
                <select
                  id="select-booking-start"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs pr-3 pl-8 py-2.5 appearance-none border border-slate-200 dark:border-[#1E2E50] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] bg-white dark:bg-[#0A0F1D] text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {timeSlots.slice(0, -1).map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ساعت پایان *
              </label>
              <div className="relative">
                <select
                  id="select-booking-end"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs pr-3 pl-8 py-2.5 appearance-none border border-slate-200 dark:border-[#1E2E50] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] bg-white dark:bg-[#0A0F1D] text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {timeSlots
                    .filter((t) => t > startTime)
                    .map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Conflict Status Banner */}
          {conflictMessage ? (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{conflictMessage}</span>
            </div>
          ) : (
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 rounded-xl flex items-center gap-2 text-xs text-teal-800 dark:text-[#14B8A6] font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#14B8A6] shrink-0" />
              <span>این اتاق در بازه زمانی انتخابی آزاد و آماده رزرو است.</span>
            </div>
          )}

          {/* Title & Agenda */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              عنوان جلسه *
            </label>
            <input
              type="text"
              id="input-booking-title"
              placeholder="مثال: جلسه بازبینی محصول و برنامه ماهانه"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#1E2E50] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] bg-white dark:bg-[#0A0F1D] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              دستور جلسه و توضیحات تکمیلی
            </label>
            <textarea
              id="input-booking-desc"
              rows={2}
              placeholder="اهداف جلسه، پیش‌نیازها و نکات قابل توجه..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#1E2E50] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] bg-white dark:bg-[#0A0F1D] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 resize-none"
            ></textarea>
          </div>

          {/* Organizer & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نام هماهنگ‌کننده / رزروکننده *
              </label>
              <input
                type="text"
                id="input-booking-organizer"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#1E2E50] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] bg-white dark:bg-[#0A0F1D] text-slate-800 dark:text-slate-200"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                دپارتمان / واحد سازمانی *
              </label>
              <div className="relative">
                <select
                  id="select-booking-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs pr-3 pl-8 py-2.5 appearance-none border border-slate-200 dark:border-[#1E2E50] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] bg-white dark:bg-[#0A0F1D] text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {currentOrg?.departments?.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Attendees Count & Invitations */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                تعداد حاضرین و دعوت از همکاران
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                حداکثر ظرفیت اتاق: {activeRoom?.capacity || 10} نفر
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-28">
                <input
                  type="number"
                  id="input-booking-attendees-count"
                  min="1"
                  max={activeRoom?.capacity ? activeRoom.capacity + 5 : 50}
                  value={attendeesCount}
                  onChange={(e) => setAttendeesCount(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#1E2E50] rounded-xl text-center bg-white dark:bg-[#0A0F1D] text-slate-800 dark:text-slate-200"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  id="input-booking-attendee-email"
                  placeholder="ایمیل همکاران را تایپ و Enter بزنید..."
                  value={attendeeEmailInput}
                  onChange={(e) => setAttendeeEmailInput(e.target.value)}
                  onKeyDown={handleAddAttendee}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#1E2E50] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] bg-white dark:bg-[#0A0F1D] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            {attendeeEmails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {attendeeEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-[#16243F] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttendee(email)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Amenities checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              تجهیزات و خدمات مورد نیاز در جلسه
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_AMENITIES.map((amenity) => {
                const isChecked = equipmentNeeded.includes(amenity.id);
                return (
                  <button
                    type="button"
                    key={amenity.id}
                    onClick={() => handleToggleEquipment(amenity.id)}
                    className={`p-2 rounded-lg border text-right text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                      isChecked
                        ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200'
                        : 'border-slate-200 dark:border-[#1E2E50] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#16243F]'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        isChecked ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <span className="truncate">{amenity.nameFa}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catering toggle */}
          <div className="p-3 bg-slate-50 dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-[#1E2E50] flex items-center justify-between transition-colors">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-500" />
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  درخواست پذیرایی چای و تشریفات
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  اطلاع‌رسانی خودکار به تیم خدمات سازمان جهت آماده‌سازی
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="checkbox-catering"
                checked={cateringNeeded}
                onChange={(e) => setCateringNeeded(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-[#1E2E50]">
            <button
              type="button"
              id="btn-cancel-booking-form"
              onClick={closeBookingModal}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#16243F] hover:bg-slate-200 dark:hover:bg-[#1E2E50] rounded-xl transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              id="btn-submit-booking-form"
              disabled={isSubmitting || !!conflictMessage}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 ${
                conflictMessage
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500 dark:text-slate-400'
                  : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
              }`}
            >
              {isSubmitting ? (
                <span>در حال ثبت...</span>
              ) : activeRoom?.requiresApproval ? (
                <>
                  <span>ارسال جهت بررسی و تأیید ادمین</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />
                </>
              ) : (
                <>
                  <span>تأیید و رزرو آنی</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
