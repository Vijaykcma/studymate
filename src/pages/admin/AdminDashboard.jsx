import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Layers,
  CalendarDays,
  BookOpen,
  ShieldAlert,
  HardDrive,
  UserCheck,
  UserX,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Clock,
  Activity,
  Sliders,
  History,
  AlertTriangle,
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { adminAPI } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30');

  const fetchDashboardStats = async (days = timeRange) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getStats({ days });
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to load live administrator metrics. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats(timeRange);
  }, [timeRange]);

  return (
    <AdminLayout title="Governance & Metrics Dashboard">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-lg">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Platform Overview</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time aggregate data across all campus departments, study groups, sessions, and materials.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>

          <button
            onClick={() => fetchDashboardStats(timeRange)}
            disabled={loading}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition disabled:opacity-50"
            title="Refresh Metrics"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-rose-400' : ''} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchDashboardStats(timeRange)}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered Users */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-lg hover:border-indigo-500/30 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Accounts</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mb-2">
            {loading ? '...' : stats?.users?.total || 0}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
            <span className="flex items-center gap-1 text-emerald-400">
              <UserCheck size={13} /> {stats?.users?.active || 0} active
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <UserX size={13} /> {stats?.users?.suspended || 0} suspended
            </span>
          </div>
        </div>

        {/* Study Groups */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-lg hover:border-cyan-500/30 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Study Groups</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Layers size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mb-2">
            {loading ? '...' : stats?.groups?.total || 0}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
            <span>{stats?.groups?.public || 0} public groups</span>
            <span className="text-cyan-400">+{stats?.groups?.recent || 0} recent</span>
          </div>
        </div>

        {/* Study Sessions */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-lg hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Study Sessions</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CalendarDays size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mb-2">
            {loading ? '...' : stats?.sessions?.total || 0}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
            <span className="text-amber-400">{stats?.sessions?.upcoming || 0} upcoming</span>
            <span className="text-slate-400">{stats?.sessions?.completed || 0} completed</span>
          </div>
        </div>

        {/* Pending Moderation Reports */}
        <div className="bg-slate-900/60 border border-rose-500/20 rounded-2xl p-5 backdrop-blur-lg hover:border-rose-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Pending Reports</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-rose-400 mb-2">
            {loading ? '...' : stats?.reports?.unresolved || 0}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
            <span>{stats?.reports?.resolved || 0} resolved</span>
            <Link to="/admin/reports" className="text-rose-400 hover:underline flex items-center gap-1 font-medium">
              Review cases <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary Metrics: Storage & Materials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Study Materials</p>
            <p className="text-xl font-bold text-white">{stats?.materials?.total || 0} files</p>
            <p className="text-xs text-indigo-400 mt-0.5">+{stats?.materials?.recent || 0} in timeframe</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <HardDrive size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Cloud Storage Used</p>
            <p className="text-xl font-bold text-white">{stats?.materials?.storageFormattedMB || '0.00'} MB</p>
            <p className="text-xs text-emerald-400 mt-0.5">Local Server Storage</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <Activity size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Platform Overseers</p>
            <p className="text-xl font-bold text-white">{stats?.users?.admins || 1} Active Admin(s)</p>
            <p className="text-xs text-rose-400 mt-0.5">RBAC Enforced</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Quick Actions & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Management Actions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-lg">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sliders size={16} className="text-rose-400" />
              Administrative Quick Actions
            </h3>

            <div className="space-y-2">
              <Link
                to="/admin/users"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition group text-sm"
              >
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-indigo-400" />
                  <span className="font-medium text-slate-200">Manage Users & Roles</span>
                </div>
                <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/admin/groups"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition group text-sm"
              >
                <div className="flex items-center gap-3">
                  <Layers size={16} className="text-cyan-400" />
                  <span className="font-medium text-slate-200">Moderate Study Groups</span>
                </div>
                <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/admin/reports"
                className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition group text-sm text-rose-300"
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert size={16} className="text-rose-400" />
                  <span className="font-medium">Moderation Desk</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[11px]">
                  {stats?.reports?.unresolved || 0}
                </span>
              </Link>

              <Link
                to="/admin/settings"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition group text-sm"
              >
                <div className="flex items-center gap-3">
                  <Sliders size={16} className="text-amber-400" />
                  <span className="font-medium text-slate-200">System Platform Settings</span>
                </div>
                <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/admin/activity-logs"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition group text-sm"
              >
                <div className="flex items-center gap-3">
                  <History size={16} className="text-emerald-400" />
                  <span className="font-medium text-slate-200">Full Audit Log History</span>
                </div>
                <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Recent Registrations Card */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-lg">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Recent Signups</span>
              <TrendingUp size={15} className="text-cyan-400" />
            </h3>

            {stats?.recentUsers?.length > 0 ? (
              <div className="divide-y divide-white/5">
                {stats.recentUsers.map((u) => (
                  <div key={u._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">{u.name}</p>
                      <p className="text-slate-500">{u.email}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3 text-center">No recent student registrations.</p>
            )}
          </div>
        </div>

        {/* Right: Real-time Audit Activity Feed */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History size={18} className="text-rose-400" />
                  Recent Governance Audit Stream
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Append-only immutable record of administrative decisions and events
                </p>
              </div>

              <Link
                to="/admin/activity-logs"
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
              >
                <span>View Full Log</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {stats?.recentAuditLogs?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentAuditLogs.map((log) => (
                  <div
                    key={log._id}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-rose-400 mt-2 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-white">
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">
                            {log.resourceType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          Actor: <strong className="text-slate-300">{log.actorName || log.actorEmail || 'System'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {log.status}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center justify-end gap-1">
                        <Clock size={10} />
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <Clock size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No administrative audit records logged yet.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>Server Time: {new Date().toUTCString()}</span>
            <span>Security Level: High (RBAC Active)</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
