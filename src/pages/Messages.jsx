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
  VolumeX,
  Copy,
  Info,
  Calendar,
  Layers,
  GraduationCap,
  ArrowLeft,
  Reply,
  Edit2,
  Trash2,
  Star,
  Pin,
  CornerDownRight,
  BarChart2,
  Radio,
  Camera,
  Download,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { groupsAPI, messagesAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Chat Modals
import { WebRTCCallModal } from '../components/chat/WebRTCCallModal';
import { StatusStoriesModal } from '../components/chat/StatusStoriesModal';
import { PollModal } from '../components/chat/PollModal';
import { BroadcastModal } from '../components/chat/BroadcastModal';
import { NewGroupModal } from '../components/chat/NewGroupModal';

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

  // Chat Personalization
  const [pinnedChats, setPinnedChats] = useState(new Set());
  const [mutedChats, setMutedChats] = useState(new Set());
  const [blockedUsers, setBlockedUsers] = useState(new Set());

  // Chat Data
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  // Online & Typing Presence
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingMap, setTypingMap] = useState({});
  const typingTimeoutRef = useRef(null);

  // Modals & Panels
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [availablePeers, setAvailablePeers] = useState([]);
  const [peerSearchQuery, setPeerSearchQuery] = useState('');
  const [loadingPeers, setLoadingPeers] = useState(false);

  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState({ language: 'javascript', title: '', code: '' });
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  // WhatsApp Advanced States: Reply, Edit, Delete, Reactions
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [deleteModalMsg, setDeleteModalMsg] = useState(null);
  const [activeActionMessageId, setActiveActionMessageId] = useState(null);

  // Media, Audio & File Uploads
  const [uploadingFile, setUploadingFile] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // Real Audio Voice Recording (MediaRecorder API)
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const voiceIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 1.5x, 2x

  // In-Chat Search
  const [inChatSearchOpen, setInChatSearchOpen] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');

  // WebRTC Calling State
  const [callState, setCallState] = useState(null); // { status: 'incoming'|'outgoing'|'connected', callType: 'audio'|'video', peer, offer }

  // Stories (24h Statuses)
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [stories, setStories] = useState([]);

  // Study Polls
  const [pollModalOpen, setPollModalOpen] = useState(false);

  // Broadcast Messaging
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);

  // New Group Modal
  const [newGroupModalOpen, setNewGroupModalOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const audioElementsRef = useRef({});

  // 1. Initial Load: Load Groups, Direct Conversations, and Stories
  const refreshAllChats = async () => {
    try {
      setLoadingChats(true);
      setError('');

      const [groupsRes, convosRes, storiesRes] = await Promise.allSettled([
        groupsAPI.getMyGroups(),
        messagesAPI.getConversations(),
        messagesAPI.getStatuses(),
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
        if (convosRes.value.pinnedChats) setPinnedChats(new Set(convosRes.value.pinnedChats));
        if (convosRes.value.mutedChats) setMutedChats(new Set(convosRes.value.mutedChats));
        if (convosRes.value.blockedUsers) setBlockedUsers(new Set(convosRes.value.blockedUsers));
      }

      if (storiesRes.status === 'fulfilled' && storiesRes.value.success) {
        setStories(storiesRes.value.stories || []);
      }

      // Default active chat if none selected (desktop viewports only)
      if (!activeChat && typeof window !== 'undefined' && window.innerWidth >= 768) {
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
    const handleOnlineUsers = (usersList) => setOnlineUsers(new Set(usersList));

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('online_users', handleOnlineUsers);

    if (socket.connected) {
      setConnected(true);
    }

    // Direct message listener
    const handleNewDirectMessage = (msg) => {
      const isCurrentConversation =
        activeChat?.type === 'direct' &&
        (msg.sender?._id === activeChat.id || msg.recipient?._id === activeChat.id);

      if (isCurrentConversation) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        // Mark as read immediately if current active conversation
        if (msg.sender?._id === activeChat.id) {
          socket.emit('mark_as_read', { peerId: activeChat.id });
        }
      }

      // Update sidebar conversations list preview
      setDirectConversations((prev) => {
        const partnerId =
          msg.sender?._id === user?._id ? msg.recipient?._id : msg.sender?._id;
        const partner = msg.sender?._id === user?._id ? msg.recipient : msg.sender;

        const filtered = prev.filter((c) => c.peer._id !== partnerId);
        const existing = prev.find((c) => c.peer._id === partnerId);

        return [
          {
            peer: partner || existing?.peer,
            lastMessage: msg,
            unreadCount:
              isCurrentConversation || msg.sender?._id === user?._id
                ? 0
                : (existing?.unreadCount || 0) + 1,
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

    // WhatsApp Real-Time Listeners: Reactions, Edits, Deletions, Read Receipts, Polls
    const handleReactionUpdated = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };
    socket.on('message_reaction_updated', handleReactionUpdated);

    const handleMessageEdited = (editedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === editedMsg._id ? editedMsg : m))
      );
    };
    socket.on('message_edited', handleMessageEdited);

    const handleMessageDeletedEveryone = ({ messageId, content, isDeletedForEveryone }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, content, isDeletedForEveryone, codeSnippet: undefined, attachments: [] }
            : m
        )
      );
    };
    socket.on('message_deleted_everyone', handleMessageDeletedEveryone);

    const handleReadReceipt = ({ peerId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender?._id === user?._id ? { ...m, status: 'read' } : m
        )
      );
    };
    socket.on('messages_read_receipt', handleReadReceipt);

    const handlePollVoted = ({ messageId, poll }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, poll } : m))
      );
    };
    socket.on('poll_voted', handlePollVoted);

    // WebRTC Real-Time Audio & Video Calling Listeners
    const handleIncomingCall = ({ fromUser, offer, callType }) => {
      setCallState({
        status: 'incoming',
        peer: fromUser,
        callType,
        offer,
      });
    };
    socket.on('webrtc_incoming_call', handleIncomingCall);

    const handleCallAnswered = ({ answer }) => {
      setCallState((prev) => (prev ? { ...prev, status: 'connected', answer } : null));
    };
    socket.on('webrtc_call_answered', handleCallAnswered);

    const handleCallRejected = () => {
      setCallState(null);
    };
    socket.on('webrtc_call_rejected', handleCallRejected);

    const handleCallEnded = () => {
      setCallState(null);
    };
    socket.on('webrtc_call_ended', handleCallEnded);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('online_users', handleOnlineUsers);
      socket.off('new_direct_message', handleNewDirectMessage);
      socket.off('new_message', handleNewGroupMessage);
      socket.off('user_typing_direct', handleDirectTyping);
      socket.off('user_typing_group', handleGroupTyping);
      socket.off('message_reaction_updated', handleReactionUpdated);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted_everyone', handleMessageDeletedEveryone);
      socket.off('messages_read_receipt', handleReadReceipt);
      socket.off('poll_voted', handlePollVoted);
      socket.off('webrtc_incoming_call', handleIncomingCall);
      socket.off('webrtc_call_answered', handleCallAnswered);
      socket.off('webrtc_call_rejected', handleCallRejected);
      socket.off('webrtc_call_ended', handleCallEnded);
    };
  }, [activeChat, user]);

  // 3. Load active conversation messages and join socket rooms
  useEffect(() => {
    if (!activeChat) return;

    let isSubscribed = true;
    const socket = getSocket();

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        setError('');

        if (activeChat.type === 'direct') {
          const res = await messagesAPI.getDirect(activeChat.id);
          if (isSubscribed && res.success) {
            setMessages(res.messages || []);
            // Emit mark as read
            socket.emit('mark_as_read', { peerId: activeChat.id });

            // Reset unread badge on sidebar
            setDirectConversations((prev) =>
              prev.map((c) =>
                c.peer._id === activeChat.id ? { ...c, unreadCount: 0 } : c
              )
            );
          }
        } else {
          socket.emit('join_group', activeChat.id);
          const res = await messagesAPI.getByGroup(activeChat.id);
          if (isSubscribed && res.success) {
            setMessages(res.messages || []);
          }
        }
      } catch (err) {
        if (isSubscribed) {
          setError(err.userMessage || 'Failed to load conversation history.');
        }
      } finally {
        if (isSubscribed) setLoadingMessages(false);
      }
    };

    fetchMessages();

    return () => {
      isSubscribed = false;
      if (activeChat.type === 'group') {
        socket.emit('leave_group', activeChat.id);
      }
    };
  }, [activeChat]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing emitter
  const handleInputChange = (e) => {
    setInputContent(e.target.value);
    if (!activeChat) return;

    const socket = getSocket();
    if (activeChat.type === 'direct') {
      socket.emit('typing_direct', { toUserId: activeChat.id, isTyping: true });
    } else {
      socket.emit('typing_group', { groupId: activeChat.id, isTyping: true });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (activeChat.type === 'direct') {
        socket.emit('typing_direct', { toUserId: activeChat.id, isTyping: false });
      } else {
        socket.emit('typing_group', { groupId: activeChat.id, isTyping: false });
      }
    }, 1500);
  };

  // Send Message (Text / Quoted / Edited)
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputContent.trim() || !activeChat) return;

    const textToSend = inputContent.trim();

    // If Editing an existing message
    if (editingMessage) {
      try {
        const socket = getSocket();
        if (socket.connected) {
          socket.emit('edit_message', {
            messageId: editingMessage._id,
            newContent: textToSend,
          });
        } else {
          await messagesAPI.edit(editingMessage._id, textToSend);
        }

        setMessages((prev) =>
          prev.map((m) =>
            m._id === editingMessage._id
              ? { ...m, content: textToSend, isEdited: true, editedAt: new Date() }
              : m
          )
        );
        setEditingMessage(null);
        setInputContent('');
        return;
      } catch (err) {
        setError(err.userMessage || 'Failed to edit message.');
        return;
      }
    }

    const currentReplyTo = replyingTo?._id;
    setInputContent('');
    setReplyingTo(null);
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
            replyTo: currentReplyTo,
          });
        } else {
          const res = await messagesAPI.sendDirect(activeChat.id, {
            content: textToSend,
            replyTo: currentReplyTo,
          });
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
            replyTo: currentReplyTo,
          });
        } else {
          const res = await messagesAPI.send(activeChat.id, textToSend, {
            replyTo: currentReplyTo,
          });
          if (res.success && res.message) {
            setMessages((prev) => [...prev, res.message]);
          }
        }
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to send message.');
    }
  };

  // WhatsApp Message Actions: Reactions, Reply, Edit, Delete, Star
  const handleToggleReaction = async (messageId, emoji) => {
    try {
      const socket = getSocket();
      if (socket.connected) {
        socket.emit('send_reaction', { messageId, emoji });
      } else {
        const res = await messagesAPI.react(messageId, emoji);
        if (res.success) {
          setMessages((prev) =>
            prev.map((m) => (m._id === messageId ? { ...m, reactions: res.reactions } : m))
          );
        }
      }
      setActiveActionMessageId(null);
    } catch (err) {
      // ignore
    }
  };

  const handleStartReply = (msg) => {
    setReplyingTo(msg);
    setEditingMessage(null);
    setActiveActionMessageId(null);
    textareaRef.current?.focus();
  };

  const handleStartEdit = (msg) => {
    setEditingMessage(msg);
    setReplyingTo(null);
    setInputContent(msg.content || '');
    setActiveActionMessageId(null);
    textareaRef.current?.focus();
  };

  const handleConfirmDelete = async (deleteType) => {
    if (!deleteModalMsg) return;
    const msgId = deleteModalMsg._id;
    setDeleteModalMsg(null);

    try {
      const socket = getSocket();
      if (socket.connected) {
        socket.emit('delete_message', { messageId: msgId, deleteType });
      } else {
        await messagesAPI.delete(msgId, deleteType);
      }

      if (deleteType === 'for_everyone') {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === msgId
              ? { ...m, content: '🚫 This message was deleted', isDeletedForEveryone: true, codeSnippet: undefined, attachments: [] }
              : m
          )
        );
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== msgId));
      }
    } catch (err) {
      setError('Could not delete message.');
    }
  };

  const handleToggleStar = async (msgId) => {
    try {
      const res = await messagesAPI.toggleStar(msgId);
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m._id !== msgId) return m;
            const starred = new Set(m.starredBy || []);
            if (res.isStarred) starred.add(user._id);
            else starred.delete(user._id);
            return { ...m, starredBy: Array.from(starred) };
          })
        );
      }
      setActiveActionMessageId(null);
    } catch (err) {
      // ignore
    }
  };

  // Real Audio Voice Recording (MediaRecorder API)
  const formatVoiceDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const handleStartRealRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.start();
      setVoiceRecording(true);
      setVoiceSeconds(0);
      clearInterval(voiceIntervalRef.current);
      voiceIntervalRef.current = setInterval(() => {
        setVoiceSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      setError('Microphone access denied or not supported.');
    }
  };

  const handleStopAndSendRecording = () => {
    if (!mediaRecorderRef.current) return;
    clearInterval(voiceIntervalRef.current);
    const recordedDuration = voiceSeconds || 1;
    setVoiceRecording(false);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());

      try {
        const formData = new FormData();
        formData.append('file', audioBlob, `voice-${Date.now()}.webm`);
        const uploadRes = await messagesAPI.upload(formData);
        const audioUrl = uploadRes.file?.url;

        const payload = {
          content: `🎤 Voice Note (${formatVoiceDuration(recordedDuration)})`,
          messageType: 'voice',
          audioUrl,
          voiceDuration: recordedDuration,
        };

        const socket = getSocket();
        if (activeChat.type === 'direct') {
          if (socket.connected) {
            socket.emit('send_direct_message', { recipientId: activeChat.id, ...payload });
          } else {
            const res = await messagesAPI.sendDirect(activeChat.id, payload);
            if (res.success && res.message) setMessages((prev) => [...prev, res.message]);
          }
        } else {
          if (socket.connected) {
            socket.emit('send_message', { groupId: activeChat.id, ...payload });
          } else {
            const res = await messagesAPI.send(activeChat.id, payload.content, payload);
            if (res.success && res.message) setMessages((prev) => [...prev, res.message]);
          }
        }
      } catch (err) {
        setError('Failed to upload voice note.');
      }
    };

    mediaRecorderRef.current.stop();
  };

  const handleCancelRealRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
    }
    clearInterval(voiceIntervalRef.current);
    setVoiceRecording(false);
    setVoiceSeconds(0);
    audioChunksRef.current = [];
  };

  // Media / File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await messagesAPI.upload(formData);

      if (res.success && res.file) {
        const isImage = file.type.startsWith('image/');
        const payload = {
          content: isImage ? `📷 Photo` : `📄 Document: ${res.file.fileName}`,
          messageType: isImage ? 'image' : 'file',
          attachments: [res.file],
        };

        const socket = getSocket();
        if (activeChat.type === 'direct') {
          if (socket.connected) {
            socket.emit('send_direct_message', { recipientId: activeChat.id, ...payload });
          } else {
            const sendRes = await messagesAPI.sendDirect(activeChat.id, payload);
            if (sendRes.success && sendRes.message) setMessages((prev) => [...prev, sendRes.message]);
          }
        } else {
          if (socket.connected) {
            socket.emit('send_message', { groupId: activeChat.id, ...payload });
          } else {
            const sendRes = await messagesAPI.send(activeChat.id, payload.content, payload);
            if (sendRes.success && sendRes.message) setMessages((prev) => [...prev, sendRes.message]);
          }
        }
      }
    } catch (err) {
      setError('File upload failed.');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Poll Sending and Voting
  const handleSendPoll = async (pollData) => {
    if (!activeChat) return;
    const payload = {
      content: `📊 Poll: ${pollData.question}`,
      messageType: 'poll',
      poll: pollData,
    };

    const socket = getSocket();
    if (activeChat.type === 'direct') {
      if (socket.connected) {
        socket.emit('send_direct_message', { recipientId: activeChat.id, ...payload });
      } else {
        const res = await messagesAPI.sendDirect(activeChat.id, payload);
        if (res.success && res.message) setMessages((prev) => [...prev, res.message]);
      }
    } else {
      if (socket.connected) {
        socket.emit('send_message', { groupId: activeChat.id, ...payload });
      } else {
        const res = await messagesAPI.send(activeChat.id, payload.content, payload);
        if (res.success && res.message) setMessages((prev) => [...prev, res.message]);
      }
    }
  };

  const handleVotePoll = async (messageId, optionIndex) => {
    try {
      const res = await messagesAPI.votePoll(messageId, optionIndex);
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, poll: res.poll } : m))
        );
      }
    } catch (err) {
      setError('Failed to record vote.');
    }
  };

  // WebRTC Calling
  const handleStartCall = (callType) => {
    if (!activeChat || activeChat.type !== 'direct') {
      alert('1-on-1 audio and video calling is available in personal discussions.');
      return;
    }
    setCallState({
      status: 'outgoing',
      callType,
      peer: activeChat.data,
    });
  };

  const handleAcceptCall = () => {
    if (!callState) return;
    setCallState((prev) => ({
      ...prev,
      status: 'connected',
    }));
  };

  const handleRejectCall = () => {
    if (callState?.peer?._id) {
      const socket = getSocket();
      socket.emit('webrtc_reject_call', { toUserId: callState.peer._id });
    }
    setCallState(null);
  };

  const handleEndCall = (duration, status) => {
    if (callState?.peer?._id) {
      const socket = getSocket();
      socket.emit('webrtc_end_call', {
        toUserId: callState.peer._id,
        duration: duration || 0,
        callType: callState.callType,
        callStatus: status || (duration > 0 ? 'completed' : 'missed'),
      });
    }
    setCallState(null);
  };

  // Chat Personalization Actions: Pin, Mute, Block, Clear
  const handleTogglePin = async (chatKey) => {
    try {
      const res = await messagesAPI.togglePin(chatKey);
      if (res.success) {
        setPinnedChats(new Set(res.pinnedChats || []));
      }
    } catch (err) {
      // ignore
    }
  };

  const handleToggleMute = async (chatKey) => {
    try {
      const res = await messagesAPI.toggleMute(chatKey);
      if (res.success) {
        setMutedChats(new Set(res.mutedChats || []));
      }
    } catch (err) {
      // ignore
    }
  };

  const handleToggleBlock = async (userId) => {
    try {
      const res = await messagesAPI.toggleBlock(userId);
      if (res.success) {
        setBlockedUsers(new Set(res.blockedUsers || []));
      }
    } catch (err) {
      // ignore
    }
  };

  const handleClearChatHistory = async () => {
    if (!activeChat) return;
    if (!window.confirm('Are you sure you want to clear your message history in this chat?')) return;
    try {
      await messagesAPI.clearHistory(activeChat.type, activeChat.id);
      setMessages([]);
    } catch (err) {
      setError('Could not clear history.');
    }
  };

  // Contacts modal handlers
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
          socket.emit('send_direct_message', { recipientId: activeChat.id, ...payload });
        } else {
          const res = await messagesAPI.sendDirect(activeChat.id, payload);
          if (res.success && res.message) setMessages((prev) => [...prev, res.message]);
        }
      } else {
        if (socket.connected) {
          socket.emit('send_message', { groupId: activeChat.id, ...payload });
        } else {
          const res = await messagesAPI.send(activeChat.id, payload.content, payload);
          if (res.success && res.message) setMessages((prev) => [...prev, res.message]);
        }
      }
    } catch (err) {
      setError('Could not send code snippet.');
    }
  };

  // Filtered chats for sidebar list (with pinned items at top)
  const filteredChats = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    // 1. Direct chats
    const directItems = directConversations.map((c) => ({
      type: 'direct',
      id: c.peer._id,
      chatKey: `direct:${c.peer._id}`,
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
      chatKey: `group:${g._id}`,
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

    // Filter by search query
    if (q) {
      combined = combined.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.subtitle && c.subtitle.toLowerCase().includes(q))
      );
    }

    // Sort pinned chats to the top
    combined.sort((a, b) => {
      const isAPinned = pinnedChats.has(a.chatKey);
      const isBPinned = pinnedChats.has(b.chatKey);
      if (isAPinned && !isBPinned) return -1;
      if (!isAPinned && isBPinned) return 1;
      return 0;
    });

    return combined;
  }, [activeTab, searchQuery, directConversations, userGroups, onlineUsers, pinnedChats]);

  // Messages filtered by in-chat search query
  const displayedMessages = useMemo(() => {
    if (!inChatSearchQuery.trim()) return messages;
    const query = inChatSearchQuery.toLowerCase().trim();
    return messages.filter(
      (m) =>
        m.content?.toLowerCase().includes(query) ||
        m.senderName?.toLowerCase().includes(query) ||
        m.codeSnippet?.code?.toLowerCase().includes(query) ||
        m.poll?.question?.toLowerCase().includes(query)
    );
  }, [messages, inChatSearchQuery]);

  const activePeerIsOnline = activeChat?.type === 'direct' && onlineUsers.has(activeChat.id);
  const activeChatTyping =
    activeChat?.type === 'direct'
      ? typingMap[activeChat.id]
      : typingMap[`group:${activeChat?.id}`];
  const activeChatKey = activeChat ? `${activeChat.type}:${activeChat.id}` : '';
  const isActiveChatPinned = pinnedChats.has(activeChatKey);
  const isActiveChatMuted = mutedChats.has(activeChatKey);
  const isPeerBlocked = activeChat?.type === 'direct' && blockedUsers.has(activeChat.id);

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
      <div className="flex-1 flex flex-col h-[calc(100dvh-4rem)] lg:h-[calc(100vh-0rem)] w-full overflow-hidden overflow-x-hidden">
        {/* Full-Bleed Edge-to-Edge Container Using StudyMate Website Default Theme */}
        <div
          className={`flex-1 flex overflow-hidden overflow-x-hidden w-full h-full ${
            isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
          } transition-colors relative`}
        >
          {/* LEFT SIDEBAR: Chats & Contacts List */}
          <div
            className={`${
              activeChat ? 'hidden md:flex' : 'flex'
            } w-full md:w-[380px] lg:w-[400px] flex-col border-r ${
              isDark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white'
            } shrink-0`}
          >
            {/* Sidebar Header */}
            <div
              className={`px-4 py-3.5 flex items-center justify-between border-b ${
                isDark ? 'bg-slate-900/90 border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-indigo-500/20">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                </div>
                <div>
                  <h2 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'} leading-none`}>
                    Discussions
                  </h2>
                  <span className="text-[11px] text-emerald-400 font-medium">● Online</span>
                </div>
              </div>

              {/* Action Buttons: Status, Broadcast, New Group, New Chat */}
              <div className="flex items-center gap-0.5">
                {/* 24h Status / Stories */}
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(true)}
                  className={`p-2 rounded-xl transition cursor-pointer relative ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="24-Hour Statuses / Stories"
                >
                  <Camera size={18} />
                  {stories.some((s) => s.hasUnviewed) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </button>

                {/* Broadcast List */}
                <button
                  type="button"
                  onClick={async () => {
                    const res = await messagesAPI.getPeers({});
                    if (res.success) setAvailablePeers(res.peers || []);
                    setBroadcastModalOpen(true);
                  }}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Broadcast List"
                >
                  <Radio size={18} />
                </button>

                {/* Create Study Group */}
                <button
                  type="button"
                  onClick={() => setNewGroupModalOpen(true)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Create Study Group"
                >
                  <Users size={18} />
                </button>

                {/* New Personal Chat */}
                <button
                  type="button"
                  onClick={handleOpenNewChatModal}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="New Personal Chat"
                >
                  <MessageSquarePlus size={18} />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className={`px-3 py-2 border-b ${isDark ? 'border-white/10 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
              <div
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border ${
                  isDark ? 'bg-slate-950/80 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <Search size={15} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts or groups..."
                  className="w-full bg-transparent text-xs outline-none placeholder-slate-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs: All, Personal, Groups, Unread */}
            <div
              className={`flex items-center gap-1.5 px-3 py-2 border-b ${
                isDark ? 'border-white/10 bg-slate-900/40' : 'border-slate-200 bg-slate-50/60'
              } text-xs font-medium overflow-x-auto`}
            >
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 font-semibold ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('direct')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 font-semibold ${
                  activeTab === 'direct'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <UserIcon size={12} />
                <span>Personal</span>
              </button>
              <button
                onClick={() => setActiveTab('group')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 font-semibold ${
                  activeTab === 'group'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Users size={12} />
                <span>Groups</span>
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 font-semibold ${
                  activeTab === 'unread'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Unread
              </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto divide-y divide-transparent">
              {loadingChats ? (
                <div className="flex flex-col items-center justify-center p-10 text-xs text-slate-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                  <span>Loading conversations...</span>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-3">
                  <MessageSquare size={36} className="mx-auto text-indigo-500/50" />
                  <p className="font-semibold">No discussions found in this category.</p>
                  <button
                    onClick={handleOpenNewChatModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition cursor-pointer shadow-md shadow-indigo-600/20"
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
                  const isPinned = pinnedChats.has(chat.chatKey);
                  const isMuted = mutedChats.has(chat.chatKey);

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
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition cursor-pointer border-b ${
                        isDark ? 'border-white/[0.04]' : 'border-slate-100'
                      } ${
                        isSelected
                          ? isDark
                            ? 'bg-indigo-600/15 border-l-4 border-l-indigo-500 text-white'
                            : 'bg-indigo-50/80 border-l-4 border-l-indigo-600 text-slate-900'
                          : isDark
                          ? 'hover:bg-white/5 text-slate-300'
                          : 'hover:bg-slate-100/70 text-slate-700'
                      }`}
                    >
                      {/* Avatar with Online Green Dot */}
                      <div className="relative shrink-0">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                            chat.type === 'group'
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm'
                              : 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white shadow-sm'
                          }`}
                        >
                          {chat.type === 'group' ? (
                            <Users size={19} />
                          ) : (
                            chat.name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        {chat.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                        )}
                      </div>

                      {/* Info & Last Message */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isPinned && <Pin size={12} className="text-amber-400 shrink-0 fill-amber-400" />}
                            <span
                              className={`font-semibold text-sm truncate ${
                                isSelected
                                  ? isDark ? 'text-white' : 'text-indigo-950'
                                  : isDark ? 'text-slate-200' : 'text-slate-900'
                              }`}
                            >
                              {chat.name}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] shrink-0 ${
                              chat.unreadCount > 0 ? 'text-indigo-400 font-bold' : 'text-slate-400'
                            }`}
                          >
                            {chat.lastMessage
                              ? formatMessageTime(chat.lastMessage.createdAt)
                              : ''}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-xs truncate">
                            {isTyping ? (
                              <span className="text-emerald-400 font-semibold italic text-xs">
                                {typeof isTyping === 'string' ? `${isTyping} is typing...` : 'typing...'}
                              </span>
                            ) : chat.lastMessage ? (
                              <>
                                {chat.lastMessage.sender?._id === user?._id && (
                                  <CheckCheck size={14} className="text-cyan-400 shrink-0" />
                                )}
                                <span className={`truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {chat.lastMessage.content || 'Voice message'}
                                </span>
                              </>
                            ) : (
                              <span className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                                {chat.subtitle}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isMuted && <VolumeX size={13} className="text-slate-400" />}
                            {chat.unreadCount > 0 && (
                              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shadow">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
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
            <div
              className={`${
                activeChat ? 'flex' : 'hidden md:flex'
              } flex-1 flex-col min-w-0 h-full relative overflow-x-hidden`}
            >
              {/* Header */}
              <div
                className={`px-3 sm:px-5 py-3.5 flex items-center justify-between border-b ${
                  isDark ? 'bg-slate-900/90 border-white/10' : 'bg-white border-slate-200'
                } shrink-0 z-20`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Mobile Back Button to return to contact list */}
                  <button
                    type="button"
                    onClick={() => setActiveChat(null)}
                    className={`md:hidden p-2 -ml-1 rounded-xl transition cursor-pointer shrink-0 ${
                      isDark ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title="Back to conversations"
                  >
                    <ArrowLeft size={19} />
                  </button>

                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        activeChat.type === 'group'
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                          : 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white'
                      }`}
                    >
                      {activeChat.type === 'group' ? (
                        <Users size={18} />
                      ) : (
                        activeChat.data?.name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    {activePeerIsOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {activeChat.data?.name}
                      </h3>
                      {isActiveChatPinned && <Pin size={11} className="text-amber-400 fill-amber-400" />}
                      {isActiveChatMuted && <VolumeX size={11} className="text-slate-400" />}
                      {isPeerBlocked && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                          Blocked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] truncate flex items-center gap-1.5">
                      {activeChatTyping ? (
                        <span className="text-emerald-400 font-semibold italic">
                          {typeof activeChatTyping === 'string' ? `${activeChatTyping} is typing...` : 'typing...'}
                        </span>
                      ) : activeChat.type === 'direct' ? (
                        activePeerIsOnline ? (
                          <span className="text-emerald-400 font-medium">● Online</span>
                        ) : (
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                            {activeChat.data?.department || 'Student'} • {activeChat.data?.semester || 'MCA'}
                          </span>
                        )
                      ) : (
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                          {activeChat.data?.members?.length || 1} participants • {activeChat.data?.subject}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Actions: WebRTC Audio, Video, In-Chat Search, Details */}
                <div className="flex items-center gap-1 text-slate-400">
                  <button
                    type="button"
                    onClick={() => handleStartCall('audio')}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      isDark ? 'hover:text-white hover:bg-white/5' : 'hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title="Start Voice Call"
                  >
                    <Phone size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartCall('video')}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      isDark ? 'hover:text-white hover:bg-white/5' : 'hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title="Start Video Call"
                  >
                    <Video size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setInChatSearchOpen(!inChatSearchOpen)}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      inChatSearchOpen
                        ? 'text-indigo-400 bg-indigo-500/10'
                        : isDark
                        ? 'hover:text-white hover:bg-white/5'
                        : 'hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title="Search Messages in Chat"
                  >
                    <Search size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setInfoDrawerOpen(!infoDrawerOpen)}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      infoDrawerOpen
                        ? 'text-indigo-400'
                        : isDark
                        ? 'hover:text-white hover:bg-white/5'
                        : 'hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title="Chat Details & Settings"
                  >
                    <Info size={17} />
                  </button>
                </div>
              </div>

              {/* In-Chat Search Filter Bar */}
              {inChatSearchOpen && (
                <div
                  className={`px-4 py-2 border-b flex items-center justify-between gap-3 ${
                    isDark ? 'bg-slate-900 border-white/10' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Search size={15} className="text-slate-400" />
                    <input
                      type="text"
                      value={inChatSearchQuery}
                      onChange={(e) => setInChatSearchQuery(e.target.value)}
                      placeholder="Search messages in this conversation..."
                      className="w-full bg-transparent text-xs outline-none"
                    />
                  </div>
                  {inChatSearchQuery && (
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {displayedMessages.length} match{displayedMessages.length !== 1 ? 'es' : ''}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setInChatSearchOpen(false);
                      setInChatSearchQuery('');
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              {/* Messages Canvas with Website Palette */}
              <div
                className={`flex-1 p-3 sm:p-5 overflow-y-auto overflow-x-hidden space-y-3 relative ${
                  isDark ? 'bg-slate-950' : 'bg-slate-50/80'
                }`}
                style={{
                  backgroundImage: `radial-gradient(${isDark ? '#1e293b 1px' : '#e2e8f0 1px'}, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              >
                {/* Date Divider Chip */}
                <div className="flex justify-center my-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                      isDark ? 'bg-slate-900 text-slate-400 border-white/5' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Today
                  </span>
                </div>

                {loadingMessages ? (
                  <div className="flex justify-center items-center py-20 text-xs text-slate-400">
                    <Loader2 size={24} className="animate-spin text-indigo-500 mr-2" />
                    <span>Loading message history...</span>
                  </div>
                ) : displayedMessages.length === 0 ? (
                  <div className="max-w-sm mx-auto my-14 text-center p-6 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur text-xs space-y-2">
                    <p className="font-semibold text-indigo-400 text-sm">
                      🔒 StudyMate Secure Discussions
                    </p>
                    <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                      {inChatSearchQuery
                        ? 'No messages match your search keyword in this chat.'
                        : 'Direct messages and group chats are private to enrolled students. Say hello or share notes!'}
                    </p>
                  </div>
                ) : (
                  displayedMessages.map((msg) => {
                    const isMe = msg.sender?._id === user?._id;

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} my-1 relative group max-w-full`}
                      >
                        {/* Floating WhatsApp Action Toolbar */}
                        <div
                          className={`opacity-0 group-hover:opacity-100 ${
                            activeActionMessageId === msg._id ? 'opacity-100' : ''
                          } transition-opacity absolute ${
                            isMe ? 'right-2' : 'left-2'
                          } -top-7 flex items-center gap-0.5 px-1.5 py-0.5 rounded-xl shadow-xl border backdrop-blur z-20 ${
                            isDark ? 'bg-slate-900/95 border-white/15' : 'bg-white/95 border-slate-200'
                          }`}
                        >
                          {/* Quick Reactions */}
                          {['👍', '❤️', '😂', '😮', '😢', '🔥'].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleToggleReaction(msg._id, emoji)}
                              className="hover:scale-125 transition-transform text-xs p-1 cursor-pointer"
                              title={`React ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                          <div className={`w-[1px] h-3.5 ${isDark ? 'bg-white/10' : 'bg-slate-200'} mx-0.5`} />
                          <button
                            type="button"
                            onClick={() => handleStartReply(msg)}
                            className={`p-1 rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                            title="Reply"
                          >
                            <Reply size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStar(msg._id)}
                            className={`p-1 rounded-lg ${
                              msg.starredBy?.includes(user?._id)
                                ? 'text-amber-400'
                                : isDark
                                ? 'text-slate-400 hover:text-amber-400 hover:bg-white/10'
                                : 'text-slate-600 hover:text-amber-500 hover:bg-slate-100'
                            }`}
                            title="Star"
                          >
                            <Star size={12} className={msg.starredBy?.includes(user?._id) ? 'fill-amber-400' : ''} />
                          </button>
                          {isMe && !msg.isDeletedForEveryone && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(msg)}
                              className={`p-1 rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                              title="Edit"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteModalMsg({ _id: msg._id, isMe })}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* Message Bubble */}
                        <div
                          onClick={() => setActiveActionMessageId(activeActionMessageId === msg._id ? null : msg._id)}
                          className={`max-w-[88%] md:max-w-[72%] rounded-2xl px-4 py-2.5 relative shadow-sm cursor-pointer sm:cursor-default ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-600/15'
                              : isDark
                              ? 'bg-slate-900 border border-white/5 text-slate-100 rounded-tl-sm'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                          }`}
                        >
                          {/* In group chats, display sender's name on received message */}
                          {!isMe && activeChat.type === 'group' && (
                            <div className="text-[11px] font-bold text-cyan-400 mb-0.5">
                              {msg.senderName || msg.sender?.name}
                            </div>
                          )}

                          {/* Quoted Reply Preview */}
                          {msg.replyTo && (
                            <div className="mb-2 p-2 rounded-xl bg-black/20 border-l-4 border-cyan-400 text-xs">
                              <div className="font-bold text-[11px] text-cyan-300">
                                {msg.replyTo.senderName || msg.replyTo.sender?.name || 'Classmate'}
                              </div>
                              <div className="truncate text-[11px] opacity-80">
                                {msg.replyTo.content || (msg.replyTo.messageType === 'code' ? 'Code Snippet' : 'Voice note')}
                              </div>
                            </div>
                          )}

                          {/* 1. Interactive Study Poll Bubble */}
                          {msg.messageType === 'poll' && msg.poll ? (
                            <div className="my-1 space-y-3 min-w-[240px] sm:min-w-[280px]">
                              <div className="flex items-center gap-2 border-b border-white/10 pb-1.5">
                                <BarChart2 size={16} className="text-cyan-300" />
                                <span className="font-bold text-xs sm:text-sm">{msg.poll.question}</span>
                              </div>

                              <div className="space-y-2">
                                {msg.poll.options?.map((opt, optIdx) => {
                                  const totalVotes = msg.poll.options.reduce(
                                    (sum, o) => sum + (o.votes?.length || 0),
                                    0
                                  );
                                  const optVoteCount = opt.votes?.length || 0;
                                  const percent = totalVotes > 0 ? Math.round((optVoteCount / totalVotes) * 100) : 0;
                                  const hasMyVote = opt.votes?.some(
                                    (v) => (v._id || v).toString() === user?._id?.toString()
                                  );

                                  return (
                                    <button
                                      key={optIdx}
                                      type="button"
                                      onClick={() => handleVotePoll(msg._id, optIdx)}
                                      className={`w-full text-left p-2.5 rounded-xl border relative overflow-hidden transition cursor-pointer ${
                                        hasMyVote
                                          ? isDark
                                            ? 'border-indigo-400 bg-indigo-500/20'
                                            : 'border-indigo-600 bg-indigo-50'
                                          : isDark
                                          ? 'border-white/10 bg-slate-950/60 hover:bg-white/5'
                                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                                      }`}
                                    >
                                      {/* Percentage Progress Fill */}
                                      <div
                                        style={{ width: `${percent}%` }}
                                        className={`absolute inset-y-0 left-0 transition-all duration-300 opacity-25 ${
                                          hasMyVote ? 'bg-cyan-400' : 'bg-slate-400'
                                        }`}
                                      />
                                      <div className="relative z-10 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 font-medium">
                                          <div
                                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                              hasMyVote ? 'border-cyan-400 bg-cyan-400 text-slate-900 font-bold' : 'border-slate-400'
                                            }`}
                                          >
                                            {hasMyVote && <Check size={11} />}
                                          </div>
                                          <span>{opt.text}</span>
                                        </div>
                                        <span className="font-bold text-[11px] opacity-80">{percent}% ({optVoteCount})</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : msg.messageType === 'code' && msg.codeSnippet ? (
                            /* 2. Code Snippet */
                            <div className="my-1 space-y-1.5 font-mono text-xs">
                              <div className="flex items-center justify-between text-[11px] opacity-90 border-b border-white/10 pb-1">
                                <span className="font-bold">{msg.codeSnippet.title || 'Code Snippet'}</span>
                                <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-black/30 font-semibold">
                                  {msg.codeSnippet.language}
                                </span>
                              </div>
                              <pre
                                className={`p-3 rounded-xl text-xs overflow-x-auto ${
                                  isDark ? 'bg-slate-950 border border-white/10 text-cyan-300' : 'bg-slate-900 text-cyan-300'
                                }`}
                              >
                                {msg.codeSnippet.code}
                              </pre>
                              <div className="flex justify-end">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyCode(msg._id, msg.codeSnippet.code);
                                  }}
                                  className="text-[10px] flex items-center gap-1 hover:underline text-cyan-300 cursor-pointer"
                                >
                                  {copiedCodeId === msg._id ? <Check size={12} /> : <Copy size={12} />}
                                  <span>{copiedCodeId === msg._id ? 'Copied' : 'Copy Code'}</span>
                                </button>
                              </div>
                            </div>
                          ) : msg.messageType === 'voice' ? (
                            /* 3. Real Audio Voice Note */
                            <div className="flex items-center gap-3 py-1 min-w-[220px]">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const audioEl = audioElementsRef.current[msg._id];
                                  if (audioEl) {
                                    if (playingVoiceId === msg._id) {
                                      audioEl.pause();
                                      setPlayingVoiceId(null);
                                    } else {
                                      audioEl.playbackRate = playbackSpeed;
                                      audioEl.play();
                                      setPlayingVoiceId(msg._id);
                                    }
                                  }
                                }}
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
                                  isMe
                                    ? 'bg-white text-indigo-700 hover:bg-slate-100'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                                }`}
                              >
                                {playingVoiceId === msg._id ? (
                                  <Pause size={16} />
                                ) : (
                                  <Play size={16} className="ml-0.5" />
                                )}
                              </button>

                              {/* Hidden HTML5 Audio Element */}
                              {msg.audioUrl && (
                                <audio
                                  ref={(el) => (audioElementsRef.current[msg._id] = el)}
                                  src={msg.audioUrl}
                                  onEnded={() => setPlayingVoiceId(null)}
                                  className="hidden"
                                />
                              )}

                              <div className="flex-1">
                                <div className="h-4 flex items-center gap-0.5">
                                  {[40, 70, 90, 60, 100, 50, 80, 45, 95, 30, 85, 60, 40].map((h, idx) => (
                                    <span
                                      key={idx}
                                      style={{ height: `${h}%` }}
                                      className={`w-1 rounded-full ${
                                        playingVoiceId === msg._id
                                          ? 'bg-cyan-400 animate-pulse'
                                          : isMe
                                          ? 'bg-white/60'
                                          : 'bg-indigo-400/60'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <div className="flex justify-between items-center text-[10px] opacity-80 mt-1">
                                  <span>{formatVoiceDuration(msg.voiceDuration || 12)}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
                                      setPlaybackSpeed(nextSpeed);
                                      const audioEl = audioElementsRef.current[msg._id];
                                      if (audioEl) audioEl.playbackRate = nextSpeed;
                                    }}
                                    className="px-1.5 py-0.5 rounded bg-black/20 hover:bg-black/30 text-[9px] font-bold"
                                  >
                                    {playbackSpeed}x
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : msg.messageType === 'call_log' ? (
                            /* 4. Call Log History Entry */
                            <div className="flex items-center gap-2 py-1 text-xs">
                              {msg.callInfo?.callType === 'video' ? <Video size={16} /> : <Phone size={16} />}
                              <span className="font-semibold">{msg.content}</span>
                            </div>
                          ) : (
                            /* 5. Standard Text Message */
                            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          )}

                          {/* Image or Document Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {msg.attachments.map((att, idx) => {
                                const isImg =
                                  att.fileType?.startsWith('image/') ||
                                  /\.(png|jpg|jpeg|gif|webp)$/i.test(att.url);

                                return isImg ? (
                                  <img
                                    key={idx}
                                    src={att.url}
                                    alt={att.fileName || 'Attachment'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewImage(att.url);
                                    }}
                                    className="max-h-60 rounded-xl object-cover cursor-pointer hover:opacity-95 transition"
                                  />
                                ) : (
                                  <a
                                    key={idx}
                                    href={att.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-2.5 p-2 rounded-xl bg-black/20 hover:bg-black/30 transition text-xs"
                                  >
                                    <FileText size={18} className="text-cyan-300 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold truncate text-[11px]">{att.fileName || 'Document'}</p>
                                      <span className="text-[9px] opacity-75">
                                        {att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : 'Download file'}
                                      </span>
                                    </div>
                                    <Download size={14} className="opacity-80 shrink-0" />
                                  </a>
                                );
                              })}
                            </div>
                          )}

                          {/* Timestamp + WhatsApp Ticks + Star Indicator */}
                          <div className="flex items-center justify-end gap-1 text-[10px] opacity-75 mt-1 float-right ml-3">
                            {msg.starredBy?.includes(user?._id) && (
                              <Star size={11} className="fill-amber-400 text-amber-400 mr-0.5" />
                            )}
                            {msg.isEdited && (
                              <span className="italic opacity-80 text-[9px] mr-0.5">edited</span>
                            )}
                            <span>{formatMessageTime(msg.createdAt)}</span>
                            {isMe && (
                              msg.status === 'read' ? (
                                <CheckCheck size={14} className="text-cyan-300" title="Read" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck size={14} className="text-slate-300" title="Delivered" />
                              ) : (
                                <Check size={14} className="text-slate-300" title="Sent" />
                              )
                            )}
                          </div>
                        </div>

                        {/* Reactions Badge Pill Beneath Bubble */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className={`flex items-center gap-1 -mt-2.5 ${isMe ? 'self-end mr-2' : 'self-start ml-2'} z-10`}>
                            <button
                              type="button"
                              onClick={() => handleToggleReaction(msg._id, msg.reactions[0]?.emoji || '👍')}
                              className={`px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1 border shadow-sm cursor-pointer hover:scale-105 transition ${
                                isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                              }`}
                            >
                              {Array.from(new Set(msg.reactions.map((r) => r.emoji))).slice(0, 3).map((e, i) => (
                                <span key={i}>{e}</span>
                              ))}
                              <span className="text-[10px] font-bold text-slate-400">{msg.reactions.length}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Real-time Typing Bubble indicator */}
                {activeChatTyping && (
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-4 py-2.5 rounded-2xl rounded-tl-sm text-xs flex items-center gap-1.5 shadow-sm border ${
                        isDark ? 'bg-slate-900 border-white/5 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[11px] text-indigo-400 font-semibold ml-1">
                        {typeof activeChatTyping === 'string' ? `${activeChatTyping} is typing...` : 'typing...'}
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Emoji Quick Picker Bar */}
              {emojiPickerOpen && (
                <div
                  className={`p-2.5 border-t flex items-center gap-2 overflow-x-auto ${
                    isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="text-xs text-slate-400 font-semibold shrink-0">Emojis:</span>
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

              {/* Quoted Reply Banner */}
              {replyingTo && (
                <div
                  className={`px-4 py-2 border-t flex items-center justify-between transition-all ${
                    isDark ? 'bg-slate-900 border-white/10' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-1 h-8 rounded-full bg-indigo-500 shrink-0" />
                    <div className="text-xs min-w-0">
                      <div className="font-bold text-indigo-400 flex items-center gap-1.5">
                        <Reply size={12} />
                        <span>Replying to {replyingTo.senderName || replyingTo.sender?.name || 'Classmate'}</span>
                      </div>
                      <p className={`truncate text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {replyingTo.content || (replyingTo.messageType === 'code' ? 'Code Snippet' : 'Voice Note')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                    title="Cancel Reply"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              {/* Editing Message Banner */}
              {editingMessage && (
                <div
                  className={`px-4 py-2 border-t flex items-center justify-between transition-all ${
                    isDark ? 'bg-slate-900 border-white/10' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-1 h-8 rounded-full bg-amber-500 shrink-0" />
                    <div className="text-xs min-w-0">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Edit2 size={12} />
                        <span>Editing Message</span>
                      </div>
                      <p className={`truncate text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {editingMessage.content}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMessage(null);
                      setInputContent('');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                    title="Cancel Edit"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              {/* Voice Recording Active Bar */}
              {voiceRecording ? (
                <div
                  className={`px-5 py-3 flex items-center justify-between border-t ${
                    isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-mono text-sm font-bold text-rose-500">
                      Recording: {formatVoiceDuration(voiceSeconds)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelRealRecording}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-500/20 hover:bg-slate-500/30 text-xs font-semibold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleStopAndSendRecording}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
                    >
                      <Send size={13} />
                      <span>Send Voice Note</span>
                    </button>
                  </div>
                </div>
              ) : isPeerBlocked ? (
                /* Blocked Contact Warning Bar */
                <div
                  className={`px-4 py-3 border-t text-center text-xs flex items-center justify-center gap-2 ${
                    isDark ? 'bg-slate-900 text-rose-400 border-white/10' : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}
                >
                  <ShieldAlert size={16} />
                  <span>You cannot message this contact because they are blocked.</span>
                  <button
                    onClick={() => handleToggleBlock(activeChat.id)}
                    className="underline font-bold ml-1 cursor-pointer"
                  >
                    Unblock
                  </button>
                </div>
              ) : (
                /* Bottom Message Input Bar */
                <form
                  onSubmit={handleSendMessage}
                  className={`px-4 py-3 flex items-center gap-2 border-t ${
                    isDark ? 'bg-slate-900/90 border-white/10' : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Emoji toggle */}
                  <button
                    type="button"
                    onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      emojiPickerOpen
                        ? 'text-indigo-400 bg-indigo-500/10'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Insert Emoji"
                  >
                    <Smile size={19} />
                  </button>

                  {/* Attachment Upload (Photo, Document, PDF) */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      uploadingFile
                        ? 'animate-pulse text-indigo-400'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Attach Photo or Document"
                  >
                    <Paperclip size={19} />
                  </button>

                  {/* Create Poll Button */}
                  <button
                    type="button"
                    onClick={() => setPollModalOpen(true)}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Create Interactive Poll"
                  >
                    <BarChart2 size={19} />
                  </button>

                  {/* Share Code Snippet */}
                  <button
                    type="button"
                    onClick={() => setCodeModalOpen(true)}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Share Code Snippet"
                  >
                    <Code2 size={19} />
                  </button>

                  {/* Text Input Pill */}
                  <div
                    className={`flex-1 rounded-xl px-4 py-2.5 flex items-center border ${
                      isDark
                        ? 'bg-slate-950 border-white/10 text-white focus-within:border-indigo-500'
                        : 'bg-slate-100/90 border-slate-200 text-slate-900 focus-within:border-indigo-600'
                    }`}
                  >
                    <input
                      ref={textareaRef}
                      type="text"
                      value={inputContent}
                      onChange={handleInputChange}
                      placeholder="Type a message or discuss with classmates..."
                      className="w-full bg-transparent text-xs sm:text-sm outline-none placeholder-slate-400"
                    />
                  </div>

                  {/* Microphone (Real Audio Recording) or Send Button */}
                  {inputContent.trim() ? (
                    <button
                      type="submit"
                      className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white flex items-center justify-center transition shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0"
                      title="Send Message"
                    >
                      <Send size={17} className="ml-0.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartRealRecording}
                      className="w-10 h-10 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 flex items-center justify-center transition border border-indigo-500/20 cursor-pointer shrink-0"
                      title="Record Voice Note"
                    >
                      <Mic size={18} />
                    </button>
                  )}
                </form>
              )}
            </div>
          ) : (
            /* No Chat Selected Placeholder (Desktop only) */
            <div
              className={`hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center ${
                isDark ? 'bg-slate-950' : 'bg-slate-50'
              }`}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white mb-4 shadow-xl shadow-indigo-500/20">
                <GraduationCap size={40} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                StudyMate Discussions
              </h3>
              <p className={`text-xs max-w-md ${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                Connect 1-on-1 with classmates, coordinate study groups, share DSA programming solutions, host real-time voice and video study rooms, and collaborate in real-time.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleOpenNewChatModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold text-xs hover:from-indigo-500 hover:to-cyan-400 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  <MessageSquarePlus size={16} />
                  <span>Start Personal Chat</span>
                </button>
                <button
                  onClick={() => setNewGroupModalOpen(true)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <Users size={15} />
                  <span>Create Study Group</span>
                </button>
              </div>
            </div>
          )}

          {/* RIGHT CONTACT INFO & SETTINGS DRAWER */}
          {infoDrawerOpen && activeChat && (
            <div
              className={`fixed inset-y-0 right-0 z-40 md:static w-80 max-w-[85vw] border-l shadow-2xl md:shadow-none ${
                isDark ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white'
              } p-5 flex flex-col space-y-4 shrink-0 overflow-y-auto`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h4 className="font-bold text-sm">Conversation Details</h4>
                <button onClick={() => setInfoDrawerOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="text-center space-y-2">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white flex items-center justify-center font-bold text-2xl shadow-xl shadow-indigo-500/20">
                  {activeChat.data?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h3 className="font-bold text-base">{activeChat.data?.name}</h3>
                <p className="text-xs text-emerald-400 font-semibold">
                  {activePeerIsOnline ? '● Online Now' : 'Offline'}
                </p>
              </div>

              {/* Chat Controls: Pin, Mute, Clear, Block */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleTogglePin(activeChatKey)}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-medium transition cursor-pointer ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Pin size={15} className={isActiveChatPinned ? 'text-amber-400 fill-amber-400' : 'text-slate-400'} />
                    <span>{isActiveChatPinned ? 'Unpin Conversation' : 'Pin to Top'}</span>
                  </div>
                  {isActiveChatPinned && <span className="text-[10px] text-amber-400 font-bold">Pinned</span>}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleMute(activeChatKey)}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-medium transition cursor-pointer ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isActiveChatMuted ? <VolumeX size={15} className="text-rose-400" /> : <Volume2 size={15} className="text-slate-400" />}
                    <span>{isActiveChatMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                  </div>
                  {isActiveChatMuted && <span className="text-[10px] text-rose-400 font-bold">Muted</span>}
                </button>

                <button
                  type="button"
                  onClick={handleClearChatHistory}
                  className={`w-full p-2.5 rounded-xl flex items-center gap-2 text-xs font-medium transition cursor-pointer text-slate-400 hover:text-white ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                  }`}
                >
                  <Trash2 size={15} />
                  <span>Clear Chat History</span>
                </button>

                {activeChat.type === 'direct' && (
                  <button
                    type="button"
                    onClick={() => handleToggleBlock(activeChat.id)}
                    className="w-full p-2.5 rounded-xl flex items-center gap-2 text-xs font-medium transition cursor-pointer text-rose-400 hover:bg-rose-500/10"
                  >
                    <ShieldAlert size={15} />
                    <span>{isPeerBlocked ? 'Unblock Student' : 'Block Student'}</span>
                  </button>
                )}
              </div>

              {/* Contact Academic Metadata */}
              <div
                className={`p-3.5 rounded-xl text-xs space-y-2 border ${
                  isDark ? 'bg-slate-950/70 border-white/5' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <span className="text-[11px] text-slate-400 block">Department</span>
                  <span className="font-semibold">{activeChat.data?.department || 'MCA'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Semester</span>
                  <span className="font-semibold">{activeChat.data?.semester || '2nd Semester'}</span>
                </div>
                {activeChat.data?.bio && (
                  <div>
                    <span className="text-[11px] text-slate-400 block">Bio</span>
                    <p className="text-xs italic">{activeChat.data.bio}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL: IMAGE PREVIEW LIGHTBOX */}
        {previewImage && (
          <div
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img src={previewImage} alt="Full Preview" className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* MODAL: WEBRTC AUDIO & VIDEO CALL */}
        {callState && (
          <WebRTCCallModal
            callState={callState}
            onAccept={handleAcceptCall}
            onReject={handleRejectCall}
            onEndCall={handleEndCall}
            onConnected={() => setCallState((prev) => (prev ? { ...prev, status: 'connected' } : null))}
            socket={getSocket()}
            currentUser={user}
          />
        )}

        {/* MODAL: 24-HOUR STATUS STORIES */}
        <StatusStoriesModal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          stories={stories}
          currentUser={user}
          onStatusCreated={refreshAllChats}
        />

        {/* MODAL: STUDY POLL */}
        <PollModal
          isOpen={pollModalOpen}
          onClose={() => setPollModalOpen(false)}
          onSendPoll={handleSendPoll}
          isDark={isDark}
        />

        {/* MODAL: BROADCAST LIST */}
        <BroadcastModal
          isOpen={broadcastModalOpen}
          onClose={() => setBroadcastModalOpen(false)}
          peers={availablePeers}
          isDark={isDark}
          onBroadcastSent={refreshAllChats}
        />

        {/* MODAL: NEW STUDY GROUP */}
        <NewGroupModal
          isOpen={newGroupModalOpen}
          onClose={() => setNewGroupModalOpen(false)}
          onGroupCreated={(newGrp) => {
            setUserGroups((prev) => [newGrp, ...prev]);
            setActiveChat({ type: 'group', id: newGrp._id, data: newGrp });
          }}
          isDark={isDark}
        />

        {/* MODAL: START NEW PERSONAL CHAT (Classmate Contacts) */}
        {newChatModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div
              className={`w-full max-w-md rounded-2xl border ${
                isDark ? 'border-white/10 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'
              } shadow-2xl p-6`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="text-indigo-400" size={20} />
                  <h3 className="font-bold text-base">New Personal Chat</h3>
                </div>
                <button onClick={() => setNewChatModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Search peer */}
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-4 border ${
                  isDark ? 'bg-slate-950 border-white/10' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <Search size={15} className="text-slate-400" />
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
                  <div className="py-8 text-center text-xs text-slate-400">
                    <Loader2 size={20} className="animate-spin mx-auto text-indigo-500 mb-2" />
                    <span>Finding classmates...</span>
                  </div>
                ) : availablePeers.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">No classmates found.</p>
                ) : (
                  availablePeers.map((peer) => (
                    <button
                      key={peer._id}
                      onClick={() => handleSelectPeerForNewChat(peer)}
                      className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition text-left cursor-pointer ${
                        isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                        {peer.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs truncate">{peer.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">
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
            <div
              className={`w-full max-w-lg rounded-2xl border ${
                isDark ? 'border-white/10 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'
              } shadow-2xl p-6 space-y-4`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Code2 className="text-indigo-400" size={20} />
                  <h3 className="font-bold text-base">Share Code Snippet</h3>
                </div>
                <button onClick={() => setCodeModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">Language</label>
                  <select
                    value={codeSnippet.language}
                    onChange={(e) => setCodeSnippet({ ...codeSnippet, language: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 text-xs border outline-none ${
                      isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
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
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">Snippet Title</label>
                  <input
                    type="text"
                    value={codeSnippet.title}
                    onChange={(e) => setCodeSnippet({ ...codeSnippet, title: e.target.value })}
                    placeholder="e.g. Binary Search Function"
                    className={`w-full rounded-xl px-3 py-2 text-xs border outline-none ${
                      isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Code</label>
                <textarea
                  value={codeSnippet.code}
                  onChange={(e) => setCodeSnippet({ ...codeSnippet, code: e.target.value })}
                  placeholder="Paste or write solution code here..."
                  rows={8}
                  className={`w-full rounded-xl p-3 font-mono text-xs border outline-none resize-none ${
                    isDark ? 'bg-slate-950 border-white/10 text-cyan-300' : 'bg-slate-900 border-slate-200 text-cyan-300'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCodeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendCodeSnippet}
                  disabled={!codeSnippet.code.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  Share to Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: DELETE MESSAGE (Delete for Me vs Delete for Everyone) */}
        {deleteModalMsg && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div
              className={`w-full max-w-sm rounded-2xl border ${
                isDark ? 'border-white/10 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'
              } shadow-2xl p-6 space-y-4`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="font-bold text-sm">Delete message?</h3>
                <button
                  type="button"
                  onClick={() => setDeleteModalMsg(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Choose how you would like to delete this message.
              </p>

              <div className="space-y-2 pt-1">
                {deleteModalMsg.isMe && (
                  <button
                    type="button"
                    onClick={() => handleConfirmDelete('for_everyone')}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-rose-600/20 text-center"
                  >
                    Delete for Everyone
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleConfirmDelete('for_me')}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition cursor-pointer text-center ${
                    isDark ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                  }`}
                >
                  Delete for Me
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteModalMsg(null)}
                  className="w-full py-2 px-4 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer text-center"
                >
                  Cancel
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