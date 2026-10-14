import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  Filter,
  MapPin,
  Plus,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { groupsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function FindGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All');
  const [skillLevel, setSkillLevel] = useState('All Levels');
  const [location, setLocation] = useState('All');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGroups, setTotalGroups] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  const subjects = [
    'All',
    'Database Management',
    'Web Development',
    'Algorithms',
    'Computer Networks',
    'Software Engineering',
    'Programming',
    'Cloud Computing',
  ];

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        search: search.trim() || undefined,
        subject: subject !== 'All' ? subject : undefined,
        skillLevel: skillLevel !== 'All Levels' ? skillLevel : undefined,
        location: location !== 'All' ? location : undefined,
        sort,
        page,
        limit: 9,
      };

      const data = await groupsAPI.getAll(params);
      if (data.success) {
        setGroups(data.groups);
        setTotalPages(data.totalPages);
        setTotalGroups(data.total);
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to load study groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [subject, skillLevel, location, sort, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGroups();
  };

  const handleJoin = async (groupId) => {
    try {
      setJoiningId(groupId);
      setError('');
      const res = await groupsAPI.join(groupId);
      if (res.success) {
        setActionSuccess('Joined group successfully!');
        setTimeout(() => setActionSuccess(''), 3000);
        // Refresh groups
        fetchGroups();
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to join group.');
    } finally {
      setJoiningId(null);
    }
  };

  const isMember = (group) => {
    if (!user || !group.members) return false;
    return group.members.some(
      (m) => (m.user?._id || m.user) === user._id || m.user === user._id
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Find Study Groups
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Explore {totalGroups} active study groups and connect with student peers.
            </p>
          </div>

          <Link
            to="/groups/create"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition shadow-lg shadow-indigo-600/20 flex items-center gap-2 self-start md:self-auto"
          >
            <Plus size={16} />
            Create Study Group
          </Link>
        </div>

        {/* Action feedback */}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle2 size={18} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button onClick={fetchGroups} className="underline text-xs hover:text-white">
              Retry
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Search by group title, subject, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-11 py-3 outline-none focus:border-indigo-500 transition text-sm placeholder:text-slate-600 text-white"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition shrink-0"
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border border-white/10 text-sm font-medium transition flex items-center gap-2 shrink-0 ${
                showFilters ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <Filter size={16} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </form>

          {/* Quick Subject Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => {
                  setSubject(sub);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  subject === sub
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Expanded Filter Controls */}
          {showFilters && (
            <div className="pt-4 border-t border-white/10 grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                  Skill Level
                </label>
                <select
                  value={skillLevel}
                  onChange={(e) => {
                    setSkillLevel(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="All Levels">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                  Meeting Location
                </label>
                <select
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="All">All Locations</option>
                  <option value="Online">Online</option>
                  <option value="College Library">College Library</option>
                  <option value="Computer Lab">Computer Lab</option>
                  <option value="Room 204">Classroom / Room 204</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                  Sort By
                </label>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="-createdAt">Newest First</option>
                  <option value="createdAt">Oldest First</option>
                  <option value="name">Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Group Cards Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <p className="text-sm">Loading study groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white">No study groups found</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
              We couldn't find any study groups matching your current search and filter criteria.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => {
                  setSearch('');
                  setSubject('All');
                  setSkillLevel('All Levels');
                  setLocation('All');
                  setPage(1);
                }}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300 hover:text-white"
              >
                Clear Filters
              </button>
              <Link
                to="/groups/create"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
              >
                Create New Group
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {groups.map((group) => {
                const member = isMember(group);
                const isFull = (group.members?.length || 0) >= group.maxMembers;
                const isJoining = joiningId === group._id;

                return (
                  <div
                    key={group._id}
                    className="rounded-2xl border border-white/10 bg-slate-900/80 hover:border-indigo-400/30 p-6 flex flex-col justify-between transition duration-200"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/10">
                          <BookOpen size={20} />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium">
                            {group.skillLevel}
                          </span>
                          {member && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                              Joined
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-xs text-slate-400 mt-5 font-medium">
                        {group.subject}
                      </p>
                      <h3 className="text-lg font-semibold text-white mt-1">
                        {group.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                        {group.description}
                      </p>

                      {/* Metadata */}
                      <div className="mt-5 space-y-2 text-xs text-slate-400 border-t border-white/5 pt-4">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-indigo-400 shrink-0" />
                          <span>
                            {group.members?.length || 0} / {group.maxMembers} members
                            {isFull && ' (Full)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} className="text-cyan-400 shrink-0" />
                          <span className="truncate">
                            {group.meetingDays?.join(', ') || 'Weekly'} • {group.meetingTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-emerald-400 shrink-0" />
                          <span className="truncate">{group.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
                      <Link
                        to={`/groups/${group._id}`}
                        className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-center text-xs font-medium transition"
                      >
                        View Details
                      </Link>

                      {!member ? (
                        <button
                          onClick={() => handleJoin(group._id)}
                          disabled={isFull || isJoining}
                          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-center text-xs font-semibold transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
                        >
                          {isJoining ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : isFull ? (
                            'Full'
                          ) : (
                            'Join Group'
                          )}
                        </button>
                      ) : (
                        <Link
                          to={`/groups/${group._id}`}
                          className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-center text-xs font-semibold text-emerald-400 transition"
                        >
                          Open Group
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300 disabled:opacity-40 hover:bg-white/5"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-400 px-3">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300 disabled:opacity-40 hover:bg-white/5"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default FindGroups;