import React, { useState } from 'react';
import { X, Users, Sparkles } from 'lucide-react';
import { groupsAPI } from '../../services/api';

export function NewGroupModal({ isOpen, onClose, onGroupCreated, isDark }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !description.trim()) return;

    try {
      setLoading(true);
      setError('');
      const res = await groupsAPI.create({
        name: name.trim(),
        subject: subject.trim(),
        description: description.trim(),
      });

      if (res.success && res.group) {
        setName('');
        setSubject('');
        setDescription('');
        if (onGroupCreated) onGroupCreated(res.group);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl border ${
          isDark ? 'border-white/10 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'
        } shadow-2xl p-6 space-y-4`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="text-indigo-400" size={20} />
            <h3 className="font-bold text-base">Create Study Group</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Advanced Java & Spring Boot"
              className={`w-full rounded-xl px-3.5 py-2.5 text-xs outline-none border ${
                isDark ? 'bg-slate-950 border-white/10 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600'
              }`}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Subject / Topic
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Software Engineering"
              className={`w-full rounded-xl px-3.5 py-2.5 text-xs outline-none border ${
                isDark ? 'bg-slate-950 border-white/10 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600'
              }`}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Group Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe group goals, syllabus chapters, or meeting schedule..."
              className={`w-full rounded-xl p-3 text-xs outline-none resize-none border ${
                isDark ? 'bg-slate-950 border-white/10 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600'
              }`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !subject.trim() || !description.trim() || loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs transition disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>{loading ? 'Creating...' : 'Create Group'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
