import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Home, ArrowLeft } from 'lucide-react';

function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20">
          <GraduationCap size={40} />
        </div>

        <h1 className="text-7xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
          404
        </h1>
        <h2 className="text-2xl font-bold mt-4">Page Not Found</h2>
        <p className="text-slate-400 mt-3 text-sm leading-relaxed">
          The study session or page you are looking for does not exist or has been moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to="/dashboard"
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold transition flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 font-semibold transition flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
