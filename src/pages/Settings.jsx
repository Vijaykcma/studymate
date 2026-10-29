import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Lock,
  LogOut,
  Moon,
  Save,
  Shield,
  Trash2,
  AlertCircle,
  Loader2,
  User,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    groupInvites: true,
    profileVisible: true,
    darkMode: true,
  });

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await userAPI.getSettings();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (err) {
        setSettingsError(err.userMessage || 'Could not load settings.');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      setSettingsError('');
      const res = await userAPI.updateSettings(settings);
      if (res.success) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2500);
      }
    } catch (err) {
      setSettingsError(err.userMessage || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordError('');
      const res = await userAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (res.success) {
        setPasswordSuccess('Password changed successfully.');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setPasswordSuccess(''), 3000);
      }
    } catch (err) {
      setPasswordError(err.userMessage || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      await userAPI.deleteAccount();
      await logout();
      navigate('/register');
    } catch (err) {
      alert(err.userMessage || 'Failed to delete account.');
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure system notifications, security credentials, and preferences.
          </p>
        </div>

        {/* Preferences Section */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-base text-white">Notifications & Privacy</h2>
                <p className="text-xs text-slate-400">
                  Control alert delivery and public visibility.
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer text-white"
            >
              {savingSettings ? (
                <Loader2 size={14} className="animate-spin" />
              ) : settingsSaved ? (
                <CheckCircle2 size={14} className="text-emerald-400" />
              ) : (
                <Save size={14} />
              )}
              {settingsSaved ? 'Saved' : 'Save Preferences'}
            </button>
          </div>

          {settingsError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{settingsError}</span>
            </div>
          )}

          <div className="divide-y divide-white/5 pt-2">
            <div className="py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">In-App Notifications</p>
                <p className="text-xs text-slate-400">Receive alerts for new sessions and messages</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={() => handleToggle('notifications')}
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Email Summaries</p>
                <p className="text-xs text-slate-400">Weekly digests of group study resources</p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Group Invites</p>
                <p className="text-xs text-slate-400">Allow other students to invite you to study groups</p>
              </div>
              <input
                type="checkbox"
                checked={settings.groupInvites}
                onChange={() => handleToggle('groupInvites')}
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Public Profile</p>
                <p className="text-xs text-slate-400">Make your name visible in member directories</p>
              </div>
              <input
                type="checkbox"
                checked={settings.profileVisible}
                onChange={() => handleToggle('profileVisible')}
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-base text-white">Change Password</h2>
              <p className="text-xs text-slate-400">
                Update your account password with current verification.
              </p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Current Password</label>
              <input
                type="password"
                required
                placeholder="Enter current password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center gap-2 cursor-pointer"
            >
              {savingPassword ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] p-6 space-y-4">
          <h2 className="font-semibold text-base text-rose-400">Danger Zone</h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <p className="text-sm font-semibold text-white">Log Out</p>
              <p className="text-xs text-slate-400">End your current session on this device</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold text-slate-300 self-start sm:self-auto cursor-pointer"
            >
              Sign Out
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-rose-500/10">
            <div>
              <p className="text-sm font-semibold text-white">Delete Account</p>
              <p className="text-xs text-slate-400">Permanently delete your account, created groups, and data</p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white self-start sm:self-auto cursor-pointer"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-900 p-6 md:p-8 shadow-2xl text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
                <Trash2 size={28} />
              </div>

              <h3 className="text-lg font-bold text-white">Delete Account Permanently?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This action is irreversible. All study groups created by you will be deleted, and you will be removed from all enrolled groups.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {deleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    'Confirm Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Settings;