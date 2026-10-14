import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Download,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  FileText,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { adminAPI } from '../../services/api';

const AdminMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalMaterials: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Quarantine Modal
  const [quarantineModal, setQuarantineModal] = useState({ open: false, material: null, targetStatus: 'quarantined' });
  const [quarantineReason, setQuarantineReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState({ open: false, material: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getMaterials({
        page,
        limit: 10,
        search,
        status: statusFilter,
        fileType: fileTypeFilter,
      });
      if (res.success && res.data) {
        setMaterials(res.data.materials);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to fetch materials.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [page, statusFilter, fileTypeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMaterials();
  };

  const handleStatusChange = async () => {
    if (!quarantineModal.material) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.updateMaterialStatus(quarantineModal.material._id, {
        status: quarantineModal.targetStatus,
        quarantinedReason: quarantineReason,
      });
      setAlert({ type: 'success', message: res.message });
      setQuarantineModal({ open: false, material: null, targetStatus: 'quarantined' });
      setQuarantineReason('');
      fetchMaterials();
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to update material status.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!deleteModal.material) return;
    setDeleteLoading(true);
    try {
      const res = await adminAPI.deleteMaterial(deleteModal.material._id);
      setAlert({ type: 'success', message: res.message });
      setDeleteModal({ open: false, material: null });
      fetchMaterials();
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to delete material.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <AdminLayout title="Study Material Moderation & Storage">
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
              placeholder="Search by title, original filename, or description..."
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
              <option value="quarantined" className="bg-slate-950">Quarantined</option>
              <option value="removed" className="bg-slate-950">Removed</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <select
              value={fileTypeFilter}
              onChange={(e) => {
                setFileTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent focus:outline-none text-xs"
            >
              <option value="all" className="bg-slate-950">All Types</option>
              <option value="PDF" className="bg-slate-950">PDF</option>
              <option value="DOCX" className="bg-slate-950">DOCX</option>
              <option value="ZIP" className="bg-slate-950">ZIP</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-lg shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Material File</th>
                <th className="py-3.5 px-4">Group</th>
                <th className="py-3.5 px-4">Uploader</th>
                <th className="py-3.5 px-4">Size & Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading materials...</span>
                  </td>
                </tr>
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No uploaded study materials found.</p>
                  </td>
                </tr>
              ) : (
                materials.map((m) => (
                  <tr key={m._id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{m.title}</p>
                          <p className="text-slate-500 text-[11px] truncate max-w-xs">{m.originalFilename}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-cyan-400 font-medium">
                      {m.group?.name || 'Unknown Group'}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-slate-200">{m.uploader?.name || 'Unknown'}</p>
                      <p className="text-slate-500 text-[10px]">{m.uploader?.email}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      <div>{formatFileSize(m.fileSize)}</div>
                      <div className="text-slate-500 text-[10px] uppercase font-bold">{m.fileType}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          m.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {m.status}
                      </span>
                      {m.quarantinedReason && (
                        <p className="text-[10px] text-rose-400 mt-0.5 truncate max-w-[120px]" title={m.quarantinedReason}>
                          {m.quarantinedReason}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Download */}
                        <a
                          href={adminAPI.getDownloadUrl(m._id)}
                          download
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition"
                          title="Authorized Admin Download"
                        >
                          <Download size={15} />
                        </a>

                        {/* Quarantine / Restore */}
                        {m.status === 'quarantined' ? (
                          <button
                            onClick={() =>
                              setQuarantineModal({ open: true, material: m, targetStatus: 'active' })
                            }
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                            title="Restore Material to Active"
                          >
                            <RotateCcw size={15} />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setQuarantineModal({ open: true, material: m, targetStatus: 'quarantined' })
                            }
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                            title="Quarantine Material"
                          >
                            <ShieldAlert size={15} />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteModal({ open: true, material: m })}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Permanently Delete Material"
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
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalMaterials} files)
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

      {/* Quarantine Modal */}
      {quarantineModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              {quarantineModal.targetStatus === 'quarantined' ? 'Quarantine Material' : 'Restore Material'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              File: <strong className="text-white">{quarantineModal.material?.title}</strong>
            </p>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Moderation Reason
              </label>
              <textarea
                rows={3}
                value={quarantineReason}
                onChange={(e) => setQuarantineReason(e.target.value)}
                placeholder="Reason for quarantine or policy breach..."
                className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setQuarantineModal({ open: false, material: null, targetStatus: 'quarantined' })}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
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
              <span>Permanently Delete File</span>
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Permanently remove <strong className="text-white">{deleteModal.material?.originalFilename}</strong> from server storage and database? This action is permanent.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setDeleteModal({ open: false, material: null })}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMaterial}
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

export default AdminMaterials;
