import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Shield,
  Activity,
  User,
  Layers,
  CalendarDays,
  BookOpen,
  Sliders,
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { adminAPI } from '../../services/api';

const AdminActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalLogs: 0 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Inspector state
  const [inspectLog, setInspectLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAuditLogs({
        page,
        limit: 15,
        action: actionFilter,
        resourceType: resourceFilter,
        status: statusFilter,
        search,
      });
      if (res.success && res.data) {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, resourceFilter, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'User': return <User size={14} className="text-indigo-400" />;
      case 'StudyGroup': return <Layers size={14} className="text-cyan-400" />;
      case 'StudySession': return <CalendarDays size={14} className="text-amber-400" />;
      case 'StudyMaterial': return <BookOpen size={14} className="text-emerald-400" />;
      case 'PlatformSettings': return <Sliders size={14} className="text-purple-400" />;
      default: return <Shield size={14} className="text-slate-400" />;
    }
  };

  return (
    <AdminLayout title="Governance Audit Stream & Ledger">
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-lg flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
          <History size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Cryptographic Activity Ledger</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Append-only governance trail recording all authentication attempts, suspensions, role changes, content moderation actions, and system settings modifications. Sensitive secrets and user passwords are never stored.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action keyword, actor name, or target email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter size={14} className="text-slate-500" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent focus:outline-none text-xs"
            >
              <option value="all" className="bg-slate-950">All Actions</option>
              <option value="ADMIN_LOGIN" className="bg-slate-950">Admin Logins</option>
              <option value="USER_STATUS_CHANGE" className="bg-slate-950">Suspensions</option>
              <option value="USER_ROLE_CHANGE" className="bg-slate-950">Role Changes</option>
              <option value="GROUP_STATUS_CHANGE" className="bg-slate-950">Group Moderation</option>
              <option value="MATERIAL_STATUS_CHANGE" className="bg-slate-950">Material Quarantine</option>
              <option value="REPORT_RESOLVE" className="bg-slate-950">Reports Resolved</option>
              <option value="SETTINGS_UPDATE" className="bg-slate-950">Settings Changed</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <select
              value={resourceFilter}
              onChange={(e) => {
                setResourceFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent focus:outline-none text-xs"
            >
              <option value="all" className="bg-slate-950">All Resources</option>
              <option value="Auth" className="bg-slate-950">Authentication</option>
              <option value="User" className="bg-slate-950">Users</option>
              <option value="StudyGroup" className="bg-slate-950">Groups</option>
              <option value="StudySession" className="bg-slate-950">Sessions</option>
              <option value="StudyMaterial" className="bg-slate-950">Materials</option>
              <option value="Report" className="bg-slate-950">Reports</option>
              <option value="PlatformSettings" className="bg-slate-950">Settings</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent focus:outline-none text-xs"
            >
              <option value="all" className="bg-slate-950">All Outcomes</option>
              <option value="SUCCESS" className="bg-slate-950">Success</option>
              <option value="FAILURE" className="bg-slate-950">Failure / Denied</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-lg shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider font-sans">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Resource</th>
                <th className="py-3.5 px-4">Outcome</th>
                <th className="py-3.5 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500 font-sans">
                    <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading audit ledger...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500 font-sans">
                    <History size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No audit entries matching filter.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 sm:px-6 text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-500" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-white bg-white/[0.04] px-2 py-0.5 rounded border border-white/5">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-200 truncate max-w-[150px]">
                        {log.actorName || log.actorEmail || 'System'}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase">{log.actorRole}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        {getResourceIcon(log.resourceType)}
                        <span>{log.resourceType}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setInspectLog(log)}
                        className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-sans inline-flex items-center gap-1 transition"
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalLogs} entries)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 disabled:opacity-30 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-white px-2">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 disabled:opacity-30 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Detail Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield size={18} className="text-rose-400" />
                <span>Audit Entry #{inspectLog._id}</span>
              </h3>
              <button
                onClick={() => setInspectLog(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/60 rounded-xl border border-white/5">
                <div>
                  <p className="text-slate-500">Action:</p>
                  <p className="font-bold text-white">{inspectLog.action}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status:</p>
                  <p className="font-bold text-emerald-400">{inspectLog.status}</p>
                </div>
                <div>
                  <p className="text-slate-500">Actor Name:</p>
                  <p className="text-slate-200">{inspectLog.actorName || 'System'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Actor Email:</p>
                  <p className="text-slate-200">{inspectLog.actorEmail || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Resource Target:</p>
                  <p className="text-slate-200">{inspectLog.resourceType} ({inspectLog.resourceId || 'N/A'})</p>
                </div>
                <div>
                  <p className="text-slate-500">IP Address:</p>
                  <p className="text-slate-200">{inspectLog.ipAddress || '127.0.0.1'}</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Sanitized Details Object (JSON)
                </label>
                <pre className="p-3 bg-slate-950 rounded-xl border border-white/5 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-48 custom-scrollbar">
                  {JSON.stringify(inspectLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/5">
              <button
                onClick={() => setInspectLog(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminActivityLogs;
