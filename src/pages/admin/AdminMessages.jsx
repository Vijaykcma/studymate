import React, { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { adminAPI } from '../../services/api';

const AdminMessages = () => {
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCases: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Moderation Modal
  const [moderateModal, setModerateModal] = useState({ open: false, message: null, isDeleted: true });
  const [moderationReason, setModerationReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getReportedMessages({ page, limit: 10 });
      if (res.success && res.data) {
        setCases(res.data.cases);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to fetch reported messages.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page]);

  const handleModerate = async () => {
    if (!moderateModal.message) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.moderateMessage(moderateModal.message._id, {
        isDeleted: moderateModal.isDeleted,
        deletedReason: moderationReason,
      });
      setAlert({ type: 'success', message: res.message });
      setModerateModal({ open: false, message: null, isDeleted: true });
      setModerationReason('');
      fetchCases();
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to moderate message.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout title="Reported Messages & Chat Moderation">
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

      {/* Info Notice about targeted moderation */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-lg flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
          <Shield size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Targeted Context Investigation</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            In compliance with student privacy guidelines, mass surveillance of chat rooms is disallowed. Only messages that have been explicitly flagged by students appear here, along with authorized surrounding context needed to adjudicate harassment, spam, or academic dishonesty.
          </p>
        </div>
      </div>

      {/* Moderation Cases List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500 bg-slate-900/40 border border-white/5 rounded-2xl">
            <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs">Loading reported messages...</span>
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-900/40 border border-white/5 rounded-2xl">
            <MessageSquareWarning size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No active message reports in moderation queue.</p>
          </div>
        ) : (
          cases.map(({ report, message, context }) => {
            if (!message) return null;
            return (
              <div
                key={report._id}
                className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-lg space-y-4"
              >
                {/* Case Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-[10px] uppercase">
                      {report.category}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Layers size={13} className="text-cyan-400" />
                      Group: <strong className="text-slate-200">{message.group?.name || 'Group'}</strong>
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>Reported by {report.reporter?.name || 'Student'}</span>
                    <span>•</span>
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Reporter Complaint Note */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-300">
                  <strong className="text-rose-400">Reporter's Claim:</strong> {report.description}
                </div>

                {/* Contextual Conversation Box */}
                <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-4 space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Surrounding Message Context
                  </p>

                  {/* Context Before */}
                  {context.before?.map((b) => (
                    <div key={b._id} className="opacity-60 pl-3 border-l-2 border-slate-700 text-xs">
                      <span className="font-semibold text-slate-400">{b.sender?.name}:</span>{' '}
                      <span className="text-slate-300">{b.content}</span>
                    </div>
                  ))}

                  {/* Target Reported Message */}
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle size={13} />
                        Flagged Message from {message.senderName || message.sender?.name}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className={`text-white text-sm font-medium ${message.isDeleted ? 'line-through opacity-50' : ''}`}>
                      {message.content}
                    </p>

                    {message.isDeleted && (
                      <p className="mt-2 text-[11px] text-rose-400 font-semibold">
                        [Hidden by Moderator: {message.deletedReason || 'Content removed'}]
                      </p>
                    )}
                  </div>

                  {/* Context After */}
                  {context.after?.map((a) => (
                    <div key={a._id} className="opacity-60 pl-3 border-l-2 border-slate-700 text-xs">
                      <span className="font-semibold text-slate-400">{a.sender?.name}:</span>{' '}
                      <span className="text-slate-300">{a.content}</span>
                    </div>
                  ))}
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  {message.isDeleted ? (
                    <button
                      onClick={() =>
                        setModerateModal({ open: true, message, isDeleted: false })
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Eye size={14} />
                      <span>Restore Message</span>
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        setModerateModal({ open: true, message, isDeleted: true })
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <EyeOff size={14} />
                      <span>Hide / Remove Message</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {cases.length > 0 && (
          <div className="p-4 bg-slate-900/60 border border-white/10 rounded-2xl flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCases} cases)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-semibold text-white px-2">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Moderation Modal */}
      {moderateModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              {moderateModal.isDeleted ? 'Hide Message from Room' : 'Restore Message to Room'}
            </h3>

            <p className="text-xs text-slate-400 mb-4">
              Action applies to flagged message in group: <strong className="text-white">{moderateModal.message?.group?.name}</strong>
            </p>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Moderator Reason</label>
              <textarea
                rows={3}
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Reason for hiding/restoring message..."
                className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setModerateModal({ open: false, message: null, isDeleted: true })}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleModerate}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMessages;
