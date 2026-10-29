import React, { useState } from 'react';
import { X, Radio, Send, Check } from 'lucide-react';
import { messagesAPI } from '../../services/api';

export function BroadcastModal({ isOpen, onClose, peers = [], isDark, onBroadcastSent }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleToggleSelect = (id) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === peers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(peers.map((p) => p._id)));
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || selectedIds.size === 0) return;

    try {
      setLoading(true);
      setError('');
      const res = await messagesAPI.broadcast({
        recipientIds: Array.from(selectedIds),
        content: content.trim(),
      });

      if (res.success) {
        setContent('');
        setSelectedIds(new Set());
        if (onBroadcastSent) onBroadcastSent();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send broadcast.');
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
            <Radio className="text-cyan-400" size={20} />
            <h3 className="font-bold text-base">New Broadcast List</h3>
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

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-400">
                Select Recipients ({selectedIds.size} of {peers.length})
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
              >
                {selectedIds.size === peers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className={`max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl border ${
              isDark ? 'bg-slate-950 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              {peers.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-400">No contacts available.</p>
              ) : (
                peers.map((peer) => {
                  const isChecked = selectedIds.has(peer._id);
                  return (
                    <div
                      key={peer._id}
                      onClick={() => handleToggleSelect(peer._id)}
                      className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition ${
                        isChecked
                          ? isDark ? 'bg-indigo-600/20 border border-indigo-500/40' : 'bg-indigo-50 border border-indigo-200'
                          : isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-white font-bold text-xs flex items-center justify-center">
                          {peer.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold leading-none">{peer.name}</p>
                          <span className="text-[10px] text-slate-400">
                            {peer.department || 'Student'}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          isChecked
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : isDark ? 'border-white/20' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <Check size={13} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Broadcast Message
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type message to broadcast to all selected classmates..."
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
              disabled={!content.trim() || selectedIds.size === 0 || loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs transition disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Send size={14} />
              <span>{loading ? 'Sending...' : `Broadcast (${selectedIds.size})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
