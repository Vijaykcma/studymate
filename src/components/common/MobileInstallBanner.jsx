import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../context/PWAInstallContext';
import { useTheme } from '../../context/ThemeContext';

export const MobileInstallBanner = () => {
  const { isInstalled, isMobile, installApp, openInstallModal, isInstallable } = usePWAInstall();
  const { isDark } = useTheme();
  const [dismissed, setDismissed] = useState(true); // default true until verified in localStorage

  useEffect(() => {
    // Check if dismissed recently (snooze for 3 days)
    try {
      const snoozeUntil = localStorage.getItem('studymate_pwa_banner_snooze');
      if (snoozeUntil && Number(snoozeUntil) > Date.now()) {
        setDismissed(true);
      } else {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      // Snooze for 3 days
      const threeDays = Date.now() + 3 * 24 * 60 * 60 * 1000;
      localStorage.setItem('studymate_pwa_banner_snooze', String(threeDays));
    } catch {
      // Ignore storage errors
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await installApp();
      if (!success) openInstallModal();
    } else {
      openInstallModal();
    }
  };

  // Only show if not installed and on mobile device and not dismissed
  if (isInstalled || !isMobile || dismissed) return null;

  return (
    <aside
      aria-label="Install mobile app prompt"
      className="fixed bottom-18 inset-x-3 sm:bottom-4 sm:inset-x-auto sm:right-4 z-40 max-w-md animate-slideUp"
    >
      <div
        className={`p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 ${
          isDark
            ? 'bg-slate-900/95 border-indigo-500/30 text-white shadow-indigo-500/10'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-400/20'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
            <Smartphone size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-xs truncate">Get StudyMate App</h4>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500 text-white uppercase">
                Free
              </span>
            </div>
            <p className={`text-[11px] truncate ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
              Install for instant study alerts & fast access
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Download size={13} />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className={`p-1.5 rounded-lg transition ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            aria-label="Dismiss banner"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};

