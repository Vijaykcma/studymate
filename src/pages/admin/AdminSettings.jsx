import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Save,
  ShieldAlert,
  Megaphone,
  UploadCloud,
  Users,
  Layers,
  Wrench,
  Mail,
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { adminAPI } from '../../services/api';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowStudentRegistration: true,
    allowGroupCreation: true,
    allowMaterialUploads: true,
    requireEmailVerification: true,
    maxUploadSizeMB: 15,
    systemAnnouncement: '',
    systemAnnouncementActive: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [confirmMaintenanceModal, setConfirmMaintenanceModal] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to load platform settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = (key) => {
    if (key === 'maintenanceMode' && !settings.maintenanceMode) {
      // Prompt confirmation before turning ON maintenance mode
      setConfirmMaintenanceModal(true);
      return;
    }
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setAlert({ type: '', message: '' });

    try {
      const res = await adminAPI.updateSettings(settings);
      if (res.success) {
        setAlert({ type: 'success', message: 'Platform settings saved and applied successfully across all cluster nodes.' });
        setSettings(res.data);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.userMessage || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="System Platform Settings">
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

      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Fetching verified cluster configuration...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Critical System Mode */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wrench size={18} className="text-rose-400" />
                  <span>Maintenance Mode</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                  When enabled, all student-facing endpoints return HTTP 503 Service Unavailable with a maintenance notice. Only administrators can authenticate and access the API.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggle('maintenanceMode')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.maintenanceMode ? 'bg-rose-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.maintenanceMode && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                <span>
                  <strong>Active Warning:</strong> Public and student access is currently paused. Remember to turn off maintenance mode once database migrations or updates are complete.
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Student Functional Permissions */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-lg space-y-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders size={16} className="text-indigo-400" />
              <span>Platform Gateways & Throttling</span>
            </h3>

            <div className="divide-y divide-white/5 space-y-4">
              {/* Allow Student Registration */}
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Users size={16} className="text-indigo-400" />
                    <span>Student Registration</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Allow new students to register accounts at <code>/register</code>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle('allowStudentRegistration')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.allowStudentRegistration ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.allowStudentRegistration ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Allow Group Creation */}
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers size={16} className="text-cyan-400" />
                    <span>Study Group Creation</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Allow students to create new public or private study groups.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle('allowGroupCreation')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.allowGroupCreation ? 'bg-cyan-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.allowGroupCreation ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Allow Material Uploads */}
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <UploadCloud size={16} className="text-emerald-400" />
                    <span>Study Material Uploads</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Allow students to upload new study PDFs, slide decks, and code archives.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle('allowMaterialUploads')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.allowMaterialUploads ? 'bg-emerald-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.allowMaterialUploads ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Mandatory Email Verification */}
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Mail size={16} className="text-purple-400" />
                    <span>Mandatory Email Verification</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Requires new students to verify a 6-digit OTP sent to their email to confirm authorized real user status.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle('requireEmailVerification')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.requireEmailVerification ? 'bg-purple-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.requireEmailVerification ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Max Upload Limit in MB */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">Maximum File Size Limit (MB)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configures server-side Multer upload boundary (min: 1 MB, max: 100 MB).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.maxUploadSizeMB}
                    onChange={(e) => setSettings({ ...settings, maxUploadSizeMB: e.target.value })}
                    className="w-24 px-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-white text-xs text-center font-bold focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-xs text-slate-400 font-semibold">MB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Broadcast Announcement */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Megaphone size={18} className="text-amber-400" />
                  <span>Platform Broadcast Announcement</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Displays an alert message across the student portal banner.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggle('systemAnnouncementActive')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.systemAnnouncementActive ? 'bg-amber-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.systemAnnouncementActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Announcement Message
              </label>
              <textarea
                rows={3}
                value={settings.systemAnnouncement}
                onChange={(e) => setSettings({ ...settings, systemAnnouncement: e.target.value })}
                placeholder="E.g. Final exam revision groups now open. Welcome to 2nd semester!"
                className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? 'Saving System State...' : 'Save Configuration Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Confirmation Modal for Maintenance Mode */}
      {confirmMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 text-rose-400">
              <AlertTriangle size={20} />
              <span>Confirm Maintenance Mode</span>
            </h3>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Enabling maintenance mode will temporarily disconnect student access across the entire campus. Only administrators will have login privileges. Are you sure you wish to proceed?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setConfirmMaintenanceModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettings((prev) => ({ ...prev, maintenanceMode: true }));
                  setConfirmMaintenanceModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition"
              >
                Enable Maintenance
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSettings;
