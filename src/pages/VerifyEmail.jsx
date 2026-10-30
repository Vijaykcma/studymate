import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  Mail,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/api';

function VerifyEmail() {
  const { user, verifyEmail } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract potential query parameters from email link (e.g. /verify-email?email=abc@xyz.com&code=123456)
  const searchParams = new URLSearchParams(location.search);
  const queryEmail = searchParams.get('email') || '';
  const queryCode = searchParams.get('code') || searchParams.get('otp') || '';

  // Retrieve email and potential dev OTP from URL query, state, or current user
  const initialEmail = queryEmail || location.state?.email || user?.email || '';
  const initialDevOtp = queryCode || location.state?.devOtp || '';
  const justRegistered = Boolean(location.state?.justRegistered);

  const [email, setEmail] = useState(initialEmail);
  const [devOtp, setDevOtp] = useState(initialDevOtp);
  const [digits, setDigits] = useState(
    initialDevOtp && initialDevOtp.length === 6 ? initialDevOtp.split('') : ['', '', '', '', '', '']
  );
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    initialDevOtp && initialDevOtp.length === 6
      ? 'Verification code loaded! Verifying...'
      : ''
  );
  const [cooldown, setCooldown] = useState(justRegistered ? 60 : 0);
  const [isVerified, setIsVerified] = useState(user?.isEmailVerified || false);

  const inputRefs = useRef([]);
  const autoVerifiedRef = useRef(false);

  // Auto-focus first digit on load if empty
  useEffect(() => {
    if (!initialDevOtp && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [initialDevOtp]);

  // Instant Auto-Verification when coming directly from Email Link
  useEffect(() => {
    if (
      queryEmail &&
      queryCode &&
      queryCode.length === 6 &&
      !isVerified &&
      !autoVerifiedRef.current
    ) {
      autoVerifiedRef.current = true;
      const executeInstantVerification = async () => {
        try {
          setSubmitting(true);
          setError('');
          setSuccessMessage('Verifying your email link...');

          const res = await verifyEmail({
            email: queryEmail.trim(),
            otp: queryCode.trim(),
          });

          if (res.success) {
            setIsVerified(true);
            setSuccessMessage('Email verified successfully! Welcome to StudyMate.');
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1500);
          }
        } catch (err) {
          setError(err.userMessage || 'Verification link expired or invalid. Please request a new code.');
        } finally {
          setSubmitting(false);
        }
      };
      executeInstantVerification();
    }
  }, [queryEmail, queryCode]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (index, value) => {
    if (error) setError('');
    const cleanVal = value.replace(/\D/g, ''); // digits only

    if (!cleanVal) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
      return;
    }

    // Single character input
    const char = cleanVal.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = char;
    setDigits(nextDigits);

    // Auto-advance to next input
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Jump back on backspace when current input is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pasted.length >= 6) {
      const pasteDigits = pasted.slice(0, 6).split('');
      setDigits(pasteDigits);
      inputRefs.current[5]?.focus();
    }
  };

  const autofillDevOtp = () => {
    if (devOtp && devOtp.length === 6) {
      setDigits(devOtp.split(''));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const otp = digits.join('');

    if (!email.trim()) {
      setError('Please provide the registered email address.');
      return;
    }

    if (otp.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccessMessage('');

      const res = await verifyEmail({ email: email.trim(), otp });

      if (res.success) {
        setIsVerified(true);
        setSuccessMessage('Email verified successfully! You are now an authorized and real user.');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1800);
      }
    } catch (err) {
      setError(err.userMessage || 'Invalid or expired verification code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email.trim()) return;

    try {
      setResending(true);
      setError('');
      setSuccessMessage('');

      const res = await authAPI.resendOtp({ email: email.trim() });
      if (res.success) {
        setCooldown(60);
        setSuccessMessage(res.message || 'A fresh 6-digit verification code has been dispatched.');
        if (res.devOtp) {
          setDevOtp(res.devOtp);
          setDigits(res.devOtp.split(''));
        }
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to resend code. Please try again shortly.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} flex items-center justify-center px-6 py-12 selection:bg-indigo-500 selection:text-white transition-colors duration-200`}>
      <div className="w-full max-w-lg">
        <Link
          to="/login"
          className={`inline-flex items-center gap-2 text-sm mb-8 transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>

        <div className={`rounded-3xl border p-8 md:p-10 shadow-2xl relative overflow-hidden transition-colors ${
          isDark ? 'border-white/10 bg-slate-900/90 text-white shadow-indigo-950/40' : 'border-slate-200 bg-white text-slate-900 shadow-xl'
        }`}>
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Icon Badge */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-indigo-500/25 ring-8 ring-indigo-500/10">
              {isVerified ? (
                <ShieldCheck size={32} className="text-white" />
              ) : (
                <Mail size={30} className="text-white" />
              )}
            </div>
          </div>

          <div className="text-center mt-6">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {isVerified ? 'Account Verified!' : 'Verify Your Email Address'}
            </h1>
            <p className={`mt-2 text-sm leading-relaxed max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {isVerified ? (
                'Your email has been authenticated. Redirecting to your dashboard...'
              ) : (
                <>
                  We sent a 6-digit verification code to{' '}
                  <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{email || 'your email'}</span>. Enter it below to verify your authorized status.
                </>
              )}
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-sm flex items-start gap-3">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* OTP Banner Helper */}
          {devOtp && !isVerified && (
            <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-cyan-500/15 border border-indigo-500/40 text-indigo-300 text-xs flex items-center justify-between gap-3 shadow-lg shadow-indigo-500/10">
              <div className="flex items-center gap-2.5 truncate">
                <KeyRound size={18} className="shrink-0 text-cyan-500" />
                <div className="truncate">
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Verification Passcode:</p>
                  <p className={`tracking-widest font-mono text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{devOtp}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={autofillDevOtp}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                Auto-fill Code
              </button>
            </div>
          )}

          {!isVerified && (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {/* Recipient Email */}
              <div>
                <label className={`text-xs uppercase tracking-wider font-semibold block mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Recipient Email
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="student@example.com"
                    className={`w-full rounded-xl border px-11 py-3 text-sm outline-none focus:border-indigo-500 transition ${
                      isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* 6 Digit OTP Inputs */}
              <div>
                <label className={`text-xs uppercase tracking-wider font-semibold block mb-3 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Enter 6-Digit Verification Code
                </label>
                <div
                  className="flex justify-between gap-2 sm:gap-3"
                  onPaste={handlePaste}
                >
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border text-center font-mono text-xl sm:text-2xl font-bold transition outline-none ${
                        digit
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-white shadow-lg shadow-indigo-500/10'
                          : isDark
                          ? 'border-white/15 bg-slate-950 text-slate-200 focus:border-indigo-500'
                          : 'border-slate-300 bg-white text-slate-900 focus:border-indigo-500'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={submitting || digits.join('').length !== 6}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 py-3.5 font-semibold text-white transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Verifying authorized user...
                  </>
                ) : (
                  <>
                    <span>Verify & Confirm Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Resend Code Section */}
              <div className={`flex flex-col sm:flex-row items-center justify-between text-xs pt-3 border-t gap-2 ${
                isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'
              }`}>
                <span>Didn't receive the email? Check spam or:</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || resending}
                  className="inline-flex items-center gap-1.5 font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:text-slate-400 transition cursor-pointer px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 disabled:bg-transparent"
                >
                  {resending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RotateCcw size={13} />
                  )}
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send / Resend Code'}
                </button>
              </div>

              {/* Skip for now & continue directly to dashboard */}
              <div className={`pt-2 text-center border-t ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center gap-1.5 text-xs transition py-2 px-3 rounded-xl ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>Skip for now & explore study groups (verify later)</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </form>
          )}

          {isVerified && (
            <div className="mt-8 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-semibold">
                <CheckCircle2 size={14} />
                <span>Authorized Real Student Status Confirmed</span>
              </div>
              <div>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Security Assurance */}
        <div className={`mt-6 text-center text-xs flex items-center justify-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Real-user authentication safeguards the academic integrity of study groups.</span>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
