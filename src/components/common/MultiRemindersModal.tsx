import React, { useState } from 'react';
import { Bell, Clock, Plus, Trash2, X, Check, Info, Calendar, ExternalLink } from 'lucide-react';
import { formatJalaliShort, toPersianDigits } from '../../utils/jalali';
import { TimePickerModal } from './TimePickerModal';
import { JalaliDatePickerModal } from './JalaliDatePickerModal';

interface MultiRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  reminderSet: boolean;
  reminders: string[]; // e.g. ["2026-07-26 09:00", "09:00"]
  onSave: (reminderSet: boolean, reminders: string[]) => void;
  colorScheme?: 'emerald' | 'teal' | 'blue' | 'purple';
  description?: string;
}

const themeStyles = {
  emerald: {
    gradient: 'from-emerald-600 via-emerald-500 to-teal-600',
    text: 'text-emerald-700',
    bgLight: 'bg-emerald-50/80',
    borderLight: 'border-emerald-100',
    borderLightHover: 'hover:border-emerald-200',
    focusRing: 'focus:ring-emerald-500',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    buttonBg: 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800',
    switchBg: 'bg-emerald-500',
    iconColor: 'text-emerald-600',
    modalBorder: 'border-emerald-100',
    shadow: 'shadow-emerald-100/50',
    timeIcon: 'text-emerald-500',
  },
  teal: {
    gradient: 'from-teal-600 via-teal-500 to-emerald-600',
    text: 'text-teal-700',
    bgLight: 'bg-teal-50/80',
    borderLight: 'border-teal-100',
    borderLightHover: 'hover:border-teal-200',
    focusRing: 'focus:ring-teal-500',
    badge: 'bg-teal-50 text-teal-800 border-teal-200',
    buttonBg: 'bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800',
    switchBg: 'bg-teal-500',
    iconColor: 'text-teal-600',
    modalBorder: 'border-teal-100',
    shadow: 'shadow-teal-100/50',
    timeIcon: 'text-teal-500',
  },
  blue: {
    gradient: 'from-blue-600 via-blue-500 to-indigo-600',
    text: 'text-blue-700',
    bgLight: 'bg-blue-50/80',
    borderLight: 'border-blue-100',
    borderLightHover: 'hover:border-blue-200',
    focusRing: 'focus:ring-blue-500',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    buttonBg: 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800',
    switchBg: 'bg-blue-500',
    iconColor: 'text-blue-600',
    modalBorder: 'border-blue-100',
    shadow: 'shadow-blue-100/50',
    timeIcon: 'text-blue-500',
  },
  purple: {
    gradient: 'from-purple-600 via-purple-500 to-indigo-600',
    text: 'text-purple-700',
    bgLight: 'bg-purple-50/80',
    borderLight: 'border-purple-100',
    borderLightHover: 'hover:border-purple-200',
    focusRing: 'focus:ring-purple-500',
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
    buttonBg: 'bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800',
    switchBg: 'bg-purple-500',
    iconColor: 'text-purple-600',
    modalBorder: 'border-purple-100',
    shadow: 'shadow-purple-100/50',
    timeIcon: 'text-purple-500',
  }
};

export const MultiRemindersModal: React.FC<MultiRemindersModalProps> = ({
  isOpen,
  onClose,
  title,
  reminderSet: initialReminderSet,
  reminders: initialReminders = [],
  onSave,
  colorScheme = 'emerald',
  description = '',
}) => {
  const [reminderSet, setReminderSet] = useState(initialReminderSet);
  const [reminders, setReminders] = useState<string[]>(initialReminders);
  
  // New reminder item state (both date and time)
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newTime, setNewTime] = useState('09:00');

  // Modals inside
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  if (!isOpen) return null;

  const style = themeStyles[colorScheme] || themeStyles.emerald;

  const handleAddCustomReminder = () => {
    if (!newDate || !newTime) return;
    const reminderEntry = `${newDate} ${newTime}`;
    if (reminders.includes(reminderEntry)) {
      alert('این تاریخ و زمان یادآور قبلاً اضافه شده است.');
      return;
    }
    setReminders([...reminders, reminderEntry].sort());
    setReminderSet(true);
  };

  const handleRemoveReminder = (reminderStr: string) => {
    setReminders(reminders.filter((r) => r !== reminderStr));
  };

  const handleOpenGoogleCalendar = (reminderStr?: string) => {
    let datePart = newDate;
    let timePart = newTime;
    if (reminderStr) {
      if (reminderStr.includes(' ')) {
        const parts = reminderStr.split(' ');
        datePart = parts[0];
        timePart = parts[1];
      } else if (reminderStr.includes(':')) {
        timePart = reminderStr;
      }
    }
    const cleanDate = datePart.replace(/-/g, '').replace(/\//g, '');
    const cleanTime = (timePart || '09:00').replace(':', '') + '00';
    const startDateTime = `${cleanDate.length === 8 ? cleanDate : new Date().toISOString().slice(0, 10).replace(/-/g, '')}T${cleanTime}`;
    
    const [hh, mm] = (timePart || '09:00').split(':').map(Number);
    const endHh = String(((hh || 9) + 1) % 24).padStart(2, '0');
    const endCleanTime = `${endHh}${String(mm || 0).padStart(2, '0')}00`;
    const endDateTime = `${cleanDate.length === 8 ? cleanDate : new Date().toISOString().slice(0, 10).replace(/-/g, '')}T${endCleanTime}`;

    const eventTitle = `یادآور: ${title}`;
    const eventDetails = description ? `${description}\n\nثبت‌شده از طریق اپلیکیشن مدیریت برنامه‌ها` : 'ثبت‌شده از طریق اپلیکیشن مدیریت برنامه‌ها';
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDateTime}/${endDateTime}&details=${encodeURIComponent(eventDetails)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSave = () => {
    onSave(reminderSet, reminders);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
        <div className="absolute inset-0" onClick={onClose} />
        
        <div className={`relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl ${style.shadow} border ${style.modalBorder} z-10 text-xs`}>
          {/* Header */}
          <div className={`bg-gradient-to-r ${style.gradient} p-4 sm:p-5 text-white flex items-center justify-between`}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div className="text-right">
                <h3 className="font-black text-sm sm:text-base">تنظیم یادآور و همگام‌سازی با گوگل کلندر</h3>
                <p className="text-[10px] text-white/80 mt-0.5 font-medium">برای: {title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4 text-right">
            {/* Info Notice about Google Calendar */}
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-2 text-blue-900">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-[11px]">
                <p className="font-bold">یادآورهای گوگل کلندر</p>
                <p className="text-blue-800/90 leading-relaxed">
                  برای دریافت نوتیفیکیشن‌های دقیق و مطمئن، زمان و تاریخ مورد نظر را انتخاب کرده و با یک کلیک به <strong>گوگل کلندر</strong> منتقل کنید تا یادآور شما را مدیریت کند.
                </p>
              </div>
            </div>

            {/* Date & Time Picker for New Reminder */}
            <div className="bg-slate-50/80 border border-slate-200/90 p-4 rounded-2xl space-y-3">
              <span className="block font-extrabold text-slate-800">انتخاب تاریخ و ساعت یادآور جدید:</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date Picker Button */}
                <div>
                  <label className="block font-bold text-slate-600 mb-1">تاریخ یادآور</label>
                  <button
                    type="button"
                    onClick={() => setDatePickerOpen(true)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-extrabold flex items-center justify-between hover:bg-slate-100 transition-all"
                  >
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span>{formatJalaliShort(newDate)}</span>
                  </button>
                </div>

                {/* Time Picker Button */}
                <div>
                  <label className="block font-bold text-slate-600 mb-1">ساعت یادآور</label>
                  <button
                    type="button"
                    onClick={() => setTimePickerOpen(true)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-extrabold flex items-center justify-between hover:bg-slate-100 transition-all dir-ltr"
                  >
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>{toPersianDigits(newTime)}</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddCustomReminder}
                  className={`px-4 py-2 ${style.buttonBg} text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 text-xs`}
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن به لیست یادآورها</span>
                </button>
              </div>
            </div>

            {/* List of Reminders */}
            <div className="space-y-1.5">
              <span className="block font-bold text-slate-700">تاریخ و زمان‌های یادآور ثبت شده:</span>
              {reminders.length === 0 ? (
                <div className="py-6 px-3 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40 text-center text-slate-400 space-y-1">
                  <Info className="w-4 h-4 mx-auto text-slate-300" />
                  <p className="font-semibold text-[10px]">هیچ زمان یادآوری تعریف نشده است.</p>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-2 p-1 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  {reminders.map((remStr) => {
                    let dStr = '';
                    let tStr = remStr;
                    if (remStr.includes(' ')) {
                      const parts = remStr.split(' ');
                      dStr = parts[0];
                      tStr = parts[1];
                    }
                    return (
                      <div
                        key={remStr}
                        className={`flex items-center justify-between p-3 bg-white border border-slate-200/90 rounded-xl ${style.borderLightHover} transition-all`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            {dStr && (
                              <span className="block font-extrabold text-slate-900 text-xs">
                                {formatJalaliShort(dStr)}
                              </span>
                            )}
                            <span className="block font-bold text-slate-600 text-[11px] dir-ltr text-right">
                              ساعت: {toPersianDigits(tStr)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenGoogleCalendar(remStr)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-extrabold rounded-xl text-[11px] flex items-center gap-1 transition-colors"
                            title="افزودن این مورد به گوگل کلندر"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>گوگل کلندر</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveReminder(remStr)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className={`px-5 py-2 ${style.buttonBg} text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95`}
                >
                  <Check className="w-4 h-4" />
                  <span>ذخیره نهایی</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TimePickerModal
        isOpen={timePickerOpen}
        onClose={() => setTimePickerOpen(false)}
        selectedTime={newTime}
        onSelectTime={(timeStr) => setNewTime(timeStr)}
        title="انتخاب ساعت یادآور"
      />

      <JalaliDatePickerModal
        isOpen={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        selectedDateISO={newDate}
        onSelectDate={(iso) => setNewDate(iso)}
        title="انتخاب تاریخ یادآور"
      />
    </>
  );
};
