import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Search,
  X,
  Archive,
  Edit2,
  Trash2,
  Bell,
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  Clock3,
  FileText,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { TaskGoal, TaskStatus } from '../../types';
import { formatJalaliFull, formatJalaliShort, toPersianDigits } from '../../utils/jalali';
import { JalaliDatePickerModal } from '../common/JalaliDatePickerModal';
import { TimePickerModal } from '../common/TimePickerModal';
import { DetailedModal } from '../common/DetailedModal';
import { MultiRemindersModal } from '../common/MultiRemindersModal';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

interface TasksGoalsPageProps {
  tasks: TaskGoal[];
  onAddTask: (task: Omit<TaskGoal, 'id' | 'createdDateISO' | 'createdTimeStr'>) => void;
  onUpdateTask: (task: TaskGoal) => void;
  onDeleteTask: (id: string) => void;
}

export const TasksGoalsPage: React.FC<TasksGoalsPageProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [summary, setSummary] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [deadlineDate, setDeadlineDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [deadlineTime, setDeadlineTime] = useState('18:00');
  const [reminderSet, setReminderSet] = useState(false);
  const [status, setStatus] = useState<TaskStatus>('pending');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [sortOption, setSortOption] = useState<'created-desc' | 'created-asc' | 'deadline-asc' | 'deadline-desc'>('created-desc');

  // Archive & Modals
  const [showArchive, setShowArchive] = useState(false);
  const [archiveSort, setArchiveSort] = useState<'newest' | 'oldest'>('newest');
  const [archiveStartDate, setArchiveStartDate] = useState<string>('');
  const [archiveEndDate, setArchiveEndDate] = useState<string>('');

  // Active Modals
  const [datePickerField, setDatePickerField] = useState<
    'formDeadline' | 'taskModalDeadline' | 'archiveStart' | 'archiveEnd' | null
  >(null);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [detailedModalTask, setDetailedModalTask] = useState<TaskGoal | null>(null);
  const [mobileDetailTask, setMobileDetailTask] = useState<TaskGoal | null>(null);
  const [reminderModalTask, setReminderModalTask] = useState<TaskGoal | null>(null);
  const [deleteTargetTask, setDeleteTargetTask] = useState<{ id: string; title: string } | null>(null);

  // Quick DateTime & Reminder Modal State
  const [taskForDateTime, setTaskForDateTime] = useState<TaskGoal | null>(null);
  const [tempTaskDate, setTempTaskDate] = useState<string>('');
  const [tempTaskTime, setTempTaskTime] = useState<string>('18:00');
  const [tempTaskReminder, setTempTaskReminder] = useState<boolean>(false);

  const handleOpenDateTimeModal = (t: TaskGoal) => {
    setTaskForDateTime(t);
    setTempTaskDate(t.deadlineDate || new Date().toISOString().slice(0, 10));
    setTempTaskTime(t.deadlineTime || '18:00');
    setTempTaskReminder(t.reminderSet);
  };

  const handleSaveDateTimeModal = () => {
    if (!taskForDateTime) return;
    onUpdateTask({
      ...taskForDateTime,
      deadlineDate: tempTaskDate,
      deadlineTime: tempTaskTime,
      reminderSet: tempTaskReminder,
    });

    setTaskForDateTime(null);
  };

  // Auto-populate Category List
  const existingCategories = useMemo(() => {
    const cats = new Set<string>();
    tasks.forEach((t) => {
      if (t.category && t.category.trim()) cats.add(t.category.trim());
    });
    return Array.from(cats);
  }, [tasks]);

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setSummary('');
    setDetailedDescription('');
    setDeadlineDate(new Date().toISOString().slice(0, 10));
    setDeadlineTime('18:00');
    setReminderSet(false);
    setStatus('pending');
    setEditingTaskId(null);
    setShowAddForm(false);
  };

  const handleStartEdit = (t: TaskGoal) => {
    setEditingTaskId(t.id);
    setTitle(t.title);
    setCategory(t.category);
    setSummary(t.summary);
    setDetailedDescription(t.detailedDescription);
    setDeadlineDate(t.deadlineDate || new Date().toISOString().slice(0, 10));
    setDeadlineTime(t.deadlineTime || '18:00');
    setReminderSet(t.reminderSet);
    setStatus(t.status);
    setShowAddForm(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('لطفاً عنوان تسک را وارد کنید.');
      return;
    }

    if (editingTaskId) {
      const existing = tasks.find((t) => t.id === editingTaskId);
      if (existing) {
        onUpdateTask({
          ...existing,
          title: title.trim(),
          category: category.trim() || 'عمومی',
          summary: summary.trim(),
          detailedDescription: detailedDescription.trim(),
          deadlineDate,
          deadlineTime,
          reminderSet,
          status,
          isArchived: existing.isArchived,
        });
      }
    } else {
      onAddTask({
        title: title.trim(),
        category: category.trim() || 'عمومی',
        summary: summary.trim(),
        detailedDescription: detailedDescription.trim(),
        deadlineDate,
        deadlineTime,
        reminderSet,
        status,
        isArchived: false,
      });
    }

    resetForm();
  };

  const handleToggleReminder = (t: TaskGoal) => {
    const nextState = !t.reminderSet;
    onUpdateTask({ ...t, reminderSet: nextState });
  };

  const handleMoveToArchive = (t: TaskGoal) => {
    onUpdateTask({
      ...t,
      isArchived: true,
      archivedAtISO: new Date().toISOString(),
    });
  };

  const handleConfirmDeleteTask = (id: string, taskTitle?: string) => {
    setDeleteTargetTask({ id, title: taskTitle || 'این تسک' });
  };

  const handleRestoreFromArchive = (t: TaskGoal) => {
    onUpdateTask({
      ...t,
      isArchived: false,
      status: 'pending',
    });
  };

  // Filter & sort active (non-archived) tasks
  const activeTasks = useMemo(() => {
    let list = tasks.filter((t) => {
      if (t.isArchived) return false;
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (selectedStatusFilter !== 'all' && t.status !== selectedStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchSummary = t.summary.toLowerCase().includes(q);
        const matchDetailed = t.detailedDescription.toLowerCase().includes(q);
        const matchCat = t.category.toLowerCase().includes(q);
        if (!matchTitle && !matchSummary && !matchDetailed && !matchCat) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortOption === 'created-desc') {
        const dA = a.createdDateISO || '';
        const dB = b.createdDateISO || '';
        return dB.localeCompare(dA);
      }
      if (sortOption === 'created-asc') {
        const dA = a.createdDateISO || '';
        const dB = b.createdDateISO || '';
        return dA.localeCompare(dB);
      }
      if (sortOption === 'deadline-asc') {
        const dA = (a.deadlineDate || '') + (a.deadlineTime || '');
        const dB = (b.deadlineDate || '') + (b.deadlineTime || '');
        if (!dA && !dB) return 0;
        if (!dA) return 1;
        if (!dB) return -1;
        return dA.localeCompare(dB);
      }
      if (sortOption === 'deadline-desc') {
        const dA = (a.deadlineDate || '') + (a.deadlineTime || '');
        const dB = (b.deadlineDate || '') + (b.deadlineTime || '');
        if (!dA && !dB) return 0;
        if (!dA) return 1;
        if (!dB) return -1;
        return dB.localeCompare(dA);
      }
      return 0;
    });

    return list;
  }, [tasks, selectedCategory, selectedStatusFilter, searchQuery, sortOption]);

  // Filter archived tasks
  const archivedTasks = useMemo(() => {
    let list = tasks.filter((t) => t.isArchived);

    if (archiveStartDate) {
      list = list.filter((t) => (t.createdDateISO || '2026-01-01') >= archiveStartDate);
    }
    if (archiveEndDate) {
      list = list.filter((t) => (t.createdDateISO || '2026-01-01') <= archiveEndDate);
    }

    list.sort((a, b) => {
      const dA = a.createdDateISO || '';
      const dB = b.createdDateISO || '';
      return archiveSort === 'newest' ? dB.localeCompare(dA) : dA.localeCompare(dB);
    });

    return list;
  }, [tasks, archiveStartDate, archiveEndDate, archiveSort]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Welcome Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center md:flex-row md:items-center md:justify-between md:text-right gap-4">
          <div className="flex flex-col items-center md:items-start text-center md:text-right w-full md:w-auto">
            <div className="inline-flex items-center justify-center gap-3 px-5 py-3 bg-white/15 backdrop-blur-md rounded-2xl text-base sm:text-lg md:text-xl font-black text-white shadow-inner border border-white/20 select-none text-center">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse shrink-0" />
              <span>مدیریت اهداف و تسک‌های استراتژیک</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddForm(!showAddForm);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن وظیفه جدید</span>
            </button>

            <button
              type="button"
              onClick={() => setShowArchive(!showArchive)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                showArchive
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>صندوق وظایف ({archivedTasks.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT TASK FORM POPUP MODAL */}
      {showAddForm && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-teal-100 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col my-auto animate-scale-up">
            {/* Styled Modal Header */}
            <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-800 text-white p-5 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <Sparkles className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">
                    {editingTaskId ? 'ویرایش تسک / هدف' : 'افزودن تسک یا هدف جدید'}
                  </h3>
                  <p className="text-xs text-teal-100/80 mt-0.5">
                    مشخصات کامل، دسته، مهلت و یادآور مرورگر را تنظیم کنید
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="p-2 text-teal-200 hover:text-white hover:bg-white/10 rounded-2xl transition-colors"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 overflow-y-auto text-xs text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2 bg-teal-50/50 p-3.5 rounded-2xl border border-teal-100">
                  <label className="block font-extrabold text-teal-950 mb-1.5 text-xs">عنوان اصلی تسک / هدف *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: خلاصه‌نویسی فصل سوم کتاب حسابداری"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-xs"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">دسته‌بندی (افزودن به فیلترها)</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="مثال: دانشگاه، کاری، شخصی..."
                    list="category-suggestions"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none"
                  />
                  <datalist id="category-suggestions">
                    {existingCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                {/* Status */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">وضعیت اجرای تسک</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="pending">در حال انجام</option>
                    <option value="overdue">معوقه</option>
                    <option value="completed">انجام شده</option>
                  </select>
                </div>

                {/* Summary description */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">توضیحات خلاصه (نمایش سریع در جدول)</label>
                  <input
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="چند کلمه کوتاه برای خلاصه جدول..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none"
                  />
                </div>

                {/* Detailed description */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">توضیحات مفصل و تکمیلی (نمایش در پنجره جداگانه)</label>
                  <textarea
                    value={detailedDescription}
                    onChange={(e) => setDetailedDescription(e.target.value)}
                    rows={3}
                    placeholder="تمام جزئیات، یادداشت‌ها و منابع لازم برای این تسک را بنویسید..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none resize-none"
                  />
                </div>

                {/* Deadline Date Picker Trigger */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاریخ مهلت انجام</label>
                  <button
                    type="button"
                    onClick={() => setDatePickerField('formDeadline')}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between hover:bg-slate-100 transition-colors"
                  >
                    <span>{formatJalaliFull(deadlineDate)}</span>
                    <Calendar className="w-4 h-4 text-teal-600" />
                  </button>
                </div>

                {/* Deadline Time Picker Trigger */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ساعت دقیق مهلت</label>
                  <button
                    type="button"
                    onClick={() => setTimePickerOpen(true)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between hover:bg-slate-100 transition-colors dir-ltr"
                  >
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>{toPersianDigits(deadlineTime)}</span>
                  </button>
                </div>

                {/* Reminder checkbox */}
                <div className="md:col-span-2 bg-amber-50/60 border border-amber-200/80 p-3 rounded-2xl flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="reminderSet"
                    checked={reminderSet}
                    onChange={(e) => setReminderSet(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-amber-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="reminderSet" className="text-xs font-bold text-amber-950 cursor-pointer flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-600" />
                    <span>فعال‌سازی ارسال نوتیفیکیشن یادآور در مرورگر</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95"
                >
                  {editingTaskId ? 'ذخیره ویرایش' : 'افزودن به جدول'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* --- TASK INBOX / ARCHIVE POPUP MODAL --- */}
      {showArchive && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-amber-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col my-auto animate-scale-up">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 text-white p-5 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <Archive className="w-5 h-5 text-amber-100" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">صندوق وظایف انجام‌شده و بایگانی</h3>
                  <p className="text-xs text-amber-100/80 mt-0.5">
                    مدیریت، مرور، بازگردانی به جدول یا حذف دائمی وظایف بایگانی‌شده
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowArchive(false)}
                className="p-2 text-amber-200 hover:text-white hover:bg-white/10 rounded-2xl transition-colors"
                title="بستن پنجره"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filter Bar & Scrollable Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <span>تعداد کل بایگانی:</span>
                  <span className="px-2.5 py-0.5 bg-amber-200/80 text-amber-900 rounded-full font-black">
                    {archivedTasks.length} تسک
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Sort filter */}
                  <select
                    value={archiveSort}
                    onChange={(e) => setArchiveSort(e.target.value as any)}
                    className="bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="newest">جدید به قدیم</option>
                    <option value="oldest">قدیم به جدید</option>
                  </select>

                  {/* Date Range Start */}
                  <button
                    type="button"
                    onClick={() => setDatePickerField('archiveStart')}
                    className="bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 hover:bg-amber-100 transition-colors"
                  >
                    از: {archiveStartDate ? formatJalaliShort(archiveStartDate) : 'همه'}
                  </button>

                  {/* Date Range End */}
                  <button
                    type="button"
                    onClick={() => setDatePickerField('archiveEnd')}
                    className="bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 hover:bg-amber-100 transition-colors"
                  >
                    تا: {archiveEndDate ? formatJalaliShort(archiveEndDate) : 'همه'}
                  </button>

                  {(archiveStartDate || archiveEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setArchiveStartDate('');
                        setArchiveEndDate('');
                      }}
                      className="p-1.5 text-amber-800 hover:bg-amber-200 rounded-xl transition-colors"
                      title="پاکسازی فیلتر تاریخ"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {archivedTasks.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Archive className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-600">هیچ تسکی در صندوق بایگانی یافت نشد.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {archivedTasks.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <h4 className="font-bold text-sm text-slate-900">{t.title}</h4>
                          <span className="px-2.5 py-0.5 text-[10px] bg-amber-100 text-amber-900 font-extrabold rounded-full border border-amber-200">
                            {t.category}
                          </span>
                        </div>
                        {t.summary && <p className="text-xs text-slate-500 mt-1">{t.summary}</p>}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setDetailedModalTask(t)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                        >
                          مشاهده جزییات
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRestoreFromArchive(t)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                          title="بازگردانی به جدول اصلی"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>بازگردانی</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmDeleteTask(t.id, t.title)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="حذف دائمی"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowArchive(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- MAIN TASKS TABLE (DESKTOP) & CARDS (MOBILE) --- */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden">
        {/* Table Header / Title & Controls */}
        <div className="p-3.5 sm:p-4 bg-slate-50/90 border-b border-slate-200/80 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
          {/* Title Row */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <span>فهرست تسک‌ها و اهداف جاری</span>
              <span className="px-2.5 py-0.5 text-xs bg-teal-100 text-teal-800 font-black rounded-full border border-teal-200">
                {toPersianDigits(activeTasks.length)} تسک
              </span>
            </h3>

            {/* Mobile Search Toggle */}
            <div className="sm:hidden relative flex items-center">
              {isSearchOpen ? (
                <div className="flex items-center gap-1.5 bg-white border border-teal-500 rounded-xl px-2 py-1 shadow-xs animate-fade-in">
                  <Search className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو..."
                    className="w-28 bg-transparent text-xs font-medium text-slate-800 outline-none placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className={`p-1.5 rounded-xl border transition-all ${
                    searchQuery.trim()
                      ? 'bg-teal-100 text-teal-800 border-teal-300'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                  title="جستجو"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Controls Bar (3 Columns on Mobile, Flex Row on Desktop) */}
          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto pt-0.5 sm:pt-0">
            {/* Category Dropdown Filter */}
            <div className="flex items-center gap-1 bg-white border border-slate-200/90 rounded-xl px-1.5 sm:px-2.5 py-1.5 shadow-2xs hover:border-teal-300 transition-colors w-full sm:w-auto overflow-hidden">
              <Filter className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-transparent font-extrabold text-[10px] sm:text-xs text-slate-700 outline-none cursor-pointer truncate"
              >
                <option value="all">همه دسته‌ها ({toPersianDigits(tasks.filter((t) => !t.isArchived).length)})</option>
                {existingCategories.map((c) => (
                  <option key={c} value={c}>
                    {c} ({toPersianDigits(tasks.filter((t) => !t.isArchived && t.category === c).length)})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown Filter */}
            <div className="flex items-center gap-1 bg-white border border-slate-200/90 rounded-xl px-1.5 sm:px-2.5 py-1.5 shadow-2xs hover:border-teal-300 transition-colors w-full sm:w-auto overflow-hidden">
              <Clock3 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="w-full bg-transparent font-extrabold text-[10px] sm:text-xs text-slate-700 outline-none cursor-pointer truncate"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در حال انجام</option>
                <option value="completed">انجام شده</option>
                <option value="overdue">معوقه</option>
              </select>
            </div>

            {/* Sort Order Dropdown */}
            <div className="flex items-center gap-1 bg-white border border-slate-200/90 rounded-xl px-1.5 sm:px-2.5 py-1.5 shadow-2xs hover:border-teal-300 transition-colors w-full sm:w-auto overflow-hidden">
              <span className="font-extrabold text-[10px] sm:text-[11px] text-slate-400 shrink-0 hidden sm:inline">ترتیب:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="w-full bg-transparent font-extrabold text-[10px] sm:text-xs text-slate-700 outline-none cursor-pointer truncate"
              >
                <option value="created-desc">تاریخ: جدیدترین</option>
                <option value="created-asc">تاریخ: قدیمی‌ترین</option>
                <option value="deadline-asc">مهلت: نزدیک‌ترین</option>
                <option value="deadline-desc">مهلت: دورترین</option>
              </select>
            </div>

            {/* Desktop Search Toggle */}
            <div className="hidden sm:relative sm:flex items-center shrink-0">
              {isSearchOpen ? (
                <div className="flex items-center gap-1.5 bg-white border border-teal-500 rounded-xl px-2.5 py-1.5 shadow-sm animate-fade-in">
                  <Search className="w-3.5 h-3.5 text-teal-600" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو در عنوان، دسته، توضیحات..."
                    className="w-40 sm:w-56 bg-transparent text-xs font-medium text-slate-800 outline-none placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="p-0.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                    title="بستن جستجو"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 font-bold text-xs ${
                    searchQuery
                      ? 'bg-teal-50 border-teal-300 text-teal-800 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  title="جستجو در تسک‌ها"
                >
                  <Search className="w-4 h-4 text-teal-600" />
                  <span>جستجو</span>
                  {searchQuery && <span className="w-2 h-2 rounded-full bg-teal-600"></span>}
                </button>
              )}
            </div>
          </div>
        </div>

        {activeTasks.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <Clock3 className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">هیچ تسک یا هدفی یافت نشد.</p>
            <p className="text-xs text-slate-400">
              برای افزودن موارد جدید از دکمه «افزودن وظیفه جدید» بالای صفحه استفاده کنید.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP INLINE EDITABLE TABLE VIEW */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-gradient-to-r from-emerald-50 via-teal-50/90 to-emerald-50 text-teal-950 font-black border-y border-teal-200/90 shadow-xs">
                  <tr>
                    <th className="p-3 text-right font-black">عنوان تسک (قابل ویرایش مستقیم)</th>
                    <th className="p-3 text-right font-black">دسته‌بندی</th>
                    <th className="p-3 text-right font-black">توضیحات خلاصه</th>
                    <th className="p-3 text-center font-black">توضیحات مفصل</th>
                    <th className="p-3 text-center font-black">یادآور</th>
                    <th className="p-3 text-right font-black">مهلت انجام</th>
                    <th className="p-3 text-center font-black w-28">وضعیت</th>
                    <th className="p-3 text-center font-black">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 text-slate-700 font-medium">
                  {activeTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-teal-50/40 transition-colors border-b border-slate-200/80">
                      {/* Direct Inline Title Edit */}
                      <td className="p-2 min-w-[200px]">
                        <input
                          type="text"
                          value={t.title}
                          onChange={(e) => onUpdateTask({ ...t, title: e.target.value })}
                          className="w-full bg-transparent hover:bg-slate-100/80 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 outline-none transition-all text-xs"
                          placeholder="عنوان تسک..."
                        />
                      </td>

                      {/* Direct Inline Category Edit */}
                      <td className="p-2 w-32">
                        <input
                          type="text"
                          value={t.category}
                          onChange={(e) => onUpdateTask({ ...t, category: e.target.value })}
                          list="category-suggestions"
                          className="w-full bg-slate-100/80 hover:bg-slate-200/80 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl px-2.5 py-1.5 font-extrabold text-xs text-slate-800 outline-none transition-all"
                          placeholder="دسته..."
                        />
                      </td>

                      {/* Direct Inline Summary Edit */}
                      <td className="p-2 min-w-[160px]">
                        <input
                          type="text"
                          value={t.summary || ''}
                          onChange={(e) => onUpdateTask({ ...t, summary: e.target.value })}
                          placeholder="توضیحات کوتاه..."
                          className="w-full bg-transparent hover:bg-slate-100/80 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl px-2.5 py-1.5 text-slate-600 outline-none transition-all text-xs"
                        />
                      </td>

                      {/* Detailed modal button */}
                      <td className="p-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDetailedModalTask(t)}
                          className={`p-1.5 rounded-xl border transition-all inline-flex items-center justify-center ${
                            t.detailedDescription
                              ? 'bg-teal-100 hover:bg-teal-200 text-teal-900 border-teal-300 shadow-xs'
                              : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200/80'
                          }`}
                          title="مشاهده و ویرایش توضیحات مفصل"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Reminder Trigger - Opens Multi Reminders Modal */}
                      <td className="p-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setReminderModalTask(t)}
                          className={`p-1.5 rounded-xl border transition-all inline-flex items-center justify-center gap-1.5 ${
                            t.reminderSet && t.reminders && t.reminders.length > 0
                              ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-xs hover:bg-amber-200'
                              : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                          title={t.reminderSet ? 'مشاهده و ویرایش یادآورهای چندگانه' : 'تنظیم یادآورهای چندگانه'}
                        >
                          <Bell className="w-4 h-4" />
                          {t.reminderSet && t.reminders && t.reminders.length > 0 && (
                            <span className="bg-amber-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full">
                              {toPersianDigits(t.reminders.length)}
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Deadline Trigger - Opens DateTime Modal */}
                      <td className="p-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDateTimeModal(t)}
                          className="group flex flex-col text-right hover:bg-slate-100 p-1.5 rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                          title="کلیک برای تغییر تاریخ و ساعت مهلت"
                        >
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{t.deadlineDate ? formatJalaliShort(t.deadlineDate) : '-'}</span>
                            <Calendar className="w-3.5 h-3.5 text-teal-600 opacity-70 group-hover:opacity-100" />
                          </div>
                          {t.deadlineTime && (
                            <div className="text-[10px] text-slate-400 dir-ltr text-right font-medium">
                              {toPersianDigits(t.deadlineTime)}
                            </div>
                          )}
                        </button>
                      </td>

                      {/* Compact Direct Status Change Dropdown */}
                      <td className="p-1.5 text-center whitespace-nowrap">
                        <select
                          value={t.status}
                          onChange={(e) => {
                            const nextStatus = e.target.value as TaskStatus;
                            onUpdateTask({
                              ...t,
                              status: nextStatus,
                            });
                          }}
                          className={`px-2 py-0.5 font-extrabold text-[10px] rounded-lg border outline-none cursor-pointer transition-all ${
                            t.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : t.status === 'pending'
                              ? 'bg-sky-100 text-sky-900 border-sky-300'
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}
                        >
                          <option value="pending">در حال انجام</option>
                          <option value="overdue">معوقه</option>
                          <option value="completed">انجام شده</option>
                        </select>
                      </td>

                      {/* Operations Column (Archive & Delete) */}
                      <td className="p-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveToArchive(t)}
                            className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                            title="انتقال به صندوق وظایف"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmDeleteTask(t.id, t.title)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="حذف دائمی"
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
              {activeTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 hover:bg-slate-50 transition-colors space-y-2 cursor-pointer"
                  onClick={() => setMobileDetailTask(t)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{t.title}</h4>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={t.status}
                        onChange={(e) => {
                          const nextStatus = e.target.value as TaskStatus;
                          onUpdateTask({ ...t, status: nextStatus });
                        }}
                        className={`px-2 py-0.5 text-[10px] font-extrabold rounded-lg border outline-none cursor-pointer ${
                          t.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : t.status === 'pending'
                            ? 'bg-sky-100 text-sky-900 border-sky-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}
                      >
                        <option value="pending">در حال انجام</option>
                        <option value="overdue">معوقه</option>
                        <option value="completed">انجام شده</option>
                      </select>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                        {t.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      <span>{t.deadlineDate ? formatJalaliShort(t.deadlineDate) : '-'}</span>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setReminderModalTask(t)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          t.reminderSet && t.reminders && t.reminders.length > 0
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-transparent'
                        }`}
                        title="یادآورهای چندگانه"
                      >
                        <Bell className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveToArchive(t)}
                        className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmDeleteTask(t.id, t.title);
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
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

      {/* --- MOBILE FULL DETAIL MODAL --- */}
      {mobileDetailTask && (
        <DetailedModal
          isOpen={Boolean(mobileDetailTask)}
          onClose={() => setMobileDetailTask(null)}
          title={mobileDetailTask.title}
          category={mobileDetailTask.category}
          status={mobileDetailTask.status}
          summary={mobileDetailTask.summary}
          detailedDescription={mobileDetailTask.detailedDescription}
          createdDateISO={mobileDetailTask.createdDateISO}
          createdTimeStr={mobileDetailTask.createdTimeStr}
          deadlineDate={mobileDetailTask.deadlineDate}
          deadlineTime={mobileDetailTask.deadlineTime}
          onEdit={() => {
            const target = mobileDetailTask;
            setMobileDetailTask(null);
            handleStartEdit(target);
          }}
          onDelete={() => {
            onDeleteTask(mobileDetailTask.id);
            setMobileDetailTask(null);
          }}
          onSave={(newDetailed) => {
            onUpdateTask({ ...mobileDetailTask, detailedDescription: newDetailed });
          }}
        />
      )}

      {/* QUICK DATETIME & REMINDER SETTING MODAL */}
      {taskForDateTime && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-teal-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col my-auto animate-scale-up">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 text-white p-5 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <Bell className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">تنظیم مهلت و یادآور مرورگر</h3>
                  <p className="text-[11px] text-teal-100/90 line-clamp-1 mt-0.5">{taskForDateTime.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTaskForDateTime(null)}
                className="p-1.5 text-teal-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              {/* Date selection button */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">تاریخ مهلت انجام</label>
                <button
                  type="button"
                  onClick={() => setDatePickerField('taskModalDeadline')}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 flex items-center justify-between hover:bg-slate-100 transition-colors shadow-xs"
                >
                  <span>{formatJalaliFull(tempTaskDate)}</span>
                  <Calendar className="w-4 h-4 text-teal-600" />
                </button>
              </div>

              {/* Time selection button */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">ساعت دقیق مهلت</label>
                <button
                  type="button"
                  onClick={() => setTimePickerOpen(true)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 flex items-center justify-between hover:bg-slate-100 transition-colors shadow-xs dir-ltr"
                >
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>{toPersianDigits(tempTaskTime)}</span>
                </button>
              </div>

              {/* Browser reminder toggle switch */}
              <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-2xl flex items-center gap-3">
                <input
                  type="checkbox"
                  id="modalReminderSetToggle"
                  checked={tempTaskReminder}
                  onChange={(e) => setTempTaskReminder(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-amber-300 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="modalReminderSetToggle" className="text-xs font-bold text-amber-950 cursor-pointer flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-600" />
                  <span>فعال‌سازی ارسال نوتیفیکیشن یادآور در مرورگر</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTaskForDateTime(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveDateTimeModal}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                ذخیره تغییرات
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DETAILED DESCRIPTION POPUP MODAL */}
      {detailedModalTask && (
        <DetailedModal
          isOpen={Boolean(detailedModalTask)}
          onClose={() => setDetailedModalTask(null)}
          title={detailedModalTask.title}
          category={detailedModalTask.category}
          status={detailedModalTask.status}
          summary={detailedModalTask.summary}
          detailedDescription={detailedModalTask.detailedDescription}
          createdDateISO={detailedModalTask.createdDateISO}
          createdTimeStr={detailedModalTask.createdTimeStr}
          deadlineDate={detailedModalTask.deadlineDate}
          deadlineTime={detailedModalTask.deadlineTime}
          onEdit={() => {
            const target = detailedModalTask;
            setDetailedModalTask(null);
            handleStartEdit(target);
          }}
          onDelete={() => {
            onDeleteTask(detailedModalTask.id);
            setDetailedModalTask(null);
          }}
          onSave={(newDetailed) => {
            onUpdateTask({ ...detailedModalTask, detailedDescription: newDetailed });
          }}
        />
      )}

      {/* DATE PICKERS */}
      <JalaliDatePickerModal
        isOpen={Boolean(datePickerField)}
        onClose={() => setDatePickerField(null)}
        selectedDateISO={
          datePickerField === 'formDeadline'
            ? deadlineDate
            : datePickerField === 'taskModalDeadline'
            ? tempTaskDate
            : datePickerField === 'archiveStart'
            ? archiveStartDate
            : archiveEndDate
        }
        onSelectDate={(iso) => {
          if (datePickerField === 'formDeadline') setDeadlineDate(iso);
          if (datePickerField === 'taskModalDeadline') setTempTaskDate(iso);
          if (datePickerField === 'archiveStart') setArchiveStartDate(iso);
          if (datePickerField === 'archiveEnd') setArchiveEndDate(iso);
        }}
      />

      {/* TIME PICKER */}
      <TimePickerModal
        isOpen={timePickerOpen}
        onClose={() => setTimePickerOpen(false)}
        selectedTime={taskForDateTime ? tempTaskTime : deadlineTime}
        onSelectTime={(time) => {
          if (taskForDateTime) {
            setTempTaskTime(time);
          } else {
            setDeadlineTime(time);
          }
        }}
      />

      {/* MULTIPLE REMINDERS MODAL */}
      {reminderModalTask && (
        <MultiRemindersModal
          isOpen={Boolean(reminderModalTask)}
          onClose={() => setReminderModalTask(null)}
          title={reminderModalTask.title}
          reminderSet={reminderModalTask.reminderSet}
          reminders={reminderModalTask.reminders || []}
          description={reminderModalTask.detailedDescription || reminderModalTask.summary}
          colorScheme="teal"
          onSave={(enabled, list) => {
            onUpdateTask({
              ...reminderModalTask,
              reminderSet: enabled,
              reminders: list,
            });
            setReminderModalTask(null);
          }}
        />
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTargetTask)}
        onClose={() => setDeleteTargetTask(null)}
        onConfirm={() => {
          if (deleteTargetTask) {
            onDeleteTask(deleteTargetTask.id);
            setDeleteTargetTask(null);
          }
        }}
        title={`آیا از حذف تسک «${deleteTargetTask?.title}» اطمینان دارید؟`}
      />
    </div>
  );
};
