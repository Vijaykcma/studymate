import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  QrCode,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Zap,
  Bell,
  Laptop,
  Apple,
} from 'lucide-react';
import { usePWAInstall } from '../../context/PWAInstallContext';
import { useTheme } from '../../context/ThemeContext';

export const DownloadAppModal = () => {
  const {
    showInstallModal,
    closeInstallModal,
    installApp,
    isInstallable,
    isInstalled,
    platform: detectedPlatform,
  } = usePWAInstall();

  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('android');
  const [copied, setCopied] = useState(false);

  // Sync tab with detected platform on open
  useEffect(() => {
    if (showInstallModal) {
      if (detectedPlatform === 'ios') setActiveTab('ios');
      else if (detectedPlatform === 'android') setActiveTab('android');
      else setActiveTab('desktop');
    }
  }, [showInstallModal, detectedPlatform]);

  if (!showInstallModal) return null;

  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}/download` : 'https://studymate-h7r1.onrender.com/download';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}&margin=10`;

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDirectInstall = async () => {
    await installApp();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={closeInstallModal}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-slate-900 border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient banner */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <button
            onClick={closeInstallModal}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shadow-lg shrink-0">
              <Smartphone size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight">StudyMate Mobile App</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-400 text-slate-950 shadow-sm">
                  100% Free
                </span>
              </div>
              <p className="text-xs text-indigo-100">
                Install directly on your phone with zero app store hassle
              </p>
            </div>
          </div>

          {/* Platform Tab Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/25 backdrop-blur mt-3">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-white text-indigo-950 shadow-md'
                  : 'text-indigo-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Smartphone size={14} />
              <span>Android</span>
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white text-indigo-950 shadow-md'
                  : 'text-indigo-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Apple size={14} />
              <span>iPhone / iOS</span>
            </button>
            <button
              onClick={() => setActiveTab('desktop')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'desktop'
                  ? 'bg-white text-indigo-950 shadow-md'
                  : 'text-indigo-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Laptop size={14} />
              <span>PC / Mac</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto no-scrollbar">
          {/* ANDROID TAB */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-indigo-950/30 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow">
                    <Download size={16} />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-900'}`}>
                      Instant 1-Click Android WebAPK
                    </h4>
                    <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-indigo-200/80' : 'text-indigo-700'}`}>
                      Install StudyMate like a native application with dedicated home screen launcher icon, full-screen view, and offline study notes.
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleDirectInstall}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition shadow-lg shadow-indigo-600/25 active:scale-[0.99] cursor-pointer"
                  >
                    <Download size={16} />
                    <span>{isInstalled ? 'App Already Installed (Open App)' : 'Install StudyMate on Android'}</span>
                  </button>
                </div>
              </div>

              {/* Alternative Chrome Android Guide */}
              <div className="space-y-2">
                <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Manual Install Steps (Chrome / Samsung Internet):
                </p>
                <div className="space-y-2 text-xs">
                  <div className={`flex items-center gap-3 p-2.5 rounded-xl border ${isDark ? 'bg-slate-800/50 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                    <span>Tap the three vertical dots (<strong className="text-indigo-400">⋮</strong>) at the top right of your browser.</span>
                  </div>
                  <div className={`flex items-center gap-3 p-2.5 rounded-xl border ${isDark ? 'bg-slate-800/50 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                    <span>Select <strong className="text-indigo-400">"Install app"</strong> or <strong className="text-indigo-400">"Add to Home screen"</strong>.</span>
                  </div>
                  <div className={`flex items-center gap-3 p-2.5 rounded-xl border ${isDark ? 'bg-slate-800/50 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                    <span>Confirm by tapping <strong className="text-indigo-400">"Install"</strong> — the app is now on your home screen!</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IOS TAB */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Apple size={18} className="text-indigo-400" />
                  <h4 className="text-sm font-bold">Install on iPhone / iPad in 3 Taps</h4>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Apple requires Safari to install home screen apps. Follow these simple steps in <strong>Safari</strong>:
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className={`flex items-start gap-3 p-3 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <Share2 size={16} />
                  </div>
                  <div>
                    <strong className="block font-semibold mb-0.5">1. Tap the Share Button</strong>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      In Safari’s bottom toolbar (or top on iPad), tap the <strong>Share</strong> icon (square with arrow pointing up).
                    </span>
                  </div>
                </div>

                <div className={`flex items-start gap-3 p-3 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <PlusSquare size={16} />
                  </div>
                  <div>
                    <strong className="block font-semibold mb-0.5">2. Choose "Add to Home Screen"</strong>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Scroll down in the share sheet and tap <strong>"Add to Home Screen"</strong>.
                    </span>
                  </div>
                </div>

                <div className={`flex items-start gap-3 p-3 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <Check size={16} />
                  </div>
                  <div>
                    <strong className="block font-semibold mb-0.5">3. Tap "Add" at the Top Right</strong>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Confirm name "StudyMate" and tap <strong>Add</strong>. It will open as a full-screen native mobile application!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DESKTOP / PC TAB */}
          {activeTab === 'desktop' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* QR Code */}
                <div className={`p-4 rounded-2xl border flex flex-col items-center text-center ${isDark ? 'bg-slate-800/40 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="p-2 rounded-xl bg-white shadow-md mb-2">
                    <img
                      src={qrCodeUrl}
                      alt="StudyMate Mobile QR Code"
                      className="w-36 h-36 rounded-lg object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                    <QrCode size={14} />
                    <span>Scan with Phone Camera</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Opens mobile download page on your device instantly.
                  </p>
                </div>

                {/* Direct PC Install or Link Share */}
                <div className="space-y-3">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                    <h5 className="text-xs font-bold mb-1 flex items-center gap-1.5">
                      <Laptop size={14} className="text-indigo-400" />
                      <span>Desktop Application</span>
                    </h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                      Install StudyMate onto Windows / macOS dock or taskbar for quick keyboard navigation.
                    </p>
                    <button
                      onClick={handleDirectInstall}
                      className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Download size={13} />
                      <span>Install on this Computer</span>
                    </button>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                      Send Link to Your Phone:
                    </span>
                    <button
                      onClick={handleCopyLink}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                        copied
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : isDark
                          ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Direct App Link'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feature Highlights Grid */}
          <div className={`pt-3 border-t grid grid-cols-3 gap-2 text-center ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <div className="p-2">
              <Zap size={16} className="mx-auto text-amber-400 mb-1" />
              <p className="text-[11px] font-bold">Fast & Lightweight</p>
              <p className="text-[10px] text-slate-400">0 MB storage overhead</p>
            </div>
            <div className="p-2">
              <Bell size={16} className="mx-auto text-cyan-400 mb-1" />
              <p className="text-[11px] font-bold">Real-Time Alerts</p>
              <p className="text-[10px] text-slate-400">Sessions & messages</p>
            </div>
            <div className="p-2">
              <ShieldCheck size={16} className="mx-auto text-emerald-400 mb-1" />
              <p className="text-[11px] font-bold">Encrypted & Safe</p>
              <p className="text-[10px] text-slate-400">Student privacy first</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between text-xs ${
          isDark ? 'bg-slate-950/70 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <span>Version 2.4 • Progressive Web App (PWA)</span>
          <button
            onClick={closeInstallModal}
            className="hover:underline font-medium text-indigo-400 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

