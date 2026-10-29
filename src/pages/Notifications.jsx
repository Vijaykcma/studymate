import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Users,
  Calendar,
  BookOpen,
  MessageCircle,
  ExternalLink,
  Shield,
  Clock,
  Filter,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import notificationService from '../services/notificationService';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({
        unreadOnly: filterUnread ? 'true' : 'false',
        limit: 50,
      });

      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterUnread]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setActionLoading(true);
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await notificationService.deleteNotification(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'membership_request':
      case 'membership_approved':
      case 'membership_rejected':
      case 'group_invite':
        return <Users className="w-5 h-5 text-indigo-400" />;
      case 'session_reminder':
      case 'new_session':
        return <Calendar className="w-5 h-5 text-cyan-400" />;
      case 'new_material':
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case 'new_message':
        return <MessageCircle className="w-5 h-5 text-amber-400" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-400" />;
    }
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500 text-white shadow-md shadow-indigo-500/25">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Stay up-to-date with your study groups, session schedules, and invites.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={actionLoading}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-indigo-400" />
                Mark all as read
              </button>
            )}

            {/* Filter Toggle */}
            <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => setFilterUnread(false)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  !filterUnread ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterUnread(true)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterUnread ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Unread
              </button>
            </div>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-slate-800 rounded" />
                  <div className="h-3 w-3/4 bg-slate-800/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto text-slate-500">
              <Bell className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">No notifications to display</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                {filterUnread
                  ? "You've read all your notifications! Switch to 'All' to view history."
                  : 'You have no notifications yet. When you join groups or schedule sessions, updates will appear here.'}
              </p>
            </div>
            {filterUnread && (
              <button
                onClick={() => setFilterUnread(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
              >
                View All Notifications
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item._id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !item.isRead
                    ? 'bg-slate-900/90 border-indigo-500/30 shadow-md shadow-indigo-500/5'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-800'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-white text-sm sm:text-base">
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      )}
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {item.message}
                    </p>

                    {item.relatedGroup && (
                      <div className="pt-1">
                        <Link
                          to={`/groups/${item.relatedGroup._id || item.relatedGroup}`}
                          onClick={() => !item.isRead && handleMarkAsRead(item._id)}
                          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          View Study Group <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t border-slate-800/50 sm:border-0 w-full sm:w-auto justify-end">
                  {!item.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(item._id)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-400 transition-colors"
                      title="Mark as Read"
                      aria-label="Mark as Read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  {item.actionUrl && (
                    <Link
                      to={item.actionUrl}
                      onClick={() => !item.isRead && handleMarkAsRead(item._id)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/20 flex items-center gap-1 transition-colors"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}

                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete Notification"
                    aria-label="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
