import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Download,
  Upload,
  Laptop,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Settings,
  HelpCircle,
  Chrome,
  Check,
  Copy,
} from 'lucide-react';
import {
  getStoredClientId,
  setStoredClientId,
  getGoogleAccessToken,
  setGoogleAccessToken,
  getActiveGoogleEmail,
  setActiveGoogleEmail,
  logoutGoogleDrive,
  requestGisToken,
  saveToGoogleDrive,
  loadFromGoogleDrive,
} from '../../utils/googleDrive';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: any;
  onRestoreState: (state: any) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  appState,
  onRestoreState,
}) => {
  const [clientId, setClientId] = useState(getStoredClientId());
  const [isConnected, setIsConnected] = useState(!!getGoogleAccessToken());
  const [userEmail, setUserEmail] = useState(getActiveGoogleEmail());
  const [showSettings, setShowSettings] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState<'save' | 'load' | null>(null);
  const [copied, setCopied] = useState(false);

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (isOpen) {
      const email = getActiveGoogleEmail();
      const token = getGoogleAccessToken();
      setIsConnected(!!token || !!email);
      setUserEmail(email);
      setClientId(getStoredClientId());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasActiveToken = !!getGoogleAccessToken();

  // Handle Google OAuth Connection / Renew Session
  const handleConnect = async (forceConsent: boolean = false) => {
    setIsConnecting(true);
    setStatusMsg(null);
    try {
      if (!clientId || !clientId.includes('googleusercontent.com')) {
        throw new Error('کلاینت آی‌دی (Client ID) نامعتبر است. لطفاً کلاینت آی‌دی معتبری وارد کنید.');
      }
      const result = await requestGisToken(clientId, forceConsent);
      setGoogleAccessToken(result.token);
      setActiveGoogleEmail(result.email);
      setIsConnected(true);
      setUserEmail(result.email);
      setStatusMsg({
        type: 'success',
        text: `نشست حساب گوگل شما با موفقیت بروزرسانی شد: ${result.email}. هم‌اکنون می‌توانید از همگام‌سازی ابری استفاده کنید.`,
      });
    } catch (err: any) {
      let errorMessage = err.message || 'خطا در برقراری اتصال با گوگل.';
      if (errorMessage.includes('origin_mismatch') || errorMessage.includes('400') || errorMessage.includes('policy')) {
        errorMessage = `خطای ۴۰۰ (عدم همخوانی منشا - origin_mismatch) از طرف گوگل رخ داد. کلاینت آی‌دی شما صحیح است، اما آدرس این سایت در تنظیمات آن در گوگل کلود مجاز نشده است. لطفاً بخش تنظیمات کلاینت آی‌دی (آیکون چرخ‌دنده ⚙️) را باز کرده و راهنما را بخوانید.`;
      }
      setStatusMsg({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    logoutGoogleDrive();
    setIsConnected(false);
    setUserEmail(null);
    setStatusMsg({
      type: 'info',
      text: 'اتصال حساب گوگل با موفقیت قطع شد.',
    });
  };

  // Cloud Save
  const handleCloudSave = async () => {
    if (!isConnected) return;
    setIsSyncing('save');
    setStatusMsg(null);
    try {
      const success = await saveToGoogleDrive(appState);
      if (success) {
        setStatusMsg({
          type: 'success',
          text: 'آخرین وضعیت برنامه‌ریزی شما با موفقیت در فایل "smart_planner_backup.json" گوگل درایو ذخیره شد!',
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'خطا در ذخیره‌سازی ابری. مطمئن شوید تیک دسترسی را در پنجره گوگل زده‌اید.',
      });
    } finally {
      setIsSyncing(null);
    }
  };

  // Cloud Load
  const handleCloudLoad = async () => {
    if (!isConnected) return;
    setIsSyncing('load');
    setStatusMsg(null);
    try {
      const driveState = await loadFromGoogleDrive();
      if (driveState) {
        onRestoreState(driveState);
        setStatusMsg({
          type: 'success',
          text: 'اطلاعات با موفقیت از گوگل درایو شما واکشی شد و جایگزین وضعیت فعلی برنامه شد!',
        });
      } else {
        setStatusMsg({
          type: 'info',
          text: 'هیچ فایل پشتیبانی با نام "smart_planner_backup.json" در گوگل درایو شما یافت نشد. ابتدا گزینه "ذخیره در گوگل درایو" را بزنید.',
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'خطا در بازیابی اطلاعات از گوگل درایو.',
      });
    } finally {
      setIsSyncing(null);
    }
  };

  // Offline File Export
  const handleExportFile = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `smart_planner_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setStatusMsg({
        type: 'success',
        text: 'فایل پشتیبان به صورت یک فایل آفلاین (JSON) با موفقیت در دستگاه شما دانلود شد.',
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'خطا در خروجی گرفتن از فایل پشتیبان.',
      });
    }
  };

  // Offline File Import
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsedState = JSON.parse(event.target?.result as string);
        if (parsedState && typeof parsedState === 'object') {
          onRestoreState(parsedState);
          setStatusMsg({
            type: 'success',
            text: 'اطلاعات با موفقیت از فایل پشتیبان محلی بارگذاری و جایگزین برنامه فعلی شما شد!',
          });
        } else {
          throw new Error('فرمت فایل پشتیبان نامعتبر است.');
        }
      } catch (err: any) {
        setStatusMsg({
          type: 'error',
          text: 'خطا در خواندن فایل پشتیبان. لطفاً مطمئن شوید فایل انتخابی معتبر است.',
        });
      }
    };
    fileReader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Save Custom Client ID
  const handleSaveClientId = () => {
    setStoredClientId(clientId);
    setStatusMsg({
      type: 'success',
      text: 'کلاینت آی‌دی اختصاصی شما با موفقیت ذخیره شد. لطفاً دکمه اتصال به گوگل را بزنید.',
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in font-['Vazirmatn',sans-serif] overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/85 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 text-white p-4.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-teal-200" />
            </div>
            <div className="text-right">
              <h3 className="font-bold text-base">پشتیبان‌گیری ابری و حفظ حریم خصوصی</h3>
              <p className="text-[10px] text-teal-100/90 mt-0.5">
                همگام‌سازی ابری با گوگل درایو و پشتیبان‌گیری محلی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-teal-200 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-600 text-right flex-1">
          
          {/* Status Alert */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 transition-all text-xs ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : statusMsg.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border-rose-200'
                  : 'bg-teal-50 text-teal-900 border-teal-200'
              }`}
            >
              {statusMsg.type === 'success' && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMsg.type === 'error' && <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />}
              {statusMsg.type === 'info' && <Sparkles className="w-4.5 h-4.5 text-teal-600 shrink-0 mt-0.5" />}
              <div className="font-medium leading-relaxed flex-1">{statusMsg.text}</div>
            </div>
          )}



          {/* SECTION 1: GOOGLE DRIVE CLOUD SYNC */}
          <div className="border border-slate-100 rounded-xl bg-slate-50/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-teal-600" />
                <h4 className="font-bold text-slate-800 text-xs">همگام‌سازی ابری گوگل درایو</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="تنظیمات کلاینت آی‌دی اختصاصی"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Custom Client ID Settings Box (Collapsible) */}
            {showSettings && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 text-[10px] text-right">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 text-[11px]">تنظیم کلاینت آی‌دی (Client ID اختصاصی):</p>
                  <p className="text-slate-500 leading-relaxed text-[10px]">
                    اگر از دامنه‌ای اختصاصی مانند <span className="font-mono text-teal-700 font-bold">ssmartplannner.pages.dev</span> استفاده می‌کنید، برای جلوگیری از بروز خطای <span className="font-mono font-bold text-rose-600">origin_mismatch</span> حتماً باید کلاینت آی‌دی خودتان را ثبت و دامنه را در گوگل کلود مجاز کنید.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="xxxx.apps.googleusercontent.com"
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-left text-[10px] bg-slate-50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveClientId}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-all"
                  >
                    ذخیره
                  </button>
                </div>

                {/* CRITICAL: Origin Copy Section */}
                <div className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-xl space-y-1.5">
                  <p className="font-bold text-rose-900 text-[10px]">مرحله بسیار مهم: افزودن مبدا مجاز در گوگل کنسول</p>
                  <p className="text-slate-600 leading-relaxed text-[9px]">
                    گوگل به دلایل امنیتی فقط درخواست‌هایی را می‌پذیرد که آدرس دامنه آن‌ها دقیقاً در کلاینت آی‌دی شما ثبت شده باشد. لطفاً آدرس زیر را کپی کرده و در تنظیمات کلاینت آی‌دی خود در کنسول گوگل در بخش <span className="font-bold text-teal-800">Authorized JavaScript origins</span> قرار دهید:
                  </p>
                  <div className="flex items-center gap-1.5 bg-white p-2 border border-slate-150 rounded-lg">
                    <span className="flex-1 font-mono text-[10px] text-slate-700 text-left select-all overflow-x-auto whitespace-nowrap">
                      {window.location.origin}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyOrigin}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-md font-bold transition-all flex items-center gap-1 text-[9px]"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>کپی آدرس</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1 text-slate-500">
                  <p className="font-bold text-slate-700">چگونه خطا را در کنسول گوگل برطرف کنیم؟</p>
                  <ol className="list-decimal list-inside space-y-1 leading-relaxed text-[9px]">
                    <li>به <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline font-bold">کنسول گوگل کلود</a> بروید و پروژه خود را انتخاب کنید.</li>
                    <li>از منوی کناری به بخش <span className="font-bold">APIs & Services</span> و سپس <span className="font-bold">Credentials</span> بروید.</li>
                    <li>روی کلاینت آی‌دی خود (<span className="font-mono">{clientId ? (clientId.slice(0, 15) + '...') : 'Web Client'}</span>) کلیک کنید تا وارد تنظیمات آن شوید.</li>
                    <li>در بخش <span className="font-bold text-teal-800">Authorized JavaScript origins</span> دکمه <span className="font-bold">ADD URI</span> را بزنید و آدرس کپی شده بالا را جایگذاری کنید.</li>
                    <li>دکمه <span className="font-bold bg-slate-200 px-1 py-0.5 rounded text-slate-700">Save</span> پایین صفحه را بزنید (ممکن است اعمال تغییرات توسط گوگل چند دقیقه طول بکشد).</li>
                  </ol>
                </div>
              </div>
            )}

            {/* CONNECTION CARD */}
            {!isConnected ? (
              <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-150 rounded-xl space-y-2 text-center">
                <Chrome className="w-8 h-8 text-slate-300" />
                <div>
                  <p className="font-bold text-slate-700 text-xs">اتصال به حساب گوگل</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">اطلاعات شما در گوگل درایو شخصی ذخیره خواهد شد.</p>
                </div>
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-center gap-2 p-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-xs disabled:opacity-50 text-[11px] cursor-pointer"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال اتصال به گوگل...</span>
                    </>
                  ) : (
                    <>
                      <Chrome className="w-4 h-4" />
                      <span>اتصال و راه‌اندازی با حساب گوگل</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <div className={`w-2 h-2 rounded-full ${hasActiveToken ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span>متصل به:</span>
                    <span className="font-mono text-slate-600 text-[10px]">{userEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!hasActiveToken && (
                      <button
                        type="button"
                        onClick={() => handleConnect(false)}
                        disabled={isConnecting}
                        className="text-[10px] text-amber-700 bg-amber-100/80 hover:bg-amber-200 px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="تمدید یک-کلیکی نشست گوگل"
                      >
                        <RefreshCw className={`w-3 h-3 ${isConnecting ? 'animate-spin' : ''}`} />
                        <span>تمدید نشست</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-1 text-rose-600 hover:text-rose-800 font-bold hover:underline"
                      title="خروج از حساب گوگل"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>خروج</span>
                    </button>
                  </div>
                </div>

                {!hasActiveToken && (
                  <div className="p-2 bg-amber-50 border border-amber-200/70 rounded-lg text-[10px] text-amber-800 leading-relaxed">
                    💡 <span className="font-bold">نکته امنیتی گوگل:</span> توکن‌های دسترسی گوگل پس از ۱ ساعت منقضی می‌شوند. برنامه‌نویسی جدید طوری انجام شده که هنگام ذخیره یا بازیابی، نشست شما خودکار تمدید شود (یا می‌توانید دکمه «تمدید نشست» بالای صفحه را بزنید).
                  </div>
                )}

                <p className="text-[10px] text-emerald-700 leading-relaxed text-right">
                  تمامی وضعیت اهداف، برنامه‌ها، تراکنش‌ها و یادداشت‌های شما با امنیت کامل در فایلی اختصاصی به نام <span className="font-mono font-bold text-slate-800">smart_planner_backup.json</span> در ریشه گوگل درایو شما ذخیره و بازیابی می‌شود.
                </p>

                {/* Cloud Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCloudSave}
                    disabled={isSyncing !== null}
                    className="flex items-center justify-center gap-1.5 p-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-all text-[10px] cursor-pointer disabled:opacity-50"
                  >
                    {isSyncing === 'save' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>ذخیره در گوگل درایو</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCloudLoad}
                    disabled={isSyncing !== null}
                    className="flex items-center justify-center gap-1.5 p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl shadow-xs transition-all text-[10px] cursor-pointer disabled:opacity-50"
                  >
                    {isSyncing === 'load' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>بازیابی از گوگل درایو</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: OFFLINE BACKUP ACTIONS */}
          <div className="border border-slate-100 rounded-xl bg-slate-50/50 p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Laptop className="w-4 h-4 text-teal-600" />
              <h4 className="font-bold text-slate-800 text-xs">پشتیبان‌گیری دستی فایل (بدون نیاز به اینترنت)</h4>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed text-center">
              شما می‌توانید به عنوان جایگزین آفلاین، نسخه کامل اطلاعات را در دستگاه خود دانلود و نگهداری کنید.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportFile}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] text-[10px] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>دانلود فایل (JSON)</span>
              </button>

              <label
                className="flex items-center justify-center gap-1.5 p-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] text-[10px] cursor-pointer border border-teal-100/60"
              >
                <Upload className="w-3.5 h-3.5 text-teal-500" />
                <span>بارگذاری فایل پشتیبان</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[10px] text-slate-400 leading-relaxed">
            <p className="font-bold text-slate-600 flex items-center gap-1 mb-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>پیشنهاد حریم خصوصی و امنیت:</span>
            </p>
            <p>این برنامه کاملاً کلاینت‌ساید است. هیچ سرور یا دیتابیسی به جز فایل گوگل درایو شخصی شما وجود ندارد و دیتای شما در کمال امنیت خواهد ماند.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-[10px] transition-all cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
