import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MapPin,
  MessageCircle,
  MoreVertical,
  Share2,
  ShieldCheck,
  UserPlus,
  Users,
  BookOpen,
  FileText,
  AlertCircle,
  Loader2,
  Trash2,
  UserMinus,
  ExternalLink,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { groupsAPI, sessionsAPI, materialsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function GroupDetails() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview | sessions | materials
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadGroupData = async () => {
    try {
      setLoading(true);
      setError('');

      const groupData = await groupsAPI.getById(groupId);
      if (groupData.success) {
        setGroup(groupData.group);

        // Load sessions and materials for this group
        const [sessData, matData] = await Promise.allSettled([
          sessionsAPI.getAll({ groupId }),
          materialsAPI.getAll({ groupId }),
        ]);

        if (sessData.status === 'fulfilled' && sessData.value.success) {
          setSessions(sessData.value.sessions);
        }
        if (matData.status === 'fulfilled' && matData.value.success) {
          setMaterials(matData.value.materials);
        }
      }
    } catch (err) {
      setError(err.userMessage || 'Group not found or error loading group.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
  }, [groupId]);

  const isMember = group?.members?.some(
    (m) => (m.user?._id || m.user) === user?._id || m.user === user?._id
  );

  const isCreator = group?.creator?._id === user?._id || group?.creator === user?._id;

  const handleJoin = async () => {
    try {
      setActionLoading(true);
      const res = await groupsAPI.join(groupId);
      if (res.success) {
        setFeedback('You have joined this study group!');
        setTimeout(() => setFeedback(''), 3000);
        loadGroupData();
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to join group.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this study group?')) return;
    try {
      setActionLoading(true);
      const res = await groupsAPI.leave(groupId);
      if (res.success) {
        setFeedback('You left the study group.');
        setTimeout(() => setFeedback(''), 3000);
        loadGroupData();
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to leave group.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this study group?'))
      return;
    try {
      setActionLoading(true);
      const res = await groupsAPI.delete(groupId);
      if (res.success) {
        navigate('/groups');
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to delete group.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p className="text-sm">Loading group details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !group) {
    return (
      <DashboardLayout>
        <div className="p-8 max-w-lg mx-auto text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">Study Group Not Found</h2>
          <p className="text-slate-400 text-sm">
            {error || 'This study group does not exist or may have been deleted.'}
          </p>
          <Link
            to="/groups"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition mt-2"
          >
            <ArrowLeft size={16} /> Back to Groups
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/groups"
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={16} /> Back to Study Groups
          </Link>

          <div className="flex items-center gap-2">
            {isCreator && (
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Delete Group
              </button>
            )}
          </div>
        </div>

        {feedback && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle2 size={18} />
            <span>{feedback}</span>
          </div>
        )}

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-900/30 via-slate-900 to-cyan-900/20 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex gap-5">
              <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <GraduationCap size={36} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-400/20">
                    {group.subject}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium border border-cyan-400/20">
                    {group.skillLevel}
                  </span>
                  {group.visibility === 'private' && (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-400/20">
                      Private
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-white mt-3">
                  {group.name}
                </h1>

                <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                  {group.description}
                </p>

                <p className="text-xs text-slate-400 mt-4">
                  Created by <span className="text-white font-medium">{group.creator?.name || 'Peer'}</span> ({group.creator?.department || 'MCA'})
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              {isMember ? (
                <>
                  <Link
                    to="/messages"
                    className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} /> Open Discussions
                  </Link>

                  {!isCreator && (
                    <button
                      onClick={handleLeave}
                      disabled={actionLoading}
                      className="px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-semibold text-xs text-rose-400 transition flex items-center justify-center gap-2"
                    >
                      <UserMinus size={16} /> Leave Group
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={actionLoading || (group.members?.length || 0) >= group.maxMembers}
                  className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-semibold text-sm transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} />
                  {(group.members?.length || 0) >= group.maxMembers ? 'Group Full' : 'Join Group'}
                </button>
              )}
            </div>
          </div>

          {/* Quick info row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
            <div>
              <p className="text-xs text-slate-400">Members</p>
              <p className="text-sm font-semibold text-white mt-1">
                {group.members?.length || 0} / {group.maxMembers}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Meeting Days</p>
              <p className="text-sm font-semibold text-white mt-1">
                {group.meetingDays?.join(', ') || 'Flexible'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Preferred Time</p>
              <p className="text-sm font-semibold text-white mt-1">
                {group.meetingTime}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Location</p>
              <p className="text-sm font-semibold text-white mt-1 truncate">
                {group.location}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-white/10 gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-semibold transition border-b-2 ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Members ({group.members?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`pb-3 text-sm font-semibold transition border-b-2 ${
              activeTab === 'sessions'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Upcoming Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`pb-3 text-sm font-semibold transition border-b-2 ${
              activeTab === 'materials'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Study Resources ({materials.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {group.members?.map((m) => {
              const u = m.user || {};
              const isOwner = m.role === 'admin' || (group.creator?._id || group.creator) === u._id;
              return (
                <div
                  key={u._id || m._id}
                  className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-sm text-white shrink-0">
                    {u.name ? u.name[0].toUpperCase() : 'M'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {u.name || 'Member'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {u.department || 'Student'} • {u.semester || ''}
                    </p>
                  </div>
                  {isOwner && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold">
                      Admin
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Scheduled Study Sessions</h3>
              {isMember && (
                <Link
                  to="/sessions"
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Schedule a Session <ExternalLink size={12} />
                </Link>
              )}
            </div>

            {sessions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 rounded-2xl border border-dashed border-white/10">
                <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No study sessions currently scheduled for this group.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {sessions.map((s) => (
                  <div
                    key={s._id}
                    className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex items-start justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-semibold text-sm text-white">{s.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{s.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-3">
                        <span className="flex items-center gap-1 text-cyan-400">
                          <CalendarDays size={14} /> {s.date}
                        </span>
                        <span className="flex items-center gap-1 text-indigo-400">
                          <Clock3 size={14} /> {s.startTime} - {s.endTime}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                      {s.location}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Shared Group Documents</h3>
              {isMember && (
                <Link
                  to="/materials"
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Upload New Material <ExternalLink size={12} />
                </Link>
              )}
            </div>

            {materials.length === 0 ? (
              <div className="p-8 text-center text-slate-500 rounded-2xl border border-dashed border-white/10">
                <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notes or study materials uploaded yet.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {materials.map((m) => (
                  <div
                    key={m._id}
                    className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {m.fileType || 'PDF'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-white truncate">
                          {m.title}
                        </h4>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {m.originalFilename} • By {m.uploader?.name || 'Peer'}
                        </p>
                      </div>
                    </div>

                    <a
                      href={`/api/v1/materials/${m._id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold text-white transition shrink-0"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default GroupDetails;