import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Shield,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  CheckCircle2,
  Calendar,
  Layers,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminUsers = () => {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Modals & Drawers state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Status Modal (Suspend / Reactivate)
  const [statusModal, setStatusModal] = useState({ open: false, user: null, targetStatus: 'suspended' });
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspendedUntil, setSuspendedUntil] = useState('');
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  // Role Modal
  const [roleModal, setRoleModal] = useState({ open: false, user: null, targetRole: 'admin' });
  const [roleActionLoading, setRoleActionLoading] = useState(false);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Alert message
  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({
        page,
        limit: 10,
        search,
        role: roleFilter,
        status: statusFilter,
        verificationStatus: verificationFilter,
      });
      if (res.success && res.data) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to fetch user accounts.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, verificationFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const openUserDetails = async (user) => {
    setSelectedUser(user);
    setDetailsLoading(true);
    try {
      const res = await adminAPI.getUserDetails(user._id);
      if (res.success && res.data) {
        setUserDetails(res.data);
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to fetch user details.' });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleToggleVerification = async (targetUser) => {
    try {
      const res = await adminAPI.updateUserVerification(targetUser._id, {
        isEmailVerified: !targetUser.isEmailVerified,
      });
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        fetchUsers();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to update email verification.' });
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusModal.user) return;
    setStatusActionLoading(true);
    try {
      const res = await adminAPI.updateUserStatus(statusModal.user._id, {
        status: statusModal.targetStatus,
        reason: suspensionReason,
        suspendedUntil: suspendedUntil || null,
      });
      setAlert({ type: 'success', message: res.message });
      setStatusModal({ open: false, user: null, targetStatus: 'suspended' });
      setSuspensionReason('');
      setSuspendedUntil('');
      fetchUsers();
      if (selectedUser && selectedUser._id === statusModal.user._id) {
        openUserDetails(statusModal.user);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to update account status.' });
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!roleModal.user) return;
    setRoleActionLoading(true);
    try {
      const res = await adminAPI.updateUserRole(roleModal.user._id, {
        role: roleModal.targetRole,
      });
      setAlert({ type: 'success', message: res.message });
      setRoleModal({ open: false, user: null, targetRole: 'admin' });
      fetchUsers();
      if (selectedUser && selectedUser._id === roleModal.user._id) {
        openUserDetails(roleModal.user);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to update user role.' });
    } finally {
      setRoleActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;
    setDeleteLoading(true);
    try {
      const res = await adminAPI.deleteUser(deleteModal.user._id);
      setAlert({ type: 'success', message: res.message });
      setDeleteModal({ open: false, user: null });
      if (selectedUser && selectedUser._id === deleteModal.user._id) {
        setSelectedUser(null);
      }
      fetchUsers();
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to delete user account.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AdminLayout title="User Management & Role Governance">
      {/* Alert Notice */}
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
          <button onClick={() => setAlert({ type: '', message: '' })} className="hover:opacity-75">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, email, or registration number..."
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
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent focus:outline-none text-xs"
            >
              <option value="all" className="bg-slate-950">All Roles</option>
              <option value="user" className="bg-slate-950">Students Only</option>
              <option value="admin" className="bg-slate-950">Administrators Only</option>
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
              <option value="all" className="bg-slate-950">All Statuses</option>
              <option value="active" className="bg-slate-950">Active Accounts</option>
              <option value="suspended" className="bg-slate-950">Suspended Accounts</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent focus:outline-none text-xs"
            >
              <option value="all" className="bg-slate-950">All Verifications</option>
              <option value="verified" className="bg-slate-950">Verified Real Users</option>
              <option value="unverified" className="bg-slate-950">Unverified Users</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-lg shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">User Account</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Department / Reg</th>
                <th className="py-3.5 px-4 hidden lg:table-cell">Registered</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading user accounts...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No accounts match the selected criteria.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentAdmin?._id === u._id;
                  return (
                    <tr key={u._id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-white text-xs shrink-0">
                            {u.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate flex items-center gap-2">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-slate-500 text-[11px] truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-indigo-500/10 text-indigo-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          {u.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isEmailVerified
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          }`}
                        >
                          <ShieldCheck size={11} className={u.isEmailVerified ? 'text-emerald-400' : 'text-amber-400'} />
                          {u.isEmailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-400">
                        {u.department} {u.registrationNumber && `(${u.registrationNumber})`}
                      </td>

                      <td className="py-3.5 px-4 hidden lg:table-cell text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => openUserDetails(u)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                            title="Inspect User Details"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Suspend / Reactivate */}
                          <button
                            disabled={isSelf}
                            onClick={() =>
                              setStatusModal({
                                open: true,
                                user: u,
                                targetStatus: u.status === 'active' ? 'suspended' : 'active',
                              })
                            }
                            className={`p-1.5 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed ${
                              u.status === 'active'
                                ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                : 'text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={u.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                          >
                            {u.status === 'active' ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>

                          {/* Toggle Email Verification */}
                          <button
                            onClick={() => handleToggleVerification(u)}
                            className={`p-1.5 rounded-lg transition ${
                              u.isEmailVerified
                                ? 'text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-amber-400 hover:bg-amber-500/10'
                            }`}
                            title={u.isEmailVerified ? 'Toggle: Mark Unverified' : 'Toggle: Verify Real User'}
                          >
                            <ShieldCheck size={15} />
                          </button>

                          {/* Role Toggle */}
                          <button
                            disabled={isSelf}
                            onClick={() =>
                              setRoleModal({
                                open: true,
                                user: u,
                                targetRole: u.role === 'admin' ? 'user' : 'admin',
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={u.role === 'admin' ? 'Demote to Student' : 'Promote to Administrator'}
                          >
                            <Shield size={15} />
                          </button>

                          {/* Delete Account */}
                          <button
                            disabled={isSelf}
                            onClick={() => setDeleteModal({ open: true, user: u })}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete Account"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalUsers} accounts)
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

      {/* User Details Drawer Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center font-bold text-white text-base">
                  {selectedUser.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{selectedUser.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        selectedUser.role === 'admin' ? 'bg-rose-500/20 text-rose-300' : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {selectedUser.role}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">{selectedUser.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {detailsLoading ? (
                <div className="text-center py-8 text-slate-400">Loading user activity profile...</div>
              ) : (
                <>
                  {/* Account Overview Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <p className="text-slate-400 text-[11px]">Groups Joined</p>
                      <p className="text-lg font-bold text-white mt-1">
                        {userDetails?.activity?.groupsJoined?.length || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <p className="text-slate-400 text-[11px]">Groups Created</p>
                      <p className="text-lg font-bold text-white mt-1">
                        {userDetails?.activity?.groupsCreated?.length || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <p className="text-slate-400 text-[11px]">Sessions Led</p>
                      <p className="text-lg font-bold text-white mt-1">
                        {userDetails?.activity?.sessionsOrganized?.length || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <p className="text-slate-400 text-[11px]">Materials Uploaded</p>
                      <p className="text-lg font-bold text-white mt-1">
                        {userDetails?.activity?.materialsUploaded?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-2">Academic Profile</h4>
                    <p><strong className="text-slate-400">Department:</strong> {selectedUser.department}</p>
                    <p><strong className="text-slate-400">Semester:</strong> {selectedUser.semester}</p>
                    {selectedUser.college && <p><strong className="text-slate-400">College:</strong> {selectedUser.college}</p>}
                    {selectedUser.registrationNumber && <p><strong className="text-slate-400">Registration #:</strong> {selectedUser.registrationNumber}</p>}
                    {selectedUser.bio && <p><strong className="text-slate-400">Bio:</strong> {selectedUser.bio}</p>}
                    <p>
                      <strong className="text-slate-400">Status:</strong>{' '}
                      <span className={selectedUser.status === 'active' ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                        {selectedUser.status}
                      </span>
                    </p>
                    {selectedUser.status === 'suspended' && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 mt-2 text-rose-300">
                        <p><strong>Suspension Reason:</strong> {selectedUser.suspendedReason || 'None specified'}</p>
                        {selectedUser.suspendedUntil && (
                          <p className="mt-1">
                            <strong>Expires:</strong> {new Date(selectedUser.suspendedUntil).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Activity preview */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider">Associated Groups</h4>
                    {userDetails?.activity?.groupsJoined?.length > 0 ? (
                      <div className="space-y-1.5">
                        {userDetails.activity.groupsJoined.map((g) => (
                          <div key={g._id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between items-center text-xs">
                            <span className="font-medium text-slate-200">{g.name} ({g.subject})</span>
                            <span className="text-slate-500">{g.members?.length || 0} members</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No joined groups on record.</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspension / Reactivation Modal */}
      {statusModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="text-rose-400" size={20} />
              <span>
                {statusModal.targetStatus === 'suspended' ? 'Suspend Account' : 'Reactivate Account'}
              </span>
            </h3>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Target user: <strong className="text-white">{statusModal.user?.name}</strong> ({statusModal.user?.email})
            </p>

            {statusModal.targetStatus === 'suspended' && (
              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Suspension Reason (Required)
                  </label>
                  <textarea
                    rows={3}
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    placeholder="Enter violation reason, policy breach, or disciplinary note..."
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Optional Auto-Reactivation Date
                  </label>
                  <input
                    type="datetime-local"
                    value={suspendedUntil}
                    onChange={(e) => setSuspendedUntil(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setStatusModal({ open: false, user: null, targetStatus: 'suspended' })}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={statusActionLoading || (statusModal.targetStatus === 'suspended' && !suspensionReason.trim())}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition disabled:opacity-50 ${
                  statusModal.targetStatus === 'suspended'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {statusActionLoading ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Toggle Modal */}
      {roleModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Shield className="text-indigo-400" size={20} />
              <span>Modify User Role</span>
            </h3>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Are you sure you want to change role of <strong className="text-white">{roleModal.user?.name}</strong> to{' '}
              <strong className="text-rose-400 uppercase font-bold">"{roleModal.targetRole}"</strong>?
            </p>

            {roleModal.targetRole === 'admin' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 mb-4">
                <strong>Warning:</strong> This grants complete administrator privileges including access to user moderation, database settings, and audit logs.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setRoleModal({ open: false, user: null, targetRole: 'admin' })}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={roleActionLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                {roleActionLoading ? 'Updating...' : 'Confirm Role Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 text-rose-400">
              <Trash2 size={20} />
              <span>Delete User Account</span>
            </h3>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              This action will permanently delete user <strong className="text-white">{deleteModal.user?.name}</strong> and remove them from all study groups, sessions, and materials.
            </p>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 mb-4">
              <strong>Permanent Action:</strong> This operation cannot be undone. An audit record will be preserved.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setDeleteModal({ open: false, user: null })}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
