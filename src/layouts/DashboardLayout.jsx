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
  Smartphone,
  Download,
  Bot,
  CheckCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePWAInstall } from '../context/PWAInstallContext';
import notificationService from '../services/notificationService';
import { StudyMateAIBot } from '../components/ai/StudyMateAIBot';
import { MobileInstallBanner } from '../components/common/MobileInstallBanner';

export const DashboardLayout = ({ children, fullHeight = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { openInstallModal, isInstalled } = usePWAInstall();

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

  // Auto-close mobile sidebar and popovers when user navigates
  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  // Lock body scroll and handle Escape key when mobile sidebar or menus are open
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

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'membership_request':
      case 'membership_approved':
      case 'membership_rejected':
      case 'group_invite':
        return <Users size={16} className="text-indigo-400" />;
      case 'session_reminder':
      case 'new_session':
        return <CalendarDays size={16} className="text-cyan-400" />;
      case 'new_material':
        return <BookOpen size={16} className="text-emerald-400" />;
      case 'new_message':
        return <MessageCircle size={16} className="text-amber-400" />;
      default:
        return <Bell size={16} className="text-indigo-400" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const toggleNotifications = async () => {
    const nextState = !notificationsOpen;
    setNotificationsOpen(nextState);
    setUserMenuOpen(false);
    if (nextState) {
      try {
        setLoadingNotifications(true);
        const res = await notificationService.getNotifications({ limit: 5 });
        if (res.success) {
          setRecentNotifications(res.notifications || []);
          setUnreadCount(res.unreadCount || 0);
        }
      } catch {
        // silent fallback
      } finally {
        setLoadingNotifications(false);
      }
    }
  };

  const handleMarkNotificationRead = async (item) => {
    try {
      if (!item.isRead) {
        await notificationService.markAsRead(item._id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setRecentNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );
      }
    } catch {
      // silent fallback
    }
    setNotificationsOpen(false);

    if (item.actionUrl) {
      navigate(item.actionUrl);
    } else if (item.relatedGroup) {
      navigate(`/groups/${item.relatedGroup._id || item.relatedGroup}`);
    } else if (item.relatedSession) {
      navigate('/sessions');
    } else if (item.type === 'new_message') {
      navigate('/messages');
    } else {
      navigate('/notifications');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent fallback
    }
  };

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
    <div className={`${isFullHeight ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'} ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} flex transition-colors duration-200`}>
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
            {/* Quick Mobile App Install Card in Sidebar (Only shown if NOT already installed) */}
            {!isInstalled && (
              <div className="px-4 pb-2">
                <button
                  onClick={() => openInstallModal()}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition group cursor-pointer ${
                    isDark
                      ? 'bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border-indigo-500/30 hover:border-indigo-400/60 text-white shadow-lg shadow-indigo-950/50'
                      : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-300 text-indigo-950 shadow-sm'
                  }`}
                  title="Get StudyMate Mobile App"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
                      <Smartphone size={16} />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold leading-tight truncate">Mobile App</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500 text-white uppercase shrink-0">
                          Free
                        </span>
                      </div>
                      <p className={`text-[10px] truncate ${isDark ? 'text-indigo-300/80' : 'text-indigo-600'}`}>
                        Download / Install
                      </p>
                    </div>
                  </div>
                  <Download size={14} className="text-indigo-400 group-hover:translate-y-0.5 transition shrink-0 ml-1" />
                </button>
              </div>
            )}

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
              <Link to="/profile" className="flex items-center gap-3 flex-1 min-w-0 group" title="View My Profile">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-sm text-white shrink-0 group-hover:scale-105 transition-transform">
                  {getInitials(user?.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate group-hover:text-indigo-400 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {user?.name || 'Student'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user?.department || 'MCA'} • {user?.semester || 'Semester'}
                  </p>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                title="Log out"
                className="text-slate-400 hover:text-rose-400 transition p-1 cursor-pointer"
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
      <div className={`flex-1 min-h-0 min-w-0 max-w-full w-full flex flex-col ${isFullHeight ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'}`}>
        {/* Mobile top bar */}
        <header className={`lg:hidden sticky top-0 z-40 h-16 border-b shrink-0 transform-gpu ${
          isDark ? 'border-white/10 bg-slate-950/95' : 'border-slate-200 bg-white/95'
        } backdrop-blur px-4 flex items-center justify-between`}>
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-md">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className={`font-bold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>StudyMate</span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick App Install Button on Mobile Header (Only if NOT installed) */}
            {!isInstalled && (
              <button
                onClick={() => openInstallModal()}
                className={`p-2 rounded-lg transition ${
                  isDark ? 'text-indigo-400 hover:text-white hover:bg-white/10' : 'text-indigo-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Download or Install Mobile App"
                aria-label="Download or Install Mobile App"
              >
                <Smartphone size={18} />
              </button>
            )}

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition ${
                isDark ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>

            {/* Notification Bell Dropdown Anchor */}
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className={`relative p-2 rounded-xl transition cursor-pointer ${
                  notificationsOpen
                    ? isDark
                      ? 'bg-indigo-600/20 text-indigo-400'
                      : 'bg-indigo-50 text-indigo-600'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-white/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                aria-label="View notifications"
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-slate-950 animate-pulse" />
                )}
              </button>

              {/* Notifications Popover Panel */}
              {notificationsOpen && (
                <div
                  className={`fixed inset-x-3 top-16 max-w-sm mx-auto sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150 ${
                    isDark
                      ? 'bg-slate-900/98 border-white/15 text-white shadow-black/80'
                      : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
                  }`}
                >
                  {/* Notifications Header */}
                  <div className={`p-3.5 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-indigo-400" />
                      <h4 className="font-bold text-sm">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white shadow-sm">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllNotificationsRead}
                        className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Mark all as read"
                      >
                        <CheckCheck size={14} />
                        <span>Read all</span>
                      </button>
                    )}
                  </div>

                  {/* Notifications Content */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                    {loadingNotifications ? (
                      <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p>Loading notifications...</p>
                      </div>
                    ) : recentNotifications.length === 0 ? (
                      <div className="py-8 px-4 text-center space-y-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto ${
                          isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <Bell size={18} />
                        </div>
                        <p className="text-xs font-medium text-slate-400">All caught up! No new notifications.</p>
                      </div>
                    ) : (
                      recentNotifications.map((item) => (
                        <div
                          key={item._id}
                          onClick={() => handleMarkNotificationRead(item)}
                          className={`p-3 transition-colors cursor-pointer flex items-start gap-3 text-left ${
                            !item.isRead
                              ? isDark
                                ? 'bg-indigo-950/30 hover:bg-indigo-950/50'
                                : 'bg-indigo-50/70 hover:bg-indigo-100/70'
                              : isDark
                              ? 'hover:bg-white/5'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isDark ? 'bg-slate-800' : 'bg-slate-100'
                          }`}>
                            {getNotificationIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-xs font-semibold truncate ${
                                !item.isRead ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-400'
                              }`}>
                                {item.title}
                              </p>
                              {!item.isRead && (
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                              {item.message}
                            </p>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-mono">
                              <Clock size={10} />
                              {formatTimeAgo(item.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Notifications Footer */}
                  <div className={`p-2.5 border-t text-center ${isDark ? 'border-white/10 bg-slate-950/60' : 'border-slate-100 bg-slate-50'}`}>
                    <Link
                      to="/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <span>View all notifications</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar Dropdown Anchor */}
            <div className="relative">
              <button
                onClick={() => {
                  setUserMenuOpen((prev) => !prev);
                  setNotificationsOpen(false);
                }}
                className={`w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-xs text-white shadow-md active:scale-95 transition-all cursor-pointer ring-2 ${
                  userMenuOpen ? 'ring-indigo-400 ring-offset-2 ring-offset-slate-950' : 'ring-transparent'
                }`}
                title="Account menu"
                aria-label="User account menu"
              >
                {getInitials(user?.name)}
              </button>

              {/* User Profile Popover Panel */}
              {userMenuOpen && (
                <div
                  className={`absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl border shadow-2xl z-50 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150 ${
                    isDark
                      ? 'bg-slate-900/98 border-white/15 text-white shadow-black/80'
                      : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
                  }`}
                >
                  {/* User Profile Header Card */}
                  <div className={`p-3.5 border-b ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md">
                        {getInitials(user?.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {user?.name || 'Student'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {user?.email || 'student@studymate.edu'}
                        </p>
                        <span className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {user?.department || 'MCA'} • {user?.semester || 'Semester'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="p-2 space-y-1">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <User size={15} className="text-indigo-400" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Settings size={15} className="text-indigo-400" />
                      <span>Settings</span>
                    </Link>

                    {user?.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Shield size={15} />
                          <span>Admin Console</span>
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </Link>
                    )}
                  </div>

                  {/* Sign Out Button */}
                  <div className={`p-2 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut size={15} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Backdrop overlay when Notifications or User Menu is open */}
        {(notificationsOpen || userMenuOpen) && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] transition-opacity"
            onClick={() => {
              setNotificationsOpen(false);
              setUserMenuOpen(false);
            }}
            aria-hidden="true"
          />
        )}

        <main className={`flex-1 min-h-0 min-w-0 max-w-full w-full overflow-x-hidden flex flex-col ${isFullHeight ? 'overflow-hidden' : 'pb-28 lg:pb-0'}`}>
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

        {/* Floating Mobile Install Banner */}
        <MobileInstallBanner />

        {/* Native Mobile Bottom Navigation Bar (Phone-sized viewports & installable mobile app) */}
        <nav
          aria-label="Mobile Bottom Navigation"
          className={`lg:hidden fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl transform-gpu transition-colors duration-200 ${
            isDark
              ? 'bg-slate-950/92 border-white/10 text-white'
              : 'bg-white/95 border-slate-200 text-slate-800'
          } pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.15)]`}
        >
          <div className="h-16 flex items-center justify-around px-1 max-w-lg mx-auto">
            {/* 1. Home / Dashboard */}
            <Link
              to="/dashboard"
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 ${
                location.pathname === '/dashboard'
                  ? 'text-indigo-500 font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard size={20} className={location.pathname === '/dashboard' ? 'stroke-[2.5]' : ''} />
              <span className="text-[10px] mt-1 tracking-tight font-medium">Home</span>
              {location.pathname === '/dashboard' && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-0.5" />
              )}
            </Link>

            {/* 2. Groups */}
            <Link
              to="/groups"
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 ${
                location.pathname.startsWith('/groups')
                  ? 'text-indigo-500 font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Search size={20} className={location.pathname.startsWith('/groups') ? 'stroke-[2.5]' : ''} />
              <span className="text-[10px] mt-1 tracking-tight font-medium">Groups</span>
              {location.pathname.startsWith('/groups') && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-0.5" />
              )}
            </Link>

            {/* 3. StudyMate AI Central Action Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-studymate-ai'))}
              className="flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 group cursor-pointer"
              title="StudyMate AI Assistant"
              aria-label="Open StudyMate AI"
            >
              <div className="w-11 h-11 -mt-5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-white">
                  <Bot size={21} className="text-cyan-300" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-400 mt-1">AI Mate</span>
            </button>

            {/* 4. Messages */}
            <Link
              to="/messages"
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 ${
                location.pathname === '/messages'
                  ? 'text-indigo-500 font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <MessageCircle size={20} className={location.pathname === '/messages' ? 'stroke-[2.5]' : ''} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-600 text-white min-w-4 text-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight font-medium">Messages</span>
              {location.pathname === '/messages' && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-0.5" />
              )}
            </Link>

            {/* 5. More Menu Drawer */}
            <button
              onClick={() => setSidebarOpen(true)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 cursor-pointer ${
                sidebarOpen
                  ? 'text-indigo-500 font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              aria-label="Open More Menu Drawer"
            >
              <Menu size={20} />
              <span className="text-[10px] mt-1 tracking-tight font-medium">More</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};
