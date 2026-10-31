import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  QrCode,
  Check,
  Copy,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Zap,
  Bell,
  Laptop,
  Apple,
  ArrowRight,
  WifiOff,
  Code,
  Users,
  Video,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { usePWAInstall } from '../context/PWAInstallContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { DownloadAppModal } from '../components/common/DownloadAppModal';

export default function DownloadApp() {
  const { installApp, isInstallable, isInstalled, isMobile, platform, openInstallModal } = usePWAInstall();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}/download` : 'https://studymate-h7r1.onrender.com/download';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(currentUrl)}&margin=12`;

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrimaryInstall = async () => {
    if (isInstallable) {
      const res = await installApp();
      if (!res) openInstallModal();
    } else {
      openInstallModal();
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-200`}>
      {/* Top Navigation */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md ${isDark ? 'border-white/10 bg-slate-950/80' : 'border-slate-200 bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <span className={`font-bold text-base leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>StudyMate</span>
              <span className="block text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Mobile App</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to={user ? '/dashboard' : '/login'}
              className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition ${
                isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {user ? 'Go to Dashboard' : 'Sign In'}
            </Link>

            <button
              onClick={handlePrimaryInstall}
              className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>{isInstalled ? 'App Installed' : 'Install App'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles size={14} className="text-amber-400" />
                <span>Next-Generation Progressive Mobile App (PWA)</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Study with Peers Anywhere.{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Direct Mobile Install.
                </span>
              </h1>

              <p className={`text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Install the complete StudyMate mobile app directly from your browser. 
                Enjoy instantaneous loading, live video study calls, peer messaging, offline material access, and zero app store download fees.
              </p>

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                  isDark ? 'bg-slate-900 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <Zap size={14} className="text-amber-400" />
                  <span>0 MB Storage Bloat</span>
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                  isDark ? 'bg-slate-900 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <Bell size={14} className="text-cyan-400" />
                  <span>Real-Time Notifications</span>
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                  isDark ? 'bg-slate-900 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>100% Free for Students</span>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-3">
                <button
                  onClick={handlePrimaryInstall}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Download size={18} />
                  <span>{isInstalled ? 'App Already Installed' : 'Install StudyMate App'}</span>
                </button>

                <button
                  onClick={openInstallModal}
                  className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm transition border cursor-pointer flex items-center justify-center gap-2 ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-sm'
                  }`}
                >
                  <Smartphone size={18} className="text-indigo-400" />
                  <span>View Install Guides (iOS / Android)</span>
                </button>
              </div>

              {/* User device note */}
              <p className="text-xs text-slate-400">
                Detected device: <strong className="text-indigo-400 capitalize">{platform}</strong> • Compatible with Android, iOS, Windows, Mac & Linux.
              </p>
            </div>

            {/* Right Interactive Mockup & QR Card */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl relative ${
                isDark ? 'bg-slate-900/90 border-white/10' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                      <GraduationCap size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">StudyMate App</h3>
                      <p className="text-[11px] text-slate-400">Mobile Edition</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    LIVE
                  </span>
                </div>

                {/* QR Code Presentation */}
                <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-950/20 border border-white/5">
                  <div className="p-3 rounded-2xl bg-white shadow-lg mb-3">
                    <img
                      src={qrCodeUrl}
                      alt="Scan StudyMate Mobile QR Code"
                      className="w-44 h-44 rounded-xl object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                    <QrCode size={16} />
                    <span>Scan with Phone Camera</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Point your camera to open and install StudyMate directly on your mobile device.
                  </p>
                </div>

                {/* Copy Link Button */}
                <div className="mt-4">
                  <button
                    onClick={handleCopyLink}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer border ${
                      copied
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : isDark
                        ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    }`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Direct App Link'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className={`py-16 border-t ${isDark ? 'border-white/10 bg-slate-900/50' : 'border-slate-200 bg-slate-100/60'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Built for Modern Collaborative Learning
            </h2>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Everything you need to collaborate with your classmates, ace your exams, and build projects together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className={`p-6 rounded-3xl border transition hover:border-indigo-500/50 ${
              isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-base font-bold mb-1.5">Smart Study Groups</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Discover and join semester-specific study groups matching your subjects, MCA curriculum, and target goals.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`p-6 rounded-3xl border transition hover:border-indigo-500/50 ${
              isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Video size={24} />
              </div>
              <h3 className="text-base font-bold mb-1.5">Live Audio & Video Study Rooms</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Start peer study sessions directly in your mobile browser with screen sharing and instant microphone toggle.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`p-6 rounded-3xl border transition hover:border-indigo-500/50 ${
              isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <Sparkles size={24} />
              </div>
              <h3 className="text-base font-bold mb-1.5">StudyMate AI Assistant (100% Free)</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Personalized 24/7 college study partner to explain complex coding topics, recommend classmates, and solve academic doubts.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`p-6 rounded-3xl border transition hover:border-indigo-500/50 ${
              isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Code size={24} />
              </div>
              <h3 className="text-base font-bold mb-1.5">Real-Time Code Executor</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Run JavaScript, Python, C++, and Java code on-the-go with instant output and collaborative syntax highlighting.
              </p>
            </div>

            {/* Feature 5 */}
            <div className={`p-6 rounded-3xl border transition hover:border-indigo-500/50 ${
              isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <WifiOff size={24} />
              </div>
              <h3 className="text-base font-bold mb-1.5">Offline-Ready Architecture</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Service worker caches your study resources and navigation shell so you can keep reading even during network interruptions.
              </p>
            </div>

            {/* Feature 6 */}
            <div className={`p-6 rounded-3xl border transition hover:border-indigo-500/50 ${
              isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                <Zap size={24} />
              </div>
              <h3 className="text-base font-bold mb-1.5">Zero Storage Penalty</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Unlike bulky 100MB native app store binaries, StudyMate PWA uses tiny cached assets and stays automatically updated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Step-by-Step Instructions */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Easy Installation in Under 30 Seconds
            </h2>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Select your platform below to view the simple visual instructions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Android Guide */}
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Android Installation (Chrome / Samsung)</h3>
                  <p className="text-xs text-slate-400">1-click WebAPK deployment</p>
                </div>
              </div>

              <ol className="space-y-3 text-xs">
                <li className={`p-3 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Open this website (<code className="text-indigo-400 font-mono">studymate-h7r1.onrender.com</code>) in Google Chrome or Samsung Internet.</span>
                </li>
                <li className={`p-3 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Tap the <strong>"Install App"</strong> button above, or tap the three dots (<strong>⋮</strong>) in the top-right corner.</span>
                </li>
                <li className={`p-3 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong> and confirm. StudyMate is now installed on your app drawer!</span>
                </li>
              </ol>

              <button
                onClick={handlePrimaryInstall}
                className="w-full mt-4 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download size={14} />
                <span>Install on Android Now</span>
              </button>
            </div>

            {/* iOS Guide */}
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Apple size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">iOS Installation (iPhone / iPad)</h3>
                  <p className="text-xs text-slate-400">Apple Safari Add to Home Screen</p>
                </div>
              </div>

              <ol className="space-y-3 text-xs">
                <li className={`p-3 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Open this website in <strong>Apple Safari</strong> browser on your iPhone or iPad.</span>
                </li>
                <li className={`p-3 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Tap the <strong>Share</strong> button (<Share2 size={12} className="inline mx-1 text-indigo-400" /> square with arrow pointing up) at the bottom toolbar.</span>
                </li>
                <li className={`p-3 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Scroll down and tap <strong className="text-indigo-400">"Add to Home Screen"</strong>, then tap <strong>"Add"</strong> in the top right.</span>
                </li>
              </ol>

              <button
                onClick={openInstallModal}
                className="w-full mt-4 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PlusSquare size={14} />
                <span>Show iOS Walkthrough</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={`py-16 border-t ${isDark ? 'border-white/10 bg-slate-900/30' : 'border-slate-200 bg-slate-100/40'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-bold">Frequently Asked Questions</h2>
            <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Everything you need to know about StudyMate Mobile PWA.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
              <h4 className="font-bold text-sm mb-1 text-indigo-400">Do I need to pay any amount or download from Google Play / App Store?</h4>
              <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                No! StudyMate is 100% free forever for all college students. You do not need to pay anything, and there is no need to create an app store account. You can install it directly from our website in seconds.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
              <h4 className="font-bold text-sm mb-1 text-indigo-400">How do updates work? Do I have to re-download?</h4>
              <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                Updates happen automatically in the background via our Service Worker! Whenever our team rolls out new study features, code execution capabilities, or AI models, the app updates seamlessly when you open it.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
              <h4 className="font-bold text-sm mb-1 text-indigo-400">Can I access my account on multiple devices?</h4>
              <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                Yes! Your groups, chat messages, scheduled study sessions, and study materials sync in real-time across your phone, tablet, and laptop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 border-t text-center text-xs ${isDark ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
        <p>© {new Date().getFullYear()} StudyMate • Digital Study Group Finder & Mobile Learning Portal</p>
      </footer>

      {/* Reusable Install Modal */}
      <DownloadAppModal />
    </div>
  );
}

