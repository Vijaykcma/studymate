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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';

export const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen w-64 border-r border-white/10 bg-slate-950 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 shrink-0`}
      >
        <div className="h-full flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
              <Link to="/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <GraduationCap size={22} />
                </div>
                <div>
                  <h1 className="font-bold text-base leading-tight">StudyMate</h1>
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
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
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

              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 mt-6">
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
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
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

          {/* User profile & logout footer */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-sm text-white shrink-0">
                {getInitials(user?.name)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-white">
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
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 h-16 border-b border-white/10 bg-slate-950/95 backdrop-blur px-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-300 hover:text-white"
            aria-label="Open Sidebar"
          >
            <Menu size={22} />
          </button>

          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
              <GraduationCap size={18} />
            </div>
            <span className="font-bold text-sm">StudyMate</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/notifications"
              className="relative p-2 text-slate-300 hover:text-white"
              aria-label="View notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-950" />
              )}
            </Link>

            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-xs">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden flex flex-col">
          {user && !user.isEmailVerified && (
            <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-200">
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
      </div>
    </div>
  );
};
