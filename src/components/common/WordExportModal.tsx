import React, { useState } from 'react';
import { FileText, Download, Calendar, Check, X, Loader2 } from 'lucide-react';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
  ShadingType,
  BorderStyle,
} from 'docx';
import { AppState, Habit } from '../../types';
import { formatJalaliFull, formatJalaliShort, toPersianDigits, getStartOfWeekJalali, getWeekDaysJalali, formatISODateOnly } from '../../utils/jalali';
import { JalaliDatePickerModal } from './JalaliDatePickerModal';

interface WordExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
}

export const WordExportModal: React.FC<WordExportModalProps> = ({
  isOpen,
  onClose,
  appState,
}) => {
  const getOneMonthAgoISO = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  };

  const getOneMonthLaterISO = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  };

  const [tasksStartDate, setTasksStartDate] = useState(getOneMonthAgoISO);
  const [tasksEndDate, setTasksEndDate] = useState(getOneMonthLaterISO);

  const [habitsStartDate, setHabitsStartDate] = useState(getOneMonthAgoISO);
  const [habitsEndDate, setHabitsEndDate] = useState(getOneMonthLaterISO);

  const [dailyStartDate, setDailyStartDate] = useState(getOneMonthAgoISO);
  const [dailyEndDate, setDailyEndDate] = useState(getOneMonthLaterISO);

  const [financesStartDate, setFinancesStartDate] = useState(getOneMonthAgoISO);
  const [financesEndDate, setFinancesEndDate] = useState(getOneMonthLaterISO);

  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeHabits, setIncludeHabits] = useState(true);
  const [includeDaily, setIncludeDaily] = useState(true);
  const [includeFinances, setIncludeFinances] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);

  // Active Date Picker State
  const [activePickerField, setActivePickerField] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePickerSelect = (isoDate: string) => {
    if (activePickerField === 'tasksStart') setTasksStartDate(isoDate);
    if (activePickerField === 'tasksEnd') setTasksEndDate(isoDate);
    if (activePickerField === 'habitsStart') setHabitsStartDate(isoDate);
    if (activePickerField === 'habitsEnd') setHabitsEndDate(isoDate);
    if (activePickerField === 'dailyStart') setDailyStartDate(isoDate);
    if (activePickerField === 'dailyEnd') setDailyEndDate(isoDate);
    if (activePickerField === 'financesStart') setFinancesStartDate(isoDate);
    if (activePickerField === 'financesEnd') setFinancesEndDate(isoDate);
  };

  const generateWordDoc = async () => {
    setIsGenerating(true);
    try {
      const docChildren: any[] = [];

      // Helper to check if a habit is completed on a specific date
      const isHabitCompletedOnDate = (habit: Habit, date: Date): boolean => {
        const matchingHabits = appState.habits.filter((h) => h.title.trim() === habit.title.trim());
        const sow = getStartOfWeekJalali(date);
        const sowKey = formatISODateOnly(sow);
        const weekDays = getWeekDaysJalali(sow);
        const dayIdx = weekDays.findIndex((wd) => formatISODateOnly(wd) === formatISODateOnly(date));

        if (dayIdx === -1) return false;

        let weekData: boolean[] | undefined = undefined;
        for (const h of matchingHabits) {
          if (h.weekHistory && h.weekHistory[sowKey] !== undefined) {
            weekData = h.weekHistory[sowKey];
            break;
          }
        }

        if (!weekData && habit.weekHistory) {
          weekData = habit.weekHistory[sowKey];
        }

        return weekData ? !!weekData[dayIdx] : false;
      };

      // Helper to compute a habit's streak
      const getHabitStreak = (habit: Habit): number => {
        const matchingHabits = appState.habits.filter((h) => h.title.trim() === habit.title.trim());
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

        const today = new Date();
        today.setHours(12, 0, 0, 0);

        let latestDoneDate: Date | null = null;
        for (let offset = -14; offset <= 365; offset++) {
          const checkD = new Date(today.getTime() - offset * 86400000);
          const st = getStatusForDate(checkD);
          if (st.isDone) {
            latestDoneDate = checkD;
            break;
          }
        }

        if (!latestDoneDate) {
          return 0;
        }

        if (latestDoneDate < today) {
          let gapValid = true;
          let checkGap = new Date(today.getTime() - 86400000);
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
            return 0;
          }
        }

        let streak = 0;
        let curr = new Date(latestDoneDate.getTime());
        for (let step = 0; step < 365; step++) {
          const st = getStatusForDate(curr);
          if (st.isAbsent) break;
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

        return streak;
      };

      // Helper to compute completed habit days in a specific range
      const getHabitCompletedCountInRange = (habit: Habit, startStr: string, endStr: string): number => {
        try {
          const startD = new Date(startStr);
          const endD = new Date(endStr);
          let count = 0;
          let curr = new Date(startD.getTime());
          let safety = 0;
          while (curr <= endD && safety < 1000) {
            if (isHabitCompletedOnDate(habit, curr)) {
              count++;
            }
            curr.setDate(curr.getDate() + 1);
            safety++;
          }
          return count;
        } catch (err) {
          console.error("Error computing completed count in range:", err);
          return 0;
        }
      };

      // Helper to make a styled Table Cell with RTL and padding
      const createCell = (text: string, options: {
        bold?: boolean;
        color?: string;
        size?: number;
        bg?: string;
        align?: any;
        width?: number; // percentage
        columnSpan?: number;
      } = {}) => {
        const cellBg = options.bg;
        let finalTextColor = options.color;

        // If no explicit text color is specified, but a background color is provided,
        // choose white for dark backgrounds and charcoal for light backgrounds.
        if (!finalTextColor && cellBg) {
          const isDarkBg = cellBg !== 'FFFFFF' && cellBg !== 'F8FAFC' && cellBg !== 'F1F5F9' && cellBg !== '82C4B3' && cellBg !== 'CCFBF1' && cellBg !== 'E6F4F1';
          finalTextColor = isDarkBg ? 'FFFFFF' : '1E293B';
        }

        const textRunOptions: any = {
          text: text || '-',
          bold: options.bold,
          size: (options.size || 10) * 2, // half-points
          font: 'Segoe UI',
          rightToLeft: true,
        };

        if (finalTextColor) {
          textRunOptions.color = finalTextColor;
        }

        return new TableCell({
          shading: cellBg ? { fill: cellBg, type: ShadingType.SOLID } : undefined,
          width: options.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
          columnSpan: options.columnSpan,
          margins: {
            top: 140, // premium padding
            bottom: 140,
            left: 160,
            right: 160,
          },
          children: [
            new Paragraph({
              bidirectional: true,
              alignment: options.align || AlignmentType.RIGHT,
              spacing: { before: 30, after: 30 },
              children: [
                new TextRun(textRunOptions)
              ]
            })
          ]
        });
      };

      // Table Borders style - thin premium slate border for light theme
      const tableBorders = {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      };

      // Filter state data first
      const filteredTasks = appState.tasks.filter((t) => {
        const d = t.createdDateISO || '2026-01-01';
        return d >= tasksStartDate && d <= tasksEndDate;
      });

      const filteredHabitsForExport = appState.habits.filter((h) => {
        const d = h.createdAtISO || '2026-01-01';
        return d >= habitsStartDate && d <= habitsEndDate;
      });

      const filteredDaily = appState.dailyTasks.filter((dt) => {
        return dt.dateStr >= dailyStartDate && dt.dateStr <= dailyEndDate;
      });

      const filteredFin = appState.financials.filter((f) => {
        return f.dateISO >= financesStartDate && f.dateISO <= financesEndDate;
      });

      // Stats Calculations
      const completedTasksCount = filteredTasks.filter(t => t.status === 'completed').length;
      const taskCompletionRate = filteredTasks.length ? Math.round((completedTasksCount / filteredTasks.length) * 100) : 0;
      const totalHabits = filteredHabitsForExport.length;
      const totalDaily = filteredDaily.length;
      const completedDaily = filteredDaily.filter(d => d.isCompleted).length;
      const totalIncome = filteredFin.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
      const totalExpense = filteredFin.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
      const netSavings = totalIncome - totalExpense;

      // 1. Simple, elegant report title paragraph (without a heavy cover block background)
      docChildren.push(
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          spacing: { before: 120, after: 120 },
          children: [
            new TextRun({
              text: 'گزارش عملکرد پلنر هوشمند (Smart Planner)',
              bold: true,
              color: '0F766E',
              size: 16 * 2,
              font: 'Segoe UI',
              rightToLeft: true,
            })
          ]
        }),
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: `تاریخ گزارش‌گیری: ${formatJalaliShort(new Date())}`,
              color: '64748B',
              size: 9.5 * 2,
              font: 'Segoe UI',
              rightToLeft: true,
            })
          ]
        })
      );

      // 2. Dashboard Summary Box (Dynamically containing only the selected columns)
      const summaryHeaderCells: TableCell[] = [];
      const summaryContentCells: TableCell[] = [];

      if (includeTasks) {
        summaryHeaderCells.push(
          createCell('۱. ردیاب وظایف و اهداف اصلی', { bold: true, bg: '0F766E', color: 'FFFFFF', align: AlignmentType.CENTER })
        );
        summaryContentCells.push(
          new TableCell({
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            children: [
              new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.RIGHT,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({ text: `• تعداد کل وظایف: ${toPersianDigits(filteredTasks.length)}`, size: 9.5 * 2, font: 'Segoe UI', rightToLeft: true }),
                ]
              }),
              new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.RIGHT,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({ text: `• انجام شده: ${toPersianDigits(completedTasksCount)}`, size: 9.5 * 2, font: 'Segoe UI', rightToLeft: true }),
                ]
              }),
              new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.RIGHT,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({ text: `• درصد موفقیت: ${toPersianDigits(taskCompletionRate)}٪`, bold: true, size: 10 * 2, color: '16A34A', font: 'Segoe UI', rightToLeft: true }),
                ]
              })
            ]
          })
        );
      }

      if (includeHabits || includeDaily) {
        let colTitle = '۲. بخش عادات و کارهای روزانه';
        if (includeHabits && !includeDaily) {
          colTitle = '۲. بخش پایش عادات روزانه';
        } else if (!includeHabits && includeDaily) {
          colTitle = '۲. بخش کارهای روزانه و برنامه‌ها';
        }

        summaryHeaderCells.push(
          createCell(colTitle, { bold: true, bg: '0F766E', color: 'FFFFFF', align: AlignmentType.CENTER })
        );

        const habitDailyStats: Paragraph[] = [];
        if (includeHabits) {
          habitDailyStats.push(
            new Paragraph({
              bidirectional: true,
              alignment: AlignmentType.RIGHT,
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({ text: `• عادات ثبت شده: ${toPersianDigits(totalHabits)} مورد`, size: 9.5 * 2, font: 'Segoe UI', rightToLeft: true }),
              ]
            })
          );
        }
        if (includeDaily) {
          habitDailyStats.push(
            new Paragraph({
              bidirectional: true,
              alignment: AlignmentType.RIGHT,
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({ text: `• کل زمان‌بند روزانه: ${toPersianDigits(totalDaily)} فعالیت`, size: 9.5 * 2, font: 'Segoe UI', rightToLeft: true }),
              ]
            }),
            new Paragraph({
              bidirectional: true,
              alignment: AlignmentType.RIGHT,
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({ text: `• تکمیل کارهای روزانه: ${toPersianDigits(completedDaily)} مورد`, size: 9.5 * 2, font: 'Segoe UI', rightToLeft: true }),
              ]
            })
          );
        }

        summaryContentCells.push(
          new TableCell({
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            children: habitDailyStats
          })
        );
      }

      if (includeFinances) {
        summaryHeaderCells.push(
          createCell('۳. وضعیت مالی و بودجه‌ریزی', { bold: true, bg: '0F766E', color: 'FFFFFF', align: AlignmentType.CENTER })
        );
        summaryContentCells.push(
          new TableCell({
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            children: [
              new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.RIGHT,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({ text: `• کل درآمد: ${toPersianDigits(totalIncome.toLocaleString())} تومان`, size: 9.5 * 2, color: '16A34A', font: 'Segoe UI', rightToLeft: true }),
                ]
              }),
              new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.RIGHT,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({ text: `• کل هزینه‌ها: ${toPersianDigits(totalExpense.toLocaleString())} تومان`, size: 9.5 * 2, color: 'DC2626', font: 'Segoe UI', rightToLeft: true }),
                ]
              }),
              new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.RIGHT,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({ text: `• تراز مالی: ${toPersianDigits(netSavings.toLocaleString())} تومان`, bold: true, size: 10 * 2, color: netSavings >= 0 ? '16A34A' : 'DC2626', font: 'Segoe UI', rightToLeft: true }),
                ]
              })
            ]
          })
        );
      }

      if (summaryHeaderCells.length > 0) {
        docChildren.push(
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: '📊 خلاصه وضعیت عملکرد بخش‌های انتخابی در گزارش:',
                bold: true,
                color: '0F766E',
                size: 11.5 * 2,
                font: 'Segoe UI',
                rightToLeft: true,
              })
            ]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: [
              new TableRow({ children: summaryHeaderCells }),
              new TableRow({ children: summaryContentCells }),
            ]
          }),
          new Paragraph({ spacing: { before: 300, after: 100 } })
        );
      }

      // --- Section 1: Tasks ---
      if (includeTasks) {
        docChildren.push(
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 240, after: 60 },
            border: {
              bottom: {
                color: '0F766E',
                space: 6,
                style: BorderStyle.SINGLE,
                size: 10,
              }
            },
            children: [
              new TextRun({
                text: '۱. جدول ردیاب وظایف و اهداف استراتژیک',
                bold: true,
                color: '0F766E',
                size: 13.5 * 2,
                font: 'Segoe UI',
                rightToLeft: true,
              })
            ]
          }),
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 40, after: 120 },
            children: [
              new TextRun({
                text: `بازه زمانی این بخش: از ${formatJalaliShort(tasksStartDate)} تا ${formatJalaliShort(tasksEndDate)}`,
                color: '475569',
                size: 9.5 * 2,
                font: 'Segoe UI',
                rightToLeft: true,
              })
            ]
          })
        );

        const taskHeaders = ['عنوان تسک', 'دسته‌بندی', 'توضیحات خلاصه', 'مهلت انجام', 'وضعیت'];
        const taskWidths = [30, 15, 25, 18, 12];
        const taskHeaderRow = new TableRow({
          tableHeader: true,
          children: taskHeaders.map((col, idx) => 
            createCell(col, { bold: true, bg: '0F766E', color: 'FFFFFF', size: 10, align: AlignmentType.CENTER, width: taskWidths[idx] })
          )
        });

        const taskDataRows = filteredTasks.map((t) => {
          const deadlineText = `${t.deadlineDate ? formatJalaliShort(t.deadlineDate) : '-'} ${t.deadlineTime || ''}`;
          const statusText = t.status === 'completed' ? 'انجام شده' : t.status === 'pending' ? 'در حال انجام' : 'معوقه';
          const statusColor = t.status === 'completed' ? '16A34A' : t.status === 'pending' ? 'D97706' : 'DC2626';

          return new TableRow({
            children: [
              createCell(t.title || '-', { bold: true, width: taskWidths[0] }),
              createCell(t.category || '-', { align: AlignmentType.CENTER, width: taskWidths[1] }),
              createCell(t.summary || t.detailedDescription || '-', { width: taskWidths[2] }),
              createCell(deadlineText, { align: AlignmentType.CENTER, width: taskWidths[3] }),
              createCell(statusText, { bold: true, color: statusColor, align: AlignmentType.CENTER, width: taskWidths[4] }),
            ]
          });
        });

        if (filteredTasks.length === 0) {
          taskDataRows.push(new TableRow({
            children: [
              createCell('در این بازه زمانی هیچ وظیفه یا هدفی ثبت نشده است.', { align: AlignmentType.CENTER, size: 10, color: '94A3B8' })
            ].map(c => {
              (c as any).columnSpan = 5;
              return c;
            })
          }));
        }

        docChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: [taskHeaderRow, ...taskDataRows],
          }),
          new Paragraph({ spacing: { before: 200, after: 100 } })
        );
      }

      // --- Section 2: Habits ---
      if (includeHabits) {
        docChildren.push(
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 240, after: 60 },
            border: {
              bottom: {
                color: '0F766E',
                space: 6,
                style: BorderStyle.SINGLE,
                size: 10,
              }
            },
            children: [
              new TextRun({
                text: '۲. جدول پایش عادات روزانه (Streak)',
                bold: true,
                color: '0F766E',
                size: 13.5 * 2,
                font: 'Segoe UI',
                rightToLeft: true,
              })
            ]
          }),
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 40, after: 120 },
            children: [
              new TextRun({
                text: `بازه زمانی این بخش: از ${formatJalaliShort(habitsStartDate)} تا ${formatJalaliShort(habitsEndDate)}`,
                color: '475569',
                size: 9.5 * 2,
                font: 'Segoe UI',
                rightToLeft: true,
              })
            ]
          })
        );

        const habitHeaders = ['عنوان عادت', 'تعداد روزهای متوالی (استریک)', 'وضعیت انجام هفتگی'];
        const habitWidths = [45, 30, 25];
        const habitHeaderRow = new TableRow({
          tableHeader: true,
          children: habitHeaders.map((col, idx) => 
            createCell(col, { bold: true, bg: '0F766E', color: 'FFFFFF', size: 10, align: AlignmentType.CENTER, width: habitWidths[idx] })
          )
        });

        const habitDataRows = filteredHabitsForExport.map((h) => {
          const streakCount = getHabitStreak(h);
          const streakText = `🔥 ${toPersianDigits(streakCount)} روز`;
          const completedCount = getHabitCompletedCountInRange(h, habitsStartDate, habitsEndDate);
          const weeklyStatusText = `ثبت شده: ${toPersianDigits(completedCount)} روز`;

          return new TableRow({
            children: [
              createCell(h.title || '-', { bold: true, width: habitWidths[0] }),
              createCell(streakText, { bold: true, color: streakCount > 0 ? 'D97706' : '334155', align: AlignmentType.CENTER, width: habitWidths[1] }),
              createCell(weeklyStatusText, { align: AlignmentType.CENTER, width: habitWidths[2] }),
            ]
          });
        });

        if (filteredHabitsForExport.length === 0) {
          habitDataRows.push(new TableRow({
            children: [
              createCell('در این بازه زمانی هیچ عادتی ثبت نشده است.', { align: AlignmentType.CENTER, size: 10, color: '94A3B8' })
            ].map(c => {
              (c as any).columnSpan = 3;
              return c;
            })
          }));
        }

        docChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: [habitHeaderRow, ...habitDataRows],
          }),
          new Paragraph({ spacing: { before: 200, after: 100 } })
        );
      }

      // --- Section 3: Daily schedule ---
      if (includeDaily) {
        docChildren.push(
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 240, after: 60 },
            border: {
              bottom: {
                color: '0F766E',
                space: 6,
                style: BorderStyle.SINGLE,
                size: 10,
              }
            },
            children: [
              new TextRun({
                text: '۳. جدول کارهای روزانه و زمان‌بندی',
                bold: true,
                color: '0F766E',
                size: 13.5 * 2,
                font: 'Segoe UI',
                rightToLeft: true,
              })
            ]
          }),
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 40, after: 120 },
            children: [
              new TextRun({
                text: `بازه زمانی این بخش: از ${formatJalaliShort(dailyStartDate)} تا ${formatJalaliShort(dailyEndDate)}`,
                color: '475569',
                size: 9.5 * 2,
                font: 'Segoe UI',
                rightToLeft: true,
              })
            ]
          })
        );

        const dailyHeaders = ['تاریخ', 'عنوان کار', 'بازه زمانی', 'توضیحات', 'وضعیت انجام'];
        const dailyWidths = [15, 25, 18, 30, 12];
        const dailyHeaderRow = new TableRow({
          tableHeader: true,
          children: dailyHeaders.map((col, idx) => 
            createCell(col, { bold: true, bg: '0F766E', color: 'FFFFFF', size: 10, align: AlignmentType.CENTER, width: dailyWidths[idx] })
          )
        });

        const dailyDataRows = filteredDaily.map((dt) => {
          const statusText = dt.isCompleted ? 'تکمیل شده' : 'در حال انجام';
          const statusColor = dt.isCompleted ? '16A34A' : 'D97706';

          return new TableRow({
            children: [
              createCell(dt.dateStr ? formatJalaliShort(dt.dateStr) : '-', { align: AlignmentType.CENTER, width: dailyWidths[0] }),
              createCell(dt.title || '-', { bold: true, width: dailyWidths[1] }),
              createCell(dt.timeWindow || '-', { align: AlignmentType.CENTER, width: dailyWidths[2] }),
              createCell(dt.summary || dt.detailedDescription || '-', { width: dailyWidths[3] }),
              createCell(statusText, { bold: true, color: statusColor, align: AlignmentType.CENTER, width: dailyWidths[4] }),
            ]
          });
        });

        if (filteredDaily.length === 0) {
          dailyDataRows.push(new TableRow({
            children: [
              createCell('در این بازه زمانی هیچ برنامه روزانه‌ای ثبت نشده است.', { align: AlignmentType.CENTER, size: 10, color: '94A3B8' })
            ].map(c => {
              (c as any).columnSpan = 5;
              return c;
            })
          }));
        }

        docChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: [dailyHeaderRow, ...dailyDataRows],
          }),
          new Paragraph({ spacing: { before: 200, after: 100 } })
        );
      }

      // --- Section 4: Financials ---
      if (includeFinances) {
        docChildren.push(
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 240, after: 60 },
            border: {
              bottom: {
                color: '0F766E',
                space: 6,
                style: BorderStyle.SINGLE,
                size: 10,
              }
            },
            children: [
              new TextRun({
                text: '۴. جدول مدیریت مالی، درآمدها و هزینه‌ها',
                bold: true,
                color: '0F766E',
                size: 13.5 * 2,
                font: 'Segoe UI',
                rightToLeft: true,
              })
            ]
          }),
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 40, after: 120 },
            children: [
              new TextRun({
                text: `بازه زمانی این بخش: از ${formatJalaliShort(financesStartDate)} تا ${formatJalaliShort(financesEndDate)}`,
                color: '475569',
                size: 9.5 * 2,
                font: 'Segoe UI',
                rightToLeft: true,
              })
            ]
          })
        );

        const finHeaders = ['عنوان تراکنش', 'نوع', 'مبلغ (تومان)', 'تاریخ ثبت', 'روز هفته'];
        const finWidths = [30, 15, 20, 20, 15];
        const finHeaderRow = new TableRow({
          tableHeader: true,
          children: finHeaders.map((col, idx) => 
            createCell(col, { bold: true, bg: '0F766E', color: 'FFFFFF', size: 10, align: AlignmentType.CENTER, width: finWidths[idx] })
          )
        });

        const finDataRows = filteredFin.map((f) => {
          const typeText = f.type === 'income' ? 'درآمد (+)' : 'هزینه (-)';
          const typeColor = f.type === 'income' ? '16A34A' : 'DC2626';
          const amountText = toPersianDigits(f.amount.toLocaleString());

          return new TableRow({
            children: [
              createCell(f.title || '-', { bold: true, width: finWidths[0] }),
              createCell(typeText, { bold: true, color: typeColor, align: AlignmentType.CENTER, width: finWidths[1] }),
              createCell(amountText, { bold: true, color: typeColor, align: AlignmentType.CENTER, width: finWidths[2] }),
              createCell(f.dateISO ? formatJalaliShort(f.dateISO) : '-', { align: AlignmentType.CENTER, width: finWidths[3] }),
              createCell(f.dayOfWeekName || '-', { align: AlignmentType.CENTER, width: finWidths[4] }),
            ]
          });
        });

        if (filteredFin.length === 0) {
          finDataRows.push(new TableRow({
            children: [
              createCell('در این بازه زمانی هیچ تراکنش مالی ثبت نشده است.', { align: AlignmentType.CENTER, size: 10, color: '94A3B8' })
            ].map(c => {
              (c as any).columnSpan = 5;
              return c;
            })
          }));
        }

        docChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: [finHeaderRow, ...finDataRows],
          })
        );
      }

      // Pack Document without explicit page background, allowing Word's native themes to style it beautifully
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docChildren,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Smart_Planner_Report_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      console.error('Word generation error:', err);
      alert('خطا در تولید فایل ورد.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getActivePickerValue = () => {
    if (activePickerField === 'tasksStart') return tasksStartDate;
    if (activePickerField === 'tasksEnd') return tasksEndDate;
    if (activePickerField === 'habitsStart') return habitsStartDate;
    if (activePickerField === 'habitsEnd') return habitsEndDate;
    if (activePickerField === 'dailyStart') return dailyStartDate;
    if (activePickerField === 'dailyEnd') return dailyEndDate;
    if (activePickerField === 'financesStart') return financesStartDate;
    if (activePickerField === 'financesEnd') return financesEndDate;
    return '2026-01-01';
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden transform transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-800 via-emerald-700 to-cyan-800 p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl">
                <FileText className="w-6 h-6 text-teal-200" />
              </div>
              <div>
                <h3 className="font-bold text-base">ساخت فایل خروجی Word (.docx)</h3>
                <p className="text-xs text-teal-100">تعیین بازه زمانی مجزا برای هر بخش از برنامه</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Section 1: Tasks & Goals Date Range */}
            <div className={`p-3.5 border rounded-2xl space-y-2 transition-all duration-200 ${includeTasks ? 'bg-teal-50/60 border-teal-100' : 'bg-slate-50/60 border-slate-200/60 opacity-65'}`}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>۱. بازه زمانی ردیاب وظایف و اهداف:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeTasks(!includeTasks)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all duration-200 ${includeTasks ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                >
                  {includeTasks ? 'شامل در خروجی' : 'حذف از خروجی'}
                </button>
              </div>
              {includeTasks && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActivePickerField('tasksStart')}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-center font-semibold hover:border-teal-400"
                  >
                    از: {formatJalaliShort(tasksStartDate)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePickerField('tasksEnd')}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-center font-semibold hover:border-teal-400"
                  >
                    تا: {formatJalaliShort(tasksEndDate)}
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Habits Date Range */}
            <div className={`p-3.5 border rounded-2xl space-y-2 transition-all duration-200 ${includeHabits ? 'bg-indigo-50/60 border-indigo-100' : 'bg-slate-50/60 border-slate-200/60 opacity-65'}`}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>۲. بازه زمانی عادات روزانه:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeHabits(!includeHabits)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all duration-200 ${includeHabits ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                >
                  {includeHabits ? 'شامل در خروجی' : 'حذف از خروجی'}
                </button>
              </div>
              {includeHabits && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActivePickerField('habitsStart')}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-center font-semibold hover:border-indigo-400"
                  >
                    از: {formatJalaliShort(habitsStartDate)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePickerField('habitsEnd')}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-center font-semibold hover:border-indigo-400"
                  >
                    تا: {formatJalaliShort(habitsEndDate)}
                  </button>
                </div>
              )}
            </div>

            {/* Section 3: Daily Tasks Date Range */}
            <div className={`p-3.5 border rounded-2xl space-y-2 transition-all duration-200 ${includeDaily ? 'bg-emerald-50/60 border-emerald-100' : 'bg-slate-50/60 border-slate-200/60 opacity-65'}`}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>۳. بازه زمانی کارهای روزانه:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeDaily(!includeDaily)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all duration-200 ${includeDaily ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                >
                  {includeDaily ? 'شامل در خروجی' : 'حذف از خروجی'}
                </button>
              </div>
              {includeDaily && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActivePickerField('dailyStart')}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-center font-semibold hover:border-emerald-400"
                  >
                    از: {formatJalaliShort(dailyStartDate)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePickerField('dailyEnd')}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-center font-semibold hover:border-emerald-400"
                  >
                    تا: {formatJalaliShort(dailyEndDate)}
                  </button>
                </div>
              )}
            </div>

            {/* Section 4: Financials Date Range */}
            <div className={`p-3.5 border rounded-2xl space-y-2 transition-all duration-200 ${includeFinances ? 'bg-amber-50/60 border-amber-100' : 'bg-slate-50/60 border-slate-200/60 opacity-65'}`}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>۴. بازه زمانی بخش مالی و بودجه:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeFinances(!includeFinances)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all duration-200 ${includeFinances ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                >
                  {includeFinances ? 'شامل در خروجی' : 'حذف از خروجی'}
                </button>
              </div>
              {includeFinances && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActivePickerField('financesStart')}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-center font-semibold hover:border-amber-400"
                  >
                    از: {formatJalaliShort(financesStartDate)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePickerField('financesEnd')}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-center font-semibold hover:border-amber-400"
                  >
                    تا: {formatJalaliShort(financesEndDate)}
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={generateWordDoc}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-teal-600/30 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال ساخت فایل ورد...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>ساخت و دانلود فایل Word</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date Picker Helper */}
      <JalaliDatePickerModal
        isOpen={Boolean(activePickerField)}
        onClose={() => setActivePickerField(null)}
        selectedDateISO={getActivePickerValue()}
        onSelectDate={(iso) => handlePickerSelect(iso)}
      />
    </>
  );
};
