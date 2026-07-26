import React, { useState } from 'react';
import { Calendar, ChevronRight, ChevronLeft, Check, X, Copy, Trash2 } from 'lucide-react';
import {
  JALALI_MONTH_NAMES,
  WEEKDAY_NAMES_FA,
  gregorianToJalali,
  jalaliToGregorian,
  getJalaliDaysInMonth,
  toPersianDigits,
  parseDateToJalali,
  formatJalaliShort,
} from '../../utils/jalali';

interface JalaliMultiDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedDatesISO: string[]) => void;
  title?: string;
  subtitle?: string;
}

export const JalaliMultiDatePickerModal: React.FC<JalaliMultiDatePickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'تکثیر برنامه در روزهای مختلف',
  subtitle = 'روزهای مورد نظر خود را از تقویم انتخاب کنید تا برنامه به آن‌ها اضافه شود.',
}) => {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  
  const todayJ = parseDateToJalali(new Date().toISOString());
  const [viewYear, setViewYear] = useState<number>(todayJ.jy);
  const [viewMonth, setViewMonth] = useState<number>(todayJ.jm); // 1-12

  if (!isOpen) return null;

  const daysInMonth = getJalaliDaysInMonth(viewYear, viewMonth);

  // Find day of week for the 1st day of viewMonth
  const firstDayGregorian = jalaliToGregorian(viewYear, viewMonth, 1);
  const firstDayDate = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);
  const jsDay = firstDayDate.getDay();
  const firstDayWeekdayIndex = (jsDay + 1) % 7; // 0=Saturday

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const toggleDate = (year: number, month: number, day: number) => {
    const g = jalaliToGregorian(year, month, day);
    const mm = String(g.gm).padStart(2, '0');
    const dd = String(g.gd).padStart(2, '0');
    const isoDate = `${g.gy}-${mm}-${dd}`;

    if (selectedDates.includes(isoDate)) {
      setSelectedDates(selectedDates.filter((d) => d !== isoDate));
    } else {
      setSelectedDates([...selectedDates, isoDate]);
    }
  };

  const handleClearAll = () => {
    setSelectedDates([]);
  };

  const handleConfirm = () => {
    onConfirm(selectedDates);
    onClose();
    setSelectedDates([]);
  };

  // Build grid items
  const gridCells = [];
  for (let i = 0; i < firstDayWeekdayIndex; i++) {
    gridCells.push(<div key={`empty-${i}`} className="h-10" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const g = jalaliToGregorian(viewYear, viewMonth, d);
    const mm = String(g.gm).padStart(2, '0');
    const dd = String(g.gd).padStart(2, '0');
    const isoDate = `${g.gy}-${mm}-${dd}`;
    const isSelected = selectedDates.includes(isoDate);

    gridCells.push(
      <button
        key={`day-${d}`}
        type="button"
        onClick={() => toggleDate(viewYear, viewMonth, d)}
        className={`h-10 w-10 mx-auto rounded-full flex flex-col items-center justify-center text-xs font-bold transition-all relative ${
          isSelected
            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30 scale-105 ring-2 ring-emerald-300'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <span>{toPersianDigits(d)}</span>
        {isSelected && (
          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">{title}</h3>
              <p className="text-[10px] text-emerald-100/80 mt-0.5 font-medium">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Box */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="ماه قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {JALALI_MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {Array.from({ length: 15 }, (_, idx) => todayJ.jy - 2 + idx).map((yr) => (
                  <option key={yr} value={yr}>
                    {toPersianDigits(yr)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="ماه بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="calendar-grid text-center">
            {WEEKDAY_NAMES_FA.map((w) => (
              <div key={w} className="text-[10px] font-extrabold text-slate-400 py-1">
                {w.substring(0, 1)}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="calendar-grid gap-y-1">{gridCells}</div>

          {/* Selection Stats */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">تعداد روزهای انتخاب‌شده:</span>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-black rounded-lg border border-emerald-200 animate-pulse">
                {toPersianDigits(selectedDates.length)} روز
              </span>
            </div>
            {selectedDates.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 border border-rose-100"
              >
                <Trash2 className="w-3 h-3" />
                <span>پاک کردن همه</span>
              </button>
            )}
          </div>

          {/* List of selected days (scrollable) */}
          {selectedDates.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 block px-1">روزهای منتخب برای شبیه‌سازی:</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50/50 border border-slate-100 rounded-xl">
                {selectedDates.map((dateISO) => (
                  <span
                    key={dateISO}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg"
                  >
                    <span>{formatJalaliShort(dateISO)}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDates(selectedDates.filter((d) => d !== dateISO))}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded-full hover:bg-slate-100"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedDates.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Copy className="w-4 h-4" />
              <span>تکثیر در روزهای منتخب</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
