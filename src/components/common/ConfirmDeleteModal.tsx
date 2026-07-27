import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'تایید حذف',
  description = 'آیا از حذف این مورد اطمینان دارید؟ این عملیات غیرقابل بازگشت است.',
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-rose-100 w-full max-w-sm overflow-hidden animate-scale-up my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-red-700 p-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/20">
              <AlertTriangle className="w-5 h-5 text-amber-200" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-white">تایید حذف</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-inner">
            <Trash2 className="w-6 h-6" />
          </div>
          <p className="font-black text-slate-800 text-sm leading-relaxed">{title}</p>
          <p className="text-xs text-slate-500 font-medium">{description}</p>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف شود</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
