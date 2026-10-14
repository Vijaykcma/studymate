import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  KeyRound,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminProfile = () => {
  const { updateUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    department: '',
    bio: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetchProfile = async () => {
    try {
      const res = await adminAPI.getProfile();
      if (res.success && res.user) {
        setProfileData({
          name: res.user.name || '',
          email: res.user.email || '',
          department: res.user.department || '',
          bio: res.user.bio || '',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setAlert({ type: '', message: '' });

    try {
      const res = await adminAPI.updateProfile({
        name: profileData.name,
        bio: profileData.bio,
        department: profileData.department,
      });

      if (res.success) {
        setAlert({ type: 'success', message: 'Administrator profile details updated successfully.' });
        updateUser(res.user);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to update administrator profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlert({ type: 'error', message: 'New password and confirmation password do not match.' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setAlert({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    setPasswordLoading(true);
    setAlert({ type: '', message: '' });

    try {
      const res = await adminAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (res.success) {
        setAlert({ type: 'success', message: 'Administrator master password changed successfully.' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to change administrator password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AdminLayout title="Administrator Profile & Security">
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
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-lg space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Administrator Credentials</h3>
              <p className="text-xs text-slate-400">Public administrative identity details</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  disabled
                  value={profileData.email}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-white/5 rounded-xl text-slate-400 cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Email serves as cryptographic anchor; modification requires CLI bootstrap.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Department</label>
              <input
                type="text"
                value={profileData.department}
                onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Administrative Bio</label>
              <textarea
                rows={3}
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold flex items-center gap-2 transition disabled:opacity-50"
              >
                <Save size={14} />
                <span>{profileLoading ? 'Saving...' : 'Update Details'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Password Security Card */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-lg space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Password & Security Key</h3>
              <p className="text-xs text-slate-400">Change your master administrator password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Current Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">New Master Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Min 8 characters..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Repeat new password..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[11px] text-slate-400 space-y-1">
              <p>• Minimum 8 characters with numbers and symbols recommended</p>
              <p>• Password change event is recorded in the immutable audit log</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold flex items-center gap-2 transition disabled:opacity-50"
              >
                <KeyRound size={14} />
                <span>{passwordLoading ? 'Verifying...' : 'Change Password'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
