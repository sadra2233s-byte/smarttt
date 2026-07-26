import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Calendar,
  Flame,
  CheckCircle2,
  XCircle,
  EyeOff,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Bell,
  Check,
} from 'lucide-react';
import { Habit, WeeklyNote } from '../../types';
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
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

interface HabitsPageProps {
  habits: Habit[];
  weeklyNotes: WeeklyNote[];
  onAddHabit: (title: string, createdAtISO?: string, disabledDays?: boolean[]) => void;
  onUpdateHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onAddWeeklyNote: (weekKey: string, text: string) => void;
  onDeleteWeeklyNote: (id: string) => void;
}

export const HabitsPage: React.FC<HabitsPageProps> = ({
  habits,
  weeklyNotes,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
  onAddWeeklyNote,
  onDeleteWeeklyNote,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalHabitTitle, setModalHabitTitle] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selected Active Week Anchor Date
  const [activeWeekAnchorDate, setActiveWeekAnchorDate] = useState<Date>(() => new Date());

  // Week Selector Calendar Modal
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Mobile detail habit modal
  const [mobileModalHabitId, setMobileModalHabitId] = useState<string | null>(null);

  // Confirm Delete Targets
  const [deleteTargetHabit, setDeleteTargetHabit] = useState<{ id: string; title: string } | null>(null);
  const [deleteTargetWeeklyNote, setDeleteTargetWeeklyNote] = useState<string | null>(null);

  const mobileModalHabit = useMemo(() => {
    return habits.find((h) => h.id === mobileModalHabitId) || null;
  }, [habits, mobileModalHabitId]);

  const showToast = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage((prev) => (prev === message ? null : prev));
    }, 4000);
  };

  const handleConfirmDeleteHabit = (id: string, habitTitle?: string) => {
    setDeleteTargetHabit({ id, title: habitTitle || 'این عادت' });
  };

  const handleConfirmDeleteWeeklyNote = (id: string) => {
    setDeleteTargetWeeklyNote(id);
  };

  // Calculate Start of Week for current selected anchor date
  const activeStartOfWeek = useMemo(() => {
    return getStartOfWeekJalali(activeWeekAnchorDate);
  }, [activeWeekAnchorDate]);

  const activeWeekDays = useMemo(() => {
    return getWeekDaysJalali(activeStartOfWeek);
  }, [activeStartOfWeek]);

  const activeWeekKey = useMemo(() => {
    return formatISODateOnly(activeStartOfWeek);
  }, [activeStartOfWeek]);

  // Filter habits to display them for any week on or after their creation week, deduplicated by title
  const filteredHabits = useMemo(() => {
    const valid = habits.filter((habit) => {
      if (!habit.createdAtISO) return true;
      try {
        const parts = habit.createdAtISO.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          const dateObj = new Date(y, m, d);
          const sow = getStartOfWeekJalali(dateObj);
          const sowKey = formatISODateOnly(sow);
          return sowKey <= activeWeekKey;
        }
      } catch (err) {
        console.error('Error parsing habit creation date:', err);
      }
      return true;
    });

    const seenTitles = new Set<string>();
    const uniqueHabits: Habit[] = [];
    for (const h of valid) {
      const cleanTitle = h.title.trim();
      if (!seenTitles.has(cleanTitle)) {
        seenTitles.add(cleanTitle);
        uniqueHabits.push(h);
      }
    }
    return uniqueHabits;
  }, [habits, activeWeekKey]);

  // Navigate Weeks
  const handlePrevWeek = () => {
    const prev = new Date(activeStartOfWeek.getTime());
    prev.setDate(prev.getDate() - 7);
    setActiveWeekAnchorDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(activeStartOfWeek.getTime());
    next.setDate(next.getDate() + 7);
    setActiveWeekAnchorDate(next);
  };

  const handleTodayWeek = () => {
    setActiveWeekAnchorDate(new Date());
  };

  // Add Habit from Modal
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalHabitTitle.trim()) return;
    onAddHabit(modalHabitTitle.trim(), activeWeekKey);
    setModalHabitTitle('');
    setIsAddModalOpen(false);
    showToast(`عادت جدید «${modalHabitTitle.trim()}» با موفقیت افزوده شد.`);
  };

  // Toggle Day Completion for active week
  const handleToggleDay = (habit: Habit, dayIndex: number) => {
    const currentWeekArray = habit.weekHistory[activeWeekKey]
      ? [...habit.weekHistory[activeWeekKey]]
      : [false, false, false, false, false, false, false];

    currentWeekArray[dayIndex] = !currentWeekArray[dayIndex];

    const updatedHistory = {
      ...habit.weekHistory,
      [activeWeekKey]: currentWeekArray,
    };

    onUpdateHabit({
      ...habit,
      weekHistory: updatedHistory,
    });
  };

  // Toggle Day Disabled / Blur (so it doesn't count against streak)
  const handleToggleDisableDay = (habit: Habit, dayIndex: number) => {
    const newDisabled = [...(habit.disabledDays || [false, false, false, false, false, false, false])];
    newDisabled[dayIndex] = !newDisabled[dayIndex];

    onUpdateHabit({
      ...habit,
      disabledDays: newDisabled,
    });
  };

  // Calculate habit stats for active week
  const calculateHabitStats = (habit: Habit) => {
    const daysArray = habit.weekHistory[activeWeekKey] || [false, false, false, false, false, false, false];
    const disabledArray = habit.disabledDays || [false, false, false, false, false, false, false];

    let activeDaysCount = 0;
    let completedCount = 0;

    for (let i = 0; i < 7; i++) {
      if (!disabledArray[i]) {
        activeDaysCount++;
        if (daysArray[i]) completedCount++;
      }
    }

    const percentage = activeDaysCount > 0 ? Math.round((completedCount / activeDaysCount) * 100) : 0;

    // Find all matching habits with the same title to consolidate historical data
    const matchingHabits = habits.filter((h) => h.title.trim() === habit.title.trim());
    const earliestCreationISO = matchingHabits.reduce((earliest, h) => {
      return h.createdAtISO && h.createdAtISO < earliest ? h.createdAtISO : earliest;
    }, habit.createdAtISO || formatISODateOnly(new Date()));

    const getStatusForDate = (d: Date) => {
      const sow = getStartOfWeekJalali(d);
      const sowKey = formatISODateOnly(sow);
      const weekDays = getWeekDaysJalali(sow);
      const dayIdx = weekDays.findIndex((wd) => formatISODateOnly(wd) === formatISODateOnly(d));

      if (dayIdx === -1) return { isDone: false, isDisabled: false, isAbsent: true };

      const dateStr = formatISODateOnly(d);
      if (dateStr < earliestCreationISO) {
        return { isDone: false, isDisabled: false, isAbsent: true };
      }

      let weekData: boolean[] | undefined = undefined;
      let targetDisabled: boolean[] = habit.disabledDays || [false, false, false, false, false, false, false];

      for (const h of matchingHabits) {
        if (h.weekHistory && h.weekHistory[sowKey] !== undefined) {
          weekData = h.weekHistory[sowKey];
          if (h.disabledDays) targetDisabled = h.disabledDays;
          break;
        }
      }

      if (!weekData && habit.weekHistory) {
        weekData = habit.weekHistory[sowKey];
      }

      const isDisabled = !!targetDisabled[dayIdx];
      const isDone = weekData ? !!weekData[dayIdx] : false;

      return { isDone, isDisabled, isAbsent: false };
    };

    // Determine the latest completed date
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    let latestDoneDate: Date | null = null;

    // Scan backwards from today + 14 days down to 365 days ago to find the max date that is done
    for (let offset = -14; offset <= 365; offset++) {
      const checkD = new Date(today.getTime() - offset * 86400000);
      const st = getStatusForDate(checkD);
      if (st.isDone) {
        latestDoneDate = checkD;
        break;
      }
    }

    if (!latestDoneDate) {
      return { percentage, streak: 0, completedCount, activeDaysCount };
    }

    // Check if the streak is still valid relative to today
    if (latestDoneDate < today) {
      let gapValid = true;
      let checkGap = new Date(today.getTime() - 86400000); // yesterday
      while (checkGap > latestDoneDate) {
        const st = getStatusForDate(checkGap);
        if (!st.isDisabled && !st.isAbsent) {
          gapValid = false;
          break;
        }
        checkGap = new Date(checkGap.getTime() - 86400000);
      }
      const todaySt = getStatusForDate(today);
      if (!todaySt.isDisabled && !todaySt.isAbsent && !todaySt.isDone && !gapValid) {
        return { percentage, streak: 0, completedCount, activeDaysCount };
      }
    }

    // Count consecutive done/disabled days going backwards starting from latestDoneDate
    let streak = 0;
    let curr = new Date(latestDoneDate.getTime());

    for (let step = 0; step < 365; step++) {
      const st = getStatusForDate(curr);

      if (st.isAbsent) {
        break;
      }
      if (st.isDisabled) {
        curr = new Date(curr.getTime() - 86400000);
        continue;
      }
      if (st.isDone) {
        streak++;
        curr = new Date(curr.getTime() - 86400000);
      } else {
        break;
      }
    }

    return { percentage, streak, completedCount, activeDaysCount };
  };

  // Filter notes for active week
  const activeWeekNotesList = useMemo(() => {
    return weeklyNotes.filter((n) => n.weekKey === activeWeekKey);
  }, [weeklyNotes, activeWeekKey]);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddWeeklyNote(activeWeekKey, newNoteText.trim());
    setNewNoteText('');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-teal-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center md:flex-row md:items-center md:justify-between md:text-right gap-4">
          <div className="flex flex-col items-center md:items-start text-center md:text-right w-full md:w-auto">
            <div className="inline-flex items-center justify-center gap-2.5 px-4.5 py-2.5 bg-white/15 backdrop-blur-md rounded-2xl text-sm sm:text-base md:text-lg font-black text-white shadow-inner border border-white/20 select-none text-center">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse shrink-0" />
              <span>پایش عادات روزانه و استریک (Streak)</span>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center justify-center md:justify-end gap-2.5 flex-wrap w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                setModalHabitTitle('');
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن عادت جدید</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCalendarModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-2xl shadow-lg transition-all active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>انتخاب هفته از تقویم</span>
            </button>
          </div>
        </div>
      </div>

      {/* Week Navigator Controller Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="p-2.5 bg-gradient-to-br from-indigo-900 via-indigo-800 to-teal-900 text-white hover:from-indigo-950 hover:to-teal-950 rounded-2xl shadow-md transition-all active:scale-95 border border-indigo-950/20"
            title="هفته قبل"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleTodayWeek}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-50 to-teal-50 hover:from-indigo-100 hover:to-teal-100 text-indigo-950 text-xs font-black rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 border border-indigo-200/60"
          >
            هفته جاری
          </button>
          <button
            type="button"
            onClick={handleNextWeek}
            className="p-2.5 bg-gradient-to-br from-indigo-900 via-indigo-800 to-teal-900 text-white hover:from-indigo-950 hover:to-teal-950 rounded-2xl shadow-md transition-all active:scale-95 border border-indigo-950/20"
            title="هفته بعد"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center font-black text-sm text-slate-800">
          هفته شروع شده از: <span className="text-indigo-700">{formatJalaliFull(activeStartOfWeek)}</span>
        </div>
      </div>

      {/* --- HABITS TABLE (DESKTOP) & LIST (MOBILE) --- */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden">
        {habits.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <Flame className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">هنوز هیچ عادتی ثبت نکرده‌اید.</p>
            <p className="text-xs text-slate-400">یک عادت جدید اضافه کنید تا زنجیره موفقیت خود را شکل دهید.</p>
          </div>
        ) : filteredHabits.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <Flame className="w-12 h-12 text-indigo-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">در این هفته هنوز عادت فعالی ندارید.</p>
            <p className="text-xs text-slate-500">
              عادت‌های شما از هفته‌ای که ایجادشان کرده‌اید فعال و پایش می‌شوند. برای مشاهده یا ویرایش عادات خود، به هفته‌های بعد یا هفته جاری بروید.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gradient-to-r from-indigo-50/90 via-indigo-50/50 to-teal-50/70 text-indigo-950 font-black border-b border-indigo-100">
                  <tr>
                    <th className="p-4 w-1/4 text-indigo-900">عنوان عادت</th>
                    {WEEKDAY_NAMES_FA.map((wName, idx) => (
                      <th key={wName} className="p-3 text-center">
                        <div className="text-indigo-950 font-black">{wName}</div>
                        <div className="text-[10px] text-indigo-600/70 font-bold mt-0.5">
                          {formatJalaliShort(activeWeekDays[idx]).slice(-5)}
                        </div>
                      </th>
                    ))}
                    <th className="p-3 text-center text-indigo-900">استریک (Streak)</th>
                    <th className="p-3 text-center text-indigo-900">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredHabits.map((habit) => {
                    const daysArray = habit.weekHistory[activeWeekKey] || [false, false, false, false, false, false, false];
                    const disabledArray = habit.disabledDays || [false, false, false, false, false, false, false];
                    const stats = calculateHabitStats(habit);

                    return (
                      <tr key={habit.id} className="hover:bg-indigo-50/30 transition-colors">
                        {/* Title */}
                        <td className="p-4 font-bold text-slate-900">{habit.title}</td>

                        {/* 7 Days checkboxes & blur toggles */}
                        {WEEKDAY_NAMES_FA.map((_, dayIdx) => {
                          const isDone = daysArray[dayIdx];
                          const isDisabled = disabledArray[dayIdx];

                          return (
                            <td key={dayIdx} className="p-3 text-center">
                              <div className="flex flex-col items-center justify-center gap-1">
                                <button
                                  type="button"
                                  disabled={isDisabled}
                                  onClick={() => handleToggleDay(habit, dayIdx)}
                                  className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                                    isDisabled
                                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-40 blur-[1px]'
                                      : isDone
                                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105'
                                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700'
                                  }`}
                                  title={isDisabled ? 'این روز غیرفعال است' : isDone ? 'انجام شده' : 'ثبت انجام'}
                                >
                                  {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : <span className="text-xs font-bold">{dayIdx + 1}</span>}
                                </button>

                                {/* Small Blur/Disable Toggle Button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleDisableDay(habit, dayIdx)}
                                  className={`p-0.5 rounded-md text-[10px] transition-colors ${
                                    isDisabled
                                      ? 'text-indigo-700 font-bold bg-indigo-50'
                                      : 'text-slate-300 hover:text-slate-600'
                                  }`}
                                  title={isDisabled ? 'فعال کردن این روز در استریک' : 'بی‌اثر کردن این روز در استریک'}
                                >
                                  <EyeOff className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          );
                        })}

                        {/* Streak */}
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 font-black rounded-xl">
                            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span>{toPersianDigits(stats.streak)} روز</span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmDeleteHabit(habit.id, habit.title);
                              }}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="حذف عادت"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE RESPONSIVE CARDS VIEW */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {filteredHabits.map((habit) => {
                const daysArray = habit.weekHistory[activeWeekKey] || [false, false, false, false, false, false, false];
                const disabledArray = habit.disabledDays || [false, false, false, false, false, false, false];
                const stats = calculateHabitStats(habit);

                return (
                  <div key={habit.id} className="p-4 space-y-3">
                    <div
                      onClick={() => setMobileModalHabitId(habit.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <h4 className="font-bold text-slate-900 text-sm">{habit.title}</h4>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-200">
                          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{toPersianDigits(stats.streak)} روز</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick 7-Day Interactive Row on Mobile Card */}
                    <div className="grid grid-cols-7 gap-1 pt-1">
                      {WEEKDAY_NAMES_FA.map((w, idx) => {
                        const isDone = daysArray[idx];
                        const isDisabled = disabledArray[idx];

                        return (
                          <div key={w} className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400">{w.substring(0, 1)}</span>
                            <button
                              type="button"
                              disabled={isDisabled}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleDay(habit, idx);
                              }}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                                isDisabled
                                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-40 blur-[1px]'
                                  : isDone
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title={isDisabled ? 'روز غیرفعال' : isDone ? 'انجام شده' : 'ثبت انجام'}
                            >
                              {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleDisableDay(habit, idx);
                              }}
                              className={`p-0.5 rounded text-[10px] ${
                                isDisabled ? 'text-indigo-700 font-bold bg-indigo-50' : 'text-slate-300 hover:text-slate-600'
                              }`}
                              title="تغییر استثنا/غیرفعال"
                            >
                              <EyeOff className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* --- WEEKLY NOTES & REMINDERS SECTION --- */}
      <div className="bg-slate-50/50 rounded-3xl border border-slate-200/60 p-1">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
          {/* Card Title Header with custom gradient and text style */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-teal-50/30 to-white p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div className="text-right">
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  تخته یادآوری و نکات طلایی هفته
                </h3>
                <p className="text-[10px] sm:text-xs font-bold text-indigo-600/80 mt-0.5">
                  هفته فعال: {formatJalaliShort(activeStartOfWeek)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              {activeWeekNotesList.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 bg-teal-50 text-teal-800 text-[10px] font-extrabold rounded-full border border-teal-100">
                  {toPersianDigits(activeWeekNotesList.length)} یادداشت فعال
                </span>
              )}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-800 text-[10px] font-bold rounded-xl border border-indigo-100">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>پیش‌ران انگیزه و اهداف</span>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Form layout: fully responsive, spacious */}
            <form onSubmit={handleCreateNote} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="افزودن یادآوری، ایده، جمله انگیزشی یا نکته کلیدی برای این هفته..."
                  className="w-full pl-3 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 text-right shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs sm:text-sm font-black rounded-2xl transition-all shadow-md active:scale-95 shrink-0 flex items-center justify-center gap-2 border border-indigo-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت در تخته هفته</span>
              </button>
            </form>

            {/* Note list: beautiful grid, wrapping content properly */}
            {activeWeekNotesList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-slate-200 rounded-3xl bg-slate-50/30 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400">
                  <Sparkles className="w-6 h-6 text-slate-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-700">
                    تخته یادآوری این هفته خالی است!
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    جملات الهام‌بخش، اهداف اصلی یا هشدارهای مهمی که می‌خواهید مدام جلوی چشمتان باشند را ثبت کنید تا انگیزه خود را حفظ کنید.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeWeekNotesList.map((note, index) => {
                  // Beautiful soft pastel palette for alternating sticky note look
                  const palettes = [
                    {
                      bg: 'bg-indigo-50/40 hover:bg-indigo-50/60',
                      border: 'border-indigo-100/80 hover:border-indigo-200',
                      iconBg: 'bg-indigo-100/80 text-indigo-700',
                      badgeText: 'text-indigo-600',
                    },
                    {
                      bg: 'bg-teal-50/40 hover:bg-teal-50/60',
                      border: 'border-teal-100/80 hover:border-teal-200',
                      iconBg: 'bg-teal-100/80 text-teal-700',
                      badgeText: 'text-teal-600',
                    },
                    {
                      bg: 'bg-amber-50/40 hover:bg-amber-50/60',
                      border: 'border-amber-100/80 hover:border-amber-200',
                      iconBg: 'bg-amber-100/80 text-amber-700',
                      badgeText: 'text-amber-600',
                    },
                  ];
                  const palette = palettes[index % palettes.length];

                  return (
                    <div
                      key={note.id}
                      className={`group relative p-5 ${palette.bg} border ${palette.border} rounded-2xl flex flex-col justify-between gap-4 transition-all hover:shadow-sm`}
                    >
                      {/* Note Top Bar */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg ${palette.iconBg} flex items-center justify-center`}>
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <span className={`text-[10px] font-extrabold ${palette.badgeText}`}>
                            نکته {toPersianDigits(index + 1)}
                          </span>
                        </div>
                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleConfirmDeleteWeeklyNote(note.id)}
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 active:scale-90 rounded-xl transition-all border border-transparent hover:border-rose-100"
                          title="حذف یادآوری"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Note text container with word wrap fixes */}
                      <div className="flex-1 min-w-0 text-right pr-0.5">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed break-words whitespace-pre-wrap select-text">
                          {note.text}
                        </p>
                      </div>

                      {/* Decorative elements at bottom */}
                      <div className="pt-2 border-t border-slate-100/40 flex items-center justify-end text-[9px] text-slate-400 font-bold">
                        <span>ثبت شده در تخته هفته</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE DETAIL HABIT MODAL */}
      {mobileModalHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">{mobileModalHabit.title}</h3>
              <button onClick={() => setMobileModalHabitId(null)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              برای ثبت انجام عادت روی عدد روز کلیک کنید. برای غیرفعال‌سازی روزهای استثنا آیکون چشم را لمس کنید.
            </p>

            <div className="grid grid-cols-7 gap-1 text-center py-2 bg-slate-50 rounded-2xl border border-slate-100">
              {WEEKDAY_NAMES_FA.map((w, idx) => {
                const daysArray = mobileModalHabit.weekHistory[activeWeekKey] || [false, false, false, false, false, false, false];
                const disabledArray = mobileModalHabit.disabledDays || [false, false, false, false, false, false, false];
                const isDone = daysArray[idx];
                const isDisabled = disabledArray[idx];

                return (
                  <div key={w} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500">{w.substring(0, 3)}</span>
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleToggleDay(mobileModalHabit, idx)}
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold transition-all ${
                        isDisabled
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-40 blur-[1px]'
                          : isDone
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleDisableDay(mobileModalHabit, idx)}
                      className={`p-1 rounded-lg text-[10px] transition-colors ${
                        isDisabled ? 'text-indigo-700 font-bold bg-indigo-100' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title={isDisabled ? 'فعال کردن در استریک' : 'غیرفعال کردن در استریک'}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const targetHabit = mobileModalHabit;
                  setMobileModalHabitId(null);
                  handleConfirmDeleteHabit(targetHabit.id, targetHabit.title);
                }}
                className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors"
              >
                حذف عادت
              </button>
              <button
                type="button"
                onClick={() => setMobileModalHabitId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WEEK SELECTOR JALALI CALENDAR MODAL */}
      <JalaliDatePickerModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        selectedDateISO={formatISODateOnly(activeWeekAnchorDate)}
        onSelectDate={(iso) => {
          setActiveWeekAnchorDate(new Date(iso));
        }}
        title="انتخاب روز و مشاهده هفته مربوطه"
      />

      {/* ADD NEW HABIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-teal-100 w-full max-w-sm overflow-hidden transform transition-all select-none flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-teal-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-300" />
                <h3 className="font-extrabold text-xs sm:text-sm">افزودن عادت جدید</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-indigo-200 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleModalSubmit} className="p-6 space-y-4 bg-slate-50">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">عنوان عادت جدید:</label>
                <input
                  type="text"
                  autoFocus
                  value={modalHabitTitle}
                  onChange={(e) => setModalHabitTitle(e.target.value)}
                  placeholder="مثلاً: ورزش روزانه، مطالعه کتاب..."
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!modalHabitTitle.trim()}
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 disabled:hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>ثبت و افزودن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOAT TOAST NOTIFICATION */}
      {successMessage && (
        <div className="fixed bottom-4 left-4 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-500/30 animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold leading-relaxed">{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white mr-auto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* CONFIRM DELETE HABIT MODAL */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTargetHabit)}
        onClose={() => setDeleteTargetHabit(null)}
        onConfirm={() => {
          if (deleteTargetHabit) {
            onDeleteHabit(deleteTargetHabit.id);
            setDeleteTargetHabit(null);
          }
        }}
        title={`آیا از حذف عادت «${deleteTargetHabit?.title}» اطمینان دارید؟`}
      />

      {/* CONFIRM DELETE WEEKLY NOTE MODAL */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTargetWeeklyNote)}
        onClose={() => setDeleteTargetWeeklyNote(null)}
        onConfirm={() => {
          if (deleteTargetWeeklyNote) {
            onDeleteWeeklyNote(deleteTargetWeeklyNote);
            setDeleteTargetWeeklyNote(null);
          }
        }}
        title="آیا از حذف این یادآوری اطمینان دارید؟"
      />
    </div>
  );
};
