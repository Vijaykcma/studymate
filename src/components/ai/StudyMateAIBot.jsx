import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Send,
  RotateCcw,
  X,
  Minimize2,
  Maximize2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Users,
  MessageSquare,
  BookOpen,
  Calendar,
  ChevronDown,
  Loader2,
  Copy,
  Check,
  ArrowRight,
  Settings,
  Key,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { aiAPI } from '../../services/api';

const QUICK_PROMPTS = [
  '🔍 Find study groups for my semester',
  '👥 Recommend classmates & study partners',
  '📅 Show upcoming study sessions',
  '💡 Help with DSA & programming concepts',
  '📚 Discover shared study notes',
  '🚀 How do I start a video call?',
];

/**
 * Format markdown into styled React elements (eliminates raw ** and * artifacts)
 */
const renderFormattedText = (text, isDark, isUser) => {
  if (!text) return null;

  const lines = text.split('\n');

  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={idx} className="h-1.5" />;
    }

    const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ');
    const content = isBullet ? trimmed.replace(/^(\*|-|•)\s+/, '') : line;

    const parts = parseInlineMarkdown(content, isUser, isDark);

    if (isBullet) {
      return (
        <div key={idx} className="flex items-start gap-2 my-1 pl-1">
          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isUser ? 'bg-white' : 'bg-cyan-400'}`} />
          <span className="flex-1 leading-relaxed">{parts}</span>
        </div>
      );
    }

    if (trimmed.startsWith('> ')) {
      return (
        <blockquote key={idx} className={`border-l-2 border-indigo-500 pl-2.5 my-1.5 italic ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {parseInlineMarkdown(trimmed.substring(2), isUser, isDark)}
        </blockquote>
      );
    }

    return (
      <p key={idx} className="my-0.5 leading-relaxed">
        {parts}
      </p>
    );
  });
};

const parseInlineMarkdown = (text, isUser, isDark) => {
  const tokens = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={match.index} className={`font-bold ${isUser ? 'text-white' : isDark ? 'text-white' : 'text-slate-900'}`}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code key={match.index} className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
          isDark ? 'bg-black/40 text-cyan-300 border border-white/5' : 'bg-slate-100 text-indigo-700 border border-slate-200'
        }`}>
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(<em key={match.index} className={`italic ${isUser ? 'text-white' : isDark ? 'text-slate-200' : 'text-slate-700'}`}>{token.slice(1, -1)}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.substring(lastIndex));
  }

  return tokens.length ? tokens : text;
};

export const StudyMateAIBot = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [feedbackMap, setFeedbackMap] = useState({});

  // Optional custom free Gemini API key stored in localStorage
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => localStorage.getItem('studymate_gemini_key') || '');
  const [savedGeminiKey, setSavedGeminiKey] = useState(() => localStorage.getItem('studymate_gemini_key') || '');

  const firstName = user?.name ? user.name.split(' ')[0] : 'Classmate';

  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `Hey **${firstName}**! Great to see you. How is your day going in **${user?.department || 'MCA'}**?\n\nWhat are you studying or working on right now?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);

  const scrollToBottom = (instant = false) => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: instant ? 'instant' : 'smooth',
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isOpen && !isMinimized && !settingsOpen) {
      scrollToBottom();
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [messages, isOpen, isMinimized, settingsOpen]);

  // Global event listener to open / toggle StudyMate AI from bottom navigation or any button
  useEffect(() => {
    const handleOpenAI = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    const handleToggleAI = () => {
      setIsOpen((prev) => !prev);
      setIsMinimized(false);
    };
    window.addEventListener('open-studymate-ai', handleOpenAI);
    window.addEventListener('toggle-studymate-ai', handleToggleAI);
    return () => {
      window.removeEventListener('open-studymate-ai', handleOpenAI);
      window.removeEventListener('toggle-studymate-ai', handleToggleAI);
    };
  }, []);

  // Handle Save Custom Key
  const handleSaveKey = () => {
    const trimmed = geminiKeyInput.trim();
    if (trimmed) {
      localStorage.setItem('studymate_gemini_key', trimmed);
      setSavedGeminiKey(trimmed);
    } else {
      localStorage.removeItem('studymate_gemini_key');
      setSavedGeminiKey('');
    }
    setSettingsOpen(false);
  };

  // Handle Send Message
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const newMsg = {
      id: userMessageId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await aiAPI.chat({
        prompt: text,
        conversationHistory: history,
        apiKey: savedGeminiKey || undefined,
      });

      if (res.success) {
        const aiMessageId = `ai-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: aiMessageId,
            sender: 'ai',
            text: res.reply || "I'm ready to help you with your study goals!",
            action: res.action || null,
            groups: res.groups || [],
            peers: res.peers || [],
            suggestions: res.suggestions || [],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        // Auto-navigate if requested by student action
        if (res.action && res.action.type === 'navigate' && res.action.autoTrigger) {
          setTimeout(() => {
            navigate(res.action.path);
          }, 700);
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ I encountered a temporary connection issue. However, you can explore your active groups or search for peers in the navigation tabs!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Reset / Clear Conversation
  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: `Hey ${firstName}! Fresh chat started. What are we studying or exploring next?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setFeedbackMap({});
  };

  // Like / Dislike Feedback
  const handleFeedback = async (msgId, rating, promptText) => {
    setFeedbackMap((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === rating ? null : rating,
    }));

    try {
      await aiAPI.feedback({
        messageId: msgId,
        rating,
        prompt: promptText,
      });
    } catch {
      // Silent catch
    }
  };

  // Copy Message Text
  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!user) return null;

  return (
    <>
      {/* FLOATING LAUNCHER ROBOT BUTTON (DESKTOP ONLY - HIDDEN ON MOBILE WHERE AI MATE IS IN BOTTOM NAV) */}
      {!isOpen && (
        <div className="hidden lg:flex fixed bottom-6 right-6 z-[9990] items-center gap-3">
          <div
            onClick={() => setIsOpen(true)}
            className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xl border cursor-pointer hover:scale-105 transition-all ${
              isDark
                ? 'bg-slate-900/95 border-indigo-500/30 text-white shadow-indigo-950/50'
                : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/50'
            }`}
          >
            <Sparkles size={14} className="text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Need study help? <strong>Ask StudyMate AI</strong></span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[2px] shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Ask StudyMate AI (100% Free)"
          >
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-300 flex items-center justify-center text-white shadow-inner">
                <Bot size={24} className="group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-950 rounded-full" />
            </div>
            <span className="absolute -inset-1 rounded-full bg-indigo-500/30 animate-ping -z-10" />
          </button>
        </div>
      )}

      {/* CHAT WINDOW MODAL / POPUP (PERFECT RESPONSIVE MOBILE SHEET & DESKTOP POPUP) */}
      {isOpen && (
        <div
          className={`fixed z-[9995] transition-all duration-300 ease-in-out flex flex-col shadow-2xl border overflow-hidden ${
            isExpanded
              ? 'inset-2 sm:inset-6 md:inset-10 rounded-2xl sm:rounded-3xl'
              : isMinimized
              ? 'bottom-18 right-3 left-3 sm:left-auto sm:right-6 sm:bottom-6 sm:w-80 h-14 sm:h-16 rounded-2xl'
              : 'inset-x-0 bottom-16 top-12 sm:top-auto sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[430px] md:w-[460px] sm:h-[620px] rounded-t-3xl sm:rounded-3xl'
          } ${
            isDark
              ? 'bg-slate-950 border-white/10 text-white shadow-indigo-950/60'
              : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
          }`}
        >
          {/* Mobile Drawer Pull Indicator */}
          <div className="pt-2 pb-0.5 flex justify-center sm:hidden shrink-0">
            <div className="w-10 h-1 rounded-full bg-slate-400/30" />
          </div>

          {/* HEADER */}
          <div
            className={`px-4 py-3 flex items-center justify-between border-b shrink-0 select-none ${
              isDark ? 'bg-slate-900/95 border-white/10' : 'bg-slate-100/90 border-slate-200'
            }`}
          >
            {/* Bot Profile */}
            <div
              className="flex items-center gap-2.5 min-w-0 cursor-pointer"
              onClick={() => isMinimized && setIsMinimized(false)}
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md">
                  <Bot size={20} />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs sm:text-sm truncate">StudyMate AI</h3>
                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-extrabold uppercase tracking-wider">
                    {savedGeminiKey ? 'Gemini ⚡' : 'Free 100%'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Your College Study Buddy
                </p>
              </div>
            </div>

            {/* Header Control Icons */}
            <div className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {/* Settings / API Key */}
              <button
                type="button"
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`p-1.5 rounded-lg transition ${
                  settingsOpen
                    ? 'text-indigo-400 bg-white/10'
                    : isDark
                    ? 'hover:bg-white/10 hover:text-white'
                    : 'hover:bg-slate-200 hover:text-slate-900'
                }`}
                title="AI Settings & Free Gemini Key"
              >
                <Settings size={15} />
              </button>

              {/* Reset Session */}
              <button
                type="button"
                onClick={handleResetChat}
                className={`p-1.5 rounded-lg transition ${
                  isDark ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-slate-200 hover:text-slate-900'
                }`}
                title="Restart Conversation"
              >
                <RotateCcw size={15} />
              </button>

              {/* Expand / Restore Fullscreen */}
              {!isMinimized && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`p-1.5 rounded-lg transition ${
                    isDark ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-slate-200 hover:text-slate-900'
                  }`}
                  title={isExpanded ? 'Restore Normal Size' : 'Expand Fullscreen'}
                >
                  {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
              )}

              {/* Minimize Window */}
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className={`p-1.5 rounded-lg transition ${
                  isDark ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-slate-200 hover:text-slate-900'
                }`}
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <ChevronDown size={17} className={`transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                  setIsExpanded(false);
                  setSettingsOpen(false);
                }}
                className={`p-1.5 rounded-lg transition hover:text-rose-400 ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200'
                }`}
                title="Close"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* SETTINGS DRAWER OVERLAY */}
          {settingsOpen && !isMinimized && (
            <div className={`p-4 border-b shrink-0 text-xs space-y-3 ${isDark ? 'bg-slate-900 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Key size={14} className="text-indigo-400" />
                  StudyMate AI Configuration
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">100% Free Architecture</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Currently running on StudyMate's native database engine. Want unlimited open-ended chat? You can plug in a <strong>free Google Gemini API key</strong> (no credit card needed):
              </p>
              <div className="space-y-2">
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="Paste Gemini API key (e.g. AIzaSy...)"
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-slate-950 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <div className="flex items-center justify-between">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    Get free key from Google AI Studio <ExternalLink size={10} />
                  </a>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGeminiKeyInput('');
                        localStorage.removeItem('studymate_gemini_key');
                        setSavedGeminiKey('');
                        setSettingsOpen(false);
                      }}
                      className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveKey}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHAT MESSAGES BODY */}
          {!isMinimized && (
            <>
              <div
                ref={chatBodyRef}
                className={`flex-1 p-3.5 sm:p-4 overflow-y-auto overflow-x-hidden space-y-4 text-xs ai-transparent-scroll ${
                  isDark ? 'bg-slate-950/70' : 'bg-slate-50'
                }`}
                style={{
                  backgroundImage: `radial-gradient(${isDark ? '#1e293b 1px' : '#e2e8f0 1px'}, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }}
              >
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isAi = msg.sender === 'ai';
                  const feedback = feedbackMap[msg.id];

                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className="shrink-0 mt-1">
                        {isUser ? (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold text-[11px] shadow">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white flex items-center justify-center shadow">
                            <Bot size={15} />
                          </div>
                        )}
                      </div>

                      {/* Message Content Bubble */}
                      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`p-3 rounded-2xl relative shadow-md leading-relaxed whitespace-pre-wrap break-words ${
                            isUser
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-xs'
                              : isDark
                              ? 'bg-slate-900 border border-white/10 text-slate-100 rounded-tl-xs'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                          }`}
                        >
                          {/* Clean Formatted Markdown (Eliminates raw ** and * symbols) */}
                          {renderFormattedText(msg.text, isDark, isUser)}

                          {/* Direct Platform Action Button (e.g. Open Messages) */}
                          {msg.action && (
                            <div className="mt-3 pt-2.5 border-t border-white/10">
                              <button
                                type="button"
                                onClick={() => {
                                  navigate(msg.action.path);
                                }}
                                className="w-full py-2 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
                              >
                                <span>{msg.action.label || 'Take Action'}</span>
                                <ArrowRight size={13} />
                              </button>
                            </div>
                          )}

                          {/* Embedded Matching Group Cards */}
                          {msg.groups && msg.groups.length > 0 && (
                            <div className="mt-3 space-y-2 pt-2 border-t border-white/10">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                                Recommended Groups
                              </span>
                              {msg.groups.map((group) => (
                                <div
                                  key={group.id}
                                  className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition ${
                                    isDark ? 'bg-slate-950/80 border-white/10 hover:border-indigo-500/40' : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-xs truncate">{group.name}</h4>
                                    <p className="text-[10px] text-slate-400">
                                      {group.subject} • {group.membersCount}/{group.maxMembers} members
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigate(`/groups/${group.id}`);
                                      setIsOpen(false);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shrink-0 transition flex items-center gap-1"
                                  >
                                    View <ArrowRight size={10} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Embedded Matching Peer Cards */}
                          {msg.peers && msg.peers.length > 0 && (
                            <div className="mt-3 space-y-2 pt-2 border-t border-white/10">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                                Classmates Ready to Study
                              </span>
                              {msg.peers.map((peer) => (
                                <div
                                  key={peer.id}
                                  className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                                    isDark ? 'bg-slate-950/80 border-white/10' : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-xs truncate">{peer.name}</h4>
                                    <p className="text-[10px] text-slate-400">
                                      {peer.department} • {peer.semester}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigate('/messages');
                                      setIsOpen(false);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold shrink-0 transition flex items-center gap-1"
                                  >
                                    Chat <MessageSquare size={10} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Message Action Bar (Thumbs Up / Down Feedback from Screenshot) */}
                        {isAi && (
                          <div className={`flex items-center gap-2 mt-1 px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'like', msg.text)}
                              className={`p-1 rounded transition cursor-pointer ${
                                feedback === 'like'
                                  ? 'text-indigo-400'
                                  : isDark
                                  ? 'hover:text-white'
                                  : 'hover:text-slate-900'
                              }`}
                              title="Helpful response"
                            >
                              <ThumbsUp size={13} className={feedback === 'like' ? 'fill-indigo-400' : ''} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'dislike', msg.text)}
                              className={`p-1 rounded transition cursor-pointer ${
                                feedback === 'dislike'
                                  ? 'text-rose-400'
                                  : isDark
                                  ? 'hover:text-white'
                                  : 'hover:text-slate-900'
                              }`}
                              title="Not helpful"
                            >
                              <ThumbsDown size={13} className={feedback === 'dislike' ? 'fill-rose-400' : ''} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className={`p-1 rounded transition cursor-pointer ${
                                isDark ? 'hover:text-white' : 'hover:text-slate-900'
                              }`}
                              title="Copy response"
                            >
                              {copiedId === msg.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                            </button>

                            <span className={`text-[10px] ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{msg.timestamp}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white flex items-center justify-center shrink-0">
                      <Bot size={15} />
                    </div>
                    <div
                      className={`px-4 py-3 rounded-2xl border flex items-center gap-2 text-xs ${
                        isDark ? 'bg-slate-900 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <Loader2 size={15} className="animate-spin text-indigo-400" />
                      <span>StudyMate AI is typing...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* QUICK PROMPT SUGGESTION CHIPS */}
              <div
                className={`px-3 py-2 border-t shrink-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar ${
                  isDark ? 'bg-slate-900/60 border-white/10' : 'bg-slate-100/60 border-slate-200'
                }`}
              >
                {QUICK_PROMPTS.map((promptText, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(promptText)}
                    disabled={loading}
                    className={`whitespace-nowrap px-2.5 py-1 rounded-xl text-[11px] font-medium border transition cursor-pointer shrink-0 ${
                      isDark
                        ? 'bg-slate-950/80 border-white/10 text-slate-300 hover:text-white hover:border-indigo-500/50 hover:bg-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300'
                    }`}
                  >
                    {promptText}
                  </button>
                ))}
              </div>

              {/* INPUT BAR */}
              <div
                className={`p-3 border-t shrink-0 ${
                  isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white border-slate-200'
                }`}
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border transition ${
                      isDark
                        ? 'bg-slate-950 border-white/10 focus-within:border-indigo-500/50'
                        : 'bg-slate-50 border-slate-200 focus-within:border-indigo-500'
                    }`}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Ask StudyMate AI anything..."
                      disabled={loading}
                      className={`w-full bg-transparent text-xs sm:text-sm outline-none placeholder-slate-400 ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || loading}
                    className="w-10 h-10 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-40 text-white flex items-center justify-center transition shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0"
                    title="Send Prompt"
                  >
                    <Send size={16} className="ml-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleResetChat}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition shrink-0 cursor-pointer ${
                      isDark
                        ? 'bg-slate-950 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                    title="Restart Conversation"
                  >
                    <RotateCcw size={16} />
                  </button>
                </form>

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 px-1">
                  <span>⚡ 100% Free • Powered by StudyMate AI</span>
                  <span>MCA & Academic Study Partner</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default StudyMateAIBot;
