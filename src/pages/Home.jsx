import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GraduationCap,
  MessageCircle,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { statsAPI } from '../services/api';

function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 500,
    totalGroups: 80,
    totalMaterials: 120,
    totalSessions: 45,
  });
  const [popularGroups, setPopularGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsAPI.getPublicStats();
        if (data.success) {
          setStats(data.stats);
          if (data.popularGroups && data.popularGroups.length > 0) {
            setPopularGroups(data.popularGroups);
          }
        }
      } catch (err) {
        console.warn('Could not load public stats, using defaults:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const features = [
    {
      icon: Search,
      title: 'Find Study Groups',
      description: 'Discover study groups based on your subjects, semester, department and interests.',
    },
    {
      icon: Users,
      title: 'Learn Together',
      description: 'Connect with students who share your academic goals and learning interests.',
    },
    {
      icon: MessageCircle,
      title: 'Group Discussions',
      description: 'Communicate with your study group through organized real-time discussions.',
    },
    {
      icon: BookOpen,
      title: 'Share Resources',
      description: 'Upload and access notes, PDFs, presentations and other study materials.',
    },
    {
      icon: CalendarDays,
      title: 'Plan Study Sessions',
      description: 'Schedule group study sessions and keep everyone updated with notifications.',
    },
    {
      icon: ShieldCheck,
      title: 'Safe & Organized',
      description: 'A dedicated academic platform with secure accounts and managed communities.',
    },
  ];

  const defaultGroups = [
    {
      _id: '1',
      subject: 'Database Management',
      name: 'DBMS Exam Preparation',
      members: [1, 2, 3, 4, 5, 6, 7, 8],
      skillLevel: 'Intermediate',
    },
    {
      _id: '2',
      subject: 'Web Development',
      name: 'MERN Stack Learners',
      members: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      skillLevel: 'Beginner',
    },
    {
      _id: '3',
      subject: 'Algorithms',
      name: 'DAA Problem Solvers',
      members: [1, 2, 3, 4, 5, 6],
      skillLevel: 'Advanced',
    },
  ];

  const displayGroups = popularGroups.length > 0 ? popularGroups : defaultGroups;

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap size={23} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">StudyMate</h1>
              <p className="text-xs text-slate-400 mt-1">Learn Together</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#groups" className="hover:text-white transition">Study Groups</a>
            <a href="#about" className="hover:text-white transition">About</a>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-sm font-semibold transition shadow-lg shadow-rose-600/25 flex items-center gap-2 border border-rose-400/30"
                  >
                    <Shield size={16} className="text-rose-200" />
                    <span>Admin Console</span>
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                  Dashboard
                  <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/admin/login"
                  className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm shadow-rose-500/10"
                >
                  <Shield size={14} className="text-rose-400" />
                  <span>Admin Portal</span>
                </Link>
                <Link
                  to="/login"
                  className="hidden sm:block px-4 py-2 text-sm text-slate-300 hover:text-white transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-white text-slate-950 text-sm font-semibold hover:bg-slate-200 transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.15),transparent_30%)]" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-20 lg:pt-28 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 text-indigo-300 text-sm mb-7">
                <Sparkles size={15} />
                Smarter collaborative learning
              </div>

              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                Find your{' '}
                <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  perfect study
                </span>
                group.
              </h2>

              <p className="mt-7 text-lg text-slate-400 max-w-xl leading-8">
                Connect with students who share your subjects, goals and interests. Study together, share resources and achieve more.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/groups"
                  className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold transition shadow-xl shadow-indigo-600/20"
                >
                  Find a Study Group
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
                </Link>

                <Link
                  to="/groups/create"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 font-semibold transition"
                >
                  Create a Group
                </Link>

                <Link
                  to="/admin/login"
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-300 hover:text-white font-semibold transition text-sm"
                >
                  <Shield size={16} className="text-rose-400" />
                  <span>Admin Access</span>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-emerald-400" />
                  Student focused
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-emerald-400" />
                  Easy to use
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-emerald-400" />
                  Real-time collaboration
                </div>
              </div>
            </div>

            {/* Hero Card */}
            <div className="relative">
              <div className="absolute -inset-8 bg-indigo-600/20 blur-3xl rounded-full" />

              <div className="relative rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-slate-400">Your Study Portal</p>
                    <h3 className="text-xl font-semibold mt-1">
                      {user ? `Welcome, ${user.name} 👋` : 'Welcome, Student 👋'}
                    </h3>
                  </div>

                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold">
                    {user?.name ? user.name[0].toUpperCase() : 'S'}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <Users size={19} className="text-indigo-400" />
                    <p className="text-2xl font-bold mt-3">{stats.totalGroups}</p>
                    <p className="text-xs text-slate-400">Groups</p>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <CalendarDays size={19} className="text-cyan-400" />
                    <p className="text-2xl font-bold mt-3">{stats.totalSessions}</p>
                    <p className="text-xs text-slate-400">Sessions</p>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <BookOpen size={19} className="text-violet-400" />
                    <p className="text-2xl font-bold mt-3">{stats.totalMaterials}</p>
                    <p className="text-xs text-slate-400">Materials</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Featured Study Groups</h4>
                  <Link to="/groups" className="text-xs text-indigo-400 hover:text-indigo-300">
                    View all
                  </Link>
                </div>

                <div className="space-y-3">
                  {displayGroups.slice(0, 2).map((group, idx) => (
                    <div
                      key={group._id || idx}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shrink-0">
                          <BookOpen size={20} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-400">{group.subject}</p>
                          <h5 className="font-medium truncate">{group.name || group.title}</h5>
                        </div>

                        <span className="text-xs text-emerald-400 font-medium">
                          {group.members?.length || 0} members
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-400">{stats.totalStudents}+</p>
            <p className="text-sm text-slate-400 mt-1">Students Connected</p>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-cyan-400">{stats.totalGroups}</p>
            <p className="text-sm text-slate-400 mt-1">Active Study Groups</p>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-violet-400">{stats.totalMaterials}</p>
            <p className="text-sm text-slate-400 mt-1">Resources Shared</p>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-400">{stats.totalSessions}</p>
            <p className="text-sm text-slate-400 mt-1">Sessions Scheduled</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-indigo-400 font-medium text-sm uppercase tracking-wider">
            Everything you need
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mt-3">
            Study better, <span className="text-slate-400">together.</span>
          </h2>
          <p className="text-slate-400 mt-5 leading-7">
            A dedicated platform designed to make academic collaboration simple, organized and productive.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-indigo-400/30 transition duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition">
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-semibold mt-5">{feature.title}</h3>
                <p className="text-sm text-slate-400 mt-3 leading-6">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Popular Groups Section */}
      <section id="groups" className="bg-white/[0.02] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div>
              <p className="text-cyan-400 font-medium text-sm uppercase tracking-wider">
                Explore
              </p>
              <h2 className="text-4xl font-bold mt-3">Popular study groups</h2>
              <p className="text-slate-400 mt-4">
                Find peers learning the same subjects and curriculum as you.
              </p>
            </div>

            <Link
              to="/groups"
              className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Explore all groups
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {displayGroups.slice(0, 6).map((group, idx) => (
              <div
                key={group._id || idx}
                className="rounded-2xl border border-white/10 bg-slate-900 p-6 hover:-translate-y-1 transition duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
                      <BookOpen size={21} />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-xs font-medium">
                      {group.skillLevel || 'Active'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-6">{group.subject}</p>
                  <h3 className="text-xl font-semibold mt-2">{group.name || group.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {group.description || 'Collaborative study group for examination prep.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Users size={14} />
                    <span>{group.members?.length || 0} members</span>
                  </div>

                  <Link
                    to={group._id && group._id.length > 5 ? `/groups/${group._id}` : '/groups'}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    View Group <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="max-w-5xl mx-auto px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-600/20 to-cyan-500/10 p-10 md:p-16 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),transparent_55%)]" />

          <div className="relative">
            <Sparkles className="mx-auto text-indigo-400" size={30} />
            <h2 className="text-4xl md:text-5xl font-bold mt-5">
              Your next study partner <span className="block text-indigo-400">is waiting.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-slate-400 mt-5 leading-7">
              Join a dedicated community where students learn, collaborate and achieve their academic goals together.
            </p>
            <Link
              to={user ? '/dashboard' : '/register'}
              className="mt-8 px-7 py-3.5 rounded-xl bg-white text-slate-950 font-semibold hover:bg-slate-200 transition inline-flex items-center gap-2"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap size={20} className="text-indigo-400" />
            <span className="font-semibold">StudyMate</span>
          </div>
          <p className="text-sm text-slate-500">
            Digital Study Group Finder • MERN Stack Platform
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link
              to="/admin/login"
              className="text-slate-500 hover:text-rose-400 font-medium transition flex items-center gap-1.5"
            >
              <Shield size={13} className="text-rose-500" />
              <span>Admin Portal</span>
            </Link>
            <span className="text-slate-700">•</span>
            <span className="text-slate-500">© 2026 StudyMate</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;