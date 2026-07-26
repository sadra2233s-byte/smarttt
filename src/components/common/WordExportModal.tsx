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
import { AppState } from '../../types';
import { formatJalaliFull, formatJalaliShort, toPersianDigits } from '../../utils/jalali';
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
  const [tasksStartDate, setTasksStartDate] = useState('2025-01-01');
  const [tasksEndDate, setTasksEndDate] = useState('2027-12-31');

  const [habitsStartDate, setHabitsStartDate] = useState('2025-01-01');
  const [habitsEndDate, setHabitsEndDate] = useState('2027-12-31');

  const [dailyStartDate, setDailyStartDate] = useState('2025-01-01');
  const [dailyEndDate, setDailyEndDate] = useState('2027-12-31');

  const [financesStartDate, setFinancesStartDate] = useState('2025-01-01');
  const [financesEndDate, setFinancesEndDate] = useState('2027-12-31');

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

      // Document Title
      docChildren.push(
        new Paragraph({
          text: 'گزارش جامع برنامه‌ریزی هوشمند Smart Planner',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `تاریخ تهیه گزارش: ${formatJalaliFull(new Date())}`,
              italics: true,
              size: 20,
              color: '555555',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 500 },
        })
      );

      // --- 1. Tasks & Goals Section Table ---
      const filteredTasks = appState.tasks.filter((t) => {
        const d = t.createdDateISO || '2026-01-01';
        return d >= tasksStartDate && d <= tasksEndDate;
      });

      docChildren.push(
        new Paragraph({
          text: '۱. جدول وظایف و اهداف اصلی',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );

      const taskHeaderRow = new TableRow({
        tableHeader: true,
        children: ['عنوان task', 'دسته‌بندی', 'خلاصه توضیحات', 'مهلت انجام', 'وضعیت'].map(
          (hText) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: hText, bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: { fill: '0F766E', type: ShadingType.SOLID },
              width: { size: 20, type: WidthType.PERCENTAGE },
            })
        ),
      });

      const taskDataRows = filteredTasks.map(
        (t) =>
          new TableRow({
            children: [
              t.title || '-',
              t.category || '-',
              t.summary || t.detailedDescription || '-',
              `${t.deadlineDate ? formatJalaliShort(t.deadlineDate) : '-'} ${t.deadlineTime || ''}`,
              t.status === 'completed'
                ? 'انجام شده'
                : t.status === 'pending'
                ? 'در حال انجام'
                : 'معوقه',
            ].map(
              (cText) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: String(cText) })],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                })
            ),
          })
      );

      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [taskHeaderRow, ...taskDataRows],
        })
      );

      // --- 2. Habits Section Table ---
      docChildren.push(
        new Paragraph({
          text: '۲. جدول عادات روزانه',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 600, after: 200 },
        })
      );

      const habitHeaderRow = new TableRow({
        tableHeader: true,
        children: ['عنوان عادت', 'تاریخ ثبت'].map(
          (hText) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: hText, bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: { fill: '1E3A8A', type: ShadingType.SOLID },
              width: { size: 50, type: WidthType.PERCENTAGE },
            })
        ),
      });

      const filteredHabitsForExport = appState.habits.filter((h) => {
        const d = h.createdAtISO || '2026-01-01';
        return d >= habitsStartDate && d <= habitsEndDate;
      });

      const habitDataRows = filteredHabitsForExport.map(
        (h) =>
          new TableRow({
            children: [
              h.title || '-',
              h.createdAtISO ? formatJalaliShort(h.createdAtISO) : '-',
            ].map(
              (cText) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: String(cText) })],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                })
            ),
          })
      );

      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [habitHeaderRow, ...habitDataRows],
        })
      );

      // --- 3. Daily Tasks Schedule Table ---
      const filteredDaily = appState.dailyTasks.filter((dt) => {
        return dt.dateStr >= dailyStartDate && dt.dateStr <= dailyEndDate;
      });

      docChildren.push(
        new Paragraph({
          text: '۳. جدول کارهای روزانه و زمان‌بندی',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 600, after: 200 },
        })
      );

      const dailyHeaderRow = new TableRow({
        tableHeader: true,
        children: ['تاریخ', 'عنوان برنامه', 'بازه زمانی', 'توضیحات', 'وضعیت'].map(
          (hText) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: hText, bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: { fill: '047857', type: ShadingType.SOLID },
              width: { size: 20, type: WidthType.PERCENTAGE },
            })
        ),
      });

      const dailyDataRows = filteredDaily.map(
        (dt) =>
          new TableRow({
            children: [
              dt.dateStr ? formatJalaliShort(dt.dateStr) : '-',
              dt.title || '-',
              dt.timeWindow || '-',
              dt.summary || dt.detailedDescription || '-',
              dt.isCompleted ? 'تکمیل شده' : 'در انتظار انجام',
            ].map(
              (cText) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: String(cText) })],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                })
            ),
          })
      );

      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [dailyHeaderRow, ...dailyDataRows],
        })
      );

      // --- 4. Financials & Budget Table ---
      const filteredFin = appState.financials.filter((f) => {
        return f.dateISO >= financesStartDate && f.dateISO <= financesEndDate;
      });

      docChildren.push(
        new Paragraph({
          text: '۴. جدول مدیریت مالی، درآمد و هزینه‌ها',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 600, after: 200 },
        })
      );

      const finHeaderRow = new TableRow({
        tableHeader: true,
        children: ['عنوان تراکنش', 'نوع', 'مبلغ (تومان/ریال)', 'تاریخ ثبت', 'روز هفته'].map(
          (hText) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: hText, bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: { fill: 'B45309', type: ShadingType.SOLID },
              width: { size: 20, type: WidthType.PERCENTAGE },
            })
        ),
      });

      const finDataRows = filteredFin.map(
        (f) =>
          new TableRow({
            children: [
              f.title || '-',
              f.type === 'income' ? 'درآمد' : 'هزینه',
              toPersianDigits(f.amount.toLocaleString()),
              f.dateISO ? formatJalaliShort(f.dateISO) : '-',
              f.dayOfWeekName || '-',
            ].map(
              (cText) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: String(cText) })],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                })
            ),
          })
      );

      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [finHeaderRow, ...finDataRows],
        })
      );

      // Pack Document
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
            <div className="p-3.5 bg-teal-50/60 border border-teal-100 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>۱. بازه زمانی ردیاب وظایف و اهداف:</span>
              </div>
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
            </div>

            {/* Section 2: Habits Date Range */}
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>۲. بازه زمانی عادات روزانه:</span>
              </div>
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
            </div>

            {/* Section 3: Daily Tasks Date Range */}
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>۳. بازه زمانی کارهای روزانه:</span>
              </div>
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
            </div>

            {/* Section 4: Financials Date Range */}
            <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>۴. بازه زمانی بخش مالی و بودجه:</span>
              </div>
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
