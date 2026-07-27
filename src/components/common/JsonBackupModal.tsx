import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Download, Upload, Database, FileJson, X, CheckCircle2 } from 'lucide-react';
import { AppState } from '../../types';

interface JsonBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  onRestoreState: (newState: AppState) => void;
}

export const JsonBackupModal: React.FC<JsonBackupModalProps> = ({
  isOpen,
  onClose,
  appState,
  onRestoreState,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Smart_Planner_Backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSuccessMsg('فایل پشتیبان JSON با موفقیت دانلود شد.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as AppState;

        if (parsed && Array.isArray(parsed.tasks) && Array.isArray(parsed.habits)) {
          onRestoreState(parsed);
          setSuccessMsg('اطلاعات با موفقیت از فایل پشتیبان بازگردانی شد!');
          setTimeout(() => {
            setSuccessMsg(null);
            onClose();
          }, 2000);
        } else {
          alert('ساختار فایل JSON معتبر نمی‌باشد.');
        }
      } catch (err) {
        alert('خطا در خواندن فایل JSON.');
      }
    };
    reader.readAsText(file);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden transform transition-all my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl">
              <FileJson className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">انتقال دستی و پشتیبان‌گیری JSON</h3>
              <p className="text-xs text-blue-100">مناسب برای مواقع عدم دسترسی به اینترنت</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 leading-relaxed">
            توسط این بخش می‌توانید تمام اطلاعات کارهای روزانه، عادات، اهداف و اطلاعات مالی خود را به‌صورت یک فایل آفلاین خروجی گرفته و در دستگاه دیگر بارگذاری کنید.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Download JSON Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-teal-50 hover:bg-teal-100/80 text-teal-800 border border-teal-200/80 rounded-2xl font-bold text-xs transition-all shadow-sm hover:shadow group"
            >
              <div className="p-3 bg-teal-600 text-white rounded-xl shadow-md shadow-teal-600/30 group-hover:scale-110 transition-transform">
                <Download className="w-5 h-5" />
              </div>
              <span>دانلود فایل JSON پشتیبان</span>
            </button>

            {/* Upload JSON Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-800 border border-indigo-200/80 rounded-2xl font-bold text-xs transition-all shadow-sm hover:shadow group"
            >
              <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <span>آپلود و بارگذاری فایل JSON</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
