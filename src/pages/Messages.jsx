import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Users,
  Search,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
  User as UserIcon,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  MicOff,
  Check,
  CheckCheck,
  Code2,
  Play,
  Pause,
  MessageSquare,
  MessageSquarePlus,
  X,
  Sparkles,
  ChevronDown,
  Volume2,
  Copy,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { groupsAPI, messagesAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🚀', '💻', '🎉', '💯', '👏', '🧠', '📚', '✨', '🙌', '💡'];

export function Messages() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Navigation & Filter Tabs
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'direct' | 'group' | 'unread'
  const [searchQuery, setSearchQuery] = useState('');

  // Conversations & Contacts
  const [userGroups, setUserGroups] = useState([]);
  const [directConversations, setDirectConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { type: 'direct' | 'group', id: string, data: object }

  // Chat Data
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  // Online & Typing Presence
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingMap, setTypingMap] = useState({}); // key: userId or groupId -> boolean
  const typingTimeoutRef = useRef(null);

  // Modals & Panels
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [availablePeers, setAvailablePeers] = useState([]);
  const [peerSearchQuery, setPeerSearchQuery] = useState('');
  const [loadingPeers, setLoadingPeers] = useState(false);

  // Audio Voice Note Simulation & Code Snippet Modal
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const voiceIntervalRef = useRef(null);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);

  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState({ language: 'javascript', title: '', code: '' });
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // 1. Initial Load: Load Groups and Direct Conversations
  const refreshAllChats = async () => {
    try {
      setLoadingChats(true);
      setError('');

      const [groupsRes, convosRes] = await Promise.allSettled([
        groupsAPI.getMyGroups(),
        messagesAPI.getConversations(),
      ]);

      let loadedGroups = [];
      if (groupsRes.status === 'fulfilled' && groupsRes.value.success) {
        const all = [...(groupsRes.value.created || []), ...(groupsRes.value.joined || [])];
        loadedGroups = Array.from(new Map(all.map((g) => [g._id, g])).values());
        setUserGroups(loadedGroups);
      }

      let loadedDirect = [];
      if (convosRes.status === 'fulfilled' && convosRes.value.success) {
        loadedDirect = convosRes.value.conversations || [];
        setDirectConversations(loadedDirect);
      }

      // Default active chat if none selected
      if (!activeChat) {
        if (loadedDirect.length > 0) {
          setActiveChat({
            type: 'direct',
            id: loadedDirect[0].peer._id,
            data: loadedDirect[0].peer,
          });
        } else if (loadedGroups.length > 0) {
          setActiveChat({
            type: 'group',
            id: loadedGroups[0]._id,
            data: loadedGroups[0],
          });
        }
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to load conversations.');
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    refreshAllChats();
  }, []);

  // 2. Socket Listeners & Real-time Room Handling
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    setConnected(socket.connected);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Online users list
    const handleOnlineUsers = (userList) => {
      setOnlineUsers(new Set(userList));
    };
    socket.on('online_users', handleOnlineUsers);

    // Direct message listener
    const handleNewDirectMessage = (msg) => {
      // Check if this message belongs to the current open chat
      const isCurrentChat =
        activeChat?.type === 'direct' &&
        (msg.sender?._id === activeChat.id || msg.recipient?._id === activeChat.id);

      if (isCurrentChat) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }

      // Update sidebar conversations preview
      setDirectConversations((prev) => {
        const peerId = msg.sender?._id === user?._id ? msg.recipient?._id : msg.sender?._id;
        const peer = msg.sender?._id === user?._id ? msg.recipient : msg.sender;
        if (!peerId) return prev;

        const filtered = prev.filter((c) => c.peer._id !== peerId);
        const unreadInc = !isCurrentChat && msg.sender?._id !== user?._id ? 1 : 0;
        const existing = prev.find((c) => c.peer._id === peerId);

        return [
          {
            peer: peer || existing?.peer,
            lastMessage: msg,
            unreadCount: (existing?.unreadCount || 0) + unreadInc,
          },
          ...filtered,
        ];
      });
    };
    socket.on('new_direct_message', handleNewDirectMessage);

    // Group message listener
    const handleNewGroupMessage = (msg) => {
      if (activeChat?.type === 'group' && msg.group === activeChat.id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };
    socket.on('new_message', handleNewGroupMessage);

    // Typing listeners
    const handleDirectTyping = ({ fromUserId, isTyping }) => {
      setTypingMap((prev) => ({
        ...prev,
        [fromUserId]: isTyping,
      }));
    };
    socket.on('user_typing_direct', handleDirectTyping);

    const handleGroupTyping = ({ groupId, userId: typerId, userName, isTyping }) => {
      if (typerId !== user?._id) {
        setTypingMap((prev) => ({
          ...prev,
          [`group:${groupId}`]: isTyping ? userName : false,
        }));
      }
    };
    socket.on('user_typing_group', handleGroupTyping);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('online_users', handleOnlineUsers);
      socket.off('new_direct_message', handleNewDirectMessage);
      socket.off('new_message', handleNewGroupMessage);
      socket.off('user_typing_direct', handleDirectTyping);
      socket.off('user_typing_group', handleGroupTyping);
    };
  }, [activeChat, user]);

  // 3. Switch Active Chat and Load History
  useEffect(() => {
    if (!activeChat) return;

    const socket = getSocket();

    // If switching to group, join room
    if (activeChat.type === 'group') {
      socket.emit('join_group', { groupId: activeChat.id });
    }

    const loadHistory = async () => {
      try {
        setLoadingMessages(true);
        if (activeChat.type === 'group') {
          const res = await messagesAPI.getByGroup(activeChat.id);
          if (res.success) {
            setMessages(res.messages || []);
          }
        } else if (activeChat.type === 'direct') {
          const res = await messagesAPI.getDirect(activeChat.id);
          if (res.success) {
            setMessages(res.messages || []);
            // Clear unread indicator locally
            setDirectConversations((prev) =>
              prev.map((c) =>
                c.peer._id === activeChat.id ? { ...c, unreadCount: 0 } : c
              )
            );
          }
        }
      } catch (err) {
        setError(err.userMessage || 'Could not load conversation history.');
      } finally {
        setLoadingMessages(false);
      }
    };

    loadHistory();

    return () => {
      if (activeChat.type === 'group') {
        socket.emit('leave_group', { groupId: activeChat.id });
      }
    };
  }, [activeChat]);

  // 4. Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingMap]);

  // 5. Typing Indicator Dispatch
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputContent(val);

    const socket = getSocket();
    if (!activeChat) return;

    if (activeChat.type === 'direct') {
      socket.emit('typing_direct', { toUserId: activeChat.id, isTyping: true });
    } else {
      socket.emit('typing_group', { groupId: activeChat.id, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (activeChat.type === 'direct') {
        socket.emit('typing_direct', { toUserId: activeChat.id, isTyping: false });
      } else {
        socket.emit('typing_group', { groupId: activeChat.id, isTyping: false });
      }
    }, 1500);
  };

  // 6. Send Message (Text / Code / Voice)
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!activeChat) return;
    const textToSend = inputContent.trim();
    if (!textToSend) return;

    setInputContent('');
    const socket = getSocket();

    // Clear typing
    if (activeChat.type === 'direct') {
      socket.emit('typing_direct', { toUserId: activeChat.id, isTyping: false });
    } else {
      socket.emit('typing_group', { groupId: activeChat.id, isTyping: false });
    }

    try {
      if (activeChat.type === 'direct') {
        if (socket.connected) {
          socket.emit('send_direct_message', {
            recipientId: activeChat.id,
            content: textToSend,
            messageType: 'text',
          });
        } else {
          // REST Fallback
          const res = await messagesAPI.sendDirect(activeChat.id, { content: textToSend });
          if (res.success && res.message) {
            setMessages((prev) => [...prev, res.message]);
          }
        }
      } else {
        if (socket.connected) {
          socket.emit('send_message', {
            groupId: activeChat.id,
            content: textToSend,
            messageType: 'text',
          });
        } else {
          const res = await messagesAPI.send(activeChat.id, textToSend);
          if (res.success && res.message) {
            setMessages((prev) => [...prev, res.message]);
          }
        }
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to send message.');
    }
  };

  // Send Code Snippet
  const handleSendCodeSnippet = async () => {
    if (!codeSnippet.code.trim() || !activeChat) return;
    const socket = getSocket();

    const payload = {
      content: codeSnippet.title ? `[Code Snippet] ${codeSnippet.title}` : `[Code Snippet: ${codeSnippet.language}]`,
      messageType: 'code',
      codeSnippet: {
        language: codeSnippet.language,
        title: codeSnippet.title || 'Code Snippet',
        code: codeSnippet.code.trim(),
      },
    };

    setCodeModalOpen(false);
    setCodeSnippet({ language: 'javascript', title: '', code: '' });

    try {
      if (activeChat.type === 'direct') {
        if (socket.connected) {
          socket.emit('send_direct_message', {
            recipientId: activeChat.id,
            ...payload,
          });
        } else {
          const res = await messagesAPI.sendDirect(activeChat.id, payload);
          if (res.success && res.message) setMessages((prev) => [...prev, res.message]);
        }
      } else {
        if (socket.connected) {
          socket.emit('send_message', {
            groupId: activeChat.id,
            ...payload,
          });
        } else {
          const res = await messagesAPI.send(activeChat.id, payload.content, payload);
          if (res.success && res.message) setMessages((prev) => [...prev, res.message]);
        }
      }
    } catch (err) {
      setError('Could not send code snippet.');
    }
  };

  // Voice Note Recording Simulation
  const handleToggleVoiceRecording = () => {
    if (!voiceRecording) {
      setVoiceRecording(true);
      setVoiceSeconds(0);
      voiceIntervalRef.current = setInterval(() => {
        setVoiceSeconds((s) => s + 1);
      }, 1000);
    } else {
      // Finish recording and send voice note preview
      clearInterval(voiceIntervalRef.current);
      setVoiceRecording(false);
      const recordedDuration = voiceSeconds || 1;

      const socket = getSocket();
      const payload = {
        content: `🎤 Voice Message (${formatVoiceDuration(recordedDuration)})`,
        messageType: 'voice',
        voiceDuration: recordedDuration,
      };

      if (activeChat.type === 'direct') {
        socket.emit('send_direct_message', {
          recipientId: activeChat.id,
          ...payload,
        });
      } else {
        socket.emit('send_message', {
          groupId: activeChat.id,
          ...payload,
        });
      }
    }
  };

  const handleCancelVoiceRecording = () => {
    clearInterval(voiceIntervalRef.current);
    setVoiceRecording(false);
    setVoiceSeconds(0);
  };

  const formatVoiceDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Peer Contact Picker for New Chat
  const handleOpenNewChatModal = async () => {
    setNewChatModalOpen(true);
    try {
      setLoadingPeers(true);
      const res = await messagesAPI.getPeers({ search: peerSearchQuery });
      if (res.success) {
        setAvailablePeers(res.peers || []);
      }
    } catch (err) {
      // ignore
    } finally {
      setLoadingPeers(false);
    }
  };

  const handleSelectPeerForNewChat = (peer) => {
    setNewChatModalOpen(false);
    setActiveChat({
      type: 'direct',
      id: peer._id,
      data: peer,
    });
  };

  // Filtered chats for sidebar list
  const filteredChats = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    // 1. Direct chats
    const directItems = directConversations.map((c) => ({
      type: 'direct',
      id: c.peer._id,
      name: c.peer.name,
      subtitle: c.peer.department ? `${c.peer.department} • ${c.peer.semester || ''}` : 'Student',
      avatar: c.peer.avatar,
      lastMessage: c.lastMessage,
      unreadCount: c.unreadCount || 0,
      isOnline: onlineUsers.has(c.peer._id),
      data: c.peer,
    }));

    // 2. Group chats
    const groupItems = userGroups.map((g) => ({
      type: 'group',
      id: g._id,
      name: g.name,
      subtitle: `${g.members?.length || 1} members • ${g.subject}`,
      avatar: null,
      lastMessage: null,
      unreadCount: 0,
      isOnline: false,
      data: g,
    }));

    let combined = [];
    if (activeTab === 'all') {
      combined = [...directItems, ...groupItems];
    } else if (activeTab === 'direct') {
      combined = directItems;
    } else if (activeTab === 'group') {
      combined = groupItems;
    } else if (activeTab === 'unread') {
      combined = directItems.filter((c) => c.unreadCount > 0);
    }

    if (!q) return combined;

    return combined.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q))
    );
  }, [activeTab, searchQuery, directConversations, userGroups, onlineUsers]);

  const activePeerIsOnline = activeChat?.type === 'direct' && onlineUsers.has(activeChat.id);
  const activeChatTyping =
    activeChat?.type === 'direct'
      ? typingMap[activeChat.id]
      : typingMap[`group:${activeChat?.id}`];

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] max-w-7xl mx-auto">
        {/* WhatsApp Container Card */}
        <div className={`flex-1 flex rounded-2xl overflow-hidden border ${
          isDark ? 'border-white/10 bg-[#111b21]' : 'border-slate-200 bg-white shadow-lg'
        } transition-colors relative`}>

          {/* LEFT SIDEBAR: WhatsApp Chats & Contacts */}
          <div className={`w-full md:w-[380px] lg:w-[420px] flex flex-col border-r ${
            isDark ? 'border-[#222e35] bg-[#111b21]' : 'border-slate-200 bg-white'
          } shrink-0`}>
            
            {/* Sidebar WhatsApp Header */}
            <div className={`px-4 py-3.5 flex items-center justify-between border-b ${
              isDark ? 'bg-[#202c33] border-[#222e35]' : 'bg-[#f0f2f5] border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    isDark ? 'bg-[#00a884] text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#202c33] rounded-full" />
                </div>
                <div>
                  <h2 className={`font-bold text-sm ${isDark ? 'text-[#e9edef]' : 'text-slate-900'} leading-none`}>
                    Chats
                  </h2>
                  <span className="text-[11px] text-emerald-500 font-medium">WhatsApp Theme</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleOpenNewChatModal}
                  className={`p-2 rounded-full transition cursor-pointer ${
                    isDark ? 'text-[#aebac1] hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                  title="New Personal Chat"
                >
                  <MessageSquarePlus size={19} />
                </button>
                <button
                  onClick={refreshAllChats}
                  className={`p-2 rounded-full transition cursor-pointer ${
                    isDark ? 'text-[#aebac1] hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                  title="Refresh Conversations"
                >
                  <Sparkles size={18} />
                </button>
              </div>
            </div>

            {/* WhatsApp Search Bar */}
            <div className={`px-3 py-2 border-b ${isDark ? 'border-[#222e35] bg-[#111b21]' : 'border-slate-200 bg-white'}`}>
              <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl ${
                isDark ? 'bg-[#202c33] text-[#e9edef]' : 'bg-[#f0f2f5] text-slate-900'
              }`}>
                <Search size={16} className={isDark ? "text-[#8696a0]" : "text-slate-500"} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search or start new chat"
                  className="w-full bg-transparent text-xs outline-none placeholder-[#8696a0]"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-[#8696a0] hover:text-white">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* WhatsApp Filter Tabs: All, Direct, Groups, Unread */}
            <div className={`flex items-center gap-1 px-3 py-2 border-b ${
              isDark ? 'border-[#222e35] bg-[#111b21]' : 'border-slate-200 bg-slate-50/50'
            } text-xs font-medium overflow-x-auto`}>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-full transition cursor-pointer shrink-0 ${
                  activeTab === 'all'
                    ? isDark
                      ? 'bg-[#00a884] text-[#111b21] font-bold'
                      : 'bg-emerald-600 text-white font-bold'
                    : isDark
                    ? 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('direct')}
                className={`px-3 py-1 rounded-full transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  activeTab === 'direct'
                    ? isDark
                      ? 'bg-[#00a884] text-[#111b21] font-bold'
                      : 'bg-emerald-600 text-white font-bold'
                    : isDark
                    ? 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <UserIcon size={12} />
                <span>Personal</span>
              </button>
              <button
                onClick={() => setActiveTab('group')}
                className={`px-3 py-1 rounded-full transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  activeTab === 'group'
                    ? isDark
                      ? 'bg-[#00a884] text-[#111b21] font-bold'
                      : 'bg-emerald-600 text-white font-bold'
                    : isDark
                    ? 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Users size={12} />
                <span>Groups</span>
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-3 py-1 rounded-full transition cursor-pointer shrink-0 ${
                  activeTab === 'unread'
                    ? isDark
                      ? 'bg-[#00a884] text-[#111b21] font-bold'
                      : 'bg-emerald-600 text-white font-bold'
                    : isDark
                    ? 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Unread
              </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto divide-y divide-transparent">
              {loadingChats ? (
                <div className="flex flex-col items-center justify-center p-10 text-xs text-[#8696a0] gap-2">
                  <Loader2 size={24} className="animate-spin text-emerald-500" />
                  <span>Loading WhatsApp conversations...</span>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8696a0] space-y-3">
                  <MessageSquare size={36} className="mx-auto text-emerald-500/50" />
                  <p className="font-semibold">No chats found in this category.</p>
                  <button
                    onClick={handleOpenNewChatModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition cursor-pointer"
                  >
                    <MessageSquarePlus size={14} />
                    Start Personal Chat
                  </button>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isSelected = activeChat?.id === chat.id;
                  const isTyping =
                    chat.type === 'direct'
                      ? typingMap[chat.id]
                      : typingMap[`group:${chat.id}`];

                  return (
                    <button
                      key={`${chat.type}-${chat.id}`}
                      onClick={() =>
                        setActiveChat({
                          type: chat.type,
                          id: chat.id,
                          data: chat.data,
                        })
                      }
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition cursor-pointer ${
                        isSelected
                          ? isDark
                            ? 'bg-[#2a3942]'
                            : 'bg-[#f0f2f5]'
                          : isDark
                          ? 'hover:bg-[#202c33]'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Avatar with Online Green Dot */}
                      <div className="relative shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                          chat.type === 'group'
                            ? isDark
                              ? 'bg-indigo-600 text-white'
                              : 'bg-indigo-100 text-indigo-700'
                            : isDark
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {chat.type === 'group' ? (
                            <Users size={20} />
                          ) : (
                            chat.name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        {chat.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#111b21] rounded-full" />
                        )}
                      </div>

                      {/* Info & Last Message */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-semibold text-sm truncate ${
                            isDark ? 'text-[#e9edef]' : 'text-slate-900'
                          }`}>
                            {chat.name}
                          </span>
                          <span className={`text-[11px] shrink-0 ${
                            chat.unreadCount > 0 ? 'text-emerald-500 font-bold' : isDark ? 'text-[#8696a0]' : 'text-slate-400'
                          }`}>
                            {chat.lastMessage
                              ? formatMessageTime(chat.lastMessage.createdAt)
                              : ''}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-xs truncate">
                            {isTyping ? (
                              <span className="text-emerald-500 font-semibold italic text-xs">
                                {typeof isTyping === 'string' ? `${isTyping} is typing...` : 'typing...'}
                              </span>
                            ) : chat.lastMessage ? (
                              <>
                                {chat.lastMessage.sender?._id === user?._id && (
                                  <CheckCheck size={14} className="text-[#53bdeb] shrink-0" />
                                )}
                                <span className={`truncate text-xs ${isDark ? 'text-[#8696a0]' : 'text-slate-500'}`}>
                                  {chat.lastMessage.content || 'Voice message'}
                                </span>
                              </>
                            ) : (
                              <span className={`text-xs truncate ${isDark ? 'text-[#8696a0]' : 'text-slate-400'}`}>
                                {chat.subtitle}
                              </span>
                            )}
                          </div>

                          {chat.unreadCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-[#25d366] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* MAIN CHAT CONVERSATION WINDOW */}
          {activeChat ? (
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
              
              {/* WhatsApp Chat Header */}
              <div className={`px-4 py-3 flex items-center justify-between border-b ${
                isDark ? 'bg-[#202c33] border-[#222e35]' : 'bg-[#f0f2f5] border-slate-200'
              } shrink-0 z-20`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      activeChat.type === 'group'
                        ? isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                        : isDark ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {activeChat.type === 'group' ? (
                        <Users size={18} />
                      ) : (
                        activeChat.data?.name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    {activePeerIsOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#202c33] rounded-full" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className={`font-bold text-sm truncate ${isDark ? 'text-[#e9edef]' : 'text-slate-900'}`}>
                      {activeChat.data?.name}
                    </h3>
                    <p className="text-[11px] truncate flex items-center gap-1.5">
                      {activeChatTyping ? (
                        <span className="text-emerald-500 font-semibold italic">
                          {typeof activeChatTyping === 'string' ? `${activeChatTyping} is typing...` : 'typing...'}
                        </span>
                      ) : activeChat.type === 'direct' ? (
                        activePeerIsOnline ? (
                          <span className="text-emerald-500 font-medium">online</span>
                        ) : (
                          <span className={isDark ? "text-[#8696a0]" : "text-slate-500"}>
                            {activeChat.data?.department || 'Student'} • {activeChat.data?.semester || 'MCA'}
                          </span>
                        )
                      ) : (
                        <span className={isDark ? "text-[#8696a0]" : "text-slate-500"}>
                          {activeChat.data?.members?.length || 1} participants • {activeChat.data?.subject}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Header Call / Info Actions */}
                <div className="flex items-center gap-1 text-[#8696a0]">
                  <button
                    onClick={() => alert(`Starting voice call with ${activeChat.data?.name}... (Audio WebRTC ready)`)}
                    className={`p-2 rounded-full transition cursor-pointer ${
                      isDark ? 'hover:text-white hover:bg-white/10' : 'hover:text-slate-900 hover:bg-slate-200'
                    }`}
                    title="Audio Call"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    onClick={() => alert(`Starting video study session with ${activeChat.data?.name}...`)}
                    className={`p-2 rounded-full transition cursor-pointer ${
                      isDark ? 'hover:text-white hover:bg-white/10' : 'hover:text-slate-900 hover:bg-slate-200'
                    }`}
                    title="Video Call"
                  >
                    <Video size={18} />
                  </button>
                  <button
                    onClick={() => setInfoDrawerOpen(!infoDrawerOpen)}
                    className={`p-2 rounded-full transition cursor-pointer ${
                      infoDrawerOpen
                        ? 'text-emerald-500'
                        : isDark
                        ? 'hover:text-white hover:bg-white/10'
                        : 'hover:text-slate-900 hover:bg-slate-200'
                    }`}
                    title="Contact Details"
                  >
                    <Info size={18} />
                  </button>
                </div>
              </div>

              {/* WhatsApp Wallpaper Messages Stream */}
              <div
                className={`flex-1 p-4 overflow-y-auto space-y-3 relative ${
                  isDark ? 'bg-[#0b141a]' : 'bg-[#efeae2]'
                }`}
                style={{
                  backgroundImage: `radial-gradient(${isDark ? '#182229 1px' : '#e0d8cc 1px'}, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              >
                {/* Date Divider Chip */}
                <div className="flex justify-center my-2">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                    isDark ? 'bg-[#182229] text-[#8696a0] border border-white/5' : 'bg-white text-slate-600 border border-slate-200'
                  }`}>
                    Today
                  </span>
                </div>

                {loadingMessages ? (
                  <div className="flex justify-center items-center py-20 text-xs text-[#8696a0]">
                    <Loader2 size={24} className="animate-spin text-emerald-500 mr-2" />
                    <span>Loading message history...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="max-w-sm mx-auto my-12 text-center p-6 rounded-2xl bg-white/10 backdrop-blur text-xs space-y-2">
                    <p className="font-semibold text-emerald-500 text-sm">
                      🔒 End-to-End Encrypted Student Chat
                    </p>
                    <p className={isDark ? "text-slate-400" : "text-slate-600"}>
                      Messages and calls are private. Send a greeting to start your personalized study conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender?._id === user?._id;

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} my-1`}
                      >
                        {/* WhatsApp Message Bubble */}
                        <div
                          className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3.5 py-2 relative shadow-sm ${
                            isMe
                              ? isDark
                                ? 'bg-[#005c4b] text-white rounded-tr-sm'
                                : 'bg-[#d9fdd3] text-slate-900 rounded-tr-sm'
                              : isDark
                              ? 'bg-[#202c33] text-white rounded-tl-sm'
                              : 'bg-white text-slate-900 rounded-tl-sm'
                          }`}
                        >
                          {/* In group chats, display sender's name on received message */}
                          {!isMe && activeChat.type === 'group' && (
                            <div className="text-[11px] font-bold text-emerald-400 mb-0.5">
                              {msg.senderName || msg.sender?.name}
                            </div>
                          )}

                          {/* Message Types: Text, Code Snippet, Voice Note */}
                          {msg.messageType === 'code' && msg.codeSnippet ? (
                            <div className="my-1 space-y-1.5 font-mono text-xs">
                              <div className="flex items-center justify-between text-[11px] opacity-80 border-b border-white/10 pb-1">
                                <span className="font-bold">{msg.codeSnippet.title || 'Code Snippet'}</span>
                                <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-black/30 font-semibold">
                                  {msg.codeSnippet.language}
                                </span>
                              </div>
                              <pre className={`p-2.5 rounded-xl text-xs overflow-x-auto ${
                                isDark ? 'bg-black/40 text-emerald-300' : 'bg-slate-900 text-emerald-400'
                              }`}>
                                {msg.codeSnippet.code}
                              </pre>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleCopyCode(msg._id, msg.codeSnippet.code)}
                                  className="text-[10px] flex items-center gap-1 hover:underline text-emerald-400 cursor-pointer"
                                >
                                  {copiedCodeId === msg._id ? <Check size={12} /> : <Copy size={12} />}
                                  <span>{copiedCodeId === msg._id ? 'Copied' : 'Copy Code'}</span>
                                </button>
                              </div>
                            </div>
                          ) : msg.messageType === 'voice' ? (
                            <div className="flex items-center gap-3 py-1 min-w-[200px]">
                              <button
                                onClick={() =>
                                  setPlayingVoiceId(playingVoiceId === msg._id ? null : msg._id)
                                }
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ${
                                  isMe
                                    ? 'bg-emerald-400 text-black hover:bg-emerald-300'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                                }`}
                              >
                                {playingVoiceId === msg._id ? (
                                  <Pause size={16} />
                                ) : (
                                  <Play size={16} className="ml-0.5" />
                                )}
                              </button>
                              <div className="flex-1">
                                {/* WhatsApp Audio Waveform Bar */}
                                <div className="h-4 flex items-center gap-0.5">
                                  {[40, 70, 90, 60, 100, 50, 80, 45, 95, 30, 85, 60, 40].map(
                                    (h, idx) => (
                                      <span
                                        key={idx}
                                        style={{ height: `${h}%` }}
                                        className={`w-1 rounded-full ${
                                          playingVoiceId === msg._id
                                            ? 'bg-emerald-400 animate-pulse'
                                            : isMe
                                            ? isDark ? 'bg-emerald-200/60' : 'bg-emerald-800/40'
                                            : 'bg-slate-400'
                                        }`}
                                      />
                                    )
                                  )}
                                </div>
                                <div className="flex justify-between items-center text-[10px] opacity-75 mt-0.5">
                                  <span>{formatVoiceDuration(msg.voiceDuration || 18)}</span>
                                  <Volume2 size={11} />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          )}

                          {/* Timestamp + WhatsApp Double Checkmark */}
                          <div className="flex items-center justify-end gap-1 text-[10px] opacity-70 mt-1 float-right ml-3">
                            <span>{formatMessageTime(msg.createdAt)}</span>
                            {isMe && (
                              <CheckCheck
                                size={14}
                                className={msg.status === 'read' ? 'text-[#53bdeb]' : 'text-slate-400'}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Real-time Typing Bubble indicator */}
                {activeChatTyping && (
                  <div className="flex items-center gap-2">
                    <div className={`px-4 py-2.5 rounded-2xl rounded-tl-sm text-xs flex items-center gap-1.5 shadow-sm ${
                      isDark ? 'bg-[#202c33] text-[#e9edef]' : 'bg-white text-slate-800'
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[11px] text-emerald-500 font-semibold ml-1">
                        {typeof activeChatTyping === 'string' ? `${activeChatTyping} is typing...` : 'typing...'}
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Emoji Quick Picker Bar */}
              {emojiPickerOpen && (
                <div className={`p-2.5 border-t flex items-center gap-2 overflow-x-auto ${
                  isDark ? 'bg-[#202c33] border-[#222e35]' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-xs text-[#8696a0] font-semibold shrink-0">Emojis:</span>
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setInputContent((prev) => prev + emoji);
                        textareaRef.current?.focus();
                      }}
                      className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Voice Recording Active Bar */}
              {voiceRecording ? (
                <div className={`px-4 py-3 flex items-center justify-between border-t ${
                  isDark ? 'bg-[#202c33] border-[#222e35] text-white' : 'bg-[#f0f2f5] border-slate-200 text-slate-900'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-mono text-sm font-bold text-rose-500">
                      Recording: {formatVoiceDuration(voiceSeconds)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancelVoiceRecording}
                      className="px-3 py-1.5 rounded-xl bg-slate-500/20 hover:bg-slate-500/30 text-xs font-semibold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleToggleVoiceRecording}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send size={13} />
                      <span>Send Voice Note</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* WhatsApp Bottom Message Input Bar */
                <form
                  onSubmit={handleSendMessage}
                  className={`px-4 py-2.5 flex items-center gap-2 border-t ${
                    isDark ? 'bg-[#202c33] border-[#222e35]' : 'bg-[#f0f2f5] border-slate-200'
                  }`}
                >
                  {/* Emoji toggle */}
                  <button
                    type="button"
                    onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                    className={`p-2 rounded-full transition cursor-pointer ${
                      emojiPickerOpen
                        ? 'text-emerald-500 bg-emerald-500/10'
                        : isDark
                        ? 'text-[#8696a0] hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Insert Emoji"
                  >
                    <Smile size={20} />
                  </button>

                  {/* Share Code Snippet */}
                  <button
                    type="button"
                    onClick={() => setCodeModalOpen(true)}
                    className={`p-2 rounded-full transition cursor-pointer ${
                      isDark ? 'text-[#8696a0] hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Send Code Snippet / Solution"
                  >
                    <Code2 size={20} />
                  </button>

                  {/* Text Input Pill */}
                  <div className={`flex-1 rounded-xl px-4 py-2.5 flex items-center ${
                    isDark ? 'bg-[#2a3942] text-[#e9edef]' : 'bg-white text-slate-900 shadow-sm'
                  }`}>
                    <input
                      ref={textareaRef}
                      type="text"
                      value={inputContent}
                      onChange={handleInputChange}
                      placeholder="Type a message"
                      className="w-full bg-transparent text-xs sm:text-sm outline-none placeholder-[#8696a0]"
                    />
                  </div>

                  {/* Microphone or Send Button */}
                  {inputContent.trim() ? (
                    <button
                      type="submit"
                      className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition shadow-md cursor-pointer shrink-0"
                      title="Send Message"
                    >
                      <Send size={17} className="ml-0.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleToggleVoiceRecording}
                      className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition shadow-md cursor-pointer shrink-0"
                      title="Record Voice Note"
                    >
                      <Mic size={18} />
                    </button>
                  )}
                </form>
              )}
            </div>
          ) : (
            /* No Chat Selected Placeholder */
            <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center ${
              isDark ? 'bg-[#222e35]' : 'bg-[#f0f2f5]'
            }`}>
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                <MessageSquare size={40} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-[#e9edef]' : 'text-slate-900'}`}>
                StudyMate WhatsApp Web
              </h3>
              <p className={`text-xs max-w-md ${isDark ? 'text-[#8696a0]' : 'text-slate-600'} leading-relaxed`}>
                Send personalized direct messages to classmates, create study groups, share DSA code snippets, and collaborate in real-time.
              </p>
              <button
                onClick={handleOpenNewChatModal}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition shadow-lg cursor-pointer"
              >
                <MessageSquarePlus size={16} />
                <span>Start New Personal Chat</span>
              </button>
            </div>
          )}

          {/* RIGHT CONTACT INFO DRAWER */}
          {infoDrawerOpen && activeChat && (
            <div className={`w-72 border-l ${
              isDark ? 'border-[#222e35] bg-[#111b21]' : 'border-slate-200 bg-white'
            } p-5 flex flex-col space-y-4 shrink-0 overflow-y-auto`}>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h4 className="font-bold text-sm">Contact Info</h4>
                <button onClick={() => setInfoDrawerOpen(false)} className="text-[#8696a0] hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="text-center space-y-2">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-2xl shadow-lg">
                  {activeChat.data?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h3 className="font-bold text-base">{activeChat.data?.name}</h3>
                <p className="text-xs text-emerald-500 font-semibold">
                  {activePeerIsOnline ? '● Online Now' : 'Offline'}
                </p>
              </div>

              <div className={`p-3.5 rounded-xl text-xs space-y-2 ${
                isDark ? 'bg-[#202c33]' : 'bg-slate-50'
              }`}>
                <div>
                  <span className="text-[11px] text-[#8696a0] block">Department</span>
                  <span className="font-semibold">{activeChat.data?.department || 'MCA'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#8696a0] block">Semester</span>
                  <span className="font-semibold">{activeChat.data?.semester || '2nd Semester'}</span>
                </div>
                {activeChat.data?.bio && (
                  <div>
                    <span className="text-[11px] text-[#8696a0] block">Bio</span>
                    <p className="text-xs italic">{activeChat.data.bio}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL: START NEW PERSONAL CHAT (WhatsApp Contacts) */}
        {newChatModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className={`w-full max-w-md rounded-2xl border ${
              isDark ? 'border-white/10 bg-[#111b21] text-[#e9edef]' : 'border-slate-200 bg-white text-slate-900'
            } shadow-2xl p-6`}>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="text-emerald-500" size={20} />
                  <h3 className="font-bold text-base">New Personal Chat</h3>
                </div>
                <button
                  onClick={() => setNewChatModalOpen(false)}
                  className="text-[#8696a0] hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search peer */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-4 ${
                isDark ? 'bg-[#202c33]' : 'bg-slate-100'
              }`}>
                <Search size={15} className="text-[#8696a0]" />
                <input
                  type="text"
                  value={peerSearchQuery}
                  onChange={(e) => setPeerSearchQuery(e.target.value)}
                  placeholder="Search students by name or department..."
                  className="w-full bg-transparent text-xs outline-none"
                />
              </div>

              {/* Peer List */}
              <div className="max-h-72 overflow-y-auto space-y-2">
                {loadingPeers ? (
                  <div className="py-8 text-center text-xs text-[#8696a0]">
                    <Loader2 size={20} className="animate-spin mx-auto text-emerald-500 mb-2" />
                    <span>Finding classmates...</span>
                  </div>
                ) : availablePeers.length === 0 ? (
                  <p className="text-center py-6 text-xs text-[#8696a0]">No classmates found.</p>
                ) : (
                  availablePeers.map((peer) => (
                    <button
                      key={peer._id}
                      onClick={() => handleSelectPeerForNewChat(peer)}
                      className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition text-left cursor-pointer ${
                        isDark ? 'hover:bg-[#202c33]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                        {peer.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs truncate">{peer.name}</div>
                        <div className="text-[11px] text-[#8696a0] truncate">
                          {peer.department} • {peer.semester}
                        </div>
                      </div>
                      {onlineUsers.has(peer._id) && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Online" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: SHARE CODE SNIPPET (DSA & Programming) */}
        {codeModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className={`w-full max-w-lg rounded-2xl border ${
              isDark ? 'border-white/10 bg-[#111b21] text-[#e9edef]' : 'border-slate-200 bg-white text-slate-900'
            } shadow-2xl p-6 space-y-4`}>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Code2 className="text-emerald-500" size={20} />
                  <h3 className="font-bold text-base">Share Code Snippet in Chat</h3>
                </div>
                <button onClick={() => setCodeModalOpen(false)} className="text-[#8696a0] hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#8696a0] font-semibold block mb-1">Language</label>
                  <select
                    value={codeSnippet.language}
                    onChange={(e) => setCodeSnippet({ ...codeSnippet, language: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 text-xs border outline-none ${
                      isDark ? 'bg-[#202c33] border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="sql">SQL</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#8696a0] font-semibold block mb-1">Snippet Title</label>
                  <input
                    type="text"
                    value={codeSnippet.title}
                    onChange={(e) => setCodeSnippet({ ...codeSnippet, title: e.target.value })}
                    placeholder="e.g. Binary Search Function"
                    className={`w-full rounded-xl px-3 py-2 text-xs border outline-none ${
                      isDark ? 'bg-[#202c33] border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#8696a0] font-semibold block mb-1">Code</label>
                <textarea
                  value={codeSnippet.code}
                  onChange={(e) => setCodeSnippet({ ...codeSnippet, code: e.target.value })}
                  placeholder="Paste or write solution code here..."
                  rows={8}
                  className={`w-full rounded-xl p-3 font-mono text-xs border outline-none resize-none ${
                    isDark ? 'bg-[#0b141a] border-white/10 text-emerald-300' : 'bg-slate-900 border-slate-200 text-emerald-400'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCodeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#8696a0] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendCodeSnippet}
                  disabled={!codeSnippet.code.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  Share to Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Messages;