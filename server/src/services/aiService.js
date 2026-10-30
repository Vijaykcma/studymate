import { StudyGroup } from '../models/StudyGroup.js';
import { User } from '../models/User.js';
import { StudySession } from '../models/StudySession.js';
import { StudyMaterial } from '../models/StudyMaterial.js';

/**
 * StudyMate AI - The Perfect College Study Buddy & AI Friend
 * 100% Free Architecture:
 * - Natural, warm, supportive friend talker
 * - Smart intent recognition with direct platform action execution (navigation, group joining, calling)
 * - Academic coaching for MCA & engineering subjects (DSA, SQL, Web Dev, OS)
 * - Free-tier Google Gemini API integration when GEMINI_API_KEY is present in env
 */

const FUN_JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs! 🐛😂",
  "Why was the JavaScript developer sad? Because he didn't know how to 'null' his feelings! 😭",
  "There are 10 types of people in the world: those who understand binary, and those who don't! 🤓",
  "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?' 🍻",
  "Why do Java programmers wear glasses? Because they don't C#! 👓",
  "An optimist says the glass is half full. A pessimist says the glass is half empty. A programmer says the glass is twice as large as it needs to be! 🥤",
];

const MOTIVATION_QUOTES = [
  "“Small daily improvements over time lead to stunning results.” You’ve got this! One problem, one concept at a time. 🚀",
  "“The expert in anything was once a beginner.” Don’t stress about tricky topics today — your future self will thank you for showing up! 🌟",
  "“Code is like humor. When you have to explain it, it’s bad.” Keep practicing, keep building! You're making progress every single day. 💪",
  "“It always seems impossible until it’s done.” Take a deep breath, grab a coffee or water, and let's tackle this step by step. ✨",
];

export const processAIChat = async ({ prompt, user, conversationHistory = [], customApiKey }) => {
  const cleanPrompt = (prompt || '').trim();
  const lowerPrompt = cleanPrompt.toLowerCase();

  // Student Context
  const studentDept = user?.department || 'MCA';
  const studentSem = user?.semester || '1st Semester';
  const studentFullName = user?.name || 'Classmate';
  const studentFirstName = studentFullName.split(' ')[0] || studentFullName;

  // 1. DIRECT ACTION INTENT MATCHING (e.g. "open messages", "create group", "go to dashboard")
  const directAction = matchDirectPlatformAction(lowerPrompt);
  if (directAction) {
    return {
      reply: directAction.reply.replace('{name}', studentFirstName),
      action: directAction.action,
      suggestions: directAction.suggestions,
      isFreeTier: true,
    };
  }

  // 2. GATHER DATABASE CONTEXT FOR RELEVANT INTENTS
  let foundGroups = [];
  let foundPeers = [];
  let foundSessions = [];
  let foundMaterials = [];

  // Match Groups Search Intent
  if (
    lowerPrompt.includes('group') ||
    lowerPrompt.includes('find') ||
    lowerPrompt.includes('join') ||
    lowerPrompt.includes('mca') ||
    lowerPrompt.includes('study with')
  ) {
    try {
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

  // Match Peers / Classmates Intent
  if (
    lowerPrompt.includes('peer') ||
    lowerPrompt.includes('partner') ||
    lowerPrompt.includes('classmate') ||
    lowerPrompt.includes('who is online') ||
    lowerPrompt.includes('students')
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
    lowerPrompt.includes('syllabus') ||
    lowerPrompt.includes('book')
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

  // 3. CHECK FOR GEMINI FREE-TIER API KEY (Optional Enhancement)
  const geminiKey = customApiKey || process.env.GEMINI_API_KEY;
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
          groups: foundGroups.map(formatGroupCard),
          peers: foundPeers.map(formatPeerCard),
          suggestions: generateFollowupSuggestions(lowerPrompt),
          isFreeTier: true,
          poweredBy: 'Gemini',
        };
      }
    } catch (err) {
      console.warn('[StudyMate AI] Gemini API call failed, falling back to native AI friend engine:', err.message);
    }
  }

  // 4. NATIVE AI FRIEND TALKER & REASONING BRAIN ($0 FOREVER)
  const friendResult = buildAIFriendResponse({
    prompt: cleanPrompt,
    lowerPrompt,
    studentFirstName,
    studentFullName,
    studentDept,
    studentSem,
    foundGroups,
    foundPeers,
    foundSessions,
    foundMaterials,
  });

  return {
    ...friendResult,
    isFreeTier: true,
  };
};

/**
 * Match Direct Platform Action Commands
 */
const matchDirectPlatformAction = (lowerPrompt) => {
  // Open Messages / Chat
  if (
    lowerPrompt.includes('open message') ||
    lowerPrompt.includes('open chat') ||
    lowerPrompt.includes('go to message') ||
    lowerPrompt.includes('go to chat') ||
    lowerPrompt.includes('view message') ||
    lowerPrompt.includes('show message') ||
    lowerPrompt.includes('open discussion') ||
    lowerPrompt === 'messages' ||
    lowerPrompt === 'chat' ||
    lowerPrompt === 'discussions'
  ) {
    return {
      reply: `Got it, {name}! Opening your **Messages & Discussions** right now. 💬\n\nYou can chat 1-on-1 with classmates, participate in study groups, or launch direct voice/video study calls!`,
      action: {
        type: 'navigate',
        path: '/messages',
        label: '🚀 Open Messages & Discussions',
        autoTrigger: true,
      },
      suggestions: ['Start a video study room', 'Find classmates in MCA', 'What groups am I in?'],
    };
  }

  // Create Group
  if (
    lowerPrompt.includes('create group') ||
    lowerPrompt.includes('new group') ||
    lowerPrompt.includes('start group') ||
    lowerPrompt.includes('make group')
  ) {
    return {
      reply: `Awesome initiative, {name}! Starting a new study group is the best way to lead collaborative learning. Taking you to the group creation page... 👥`,
      action: {
        type: 'navigate',
        path: '/groups/create',
        label: '✨ Create New Study Group',
        autoTrigger: true,
      },
      suggestions: ['Find existing groups first', 'Recommend study partners'],
    };
  }

  // Explore / Find Groups
  if (
    lowerPrompt.includes('explore group') ||
    lowerPrompt.includes('find all group') ||
    lowerPrompt.includes('browse group') ||
    lowerPrompt.includes('all groups')
  ) {
    return {
      reply: `Let's find the perfect study crew for you! Opening the **Study Group Directory**... 🔍`,
      action: {
        type: 'navigate',
        path: '/groups',
        label: '🔍 Explore All Study Groups',
        autoTrigger: true,
      },
      suggestions: ['Show MCA groups', 'Recommend study partners'],
    };
  }

  // My Groups
  if (
    lowerPrompt.includes('my group') ||
    lowerPrompt.includes('joined group') ||
    lowerPrompt.includes('enrolled group')
  ) {
    return {
      reply: `Here are the groups you are currently part of! Opening **My Groups**... 📚`,
      action: {
        type: 'navigate',
        path: '/my-groups',
        label: '👥 View My Groups',
        autoTrigger: true,
      },
      suggestions: ['Create a new study group', 'Open group discussions'],
    };
  }

  // Study Sessions / Calendar
  if (
    lowerPrompt.includes('open session') ||
    lowerPrompt.includes('go to session') ||
    lowerPrompt.includes('view session') ||
    lowerPrompt.includes('calendar')
  ) {
    return {
      reply: `Taking you to your **Study Sessions & Schedule**! Never miss a group revision or project meeting. 📅`,
      action: {
        type: 'navigate',
        path: '/sessions',
        label: '📅 Open Study Sessions',
        autoTrigger: true,
      },
      suggestions: ['Schedule a session', 'Find study groups'],
    };
  }

  // Study Materials / Notes
  if (
    lowerPrompt.includes('open material') ||
    lowerPrompt.includes('go to material') ||
    lowerPrompt.includes('view note') ||
    lowerPrompt.includes('download note') ||
    lowerPrompt.includes('show pdf')
  ) {
    return {
      reply: `Opening the **Study Materials Repository** where classmates share lecture notes, cheat-sheets, and syllabus guides! 📑`,
      action: {
        type: 'navigate',
        path: '/materials',
        label: '📄 Browse Study Materials',
        autoTrigger: true,
      },
      suggestions: ['Find MCA study groups', 'Ask for DSA help'],
    };
  }

  // Code Runner / Executor
  if (
    lowerPrompt.includes('code runner') ||
    lowerPrompt.includes('executor') ||
    lowerPrompt.includes('run code') ||
    lowerPrompt.includes('compiler') ||
    lowerPrompt.includes('online ide')
  ) {
    return {
      reply: `Ready to code? Launching the **Real-Time Code Executor**! You can test JavaScript, Python, Java, C++, and share code with peers. 💻⚡`,
      action: {
        type: 'navigate',
        path: '/executor',
        label: '💻 Launch Real-Time Code Runner',
        autoTrigger: true,
      },
      suggestions: ['Explain a DSA concept', 'Practice binary search'],
    };
  }

  // Profile
  if (
    lowerPrompt.includes('open profile') ||
    lowerPrompt.includes('my profile') ||
    lowerPrompt.includes('edit profile')
  ) {
    return {
      reply: `Taking you to your **Student Profile**! You can update your bio, department, semester, and skills. 👤`,
      action: {
        type: 'navigate',
        path: '/profile',
        label: '👤 View Student Profile',
        autoTrigger: true,
      },
      suggestions: ['Change theme', 'Open settings'],
    };
  }

  // Settings
  if (
    lowerPrompt.includes('open setting') ||
    lowerPrompt.includes('go to setting') ||
    lowerPrompt.includes('preferences')
  ) {
    return {
      reply: `Opening **Account & Platform Settings**... ⚙️`,
      action: {
        type: 'navigate',
        path: '/settings',
        label: '⚙️ Open Settings',
        autoTrigger: true,
      },
      suggestions: ['Return to dashboard', 'Edit profile'],
    };
  }

  // Dashboard / Home
  if (
    lowerPrompt.includes('go to dashboard') ||
    lowerPrompt.includes('open dashboard') ||
    lowerPrompt.includes('take me home') ||
    lowerPrompt === 'home' ||
    lowerPrompt === 'dashboard'
  ) {
    return {
      reply: `Heading back to your **Main Student Workspace**! 🏠`,
      action: {
        type: 'navigate',
        path: '/dashboard',
        label: '🏠 Go to Dashboard',
        autoTrigger: true,
      },
      suggestions: ['Find study groups', 'Open messages', 'Show sessions'],
    };
  }

  return null;
};

/**
 * Natural Conversational AI Friend & Academic Brain
 */
const buildAIFriendResponse = ({
  prompt,
  lowerPrompt,
  studentFirstName,
  studentFullName,
  studentDept,
  studentSem,
  foundGroups,
  foundPeers,
  foundSessions,
  foundMaterials,
}) => {
  // GREETINGS & CASUAL HELLOS
  if (/^(hi|hello|hey|yo|sup|hola|what's up|good morning|good afternoon|good evening)\b/i.test(lowerPrompt)) {
    return {
      reply: `Hey ${studentFirstName}! Great to see you. How's your day going in ${studentDept}?\n\nWhat are you working on or studying today?`,
      suggestions: [
        'Find study groups for my semester',
        'Recommend classmates to study with',
        'Tell me a programmer joke! 😂',
        'Help me plan my study schedule',
      ],
      groups: foundGroups.slice(0, 2).map(formatGroupCard),
    };
  }

  // "HOW ARE YOU" / "HOW'S IT GOING"
  if (lowerPrompt.includes('how are you') || lowerPrompt.includes('how you doing') || lowerPrompt.includes('hows it going')) {
    return {
      reply: `I'm doing awesome, **${studentFirstName}**, especially now that we're chatting! ⚡\n\nI've been monitoring the StudyMate campus network — keeping an eye on new study groups and sessions. More importantly, how are **you** holding up with your ${studentDept} subjects and assignments today?`,
      suggestions: [
        'I have exam stress, help me focus!',
        'Find study groups in my department',
        'Tell me something funny',
      ],
    };
  }

  // FRIENDSHIP & IDENTITY QUESTIONS ("ARE WE FRIENDS", "WHO ARE YOU", "CAN YOU BE MY FRIEND")
  if (
    lowerPrompt.includes('are we friend') ||
    lowerPrompt.includes('be my friend') ||
    lowerPrompt.includes('who are you') ||
    lowerPrompt.includes('can you talk') ||
    lowerPrompt.includes('your name')
  ) {
    return {
      reply: `100%! I am **StudyMate AI**, but you can think of me as your personal college best friend and study partner. 🤝🎓\n\nUnlike an ordinary chatbot, I'm built right into your StudyMate campus dashboard. That means whenever you feel stuck on a difficult code bug, need to coordinate a revision room, want to find study partners, or just need a motivational boost during late-night study sessions, I'm always right here with you!\n\nAre you studying for an upcoming exam or working on a project right now?`,
      suggestions: [
        'I am preparing for exams',
        'Working on a coding assignment',
        'Just taking a chill study break',
      ],
    };
  }

  // HUMOR, JOKES & FUN
  if (
    lowerPrompt.includes('joke') ||
    lowerPrompt.includes('funny') ||
    lowerPrompt.includes('laugh') ||
    lowerPrompt.includes('meme')
  ) {
    const randomJoke = FUN_JOKES[Math.floor(Math.random() * FUN_JOKES.length)];
    return {
      reply: `Haha, here's one for you, **${studentFirstName}**:\n\n> ${randomJoke}\n\nNeed another one, or are you ready to conquer some study goals? 😄`,
      suggestions: ['Tell me another joke! 😂', 'Give me some motivation ✨', 'Back to studying!'],
    };
  }

  // MOTIVATION, STRESS, EXHAUSTION ("I'M TIRED", "STRESSED", "BORED", "MOTIVATE ME")
  if (
    lowerPrompt.includes('tired') ||
    lowerPrompt.includes('stress') ||
    lowerPrompt.includes('bored') ||
    lowerPrompt.includes('exhaust') ||
    lowerPrompt.includes('overwhelm') ||
    lowerPrompt.includes('motivat') ||
    lowerPrompt.includes('hard') ||
    lowerPrompt.includes('scared')
  ) {
    const quote = MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
    return {
      reply: `Hey **${studentFirstName}**, take a deep breath. College and tech studies can get intense, and it's completely normal to feel tired or overwhelmed sometimes. ❤️\n\n${quote}\n\n**Quick Friend Tip for Today**:\n1. Drink a glass of water and stretch for 3 minutes.\n2. Try the **Pomodoro technique**: Focus for just 25 minutes on one single topic, then reward yourself with a 5-minute break.\n3. Remember: You don't have to study alone! Check if any classmates are online in Discussions to study together.\n\nWhat topic is giving you a hard time? Let's break it down together!`,
      suggestions: [
        'Recommend study partners to study with',
        'Tell me a programmer joke! 😂',
        'Help me with DSA concepts',
      ],
      action: {
        type: 'navigate',
        path: '/messages',
        label: '💬 Chat with Classmates in Discussions',
      },
    };
  }

  // STUDY TIMETABLE & PLANNING ADVICE
  if (
    lowerPrompt.includes('schedule') ||
    lowerPrompt.includes('plan') ||
    lowerPrompt.includes('timetable') ||
    lowerPrompt.includes('how to study') ||
    lowerPrompt.includes('tips')
  ) {
    return {
      reply: `📅 **Personalized Study Strategy for ${studentFirstName} (${studentDept} - ${studentSem})**:\n\n1. **Morning (High Focus - 1 Hour)**: Dedicate early hours to core problem-solving (Data Structures, Algorithms, or Math/Logic).\n2. **Afternoon (Application - 1.5 Hours)**: Work on hands-on code (Web Dev, Database queries, or Lab assignments).\n3. **Evening (Peer Collaboration - 45 Mins)**: Join a Study Group session on StudyMate to discuss questions, review notes, and test each other.\n4. **Feynman Technique**: Explain a concept out loud as if teaching a beginner. If you can explain it simply, you've mastered it!\n\nWould you like me to find active study groups for your semester?`,
      suggestions: [
        'Find study groups for my semester',
        'Show upcoming study sessions',
        'Help with DSA concepts',
      ],
      action: {
        type: 'navigate',
        path: '/groups',
        label: '🔍 Find Study Groups',
      },
    };
  }

  // MCA & TECH CAREER ADVICE
  if (
    lowerPrompt.includes('mca') ||
    lowerPrompt.includes('career') ||
    lowerPrompt.includes('job') ||
    lowerPrompt.includes('internship') ||
    lowerPrompt.includes('placement')
  ) {
    return {
      reply: `💼 **MCA Career & Placement Roadmap for ${studentFirstName}**:\n\nTo stand out for software developer roles:\n1. **Strong DSA Foundation**: Master Arrays, Strings, HashMaps, Trees, and Dynamic Programming in Java, C++, or Python.\n2. **Production Projects**: Build 2-3 full-stack projects (MERN stack, Next.js, or microservices) with real user authentication and cloud deployment.\n3. **Core CS Fundamentals**: Focus on DBMS (SQL indexing & normalization), Operating Systems, and Computer Networks.\n4. **Collaborative Learning**: Form study groups with peers to do mock interviews and LeetCode problem discussions right here on StudyMate!\n\nWant to start practicing code in our real-time executor?`,
      suggestions: [
        'Launch Real-Time Code Runner',
        'Find classmates studying for placements',
        'Practice DSA problems',
      ],
      action: {
        type: 'navigate',
        path: '/executor',
        label: '💻 Launch Real-Time Code Runner',
      },
    };
  }

  // DSA & CODING HELP
  if (
    lowerPrompt.includes('dsa') ||
    lowerPrompt.includes('algorithm') ||
    lowerPrompt.includes('binary search') ||
    lowerPrompt.includes('tree') ||
    lowerPrompt.includes('graph') ||
    lowerPrompt.includes('dynamic programming') ||
    lowerPrompt.includes('linked list') ||
    lowerPrompt.includes('array') ||
    lowerPrompt.includes('recursion') ||
    lowerPrompt.includes('sql') ||
    lowerPrompt.includes('react')
  ) {
    return {
      reply: `💡 **DSA Master Plan with your Study Buddy**:\n\nWhenever solving a coding problem, follow this 4-step framework:\n\n1. **Clarify Constraints**: Check $N$ magnitude. If $N \\le 10^5$, you need an $O(N)$ or $O(N \\log N)$ solution.\n2. **Brute Force First**: Think of the naive solution, then identify repeated work (e.g., replace $O(N)$ search with a HashMap in $O(1)$).\n3. **Pattern Recognition**: \n   * Sorted Array? Think **Binary Search** or **Two Pointers**.\n   * Subarray with max/min? Think **Sliding Window**.\n   * Tree/Graph traversal? Think **BFS / DFS**.\n4. **Test in Real-Time**: You can test your code immediately using the built-in Code Runner on StudyMate!\n\nWant to jump into the code executor now?`,
      suggestions: [
        'Launch Code Runner',
        'Find DSA study groups',
        'Explain Binary Search step by step',
      ],
      action: {
        type: 'navigate',
        path: '/executor',
        label: '💻 Open Real-Time Code Runner',
      },
    };
  }

  // GROUPS QUERY FALLBACK (WITH CARDS)
  if (foundGroups.length > 0) {
    return {
      reply: `Here are the top **Study Groups** matching your department (**${studentDept}**) and semester (**${studentSem}**):\n\nYou can click **View** on any group below to check details or request to join!`,
      groups: foundGroups.map(formatGroupCard),
      suggestions: [
        'Create a new study group',
        'Find classmates in MCA',
        'Upcoming study sessions',
      ],
      action: {
        type: 'navigate',
        path: '/groups',
        label: '🔍 Explore All Groups',
      },
    };
  }

  // PEERS QUERY FALLBACK (WITH CARDS)
  if (foundPeers.length > 0) {
    return {
      reply: `Here are some registered classmates in **${studentDept}** you can connect with on StudyMate:\n\nClick **Chat** to start a 1-on-1 personal discussion or initiate a video study call!`,
      peers: foundPeers.map(formatPeerCard),
      suggestions: [
        'Open Discussions / Messages',
        'Find study groups',
        'Show upcoming sessions',
      ],
      action: {
        type: 'navigate',
        path: '/messages',
        label: '💬 Go to Messages & Discussions',
      },
    };
  }

  // SESSIONS QUERY FALLBACK
  if (foundSessions.length > 0) {
    const list = foundSessions
      .map(
        (s, idx) =>
          `${idx + 1}. **${s.title}** (${s.date} • ${s.startTime})\n   * Group: ${s.group?.name || 'General'}\n   * Location: ${s.location}`
      )
      .join('\n\n');

    return {
      reply: `Here are the upcoming **Study Sessions** on StudyMate:\n\n${list}\n\nWant to head to the Sessions calendar?`,
      suggestions: ['Open Sessions Calendar', 'Find study groups'],
      action: {
        type: 'navigate',
        path: '/sessions',
        label: '📅 Open Sessions Calendar',
      },
    };
  }

  // DEFAULT WARM FRIENDLY CONVERSATIONAL FALLBACK (NEVER DRY!)
  return {
    reply: `I'm with you, ${studentFirstName}! Whether you want to find study groups, connect with classmates, practice coding, or just need study advice, I'm here for you.\n\nTell me what you'd like to work on, or try one of the suggestions below!`,
    suggestions: [
      'Find study groups for my semester',
      'Recommend classmates to study with',
      'Show upcoming study sessions',
      'Tell me a programmer joke! 😂',
    ],
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

const formatPeerCard = (p) => ({
  id: p._id,
  name: p.name,
  department: p.department,
  semester: p.semester,
});

const generateFollowupSuggestions = (lower) => {
  if (lower.includes('group')) {
    return ['Show study sessions', 'Recommend classmates', 'Create a new group'];
  }
  if (lower.includes('code') || lower.includes('dsa')) {
    return ['Launch Code Runner', 'Recommend coding partners', 'Explain Binary Search'];
  }
  return [
    'Open Messages & Discussions',
    'Find study groups for my semester',
    'Recommend classmates & study partners',
    'Tell me a joke! 😂',
  ];
};

/**
 * Free-Tier Google Gemini API Call with Warm Friend Persona
 */
const callGeminiFreeTier = async ({ prompt, user, conversationHistory, context, apiKey }) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const studentName = user?.name || 'Classmate';
  const firstName = studentName.split(' ')[0] || studentName;

  const systemInstruction = `You are StudyMate AI, the user's enthusiastic, warm, and supportive college best friend and academic study buddy.
You are chatting with ${studentName} (preferred name: ${firstName}), studying ${user?.department || 'MCA'}, semester ${user?.semester || '1st Semester'}.
Personality guidelines:
1. Speak warmly, encouragingly, and conversationally like a helpful classmate and close friend. Use their name (${firstName}) naturally.
2. If they ask to navigate or open something (like "open messages", "groups", "code runner", "sessions"), warmly confirm and explain what they can do there.
3. Be an expert in computer science, programming (DSA, Python, Java, Web, Database), study techniques (Pomodoro, Feynman), and college life motivation.
4. Keep answers engaging, formatted with neat markdown, bullet points, and emojis.
Context from StudyMate database:
- Top Groups: ${JSON.stringify(context.groups.map((g) => ({ name: g.name, subject: g.subject })))}
- Available Classmates: ${JSON.stringify(context.peers.map((p) => ({ name: p.name, department: p.department })))}
- Upcoming Sessions: ${JSON.stringify(context.sessions.map((s) => ({ title: s.title, date: s.date })))}`;

  const contents = [
    {
      role: 'user',
      parts: [{ text: `${systemInstruction}\n\nStudent message: ${prompt}` }],
    },
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.8,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
};
