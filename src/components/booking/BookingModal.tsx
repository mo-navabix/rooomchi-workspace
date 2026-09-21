import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Room, Booking } from '../../types';
import { PersianDatePicker } from '../common/PersianDatePicker';
import { X, Calendar, AlertTriangle, ChevronDown, UserPlus } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

interface Props {
  onSuccess?: () => void;
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00',
];

export const BookingModal: React.FC<Props> = ({ onSuccess }) => {
  const {
    currentOrg,
    currentUser,
    selectedRoomForBooking,
    isBookingModalOpen,
    closeBookingModal,
    openCompleteProfileModal,
    isRegistrationComplete,
    showToast,
  } = useApp();

  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(today);
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('11:00');
  const [title, setTitle] = useState<string>('');
  const [inviteInput, setInviteInput] = useState<string>('');
  const [inviteeEmails, setInviteeEmails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!currentOrg || !isBookingModalOpen) return;

    setTitle('');
    setInviteInput('');
    setInviteeEmails([]);
    setDate(today);
    setStartTime('10:00');
    setEndTime('11:00');
    setConflictMessage(null);

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
        } else if (roomsData.length > 0) {
          setSelectedRoomId(roomsData[0].id);
        } else {
          setSelectedRoomId('');
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, [currentOrg, isBookingModalOpen, selectedRoomForBooking]);

  useEffect(() => {
    if (!currentOrg || !isBookingModalOpen) return;
    const refreshBookings = async () => {
      try {
        const bookingsData = await ApiService.getBookings({ orgId: currentOrg.id, date });
        setExistingBookings(bookingsData);
      } catch (err) {
        console.error(err);
      }
    };
    refreshBookings();
  }, [currentOrg, isBookingModalOpen, date]);

  useEffect(() => {
    if (endTime <= startTime) {
      const next = TIME_SLOTS.find((t) => t > startTime);
      if (next) setEndTime(next);
    }
  }, [startTime, endTime]);

  useEffect(() => {
    if (!selectedRoomId || !date || !startTime || !endTime) {
      setConflictMessage(null);
      return;
    }

    if (startTime >= endTime) {
      setConflictMessage('ساعت پایان باید بعد از شروع باشد');
      return;
    }

    const conflict = existingBookings.find((b) => {
      if (b.roomId !== selectedRoomId || b.date !== date || b.status === 'cancelled') {
        return false;
      }
      return startTime < b.endTime && endTime > b.startTime;
    });

    if (conflict) {
      setConflictMessage(`این اتاق از ${conflict.startTime} تا ${conflict.endTime} رزرو است.`);
    } else {
      setConflictMessage(null);
    }
  }, [selectedRoomId, date, startTime, endTime, existingBookings]);

  if (!isBookingModalOpen) return null;

  const activeRoom = availableRooms.find((r) => r.id === selectedRoomId);
  const roomLocked = Boolean(selectedRoomForBooking);

  const addInvitee = (raw: string) => {
    const email = normalizeEmail(raw);
    if (!email) return;
    if (!EMAIL_RE.test(email)) {
      showToast('ایمیل معتبر وارد کنید', 'error');
      return;
    }
    const selfEmail = normalizeEmail(currentUser?.email ?? '');
    if (selfEmail && email === selfEmail) {
      showToast('خودتان در جلسه حضور دارید؛ نیازی به دعوت نیست', 'error');
      return;
    }
    if (inviteeEmails.includes(email)) {
      setInviteInput('');
      return;
    }
    const cap = activeRoom?.capacity;
    if (cap && 1 + inviteeEmails.length >= cap) {
      showToast(`ظرفیت اتاق حداکثر ${cap} نفر است`, 'error');
      return;
    }
    setInviteeEmails((prev) => [...prev, email]);
    setInviteInput('');
  };

  const handleInviteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addInvitee(inviteInput);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !selectedRoomId) {
      showToast('اتاقی برای رزرو انتخاب نشده است', 'error');
      return;
    }

    // Direct Profile Completion Gate
    if (!isRegistrationComplete()) {
      showToast(
        'همکار گرامی، برای انجام رزرو ابتدا باید ثبت‌نام و اطلاعات کاربری خود را تکمیل نمایید',
        'error'
      );
      closeBookingModal();
      openCompleteProfileModal(activeRoom || selectedRoomForBooking || undefined);
      return;
    }

    if (!title.trim()) {
      showToast('عنوان جلسه را وارد کنید', 'error');
      return;
    }
    if (conflictMessage) {
      showToast(conflictMessage, 'error');
      return;
    }

    let attendeeEmails = [...inviteeEmails];
    const pendingInvite = normalizeEmail(inviteInput);
    if (pendingInvite) {
      if (!EMAIL_RE.test(pendingInvite)) {
        showToast('ایمیل دعوت‌شده معتبر نیست', 'error');
        return;
      }
      const selfEmail = normalizeEmail(currentUser?.email ?? '');
      if (selfEmail && pendingInvite === selfEmail) {
        showToast('خودتان در جلسه حضور دارید؛ نیازی به دعوت نیست', 'error');
        return;
      }
      if (!attendeeEmails.includes(pendingInvite)) {
        attendeeEmails = [...attendeeEmails, pendingInvite];
      }
    }

    const cap = activeRoom?.capacity;
    if (cap && 1 + attendeeEmails.length > cap) {
      showToast(`ظرفیت اتاق حداکثر ${cap} نفر است`, 'error');
      return;
    }

    const organizerName = currentUser?.name?.trim() || 'کاربر';
    const organizerEmail = currentUser?.email?.trim() || '';
    const department =
      currentUser?.department?.trim() ||
      currentOrg.departments?.[0] ||
      'عمومی';

    try {
      setIsSubmitting(true);
      const newBooking = await ApiService.createBooking({
        orgId: currentOrg.id,
        roomId: selectedRoomId,
        title: title.trim(),
        organizerName,
        organizerEmail,
        department,
        date,
        startTime,
        endTime,
        attendeesCount: 1 + attendeeEmails.length,
        attendeeEmails,
        equipmentNeeded: [],
        cateringNeeded: false,
      });

      showToast(
        newBooking.status === 'pending_approval'
          ? 'درخواست ثبت شد؛ منتظر تأیید مدیر باشید'
          : 'رزرو با موفقیت ثبت شد',
        'success'
      );

      closeBookingModal();
      onSuccess?.();
    } catch (err: unknown) {
      const anyErr = err as any;
      if (
        anyErr?.requiresProfileCompletion ||
        anyErr?.error === 'IncompleteProfile' ||
        anyErr?.message?.includes('تکمیل')
      ) {
        showToast(
          'همکار گرامی، برای انجام رزرو ابتدا باید مشخصات و ثبت‌نام خود را تکمیل نمایید',
          'error'
        );
        closeBookingModal();
        openCompleteProfileModal(activeRoom || selectedRoomForBooking || undefined);
        return;
      }
      const message = err instanceof Error ? err.message : 'خطا در ثبت رزرو';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectClass =
    'w-full text-sm pr-3 pl-8 py-2.5 appearance-none border border-slate-200 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10B981]/40 bg-white dark:bg-[#0F172A] text-slate-800 dark:text-slate-200 cursor-pointer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#334155] overflow-visible">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-[#334155]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0F786E]" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">رزرو جلسه</h2>
          </div>
          <button
            type="button"
            id="btn-close-booking-modal"
            onClick={closeBookingModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#334155] cursor-pointer"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!isRegistrationComplete() && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>ثبت‌نام شما کامل نیست؛ تکمیل مشخصات الزامی است.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeBookingModal();
                  openCompleteProfileModal(activeRoom || selectedRoomForBooking || undefined);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors cursor-pointer shrink-0"
              >
                تکمیل مشخصات
              </button>
            </div>
          )}
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">عنوان جلسه</span>
            <input
              type="text"
              id="input-booking-title"
              placeholder="مثلاً: جلسه تیم"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm px-3 py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#10B981]/40"
              autoFocus
              maxLength={80}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">اتاق</span>
            {roomLocked && activeRoom ? (
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155]">
                {activeRoom.name}
                <span className="text-xs text-slate-500 font-normal mr-2">
                  · ظرفیت {activeRoom.capacity}
                </span>
              </p>
            ) : (
              <div className="relative">
                <select
                  id="select-booking-room"
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className={selectClass}
                >
                  {availableRooms.length === 0 ? (
                    <option value="">اتاقی موجود نیست</option>
                  ) : (
                    availableRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} ({room.capacity} نفر)
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </label>

          <PersianDatePicker
            id="input-booking-date"
            label="تاریخ"
            value={date}
            onChange={setDate}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">شروع</span>
              <div className="relative">
                <select
                  id="select-booking-start"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={selectClass}
                >
                  {TIME_SLOTS.slice(0, -1).map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">پایان</span>
              <div className="relative">
                <select
                  id="select-booking-end"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={selectClass}
                >
                  {TIME_SLOTS.filter((t) => t > startTime).map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </label>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-[#0F786E]" />
              دعوت به جلسه
              <span className="text-[10px] font-normal text-slate-400">(اختیاری)</span>
            </span>
            <input
              type="email"
              id="input-booking-invite"
              dir="ltr"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              onKeyDown={handleInviteKeyDown}
              onBlur={() => {
                if (inviteInput.trim()) addInvitee(inviteInput);
              }}
              placeholder="email@company.ir — Enter"
              className="w-full text-sm px-3 py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#10B981]/40 placeholder:text-slate-400"
            />
            {inviteeEmails.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 pt-0.5">
                {inviteeEmails.map((email) => (
                  <li key={email}>
                    <span
                      className="inline-flex items-center gap-1 max-w-full text-[11px] bg-slate-100 dark:bg-[#334155] text-slate-700 dark:text-slate-200 px-2 py-1 rounded-lg"
                    >
                      <span dir="ltr" className="truncate">{email}</span>
                      <button
                        type="button"
                        onClick={() => setInviteeEmails((prev) => prev.filter((e) => e !== email))}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer shrink-0"
                        aria-label="حذف"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {conflictMessage && (
            <p className="text-xs text-rose-600 dark:text-rose-400 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {conflictMessage}
            </p>
          )}

          {activeRoom?.requiresApproval && (
            <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
              این اتاق پس از ثبت، نیاز به تأیید مدیر دارد.
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              id="btn-cancel-booking-form"
              onClick={closeBookingModal}
              className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#334155] rounded-xl hover:bg-slate-200 dark:hover:bg-[#3d4f6a] cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              id="btn-submit-booking-form"
              disabled={isSubmitting || !!conflictMessage || !selectedRoomId}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-[#10B981] hover:bg-[#0D6B63] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'در حال ثبت…' : 'ثبت رزرو'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
