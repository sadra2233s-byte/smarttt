export type TaskStatus = 'pending' | 'completed' | 'overdue' | 'archived';

export interface TaskGoal {
  id: string;
  title: string;
  category: string;
  summary: string;
  detailedDescription: string;
  createdDateISO: string;
  createdTimeStr: string;
  deadlineDate: string; // YYYY-MM-DD
  deadlineTime: string; // HH:mm
  reminderSet: boolean;
  reminders?: string[]; // Multiple reminder times (e.g. ["12:00", "18:00"])
  status: TaskStatus;
  isArchived: boolean;
  archivedAtISO?: string;
}

export interface Habit {
  id: string;
  title: string;
  disabledDays: boolean[]; // 7 elements (0=Saturday, ..., 6=Friday)
  weekHistory: Record<string, boolean[]>; // key: YYYY-Www or week start date ISO, val: 7 booleans
  createdAtISO: string;
}

export interface WeeklyNote {
  id: string;
  weekKey: string; // week start date ISO YYYY-MM-DD
  text: string;
  createdAtISO: string;
}

export interface DailyTask {
  id: string;
  dateStr: string; // YYYY-MM-DD
  title: string;
  timeWindow: string; // e.g., "09:00 - 10:30"
  summary: string;
  detailedDescription: string;
  isCompleted: boolean;
  createdAtISO: string;
  reminderSet?: boolean;
  reminders?: string[]; // Multiple reminder times (e.g. ["10:00", "15:30"])
}

export type FinancialType = 'income' | 'expense';
export type FinancialDateType = 'realtime' | 'custom';

export interface FinancialTransaction {
  id: string;
  title: string;
  type: FinancialType;
  amount: number;
  dateType: FinancialDateType;
  dateISO: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
  dayOfWeekName: string; // e.g., "شنبه"
  summary: string;
  detailedDescription: string;
  createdAtISO: string;
}

export interface LoanInstallment {
  id: string;
  title: string;
  totalAmount: number;
  monthlyAmount: number;
  remainingPayments: number;
  dueDateStr: string; // YYYY-MM-DD
  status: 'paid' | 'pending' | 'overdue';
  createdAtISO: string;
}

export interface AppState {
  tasks: TaskGoal[];
  habits: Habit[];
  weeklyNotes: WeeklyNote[];
  dailyTasks: DailyTask[];
  financials: FinancialTransaction[];
  loans: LoanInstallment[];
  financialFilterStart?: string;
  financialFilterEnd?: string;
  lastSavedISO: string;
  googleDriveConnected?: boolean;
  userEmail?: string;
}
