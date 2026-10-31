import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Download,
  FileText,
  Filter,
  Plus,
  Search,
  Upload,
  X,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  File,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { materialsAPI, groupsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function StudyMaterials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');

  // Upload modal state
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadGroup, setUploadGroup] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [matRes, grpRes] = await Promise.allSettled([
        materialsAPI.getAll({ search: search.trim() || undefined }),
        groupsAPI.getMyGroups(),
      ]);

      if (matRes.status === 'fulfilled' && matRes.value.success) {
        setMaterials(matRes.value.materials);
      }

      if (grpRes.status === 'fulfilled' && grpRes.value.success) {
        const myGroups = [
          ...(grpRes.value.created || []),
          ...(grpRes.value.joined || []),
        ];
        const unique = Array.from(new Map(myGroups.map((g) => [g._id, g])).values());
        setUserGroups(unique);
        if (unique.length > 0 && !uploadGroup) {
          setUploadGroup(unique[0]._id);
        }
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to load study materials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      if (!uploadTitle) {
        // Set title to filename without extension
        const name = e.target.files[0].name.replace(/\.[^/.]+$/, '');
        setUploadTitle(name);
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }
    if (!uploadTitle.trim() || !uploadGroup) {
      setError('Please provide a title and select a study group.');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadTitle.trim());
      formData.append('description', uploadDescription.trim());
      formData.append('group', uploadGroup);

      const res = await materialsAPI.upload(formData);
      if (res.success) {
        setFeedback('Study material uploaded successfully!');
        setTimeout(() => setFeedback(''), 3000);
        setShowModal(false);
        setUploadTitle('');
        setUploadDescription('');
        setSelectedFile(null);
        loadData();
      }
    } catch (err) {
      setError(err.userMessage || 'File upload failed. Ensure file is under 15MB.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      const res = await materialsAPI.delete(materialId);
      if (res.success) {
        setFeedback('Material deleted successfully.');
        setTimeout(() => setFeedback(''), 3000);
        loadData();
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to delete material.');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const filteredMaterials = materials.filter((m) => {
    if (selectedGroup !== 'All') {
      return (m.group?._id || m.group) === selectedGroup;
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full min-w-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Study Materials</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Upload, share, and access lecture notes, PDFs, and exam solutions.
            </p>
          </div>

          <button
            onClick={() => {
              if (userGroups.length === 0) {
                setError('You need to be a member of at least one study group to upload materials.');
                return;
              }
              setShowModal(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload size={16} /> Upload Notes
          </button>
        </div>

        {feedback && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle2 size={18} />
            <span>{feedback}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="underline text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Search & Group Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Search documents by title or filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-11 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500 shrink-0"
          >
            <option value="All">All Groups</option>
            {userGroups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Materials List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <p className="text-sm">Loading study resources...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
            <FileText size={32} className="mx-auto mb-3 opacity-30 text-slate-400" />
            <h3 className="text-lg font-semibold text-white">No materials found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              No documents matching your search. Share notes with your study group!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMaterials.map((mat) => {
              const isUploader = (mat.uploader?._id || mat.uploader) === user?._id;

              return (
                <div
                  key={mat._id}
                  className="p-4 sm:p-6 rounded-2xl border border-white/10 bg-slate-900/80 hover:border-indigo-400/30 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {mat.fileType || 'PDF'}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">
                          {formatSize(mat.fileSize)}
                        </span>
                        {isUploader && (
                          <button
                            onClick={() => handleDelete(mat._id)}
                            title="Delete file"
                            className="text-slate-500 hover:text-rose-400 transition p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white mt-4 break-words">
                      {mat.title}
                    </h3>

                    <p className="text-xs text-indigo-400 font-medium mt-1 break-words">
                      {mat.group?.name || 'Study Group'}
                    </p>

                    {mat.description && (
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 break-words">
                        {mat.description}
                      </p>
                    )}

                    <div className="mt-5 space-y-1.5 text-xs text-slate-400 border-t border-white/5 pt-4">
                      <p className="break-all">File: {mat.originalFilename}</p>
                      <p>Uploaded by: {mat.uploader?.name || 'Peer'}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10">
                    <a
                      href={`/api/v1/materials/${mat._id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs transition text-center flex items-center justify-center gap-2 text-white"
                    >
                      <Download size={14} /> Download File
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload File Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 md:p-8 shadow-2xl relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-5 top-5 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-white mb-1">Upload Study Material</h2>
              <p className="text-xs text-slate-400 mb-6">
                Share notes, PDFs, or slides with your study group.
              </p>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Select File * (PDF, DOCX, PPTX, TXT - Max 15MB)
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={handleFileChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit 1 Normalization Notes"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Associate with Study Group *
                  </label>
                  <select
                    value={uploadGroup}
                    onChange={(e) => setUploadGroup(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  >
                    {userGroups.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of the material..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Uploading...
                      </>
                    ) : (
                      'Upload File'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default StudyMaterials;