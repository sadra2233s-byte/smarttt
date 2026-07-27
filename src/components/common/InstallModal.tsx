import React, { useState } from 'react';
import { Download, Smartphone, Monitor, CheckCircle2, X, Share, PlusSquare, Menu } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstalled?: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled,
}) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    try {
      setIsInstalling(true);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        if (onInstalled) onInstalled();
        setTimeout(() => {
          onClose();
          setInstallSuccess(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Install error:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden text-right rtl">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-indigo-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <img
              src="/icon.png"
              alt="Smart Planner Icon"
              className="w-12 h-12 rounded-2xl object-cover shadow-md border-2 border-white/30 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-lg font-bold">نصب اپلیکیشن برنامه‌ریز هوشمند</h3>
              <p className="text-xs text-teal-100 mt-0.5">دسترس‌پذیری سریع، کارکرد آفلاین و تجربه اپلیکیشن بومی</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {installSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">برنامه با موفقیت نصب شد!</h4>
              <p className="text-sm text-slate-500">اکنون می‌توانید از طریق منوی دستگاه خود به اپلیکیشن دسترسی داشته باشید.</p>
            </div>
          ) : (
            <>
              {/* If native deferredPrompt is ready */}
              {deferredPrompt ? (
                <div className="bg-teal-50 border border-teal-200/60 rounded-2xl p-4 space-y-3 text-center">
                  <p className="text-sm text-teal-900 font-medium">
                    مرورگر شما آماده نصب مستقیم اپلیکیشن است. با کلیک روی دکمه زیر، برنامه به دستگاه شما اضافه می‌شود.
                  </p>
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    disabled={isInstalling}
                    className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>{isInstalling ? 'در حال نصب...' : 'نصب فوری روی دستگاه'}</span>
                  </button>
                </div>
              ) : null}

              {/* General Manual Instructions */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">راهنمای نصب دستی بر اساس دستگاه</h4>
                
                {/* Android / Chrome */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p className="font-bold text-slate-800 text-sm">اندروید و کروم (Android / Chrome)</p>
                    <p>روی منوی سه نقطه <Menu className="w-3.5 h-3.5 inline mx-0.5 text-slate-500" /> در بالای مرورگر کروم کلیک کنید و گزینه <strong className="text-indigo-600">Install app</strong> یا <strong className="text-indigo-600">افزودن به صفحه اصلی (Add to Home screen)</strong> را انتخاب کنید.</p>
                  </div>
                </div>

                {/* iOS / Safari */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700 shrink-0">
                    <Share className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p className="font-bold text-slate-800 text-sm">آیفون و آیپد (iOS / Safari)</p>
                    <p>در مرورگر سافاری، روی دکمه اشتراک‌گذاری <Share className="w-3.5 h-3.5 inline mx-0.5 text-slate-500" /> ضربه بزنید و سپس گزینه <strong className="text-sky-600">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-slate-500" /> را انتخاب نمایید.</p>
                  </div>
                </div>

                {/* Desktop / PC */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="p-2.5 rounded-xl bg-teal-100 text-teal-700 shrink-0">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p className="font-bold text-slate-800 text-sm">کامپیوتر ویندوز / مک (Desktop)</p>
                    <p>در نوار آدرس مرورگر کروم یا اج، روی آیکون نصب <Download className="w-3.5 h-3.5 inline mx-0.5 text-teal-600" /> در سمت راست یا چپ نوار URL کلیک کنید.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Footer Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
            >
              متوجه شدم / بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
