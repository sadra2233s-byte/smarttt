import React, { useState } from 'react';
import { Bell, Clock, Plus, Trash2, X, Check, Info } from 'lucide-react';
import { toPersianDigits } from '../../utils/jalali';
import { TimePickerModal } from './TimePickerModal';

interface MultiRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  reminderSet: boolean;
  reminders: string[]; // e.g. ["09:00", "18:30"]
  onSave: (reminderSet: boolean, reminders: string[]) => void;
  colorScheme?: 'emerald' | 'teal' | 'blue' | 'purple';
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
}) => {
  const [reminderSet, setReminderSet] = useState(initialReminderSet);
  const [reminders, setReminders] = useState<string[]>(initialReminders);
  const [newTime, setNewTime] = useState('09:00');
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  if (!isOpen) return null;

  const style = themeStyles[colorScheme] || themeStyles.emerald;

  const handleAddCustomTime = () => {
    if (!newTime) return;
    if (reminders.includes(newTime)) {
      alert('این زمان یادآور قبلاً اضافه شده است.');
      return;
    }
    setReminders([...reminders, newTime].sort());
    setReminderSet(true); // Auto-enable if adding a reminder
  };

  const handleRemoveTime = (timeStr: string) => {
    setReminders(reminders.filter((r) => r !== timeStr));
  };

  const handleSave = () => {
    onSave(reminderSet, reminders);
    onClose();
    
    // Trigger mock/browser notification if saved & active
    if (reminderSet && reminders.length > 0 && 'Notification' in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          new Notification('تنظیم یادآورهای چندگانه', {
            body: `تعداد ${toPersianDigits(reminders.length)} یادآور برای "${title}" ثبت شد.`,
          });
        }
      });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
        {/* Backdrop Click Closes Form */}
        <div className="absolute inset-0" onClick={onClose} />
        
        <div className={`relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl ${style.shadow} border ${style.modalBorder} z-10 text-xs`}>
          {/* Header */}
          <div className={`bg-gradient-to-r ${style.gradient} p-4 sm:p-5 text-white flex items-center justify-between`}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div className="text-right">
                <h3 className="font-black text-sm sm:text-base">تنظیم یادآورهای چندگانه</h3>
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
            {/* Notification Switcher Status */}
            <div className={`flex items-center justify-between p-3.5 ${style.bgLight} border ${style.borderLight} rounded-2xl`}>
              <div className="space-y-0.5 text-right">
                <span className="font-bold text-slate-800 text-xs block">فعال‌سازی یادآورها</span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {reminderSet ? 'یادآورها فعال هستند و در زمان‌های مشخص هشدار می‌دهند.' : 'یادآورها موقتاً غیرفعال هستند.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReminderSet(!reminderSet)}
                className={`w-12 h-6.5 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${
                  reminderSet ? `${style.switchBg} justify-end` : 'bg-slate-200 justify-start'
                }`}
              >
                <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md block" />
              </button>
            </div>

            {/* Add Reminder Time input */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">افزودن زمان یادآور دلخواه:</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setTimePickerOpen(true)}
                    className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-extrabold flex items-center justify-between hover:bg-slate-100 transition-all text-xs sm:text-sm text-right"
                  >
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{toPersianDigits(newTime)}</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomTime}
                  className={`px-4 py-2.5 ${style.buttonBg} text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-1 shrink-0 transition-all active:scale-95 text-xs`}
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن</span>
                </button>
              </div>
            </div>

            {/* Current list of reminder times */}
            <div className="space-y-1.5">
              <span className="block font-bold text-slate-700">لیست زمان‌های یادآور ثبت شده:</span>
              {reminders.length === 0 ? (
                <div className="py-6 px-3 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40 text-center text-slate-400 space-y-1">
                  <Info className="w-4 h-4 mx-auto text-slate-300" />
                  <p className="font-semibold text-[10px]">هیچ زمان یادآوری تعریف نشده است.</p>
                  <p className="text-[9px]">از دکمه انتخاب ساعت در بالا جهت تعیین زمان جدید استفاده کنید.</p>
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-1 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  {reminders.map((timeStr) => (
                    <div
                      key={timeStr}
                      className={`flex items-center justify-between p-2.5 bg-white border border-slate-200/80 rounded-xl ${style.borderLightHover} transition-all`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className={`w-3.5 h-3.5 ${style.timeIcon} shrink-0`} />
                        <span className="font-extrabold text-slate-800 text-xs sm:text-sm tracking-wider dir-ltr">
                          {toPersianDigits(timeStr)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTime(timeStr)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف زمان"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save/Close Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
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

      <TimePickerModal
        isOpen={timePickerOpen}
        onClose={() => setTimePickerOpen(false)}
        selectedTime={newTime}
        onSelectTime={(timeStr) => setNewTime(timeStr)}
        title="انتخاب ساعت یادآور"
      />
    </>
  );
};
