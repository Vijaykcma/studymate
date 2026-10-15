import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  KeyRound,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  RotateCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { authAPI } from '../services/api';

export function ForgotPassword() {
  const navigate = useNavigate();

  // Step state: 'request' | 'verify' | 'success'
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef([]);

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Handle Requesting OTP Code
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await authAPI.forgotPassword({ email });
      if (res.success) {
        setStep('verify');
        setCountdown(60);
        setSuccessMsg(res.message || 'Verification code sent to your email.');
        if (res.devOtp) setDevOtp(res.devOtp);
        if (res.previewUrl) setPreviewUrl(res.previewUrl);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 150);
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to dispatch reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP input digit change & auto-advance
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    setError('');

    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  // Resend code handler
  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    try {
      setResending(true);
      setError('');
      const res = await authAPI.forgotPassword({ email });
      if (res.success) {
        setCountdown(60);
        setSuccessMsg('A fresh verification code has been dispatched to your email.');
        if (res.devOtp) setDevOtp(res.devOtp);
        if (res.previewUrl) setPreviewUrl(res.previewUrl);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(err.userMessage || 'Could not resend reset code. Please wait.');
    } finally {
      setResending(false);
    }
  };

  // Submit Password Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setLoading(true);
      const res = await authAPI.resetPassword({
        email,
        otp: otpCode,
        newPassword,
      });

      if (res.success) {
        setStep('success');
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to reset password. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              S
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              Study<span className="text-amber-400">Mate</span>
            </span>
          </Link>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-7 md:p-9 shadow-2xl shadow-black/40">
          {/* STEP 1: REQUEST OTP */}
          {step === 'request' && (
            <div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
                  <KeyRound size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Forgot Password?
                </h2>
                <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  Enter your registered email address and we'll send a 6-digit verification code to reset your password.
                </p>
              </div>

              {error && (
                <div className="mt-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1.5">
                    Your Registered Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.edu"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-11 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Dispatching Code...</span>
                    </>
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-white/5 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-medium"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* STEP 2: VERIFY OTP & RESET PASSWORD */}
          {step === 'verify' && (
            <div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Enter Reset Code
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  We've sent a 6-digit code to{' '}
                  <span className="text-white font-semibold">{email}</span>.
                </p>
              </div>

              {/* Dev mode / Ethereal helper */}
              {devOtp && (
                <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold">Local Dev Code:</span>{' '}
                    <span className="font-mono tracking-widest text-white font-bold ml-1">
                      {devOtp}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = devOtp.split('');
                      setOtp(digits);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {previewUrl && (
                <div className="mt-2 text-center">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <Sparkles size={13} /> View Dispatched Email in Ethereal
                  </a>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && !error && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
                {/* 6 Digit Inputs */}
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-2 text-center">
                    6-Digit Verification Code
                  </label>
                  <div
                    className="flex justify-center gap-2 sm:gap-2.5"
                    onPaste={handlePaste}
                  >
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className={`w-11 h-13 text-center text-xl font-bold font-mono rounded-xl border bg-slate-950 text-white outline-none transition ${
                          digit
                            ? 'border-indigo-500 shadow-md shadow-indigo-500/20'
                            : 'border-white/10 focus:border-amber-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-11 pr-11 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-11 pr-11 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-40 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Verifying & Resetting...</span>
                    </>
                  ) : (
                    <span>Reset Password & Secure Account</span>
                  )}
                </button>
              </form>

              {/* Resend & Back */}
              <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-slate-400 hover:text-white transition flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Change Email
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || resending}
                  className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition flex items-center gap-1 font-medium"
                >
                  {resending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RotateCw size={13} />
                  )}
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Password Reset Successfully!
              </h2>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Your password has been securely updated. You can now log in using your new credentials.
              </p>

              <button
                onClick={() => navigate('/login')}
                className="w-full mt-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm text-white transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                Go to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default ForgotPassword;
