import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Layers,
  CalendarDays,
  BookOpen,
  MessageSquareWarning,
  ShieldAlert,
  History,
  Sliders,
  UserCheck,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Shield,
  Clock,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout = ({ children, title = 'Administration Desk' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'User Management', path: '/admin/users', icon: Users },
    { label: 'Study Groups', path: '/admin/groups', icon: Layers },
    { label: 'Study Sessions', path: '/admin/sessions', icon: CalendarDays },
    { label: 'Study Materials', path: '/admin/materials', icon: BookOpen },
    { label: 'Message Moderation', path: '/admin/messages', icon: MessageSquareWarning },
    { label: 'Reports & Cases', path: '/admin/reports', icon: ShieldAlert },
    { label: 'Activity Logs', path: '/admin/activity-logs', icon: History },
    { label: 'Platform Settings', path: '/admin/settings', icon: Sliders },
    { label: 'Admin Profile', path: '/admin/profile', icon: UserCheck },
  ];

  const getInitials = (name) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-40 lg:hidden backdrop-blur-md transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen w-72 border-r border-rose-500/10 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 shrink-0`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo & Platform Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-rose-500/10 bg-gradient-to-r from-rose-500/5 to-indigo-500/5">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-rose-500/25 ring-1 ring-white/20">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-rose-200 bg-clip-text text-transparent">
                    StudyMate
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Platform Governance</p>
              </div>
            </Link>

            <button
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close Sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 custom-scrollbar">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Admin Console</span>
              <Sparkles size={12} className="text-rose-400/60" />
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-500/20 to-indigo-500/20 text-white border border-rose-500/30 shadow-lg shadow-rose-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon
                    size={18}
                    className={isActive ? 'text-rose-400' : 'text-slate-400 group-hover:text-slate-200'}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-4 px-3">
              <Link
                to="/dashboard"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-white/[0.03] border border-white/5 hover:border-white/10 transition"
              >
                <span>Student Portal</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </nav>
        </div>

        {/* Admin Account Footer */}
        <div className="p-4 border-t border-rose-500/10 bg-slate-950/80">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md shadow-rose-500/20">
              {getInitials(user?.name)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-white">
                {user?.name || 'Administrator'}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[11px] text-emerald-400 font-medium truncate">
                  Active Admin Session
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="End Administrator Session"
              className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg transition"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-20 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/5"
              aria-label="Open Sidebar"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                Secure Platform Administration & Community Governance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition shadow-sm"
              title="Open Student Portal"
            >
              <GraduationCap size={16} className="text-indigo-400" />
              <span className="hidden sm:inline">Student Portal</span>
            </Link>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Platform Live</span>
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-white/10 text-xs text-slate-400">
              <Clock size={14} className="text-rose-400" />
              <span className="hidden sm:inline">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-slate-950">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
