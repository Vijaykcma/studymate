import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'MCA',
    semester: '1st Semester',
    password: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!agreed) {
      setError('Please accept the platform guidelines to continue.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await register(formData);
      navigate('/verify-email', {
        replace: true,
        state: { email: formData.email, devOtp: res?.devOtp, justRegistered: true },
      });
    } catch (err) {
      setError(err.userMessage || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-10 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-lg">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap size={28} />
            </div>
          </div>

          <div className="text-center mt-6">
            <h1 className="text-3xl font-bold">Create your account</h1>
            <p className="text-slate-400 mt-2 text-sm">
              Join students who are learning and collaborating together.
            </p>
          </div>

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="text-sm text-slate-300 font-medium">
                Full name
              </label>

              <div className="relative mt-2">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-11 py-3.5 outline-none focus:border-indigo-500 transition placeholder:text-slate-600 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 font-medium">
                Email address
              </label>

              <div className="relative mt-2">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-11 py-3.5 outline-none focus:border-indigo-500 transition placeholder:text-slate-600 text-sm"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 font-medium">
                  Department
                </label>

                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full mt-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-3.5 outline-none focus:border-indigo-500 transition text-slate-200 text-sm"
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
                <label className="text-sm text-slate-300 font-medium">
                  Semester
                </label>

                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full mt-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-3.5 outline-none focus:border-indigo-500 transition text-slate-200 text-sm"
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

            <div>
              <label className="text-sm text-slate-300 font-medium">
                Password
              </label>

              <div className="relative mt-2">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password (min 6 characters)"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-11 pr-12 py-3.5 outline-none focus:border-indigo-500 transition placeholder:text-slate-600 text-sm"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-indigo-500"
              />

              <span>
                I agree to StudyMate platform terms and academic community guidelines.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3.5 font-semibold transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-7">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Sign in
            </Link>
          </p>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 hover:text-white text-xs font-semibold transition"
            >
              <Shield size={14} className="text-rose-400" />
              <span>Administrator Portal Access</span>
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Digital Study Group Finder • MERN Stack Platform
        </p>
      </div>
    </div>
  );
}

export default Register;