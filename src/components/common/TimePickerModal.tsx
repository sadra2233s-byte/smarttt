import React, { useState, useEffect, useRef } from 'react';
import { Clock, Check, X, Plus, Minus } from 'lucide-react';
import { toPersianDigits } from '../../utils/jalali';

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTime: string; // HH:mm format e.g. "14:30"
  onSelectTime: (timeStr: string) => void;
  title?: string;
}

type PickerMode = 'hours' | 'minutes';

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  isOpen,
  onClose,
  selectedTime,
  onSelectTime,
  title = 'انتخاب زمان و ساعت',
}) => {
  const [hours, setHours] = useState<number>(() => {
    if (!selectedTime || !selectedTime.includes(':')) return 12;
    const parts = selectedTime.split(':');
    const h = parseInt(parts[0], 10);
    return isNaN(h) ? 12 : Math.min(23, Math.max(0, h));
  });

  const [minutes, setMinutes] = useState<number>(() => {
    if (!selectedTime || !selectedTime.includes(':')) return 0;
    const parts = selectedTime.split(':');
    const m = parseInt(parts[1], 10);
    return isNaN(m) ? 0 : Math.min(59, Math.max(0, m));
  });

  const [mode, setMode] = useState<PickerMode>('hours');
  const [isDragging, setIsDragging] = useState(false);
  const clockRef = useRef<HTMLDivElement>(null);

  // Sync state when opened
  useEffect(() => {
    if (selectedTime && selectedTime.includes(':')) {
      const parts = selectedTime.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h)) setHours(Math.min(23, Math.max(0, h)));
      if (!isNaN(m)) setMinutes(Math.min(59, Math.max(0, m)));
    }
    setMode('hours');
  }, [selectedTime, isOpen]);

  const handleConfirm = () => {
    const hStr = String(hours).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    onSelectTime(`${hStr}:${mStr}`);
    onClose();
  };

  // Increment / Decrement Handlers
  const handleIncHour = () => setHours((prev) => (prev + 1) % 24);
  const handleDecHour = () => setHours((prev) => (prev - 1 + 24) % 24);
  const handleIncMinute = () => setMinutes((prev) => (prev + 1) % 60);
  const handleDecMinute = () => setMinutes((prev) => (prev - 1 + 60) % 60);

  const displayHoursStr = String(hours).padStart(2, '0');
  const displayMinutesStr = String(minutes).padStart(2, '0');

  // Clock angle & radius calculation from mouse/touch pointer
  const calculateFromPointer = (clientX: number, clientY: number, isFinal = false) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = clientX - rect.left - cx;
    const y = clientY - rect.top - cy;

    let rad = Math.atan2(y, x); // -PI to PI
    let deg = rad * (180 / Math.PI) + 90; // 0 deg at 12 o'clock
    if (deg < 0) deg += 360;

    const dist = Math.sqrt(x * x + y * y);
    const innerThreshold = rect.width * 0.31; // threshold between inner ring and outer ring

    if (mode === 'hours') {
      let step = Math.round(deg / 30) % 12;
      let selectedH: number;
      if (dist < innerThreshold) {
        // Inner Ring: 00, 13..23
        selectedH = step === 0 ? 0 : step + 12;
      } else {
        // Outer Ring: 1..12
        selectedH = step === 0 ? 12 : step;
      }
      setHours(selectedH);
      if (isFinal) {
        setTimeout(() => setMode('minutes'), 150);
      }
    } else {
      let min = Math.round(deg / 6) % 60;
      setMinutes(min);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(true);
    calculateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    calculateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(false);
    calculateFromPointer(e.clientX, e.clientY, true);
  };

  // Outer hours (1..12)
  const outerHours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  // Inner hours (00, 13..23)
  const innerHours = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  // Minutes step 5 (0, 5, 10, ... 55)
  const minuteSteps = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // Percentage Radii for Outer and Inner rings
  const OUTER_RADIUS_PCT = 38; // 38% of clock size
  const INNER_RADIUS_PCT = 24; // 24% of clock size

  // Determine active needle radius % and angle
  let needleRadiusPct = OUTER_RADIUS_PCT;
  let needleAngleDeg = 0;

  if (mode === 'hours') {
    const isInner = hours === 0 || (hours >= 13 && hours <= 23);
    needleRadiusPct = isInner ? INNER_RADIUS_PCT : OUTER_RADIUS_PCT;
    needleAngleDeg = (hours % 12) * 30;
  } else {
    needleRadiusPct = OUTER_RADIUS_PCT;
    needleAngleDeg = minutes * 6;
  }

  // Calculate coordinates (X%, Y%) for needle tip
  const needleRad = ((needleAngleDeg - 90) * Math.PI) / 180;
  const needleX = 50 + needleRadiusPct * Math.cos(needleRad);
  const needleY = 50 + needleRadiusPct * Math.sin(needleRad);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-teal-200 w-full max-w-xs sm:max-w-sm overflow-hidden transform transition-all select-none flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-300" />
            <h3 className="font-extrabold text-sm sm:text-base">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-teal-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOP DIGITAL DISPLAY & STEPPERS (+ / -) */}
        <div className="bg-gradient-to-b from-teal-950 via-teal-900 to-slate-900 p-4 text-white flex flex-col items-center shadow-inner">
          <div className="flex items-center justify-center gap-3 dir-ltr">
            {/* Hours Box */}
            <div
              className={`flex items-center gap-1.5 p-1.5 rounded-2xl border transition-all ${
                mode === 'hours'
                  ? 'bg-teal-700/80 border-emerald-400 shadow-lg shadow-teal-500/30'
                  : 'bg-teal-950/60 border-teal-800/80 hover:border-teal-600'
              }`}
            >
              <button
                type="button"
                onClick={handleDecHour}
                className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-teal-100 flex items-center justify-center transition-colors active:scale-90"
                title="کاهش ساعت"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => setMode('hours')}
                className="px-2.5 py-1 text-2xl font-black text-white hover:text-emerald-300 transition-colors flex flex-col items-center"
              >
                <span>{toPersianDigits(displayHoursStr)}</span>
                <span className="text-[9px] font-bold text-teal-200 -mt-1">ساعت</span>
              </button>

              <button
                type="button"
                onClick={handleIncHour}
                className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-teal-100 flex items-center justify-center transition-colors active:scale-90"
                title="افزایش ساعت"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            <span className="text-2xl font-black text-teal-400 animate-pulse">:</span>

            {/* Minutes Box */}
            <div
              className={`flex items-center gap-1.5 p-1.5 rounded-2xl border transition-all ${
                mode === 'minutes'
                  ? 'bg-teal-700/80 border-emerald-400 shadow-lg shadow-teal-500/30'
                  : 'bg-teal-950/60 border-teal-800/80 hover:border-teal-600'
              }`}
            >
              <button
                type="button"
                onClick={handleDecMinute}
                className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-teal-100 flex items-center justify-center transition-colors active:scale-90"
                title="کاهش دقیقه"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => setMode('minutes')}
                className="px-2.5 py-1 text-2xl font-black text-white hover:text-emerald-300 transition-colors flex flex-col items-center"
              >
                <span>{toPersianDigits(displayMinutesStr)}</span>
                <span className="text-[9px] font-bold text-teal-200 -mt-1">دقیقه</span>
              </button>

              <button
                type="button"
                onClick={handleIncMinute}
                className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-teal-100 flex items-center justify-center transition-colors active:scale-90"
                title="افزایش دقیقه"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Mode Switch Pills */}
          <div className="flex items-center gap-1 bg-teal-950/90 p-1 rounded-xl border border-teal-800/80 mt-3 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('hours')}
              className={`px-4 py-1 rounded-lg transition-all ${
                mode === 'hours'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-teal-300 hover:text-white'
              }`}
            >
              انتخاب ساعت
            </button>
            <button
              type="button"
              onClick={() => setMode('minutes')}
              className={`px-4 py-1 rounded-lg transition-all ${
                mode === 'minutes'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-teal-300 hover:text-white'
              }`}
            >
              انتخاب دقیقه
            </button>
          </div>
        </div>

        {/* CIRCULAR CLOCK DIAL */}
        <div className="p-6 bg-slate-50 flex items-center justify-center">
          <div
            ref={clockRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-white border-4 border-slate-100 shadow-xl relative touch-none cursor-pointer select-none overflow-hidden"
          >
            {/* SVG Needle Line Connecting Center to Tip */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <line
                x1="50%"
                y1="50%"
                x2={`${needleX}%`}
                y2={`${needleY}%`}
                stroke="#059669"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Center Pivot Point */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-emerald-600 rounded-full z-30 shadow-md border-2 border-white pointer-events-none" />

            {/* Needle Tip Pointer Circle */}
            <div
              className="absolute z-20 w-8 h-8 rounded-full bg-emerald-600 border-2 border-emerald-300 shadow-md -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-white font-black text-xs pointer-events-none transition-all duration-75"
              style={{
                left: `${needleX}%`,
                top: `${needleY}%`,
              }}
            >
              {toPersianDigits(
                mode === 'hours'
                  ? String(hours).padStart(2, '0')
                  : String(minutes).padStart(2, '0')
              )}
            </div>

            {/* HOURS MODE STATIC NUMBERS */}
            {mode === 'hours' && (
              <>
                {/* Outer Ring (1..12) */}
                {outerHours.map((hVal) => {
                  const angleDeg = (hVal % 12) * 30 - 90;
                  const rad = (angleDeg * Math.PI) / 180;
                  const x = 50 + OUTER_RADIUS_PCT * Math.cos(rad);
                  const y = 50 + OUTER_RADIUS_PCT * Math.sin(rad);
                  const isSelected = hours === hVal;

                  return (
                    <div
                      key={`outer-${hVal}`}
                      className={`absolute w-7 h-7 rounded-full flex items-center justify-center font-black text-xs pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150 ${
                        isSelected ? 'opacity-0' : 'text-slate-800'
                      }`}
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                      }}
                    >
                      {toPersianDigits(hVal)}
                    </div>
                  );
                })}

                {/* Inner Ring (00, 13..23) */}
                {innerHours.map((hVal) => {
                  const angleDeg = (hVal % 12) * 30 - 90;
                  const rad = (angleDeg * Math.PI) / 180;
                  const x = 50 + INNER_RADIUS_PCT * Math.cos(rad);
                  const y = 50 + INNER_RADIUS_PCT * Math.sin(rad);
                  const isSelected = hours === hVal;

                  return (
                    <div
                      key={`inner-${hVal}`}
                      className={`absolute w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150 ${
                        isSelected ? 'opacity-0' : 'text-slate-500'
                      }`}
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                      }}
                    >
                      {toPersianDigits(String(hVal).padStart(2, '0'))}
                    </div>
                  );
                })}
              </>
            )}

            {/* MINUTES MODE STATIC NUMBERS */}
            {mode === 'minutes' && (
              <>
                {minuteSteps.map((mVal) => {
                  const angleDeg = mVal * 6 - 90;
                  const rad = (angleDeg * Math.PI) / 180;
                  const x = 50 + OUTER_RADIUS_PCT * Math.cos(rad);
                  const y = 50 + OUTER_RADIUS_PCT * Math.sin(rad);
                  const isSelected = minutes === mVal;

                  return (
                    <div
                      key={`min-${mVal}`}
                      className={`absolute w-7 h-7 rounded-full flex items-center justify-center font-black text-xs pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150 ${
                        isSelected ? 'opacity-0' : 'text-slate-800'
                      }`}
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                      }}
                    >
                      {toPersianDigits(String(mVal).padStart(2, '0'))}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100/80 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>تایید ساعت</span>
          </button>
        </div>
      </div>
    </div>
  );
};
