import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Check,
  Edit3,
  Bell,
  Copy,
} from 'lucide-react';
import { DailyTask } from '../../types';
import {
  WEEKDAY_NAMES_FA,
  formatJalaliFull,
  formatJalaliShort,
  getStartOfWeekJalali,
  getWeekDaysJalali,
  formatISODateOnly,
  toPersianDigits,
} from '../../utils/jalali';
import { JalaliDatePickerModal } from '../common/JalaliDatePickerModal';
import { TimePickerModal } from '../common/TimePickerModal';
import { DetailedModal } from '../common/DetailedModal';
import { MultiRemindersModal } from '../common/MultiRemindersModal';
import { JalaliMultiDatePickerModal } from '../common/JalaliMultiDatePickerModal';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

interface DailySchedulePageProps {
  dailyTasks: DailyTask[];
  onAddDailyTask: (task: Omit<DailyTask, 'id' | 'createdAtISO'>) => void;
  onUpdateDailyTask: (task: DailyTask) => void;
  onDeleteDailyTask: (id: string) => void;
}

export const DailySchedulePage: React.FC<DailySchedulePageProps> = ({
  dailyTasks,
  onAddDailyTask,
  onUpdateDailyTask,
  onDeleteDailyTask,
}) => {
  // Selected Active Day Date
  const [activeDateISO, setActiveDateISO] = useState<string>(() => formatISODateOnly(new Date()));

  // Active Date Object
  const activeDateObj = useMemo(() => new Date(activeDateISO), [activeDateISO]);

  // Active Week Start
  const activeStartOfWeek = useMemo(() => getStartOfWeekJalali(activeDateObj), [activeDateObj]);
  const activeWeekDays = useMemo(() => getWeekDaysJalali(activeStartOfWeek), [activeStartOfWeek]);

  // New Task Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [summary, setSummary] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');

  // Time Picker Modal Target for New Task Form
  const [activeTimePicker, setActiveTimePicker] = useState<'start' | 'end' | null>(null);

  // Calendar Modal
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  // Detailed Description Modal Target
  const [detailedModalTask, setDetailedModalTask] = useState<DailyTask | null>(null);

  // Mobile Detail Modal Target
  const [mobileModalTask, setMobileModalTask] = useState<DailyTask | null>(null);

  // Multiple Reminders Modal Target
  const [reminderModalTask, setReminderModalTask] = useState<DailyTask | null>(null);

  // Multi-date Duplicator Modal Target
  const [duplicatorModalTask, setDuplicatorModalTask] = useState<DailyTask | null>(null);

  // Confirm Delete Target
  const [deleteTargetTask, setDeleteTargetTask] = useState<{ id: string; title: string } | null>(null);

  // Editing Task State (For Mobile)
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('10:30');
  const [editSummary, setEditSummary] = useState('');
  const [editDetailedDescription, setEditDetailedDescription] = useState('');
  const [activeEditTimePicker, setActiveEditTimePicker] = useState<'start' | 'end' | null>(null);

  // Desktop Inline Cell Editing State
  const [inlineEditField, setInlineEditField] = useState<{
    taskId: string;
    field: 'title' | 'summary' | 'time';
  } | null>(null);
  const [inlineTitleValue, setInlineTitleValue] = useState('');
  const [inlineSummaryValue, setInlineSummaryValue] = useState('');

  // Inline Time Picker Target
  const [inlineTimePickerTask, setInlineTimePickerTask] = useState<{
    task: DailyTask;
    type: 'start' | 'end';
  } | null>(null);

  const parseTimeWindow = (timeWindow: string) => {
    const parts = (timeWindow || '').split('-').map((s) => s.trim());
    return {
      startTime: parts[0] || '09:00',
      endTime: parts[1] || '10:30',
    };
  };

  const handleStartInlineTitle = (t: DailyTask) => {
    setInlineEditField({ taskId: t.id, field: 'title' });
    setInlineTitleValue(t.title);
  };

  const handleSaveInlineTitle = (t: DailyTask) => {
    if (inlineEditField?.taskId !== t.id || inlineEditField?.field !== 'title') return;
    const trimmed = inlineTitleValue.trim();
    if (trimmed && trimmed !== t.title) {
      onUpdateDailyTask({ ...t, title: trimmed });
    }
    setInlineEditField(null);
  };

  const handleStartInlineSummary = (t: DailyTask) => {
    setInlineEditField({ taskId: t.id, field: 'summary' });
    setInlineSummaryValue(t.summary || '');
  };

  const handleSaveInlineSummary = (t: DailyTask) => {
    if (inlineEditField?.taskId !== t.id || inlineEditField?.field !== 'summary') return;
    const trimmed = inlineSummaryValue.trim();
    if (trimmed !== (t.summary || '')) {
      onUpdateDailyTask({ ...t, summary: trimmed });
    }
    setInlineEditField(null);
  };

  // Tasks for current selected day
  const tasksForCurrentDay = useMemo(() => {
    return dailyTasks.filter((t) => t.dateStr === activeDateISO);
  }, [dailyTasks, activeDateISO]);

  const resetForm = () => {
    setTitle('');
    setStartTime('09:00');
    setEndTime('10:30');
    setSummary('');
    setDetailedDescription('');
    setShowForm(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('لطفاً عنوان کار را وارد کنید.');
      return;
    }

    onAddDailyTask({
      dateStr: activeDateISO,
      title: title.trim(),
      timeWindow: `${startTime} - ${endTime}`,
      summary: summary.trim(),
      detailedDescription: detailedDescription.trim(),
      isCompleted: false,
    });

    resetForm();
  };

  const handleToggleCompletion = (t: DailyTask) => {
    onUpdateDailyTask({
      ...t,
      isCompleted: !t.isCompleted,
    });
  };

  const handleConfirmDeleteDailyTask = (id: string, taskTitle?: string) => {
    setDeleteTargetTask({ id, title: taskTitle || 'این کار روزانه' });
  };

  const handleStartEdit = (t: DailyTask) => {
    setEditingTask(t);
    setEditTitle(t.title);

    const parts = (t.timeWindow || '').split('-').map((s) => s.trim());
    setEditStartTime(parts[0] || '09:00');
    setEditEndTime(parts[1] || '10:30');

    setEditSummary(t.summary || '');
    setEditDetailedDescription(t.detailedDescription || '');
  };

  const handleSaveEdit = () => {
    if (!editingTask) return;
    if (!editTitle.trim()) {
      alert('لطفاً عنوان کار را وارد کنید.');
      return;
    }

    const updated: DailyTask = {
      ...editingTask,
      title: editTitle.trim(),
      timeWindow: `${editStartTime} - ${editEndTime}`,
      summary: editSummary.trim(),
      detailedDescription: editDetailedDescription.trim(),
    };

    onUpdateDailyTask(updated);

    if (mobileModalTask && mobileModalTask.id === editingTask.id) {
      setMobileModalTask(updated);
    }

    setEditingTask(null);
  };

  const handleDuplicateTaskToDates = (targetTask: DailyTask, dates: string[]) => {
    if (!targetTask || dates.length === 0) return;
    
    // Duplicate targetTask to each of the selected dates
    dates.forEach((dateISO) => {
      onAddDailyTask({
        dateStr: dateISO,
        title: targetTask.title,
        timeWindow: targetTask.timeWindow,
        summary: targetTask.summary || '',
        detailedDescription: targetTask.detailedDescription || '',
        isCompleted: false,
        reminderSet: targetTask.reminderSet,
        reminders: targetTask.reminders ? [...targetTask.reminders] : [],
      });
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-cyan-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center md:flex-row md:items-center md:justify-between md:text-right gap-4">
          <div className="flex flex-col items-center md:items-start text-center md:text-right w-full md:w-auto">
            <div className="inline-flex items-center justify-center gap-3 px-5 py-3 bg-white/15 backdrop-blur-md rounded-2xl text-base sm:text-lg md:text-xl font-black text-white shadow-inner border border-white/20 select-none text-center">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse shrink-0" />
              <span>زمان‌بندی هوشمند برنامه‌های روزانه</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
            {/* Pick Any Day in Calendar Button */}
            <button
              type="button"
              onClick={() => setShowDatePickerModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-2xl shadow-lg transition-all active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>انتخاب روز از تقویم</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن برنامه امروز</span>
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP TOP WEEK DAYS SELECTOR & MOBILE DAY BUTTON */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        {/* Active Selected Day Label & Quick Jumps */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-emerald-600" />
            <span>برنامه‌های روز: <strong className="text-emerald-700">{formatJalaliFull(activeDateISO)}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const d = new Date(activeDateISO);
                d.setDate(d.getDate() - 7);
                setActiveDateISO(formatISODateOnly(d));
              }}
              className="p-2.5 bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 text-white hover:from-emerald-950 hover:to-cyan-950 rounded-2xl shadow-md transition-all active:scale-95 border border-emerald-950/20"
              title="هفته قبل"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveDateISO(formatISODateOnly(new Date()))}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-950 text-xs font-black rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 border border-emerald-200/60"
            >
              هفته جاری
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date(activeDateISO);
                d.setDate(d.getDate() + 7);
                setActiveDateISO(formatISODateOnly(d));
              }}
              className="p-2.5 bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 text-white hover:from-emerald-950 hover:to-cyan-950 rounded-2xl shadow-md transition-all active:scale-95 border border-emerald-950/20"
              title="هفته بعد"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Days Selector for Active Week (Saturday to Friday) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-1">
          {activeWeekDays.map((wDate, idx) => {
            const iso = formatISODateOnly(wDate);
            const isSelected = iso === activeDateISO;
            const dayJ = formatJalaliShort(wDate);
            const dayNum = dayJ.split('/')[2];

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setActiveDateISO(iso)}
                className={`py-2 px-0.5 sm:py-3 sm:px-2 rounded-2xl border text-center transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-black scale-102'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="text-[10px] sm:text-[11px] font-bold opacity-90 truncate">
                  {WEEKDAY_NAMES_FA[idx]}
                </div>
                <div className="text-[11px] sm:text-xs font-black mt-0.5">
                  {toPersianDigits(dayNum)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ADD DAILY TASK FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          {/* Backdrop Click Closes Form */}
          <div className="absolute inset-0 transition-opacity" onClick={resetForm} />
          
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-7 border border-emerald-500/20 shadow-2xl shadow-emerald-950/10 space-y-6 text-xs z-10 max-h-[95vh] overflow-y-auto transform scale-100 transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                  <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight">
                    افزودن برنامه جدید روزانه
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    برای تاریخ: {formatJalaliFull(activeDateISO)}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={resetForm} 
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="space-y-5 text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                    عنوان کار یا جلسه <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: مطالعه فصل ۲ فیزیک یا جلسه آنلاین..."
                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-semibold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                    ساعت شروع
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTimePicker('start')}
                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-black text-slate-800 flex items-center justify-between dir-ltr text-right hover:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
                  >
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>{toPersianDigits(startTime)}</span>
                  </button>
                </div>

                {/* End Time */}
                <div>
                  <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                    ساعت پایان
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTimePicker('end')}
                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-black text-slate-800 flex items-center justify-between dir-ltr text-right hover:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
                  >
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>{toPersianDigits(endTime)}</span>
                  </button>
                </div>

                {/* Summary */}
                <div className="sm:col-span-2">
                  <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                    توضیحات خلاصه <span className="text-slate-400 font-normal">(چند کلمه کوتاه)</span>
                  </label>
                  <input
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="مثال: چند کلمه برای خلاصه نمایش در جدول..."
                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Detailed Description */}
                <div className="sm:col-span-2">
                  <label className="block font-black text-slate-600 mb-1.5 mr-1 text-[11px] uppercase tracking-wider">
                    توضیحات مفصل <span className="text-slate-400 font-normal">(نمایش در پنجره جداگانه)</span>
                  </label>
                  <textarea
                    value={detailedDescription}
                    onChange={(e) => setDetailedDescription(e.target.value)}
                    rows={3}
                    placeholder="یادداشت‌های کامل، لینک‌ها یا نکات ضروری این کار..."
                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none resize-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-3 font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 via-teal-700 to-teal-800 hover:from-emerald-700 hover:via-teal-800 hover:to-teal-950 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  افزودن کار روزانه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DAILY TASKS TABLE (DESKTOP) & LIST (MOBILE) --- */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden">
        {tasksForCurrentDay.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <Clock className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">هیچ برنامه‌ای برای این روز ثبت نشده است.</p>
            <p className="text-xs text-slate-400">با دکمه «افزودن برنامه امروز»، لیست کارهای این روز را تکمیل کنید.</p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-cyan-50/70 text-emerald-950 font-black border-b border-emerald-100">
                  <tr>
                    <th className="p-4 text-emerald-900">عنوان کار</th>
                    <th className="p-4 text-emerald-900">بازه زمانی</th>
                    <th className="p-4 text-emerald-900">توضیحات</th>
                    <th className="p-4 text-center text-emerald-900">یادآور</th>
                    <th className="p-4 text-center text-emerald-900">وضعیت انجام</th>
                    <th className="p-4 text-center text-emerald-900">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tasksForCurrentDay.map((t) => (
                    <tr key={t.id} className="hover:bg-emerald-50/20 transition-colors">
                      {/* TITLE CELL */}
                      <td className="p-3">
                        {inlineEditField?.taskId === t.id && inlineEditField?.field === 'title' ? (
                          <input
                            type="text"
                            value={inlineTitleValue}
                            onChange={(e) => setInlineTitleValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineTitle(t);
                              if (e.key === 'Escape') setInlineEditField(null);
                            }}
                            onBlur={() => handleSaveInlineTitle(t)}
                            autoFocus
                            className="w-full p-2 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-xs font-bold text-slate-900 outline-none shadow-sm"
                          />
                        ) : (
                          <div
                            onClick={() => handleStartInlineTitle(t)}
                            className={`p-2 rounded-xl cursor-pointer hover:bg-emerald-50/80 transition-colors font-bold ${
                              t.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                            title="برای ویرایش عنوان کلیک کنید"
                          >
                            {t.title}
                          </div>
                        )}
                      </td>

                      {/* TIME WINDOW CELL */}
                      <td className="p-3 dir-ltr text-right">
                        {inlineEditField?.taskId === t.id && inlineEditField?.field === 'time' ? (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              type="button"
                              onClick={() => setInlineTimePickerTask({ task: t, type: 'start' })}
                              className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                              title="تغییر ساعت شروع"
                            >
                              <Clock className="w-3 h-3 text-emerald-700" />
                              <span>{toPersianDigits(parseTimeWindow(t.timeWindow).startTime)}</span>
                            </button>
                            <span className="text-slate-400 font-bold">-</span>
                            <button
                              type="button"
                              onClick={() => setInlineTimePickerTask({ task: t, type: 'end' })}
                              className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                              title="تغییر ساعت پایان"
                            >
                              <Clock className="w-3 h-3 text-emerald-700" />
                              <span>{toPersianDigits(parseTimeWindow(t.timeWindow).endTime)}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineEditField(null)}
                              className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
                              title="تایید"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => setInlineEditField({ taskId: t.id, field: 'time' })}
                            className="p-2 rounded-xl cursor-pointer hover:bg-emerald-50/80 transition-colors font-bold text-emerald-800 inline-block"
                            title="برای تغییر ساعت شروع و پایان کلیک کنید"
                          >
                            {toPersianDigits(t.timeWindow)}
                          </div>
                        )}
                      </td>

                      {/* COMBINED DESCRIPTION CELL */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            {inlineEditField?.taskId === t.id && inlineEditField?.field === 'summary' ? (
                              <input
                                type="text"
                                value={inlineSummaryValue}
                                onChange={(e) => setInlineSummaryValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveInlineSummary(t);
                                  if (e.key === 'Escape') setInlineEditField(null);
                                }}
                                onBlur={() => handleSaveInlineSummary(t)}
                                autoFocus
                                placeholder="توضیحات خلاصه..."
                                className="w-full p-2 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-xs text-slate-800 outline-none shadow-sm"
                              />
                            ) : (
                              <div
                                onClick={() => handleStartInlineSummary(t)}
                                className="p-2 rounded-xl cursor-pointer hover:bg-emerald-50/80 transition-colors text-slate-600 truncate"
                                title="برای ویرایش خلاصه کلیک کنید"
                              >
                                {t.summary ? (
                                  <span>{t.summary}</span>
                                ) : (
                                  <span className="text-slate-300 italic">+ افزودن خلاصه</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setDetailedModalTask(t)}
                            className={`p-1.5 rounded-xl border transition-all inline-flex items-center justify-center shrink-0 ${
                              t.detailedDescription
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300 shadow-xs'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}
                            title="مشاهده و ویرایش توضیحات مفصل"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* REMINDER CELL */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setReminderModalTask(t)}
                          className={`p-1.5 rounded-xl border transition-all inline-flex items-center justify-center gap-1.5 ${
                            t.reminderSet && t.reminders && t.reminders.length > 0
                              ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-xs hover:bg-amber-200'
                              : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                          title="تنظیم یادآورهای چندگانه"
                        >
                          <Bell className="w-4 h-4" />
                          {t.reminderSet && t.reminders && t.reminders.length > 0 && (
                            <span className="bg-amber-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full">
                              {toPersianDigits(t.reminders.length)}
                            </span>
                          )}
                        </button>
                      </td>

                      {/* STATUS CHECKMARK CELL */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCompletion(t)}
                          className={`w-7 h-7 rounded-xl mx-auto flex items-center justify-center transition-all ${
                            t.isCompleted
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      </td>

                      {/* OPERATIONS CELL */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDuplicatorModalTask(t)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                            title="تکثیر این برنامه در روزهای دیگر"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmDeleteDailyTask(t.id, t.title);
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mx-auto cursor-pointer"
                            title="حذف کار"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE RESPONSIVE LIST VIEW */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {tasksForCurrentDay.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setMobileModalTask(t)}
                  className="p-4 hover:bg-slate-50 transition-colors space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <h4 className={`font-bold text-sm ${t.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {t.title}
                    </h4>
                    <span className="text-xs font-bold text-emerald-700 dir-ltr">
                      {toPersianDigits(t.timeWindow)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleToggleCompletion(t)}
                      className={`px-3 py-1 text-xs font-bold rounded-xl flex items-center gap-1 ${
                        t.isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{t.isCompleted ? 'تکمیل شده' : 'انجام شد'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setReminderModalTask(t)}
                        className={`p-1.5 rounded-xl border transition-all ${
                          t.reminderSet && t.reminders && t.reminders.length > 0
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                        title="یادآورها"
                      >
                        <Bell className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDuplicatorModalTask(t)}
                        className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors border border-slate-200"
                        title="تکثیر"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmDeleteDailyTask(t.id, t.title);
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* MOBILE FULL DETAIL MODAL */}
      {mobileModalTask && (
        <DetailedModal
          isOpen={Boolean(mobileModalTask)}
          onClose={() => setMobileModalTask(null)}
          title={mobileModalTask.title}
          timeWindow={mobileModalTask.timeWindow}
          status={mobileModalTask.isCompleted ? 'completed' : 'pending'}
          summary={mobileModalTask.summary}
          detailedDescription={mobileModalTask.detailedDescription}
          createdDateISO={mobileModalTask.createdAtISO}
          onEdit={() => {
            const target = mobileModalTask;
            setMobileModalTask(null);
            handleStartEdit(target);
          }}
          onDelete={() => {
            onDeleteDailyTask(mobileModalTask.id);
            setMobileModalTask(null);
          }}
          onSave={(newDetailed) => {
            onUpdateDailyTask({ ...mobileModalTask, detailedDescription: newDetailed });
          }}
        />
      )}

      {/* EDIT TASK MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-5 shadow-2xl border border-emerald-200 w-full max-w-md space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <span>ویرایش برنامه روزانه</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان کار یا جلسه *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ساعت شروع</label>
                  <button
                    type="button"
                    onClick={() => setActiveEditTimePicker('start')}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between dir-ltr"
                  >
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>{toPersianDigits(editStartTime)}</span>
                  </button>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ساعت پایان</label>
                  <button
                    type="button"
                    onClick={() => setActiveEditTimePicker('end')}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between dir-ltr"
                  >
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>{toPersianDigits(editEndTime)}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">توضیحات خلاصه</label>
                <input
                  type="text"
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">توضیحات مفصل</label>
                <textarea
                  value={editDetailedDescription}
                  onChange={(e) => setEditDetailedDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md"
              >
                ذخیره تغییرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED MODAL */}
      {detailedModalTask && (
        <DetailedModal
          isOpen={Boolean(detailedModalTask)}
          onClose={() => setDetailedModalTask(null)}
          title={detailedModalTask.title}
          timeWindow={detailedModalTask.timeWindow}
          status={detailedModalTask.isCompleted ? 'completed' : 'pending'}
          summary={detailedModalTask.summary}
          detailedDescription={detailedModalTask.detailedDescription}
          createdDateISO={detailedModalTask.createdAtISO}
          onEdit={() => {
            const target = detailedModalTask;
            setDetailedModalTask(null);
            handleStartEdit(target);
          }}
          onDelete={() => {
            onDeleteDailyTask(detailedModalTask.id);
            setDetailedModalTask(null);
          }}
          onSave={(newDetailed) => {
            onUpdateDailyTask({ ...detailedModalTask, detailedDescription: newDetailed });
          }}
        />
      )}

      {/* JALALI DATE PICKER FOR DAY SELECTION */}
      <JalaliDatePickerModal
        isOpen={showDatePickerModal}
        onClose={() => setShowDatePickerModal(false)}
        selectedDateISO={activeDateISO}
        onSelectDate={(iso) => setActiveDateISO(iso)}
        title="انتخاب روز از سال"
      />

      {/* TIME PICKERS FOR NEW TASK FORM */}
      <TimePickerModal
        isOpen={Boolean(activeTimePicker)}
        onClose={() => setActiveTimePicker(null)}
        selectedTime={activeTimePicker === 'start' ? startTime : endTime}
        onSelectTime={(timeStr) => {
          if (activeTimePicker === 'start') setStartTime(timeStr);
          if (activeTimePicker === 'end') setEndTime(timeStr);
        }}
        title={activeTimePicker === 'start' ? 'انتخاب ساعت شروع' : 'انتخاب ساعت پایان'}
      />

      {/* TIME PICKERS FOR EDITING TASK */}
      <TimePickerModal
        isOpen={Boolean(activeEditTimePicker)}
        onClose={() => setActiveEditTimePicker(null)}
        selectedTime={activeEditTimePicker === 'start' ? editStartTime : editEndTime}
        onSelectTime={(timeStr) => {
          if (activeEditTimePicker === 'start') setEditStartTime(timeStr);
          if (activeEditTimePicker === 'end') setEditEndTime(timeStr);
        }}
        title={activeEditTimePicker === 'start' ? 'ویرایش ساعت شروع' : 'ویرایش ساعت پایان'}
      />

      {/* TIME PICKER FOR INLINE CELL TIME EDITING IN TABLE */}
      <TimePickerModal
        isOpen={Boolean(inlineTimePickerTask)}
        onClose={() => setInlineTimePickerTask(null)}
        selectedTime={
          inlineTimePickerTask
            ? inlineTimePickerTask.type === 'start'
              ? parseTimeWindow(inlineTimePickerTask.task.timeWindow).startTime
              : parseTimeWindow(inlineTimePickerTask.task.timeWindow).endTime
            : '09:00'
        }
        onSelectTime={(timeStr) => {
          if (!inlineTimePickerTask) return;
          const { startTime, endTime } = parseTimeWindow(inlineTimePickerTask.task.timeWindow);
          const newStart = inlineTimePickerTask.type === 'start' ? timeStr : startTime;
          const newEnd = inlineTimePickerTask.type === 'end' ? timeStr : endTime;
          onUpdateDailyTask({
            ...inlineTimePickerTask.task,
            timeWindow: `${newStart} - ${newEnd}`,
          });
          setInlineTimePickerTask(null);
        }}
        title={
          inlineTimePickerTask?.type === 'start'
            ? 'ویرایش ساعت شروع'
            : 'ویرایش ساعت پایان'
        }
      />

      {/* MULTIPLE REMINDERS MODAL */}
      {reminderModalTask && (
        <MultiRemindersModal
          isOpen={Boolean(reminderModalTask)}
          onClose={() => setReminderModalTask(null)}
          title={reminderModalTask.title}
          reminderSet={Boolean(reminderModalTask.reminderSet)}
          reminders={reminderModalTask.reminders || []}
          description={reminderModalTask.detailedDescription || reminderModalTask.summary}
          colorScheme="emerald"
          onSave={(enabled, list) => {
            onUpdateDailyTask({
              ...reminderModalTask,
              reminderSet: enabled,
              reminders: list,
            });
            setReminderModalTask(null);
            if (mobileModalTask && mobileModalTask.id === reminderModalTask.id) {
              setMobileModalTask({
                ...mobileModalTask,
                reminderSet: enabled,
                reminders: list,
              });
            }
          }}
        />
      )}

      {/* MULTIPLE JALALI DATE PICKER FOR DUPLICATOR */}
      {duplicatorModalTask && (
        <JalaliMultiDatePickerModal
          isOpen={Boolean(duplicatorModalTask)}
          onClose={() => setDuplicatorModalTask(null)}
          onConfirm={(selectedDates) => {
            handleDuplicateTaskToDates(duplicatorModalTask, selectedDates);
            setDuplicatorModalTask(null);
          }}
          title={`تکثیر «${duplicatorModalTask.title}»`}
        />
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTargetTask)}
        onClose={() => setDeleteTargetTask(null)}
        onConfirm={() => {
          if (deleteTargetTask) {
            onDeleteDailyTask(deleteTargetTask.id);
            setDeleteTargetTask(null);
          }
        }}
        title={`آیا از حذف کار روزانه «${deleteTargetTask?.title}» اطمینان دارید؟`}
      />
    </div>
  );
};
