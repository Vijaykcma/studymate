import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  Plus,
  Search,
  Users,
  AlertCircle,
  Loader2,
  Sparkles,
  Shield,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { userAPI, groupsAPI, sessionsAPI, materialsAPI } from '../services/api';

function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    groupsJoined: 0,
    groupsCreated: 0,
    sessionsCount: 0,
    materialsCount: 0,
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentMaterials, setRecentMaterials] = useState([]);
  const [recommendedGroups, setRecommendedGroups] = useState([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [profileData, , sessionsData, materialsData, discoverData] =
        await Promise.allSettled([
          userAPI.getProfile(),
          groupsAPI.getMyGroups(),
          sessionsAPI.getAll(),
          materialsAPI.getAll(),
          groupsAPI.getAll({ limit: 3 }),
        ]);

      // Process Profile & Stats
      if (profileData.status === 'fulfilled' && profileData.value.success) {
        const s = profileData.value.stats || {};
        setStats({
          groupsJoined: s.groupsJoined || 0,
          groupsCreated: s.groupsCreated || 0,
          sessionsCount: s.sessionsOrganized || 0,
          materialsCount: s.materialsUploaded || 0,
        });
      }

      // Process Sessions
      if (sessionsData.status === 'fulfilled' && sessionsData.value.success) {
        setUpcomingSessions(sessionsData.value.sessions.slice(0, 3));
      }

      // Process Materials
      if (materialsData.status === 'fulfilled' && materialsData.value.success) {
        setRecentMaterials(materialsData.value.materials.slice(0, 3));
      }

      // Process Recommended Groups
      if (discoverData.status === 'fulfilled' && discoverData.value.success) {
        setRecommendedGroups(discoverData.value.groups || []);
      }
    } catch (err) {
      setError('Unable to load some dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Administrator Quick Switch Banner */}
        {user?.role === 'admin' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/70 via-indigo-950/50 to-slate-900 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-rose-950/25">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
                <Shield size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm sm:text-base">Platform Administrator Session Active</h3>
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-extrabold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Master Mode
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  You are previewing the student interface. All platform governance and moderation tools are active in your console.
                </p>
              </div>
            </div>
            <Link
              to="/admin/dashboard"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/30 flex items-center gap-2 shrink-0 border border-white/10"
            >
              <Shield size={15} />
              <span>Open Admin Console</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Header Greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-400/20 bg-indigo-400/10 text-indigo-300 text-xs font-medium mb-2">
              <Sparkles size={13} />
              Academic Workspace
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, {user?.name || 'Student'} 👋
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {user?.department || 'MCA'} • {user?.semester || '2nd Semester'} • Ready for collaborative learning.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {user?.role === 'admin' && (
              <Link
                to="/admin/dashboard"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-sm font-semibold transition shadow-lg shadow-rose-600/20 flex items-center gap-2 border border-rose-400/30"
              >
                <Shield size={16} />
                Admin Console
              </Link>
            )}
            <Link
              to="/groups/create"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              <Plus size={16} />
              Create Study Group
            </Link>
            <Link
              to="/groups"
              className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-semibold transition flex items-center gap-2"
            >
              <Search size={16} />
              Explore Groups
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button
              onClick={loadDashboardData}
              className="underline text-xs hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <p className="text-sm">Fetching your study activities...</p>
          </div>
        ) : (
          <>
            {/* Quick Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Groups Joined</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Users size={17} />
                  </div>
                </div>
                <p className="text-3xl font-bold mt-3">{stats.groupsJoined}</p>
                <p className="text-[11px] text-slate-500 mt-1">Active communities</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Groups Created</span>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <GraduationCap size={17} />
                  </div>
                </div>
                <p className="text-3xl font-bold mt-3">{stats.groupsCreated}</p>
                <p className="text-[11px] text-slate-500 mt-1">Administered by you</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Study Sessions</span>
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                    <CalendarDays size={17} />
                  </div>
                </div>
                <p className="text-3xl font-bold mt-3">{upcomingSessions.length}</p>
                <p className="text-[11px] text-slate-500 mt-1">Scheduled events</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Study Materials</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <BookOpen size={17} />
                  </div>
                </div>
                <p className="text-3xl font-bold mt-3">{recentMaterials.length}</p>
                <p className="text-[11px] text-slate-500 mt-1">Shared files</p>
              </div>
            </div>

            {/* Middle Grid: Upcoming Sessions & Recent Materials */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Upcoming Sessions */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-cyan-400" />
                    <h2 className="font-semibold text-base">Upcoming Study Sessions</h2>
                  </div>
                  <Link
                    to="/sessions"
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    View all <ChevronRight size={13} />
                  </Link>
                </div>

                {upcomingSessions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 rounded-xl bg-white/[0.01] border border-dashed border-white/10">
                    <CalendarDays size={30} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No upcoming sessions right now.</p>
                    <Link
                      to="/sessions"
                      className="mt-3 inline-block text-xs text-indigo-400 hover:underline"
                    >
                      Schedule a study session
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingSessions.map((session) => (
                      <div
                        key={session._id}
                        className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-3">
                          <h3 className="font-medium text-sm text-white truncate">
                            {session.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 truncate">
                            {session.group?.name || 'Study Group'} • {session.location}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-medium inline-block">
                            {session.date}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1">{session.startTime}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Materials */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-violet-400" />
                    <h2 className="font-semibold text-base">Recent Study Materials</h2>
                  </div>
                  <Link
                    to="/materials"
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    View all <ChevronRight size={13} />
                  </Link>
                </div>

                {recentMaterials.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 rounded-xl bg-white/[0.01] border border-dashed border-white/10">
                    <FileText size={30} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No materials shared in your groups yet.</p>
                    <Link
                      to="/materials"
                      className="mt-3 inline-block text-xs text-indigo-400 hover:underline"
                    >
                      Upload notes or documents
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentMaterials.map((mat) => (
                      <div
                        key={mat._id}
                        className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0 font-bold text-xs">
                            {mat.fileType || 'PDF'}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-sm text-white truncate">
                              {mat.title}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              {mat.group?.name || 'Group'} • By {mat.uploader?.name || 'Peer'}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`/api/v1/materials/${mat._id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg border border-white/10 text-xs hover:bg-white/5 transition shrink-0"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Study Groups */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-base">Recommended for You</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Study groups matching your academic interests and subjects
                  </p>
                </div>
                <Link
                  to="/groups"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  Explore All <ChevronRight size={13} />
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {recommendedGroups.map((group) => (
                  <div
                    key={group._id}
                    className="p-5 rounded-xl border border-white/10 bg-slate-900/60 hover:border-indigo-400/30 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
                          <BookOpen size={18} />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 text-xs font-medium">
                          {group.skillLevel}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mt-4">{group.subject}</p>
                      <h3 className="font-medium text-sm text-white mt-1 truncate">
                        {group.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {group.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {group.members?.length || 0} / {group.maxMembers} members
                      </span>
                      <Link
                        to={`/groups/${group._id}`}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                      >
                        Details <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;