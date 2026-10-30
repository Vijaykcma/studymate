import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings,
  Users,
  X,
  User,
  Shield,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  Bell,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import notificationService from '../services/notificationService';
import { StudyMateAIBot } from '../components/ai/StudyMateAIBot';

export const DashboardLayout = ({ children, fullHeight = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const isFullHeight = fullHeight || location.pathname === '/messages';

  useEffect(() => {
    let isMounted = true;
    const loadUnread = async () => {
      try {
        const res = await notificationService.getNotifications({ unreadOnly: 'true' });
        if (isMounted && res.success) {
          setUnreadCount(res.unreadCount || 0);
        }
      } catch {
        // Silent fallback
      }
    };

    if (user) {
      loadUnread();
    }

    return () => {
      isMounted = false;
    };
  }, [user, location.pathname]);

  // Auto-close mobile sidebar when user navigates
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll and handle Escape key when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setSidebarOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Find Study Groups', path: '/groups', icon: Search },
    { label: 'My Groups', path: '/my-groups', icon: Users },
    { label: 'Study Sessions', path: '/sessions', icon: CalendarDays },
    { label: 'Study Materials', path: '/materials', icon: BookOpen },
    { label: 'Messages', path: '/messages', icon: MessageCircle },
    { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'Real-Time Executor', path: '/executor', icon: Terminal },
  ];

  const accountItems = [
    { label: 'My Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const getInitials = (name) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={`${isFullHeight ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'} ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} flex transition-colors duration-200`}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen w-64 border-r ${
          isDark ? 'border-white/10 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-800'
        } transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } lg:translate-x-0 shrink-0`}
      >
        <div className="h-full flex flex-col justify-between overflow-y-auto overflow-x-hidden">
          <div>
            {/* Logo */}
            <div className={`h-20 flex items-center justify-between px-6 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <GraduationCap size={22} className="text-white" />
                </div>
                <div>
                  <h1 className={`font-bold text-base leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>StudyMate</h1>
                  <p className="text-[11px] text-slate-500">Student Portal</p>
                </div>
              </Link>

              <button
                className="lg:hidden text-slate-400 hover:text-white"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close Sidebar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="px-4 py-5">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Main Menu
              </p>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                          : isDark
                          ? 'text-slate-400 hover:text-white hover:bg-white/5'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </div>
                      {Boolean(item.badge) && item.badge > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <p className={`px-3 text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2 mt-6`}>
                Account
              </p>

              <div className="space-y-1">
                {accountItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                          : isDark
                          ? 'text-slate-400 hover:text-white hover:bg-white/5'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {user?.role === 'admin' && (
                <div className="pt-4 px-1">
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 transition shadow-lg shadow-rose-600/25 border border-rose-400/30 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield size={16} className="text-rose-200" />
                      <span>Admin Console</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </Link>
                </div>
              )}
            </nav>
          </div>

          <div>
            {/* Theme switch toggle in sidebar */}
          <div className={`px-4 py-2 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              <div className="flex items-center gap-2.5">
                {isDark ? (
                  <Sun size={15} className="text-amber-400" />
                ) : (
                  <Moon size={15} className="text-indigo-600" />
                )}
                <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase ${
                isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700 font-bold'
              }`}>
                {theme}
              </span>
            </button>
          </div>

          {/* User profile & logout footer */}
          <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <div className={`flex items-center gap-3 p-2.5 rounded-xl ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-sm text-white shrink-0">
                {getInitials(user?.name)}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {user?.name || 'Student'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.department || 'MCA'} • {user?.semester || 'Semester'}
                </p>
              </div>

              <button
                onClick={handleLogout}
                title="Log out"
                className="text-slate-400 hover:text-rose-400 transition p-1"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>

      {/* Main Content Area */}
      <div className={`flex-1 min-w-0 max-w-full w-full flex flex-col ${isFullHeight ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'}`}>
        {/* Mobile top bar */}
        <header className={`lg:hidden sticky top-0 z-30 h-16 border-b shrink-0 ${
          isDark ? 'border-white/10 bg-slate-950/95' : 'border-slate-200 bg-white/95'
        } backdrop-blur px-4 flex items-center justify-between`}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={`p-2.5 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center transition cursor-pointer ${
              isDark
                ? 'text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/15'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200'
            }`}
            aria-label="Open Sidebar Navigation Menu"
          >
            <Menu size={22} />
          </button>

          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
              <GraduationCap size={18} />
            </div>
            <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>StudyMate</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>
            <Link
              to="/notifications"
              className={`relative p-2 ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              aria-label="View notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-950" />
              )}
            </Link>

            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-xs text-white">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        <main className={`flex-1 min-w-0 max-w-full w-full overflow-x-hidden flex flex-col ${isFullHeight ? 'h-full overflow-hidden' : ''}`}>
          {user && !user.isEmailVerified && (
            <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-200 shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                <span>
                  <strong>Email Verification Pending:</strong> Your account (<span className="text-white font-medium">{user.email}</span>) needs verification to unlock all verified student privileges.
                </span>
              </div>
              <Link
                to="/verify-email"
                state={{ email: user.email }}
                className="px-3.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shrink-0 shadow text-xs"
              >
                Verify Email Now
              </Link>
            </div>
          )}
          {children}
        </main>

        {/* Floating StudyMate AI Assistant Widget (100% Free) */}
        <StudyMateAIBot />
      </div>
    </div>
  );
};
