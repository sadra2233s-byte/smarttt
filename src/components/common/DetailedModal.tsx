import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Clock,
  Calendar,
  Check,
  X,
  Edit3,
  Trash2,
  Tag,
  Sparkles,
  CheckCircle2,
  Clock3,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { formatJalaliFull, toPersianDigits } from '../../utils/jalali';

export interface DetailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  category?: string;
  status?: string;
  amount?: number;
  type?: 'income' | 'expense' | string;
  summary?: string;
  detailedDescription: string;
  createdDateISO?: string;
  createdTimeStr?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  timeWindow?: string;
  onSave?: (newDetailed: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

export const DetailedModal: React.FC<DetailedModalProps> = ({
  isOpen,
  onClose,
  title,
  category,
  status,
  amount,
  type,
  summary,
  detailedDescription,
  createdDateISO,
  createdTimeStr,
  deadlineDate,
  deadlineTime,
  timeWindow,
  onSave,
  onEdit,
  onDelete,
  readOnly = false,
}) => {
  if (!isOpen) return null;

  const [text, setText] = useState(detailedDescription || '');
  const [isEditingText, setIsEditingText] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleConfirmSave = () => {
    if (onSave) {
      onSave(text);
    }
    setIsEditingText(false);
    onClose();
  };

  const handleDeleteWithConfirm = () => {
    setShowConfirmDelete(true);
  };

  const formattedCreated = createdDateISO ? formatJalaliFull(createdDateISO) : null;
  const formattedDeadline = deadlineDate ? formatJalaliFull(deadlineDate) : null;

  // Render status badge helper
  const renderStatusBadge = () => {
    if (!status) return null;
    if (status === 'completed' || status === 'انجام شده' || status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
          <span>انجام شده</span>
        </span>
      );
    }
    if (status === 'overdue' || status === 'معوقه') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
          <AlertCircle className="w-3 h-3 text-rose-700" />
          <span>معوقه</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-900 border border-sky-300">
        <Clock3 className="w-3 h-3 text-sky-700" />
        <span>در حال انجام</span>
      </span>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden transform transition-all my-auto">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-white leading-snug">{title}</h3>
                
                {/* Badges bar */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {category && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-teal-100 border border-white/20 backdrop-blur-xs">
                      <Tag className="w-3 h-3 text-teal-200" />
                      <span>{category}</span>
                    </span>
                  )}
                  {renderStatusBadge()}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-700">
          {/* Metadata Micro Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Created Date/Time */}
            {(formattedCreated || createdTimeStr) && (
              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl flex flex-col justify-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  <span>تاریخ ثبت</span>
                </span>
                <span className="font-bold text-slate-800 dir-rtl">
                  {formattedCreated || '-'} {createdTimeStr ? `(${toPersianDigits(createdTimeStr)})` : ''}
                </span>
              </div>
            )}

            {/* Time Window (Schedule) or Deadline */}
            {timeWindow ? (
              <div className="bg-teal-50/80 border border-teal-200/80 p-3 rounded-2xl flex flex-col justify-center space-y-1">
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>بازه زمانی</span>
                </span>
                <span className="font-extrabold text-teal-950 dir-ltr text-right">
                  {toPersianDigits(timeWindow)}
                </span>
              </div>
            ) : (formattedDeadline || deadlineTime) ? (
              <div className="bg-rose-50/80 border border-rose-200/80 p-3 rounded-2xl flex flex-col justify-center space-y-1">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  <span>مهلت انجام</span>
                </span>
                <span className="font-bold text-rose-950">
                  {formattedDeadline || '-'} {deadlineTime ? `(${toPersianDigits(deadlineTime)})` : ''}
                </span>
              </div>
            ) : null}

            {/* Amount for Financial */}
            {amount !== undefined && amount > 0 && (
              <div className={`p-3 rounded-2xl border flex flex-col justify-center space-y-1 ${
                type === 'income'
                  ? 'bg-emerald-50 border-emerald-200/80'
                  : 'bg-rose-50 border-rose-200/80'
              }`}>
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>مبلغ ({type === 'income' ? 'درآمد' : 'هزینه'})</span>
                </span>
                <span className={`font-black text-sm ${type === 'income' ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {toPersianDigits(amount.toLocaleString())} تومان
                </span>
              </div>
            )}
          </div>

          {/* Summary Box */}
          {summary && (
            <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/70 border border-teal-200/80 rounded-2xl p-3.5">
              <span className="text-[11px] font-bold text-teal-900 block mb-1">خلاصه توضیحات:</span>
              <p className="text-slate-700 leading-relaxed font-medium">{summary}</p>
            </div>
          )}

          {/* Detailed Description Block / Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>توضیحات تکمیلی و مفصل:</span>
              </span>
              {!readOnly && onSave && (
                <button
                  type="button"
                  onClick={() => setIsEditingText(!isEditingText)}
                  className="flex items-center gap-1 text-[11px] text-teal-700 font-bold hover:underline"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingText ? 'نمایش متن' : 'ویرایش متن'}</span>
                </button>
              )}
            </div>

            {isEditingText && !readOnly ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="توضیحات کامل را اینجا وارد کنید..."
                className="w-full p-3 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none resize-none leading-relaxed"
              />
            ) : (
              <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-xs text-slate-700 leading-relaxed min-h-[90px] whitespace-pre-wrap max-h-[220px] overflow-y-auto">
                {text.trim() ? (
                  text
                ) : (
                  <span className="text-slate-400 italic">توضیحات تکمیلی ثبت نشده است.</span>
                )}
              </div>
            )}
          </div>

          {/* Footer Toolbar */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit();
                  }}
                  className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>ویرایش</span>
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={handleDeleteWithConfirm}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 mr-auto">
              {isEditingText && onSave && (
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="flex items-center gap-1.5 px-4.5 py-2 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-800 text-white font-black text-xs rounded-xl shadow-md shadow-teal-600/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>ذخیره تغییرات</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={() => {
          if (onDelete) {
            onDelete();
          }
          onClose();
        }}
        title={`آیا از حذف «${title}» اطمینان دارید؟`}
      />
    </div>,
    document.body
  );
};
