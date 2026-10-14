import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Layers,
  CalendarDays,
  BookOpen,
  MessageSquare,
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminReports = () => {
  const { user: currentAdmin } = useAuth();

  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalReports: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Investigation Modal
  const [investigateModal, setInvestigateModal] = useState({ open: false, reportId: null });
  const [reportDetail, setReportDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Resolution Modal
  const [resolutionModal, setResolutionModal] = useState({ open: false, report: null, targetStatus: 'resolved' });
  const [resolutionReason, setResolutionReason] = useState('');
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getReports({
        page,
        limit: 10,
        status: statusFilter,
        resourceType: resourceTypeFilter,
      });
      if (res.success && res.data) {
        setReports(res.data.reports);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to fetch reports.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, statusFilter, resourceTypeFilter]);

  const openInvestigation = async (reportId) => {
    setInvestigateModal({ open: true, reportId });
    setDetailLoading(true);
    try {
      const res = await adminAPI.getReportDetails(reportId);
      if (res.success && res.data) {
        setReportDetail(res.data);
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load report investigation data.' });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAssignToMe = async (reportId) => {
    try {
      const res = await adminAPI.assignReport(reportId, { assignedTo: currentAdmin._id });
      setAlert({ type: 'success', message: 'Report assigned to you.' });
      fetchReports();
      if (investigateModal.open && investigateModal.reportId === reportId) {
        openInvestigation(reportId);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to assign report.' });
    }
  };

  const handleResolveStatus = async () => {
    if (!resolutionModal.report) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.updateReportStatus(resolutionModal.report._id, {
        status: resolutionModal.targetStatus,
        resolutionReason,
        moderatorNotes,
      });
      setAlert({ type: 'success', message: res.message });
      setResolutionModal({ open: false, report: null, targetStatus: 'resolved' });
      setResolutionReason('');
      setModeratorNotes('');
      if (investigateModal.open) {
        setInvestigateModal({ open: false, reportId: null });
      }
      fetchReports();
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to update report status.' });
    } finally {
      setActionLoading(false);
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'User': return <User size={15} className="text-indigo-400" />;
      case 'StudyGroup': return <Layers size={15} className="text-cyan-400" />;
      case 'StudySession': return <CalendarDays size={15} className="text-amber-400" />;
      case 'StudyMaterial': return <BookOpen size={15} className="text-emerald-400" />;
      case 'Message': return <MessageSquare size={15} className="text-rose-400" />;
      default: return <ShieldAlert size={15} className="text-slate-400" />;
    }
  };

  return (
    <AdminLayout title="Reports & Community Moderation Desk">
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

      {/* Top Filter Bar */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-white/5 rounded-xl overflow-x-auto">
          {['all', 'pending', 'under_review', 'resolved', 'dismissed'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Resource Type Filter */}
        <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300">
          <Filter size={14} className="text-slate-500" />
          <select
            value={resourceTypeFilter}
            onChange={(e) => {
              setResourceTypeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-transparent focus:outline-none text-xs"
          >
            <option value="all" className="bg-slate-950">All Resource Types</option>
            <option value="User" className="bg-slate-950">User Profiles</option>
            <option value="StudyGroup" className="bg-slate-950">Study Groups</option>
            <option value="StudySession" className="bg-slate-950">Sessions</option>
            <option value="StudyMaterial" className="bg-slate-950">Materials</option>
            <option value="Message" className="bg-slate-950">Messages</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-lg shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Report Item</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Reporter</th>
                <th className="py-3.5 px-4">Assigned Moderator</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading moderation reports...</span>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    <ShieldAlert size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No reports filed matching current filters.</p>
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r._id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0">
                          {getResourceIcon(r.resourceType)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{r.resourceType}</p>
                          <p className="text-slate-500 text-[11px] truncate max-w-xs">{r.description}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 font-bold text-[10px] uppercase border border-rose-500/20">
                        {r.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-slate-200">{r.reporter?.name || 'Anonymous'}</p>
                      <p className="text-slate-500 text-[10px]">{r.reporter?.email}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {r.assignedTo ? (
                        <span className="text-indigo-400 font-medium">{r.assignedTo.name}</span>
                      ) : (
                        <button
                          onClick={() => handleAssignToMe(r._id)}
                          className="text-[11px] text-slate-500 hover:text-white underline cursor-pointer"
                        >
                          + Assign to Me
                        </button>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'pending'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : r.status === 'under_review'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : r.status === 'resolved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openInvestigation(r._id)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Eye size={13} />
                          <span>Investigate</span>
                        </button>

                        {r.status !== 'resolved' && (
                          <button
                            onClick={() =>
                              setResolutionModal({ open: true, report: r, targetStatus: 'resolved' })
                            }
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                            title="Resolve Case"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}

                        {r.status !== 'dismissed' && (
                          <button
                            onClick={() =>
                              setResolutionModal({ open: true, report: r, targetStatus: 'dismissed' })
                            }
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-lg transition"
                            title="Dismiss Case"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
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
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalReports} reports)
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

      {/* Investigation Drawer Modal */}
      {investigateModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Case Investigation Dossier</h3>
                  <p className="text-xs text-slate-400">
                    Category: {reportDetail?.report?.category} • Filed on{' '}
                    {reportDetail?.report && new Date(reportDetail.report.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInvestigateModal({ open: false, reportId: null })}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-xs">
              {detailLoading ? (
                <div className="text-center py-8 text-slate-400">Retrieving contextual evidence...</div>
              ) : (
                <>
                  {/* Reporter Note */}
                  <div className="p-4 bg-slate-950/60 border border-rose-500/20 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-rose-300 uppercase tracking-wider text-[11px]">Reporter Statement</span>
                      <span className="text-slate-500">{reportDetail?.report?.reporter?.name} ({reportDetail?.report?.reporter?.email})</span>
                    </div>
                    <p className="text-slate-200 text-sm leading-relaxed">{reportDetail?.report?.description}</p>
                  </div>

                  {/* Target Resource Metadata */}
                  <div className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl space-y-3">
                    <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                      Reported Resource ({reportDetail?.report?.resourceType})
                    </h4>

                    {reportDetail?.targetResource ? (
                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5">
                        <p><strong>Name / Title:</strong> {reportDetail.targetResource.name || reportDetail.targetResource.title || reportDetail.targetResource.content}</p>
                        {reportDetail.targetResource.subject && <p><strong>Subject:</strong> {reportDetail.targetResource.subject}</p>}
                        {reportDetail.targetResource.description && <p><strong>Description:</strong> {reportDetail.targetResource.description}</p>}
                        {reportDetail.targetResource.email && <p><strong>User Email:</strong> {reportDetail.targetResource.email}</p>}
                        {reportDetail.targetResource.department && <p><strong>Department:</strong> {reportDetail.targetResource.department}</p>}
                        {reportDetail.targetResource.status && <p><strong>Current Status:</strong> {reportDetail.targetResource.status}</p>}
                      </div>
                    ) : (
                      <p className="text-slate-500">Resource was deleted or no longer exists in database.</p>
                    )}
                  </div>

                  {/* Moderator Findings if resolved */}
                  {reportDetail?.report?.resolutionReason && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 space-y-1">
                      <p className="font-bold">Resolution Decision ({reportDetail.report.status})</p>
                      <p><strong>Reason:</strong> {reportDetail.report.resolutionReason}</p>
                      {reportDetail.report.moderatorNotes && (
                        <p><strong>Internal Notes:</strong> {reportDetail.report.moderatorNotes}</p>
                      )}
                      <p className="text-[10px] text-emerald-400/80 mt-1">
                        Resolved by: {reportDetail.report.resolvedBy?.name || 'Administrator'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-slate-950 flex items-center justify-between">
              <button
                onClick={() => setInvestigateModal({ open: false, reportId: null })}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setResolutionModal({ open: true, report: reportDetail?.report, targetStatus: 'dismissed' })
                  }
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Dismiss Case
                </button>
                <button
                  onClick={() =>
                    setResolutionModal({ open: true, report: reportDetail?.report, targetStatus: 'resolved' })
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Resolve Case
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Confirmation Modal */}
      {resolutionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              {resolutionModal.targetStatus === 'resolved' ? 'Resolve Moderation Case' : 'Dismiss Moderation Case'}
            </h3>

            <p className="text-xs text-slate-400 mb-4">
              Enter official findings and notes. This decision is permanently logged to the audit stream.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resolution Decision / Justification (Required)
                </label>
                <textarea
                  rows={3}
                  value={resolutionReason}
                  onChange={(e) => setResolutionReason(e.target.value)}
                  placeholder="Official conclusion (e.g., Action taken, user warned, group suspended, or unfounded report)..."
                  className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Internal Moderator Notes (Optional)
                </label>
                <input
                  type="text"
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  placeholder="Notes visible only to platform administrators..."
                  className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setResolutionModal({ open: false, report: null, targetStatus: 'resolved' })}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveStatus}
                disabled={actionLoading || !resolutionReason.trim()}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition disabled:opacity-50 ${
                  resolutionModal.targetStatus === 'resolved'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {actionLoading ? 'Saving...' : 'Record Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminReports;
