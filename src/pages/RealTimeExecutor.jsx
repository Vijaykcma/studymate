import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Share2,
  Download,
  Terminal,
  Code2,
  Cpu,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Eye,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { executorAPI, groupsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CODE_PRESETS = {
  javascript: {
    name: 'JavaScript (Node.js)',
    extension: 'js',
    defaultCode: `// StudyMate Real-Time JavaScript Executor
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    console.log(\`Searching: left=\${left}, right=\${right}, mid=\${mid} (val=\${arr[mid]})\`);

    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

const numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
const target = 23;

console.log("Array:", JSON.stringify(numbers));
console.log("Target:", target);

const index = binarySearch(numbers, target);
console.log(\`Result: Target found at index \${index}\`);
`,
  },
  python: {
    name: 'Python 3',
    extension: 'py',
    defaultCode: `# StudyMate Real-Time Python Executor
# QuickSort Algorithm implementation

def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

sample_data = [64, 34, 25, 12, 22, 11, 90]
print("Original Array:", sample_data)

sorted_data = quicksort(sample_data)
print("Sorted Array:", sorted_data)
print("Min element:", sorted_data[0])
print("Max element:", sorted_data[-1])
`,
  },
  cpp: {
    name: 'C++ (STL)',
    extension: 'cpp',
    defaultCode: `// StudyMate Real-Time C++ Executor
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> grades = {88, 95, 72, 64, 100, 83};
    cout << "Original grades count: " << grades.size() << endl;

    sort(grades.begin(), grades.end(), greater<int>());
    cout << "Top 3 highest scores:" << endl;
    for (int i = 0; i < 3 && i < grades.size(); ++i) {
        cout << "#" << (i + 1) << ": " << grades[i] << endl;
    }
    return 0;
}
`,
  },
  c: {
    name: 'C (Standard C99)',
    extension: 'c',
    defaultCode: `// StudyMate Real-Time C Executor
#include <stdio.h>

int main() {
    int matrix[2][2] = {{1, 2}, {3, 4}};
    int det = (matrix[0][0] * matrix[1][1]) - (matrix[0][1] * matrix[1][0]);
    
    printf("Matrix 2x2 Determinant Calculation\\n");
    printf("[ %d  %d ]\\n", matrix[0][0], matrix[0][1]);
    printf("[ %d  %d ]\\n", matrix[1][0], matrix[1][1]);
    printf("Determinant = %d\\n", det);
    return 0;
}
`,
  },
  java: {
    name: 'Java (OpenJDK)',
    extension: 'java',
    defaultCode: `// StudyMate Real-Time Java Executor
public class Main {
    public static void main(String[] args) {
        System.out.println("MCA Lab: Object-Oriented DSA Simulation");
        int[] data = {15, 23, 7, 42, 18};
        int sum = 0;
        for (int n : data) sum += n;
        
        System.out.println("Elements count: " + data.length);
        System.out.println("Total Sum: " + sum);
        System.out.println("Average: " + ((double)sum / data.length));
    }
}
`,
  },
  html: {
    name: 'HTML / CSS / JS Sandbox',
    extension: 'html',
    defaultCode: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; background: #0f172a; color: white; padding: 24px; text-align: center; }
    .card { background: #1e293b; border-radius: 16px; padding: 24px; max-width: 320px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
    button { background: #6366f1; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; }
    button:hover { background: #4f46e5; }
    #count { font-size: 32px; font-weight: bold; color: #38bdf8; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Interactive Study Widget</h2>
    <div id="count">0</div>
    <button onclick="increment()">Click Me</button>
  </div>
  <script>
    let n = 0;
    function increment() {
      n++;
      document.getElementById('count').innerText = n;
    }
  </script>
</body>
</html>
`,
  },
};

const MCA_ALGO_TEMPLATES = [
  {
    name: 'Binary Search (O(log n))',
    lang: 'javascript',
    code: `function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

const arr = [10, 20, 30, 40, 50, 60, 70];
console.log("Array:", arr);
console.log("Index of 40:", binarySearch(arr, 40));
`,
  },
  {
    name: 'Breadth-First Search (BFS Graph)',
    lang: 'javascript',
    code: `// BFS Graph Traversal
function bfs(graph, start) {
  const visited = new Set();
  const queue = [start];
  const order = [];

  visited.add(start);

  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node);

    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return order;
}

const graph = {
  A: ['B', 'C'],
  B: ['D', 'E'],
  C: ['F'],
  D: [],
  E: ['F'],
  F: []
};

console.log("Graph BFS Order from 'A':", bfs(graph, 'A').join(' -> '));
`,
  },
  {
    name: '0/1 Knapsack (Dynamic Programming)',
    lang: 'javascript',
    code: `// 0/1 Knapsack DP
function knapsack(weights, values, capacity) {
  const n = weights.length;
  const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 1; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(values[i - 1] + dp[i - 1][w - weights[i - 1]], dp[i - 1][w]);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  return dp[n][capacity];
}

const weights = [2, 3, 4, 5];
const values = [3, 4, 5, 6];
const capacity = 5;

console.log("Max Knapsack Value:", knapsack(weights, values, capacity));
`,
  },
];

function RealTimeExecutor() {
  const { user } = useAuth();
  const [selectedLang, setSelectedLang] = useState('javascript');
  const [code, setCode] = useState(CODE_PRESETS.javascript.defaultCode);
  const [inputStdin, setInputStdin] = useState('');
  const [output, setOutput] = useState('');
  const [executionTime, setExecutionTime] = useState(null);
  const [status, setStatus] = useState('ready'); // ready, running, success, error
  const [activeTab, setActiveTab] = useState('output'); // output, stdin, preview
  const [copied, setCopied] = useState(false);

  // Sharing to Group Modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [shareTitle, setShareTitle] = useState('Code Solution');
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');
  const [shareError, setShareError] = useState('');

  const iframeRef = useRef(null);
  const textareaRef = useRef(null);

  // Switch default code when changing language
  const handleLanguageChange = (newLang) => {
    setSelectedLang(newLang);
    setCode(CODE_PRESETS[newLang]?.defaultCode || '');
    setOutput('');
    setExecutionTime(null);
    setStatus('ready');
    if (newLang === 'html') {
      setActiveTab('preview');
    } else {
      setActiveTab('output');
    }
  };

  // Run Code logic
  const handleRunCode = async () => {
    setStatus('running');
    setOutput('Compiling and executing code in real-time...');

    // If HTML/CSS/JS Sandbox: update iframe preview directly
    if (selectedLang === 'html') {
      setActiveTab('preview');
      setStatus('success');
      setExecutionTime(1);
      setOutput('Live HTML/CSS Web View updated successfully.');
      return;
    }

    try {
      const res = await executorAPI.run({
        language: selectedLang,
        code,
        input: inputStdin,
      });

      if (res.success) {
        setOutput(res.output);
        setExecutionTime(res.executionTimeMs);
        setStatus('success');
      } else {
        setOutput(res.output || 'Execution failed.');
        setStatus('error');
      }
    } catch (err) {
      setOutput(err.userMessage || err.message || 'Execution failed with an unexpected error.');
      setStatus('error');
    }
  };

  // Handle Tab key in code textarea for proper code indenting
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunCode();
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = CODE_PRESETS[selectedLang]?.extension || 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studymate_code_${Date.now()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Open share modal & load user's groups
  const handleOpenShare = async () => {
    setShareModalOpen(true);
    setShareSuccess('');
    setShareError('');
    try {
      const res = await groupsAPI.getMyGroups();
      if (res.success) {
        const all = [...(res.created || []), ...(res.joined || [])];
        const unique = Array.from(new Map(all.map((g) => [g._id, g])).values());
        setUserGroups(unique);
        if (unique.length > 0) {
          setSelectedGroupId(unique[0]._id);
        }
      }
    } catch (err) {
      setShareError('Failed to load study groups.');
    }
  };

  const handleConfirmShare = async (e) => {
    e.preventDefault();
    if (!selectedGroupId) {
      setShareError('Please select a study group.');
      return;
    }

    try {
      setSharing(true);
      setShareError('');
      await executorAPI.share({
        groupId: selectedGroupId,
        language: selectedLang,
        code,
        output,
        title: shareTitle || 'Real-Time Code Execution',
      });
      setShareSuccess('Code and execution results posted to study group discussion room!');
      setTimeout(() => {
        setShareModalOpen(false);
      }, 1600);
    } catch (err) {
      setShareError(err.userMessage || 'Failed to share code snippet.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Terminal size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Real-Time Code Executor</h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Interactive multi-language compiler & collaborative lab workspace for MCA students
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Algorithm Templates Dropdown */}
            <select
              onChange={(e) => {
                const template = MCA_ALGO_TEMPLATES[parseInt(e.target.value, 10)];
                if (template) {
                  setSelectedLang(template.lang);
                  setCode(template.code);
                  setOutput('');
                  setExecutionTime(null);
                  setStatus('ready');
                }
              }}
              defaultValue=""
              className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="" disabled>
                MCA Algorithm Presets...
              </option>
              {MCA_ALGO_TEMPLATES.map((tmpl, idx) => (
                <option key={idx} value={idx}>
                  {tmpl.name}
                </option>
              ))}
            </select>

            {/* Language Selector */}
            <select
              value={selectedLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="rounded-xl border border-indigo-500/40 bg-indigo-950/40 px-3.5 py-2 text-xs font-semibold text-indigo-200 outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="python">Python 3</option>
              <option value="cpp">C++ (STL)</option>
              <option value="c">C (C99)</option>
              <option value="java">Java (OpenJDK)</option>
              <option value="html">HTML / CSS / JS Sandbox</option>
            </select>

            {/* Run Button */}
            <button
              onClick={handleRunCode}
              disabled={status === 'running'}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
              title="Shortcut: Ctrl + Enter"
            >
              {status === 'running' ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play size={15} className="fill-white" />
                  Run Code
                </>
              )}
            </button>
          </div>
        </div>

        {/* Workbench Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 flex-1">
          {/* Left Column: Code Editor */}
          <div className="lg:col-span-7 flex flex-col rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur overflow-hidden shadow-xl">
            {/* Editor Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-mono">
                <Code2 size={16} className="text-indigo-400" />
                <span>
                  main.{CODE_PRESETS[selectedLang]?.extension || 'js'} ({CODE_PRESETS[selectedLang]?.name})
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 hover:text-white rounded-lg hover:bg-white/5 transition"
                  title="Copy Code"
                >
                  {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1.5 hover:text-white rounded-lg hover:bg-white/5 transition"
                  title="Download File"
                >
                  <Download size={15} />
                </button>
                <button
                  onClick={() => handleLanguageChange(selectedLang)}
                  className="p-1.5 hover:text-white rounded-lg hover:bg-white/5 transition"
                  title="Reset Code Template"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  onClick={handleOpenShare}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white font-medium transition ml-1"
                >
                  <Share2 size={13} />
                  <span>Share to Group</span>
                </button>
              </div>
            </div>

            {/* Code Input Area with Line Numbers */}
            <div className="relative flex-1 flex overflow-hidden min-h-[420px] bg-slate-950 font-mono text-sm leading-6">
              {/* Line Numbers column */}
              <div className="w-12 py-4 bg-slate-900/40 text-right pr-3 text-slate-600 select-none text-xs border-r border-white/5">
                {code.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                placeholder="Write or paste your code here..."
                className="flex-1 p-4 bg-transparent text-slate-200 outline-none resize-none font-mono text-xs sm:text-sm leading-6 selection:bg-indigo-600/40 overflow-y-auto"
              />
            </div>

            {/* Editor Footer Help */}
            <div className="px-4 py-2 bg-slate-950/80 border-t border-white/5 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-slate-300">Ctrl + Enter</kbd> to execute instantly</span>
              <span>Lines: {code.split('\n').length} • Characters: {code.length}</span>
            </div>
          </div>

          {/* Right Column: Terminal Output / Interactive Preview */}
          <div className="lg:col-span-5 flex flex-col rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur overflow-hidden shadow-xl">
            {/* Terminal Tabs Bar */}
            <div className="flex items-center justify-between px-3 bg-slate-900 border-b border-white/10 text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('output')}
                  className={`px-3 py-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'output'
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal size={14} />
                  <span>Output Terminal</span>
                </button>

                <button
                  onClick={() => setActiveTab('stdin')}
                  className={`px-3 py-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'stdin'
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu size={14} />
                  <span>Stdin Input {inputStdin.trim() && '(Active)'}</span>
                </button>

                {selectedLang === 'html' && (
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
                      activeTab === 'preview'
                        ? 'border-indigo-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye size={14} />
                    <span>Live Web Canvas</span>
                  </button>
                )}
              </div>

              {executionTime !== null && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock size={12} className="text-cyan-400" />
                  <span>{executionTime}ms</span>
                </div>
              )}
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-4 bg-slate-950 flex flex-col min-h-[420px] overflow-hidden">
              {activeTab === 'output' && (
                <div className="flex-1 flex flex-col font-mono text-xs overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          status === 'running'
                            ? 'bg-amber-400 animate-ping'
                            : status === 'success'
                            ? 'bg-emerald-400'
                            : status === 'error'
                            ? 'bg-rose-400'
                            : 'bg-slate-600'
                        }`}
                      />
                      Status: {status.toUpperCase()}
                    </span>
                    <button
                      onClick={() => setOutput('')}
                      className="text-slate-500 hover:text-slate-300 transition"
                    >
                      Clear
                    </button>
                  </div>

                  <pre className="flex-1 whitespace-pre-wrap break-all text-slate-300 leading-relaxed font-mono selection:bg-indigo-600/40">
                    {output || (
                      <span className="text-slate-600 italic">
                        Click "Run Code" above or press Ctrl + Enter to execute. Output and execution metrics will stream here in real-time.
                      </span>
                    )}
                  </pre>
                </div>
              )}

              {activeTab === 'stdin' && (
                <div className="flex-1 flex flex-col">
                  <p className="text-xs text-slate-400 mb-2">
                    Enter standard input values (test cases) passed to the program during execution:
                  </p>
                  <textarea
                    value={inputStdin}
                    onChange={(e) => setInputStdin(e.target.value)}
                    placeholder="Enter input data (e.g., numbers, strings, or lines of input)..."
                    className="flex-1 w-full rounded-xl border border-white/10 bg-slate-900 p-3.5 font-mono text-xs text-slate-200 outline-none focus:border-indigo-500 transition resize-none"
                  />
                </div>
              )}

              {activeTab === 'preview' && selectedLang === 'html' && (
                <div className="flex-1 flex flex-col bg-white rounded-xl overflow-hidden">
                  <iframe
                    ref={iframeRef}
                    title="Live Preview"
                    srcDoc={code}
                    sandbox="allow-scripts allow-modals"
                    className="w-full h-full border-none"
                  />
                </div>
              )}
            </div>

            {/* Bottom Status bar */}
            <div className="px-4 py-2.5 bg-slate-900 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span className="truncate">
                Logged in as: <strong className="text-slate-200">{user?.name}</strong> ({user?.department || 'MCA'})
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-400 shrink-0">
                <CheckCircle2 size={13} />
                <span>Execution Ready</span>
              </span>
            </div>
          </div>
        </div>

        {/* Share to Study Group Modal */}
        {shareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <Share2 size={18} className="text-indigo-400" />
                  <h3 className="font-bold text-base">Share Code to Study Group</h3>
                </div>
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {shareError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{shareError}</span>
                </div>
              )}

              {shareSuccess && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>{shareSuccess}</span>
                </div>
              )}

              <form onSubmit={handleConfirmShare} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1.5">
                    Snippet Title
                  </label>
                  <input
                    type="text"
                    value={shareTitle}
                    onChange={(e) => setShareTitle(e.target.value)}
                    placeholder="e.g. Binary Search Solution"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1.5">
                    Select Study Group
                  </label>
                  {userGroups.length === 0 ? (
                    <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                      You are not a member of any study groups yet. Join or create a study group first to share code snippets.
                    </p>
                  ) : (
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    >
                      {userGroups.map((group) => (
                        <option key={group._id} value={group._id}>
                          {group.name} ({group.subject})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShareModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sharing || userGroups.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {sharing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Share Snippet
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default RealTimeExecutor;
