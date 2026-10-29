import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Edit3,
  Save,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { userAPI, groupsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [stats, setStats] = useState({
    groupsJoined: 0,
    groupsCreated: 0,
    sessionsOrganized: 0,
    materialsUploaded: 0,
  });

  const [createdGroups, setCreatedGroups] = useState([]);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || 'MCA',
    semester: user?.semester || '2nd Semester',
    college: user?.college || '',
    registrationNumber: user?.registrationNumber || '',
    bio: user?.bio || '',
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const [profData, grpData] = await Promise.allSettled([
        userAPI.getProfile(),
        groupsAPI.getMyGroups(),
      ]);

      if (profData.status === 'fulfilled' && profData.value.success) {
        const u = profData.value.user;
        setFormData({
          name: u.name || '',
          email: u.email || '',
          department: u.department || 'MCA',
          semester: u.semester || '2nd Semester',
          college: u.college || '',
          registrationNumber: u.registrationNumber || '',
          bio: u.bio || '',
        });
        setStats(profData.value.stats || {});
      }

      if (grpData.status === 'fulfilled' && grpData.value.success) {
        setCreatedGroups(grpData.value.created || []);
        setJoinedGroups(grpData.value.joined || []);
      }
    } catch (err) {
      setError(err.userMessage || 'Could not load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const res = await userAPI.updateProfile(formData);
      if (res.success && res.user) {
        updateUser(res.user);
        setFeedback('Profile updated successfully!');
        setTimeout(() => setFeedback(''), 3000);
        setEditing(false);
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Student Profile</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage your academic credentials and study preferences.
            </p>
          </div>

          <div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer text-white"
              >
                <Edit3 size={15} /> Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>
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

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <p className="text-sm">Loading profile information...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Card: Summary */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center mx-auto text-2xl font-bold shadow-xl shadow-indigo-500/20 text-white">
                  {formData.name ? formData.name[0].toUpperCase() : 'S'}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white">{formData.name}</h2>
                  <p className="text-xs text-indigo-400 font-medium mt-0.5">
                    {formData.department} • {formData.semester}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{formData.email}</p>
                  
                  {user?.isEmailVerified ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold mt-2.5">
                      <ShieldCheck size={13} className="text-emerald-400" />
                      <span>Authorized Real User (Verified)</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 mt-2.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                        <AlertCircle size={13} className="text-amber-400" />
                        <span>Email Not Verified</span>
                      </div>
                      <Link
                        to="/verify-email"
                        state={{ email: user?.email }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                      >
                        Verify Email Now
                      </Link>
                    </div>
                  )}
                </div>

                {formData.bio && (
                  <p className="text-xs text-slate-400 border-t border-white/5 pt-4 leading-relaxed">
                    "{formData.bio}"
                  </p>
                )}
              </div>

              {/* Stats Card */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Academic Participation
                </h3>

                <div className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                  <span className="text-slate-400">Study Groups Joined</span>
                  <span className="font-bold text-white">{stats.groupsJoined}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                  <span className="text-slate-400">Study Groups Created</span>
                  <span className="font-bold text-white">{stats.groupsCreated}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                  <span className="text-slate-400">Sessions Organized</span>
                  <span className="font-bold text-white">{stats.sessionsOrganized}</span>
                </div>
                <div className="flex items-center justify-between py-2 text-xs">
                  <span className="text-slate-400">Materials Uploaded</span>
                  <span className="font-bold text-white">{stats.materialsUploaded}</span>
                </div>
              </div>
            </div>

            {/* Right Card: Details / Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 space-y-5">
                <h3 className="text-base font-semibold text-white">
                  Personal & Academic Information
                </h3>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        disabled={!editing}
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Email Address (Read-only)
                      </label>
                      <input
                        type="email"
                        disabled
                        value={formData.email}
                        className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Department</label>
                      <select
                        name="department"
                        disabled={!editing}
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-60"
                      >
                        <option value="MCA">MCA</option>
                        <option value="BCA">BCA</option>
                        <option value="B.Tech">B.Tech</option>
                        <option value="M.Tech">M.Tech</option>
                        <option value="MBA">MBA</option>
                        <option value="Data Science">Data Science</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Semester</label>
                      <select
                        name="semester"
                        disabled={!editing}
                        value={formData.semester}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-60"
                      >
                        <option value="1st Semester">1st Semester</option>
                        <option value="2nd Semester">2nd Semester</option>
                        <option value="3rd Semester">3rd Semester</option>
                        <option value="4th Semester">4th Semester</option>
                        <option value="5th Semester">5th Semester</option>
                        <option value="6th Semester">6th Semester</option>
                        <option value="7th Semester">7th Semester</option>
                        <option value="8th Semester">8th Semester</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">College / University</label>
                      <input
                        type="text"
                        name="college"
                        disabled={!editing}
                        placeholder="e.g. Apex Institute of Technology"
                        value={formData.college}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Registration / Roll No</label>
                      <input
                        type="text"
                        name="registrationNumber"
                        disabled={!editing}
                        placeholder="e.g. MCA2026-001"
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Academic Bio</label>
                    <textarea
                      name="bio"
                      disabled={!editing}
                      rows={3}
                      placeholder="Share your subjects of interest, career goals, or learning style..."
                      value={formData.bio}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-60 resize-none"
                    />
                  </div>
                </form>
              </div>

              {/* My Study Groups Preview */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Groups Administered by You</h3>
                  <Link to="/my-groups" className="text-xs text-indigo-400 hover:underline">
                    View All
                  </Link>
                </div>

                {createdGroups.length === 0 ? (
                  <p className="text-xs text-slate-500">You have not created any study groups yet.</p>
                ) : (
                  <div className="space-y-2">
                    {createdGroups.slice(0, 3).map((g) => (
                      <div
                        key={g._id}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-semibold text-white">{g.name}</p>
                          <p className="text-[11px] text-slate-400">{g.subject}</p>
                        </div>
                        <Link
                          to={`/groups/${g._id}`}
                          className="text-xs text-indigo-400 hover:underline"
                        >
                          Manage
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Profile;