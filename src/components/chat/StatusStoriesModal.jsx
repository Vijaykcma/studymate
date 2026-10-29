import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Eye, ChevronLeft, ChevronRight, Send, Palette, Camera } from 'lucide-react';
import { messagesAPI } from '../../services/api';

const STATUS_COLORS = [
  '#4f46e5', // indigo
  '#059669', // emerald
  '#dc2626', // rose
  '#d97706', // amber
  '#7c3aed', // purple
  '#0284c7', // cyan
  '#0f172a', // slate
];

export function StatusStoriesModal({
  isOpen,
  onClose,
  stories = [], // array of { user: object, statuses: array, hasUnviewed: boolean }
  currentUser,
  onStatusCreated,
}) {
  const [activeStoryGroup, setActiveStoryGroup] = useState(null); // { user, statuses }
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [newStatusText, setNewStatusText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#4f46e5');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef(null);

  // If active story group open, auto-advance progress bar
  useEffect(() => {
    if (!activeStoryGroup || isCreating) return;

    setProgress(0);
    const duration = 5000; // 5 seconds per status
    const interval = 50;
    const step = (interval / duration) * 100;

    const currentStatus = activeStoryGroup.statuses[activeStatusIndex];
    if (currentStatus && currentStatus._id) {
      messagesAPI.viewStatus(currentStatus._id).catch(() => {});
    }

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timerRef.current);
          handleNextStatus();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [activeStoryGroup, activeStatusIndex, isCreating]);

  const handleNextStatus = () => {
    if (!activeStoryGroup) return;
    if (activeStatusIndex < activeStoryGroup.statuses.length - 1) {
      setActiveStatusIndex((prev) => prev + 1);
    } else {
      // Find next story group
      const currentIndex = stories.findIndex(
        (s) => s.user?._id === activeStoryGroup.user?._id
      );
      if (currentIndex !== -1 && currentIndex < stories.length - 1) {
        setActiveStoryGroup(stories[currentIndex + 1]);
        setActiveStatusIndex(0);
      } else {
        setActiveStoryGroup(null);
      }
    }
  };

  const handlePrevStatus = () => {
    if (!activeStoryGroup) return;
    if (activeStatusIndex > 0) {
      setActiveStatusIndex((prev) => prev - 1);
    } else {
      const currentIndex = stories.findIndex(
        (s) => s.user?._id === activeStoryGroup.user?._id
      );
      if (currentIndex > 0) {
        const prevGroup = stories[currentIndex - 1];
        setActiveStoryGroup(prevGroup);
        setActiveStatusIndex(prevGroup.statuses.length - 1);
      }
    }
  };

  const handleCreateStatus = async (e) => {
    e?.preventDefault();
    if (!newStatusText.trim()) return;

    try {
      setLoading(true);
      const res = await messagesAPI.createStatus({
        content: newStatusText.trim(),
        mediaType: 'text',
        backgroundColor: selectedColor,
      });

      if (res.success) {
        setNewStatusText('');
        setIsCreating(false);
        if (onStatusCreated) onStatusCreated();
      }
    } catch (err) {
      console.error('Failed to create status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentStatus = activeStoryGroup?.statuses?.[activeStatusIndex];
  const isMyStatus = activeStoryGroup?.user?._id === currentUser?._id;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      {/* 1. Fullscreen / Modal Story Viewer */}
      {activeStoryGroup && currentStatus ? (
        <div
          style={{ backgroundColor: currentStatus.backgroundColor || '#4f46e5' }}
          className="w-full max-w-md h-[580px] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col justify-between p-6 text-white transition-all"
        >
          {/* Top Progress Bars */}
          <div className="flex items-center gap-1.5 w-full z-20">
            {activeStoryGroup.statuses.map((st, idx) => (
              <div key={st._id || idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  style={{
                    width:
                      idx === activeStatusIndex
                        ? `${progress}%`
                        : idx < activeStatusIndex
                        ? '100%'
                        : '0%',
                  }}
                  className="h-full bg-white transition-all duration-75"
                />
              </div>
            ))}
          </div>

          {/* User Header */}
          <div className="flex items-center justify-between mt-3 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shadow">
                {activeStoryGroup.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h4 className="font-bold text-sm leading-none">{activeStoryGroup.user?.name}</h4>
                <span className="text-[11px] opacity-80">
                  {new Date(currentStatus.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveStoryGroup(null)}
              className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tap Areas for Previous & Next */}
          <div className="absolute inset-y-16 inset-x-0 flex z-10">
            <div onClick={handlePrevStatus} className="w-1/3 h-full cursor-pointer" />
            <div onClick={handleNextStatus} className="w-2/3 h-full cursor-pointer" />
          </div>

          {/* Story Content Canvas */}
          <div className="my-auto text-center px-4 z-10 pointer-events-none">
            {currentStatus.mediaUrl ? (
              <img
                src={currentStatus.mediaUrl}
                alt="Status Media"
                className="max-h-[340px] max-w-full rounded-2xl mx-auto object-contain shadow-lg"
              />
            ) : null}
            <p className="text-xl sm:text-2xl font-bold leading-relaxed whitespace-pre-wrap break-words drop-shadow-md mt-4">
              {currentStatus.content}
            </p>
          </div>

          {/* Bottom Bar: Viewers count or reply */}
          <div className="flex items-center justify-between z-20 pt-2 border-t border-white/20">
            {isMyStatus ? (
              <div className="flex items-center gap-1.5 text-xs opacity-90">
                <Eye size={15} />
                <span>{currentStatus.viewers?.length || 0} views</span>
              </div>
            ) : (
              <span className="text-xs opacity-80 italic">🔒 Disappears after 24 hours</span>
            )}
            <button
              onClick={() => setActiveStoryGroup(null)}
              className="px-3 py-1 rounded-xl bg-black/30 hover:bg-black/40 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      ) : isCreating ? (
        /* 2. Create New Status Window */
        <div
          style={{ backgroundColor: selectedColor }}
          className="w-full max-w-md h-[540px] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col justify-between p-6 text-white transition-colors"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/20">
            <h3 className="font-bold text-sm">Create New Status</h3>
            <button
              onClick={() => setIsCreating(false)}
              className="p-1 rounded-full bg-black/20 hover:bg-black/30 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Textarea */}
          <div className="my-auto">
            <textarea
              value={newStatusText}
              onChange={(e) => setNewStatusText(e.target.value)}
              placeholder="What are you studying or preparing today? Type your 24h status..."
              rows={5}
              className="w-full bg-transparent text-center font-bold text-xl sm:text-2xl placeholder-white/60 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Bottom Palette and Post Button */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              {STATUS_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  style={{ backgroundColor: c }}
                  onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                    selectedColor === c ? 'scale-125 border-white shadow-lg' : 'border-white/40'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={!newStatusText.trim() || loading}
              onClick={handleCreateStatus}
              className="w-full py-3 rounded-2xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={15} />
              <span>{loading ? 'Posting...' : 'Post 24-Hour Status'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* 3. Status Tray Directory Modal */
        <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 text-white shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-bold text-base">Classmate Statuses (24h)</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* My Status Item */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border-2 border-indigo-500 text-indigo-400 flex items-center justify-center font-bold text-base shadow">
                {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h4 className="font-semibold text-xs">My Status</h4>
                <p className="text-[11px] text-slate-400">Share updates with your batch</p>
              </div>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>

          {/* Classmates Statuses List */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Recent Updates
            </span>

            {stories.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                No recent statuses from classmates yet. Be the first to post!
              </p>
            ) : (
              stories.map((group) => (
                <button
                  key={group.user?._id}
                  onClick={() => {
                    setActiveStoryGroup(group);
                    setActiveStatusIndex(0);
                  }}
                  className="w-full p-2.5 rounded-2xl flex items-center gap-3 hover:bg-white/5 transition text-left cursor-pointer border border-transparent hover:border-white/5"
                >
                  {/* Status Circle Ring */}
                  <div className={`p-0.5 rounded-2xl border-2 ${group.hasUnviewed ? 'border-emerald-500' : 'border-slate-600'}`}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-sm text-white">
                      {group.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-xs truncate">{group.user?.name}</h5>
                    <p className="text-[11px] text-slate-400 truncate">
                      {group.statuses?.length} update{group.statuses?.length > 1 ? 's' : ''} •{' '}
                      {new Date(group.statuses[0]?.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
