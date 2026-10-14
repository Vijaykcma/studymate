import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rateLimitInfo, setRateLimitInfo] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { adminLogin } = useAuth();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMessage('Please provide both administrator email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setRateLimitInfo('');

    try {
      const data = await adminLogin(formData);
      if (data.success && data.user) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg = err.userMessage || err.response?.data?.message || 'Authentication failed. Please verify credentials.';
      setErrorMessage(msg);
      if (err.response?.status === 429) {
        setRateLimitInfo('Rate limit triggered for security protection. Please wait before retrying.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial ambient lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 via-indigo-600 to-cyan-400 p-0.5 shadow-2xl shadow-rose-500/20 mb-4 ring-1 ring-white/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-8 h-8 text-rose-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Administrator Portal
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Authorized personnel only. All access attempts and administrative operations are cryptographically audited.
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/70 border border-rose-500/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative">
          <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
            <KeyRound size={15} className="shrink-0 text-rose-400" />
            <span>Server-enforced platform governance gateway</span>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm animate-shake">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-semibold">Authentication Denied</p>
                <p className="text-xs text-rose-400/90 mt-0.5">{errorMessage}</p>
                {rateLimitInfo && (
                  <p className="text-xs text-amber-300 mt-1 font-medium">{rateLimitInfo}</p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  id="admin-email-input"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@studymate.internal"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="admin-password-input"
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="admin-login-submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 font-semibold text-sm text-white shadow-xl shadow-rose-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Enter Console</span>
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-500">
              <CheckCircle2 size={13} className="text-emerald-400" />
              Audit Log Active
            </span>
            <Link
              to="/login"
              className="text-slate-400 hover:text-indigo-400 transition flex items-center gap-1 font-medium"
            >
              <span>Student Sign-in</span>
              <GraduationCap size={14} />
            </Link>
          </div>
        </div>

        {/* Bottom Dev Guidance Box */}
        <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
          <p>Local bootstrap admin: <code className="text-slate-400">admin@studymate.internal</code></p>
          <p>Created or promoted via CLI: <code className="text-rose-400/90">npm run create-admin</code></p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
