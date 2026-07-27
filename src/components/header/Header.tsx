import React, { useState } from 'react';
import {
  Save,
  RotateCcw,
  CloudUpload,
  CloudDownload,
  MoreVertical,
  LogIn,
  FileJson,
  FileText,
  Sparkles,
  Check,
  Loader2,
  UserCheck,
  Wifi,
  WifiOff,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { AppState } from '../../types';
import { saveToGoogleDrive, loadFromGoogleDrive, getActiveGoogleEmail, getGoogleAccessToken } from '../../utils/googleDrive';

interface HeaderProps {
  appState: AppState;
  onSaveLocal: () => void | Promise<void>;
  onLoadLocal: () => boolean | Promise<boolean>;
  onUpdateState: (newState: AppState) => void;
  onOpenJsonModal: () => void;
  onOpenWordModal: () => void;
  onOpenGoogleDriveModal: () => void;
  isOnline: boolean;
  onInstall: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appState,
  onSaveLocal,
  onLoadLocal,
  onUpdateState,
  onOpenJsonModal,
  onOpenWordModal,
  onOpenGoogleDriveModal,
  isOnline,
  onInstall,
}) => {
  const [driveSyncType, setDriveSyncType] = useState<'save' | 'load' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Compute active email based on token existence
  const activeToken = getGoogleAccessToken();
  const userEmail = activeToken ? (getActiveGoogleEmail() || appState.userEmail || 'sadra2233s@gmail.com') : null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveLocal = async () => {
    try {
      await onSaveLocal();
      showToast('تغییرات با موفقیت در دستگاه محلی ذخیره شد!');
    } catch (err) {
      showToast('خطا در ذخیره‌سازی محلی.');
    }
  };

  const handleApplyLocal = async () => {
    const success = await onLoadLocal();
    if (success) {
      showToast('آخرین تغییرات ذخیره‌شده دستگاه با موفقیت اعمال شد!');
    } else {
      showToast('هیچ دیتای ذخیره‌شده‌ای در دستگاه پیدا نشد.');
    }
  };

  const handleSaveToDrive = async () => {
    setDriveSyncType('save');
    try {
      const success = await saveToGoogleDrive(appState);
      if (success) {
        showToast('تغییرات با موفقیت در گوگل درایو ذخیره شد!');
      } else {
        showToast('خطا در ذخیره‌سازی در گوگل درایو.');
      }
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره‌سازی در گوگل درایو.');
      onOpenGoogleDriveModal();
    } finally {
      setDriveSyncType(null);
    }
  };

  const handleLoadFromDrive = async () => {
    setDriveSyncType('load');
    try {
      const driveState = await loadFromGoogleDrive();
      if (driveState) {
        onUpdateState(driveState);
        showToast('آخرین تغییرات از گوگل درایو اعمال شد!');
      }
    } catch (err: any) {
      showToast(err.message || 'خطا در بازیابی از گوگل درایو.');
      onOpenGoogleDriveModal();
    } finally {
      setDriveSyncType(null);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <img
            src="/icon.png"
            alt="Smart Planner Notebook Icon"
            className="w-10 h-10 rounded-2xl object-cover shadow-md border border-amber-200/80 hover:scale-105 transition-transform"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-800">
                Smart Planner
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/80 rounded-full">
                نسخه هوشمند PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden xs:block">
              نظم، آرامش و پیگیری هوشمند هدف‌ها
            </p>
          </div>
        </div>

        {/* Action Center */}
        <div className="flex items-center gap-2">
          {/* Online/Offline Badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={isOnline ? 'اینترنت متصل است' : 'حالت آفلاین محلی'}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
            <span>{isOnline ? 'آنلاین' : 'آفلاین'}</span>
          </div>

          {/* 4 TOP ICON-ONLY ACTION BUTTONS (2 Local Device + 2 Google Drive) */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-xs">
            {/* 1. Local Save Button */}
            <button
              type="button"
              onClick={handleSaveLocal}
              className="p-2 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all active:scale-95"
              title="ذخیره تغییرات در دستگاه محلی"
            >
              <Save className="w-4 h-4" />
            </button>

            {/* 2. Local Load / Apply Button */}
            <button
              type="button"
              onClick={handleApplyLocal}
              className="p-2 bg-white hover:bg-emerald-50 text-emerald-700 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all active:scale-95"
              title="اعمال آخرین وضعیت ذخیره‌شده در دستگاه محلی"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-300 my-auto mx-0.5" />

            {/* 3. Upload to Google Drive Button */}
            <button
              type="button"
              onClick={handleSaveToDrive}
              disabled={driveSyncType !== null}
              className="p-2 bg-white hover:bg-teal-50 text-teal-700 rounded-xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all active:scale-95 disabled:opacity-50 animate-fade-in"
              title="ذخیره آخرین تغییرات در گوگل درایو"
            >
              {driveSyncType === 'save' ? <Loader2 className="w-4 h-4 animate-spin text-teal-600" /> : <CloudUpload className="w-4 h-4" />}
            </button>

            {/* 4. Load from Google Drive Button */}
            <button
              type="button"
              onClick={handleLoadFromDrive}
              disabled={driveSyncType !== null}
              className="p-2 bg-white hover:bg-indigo-50 text-indigo-700 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all active:scale-95 disabled:opacity-50 animate-fade-in"
              title="اعمال آخرین تغییرات از گوگل درایو"
            >
              {driveSyncType === 'load' ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <CloudDownload className="w-4 h-4" />}
            </button>
          </div>

          {/* DESKTOP EXTRA OPTIONS */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Google Drive Connection Button */}
            <button
              type="button"
              onClick={onOpenGoogleDriveModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                userEmail
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
              }`}
              title={userEmail ? `متصل به ${userEmail}` : 'پشتیبان‌گیری محلی و حریم خصوصی'}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${userEmail ? 'text-emerald-600' : 'text-teal-600'}`} />
              <span className="max-w-[120px] truncate">{userEmail ? userEmail : 'امنیت و پشتیبان‌گیری'}</span>
            </button>

            {/* JSON Backup option */}
            <button
              type="button"
              onClick={onOpenJsonModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs"
              title="انتقال دستی آفلاین JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-indigo-600" />
              <span>فایل JSON</span>
            </button>

            {/* PDF Export option */}
            <button
              type="button"
              onClick={onOpenWordModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              title="ساخت و دانلود گزارش PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ساخت PDF</span>
            </button>

            <button
              type="button"
              onClick={onInstall}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              title="نصب اپلیکیشن روی دستگاه"
            >
              <Download className="w-4 h-4 text-violet-200" />
              <span>نصب اپلیکیشن</span>
            </button>
          </div>

          {/* MOBILE 3-DOTS DROPDOWN MENU */}
          <div className="relative lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
              title="منوی سایر گزینه‌ها"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {mobileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setMobileMenuOpen(false)} />
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-fade-in space-y-1">
                  <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onInstall();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl transition-all shadow-sm text-right"
                >
                  <Download className="w-4 h-4 text-violet-200" />
                  <span>نصب اپلیکیشن روی دستگاه</span>
                </button>
                {/* Google Drive Sign-in inside 3 dots */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenGoogleDriveModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-right"
                >
                  <ShieldCheck className={`w-4 h-4 ${userEmail ? 'text-emerald-600' : 'text-teal-600'}`} />
                  <span className="truncate">{userEmail ? userEmail : 'امنیت و پشتیبان‌گیری'}</span>
                </button>

                {/* JSON backup inside 3 dots */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenJsonModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-right"
                >
                  <FileJson className="w-4 h-4 text-indigo-600" />
                  <span>انتقال آفلاین / فایل JSON</span>
                </button>

                {/* PDF export inside 3 dots */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenWordModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors text-right"
                >
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>ساخت فایل PDF</span>
                </button>
              </div>
            </>
            )}
          </div>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </header>
  );
};
