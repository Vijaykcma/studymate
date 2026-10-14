import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Search,
  Filter,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Clock,
  MapPin,
  Ban,
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { adminAPI } from '../../services/api';

const AdminSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalSessions: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Cancel Modal
  const [cancelModal, setCancelModal] = useState({ open: false, session: null });
  const [cancellationReason, setCancellationReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState({ open: false, session: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getSessions({
        page,
        limit: 10,
        search,
        status: statusFilter,
      });
      if (res.success && res.data) {
        setSessions(res.data.sessions);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to fetch sessions.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSessions();
  };

  const handleCancelSession = async () => {
    if (!cancelModal.session) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.updateSessionStatus(cancelModal.session._id, {
        status: 'Cancelled',
        cancellationReason,
      });
      setAlert({ type: 'success', message: res.message });
      setCancelModal({ open: false, session: null });
      setCancellationReason('');
      fetchSessions();
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to cancel session.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteModal.session) return;
    setDeleteLoading(true);
    try {
      const res = await adminAPI.deleteSession(deleteModal.session._id);
      setAlert({ type: 'success', message: res.message });
      setDeleteModal({ open: false, session: null });
      fetchSessions();
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to delete session.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AdminLayout title="Study Session Moderation">
      {alert.message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm ${
            alert.type === 'error'
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert({ type: '', message: '' })}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search session title or location..."
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

        <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300">
          <Filter size={14} className="text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-transparent focus:outline-none text-xs"
          >
            <option value="all" className="bg-slate-950">All Statuses</option>
            <option value="Upcoming" className="bg-slate-950">Upcoming</option>
            <option value="Completed" className="bg-slate-950">Completed</option>
            <option value="Cancelled" className="bg-slate-950">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-lg shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Session Title</th>
                <th className="py-3.5 px-4">Group</th>
                <th className="py-3.5 px-4">Organizer</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading sessions...</span>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No study sessions found.</p>
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s._id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-semibold text-white">{s.title}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {s.location}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-cyan-400 font-medium">{s.group?.name || 'Unknown Group'}</td>

                    <td className="py-3.5 px-4">
                      <p className="text-slate-200">{s.organizer?.name || 'Unknown'}</p>
                      <p className="text-slate-500 text-[10px]">{s.organizer?.email}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      <div>{s.date}</div>
                      <div className="text-slate-500 text-[10px] flex items-center gap-1">
                        <Clock size={10} /> {s.startTime} - {s.endTime}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          s.status === 'Upcoming'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : s.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {s.status}
                      </span>
                      {s.cancellationReason && (
                        <p className="text-[10px] text-rose-400 mt-0.5 truncate max-w-[120px]" title={s.cancellationReason}>
                          {s.cancellationReason}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status !== 'Cancelled' && (
                          <button
                            onClick={() => setCancelModal({ open: true, session: s })}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Cancel Session with Reason"
                          >
                            <Ban size={15} />
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteModal({ open: true, session: s })}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Delete Session"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalSessions} sessions)
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

      {/* Cancel Session Modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Cancel Study Session</h3>
            <p className="text-xs text-slate-400 mb-4">
              Session: <strong className="text-white">{cancelModal.session?.title}</strong>
            </p>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Administrative Cancellation Reason
              </label>
              <textarea
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Reason for cancellation (e.g., room conflict, inappropriate content)..."
                className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setCancelModal({ open: false, session: null })}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelSession}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 text-rose-400 flex items-center gap-2">
              <Trash2 size={20} />
              <span>Delete Session</span>
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Permanently delete <strong className="text-white">{deleteModal.session?.title}</strong>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setDeleteModal({ open: false, session: null })}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={deleteLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSessions;
