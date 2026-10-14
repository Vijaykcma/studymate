import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Send,
  Users,
  Search,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { groupsAPI, messagesAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

function Messages() {
  const { user } = useAuth();
  const [userGroups, setUserGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Load user's groups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoadingGroups(true);
        const data = await groupsAPI.getMyGroups();
        if (data.success) {
          const all = [...(data.created || []), ...(data.joined || [])];
          const unique = Array.from(new Map(all.map((g) => [g._id, g])).values());
          setUserGroups(unique);
          if (unique.length > 0) {
            setActiveGroup(unique[0]);
          }
        }
      } catch (err) {
        setError(err.userMessage || 'Failed to load your study groups.');
      } finally {
        setLoadingGroups(false);
      }
    };

    loadGroups();
  }, []);

  // Socket connection & room listener
  useEffect(() => {
    if (!activeGroup) return;

    const socket = getSocket();

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    setConnected(socket.connected);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Join room
    socket.emit('join_group', { groupId: activeGroup._id });

    // Load message history
    const loadHistory = async () => {
      try {
        setLoadingMessages(true);
        const data = await messagesAPI.getByGroup(activeGroup._id);
        if (data.success) {
          setMessages(data.messages || []);
        }
      } catch (err) {
        setError(err.userMessage || 'Could not load group messages.');
      } finally {
        setLoadingMessages(false);
      }
    };

    loadHistory();

    // Listen for new messages
    const handleNewMessage = (newMsg) => {
      if (newMsg.group === activeGroup._id) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.emit('leave_group', { groupId: activeGroup._id });
      socket.off('new_message', handleNewMessage);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [activeGroup]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputContent.trim() || !activeGroup) return;

    const textToSend = inputContent.trim();
    setInputContent('');

    const socket = getSocket();

    if (socket && socket.connected) {
      socket.emit(
        'send_message',
        { groupId: activeGroup._id, content: textToSend },
        (res) => {
          if (!res?.success) {
            // fallback to REST if socket callback reports failure
            messagesAPI.send(activeGroup._id, textToSend).catch(console.error);
          }
        }
      );
    } else {
      // REST fallback
      try {
        const res = await messagesAPI.send(activeGroup._id, textToSend);
        if (res.success && res.message) {
          setMessages((prev) => [...prev, res.message]);
        }
      } catch (err) {
        setError('Failed to deliver message.');
      }
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] lg:h-screen flex flex-col md:flex-row overflow-hidden bg-slate-950">
        {/* Left Side: Groups List */}
        <div className="w-full md:w-80 border-r border-white/10 flex flex-col shrink-0 bg-slate-950/80">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-base font-bold text-white">Study Discussions</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a group room to join real-time chat
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {loadingGroups ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                <p className="text-xs">Loading group rooms...</p>
              </div>
            ) : userGroups.length === 0 ? (
              <div className="p-6 text-center text-slate-500 space-y-3">
                <Users size={28} className="mx-auto opacity-30" />
                <p className="text-xs">You haven't joined any study groups yet.</p>
                <Link
                  to="/groups"
                  className="inline-block px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                >
                  Find Groups
                </Link>
              </div>
            ) : (
              userGroups.map((g) => {
                const isSelected = activeGroup?._id === g._id;
                return (
                  <button
                    key={g._id}
                    onClick={() => setActiveGroup(g)}
                    className={`w-full p-4 text-left flex items-start gap-3 transition ${
                      isSelected ? 'bg-white/[0.08]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-sm shrink-0">
                      <BookOpen size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-white truncate">
                          {g.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{g.subject}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {g.members?.length || 0} members
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Chat Conversation */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900/30">
          {activeGroup ? (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-slate-950/60 backdrop-blur">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                    <BookOpen size={18} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-sm text-white truncate">
                      {activeGroup.name}
                    </h2>
                    <p className="text-xs text-slate-400 truncate">
                      {activeGroup.subject} • {activeGroup.members?.length || 0} members
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-slate-400 hidden sm:inline">
                      {connected ? 'Live' : 'Connecting'}
                    </span>
                  </div>

                  <Link
                    to={`/groups/${activeGroup._id}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hidden sm:inline"
                  >
                    Group Info
                  </Link>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingMessages ? (
                  <div className="py-20 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                    <p className="text-xs">Loading conversation history...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                    <BookOpen size={36} className="opacity-20 mb-3" />
                    <h3 className="font-semibold text-sm text-slate-300">
                      Welcome to {activeGroup.name}!
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      This is the beginning of the discussion. Say hello or share notes!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine =
                      (msg.sender?._id || msg.sender) === user?._id ||
                      msg.senderName === user?.name;

                    return (
                      <div
                        key={msg._id}
                        className={`flex gap-3 max-w-xl ${
                          isMine ? 'ml-auto flex-row-reverse' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">
                          {msg.senderName ? msg.senderName[0].toUpperCase() : 'U'}
                        </div>

                        <div className="space-y-1">
                          <div
                            className={`flex items-center gap-2 text-[11px] ${
                              isMine ? 'justify-end' : ''
                            }`}
                          >
                            <span className="font-semibold text-slate-300">
                              {isMine ? 'You' : msg.senderName || 'Peer'}
                            </span>
                            <span className="text-slate-500">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>

                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed ${
                              isMine
                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20'
                                : 'bg-white/[0.06] text-slate-200 border border-white/5 rounded-tl-none'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <div className="p-4 border-t border-white/10 bg-slate-950/80">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Message ${activeGroup.name}...`}
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    className="flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-xs text-white outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
                  />
                  <button
                    type="submit"
                    disabled={!inputContent.trim()}
                    className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <Users size={36} className="opacity-20 mb-3" />
              <p className="text-sm font-semibold text-slate-300">No group selected</p>
              <p className="text-xs text-slate-400 mt-1">
                Choose a study group from the list on the left to start messaging.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Messages;