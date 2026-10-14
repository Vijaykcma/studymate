import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/20 mb-4">
          <GraduationCap size={32} />
        </div>
        <p className="text-slate-400 text-sm font-medium">Loading StudyMate...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/20 mb-4">
          <GraduationCap size={32} />
        </div>
        <p className="text-slate-400 text-sm font-medium">Loading StudyMate...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/20 mb-4">
          <GraduationCap size={32} />
        </div>
        <p className="text-slate-400 text-sm font-medium">Verifying Administrator Access...</p>
      </div>
    );
  }

  // Not signed in at all
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Signed in as ordinary student/user: Reject access to platform admin area
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6 shadow-xl shadow-rose-500/10">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Access Denied (HTTP 403)</h2>
        <p className="text-slate-400 max-w-md text-sm mb-6 leading-relaxed">
          Platform administration tools are strictly restricted to verified platform administrators. Your student account does not have authorization to view this area.
        </p>
        <Navigate to="/dashboard" replace />
      </div>
    );
  }

  return children;
};

export const AdminPublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/20 mb-4">
          <GraduationCap size={32} />
        </div>
        <p className="text-slate-400 text-sm font-medium">Loading StudyMate Admin...</p>
      </div>
    );
  }

  if (user && user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};
