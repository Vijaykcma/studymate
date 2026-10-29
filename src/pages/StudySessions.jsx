import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Clock3,
  MapPin,
  Plus,
  Users,
  X,
  AlertCircle,
  Loader2,
  Trash2,
  Video,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { sessionsAPI, groupsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function StudySessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState('upcoming'); // all | upcoming | past

  const [formData, setFormData] = useState({
    title: '',
    group: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '07:00 PM',
    endTime: '08:30 PM',
    meetingType: 'Online',
    location: 'Google Meet',
    meetingLink: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [sessRes, grpRes] = await Promise.allSettled([
        sessionsAPI.getAll(),
        groupsAPI.getMyGroups(),
      ]);

      if (sessRes.status === 'fulfilled' && sessRes.value.success) {
        setSessions(sessRes.value.sessions);
      }

      if (grpRes.status === 'fulfilled' && grpRes.value.success) {
        const myGroups = [
          ...(grpRes.value.created || []),
          ...(grpRes.value.joined || []),
        ];
        // Deduplicate
        const unique = Array.from(new Map(myGroups.map((g) => [g._id, g])).values());
        setUserGroups(unique);
        if (unique.length > 0 && !formData.group) {
          setFormData((prev) => ({ ...prev, group: unique[0]._id }));
        }
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to load study sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.group || !formData.date) {
      setError('Please fill in the required session details.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await sessionsAPI.create(formData);
      if (res.success) {
        setFeedback('Session scheduled successfully!');
        setTimeout(() => setFeedback(''), 3000);
        setShowModal(false);
        setFormData({
          title: '',
          group: userGroups[0]?._id || '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          startTime: '07:00 PM',
          endTime: '08:30 PM',
          meetingType: 'Online',
          location: 'Google Meet',
          meetingLink: '',
        });
        loadData();
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to schedule study session.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Are you sure you want to cancel this study session?')) return;
    try {
      const res = await sessionsAPI.delete(sessionId);
      if (res.success) {
        setFeedback('Session cancelled successfully.');
        setTimeout(() => setFeedback(''), 3000);
        loadData();
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to cancel session.');
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const today = new Date().toISOString().split('T')[0];
    if (activeFilter === 'upcoming') return s.date >= today;
    if (activeFilter === 'past') return s.date < today;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Study Sessions</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Plan and view collaborative learning meetings for your study groups.
            </p>
          </div>

          <button
            onClick={() => {
              if (userGroups.length === 0) {
                setError('You need to join or create a study group first before scheduling sessions.');
                return;
              }
              setShowModal(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Schedule Session
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

        {/* Filter Tabs */}
        <div className="flex border-b border-white/10 gap-3 sm:gap-6 overflow-x-auto scrollbar-none pb-0.5 max-w-full -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveFilter('upcoming')}
            className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-semibold transition border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeFilter === 'upcoming'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Upcoming Sessions ({sessions.filter((s) => s.date >= new Date().toISOString().split('T')[0]).length})
          </button>
          <button
            onClick={() => setActiveFilter('past')}
            className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-semibold transition border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeFilter === 'past'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Past Sessions ({sessions.filter((s) => s.date < new Date().toISOString().split('T')[0]).length})
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-semibold transition border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeFilter === 'all'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            All Sessions ({sessions.length})
          </button>
        </div>

        {/* Session List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <p className="text-sm">Loading sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
            <CalendarDays size={32} className="mx-auto mb-3 opacity-30 text-slate-400" />
            <h3 className="text-lg font-semibold text-white">No sessions scheduled</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              {activeFilter === 'upcoming'
                ? 'No upcoming sessions for your groups. Schedule one to study together!'
                : 'No past sessions recorded.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSessions.map((session) => {
              const isOrganizer =
                (session.organizer?._id || session.organizer) === user?._id;

              return (
                <div
                  key={session._id}
                  className="p-4 sm:p-6 rounded-2xl border border-white/10 bg-slate-900/80 hover:border-indigo-400/30 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 text-xs font-semibold">
                        {session.date}
                      </span>
                      {isOrganizer && (
                        <button
                          onClick={() => handleDelete(session._id)}
                          title="Cancel session"
                          className="text-slate-500 hover:text-rose-400 transition p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white mt-4">{session.title}</h3>
                    <p className="text-xs text-indigo-400 font-medium mt-1">
                      {session.group?.name || 'Study Group'}
                    </p>

                    {session.description && (
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                        {session.description}
                      </p>
                    )}

                    <div className="mt-5 space-y-2 text-xs text-slate-400 border-t border-white/5 pt-4">
                      <div className="flex items-center gap-2">
                        <Clock3 size={14} className="text-indigo-400" />
                        <span>
                          {session.startTime} - {session.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-emerald-400" />
                        <span className="truncate">{session.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-slate-500" />
                        <span>Organized by {session.organizer?.name || 'Peer'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10">
                    {session.meetingLink ? (
                      <a
                        href={session.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs transition text-center flex items-center justify-center gap-2"
                      >
                        <Video size={14} /> Join Meeting
                      </a>
                    ) : (
                      <Link
                        to={`/groups/${session.group?._id || session.group}`}
                        className="w-full py-2.5 rounded-xl border border-white/10 hover:bg-white/5 font-semibold text-xs transition text-center block text-slate-300"
                      >
                        View Group
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Session Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 md:p-8 shadow-2xl relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-5 top-5 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-white mb-1">
                Schedule Study Session
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Create a scheduled meeting with your study group.
              </p>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Session Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="e.g. DBMS Normalization Discussion"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Study Group *
                  </label>
                  <select
                    name="group"
                    value={formData.group}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  >
                    {userGroups.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name} ({g.subject})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                      value={formData.date}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      Start Time
                    </label>
                    <input
                      type="text"
                      name="startTime"
                      placeholder="07:00 PM"
                      value={formData.startTime}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      End Time
                    </label>
                    <input
                      type="text"
                      name="endTime"
                      placeholder="08:30 PM"
                      value={formData.endTime}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      Meeting Type
                    </label>
                    <select
                      name="meetingType"
                      value={formData.meetingType}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    >
                      <option value="Online">Online</option>
                      <option value="Campus">Campus</option>
                      <option value="In-Person">In-Person</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      Location / Room
                    </label>
                    <input
                      type="text"
                      name="location"
                      placeholder="Google Meet or Library"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Meeting Link (Optional)
                  </label>
                  <input
                    type="url"
                    name="meetingLink"
                    placeholder="https://meet.google.com/..."
                    value={formData.meetingLink}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Agenda / Topics
                  </label>
                  <textarea
                    name="description"
                    rows={2}
                    placeholder="Topics to discuss in this session..."
                    value={formData.description}
                    onChange={handleChange}
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
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Scheduling...
                      </>
                    ) : (
                      'Schedule'
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

export default StudySessions;