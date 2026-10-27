import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Shield,
  Save,
  GraduationCap,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];
const DEPARTMENTS = ['Computer Science', 'Information Technology', 'MCA', 'BCA', 'Engineering', 'Mathematics', 'General'];

export default function EditGroup() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
    department: '',
    semester: '',
    skillLevel: 'All Levels',
    maxMembers: 10,
    visibility: 'public',
    meetingDays: ['Monday', 'Wednesday'],
    meetingTime: '7:00 PM',
    location: 'Online',
  });

  useEffect(() => {
    let isMounted = true;
    const fetchGroup = async () => {
      try {
        const res = await api.get(`/groups/${groupId}`);
        if (!isMounted) return;

        const group = res.data.group;
        if (!group) {
          setErrorMessage('Study group not found.');
          setLoading(false);
          return;
        }

        // Authorization check: User must be creator or platform admin
        const creatorId = group.creator?._id || group.creator;
        const currentUserId = user?._id || user?.id;

        if (creatorId?.toString() !== currentUserId?.toString() && user?.role !== 'admin') {
          setErrorMessage('You do not have permission to edit this group. Only the group creator or admin can update details.');
          setLoading(false);
          return;
        }

        setFormData({
          name: group.name || '',
          subject: group.subject || '',
          description: group.description || '',
          department: group.department || '',
          semester: group.semester || '',
          skillLevel: group.skillLevel || 'All Levels',
          maxMembers: group.maxMembers || 10,
          visibility: group.visibility || 'public',
          meetingDays: group.meetingDays || ['Monday', 'Wednesday'],
          meetingTime: group.meetingTime || '7:00 PM',
          location: group.location || 'Online',
        });
      } catch (err) {
        if (isMounted) {
          setErrorMessage(err.response?.data?.message || 'Failed to load study group details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchGroup();
    return () => {
      isMounted = false;
    };
  }, [groupId, user]);

  const handleDayToggle = (day) => {
    setFormData((prev) => {
      const exists = prev.meetingDays.includes(day);
      if (exists) {
        if (prev.meetingDays.length === 1) return prev; // Keep at least one day
        return { ...prev, meetingDays: prev.meetingDays.filter((d) => d !== day) };
      }
      return { ...prev, meetingDays: [...prev.meetingDays, day] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.name.trim() || !formData.subject.trim() || !formData.description.trim()) {
      setErrorMessage('Please fill in all required fields (Name, Subject, Description).');
      return;
    }

    if (formData.maxMembers < 2 || formData.maxMembers > 100) {
      setErrorMessage('Maximum members must be between 2 and 100.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.patch(`/groups/${groupId}`, formData);
      if (res.data.success) {
        setSuccessMessage('Study group updated successfully! Redirecting...');
        setTimeout(() => {
          navigate(`/groups/${groupId}`);
        }, 1200);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update study group. Please check your inputs.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium text-sm">Loading group details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (errorMessage && !formData.name) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Access Denied or Not Found</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">{errorMessage}</p>
          <div className="pt-4 flex justify-center gap-3">
            <Link
              to="/groups"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
            >
              Browse Groups
            </Link>
            <Link
              to={`/groups/${groupId}`}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors"
            >
              View Group
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to={`/groups/${groupId}`}
              className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title="Back to Group"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Edit Study Group</h1>
              <p className="text-sm text-slate-400">Update configuration, meeting schedule, and capacity.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/groups/${groupId}`}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Feedback banners */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Edit Form */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <BookOpen className="w-5 h-5 text-indigo-400" /> General Group Information
                </h2>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    maxLength={100}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Subject / Course *
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      placeholder="e.g. Distributed Systems"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Skill Level
                    </label>
                    <select
                      value={formData.skillLevel}
                      onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    >
                      {SKILL_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Description *
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    maxLength={1000}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Department & Capacity */}
              <div className="space-y-4 pt-2">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <GraduationCap className="w-5 h-5 text-indigo-400" /> Academic & Membership Settings
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Department
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    >
                      <option value="">All Departments</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Semester
                    </label>
                    <input
                      type="text"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      placeholder="e.g. 2nd Semester"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Max Members (2-100)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={100}
                      value={formData.maxMembers}
                      onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value, 10) || 10 })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Visibility Policy
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, visibility: 'public' })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formData.visibility === 'public'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-semibold text-sm">Public</p>
                      <p className="text-xs text-slate-400">Discoverable by all students</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, visibility: 'private' })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formData.visibility === 'private'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-semibold text-sm">Private</p>
                      <p className="text-xs text-slate-400">Direct invite / link only</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Schedule and Location */}
              <div className="space-y-4 pt-2">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Calendar className="w-5 h-5 text-indigo-400" /> Schedule & Meeting Location
                </h2>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Meeting Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const selected = formData.meetingDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            selected
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Meeting Time
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={formData.meetingTime}
                        onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                        placeholder="e.g. 6:30 PM - 8:00 PM"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Location / Online Link
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Google Meet or Library Room 4B"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <Link
                  to={`/groups/${groupId}`}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'Saving Changes...' : 'Update Group'}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 sticky top-24">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Live Card Preview
              </h3>

              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-md">
                    {formData.name.slice(0, 2).toUpperCase() || 'SG'}
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {formData.skillLevel}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-white text-base line-clamp-1">
                    {formData.name || 'Untitled Study Group'}
                  </h4>
                  <p className="text-xs text-indigo-400 font-medium">
                    {formData.subject || 'Subject'}
                  </p>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {formData.description || 'No description provided yet.'}
                </p>

                <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formData.meetingDays.join(', ') || 'No days selected'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formData.meetingTime || 'TBD'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formData.location || 'Online'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Up to {formData.maxMembers} members</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-xs text-slate-400 space-y-1">
                <p className="font-medium text-indigo-300">Ownership Notice</p>
                <p>Only you (group creator) and platform administrators have permissions to modify this group's schedule and settings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
