import React, { useState } from 'react';
import { X, Plus, BarChart2, Trash2 } from 'lucide-react';

export function PollModal({ isOpen, onClose, onSendPoll, isDark }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, idx) => idx !== index));
    }
  };

  const handleOptionChange = (text, index) => {
    const updated = [...options];
    updated[index] = text;
    setOptions(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || validOptions.length < 2) return;

    onSendPoll({
      question: question.trim(),
      options: validOptions.map((text) => ({ text, votes: [] })),
    });

    setQuestion('');
    setOptions(['', '']);
    onClose();
  };

  const canSubmit = question.trim() && options.filter((o) => o.trim()).length >= 2;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl border ${
          isDark ? 'border-white/10 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'
        } shadow-2xl p-6 space-y-4`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <BarChart2 className="text-indigo-400" size={20} />
            <h3 className="font-bold text-base">Create Study Poll</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. When should we have our Data Structures exam prep?"
              className={`w-full rounded-xl px-3.5 py-2.5 text-xs outline-none border ${
                isDark ? 'bg-slate-950 border-white/10 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600'
              }`}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 block">
              Options
            </label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(e.target.value, idx)}
                  placeholder={`Option ${idx + 1}`}
                  className={`flex-1 rounded-xl px-3.5 py-2 text-xs outline-none border ${
                    isDark ? 'bg-slate-950 border-white/10 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600'
                  }`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}

            {options.length < 10 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add another option</span>
              </button>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs transition disabled:opacity-50 shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              Send Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
