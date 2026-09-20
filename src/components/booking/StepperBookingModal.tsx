import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  Building,
  Users,
  DoorOpen,
  Wifi,
  Tv,
  Coffee,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  onSuccess?: () => void;
}

export const StepperBookingModal: React.FC<Props> = ({ onSuccess }) => {
  const { isBookingModalOpen, closeBookingModal, showToast } = useApp();
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form states matching screenshot
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [meetingType, setMeetingType] = useState<'in_person' | 'online' | 'hybrid'>('in_person');
  const [date, setDate] = useState<string>('2026-09-21');
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('11:00');
  const [selectedRoom, setSelectedRoom] = useState<string>('اتاق کنفرانس ۱');
  const [attendeesEmail, setAttendeesEmail] = useState<string>('');

  if (!isBookingModalOpen) return null;

  const steps = [
    { num: 1, label: 'اطلاعات جلسه' },
    { num: 2, label: 'انتخاب زمان' },
    { num: 3, label: 'انتخاب اتاق' },
    { num: 4, label: 'دعوت از افراد' },
    { num: 5, label: 'تأیید و ثبت' },
  ];

  const handleNext = () => {
    if (currentStep === 1 && !title.trim()) {
      showToast('لطفاً عنوان جلسه را وارد کنید', 'error');
      return;
    }
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    } else {
      showToast('جلسه شما با موفقیت ثبت شد', 'success');
      closeBookingModal();
      if (onSuccess) onSuccess();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-[#334155] shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col md:flex-row min-h-[480px]">
        {/* Right Stepper Sidebar matching screenshot (vertical numbered steps with active purple circle) */}
        <div className="w-full md:w-60 bg-slate-50 dark:bg-[#0F172A] p-6 border-b md:border-b-0 md:border-l border-slate-200/80 dark:border-[#334155] flex flex-col justify-between shrink-0">
          <div>
            <div className="text-right mb-6">
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                رزرو جلسه جدید
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                اطلاعات جلسه خود را وارد کنید
              </p>
            </div>

            {/* Stepper list */}
            <div className="space-y-4">
              {steps.map((s) => {
                const isActive = currentStep === s.num;
                const isPassed = currentStep > s.num;

                return (
                  <div key={s.num} className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                        isActive
                          ? 'bg-[#0F786E] text-white shadow-xs'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 dark:bg-[#334155] text-slate-500'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isActive
                          ? 'text-[#0F786E] dark:text-emerald-300'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="hidden md:block pt-4 border-t border-slate-200/60 dark:border-[#334155]">
            <span className="text-[11px] text-slate-400">سامانه دیدار</span>
          </div>
        </div>

        {/* Left Form Content */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            {/* Step 1: اطلاعات کلی */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">
                  اطلاعات کلی
                </h4>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="text-rose-500 ml-1">*</span>عنوان جلسه
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: جلسه بازنگری پروژه"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#334155] text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0F786E]"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    توضیحات
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="توضیحات جلسه را وارد کنید (اختیاری)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#334155] text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0F786E]"
                  />
                </div>

                {/* Meeting Type Radio Buttons matching screenshot */}
                <div className="space-y-2 text-right">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    نوع جلسه
                  </label>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="mtype"
                        checked={meetingType === 'in_person'}
                        onChange={() => setMeetingType('in_person')}
                        className="accent-[#0F786E]"
                      />
                      <span>حضوری</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="mtype"
                        checked={meetingType === 'online'}
                        onChange={() => setMeetingType('online')}
                        className="accent-[#0F786E]"
                      />
                      <span>آنلاین</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="mtype"
                        checked={meetingType === 'hybrid'}
                        onChange={() => setMeetingType('hybrid')}
                        className="accent-[#0F786E]"
                      />
                      <span>ترکیبی</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: انتخاب زمان */}
            {currentStep === 2 && (
              <div className="space-y-4 text-right">
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">
                  انتخاب تاریخ و ساعت جلسه
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      ساعت شروع
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#334155] text-xs bg-slate-50 dark:bg-[#334155]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      ساعت پایان
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#334155] text-xs bg-slate-50 dark:bg-[#334155]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: انتخاب اتاق */}
            {currentStep === 3 && (
              <div className="space-y-4 text-right">
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">
                  انتخاب اتاق جلسه
                </h4>
                <div className="space-y-2">
                  {['اتاق کنفرانس ۱ (ظرفیت ۱۲ نفر)', 'اتاق کنفرانس ۲ (ظرفیت ۱۴ نفر)', 'اتاق VIP (ظرفیت ۶ نفر)', 'اتاق جلسات کوچک (ظرفیت ۴ نفر)'].map((r) => (
                    <div
                      key={r}
                      onClick={() => setSelectedRoom(r)}
                      className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        selectedRoom === r
                          ? 'border-[#0F786E] bg-emerald-50/50 dark:bg-emerald-950/40 text-[#0F786E]'
                          : 'border-slate-200 dark:border-[#334155] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: دعوت از افراد */}
            {currentStep === 4 && (
              <div className="space-y-4 text-right">
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">
                  دعوت از همکاران و مهمانان
                </h4>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    ایمیل‌های دعوت‌شدگان (با کاما جدا کنید)
                  </label>
                  <textarea
                    rows={4}
                    value={attendeesEmail}
                    onChange={(e) => setAttendeesEmail(e.target.value)}
                    placeholder="ali@company.com, sara@company.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#334155] text-xs bg-slate-50 dark:bg-[#334155]"
                  />
                </div>
              </div>
            )}

            {/* Step 5: تأیید و ثبت */}
            {currentStep === 5 && (
              <div className="space-y-4 text-right">
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">
                  مرور نهایی مشخصات جلسه
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#334155] border border-slate-200/60 dark:border-[#334155] space-y-2 text-xs">
                  <div><strong>عنوان:</strong> {title || 'جلسه تیم محصول'}</div>
                  <div><strong>نوع:</strong> {meetingType === 'in_person' ? 'حضوری' : 'آنلاین'}</div>
                  <div><strong>زمان:</strong> {startTime} الی {endTime}</div>
                  <div><strong>اتاق:</strong> {selectedRoom}</div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons (مرحله بعد - انصراف) matching screenshot */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-[#334155] mt-6">
            <button
              onClick={closeBookingModal}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              انصراف
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-[#334155] text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  مرحله قبل
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0F786E] hover:bg-[#0D6B63] shadow-xs transition-colors cursor-pointer"
              >
                <span>{currentStep === 5 ? 'ثبت نهایی جلسه' : 'مرحله بعد'}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
