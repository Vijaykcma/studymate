import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  MessageCircle,
  Plus,
  Users,
  AlertCircle,
  Loader2,
  MapPin,
  Clock3,
  Edit3,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { groupsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function MyGroups() {
  const { user } = useAuth();
  const [createdGroups, setCreatedGroups] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [pendingGroups, setPendingGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all | created | joined | pending
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMyGroups = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await groupsAPI.getMyGroups();
      if (data.success) {
        setCreatedGroups(data.created || []);
        setJoinedGroups(data.joined || []);
        setPendingGroups(data.pending || []);
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to load your study groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyGroups();
  }, []);

  const getDisplayedGroups = () => {
    if (activeTab === 'created') return createdGroups;
    if (activeTab === 'joined') return joinedGroups.filter((g) => (g.creator?._id || g.creator) !== user?._id);
    if (activeTab === 'pending') return pendingGroups;
    // 'all': deduplicated list of created and joined
    const ids = new Set();
    const all = [];
    [...createdGroups, ...joinedGroups].forEach((g) => {
      if (!ids.has(g._id)) {
        ids.add(g._id);
        all.push(g);
      }
    });
    return all;
  };

  const displayedGroups = getDisplayedGroups();

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">My Study Groups</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage the study groups you participate in or administer.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
            <Link
              to="/groups/create"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Create Group
            </Link>
            <Link
              to="/groups"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 font-semibold text-xs transition flex items-center justify-center gap-2"
            >
              Explore More
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Filters */}
        <div className="flex border-b border-white/10 gap-3 sm:gap-6 overflow-x-auto scrollbar-none pb-0.5 max-w-full">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-xs sm:text-sm font-semibold transition border-b-2 whitespace-nowrap shrink-0 ${
              activeTab === 'all'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            All Groups ({[...new Set([...createdGroups.map(g=>g._id), ...joinedGroups.map(g=>g._id)])].length})
          </button>
          <button
            onClick={() => setActiveTab('created')}
            className={`pb-3 text-xs sm:text-sm font-semibold transition border-b-2 whitespace-nowrap shrink-0 ${
              activeTab === 'created'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Created by Me ({createdGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={`pb-3 text-xs sm:text-sm font-semibold transition border-b-2 whitespace-nowrap shrink-0 ${
              activeTab === 'joined'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Joined as Member ({joinedGroups.filter((g) => (g.creator?._id || g.creator) !== user?._id).length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 text-xs sm:text-sm font-semibold transition border-b-2 whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Pending Approvals ({pendingGroups.length})
            {pendingGroups.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Groups List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <p className="text-sm">Fetching your study groups...</p>
          </div>
        ) : displayedGroups.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
            <div className="w-16 h-16 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Users size={28} />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {activeTab === 'pending' ? 'No pending join requests' : 'No groups found'}
            </h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
              {activeTab === 'pending'
                ? 'You do not have any pending requests to join groups. Once you request to join a group, it will appear here while awaiting the creator’s approval.'
                : "You haven't joined or created any study groups in this category yet."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/groups"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition"
              >
                Find a Study Group
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedGroups.map((group) => {
              const isAdmin = (group.creator?._id || group.creator) === user?._id;
              const isPending =
                activeTab === 'pending' ||
                group.joinRequests?.some(
                  (r) => (r.user?._id || r.user) === user?._id && r.status === 'pending'
                );
              const pendingRequestsCount = isAdmin
                ? group.joinRequests?.filter((r) => r.status === 'pending').length || 0
                : 0;

              return (
                <div
                  key={group._id}
                  className="p-4 sm:p-6 rounded-2xl border border-white/10 bg-slate-900/80 hover:border-indigo-400/30 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={20} />
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold ${
                            isAdmin
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-400/20'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-400/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/20'
                          }`}
                        >
                          {isAdmin ? 'Creator' : isPending ? 'Pending Approval' : 'Member'}
                        </span>
                        {isAdmin && pendingRequestsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {pendingRequestsCount} request{pendingRequestsCount > 1 ? 's' : ''} to review
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-4 sm:mt-5">{group.subject}</p>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1 break-words">{group.name}</h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed break-words">
                      {group.description}
                    </p>

                    <div className="mt-5 space-y-2 text-xs text-slate-400 border-t border-white/5 pt-4">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-indigo-400 shrink-0" />
                        <span>{group.members?.length || 0} / {group.maxMembers} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays size={14} className="text-cyan-400 shrink-0" />
                        <span className="break-words">
                          {group.meetingDays?.join(', ') || 'Flexible'} • {group.meetingTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-emerald-400 shrink-0" />
                        <span className="break-words">{group.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2">
                    <Link
                      to={`/groups/${group._id}`}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-center text-xs font-medium transition"
                    >
                      {isAdmin && pendingRequestsCount > 0 ? 'Requests' : 'Details'}
                    </Link>
                    {isAdmin && (
                      <Link
                        to={`/groups/${group._id}/edit`}
                        className="p-2.5 rounded-xl border border-white/10 hover:border-indigo-500/40 text-slate-400 hover:text-indigo-300 transition"
                        title="Edit Group"
                        aria-label="Edit Group"
                      >
                        <Edit3 size={14} />
                      </Link>
                    )}
                    {isPending ? (
                      <span className="flex-1 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-xs font-semibold text-amber-300 flex items-center justify-center gap-1.5 cursor-not-allowed">
                        <Clock3 size={14} /> Pending
                      </span>
                    ) : (
                      <Link
                        to="/messages"
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-center text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle size={14} /> Chat
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default MyGroups;