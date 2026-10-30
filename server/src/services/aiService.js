import { StudyGroup } from '../models/StudyGroup.js';
import { User } from '../models/User.js';
import { StudySession } from '../models/StudySession.js';
import { StudyMaterial } from '../models/StudyMaterial.js';

/**
 * StudyMate AI Assistant Service
 * 100% Free Architecture:
 * - Tier 1: Built-in Intelligent Database & Heuristic Engine ($0, no API key needed, zero third-party fees)
 * - Tier 2: Free-tier Google Gemini API integration if GEMINI_API_KEY is present in env (optional enhancement)
 */

export const processAIChat = async ({ prompt, user, conversationHistory = [] }) => {
  const cleanPrompt = (prompt || '').trim();
  const lowerPrompt = cleanPrompt.toLowerCase();

  // Student Context
  const studentDept = user?.department || 'MCA';
  const studentSem = user?.semester || '2nd Semester';
  const studentName = user?.name || 'Classmate';

  // 1. Gather relevant database context based on prompt intent
  let foundGroups = [];
  let foundPeers = [];
  let foundSessions = [];
  let foundMaterials = [];

  // Match Groups Intent
  if (
    lowerPrompt.includes('group') ||
    lowerPrompt.includes('find') ||
    lowerPrompt.includes('join') ||
    lowerPrompt.includes('mca') ||
    lowerPrompt.includes('study') ||
    lowerPrompt.includes('subject')
  ) {
    try {
      // Find active groups matching department, semester or subject
      const subjectKeywords = cleanPrompt.split(/\s+/).filter((w) => w.length > 3);
      const query = {
        status: 'active',
        $or: [
          { department: new RegExp(studentDept, 'i') },
          { semester: new RegExp(studentSem, 'i') },
          ...subjectKeywords.map((k) => ({ subject: new RegExp(k, 'i') })),
          ...subjectKeywords.map((k) => ({ name: new RegExp(k, 'i') })),
        ],
      };
      foundGroups = await StudyGroup.find(query)
        .populate('creator', 'name department semester')
        .limit(5)
        .lean();

      // If specific query returned 0, fetch top active groups
      if (!foundGroups.length) {
        foundGroups = await StudyGroup.find({ status: 'active' })
          .populate('creator', 'name department semester')
          .limit(4)
          .lean();
      }
    } catch (err) {
      console.warn('[StudyMate AI] Groups search fallback:', err.message);
    }
  }

  // Match Peers Intent
  if (
    lowerPrompt.includes('peer') ||
    lowerPrompt.includes('partner') ||
    lowerPrompt.includes('classmate') ||
    lowerPrompt.includes('who') ||
    lowerPrompt.includes('student') ||
    lowerPrompt.includes('friend')
  ) {
    try {
      foundPeers = await User.find({
        _id: { $ne: user?._id },
        status: 'active',
        department: new RegExp(studentDept, 'i'),
      })
        .select('name department semester bio avatar isEmailVerified')
        .limit(4)
        .lean();
    } catch (err) {
      console.warn('[StudyMate AI] Peers search fallback:', err.message);
    }
  }

  // Match Sessions Intent
  if (
    lowerPrompt.includes('session') ||
    lowerPrompt.includes('meeting') ||
    lowerPrompt.includes('schedule') ||
    lowerPrompt.includes('when') ||
    lowerPrompt.includes('time') ||
    lowerPrompt.includes('calendar')
  ) {
    try {
      foundSessions = await StudySession.find()
        .populate('group', 'name subject department')
        .populate('organizer', 'name')
        .limit(4)
        .sort({ date: 1 })
        .lean();
    } catch (err) {
      console.warn('[StudyMate AI] Sessions search fallback:', err.message);
    }
  }

  // Match Materials Intent
  if (
    lowerPrompt.includes('note') ||
    lowerPrompt.includes('material') ||
    lowerPrompt.includes('pdf') ||
    lowerPrompt.includes('book') ||
    lowerPrompt.includes('doc')
  ) {
    try {
      foundMaterials = await StudyMaterial.find()
        .populate('group', 'name subject')
        .populate('uploader', 'name')
        .limit(4)
        .lean();
    } catch (err) {
      console.warn('[StudyMate AI] Materials search fallback:', err.message);
    }
  }

  // 2. Check if a free Google Gemini API key is configured
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const geminiResponse = await callGeminiFreeTier({
        prompt: cleanPrompt,
        user,
        conversationHistory,
        context: {
          groups: foundGroups,
          peers: foundPeers,
          sessions: foundSessions,
          materials: foundMaterials,
        },
        apiKey: geminiKey,
      });

      if (geminiResponse) {
        return {
          reply: geminiResponse,
          groups: foundGroups.map((g) => ({
            id: g._id,
            name: g.name,
            subject: g.subject,
            department: g.department,
            membersCount: g.members?.length || 0,
            maxMembers: g.maxMembers,
          })),
          peers: foundPeers.map((p) => ({
            id: p._id,
            name: p.name,
            department: p.department,
            semester: p.semester,
          })),
          suggestions: generateFollowupSuggestions(lowerPrompt),
          isFreeTier: true,
        };
      }
    } catch (err) {
      console.warn('[StudyMate AI] Gemini API call skipped or failed, using native zero-cost engine:', err.message);
    }
  }

  // 3. Native Zero-Cost Intelligent Engine ($0 forever, instant responses)
  const nativeResult = buildNativeAIResponse({
    prompt: cleanPrompt,
    lowerPrompt,
    studentName,
    studentDept,
    studentSem,
    foundGroups,
    foundPeers,
    foundSessions,
    foundMaterials,
  });

  return {
    ...nativeResult,
    isFreeTier: true,
  };
};

/**
 * Built-in NLP heuristic & recommendation engine (100% Free, zero external calls)
 */
const buildNativeAIResponse = ({
  prompt,
  lowerPrompt,
  studentName,
  studentDept,
  studentSem,
  foundGroups,
  foundPeers,
  foundSessions,
  foundMaterials,
}) => {
  // Greetings
  if (/^(hi|hello|hey|hola|greetings|start|good morning|good evening)/i.test(lowerPrompt)) {
    return {
      reply: `👋 Hello **${studentName}**! I'm **StudyMate AI**, your personal study coordinator and academic assistant.\n\nI can help you:\n* 🔍 **Find study groups** tailored to **${studentDept} (${studentSem})**.\n* 👥 **Connect with classmates** and study partners.\n* 📅 **Track study sessions** and live rooms.\n* 📚 **Discover study notes & PDFs** shared by peers.\n* 💻 **Explain code, DSA problems, and MCA subjects**.\n\nHow can I help you today?`,
      suggestions: [
        'Find study groups for my semester',
        'Recommend study partners',
        'Show upcoming study sessions',
        'Help me with DSA concepts',
      ],
      groups: foundGroups.slice(0, 3).map(formatGroupCard),
      peers: [],
    };
  }

  // Find Groups
  if (lowerPrompt.includes('group') || lowerPrompt.includes('join') || lowerPrompt.includes('find group')) {
    if (foundGroups.length > 0) {
      const groupList = foundGroups
        .map(
          (g, idx) =>
            `${idx + 1}. **${g.name}**\n   * Subject: \`${g.subject}\`\n   * Department: ${g.department || studentDept} • ${g.semester || studentSem}\n   * Members: ${g.members?.length || 0}/${g.maxMembers || 10}`
        )
        .join('\n\n');

      return {
        reply: `Here are the best matching **Study Groups** for your requirements:\n\n${groupList}\n\nYou can click on any group card below to view details and send a join request immediately!`,
        groups: foundGroups.map(formatGroupCard),
        suggestions: [
          'How do I create a new group?',
          'Find classmates in my department',
          'Show study sessions for these groups',
        ],
      };
    } else {
      return {
        reply: `I couldn't find an existing active group matching that exact query right now. Would you like to **create your own study group**? You can set the subject, maximum capacity, and invite classmates directly from the platform!`,
        suggestions: ['How do I create a study group?', 'Recommend classmates to study with'],
      };
    }
  }

  // Find Peers / Study Partners
  if (lowerPrompt.includes('partner') || lowerPrompt.includes('classmate') || lowerPrompt.includes('peer') || lowerPrompt.includes('who is online')) {
    if (foundPeers.length > 0) {
      const peerList = foundPeers
        .map((p, idx) => `${idx + 1}. **${p.name}** (${p.department} - ${p.semester})`)
        .join('\n');

      return {
        reply: `Here are some classmates in **${studentDept}** you can collaborate with:\n\n${peerList}\n\nYou can start a personal chat, share DSA solutions, or initiate voice/video study rooms with them in the **Messages / Discussions** tab.`,
        peers: foundPeers.map((p) => ({
          id: p._id,
          name: p.name,
          department: p.department,
          semester: p.semester,
        })),
        suggestions: [
          'Find groups they are in',
          'How do I start a video call?',
          'Show study notes',
        ],
      };
    }
  }

  // Study Sessions
  if (lowerPrompt.includes('session') || lowerPrompt.includes('meeting') || lowerPrompt.includes('schedule') || lowerPrompt.includes('calendar')) {
    if (foundSessions.length > 0) {
      const sessionList = foundSessions
        .map(
          (s, idx) =>
            `${idx + 1}. **${s.title}**\n   * Date & Time: \`${s.date} at ${s.startTime} - ${s.endTime}\`\n   * Location: ${s.location}\n   * Group: ${s.group?.name || 'General'}`
        )
        .join('\n\n');

      return {
        reply: `Here are the upcoming **Study Sessions** on StudyMate:\n\n${sessionList}\n\nYou can join scheduled meetings, synchronize your calendar, and collaborate in real-time.`,
        suggestions: ['How to schedule a study session?', 'Find study groups'],
      };
    } else {
      return {
        reply: `There are no upcoming scheduled study sessions at this exact moment. You can schedule one easily inside any of your active Study Groups under the **Sessions** tab!`,
        suggestions: ['View my study groups', 'Schedule a new study session'],
      };
    }
  }

  // Study Materials / Notes
  if (lowerPrompt.includes('material') || lowerPrompt.includes('note') || lowerPrompt.includes('pdf') || lowerPrompt.includes('book')) {
    if (foundMaterials.length > 0) {
      const matList = foundMaterials
        .map(
          (m, idx) =>
            `${idx + 1}. 📄 **${m.title}** (${m.fileType || 'PDF'})\n   * Group: ${m.group?.name || 'General'}\n   * Shared by: ${m.uploader?.name || 'Student'}`
        )
        .join('\n\n');

      return {
        reply: `Here are the latest **Study Materials & Documents** uploaded by classmates:\n\n${matList}\n\nHead to the **Materials** section on the platform to download or preview them.`,
        suggestions: ['Find MCA study groups', 'Upload a new study note'],
      };
    } else {
      return {
        reply: `You can share and access study notes, exam cheat-sheets, and lecture PDFs under the **Materials** tab of any study group!`,
        suggestions: ['Find study groups', 'How to upload materials'],
      };
    }
  }

  // DSA / Programming Help
  if (
    lowerPrompt.includes('dsa') ||
    lowerPrompt.includes('algorithm') ||
    lowerPrompt.includes('binary search') ||
    lowerPrompt.includes('array') ||
    lowerPrompt.includes('graph') ||
    lowerPrompt.includes('tree') ||
    lowerPrompt.includes('dynamic programming') ||
    lowerPrompt.includes('recursion') ||
    lowerPrompt.includes('sql') ||
    lowerPrompt.includes('java') ||
    lowerPrompt.includes('react')
  ) {
    return {
      reply: `💡 **StudyMate DSA & Academic Guide**\n\nHere are core problem-solving strategies for **Data Structures & Algorithms**:\n\n1. **Time & Space Complexity**: Always optimize from Brute Force ($O(N^2)$) down to Linear ($O(N)$) or Logarithmic ($O(\\log N)$) using Two Pointers, Sliding Window, or HashMaps.\n2. **Practice DSA with Peers**: You can share code snippets directly in your **Group Chats** or use the **Online Code Runner** on StudyMate.\n3. **Study Together**: Form a dedicated DSA study group to solve LeetCode / HackerRank problems together with live voice & video rooms!\n\nWould you like recommendations for MCA 2nd semester DSA groups or study partners?`,
      suggestions: ['Find DSA study groups', 'Recommend study partners for coding', 'How to test code on StudyMate'],
      groups: foundGroups.slice(0, 2).map(formatGroupCard),
    };
  }

  // Platform Instructions / How to Call / How to Use
  if (lowerPrompt.includes('how to') || lowerPrompt.includes('call') || lowerPrompt.includes('feature') || lowerPrompt.includes('video')) {
    return {
      reply: `🚀 **StudyMate Feature Guide**:\n\n* **1-on-1 Audio & Video Calling**: Open **Discussions (Messages)**, click on any classmate, and click the **Phone** or **Video** icon in the header. The call will open directly in the chat frame!\n* **24-Hour Stories**: Share daily study targets or exam questions with the camera button in Discussions.\n* **Study Polls**: Create multiple-choice polls in group chats to vote on study times or topics.\n* **Code Sharing**: Share formatted, syntax-highlighted code snippets in chat conversations.\n\nWhat would you like to explore next?`,
      suggestions: ['Open Discussions', 'Find study groups', 'Upcoming sessions'],
    };
  }

  // Default Fallback
  return {
    reply: `I'm here to help you make the most of **StudyMate**! \n\nI can look up study groups for **${studentDept}**, find peers for your semester, check scheduled sessions, or help answer academic questions.\n\nTry asking me:\n* *"Find study groups for my semester"*\n* *"Recommend study partners in MCA"*\n* *"Show upcoming study sessions"*\n* *"How do I start a video study call?"*`,
    suggestions: [
      'Find study groups for my semester',
      'Recommend study partners',
      'Show upcoming study sessions',
      'How to start a video call',
    ],
    groups: foundGroups.slice(0, 3).map(formatGroupCard),
  };
};

const formatGroupCard = (g) => ({
  id: g._id,
  name: g.name,
  subject: g.subject,
  department: g.department,
  membersCount: g.members?.length || 0,
  maxMembers: g.maxMembers || 10,
  meetingDays: g.meetingDays || [],
  meetingTime: g.meetingTime || '',
});

const generateFollowupSuggestions = (lower) => {
  if (lower.includes('group')) {
    return ['Show study sessions', 'Recommend classmates', 'How to create a group'];
  }
  if (lower.includes('code') || lower.includes('dsa')) {
    return ['Find DSA study groups', 'Recommend coding partners', 'Time complexity tips'];
  }
  return [
    'Find study groups for my semester',
    'Recommend study partners',
    'Show upcoming study sessions',
  ];
};

/**
 * Free-Tier Google Gemini API Call (Optional enhancement when GEMINI_API_KEY is configured)
 */
const callGeminiFreeTier = async ({ prompt, user, conversationHistory, context, apiKey }) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const systemInstruction = `You are StudyMate AI, an intelligent, encouraging academic coordinator and peer study assistant for the platform "StudyMate".
The current logged-in user is: ${user?.name || 'Student'}, Department: ${user?.department || 'MCA'}, Semester: ${user?.semester || '2nd Semester'}.
Context from database:
- Matching Groups: ${JSON.stringify(context.groups.map((g) => ({ name: g.name, subject: g.subject })))}
- Classmates Available: ${JSON.stringify(context.peers.map((p) => ({ name: p.name, department: p.department })))}
- Upcoming Sessions: ${JSON.stringify(context.sessions.map((s) => ({ title: s.title, date: s.date })))}
Always be supportive, concise, use clean markdown with bullet points and bolding, and guide the student to study groups, classmates, and study tools on the website.`;

  const contents = [
    {
      role: 'user',
      parts: [{ text: `${systemInstruction}\n\nStudent question: ${prompt}` }],
    },
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
};
