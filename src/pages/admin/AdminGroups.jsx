import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  Eye,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Lock,
  Globe,
  Archive,
  Ban,
  RotateCcw,
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { adminAPI } from '../../services/api';

const AdminGroups = () => {
  const [groups, setGroups] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalGroups: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Group Details Modal
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [groupDetails, setGroupDetails] = useState(null);

  // Status Action Modal
  const [statusModal, setStatusModal] = useState({ open: false, group: null, targetStatus: 'suspended' });
  const [moderationReason, setModerationReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState({ open: false, group: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getGroups({
        page,
        limit: 10,
        search,
        status: statusFilter,
        visibility: visibilityFilter,
      });
      if (res.success && res.data) {
        setGroups(res.data.groups);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to fetch groups.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [page, statusFilter, visibilityFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGroups();
  };

  const openGroupDetails = async (group) => {
    setSelectedGroup(group);
    setDetailsLoading(true);
    try {
      const res = await adminAPI.getGroupDetails(group._id);
      if (res.success && res.data) {
        setGroupDetails(res.data);
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load group details.' });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusModal.group) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.updateGroupStatus(statusModal.group._id, {
        status: statusModal.targetStatus,
        moderationReason,
      });
      setAlert({ type: 'success', message: res.message });
      setStatusModal({ open: false, group: null, targetStatus: 'suspended' });
      setModerationReason('');
      fetchGroups();
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to update group status.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteModal.group) return;
    setDeleteLoading(true);
    try {
      const res = await adminAPI.deleteGroup(deleteModal.group._id);
      setAlert({ type: 'success', message: res.message });
      setDeleteModal({ open: false, group: null });
      if (selectedGroup && selectedGroup._id === deleteModal.group._id) {
        setSelectedGroup(null);
      }
      fetchGroups();
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to delete study group.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AdminLayout title="Study Group Governance">
      {/* Alert banner */}
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
              placeholder="Search by group name, subject, or description..."
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

        <div className="flex items-center gap-2">
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
              <option value="active" className="bg-slate-950">Active</option>
              <option value="suspended" className="bg-slate-950">Suspended</option>
              <option value="archived" className="bg-slate-950">Archived</option>
              <option value="hidden" className="bg-slate-950">Hidden</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <select
              value={visibilityFilter}
              onChange={(e) => {
                setVisibilityFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent focus:outline-none text-xs"
            >
              <option value="all" className="bg-slate-950">All Visibility</option>
              <option value="public" className="bg-slate-950">Public Groups</option>
              <option value="private" className="bg-slate-950">Private Groups</option>
            </select>
          </div>
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-lg shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Group Info</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Owner</th>
                <th className="py-3.5 px-4">Members</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading groups...</span>
                  </td>
                </tr>
              ) : groups.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    <Layers size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No study groups found matching criteria.</p>
                  </td>
                </tr>
              ) : (
                groups.map((g) => (
                  <tr key={g._id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                          {g.visibility === 'private' ? <Lock size={16} /> : <Globe size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{g.name}</p>
                          <p className="text-slate-500 text-[11px] truncate max-w-xs">{g.description}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-medium">{g.subject}</td>

                    <td className="py-3.5 px-4">
                      <p className="text-slate-200">{g.creator?.name || 'Unknown'}</p>
                      <p className="text-slate-500 text-[10px]">{g.creator?.email}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {g.members?.length || 0} / {g.maxMembers || 10}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          g.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : g.status === 'suspended'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {g.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openGroupDetails(g)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                          title="View Group Details"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Suspend / Restore */}
                        {g.status === 'suspended' ? (
                          <button
                            onClick={() =>
                              setStatusModal({ open: true, group: g, targetStatus: 'active' })
                            }
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                            title="Restore Group"
                          >
                            <RotateCcw size={15} />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setStatusModal({ open: true, group: g, targetStatus: 'suspended' })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Suspend Group"
                          >
                            <Ban size={15} />
                          </button>
                        )}

                        {/* Archive */}
                        {g.status !== 'archived' && (
                          <button
                            onClick={() =>
                              setStatusModal({ open: true, group: g, targetStatus: 'archived' })
                            }
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                            title="Archive Group"
                          >
                            <Archive size={15} />
                          </button>
                        )}

                        {/* Permanent Delete */}
                        <button
                          onClick={() => setDeleteModal({ open: true, group: g })}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Delete Group"
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
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalGroups} groups)
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

      {/* Group Details Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedGroup.name}</h3>
                <p className="text-xs text-slate-400">{selectedGroup.subject} • Created by {selectedGroup.creator?.name}</p>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-xs">
              {detailsLoading ? (
                <div className="text-center py-8 text-slate-400">Loading details...</div>
              ) : (
                <>
                  <div className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl space-y-2">
                    <p><strong>Description:</strong> {selectedGroup.description}</p>
                    <p><strong>Skill Level:</strong> {selectedGroup.skillLevel}</p>
                    <p><strong>Meeting Schedule:</strong> {selectedGroup.meetingDays?.join(', ')} at {selectedGroup.meetingTime}</p>
                    <p><strong>Location:</strong> {selectedGroup.location}</p>
                    <p><strong>Status:</strong> <span className="font-bold text-rose-400 uppercase">{selectedGroup.status}</span></p>
                    {selectedGroup.moderationReason && (
                      <p className="text-rose-300"><strong>Moderation Note:</strong> {selectedGroup.moderationReason}</p>
                    )}
                  </div>

                  {/* Members list */}
                  <div>
                    <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Group Members ({groupDetails?.group?.members?.length || 0})
                    </h4>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar">
                      {groupDetails?.group?.members?.map((m) => (
                        <div key={m.user?._id || Math.random()} className="p-2 rounded-xl bg-white/[0.02] flex items-center justify-between">
                          <span>{m.user?.name} ({m.user?.department})</span>
                          <span className="text-[10px] font-bold uppercase text-slate-400">{m.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedGroup(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Update Group Moderation Status</h3>
            <p className="text-xs text-slate-400 mb-4">
              Group: <strong className="text-white">{statusModal.group?.name}</strong> to{' '}
              <strong className="text-rose-400 uppercase font-bold">{statusModal.targetStatus}</strong>
            </p>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Moderation Reason</label>
              <textarea
                rows={3}
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Reason for suspension, archiving, or status change..."
                className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setStatusModal({ open: false, group: null, targetStatus: 'suspended' })}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 text-rose-400 flex items-center gap-2">
              <Trash2 size={20} />
              <span>Delete Study Group</span>
            </h3>
            <p className="text-xs text-slate-300 mb-3">
              This will permanently delete <strong className="text-white">{deleteModal.group?.name}</strong>, along with all associated study sessions, materials, and chat messages.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setDeleteModal({ open: false, group: null })}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={deleteLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminGroups;
