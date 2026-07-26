import React, { useState, useEffect } from 'react';
import { Calendar, ChevronRight, ChevronLeft, Check, X } from 'lucide-react';
import {
  JALALI_MONTH_NAMES,
  WEEKDAY_NAMES_FA,
  gregorianToJalali,
  jalaliToGregorian,
  getJalaliDaysInMonth,
  toPersianDigits,
  parseDateToJalali,
} from '../../utils/jalali';

interface JalaliDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDateISO: string; // YYYY-MM-DD
  onSelectDate: (isoDate: string, jalaliStr: string) => void;
  title?: string;
}

export const JalaliDatePickerModal: React.FC<JalaliDatePickerModalProps> = ({
  isOpen,
  onClose,
  selectedDateISO,
  onSelectDate,
  title = 'انتخاب تاریخ',
}) => {
  const initialJalali = parseDateToJalali(selectedDateISO || new Date().toISOString());
  const [viewYear, setViewYear] = useState<number>(initialJalali.jy);
  const [viewMonth, setViewMonth] = useState<number>(initialJalali.jm); // 1-12
  const [selectedDay, setSelectedDay] = useState<number>(initialJalali.jd);

  // Sync state when opened or selectedDateISO changes
  useEffect(() => {
    if (isOpen) {
      const activeJ = parseDateToJalali(selectedDateISO || new Date().toISOString());
      setViewYear(activeJ.jy);
      setViewMonth(activeJ.jm);
      setSelectedDay(activeJ.jd);
    }
  }, [selectedDateISO, isOpen]);

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

  const handleToday = () => {
    const todayJ = gregorianToJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
    setViewYear(todayJ.jy);
    setViewMonth(todayJ.jm);
    setSelectedDay(todayJ.jd);
  };

  const handleConfirm = () => {
    const g = jalaliToGregorian(viewYear, viewMonth, selectedDay);
    const mm = String(g.gm).padStart(2, '0');
    const dd = String(g.gd).padStart(2, '0');
    const isoDate = `${g.gy}-${mm}-${dd}`;
    const jmStr = String(viewMonth).padStart(2, '0');
    const jdStr = String(selectedDay).padStart(2, '0');
    const jalaliStr = toPersianDigits(`${viewYear}/${jmStr}/${jdStr}`);

    onSelectDate(isoDate, jalaliStr);
    onClose();
  };

  // Build grid items
  const gridCells = [];
  for (let i = 0; i < firstDayWeekdayIndex; i++) {
    gridCells.push(<div key={`empty-${i}`} className="h-10" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isSelected =
      d === selectedDay &&
      viewMonth === initialJalali.jm &&
      viewYear === initialJalali.jy;

    gridCells.push(
      <button
        key={`day-${d}`}
        type="button"
        onClick={() => setSelectedDay(d)}
        className={`h-10 w-10 mx-auto rounded-full flex items-center justify-center text-sm font-medium transition-all ${
          isSelected
            ? 'bg-teal-600 text-white shadow-md shadow-teal-500/30 scale-105 ring-2 ring-teal-300'
            : d === selectedDay
            ? 'bg-teal-100 text-teal-800 font-bold border border-teal-300'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        {toPersianDigits(d)}
      </button>
    );
  }

  // Selected date preview in Gregorian
  const previewG = jalaliToGregorian(viewYear, viewMonth, selectedDay);
  const previewGStr = `${previewG.gy}/${String(previewG.gm).padStart(2, '0')}/${String(previewG.gd).padStart(2, '0')}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-200" />
            <h3 className="font-bold text-base">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected date banner */}
        <div className="bg-teal-50 border-b border-teal-100 px-4 py-3 text-center">
          <div className="text-xl font-bold text-teal-900">
            {toPersianDigits(selectedDay)} {JALALI_MONTH_NAMES[viewMonth - 1]} {toPersianDigits(viewYear)}
          </div>
          <div className="text-xs text-teal-600 mt-0.5">
            معادل میلادی: {previewGStr}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="ماه قبل"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500 outline-none"
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
                className="bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500 outline-none"
              >
                {Array.from({ length: 20 }, (_, idx) => 1395 + idx).map((yr) => (
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
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="calendar-grid text-center mb-2">
            {WEEKDAY_NAMES_FA.map((w) => (
              <div key={w} className="text-xs font-bold text-slate-400 py-1">
                {w.substring(0, 1)}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="calendar-grid gap-y-1">{gridCells}</div>

          {/* Bottom actions */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleToday}
              className="text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-xl transition-colors"
            >
              برو به امروز
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all"
              >
                <Check className="w-4 h-4" />
                تأیید تاریخ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
