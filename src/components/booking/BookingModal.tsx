import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Room, Booking } from '../../types';
import { OrgDatePicker } from '../common/OrgDatePicker';
import { TimePicker } from '../common/TimePicker';
import { formatGregorianIsoLocal } from '../../utils/jalali';
import { X, Calendar, AlertTriangle, ChevronDown, UserPlus } from 'lucide-react';
import { ParticipantSelector } from './ParticipantSelector';
import { triggerBookingNotifications } from '../../utils/notificationDispatcher';
import {
  latestEndTimeForStart,
  validateBookingTimes,
} from '../../utils/bookingRules';

interface Props {
  onSuccess?: () => void;
}

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
    addNotification,
    orgLocale,
  } = useApp();

  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);

  const today = formatGregorianIsoLocal();
  const orgWorkStart = currentOrg?.workHours?.start || '08:00';
  const orgWorkEnd = currentOrg?.workHours?.end || '18:00';
  const maxBookingHours = currentOrg?.settings?.maxBookingHours ?? 4;

  const [date, setDate] = useState<string>(today);
  const [startTime, setStartTime] = useState<string>(orgWorkStart);
  const [endTime, setEndTime] = useState<string>('09:00');
  const endTimeCap = latestEndTimeForStart(startTime, orgWorkEnd, maxBookingHours);
  const [title, setTitle] = useState<string>('');
  const [inviteeEmails, setInviteeEmails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!currentOrg || !isBookingModalOpen) return;

    setTitle('');
    setInviteeEmails([]);
    setDate(today);

    const initStart = currentOrg?.workHours?.start || '08:00';
    const initEndOrg = currentOrg?.workHours?.end || '18:00';
    setStartTime(initStart);

    const [sh, sm] = initStart.split(':').map(Number);
    const endH = sh + 1;
    const endFormatted = `${endH.toString().padStart(2, '0')}:${(sm || 0).toString().padStart(2, '0')}`;
    setEndTime(endFormatted <= initEndOrg ? endFormatted : initEndOrg);
    setConflictMessage(null);

    const loadData = async () => {
      try {
        const [roomsData, bookingsData] = await Promise.all([
          ApiService.getRooms({ orgId: currentOrg.id, status: 'available' }),
          ApiService.getBookings({ orgId: currentOrg.id, date, scope: 'all' }),
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
        const bookingsData = await ApiService.getBookings({ orgId: currentOrg.id, date, scope: 'all' });
        setExistingBookings(bookingsData);
      } catch (err) {
        console.error(err);
      }
    };
    refreshBookings();
  }, [currentOrg, isBookingModalOpen, date]);

  useEffect(() => {
    const cap = latestEndTimeForStart(startTime, orgWorkEnd, maxBookingHours);
    if (endTime > cap) {
      setEndTime(cap);
    }
  }, [startTime, orgWorkEnd, maxBookingHours, endTime]);

  useEffect(() => {
    if (endTime <= startTime) {
      const parts = startTime.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) || 0;
      if (!isNaN(h)) {
        const nextMin = ((h * 60 + m + 60) % (24 * 60));
        const nh = Math.floor(nextMin / 60);
        const nm = nextMin % 60;
        const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
        setEndTime(`${pad2(nh)}:${pad2(nm)}`);
      }
    }
  }, [startTime, endTime]);

  useEffect(() => {
    if (!selectedRoomId || !date || !startTime || !endTime) {
      setConflictMessage(null);
      return;
    }

    const rulesError = validateBookingTimes(
      startTime,
      endTime,
      orgWorkStart,
      orgWorkEnd,
      maxBookingHours,
    );
    if (rulesError) {
      setConflictMessage(rulesError);
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
        `این اتاق از ${orgLocale.formatDigits(conflict.startTime)} تا ${orgLocale.formatDigits(conflict.endTime)} رزرو است.`
      );
    } else {
      setConflictMessage(null);
    }
  }, [
    selectedRoomId,
    date,
    startTime,
    endTime,
    existingBookings,
    orgWorkStart,
    orgWorkEnd,
    maxBookingHours,
    orgLocale,
  ]);

  if (!isBookingModalOpen) return null;

  const activeRoom = availableRooms.find((r) => r.id === selectedRoomId);
  const roomLocked = Boolean(selectedRoomForBooking);

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
    const rulesError = validateBookingTimes(
      startTime,
      endTime,
      orgWorkStart,
      orgWorkEnd,
      maxBookingHours,
    );
    if (rulesError) {
      showToast(rulesError, 'error');
      return;
    }
    if (conflictMessage) {
      showToast(conflictMessage, 'error');
      return;
    }

    const attendeeEmails = [...inviteeEmails];

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

      const bookedRoom = availableRooms.find((r) => r.id === selectedRoomId);
      const roomDisplayName = bookedRoom?.name || newBooking.roomName || 'اتاق جلسات';

      // Automatically dispatch multi-channel notifications (In-App, SMS, Telegram)
      triggerBookingNotifications(
        {
          ...newBooking,
          roomName: roomDisplayName,
        },
        newBooking.status === 'pending_approval' ? 'new_booking_request' : 'booking_approved',
        addNotification
      );

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
    'w-full text-sm pr-3 pl-8 py-2.5 appearance-none border border-slate-200 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.40)] bg-white dark:bg-[#0F172A] text-slate-800 dark:text-slate-200 cursor-pointer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#334155] overflow-visible">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-[#334155]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--brand-primary)]" />
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
              className="w-full text-sm px-3 py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.40)]"
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

          <OrgDatePicker
            id="input-booking-date"
            label={orgLocale.language === 'en' ? 'Date' : 'تاریخ'}
            value={date}
            onChange={setDate}
            required
          />

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">بازه زمانی</span>
            <div className="grid grid-cols-2 gap-3 items-start">
              <TimePicker
                id="input-booking-start"
                label="شروع"
                value={startTime}
                onChange={setStartTime}
                minTime={orgWorkStart}
                maxTime={orgWorkEnd}
                required
              />
              <TimePicker
                id="input-booking-end"
                label="پایان"
                value={endTime}
                onChange={setEndTime}
                minTime={startTime}
                maxTime={endTimeCap}
                isEndTime
                referenceStartTime={startTime}
                required
              />
            </div>
          </div>

          <ParticipantSelector
            currentOrgId={currentOrg?.id || ''}
            currentUserEmail={currentUser?.email}
            roomCapacity={activeRoom?.capacity}
            inviteeEmails={inviteeEmails}
            onChangeInvitees={setInviteeEmails}
            showToast={showToast}
          />

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
              className="flex-1 py-2.5 text-sm font-bold text-white bg-[var(--brand-primary-light)] hover:bg-[var(--brand-primary-hover)] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'در حال ثبت…' : 'ثبت رزرو'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
