import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import api from '../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkToken = async () => {
      if (!token) {
        if (isMounted) {
          setValidating(false);
          setTokenValid(false);
          setErrorMessage('No password reset token was provided in the URL.');
        }
        return;
      }

      try {
        const res = await api.get(`/auth/reset-password/${token.trim()}`);
        if (isMounted) {
          if (res.data.valid) {
            setTokenValid(true);
            setUserEmail(res.data.email || '');
          } else {
            setTokenValid(false);
            setErrorMessage(res.data.message || 'Invalid or expired password reset link.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setTokenValid(false);
          setErrorMessage(
            err.response?.data?.message || 'Invalid or expired password reset link.'
          );
        }
      } finally {
        if (isMounted) {
          setValidating(false);
        }
      }
    };

    checkToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/auth/reset-password/${token.trim()}`, {
        newPassword: password,
      });

      if (res.data.success) {
        setResetSuccess(true);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to reset password. Please try again or request a new link.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-indigo-500/30">
      {/* Background radial glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/15 to-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">StudyMate</span>
        </Link>
        <Link
          to="/login"
          className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          Back to Sign In
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          {validating ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <h2 className="text-lg font-semibold text-white">Validating Security Token</h2>
              <p className="text-sm text-slate-400">Please wait while we verify your password reset authorization...</p>
            </div>
          ) : resetSuccess ? (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Password Reset Complete!</h2>
                <p className="text-sm text-slate-400">
                  Your password has been securely updated. You can now log into your account with your new credentials.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
              >
                Proceed to Sign In <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : !tokenValid ? (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Reset Link Expired or Invalid</h2>
                <p className="text-sm text-slate-400">
                  {errorMessage || 'For your security, password reset links expire after 15 minutes or can only be used once.'}
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-3">
                <Link
                  to="/forgot-password"
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-center text-sm transition-colors"
                >
                  Request a New Reset Link
                </Link>
                <Link
                  to="/login"
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-center text-sm transition-colors"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Form Header */}
              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Create New Password</h1>
                <p className="text-sm text-slate-400">
                  {userEmail ? (
                    <>
                      Updating account for <span className="text-slate-200 font-medium">{userEmail}</span>
                    </>
                  ) : (
                    'Enter your new strong password below.'
                  )}
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Must be at least 6 characters. Use letters & numbers for security.</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all mt-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Reset Password
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} StudyMate Platform. Authorized Academic Collaboration Network.
      </footer>
    </div>
  );
}
