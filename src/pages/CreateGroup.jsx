import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Users,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { groupsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function CreateGroup() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    subject: '',
    description: '',
    skillLevel: 'All Levels',
    maxMembers: 10,
    location: 'Online',
    meetingDays: ['Monday', 'Wednesday'],
    meetingTime: '7:00 PM',
    department: user?.department || '',
    semester: user?.semester || '',
    visibility: 'public',
  });

  const [createdGroup, setCreatedGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const toggleDay = (day) => {
    setForm((prev) => {
      const days = prev.meetingDays.includes(day)
        ? prev.meetingDays.filter((d) => d !== day)
        : [...prev.meetingDays, day];
      return {
        ...prev,
        meetingDays: days.length > 0 ? days : ['Monday'], // at least one day
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim() || !form.description.trim()) {
      setError('Please provide a group name, subject, and description.');
      return;
    }

    if (form.meetingDays.length === 0) {
      setError('Please select at least one preferred meeting day.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await groupsAPI.create({
        ...form,
        maxMembers: Number(form.maxMembers),
      });

      if (data.success && data.group) {
        setCreatedGroup(data.group);
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to create study group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success view
  if (createdGroup) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-3xl border border-emerald-500/20 bg-slate-900/90 backdrop-blur-xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
              <CheckCircle2 size={36} />
            </div>

            <h1 className="text-2xl font-bold text-white">Study Group Created!</h1>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              "<span className="text-white font-medium">{createdGroup.name}</span>" is now live. You are the group admin.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to={`/groups/${createdGroup._id}`}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white transition text-center shadow-lg shadow-indigo-600/20"
              >
                View Group Details
              </Link>
              <Link
                to="/groups"
                className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 font-semibold text-xs text-slate-300 transition text-center"
              >
                Find More Groups
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Link
            to="/groups"
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-3 transition"
          >
            <ArrowLeft size={14} /> Back to Study Groups
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Create a New Study Group
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Build a focused study community and invite classmates to collaborate.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
              <h2 className="text-base font-semibold text-white">Basic Information</h2>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">
                  Group Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. DBMS Exam Preparation"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500 transition text-sm text-white placeholder:text-slate-600"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1.5">
                    Subject / Topic *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    required
                    placeholder="e.g. Database Management"
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500 transition text-sm text-white placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1.5">
                    Skill Level
                  </label>
                  <select
                    name="skillLevel"
                    value={form.skillLevel}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500 transition text-sm text-slate-200"
                  >
                    <option value="All Levels">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">
                  Description & Goals *
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  placeholder="Describe what your group will study, goals, and any prerequisites..."
                  value={form.description}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500 transition text-sm text-white placeholder:text-slate-600 resize-none"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
              <h2 className="text-base font-semibold text-white">Schedule & Logistics</h2>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-2">
                  Preferred Meeting Days *
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => {
                    const isSelected = form.meetingDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1.5">
                    Meeting Time
                  </label>
                  <input
                    type="text"
                    name="meetingTime"
                    placeholder="e.g. 7:00 PM"
                    value={form.meetingTime}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500 transition text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1.5">
                    Location
                  </label>
                  <select
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500 transition text-sm text-slate-200"
                  >
                    <option value="Online">Online (Google Meet / Zoom)</option>
                    <option value="College Library">College Library</option>
                    <option value="Computer Lab">Computer Lab</option>
                    <option value="Classroom 204">Classroom</option>
                    <option value="Campus Lawn">Campus Area</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1.5">
                    Max Members
                  </label>
                  <input
                    type="number"
                    name="maxMembers"
                    min={2}
                    max={100}
                    value={form.maxMembers}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500 transition text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1.5">
                    Department Restriction (Optional)
                  </label>
                  <input
                    type="text"
                    name="department"
                    placeholder="e.g. MCA (Leave empty for open)"
                    value={form.department}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500 transition text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1.5">
                    Visibility
                  </label>
                  <select
                    name="visibility"
                    value={form.visibility}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500 transition text-sm text-slate-200"
                  >
                    <option value="public">Public (Discoverable to all)</option>
                    <option value="private">Private (Invite only)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Study Group...
                </>
              ) : (
                'Create Study Group'
              )}
            </button>
          </form>

          {/* Live Preview Card */}
          <div className="space-y-4 lg:sticky lg:top-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Sparkles size={14} className="text-indigo-400" />
              Live Group Preview
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl space-y-5">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                  <BookOpen size={20} />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium">
                  {form.skillLevel}
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-medium">
                  {form.subject || 'Subject Name'}
                </p>
                <h3 className="text-lg font-bold text-white mt-1">
                  {form.name || 'Your Study Group Name'}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {form.description ||
                    'Add a description to tell classmates what this group is preparing for.'}
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-400 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-indigo-400" />
                  <span>1 / {form.maxMembers || 10} members (You are Admin)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-cyan-400" />
                  <span>
                    {form.meetingDays.length > 0
                      ? form.meetingDays.join(', ')
                      : 'Days not set'}{' '}
                    • {form.meetingTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-emerald-400" />
                  <span>{form.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default CreateGroup;