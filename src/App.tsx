import React, { useState, useEffect } from 'react';
import { AppState, TaskGoal, Habit, WeeklyNote, DailyTask, FinancialTransaction, LoanInstallment } from './types';
import { Header } from './components/header/Header';
import { BottomNavigation, PageTab } from './components/navigation/BottomNavigation';
import { TasksGoalsPage } from './components/pages/TasksGoalsPage';
import { HabitsPage } from './components/pages/HabitsPage';
import { DailySchedulePage } from './components/pages/DailySchedulePage';
import { FinancialPage } from './components/pages/FinancialPage';
import { JsonBackupModal } from './components/common/JsonBackupModal';
import { WordExportModal } from './components/common/WordExportModal';
import { GoogleDriveModal } from './components/common/GoogleDriveModal';
import { InstallModal } from './components/common/InstallModal';
import { formatISODateOnly, getJalaliWeekdayName, getStartOfWeekJalali } from './utils/jalali';
import { saveToIndexedDB, loadFromIndexedDB } from './utils/indexedDB';

const LOCAL_STORAGE_KEY = 'smart_planner_app_state_v2';
const MANUAL_BACKUP_KEY = 'smart_planner_manual_backup_v2';

const INITIAL_SAMPLE_STATE: AppState = {
  tasks: [
    {
      id: 'task-1',
      title: 'خلاصه‌نویسی فصل سوم مدیریت و برنامه‌ریزی',
      category: 'دانشگاه',
      summary: 'مطالعه و نت‌برداری از مباحث تحلیلی',
      detailedDescription: 'بررسی مدلهای مدیریت زمان، روشهای افزایش تمرکز و ارزیابی عملکرد هفتگی به همراه حل تمرینات پایان فصل.',
      createdDateISO: '2026-07-25',
      createdTimeStr: '09:30',
      deadlineDate: '2026-07-28',
      deadlineTime: '18:00',
      reminderSet: true,
      status: 'pending',
      isArchived: false,
    },
    {
      id: 'task-2',
      title: 'طراحی رابط کاربری سیستم هوشمند مالی',
      category: 'پروژه',
      summary: 'تحویل پروتوتایپ اولیه صفحه بودجه',
      detailedDescription: 'تکمیل کامپوننت‌های جدول تراکنشها، نمودار درآمدها و هزینه‌ها و تطبیق فونت وزیری‌متن برای حالت موبایل.',
      createdDateISO: '2026-07-24',
      createdTimeStr: '14:15',
      deadlineDate: '2026-07-30',
      deadlineTime: '20:00',
      reminderSet: false,
      status: 'pending',
      isArchived: false,
    },
    {
      id: 'task-3',
      title: 'بررسی گزارش دوره‌ای بانک و تسویه فاکتورها',
      category: 'مالی',
      summary: 'پرداخت اقساط ماهانه',
      detailedDescription: 'واریز قسط تسهیلات خودرو و بررسی صورت‌حساب کارت اعتباری.',
      createdDateISO: '2026-07-20',
      createdTimeStr: '11:00',
      deadlineDate: '2026-07-22',
      deadlineTime: '12:00',
      reminderSet: true,
      status: 'completed',
      isArchived: true,
    },
  ],
  habits: [
    {
      id: 'habit-1',
      title: '۳۰ دقیقه مطالعه کتاب روانشناسی یا تخصصی',
      disabledDays: [false, false, false, false, false, false, false],
      weekHistory: {
        [formatISODateOnly(getStartOfWeekJalali(new Date()))]: [true, true, true, false, true, false, false],
      },
      createdAtISO: formatISODateOnly(getStartOfWeekJalali(new Date())),
    },
  ],
  weeklyNotes: [
    {
      id: 'note-1',
      weekKey: formatISODateOnly(getStartOfWeekJalali(new Date())),
      text: 'تمرکز ویژه بر تکمیل پروژه تا چهارشنبه و مرور دروس آزمون.',
      createdAtISO: '2026-07-25',
    },
  ],
  dailyTasks: [
    {
      id: 'daily-1',
      dateStr: formatISODateOnly(new Date()),
      title: 'بررسی ایمیل‌ها و هماهنگی جلسه کاری',
      timeWindow: '09:00 - 10:00',
      summary: 'پاسخ به تیکت‌های پشتیبانی',
      detailedDescription: 'بررسی ایمیلهای جدید مشتریان، اولویت‌بندی درخواست‌ها و ثبت بازخورد.',
      isCompleted: true,
      createdAtISO: '2026-07-25',
    },
    {
      id: 'daily-2',
      dateStr: formatISODateOnly(new Date()),
      title: 'مرور کدهای وب‌اپلیکیشن Smart Planner',
      timeWindow: '11:00 - 13:00',
      summary: 'تست ریسپانسو و همگام‌سازی گوگل درایو',
      detailedDescription: 'تست قابلیت ذخیره آفلاین محلی، عملکرد تقویم شمسی و خروجی PDF.',
      isCompleted: false,
      createdAtISO: '2026-07-25',
    },
  ],
  financials: [
    {
      id: 'fin-1',
      title: 'دریافت پروژه برنامه‌نویسی و طراحی',
      type: 'income',
      amount: 15000000,
      dateType: 'realtime',
      dateISO: formatISODateOnly(new Date()),
      timeStr: '10:30',
      dayOfWeekName: getJalaliWeekdayName(new Date()),
      summary: 'پیش‌پرداخت پروژه وب',
      detailedDescription: 'واریزی بابت فاز اول طراحی وب‌اپلیکیشن از طریق پایا.',
      createdAtISO: '2026-07-25',
    },
    {
      id: 'fin-2',
      title: 'خریدهای سوپرمارکت و مایحتاج روزانه',
      type: 'expense',
      amount: 850000,
      dateType: 'realtime',
      dateISO: formatISODateOnly(new Date()),
      timeStr: '18:15',
      dayOfWeekName: getJalaliWeekdayName(new Date()),
      summary: 'خرید مواد غذایی',
      detailedDescription: 'خرید میوه، نان و مواد خوراکی هفته.',
      createdAtISO: '2026-07-25',
    },
  ],
  loans: [
    {
      id: 'loan-1',
      title: 'تسهیلات خرید تجهیزات کاری',
      totalAmount: 40000000,
      monthlyAmount: 3200000,
      remainingPayments: 8,
      dueDateStr: '2026-08-05',
      status: 'pending',
      createdAtISO: '2026-07-01',
    },
  ],
  lastSavedISO: new Date().toISOString(),
};

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppState;
        if (parsed && Array.isArray(parsed.tasks)) {
          // One-time reset to satisfy user's request to clear all weeks and keep only 1 habit in current week
          const hasReset = localStorage.getItem('habits_reset_v3');
          if (!hasReset) {
            const currentWeekKey = formatISODateOnly(getStartOfWeekJalali(new Date()));
            parsed.habits = [
              {
                id: 'habit-1',
                title: '۳۰ دقیقه مطالعه کتاب روانشناسی یا تخصصی',
                disabledDays: [false, false, false, false, false, false, false],
                weekHistory: {
                  [currentWeekKey]: [true, true, true, false, true, false, false],
                },
                createdAtISO: currentWeekKey,
              },
            ];
            try {
              localStorage.setItem('habits_reset_v3', 'true');
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
            } catch (err) {
              console.error('Failed to set localStorage reset flag:', err);
            }
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('LocalStorage read error:', e);
    }
    // Also mark reset flag for new storage
    try {
      localStorage.setItem('habits_reset_v3', 'true');
    } catch (e) {}
    return INITIAL_SAMPLE_STATE;
  });

  const [activeTab, setActiveTab] = useState<PageTab>('tasks');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Modals
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showWordModal, setShowWordModal] = useState(false);
  const [showGoogleDriveModal, setShowGoogleDriveModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Online status & PWA install prompt listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      } catch (err) {
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  // Auto-save to LocalStorage and IndexedDB whenever appState changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appState));
      saveToIndexedDB('app_state', appState);
    } catch (e) {
      console.error('Failed to save state to localStorage/IndexedDB:', e);
    }
  }, [appState]);

  const handleSaveLocal = async () => {
    const updated = { ...appState, lastSavedISO: new Date().toISOString() };
    setAppState(updated);
    try {
      const serialized = JSON.stringify(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
      localStorage.setItem(MANUAL_BACKUP_KEY, serialized);
      await saveToIndexedDB('manual_backup', updated);
      await saveToIndexedDB('app_state', updated);
    } catch (err) {
      console.error('Failed to save manual local backup:', err);
    }
  };

  const handleLoadLocal = async (): Promise<boolean> => {
    try {
      // 1. Try manual backup from localStorage first
      let saved = localStorage.getItem(MANUAL_BACKUP_KEY);
      let parsed: AppState | null = null;
      if (saved) {
        try {
          parsed = JSON.parse(saved);
        } catch (e) {}
      }

      // 2. Try manual backup from IndexedDB if not found in localStorage
      if (!parsed || !Array.isArray(parsed.tasks)) {
        parsed = await loadFromIndexedDB('manual_backup');
      }

      // 3. Fallback to regular auto-save key from localStorage
      if (!parsed || !Array.isArray(parsed.tasks)) {
        saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try {
            parsed = JSON.parse(saved);
          } catch (e) {}
        }
      }

      // 4. Fallback to regular auto-save from IndexedDB
      if (!parsed || !Array.isArray(parsed.tasks)) {
        parsed = await loadFromIndexedDB('app_state');
      }

      if (parsed && Array.isArray(parsed.tasks)) {
        setAppState(parsed);
        const serialized = JSON.stringify(parsed);
        localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
        await saveToIndexedDB('app_state', parsed);
        return true;
      }
    } catch (e) {
      console.error('Failed to reload local state:', e);
    }
    return false;
  };

  // State Handler Functions
  const handleAddTask = (taskData: Omit<TaskGoal, 'id' | 'createdDateISO' | 'createdTimeStr'>) => {
    const newTask: TaskGoal = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdDateISO: formatISODateOnly(new Date()),
      createdTimeStr: new Date().toTimeString().slice(0, 5),
    };
    setAppState((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
  };

  const handleUpdateTask = (updatedTask: TaskGoal) => {
    setAppState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    }));
  };

  const handleDeleteTask = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  };

  // Habits
  const handleAddHabit = (title: string, createdAtISO?: string, disabledDays?: boolean[]) => {
    const targetDate = createdAtISO || formatISODateOnly(new Date());
    const newHabit: Habit = {
      id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      disabledDays: disabledDays ? [...disabledDays] : [false, false, false, false, false, false, false],
      weekHistory: {},
      createdAtISO: targetDate,
    };
    setAppState((prev) => ({
      ...prev,
      habits: [...prev.habits, newHabit],
    }));
  };

  const handleUpdateHabit = (updatedHabit: Habit) => {
    setAppState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === updatedHabit.id ? updatedHabit : h)),
    }));
  };

  const handleDeleteHabit = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== id),
    }));
  };

  const handleAddWeeklyNote = (weekKey: string, text: string) => {
    const newNote: WeeklyNote = {
      id: `note-${Date.now()}`,
      weekKey,
      text,
      createdAtISO: formatISODateOnly(new Date()),
    };
    setAppState((prev) => ({
      ...prev,
      weeklyNotes: [...prev.weeklyNotes, newNote],
    }));
  };

  const handleDeleteWeeklyNote = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      weeklyNotes: prev.weeklyNotes.filter((n) => n.id !== id),
    }));
  };

  // Daily Tasks
  const handleAddDailyTask = (dailyData: Omit<DailyTask, 'id' | 'createdAtISO'>) => {
    const newDaily: DailyTask = {
      ...dailyData,
      id: `daily-${Date.now()}`,
      createdAtISO: formatISODateOnly(new Date()),
    };
    setAppState((prev) => ({
      ...prev,
      dailyTasks: [newDaily, ...prev.dailyTasks],
    }));
  };

  const handleUpdateDailyTask = (updatedDaily: DailyTask) => {
    setAppState((prev) => ({
      ...prev,
      dailyTasks: prev.dailyTasks.map((dt) => (dt.id === updatedDaily.id ? updatedDaily : dt)),
    }));
  };

  const handleDeleteDailyTask = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      dailyTasks: prev.dailyTasks.filter((dt) => dt.id !== id),
    }));
  };

  // Financials
  const handleAddTransaction = (txData: Omit<FinancialTransaction, 'id' | 'createdAtISO' | 'dayOfWeekName'>) => {
    const newTx: FinancialTransaction = {
      ...txData,
      id: `fin-${Date.now()}`,
      dayOfWeekName: getJalaliWeekdayName(txData.dateISO),
      createdAtISO: formatISODateOnly(new Date()),
    };
    setAppState((prev) => ({
      ...prev,
      financials: [newTx, ...prev.financials],
    }));
  };

  const handleUpdateTransaction = (updatedTx: FinancialTransaction) => {
    setAppState((prev) => ({
      ...prev,
      financials: prev.financials.map((f) => (f.id === updatedTx.id ? updatedTx : f)),
    }));
  };

  const handleDeleteTransaction = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      financials: prev.financials.filter((f) => f.id !== id),
    }));
  };

  // Loans
  const handleAddLoan = (loanData: Omit<LoanInstallment, 'id' | 'createdAtISO'>) => {
    const newLoan: LoanInstallment = {
      ...loanData,
      id: `loan-${Date.now()}`,
      createdAtISO: formatISODateOnly(new Date()),
    };
    setAppState((prev) => ({
      ...prev,
      loans: [...prev.loans, newLoan],
    }));
  };

  const handleUpdateLoan = (updatedLoan: LoanInstallment) => {
    setAppState((prev) => ({
      ...prev,
      loans: prev.loans.map((l) => (l.id === updatedLoan.id ? updatedLoan : l)),
    }));
  };

  const handleDeleteLoan = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      loans: prev.loans.filter((l) => l.id !== id),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Vazirmatn',sans-serif] selection:bg-teal-500 selection:text-white">
      {/* Top Header Navigation */}
      <Header
        appState={appState}
        onSaveLocal={handleSaveLocal}
        onLoadLocal={handleLoadLocal}
        onUpdateState={(newState) => setAppState(newState)}
        onOpenJsonModal={() => setShowJsonModal(true)}
        onOpenWordModal={() => setShowWordModal(true)}
        onOpenGoogleDriveModal={() => setShowGoogleDriveModal(true)}
        isOnline={isOnline}
        onInstall={handleInstallApp}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:pb-32">
        {activeTab === 'tasks' && (
          <TasksGoalsPage
            tasks={appState.tasks}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {activeTab === 'habits' && (
          <HabitsPage
            habits={appState.habits}
            weeklyNotes={appState.weeklyNotes}
            onAddHabit={handleAddHabit}
            onUpdateHabit={handleUpdateHabit}
            onDeleteHabit={handleDeleteHabit}
            onAddWeeklyNote={handleAddWeeklyNote}
            onDeleteWeeklyNote={handleDeleteWeeklyNote}
          />
        )}

        {activeTab === 'daily' && (
          <DailySchedulePage
            dailyTasks={appState.dailyTasks}
            onAddDailyTask={handleAddDailyTask}
            onUpdateDailyTask={handleUpdateDailyTask}
            onDeleteDailyTask={handleDeleteDailyTask}
          />
        )}

        {activeTab === 'financial' && (
          <FinancialPage
            financials={appState.financials}
            loans={appState.loans}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onAddLoan={handleAddLoan}
            onUpdateLoan={handleUpdateLoan}
            onDeleteLoan={handleDeleteLoan}
          />
        )}
      </main>

      {/* Persistent Bottom Tab Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        taskCount={appState.tasks.filter((t) => !t.isArchived).length}
        habitCount={appState.habits.length}
        dailyCount={appState.dailyTasks.filter((d) => d.dateStr === formatISODateOnly(new Date())).length}
      />

      {/* JSON Backup & Restore Modal */}
      <JsonBackupModal
        isOpen={showJsonModal}
        onClose={() => setShowJsonModal(false)}
        appState={appState}
        onRestoreState={(newState) => setAppState(newState)}
      />

      {/* Word DOCX Generator Modal */}
      <WordExportModal
        isOpen={showWordModal}
        onClose={() => setShowWordModal(false)}
        appState={appState}
      />

      {/* Google Drive Pure REST Modal */}
      <GoogleDriveModal
        isOpen={showGoogleDriveModal}
        onClose={() => setShowGoogleDriveModal(false)}
        appState={appState}
        onRestoreState={(newState) => setAppState(newState)}
      />

      {/* PWA Install Guide Modal */}
      <InstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredPrompt}
      />
    </div>
  );
}
