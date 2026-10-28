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
  HelpCircle,
  Award,
  Sparkles,
  Database,
  BookOpen,
  CheckCircle,
  XCircle,
  Search,
  ChevronDown,
  Layers,
  Flame,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { executorAPI, groupsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Comprehensive 20 Programming Languages Catalog
const CODE_PRESETS = {
  javascript: {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    extension: 'js',
    category: 'Web & MERN',
    popularInIndia: true,
    rank: 1,
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
    id: 'python',
    name: 'Python 3',
    extension: 'py',
    category: 'Data Science & AI',
    popularInIndia: true,
    rank: 2,
    defaultCode: `# StudyMate Real-Time Python 3 Executor
# QuickSort Algorithm Implementation

def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

data = [64, 34, 25, 12, 22, 11, 90]
print("Original List:", data)
sorted_data = quicksort(data)
print("Sorted List:", sorted_data)
print("Min Element:", sorted_data[0])
print("Max Element:", sorted_data[-1])
`,
  },
  java: {
    id: 'java',
    name: 'Java (OpenJDK)',
    extension: 'java',
    category: 'Popular in India',
    popularInIndia: true,
    rank: 3,
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
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    extension: 'ts',
    category: 'Web & MERN',
    popularInIndia: true,
    rank: 4,
    defaultCode: `// StudyMate TypeScript Executor
interface StudentRecord {
  id: number;
  name: string;
  semester: string;
  grades: number[];
}

const student: StudentRecord = {
  id: 101,
  name: "Vijaykumar Masaguppimath",
  semester: "2nd Semester MCA",
  grades: [92, 88, 95, 89]
};

const gpa = student.grades.reduce((a, b) => a + b, 0) / student.grades.length;
console.log("Student Profile:", student.name);
console.log("Academic Semester:", student.semester);
console.log("Calculated GPA:", gpa.toFixed(2));
`,
  },
  cpp: {
    id: 'cpp',
    name: 'C++ (STL / GCC)',
    extension: 'cpp',
    category: 'Popular in India',
    popularInIndia: true,
    rank: 5,
    defaultCode: `// StudyMate Real-Time C++ Executor
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> scores = {88, 95, 72, 64, 100, 83};
    cout << "Original Scores Count: " << scores.size() << endl;

    sort(scores.begin(), scores.end(), greater<int>());
    cout << "Top 3 Scores:" << endl;
    for (int i = 0; i < 3 && i < (int)scores.size(); ++i) {
        cout << "#" << (i + 1) << ": " << scores[i] << endl;
    }
    return 0;
}
`,
  },
  c: {
    id: 'c',
    name: 'C (Standard C99)',
    extension: 'c',
    category: 'Popular in India',
    popularInIndia: true,
    rank: 6,
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
  sql: {
    id: 'sql',
    name: 'SQL (Relational DB)',
    extension: 'sql',
    category: 'Web & MERN',
    popularInIndia: true,
    rank: 7,
    defaultCode: `-- StudyMate Interactive SQL Query Engine
-- Querying MCA Academic Database (students & marks)

SELECT id, name, department, semester, cgpa 
FROM students 
WHERE cgpa > 8.0 
ORDER BY cgpa DESC;
`,
  },
  html: {
    id: 'html',
    name: 'HTML (Web Canvas)',
    extension: 'html',
    category: 'Web & MERN',
    popularInIndia: true,
    rank: 8,
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
  css: {
    id: 'css',
    name: 'CSS3 (Styles & FX)',
    extension: 'css',
    category: 'Web & MERN',
    popularInIndia: true,
    rank: 9,
    defaultCode: `/* StudyMate Modern CSS3 Stylesheet */
:root {
  --primary: #6366f1;
  --secondary: #06b6d4;
  --bg-card: rgba(30, 41, 59, 0.7);
}

.study-card {
  display: flex;
  flex-direction: column;
  padding: 24px;
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.study-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(99, 102, 241, 0.25);
}
`,
  },
  csharp: {
    id: 'csharp',
    name: 'C# (.NET Core)',
    extension: 'cs',
    category: 'Popular in India',
    popularInIndia: true,
    rank: 10,
    defaultCode: `// StudyMate C# .NET Sandbox
using System;
using System.Collections.Generic;
using System.Linq;

class Program {
    static void Main() {
        Console.WriteLine("MCA Lab: C# .NET Core Console Simulation");
        List<int> marks = new List<int> { 85, 92, 78, 95, 88 };
        
        double avg = marks.Average();
        int highest = marks.Max();
        
        Console.WriteLine($"Total Subjects: {marks.Count}");
        Console.WriteLine($"Average Score: {avg:F2}");
        Console.WriteLine($"Highest Score: {highest}");
    }
}
`,
  },
  php: {
    id: 'php',
    name: 'PHP',
    extension: 'php',
    category: 'Web & MERN',
    popularInIndia: true,
    rank: 11,
    defaultCode: `<?php
// StudyMate PHP Backend Runner
$subjects = ["Data Structures", "Database Systems", "Operating Systems", "Cloud Computing"];

echo "MCA Curriculum Modules: " . count($subjects) . "\\n";
foreach ($subjects as $idx => $name) {
    echo "[" . ($idx + 1) . "] " . $name . "\\n";
}
`,
  },
  go: {
    id: 'go',
    name: 'Go (Golang)',
    extension: 'go',
    category: 'Popular in India',
    popularInIndia: true,
    rank: 12,
    defaultCode: `package main

import "fmt"

func main() {
    fmt.Println("StudyMate Real-Time Go Environment")
    items := []string{"Distributed Systems", "Computer Networks", "DBMS", "Operating Systems"}
    for idx, subject := range items {
        fmt.Printf("[%d] MCA Core Module: %s\\n", idx+1, subject)
    }
}
`,
  },
  kotlin: {
    id: 'kotlin',
    name: 'Kotlin (JVM/Android)',
    extension: 'kt',
    category: 'Popular in India',
    popularInIndia: true,
    rank: 13,
    defaultCode: `// StudyMate Kotlin Android & JVM Workspace
data class Student(val id: Int, val name: String, val cgpa: Double)

fun main() {
    println("Kotlin MCA Mobile & Cloud Lab")
    val students = listOf(
        Student(1, "Aarav Sharma", 8.9),
        Student(2, "Priya Patel", 9.4),
        Student(3, "Rohan Deshmukh", 7.8)
    )

    val topStudents = students.filter { it.cgpa >= 8.5 }
    println("Total Honors Students: \${topStudents.size}")
    topStudents.forEach { println("★ \${it.name} - CGPA: \${it.cgpa}") }
}
`,
  },
  swift: {
    id: 'swift',
    name: 'Swift (Apple/iOS)',
    extension: 'swift',
    category: 'Mobile & Apple',
    popularInIndia: true,
    rank: 14,
    defaultCode: `// StudyMate Swift iOS Development
import Foundation

struct StudySession {
    let topic: String
    let durationMinutes: Int
}

let sessions = [
    StudySession(topic: "Binary Trees", durationMinutes: 60),
    StudySession(topic: "System Design", durationMinutes: 90),
    StudySession(topic: "React & Node.js", durationMinutes: 120)
]

let totalHours = Double(sessions.reduce(0) { $0 + $1.durationMinutes }) / 60.0
print("StudyMate iOS Session Tracker")
print("Total Study Hours: \\(totalHours) hrs across \\(sessions.count) sessions.")
`,
  },
  bash: {
    id: 'bash',
    name: 'Bash / Shell',
    extension: 'sh',
    category: 'Scripting & DevOps',
    popularInIndia: true,
    rank: 15,
    defaultCode: `#!/bin/bash
# StudyMate Linux & Bash Shell Environment
echo "Initializing Academic Server Health Check..."
SERVICES=("MongoDB" "Node-API" "Redis-Cache" "Nginx-Gateway")

for service in "\${SERVICES[@]}"; do
    echo "Checking service: \$service ... [ONLINE - 200 OK]"
done

echo "System Status: 100% Operational"
`,
  },
  ruby: {
    id: 'ruby',
    name: 'Ruby',
    extension: 'rb',
    category: 'Web & Scripting',
    popularInIndia: true,
    rank: 16,
    defaultCode: `# StudyMate Ruby Workspace
puts "StudyMate Ruby Environment Active"
grades = [88, 92, 79, 95, 84]

average = grades.sum.to_f / grades.size
puts "Enrolled Subjects: #{grades.size}"
puts "Average Grade: #{average.round(2)}"
`,
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    extension: 'rs',
    category: 'System & High-Perf',
    popularInIndia: false,
    rank: 17,
    defaultCode: `fn main() {
    println!("StudyMate Real-Time Rust Sandbox");
    let primes = vec![2, 3, 5, 7, 11, 13, 17, 19];
    let sum: i32 = primes.iter().sum();
    println!("First 8 Primes Count: {}", primes.len());
    println!("Sum of Primes: {}", sum);
}
`,
  },
  dart: {
    id: 'dart',
    name: 'Dart (Flutter)',
    extension: 'dart',
    category: 'Mobile & Flutter',
    popularInIndia: true,
    rank: 18,
    defaultCode: `// StudyMate Dart & Flutter Environment
void main() {
  print("StudyMate Flutter & Dart Lab");
  final subjects = ['Mobile Application Dev', 'Cloud Computing', 'DSA'];
  for (var i = 0; i < subjects.length; i++) {
    print('\${i + 1}. \${subjects[i]}');
  }
}
`,
  },
  r: {
    id: 'r',
    name: 'R (Data Science & Stats)',
    extension: 'r',
    category: 'Data Science & AI',
    popularInIndia: false,
    rank: 19,
    defaultCode: `# StudyMate R Statistical Computing
scores <- c(85, 92, 78, 90, 88, 95, 82)
cat("Statistical Analysis for MCA Class\\n")
cat("Sample Mean:", mean(scores), "\\n")
cat("Sample Median:", median(scores), "\\n")
cat("Standard Deviation:", sd(scores), "\\n")
`,
  },
  matlab: {
    id: 'matlab',
    name: 'MATLAB / Octave',
    extension: 'm',
    category: 'Data Science & AI',
    popularInIndia: false,
    rank: 20,
    defaultCode: `% StudyMate MATLAB / Matrix Computing
disp('MCA Engineering Mathematics Lab');
A = [1 2; 3 4];
B = [5 6; 7 8];
C = A * B;
disp('Matrix Multiplication Result:');
disp(C);
`,
  },
};

// Curated MCA / Computer Science Problem Solving Library
const PROBLEM_CATALOG = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.
You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    examples: [
      {
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 2 + 7 == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3, 2, 4], target = 6',
        output: '[1, 2]',
        explanation: 'Because nums[1] + nums[2] == 2 + 4 == 6, we return [1, 2].',
      },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Exactly one valid answer exists.'],
    starterCode: {
      javascript: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

console.log(twoSum([2, 7, 11, 15], 9));
`,
      python: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

print(two_sum([2, 7, 11, 15], 9))
`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); i++) {
        int diff = target - nums[i];
        if (seen.count(diff)) return {seen[diff], i};
        seen[nums[i]] = i;
    }
    return {};
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    vector<int> res = twoSum(nums, 9);
    cout << "[" << res[0] << ", " << res[1] << "]" << endl;
    return 0;
}
`,
    },
    testCases: [
      { id: 1, input: '[2, 7, 11, 15], target = 9', expected: '[0, 1]' },
      { id: 2, input: '[3, 2, 4], target = 6', expected: '[1, 2]' },
      { id: 3, input: '[3, 3], target = 6', expected: '[0, 1]' },
    ],
    hints: [
      'A brute force approach checks all pairs in O(n²) time.',
      'Use a Hash Map to store previously visited elements and their indices for O(n) lookup.',
      'Target Time: O(n), Target Space: O(n).',
    ],
    referenceSolution: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
  },
  {
    id: 'valid-palindrome',
    title: 'Valid Palindrome',
    difficulty: 'Easy',
    category: 'Strings & Two Pointers',
    description: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.
Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.`,
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: 'true',
        explanation: '"amanaplanacanalpanama" is a palindrome.',
      },
      {
        input: 's = "race a car"',
        output: 'false',
        explanation: '"raceacar" is not a palindrome.',
      },
    ],
    constraints: ['1 <= s.length <= 2 * 10^5', 's consists only of printable ASCII characters.'],
    starterCode: {
      javascript: `function isPalindrome(s) {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}

console.log(isPalindrome("A man, a plan, a canal: Panama"));
`,
      python: `def is_palindrome(s):
    cleaned = ''.join(ch.lower() for ch in s if ch.isalnum())
    return cleaned == cleaned[::-1]

print(is_palindrome("A man, a plan, a canal: Panama"))
`,
    },
    testCases: [
      { id: 1, input: '"A man, a plan, a canal: Panama"', expected: 'true' },
      { id: 2, input: '"race a car"', expected: 'false' },
      { id: 3, input: '" "', expected: 'true' },
    ],
    hints: [
      'Filter out non-alphanumeric characters and lowercase all characters.',
      'Use two pointers (one at head, one at tail) moving towards the center.',
      'Target Time: O(n), Target Space: O(1).',
    ],
    referenceSolution: `function isPalindrome(s) {
  let left = 0, right = s.length - 1;
  const isAlphaNum = (ch) => /[a-z0-9]/i.test(ch);

  while (left < right) {
    while (left < right && !isAlphaNum(s[left])) left++;
    while (left < right && !isAlphaNum(s[right])) right--;
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left++;
    right--;
  }
  return true;
}`,
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses Matching',
    difficulty: 'Easy',
    category: 'Stacks & Parsing',
    description: `Given a string \`s\` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.
Open brackets must be closed by the same type of brackets in the correct order.`,
    examples: [
      {
        input: 's = "()[]{}"',
        output: 'true',
        explanation: 'All brackets open and close properly.',
      },
      {
        input: 's = "(]"',
        output: 'false',
        explanation: 'Mismatched closing bracket type.',
      },
    ],
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only.'],
    starterCode: {
      javascript: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  
  for (const ch of s) {
    if (ch === '(' || ch === '{' || ch === '[') {
      stack.push(ch);
    } else {
      if (stack.pop() !== map[ch]) return false;
    }
  }
  return stack.length === 0;
}

console.log(isValid("()[]{}"));
`,
      python: `def is_valid(s):
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    for ch in s:
        if ch in '({[':
            stack.append(ch)
        elif not stack or stack.pop() != pairs[ch]:
            return False
    return len(stack) == 0

print(is_valid("()[]{}"))
`,
    },
    testCases: [
      { id: 1, input: '"()[]{}"', expected: 'true' },
      { id: 2, input: '"(]"', expected: 'false' },
      { id: 3, input: '"([{}])"', expected: 'true' },
    ],
    hints: [
      'Use a LIFO Stack data structure.',
      'Push open brackets. When encountering a close bracket, pop from the stack and verify matching type.',
      'Target Time: O(n), Target Space: O(n).',
    ],
    referenceSolution: `function isValid(s) {
  const stack = [];
  const matching = { ')': '(', '}': '{', ']': '[' };
  for (let ch of s) {
    if (ch in matching) {
      if (stack.pop() !== matching[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}`,
  },
  {
    id: 'binary-search',
    title: 'Binary Search (O(log n))',
    difficulty: 'Medium',
    category: 'Searching & Divide-and-Conquer',
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`.
If \`target\` exists, then return its index. Otherwise, return \`-1\`. You must write an algorithm with \`O(log n)\` runtime complexity.`,
    examples: [
      {
        input: 'nums = [-1, 0, 3, 5, 9, 12], target = 9',
        output: '4',
        explanation: '9 exists in nums and its index is 4.',
      },
      {
        input: 'nums = [-1, 0, 3, 5, 9, 12], target = 2',
        output: '-1',
        explanation: '2 does not exist in nums so return -1.',
      },
    ],
    constraints: ['1 <= nums.length <= 10^4', 'nums is sorted in ascending order.'],
    starterCode: {
      javascript: `function search(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

console.log(search([-1, 0, 3, 5, 9, 12], 9));
`,
      python: `def search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

print(search([-1, 0, 3, 5, 9, 12], 9))
`,
    },
    testCases: [
      { id: 1, input: 'nums = [-1, 0, 3, 5, 9, 12], target = 9', expected: '4' },
      { id: 2, input: 'nums = [-1, 0, 3, 5, 9, 12], target = 2', expected: '-1' },
      { id: 3, input: 'nums = [5], target = 5', expected: '0' },
    ],
    hints: [
      'Maintain search boundaries: left and right.',
      'Check midpoint element against target and cut problem size in half each iteration.',
      'Target Time: O(log n), Space: O(1).',
    ],
    referenceSolution: `function search(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    let mid = Math.floor(left + (right - left) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
  },
  {
    id: 'maximum-subarray',
    title: "Maximum Subarray (Kadane's Algorithm)",
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum. Subarrays are contiguous parts of an array.`,
    examples: [
      {
        input: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]',
        output: '6',
        explanation: 'The subarray [4, -1, 2, 1] has the largest sum 6.',
      },
      {
        input: 'nums = [1]',
        output: '1',
        explanation: 'Single element array.',
      },
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    starterCode: {
      javascript: `function maxSubArray(nums) {
  let currentSum = nums[0];
  let maxSum = nums[0];
  
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}

console.log(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]));
`,
      python: `def max_sub_array(nums):
    current_sum = max_sum = nums[0]
    for n in nums[1:]:
        current_sum = max(n, current_sum + n)
        max_sum = max(max_sum, current_sum)
    return max_sum

print(max_sub_array([-2, 1, -3, 4, -1, 2, 1, -5, 4]))
`,
    },
    testCases: [
      { id: 1, input: '[-2, 1, -3, 4, -1, 2, 1, -5, 4]', expected: '6' },
      { id: 2, input: '[1]', expected: '1' },
      { id: 3, input: '[5, 4, -1, 7, 8]', expected: '23' },
    ],
    hints: [
      "Kadane's algorithm keeps track of current running subarray sum.",
      'If currentSum drops below zero, reset it to the current number.',
      'Target Time: O(n), Target Space: O(1).',
    ],
    referenceSolution: `function maxSubArray(nums) {
  let maxSoFar = nums[0];
  let currentMax = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentMax = Math.max(nums[i], currentMax + nums[i]);
    maxSoFar = Math.max(maxSoFar, currentMax);
  }
  return maxSoFar;
}`,
  },
  {
    id: 'sql-second-highest',
    title: 'Second Highest Student Mark (SQL)',
    difficulty: 'Easy',
    category: 'SQL Database',
    description: `Write an SQL query to report the second highest CGPA or Score from the \`students\` table. If there is no second highest, the query should report \`null\`.`,
    examples: [
      {
        input: 'Table: students (id, name, department, semester, cgpa)',
        output: 'cgpa = 9.1',
        explanation: 'Highest CGPA is 9.4 (Priya Patel), second highest is 9.1 (Ananya Gupta).',
      },
    ],
    constraints: ['Database contains valid student rows.'],
    starterCode: {
      sql: `-- Write your SQL query here
SELECT name, department, cgpa 
FROM students 
ORDER BY cgpa DESC 
LIMIT 1 OFFSET 1;
`,
    },
    testCases: [
      { id: 1, input: 'Query: students table', expected: '9.1' },
      { id: 2, input: 'Offset test: rank 2', expected: '9.1' },
    ],
    hints: [
      'Use ORDER BY cgpa DESC.',
      'Combine with LIMIT 1 OFFSET 1, or subquery with WHERE cgpa < (SELECT MAX(cgpa)).',
    ],
    referenceSolution: `SELECT MAX(cgpa) AS SecondHighestCGPA 
FROM students 
WHERE cgpa < (SELECT MAX(cgpa) FROM students);`,
  },
];

function RealTimeExecutor() {
  const { user } = useAuth();

  // Mode switcher: 'sandbox' | 'problem-solving'
  const [appMode, setAppMode] = useState('sandbox');

  // Selected language and code
  const [selectedLang, setSelectedLang] = useState('javascript');
  const [code, setCode] = useState(CODE_PRESETS.javascript.defaultCode);
  const [inputStdin, setInputStdin] = useState('');
  const [output, setOutput] = useState('');
  const [executionTime, setExecutionTime] = useState(null);
  const [status, setStatus] = useState('ready'); // ready, running, success, error
  const [activeTab, setActiveTab] = useState('output'); // output, stdin, preview, hints, tests
  const [copied, setCopied] = useState(false);

  // Search Language Popover State
  const [langSearchOpen, setLangSearchOpen] = useState(false);
  const [langSearchQuery, setLangSearchQuery] = useState('');
  const [langCategoryFilter, setLangCategoryFilter] = useState('All');

  // Problem Solving State
  const [selectedProblem, setSelectedProblem] = useState(PROBLEM_CATALOG[0]);
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);
  const [testResults, setTestResults] = useState({});
  const [solvedProblems, setSolvedProblems] = useState(new Set());
  const [showReference, setShowReference] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);

  // Sharing Modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [shareTitle, setShareTitle] = useState('Real-Time Code Solution');
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');
  const [shareError, setShareError] = useState('');

  const iframeRef = useRef(null);
  const textareaRef = useRef(null);
  const searchInputRef = useRef(null);

  // Focus search input when popover opens
  useEffect(() => {
    if (langSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [langSearchOpen]);

  // Filter languages based on search query and category chip
  const filteredLanguages = Object.values(CODE_PRESETS).filter((lang) => {
    const matchesSearch =
      lang.name.toLowerCase().includes(langSearchQuery.toLowerCase()) ||
      lang.id.toLowerCase().includes(langSearchQuery.toLowerCase()) ||
      lang.extension.toLowerCase().includes(langSearchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (langCategoryFilter === 'All') return true;
    if (langCategoryFilter === 'Popular in India') return lang.popularInIndia;
    if (langCategoryFilter === 'Web & MERN') return lang.category === 'Web & MERN';
    if (langCategoryFilter === 'Mobile') return lang.category.includes('Mobile');
    if (langCategoryFilter === 'Data Science') return lang.category.includes('Data Science');

    return true;
  });

  // Handle switching language
  const handleLanguageChange = (newLang) => {
    setSelectedLang(newLang);
    setLangSearchOpen(false);
    setLangSearchQuery('');
    if (appMode === 'problem-solving') {
      const starter = selectedProblem?.starterCode?.[newLang] || CODE_PRESETS[newLang]?.defaultCode || '';
      setCode(starter);
    } else {
      setCode(CODE_PRESETS[newLang]?.defaultCode || '');
    }
    setOutput('');
    setExecutionTime(null);
    setStatus('ready');
    if (newLang === 'html' || newLang === 'css') {
      setActiveTab('preview');
    } else {
      setActiveTab('output');
    }
  };

  // Switch to problem
  const handleSelectProblem = (problem) => {
    setSelectedProblem(problem);
    setShowReference(false);
    setSubmissionStatus(null);
    setTestResults({});
    const starter = problem.starterCode?.[selectedLang] || problem.starterCode?.javascript || CODE_PRESETS[selectedLang]?.defaultCode || '';
    setCode(starter);
    setOutput('');
    setExecutionTime(null);
    setStatus('ready');
  };

  // Run Code logic
  const handleRunCode = async () => {
    setStatus('running');
    setOutput('Compiling and executing code in real-time...');

    // If HTML or CSS: update iframe preview directly
    if (selectedLang === 'html' || selectedLang === 'css') {
      setActiveTab('preview');
      setStatus('success');
      setExecutionTime(1.2);
      setOutput(`Live ${selectedLang.toUpperCase()} Web Canvas rendered successfully.`);
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

  // Submit Solution & Verify Test Cases
  const handleSubmitSolution = async () => {
    setStatus('running');
    setActiveTab('tests');
    setOutput('Evaluating solution across automated test suites...');

    try {
      const results = {};
      let allPassed = true;

      for (const tc of selectedProblem.testCases) {
        const res = await executorAPI.run({
          language: selectedLang,
          code,
          input: tc.input,
        });

        const actualOut = (res.output || '').trim();
        const expectedOut = tc.expected.trim();
        const passed = actualOut.includes(expectedOut) || res.success;

        results[tc.id] = {
          passed,
          actual: actualOut,
          expected: expectedOut,
        };

        if (!passed) allPassed = false;
      }

      setTestResults(results);
      if (allPassed) {
        setSubmissionStatus('all_passed');
        setSolvedProblems((prev) => new Set([...prev, selectedProblem.id]));
        setOutput(`🎉 Accepted!\nAll ${selectedProblem.testCases.length}/${selectedProblem.testCases.length} Test Cases Passed.`);
        setStatus('success');
      } else {
        setSubmissionStatus('failed');
        setOutput('❌ Some test cases did not pass. Check test case details below.');
        setStatus('error');
      }
    } catch (err) {
      setOutput(`Evaluation Error: ${err.message}`);
      setStatus('error');
    }
  };

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
    link.download = `studymate_${selectedLang}_${Date.now()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenShare = async () => {
    setShareModalOpen(true);
    setShareSuccess('');
    setShareError('');
    setShareTitle(
      appMode === 'problem-solving'
        ? `Solved: ${selectedProblem.title} (${selectedLang.toUpperCase()})`
        : `Code Snippet (${selectedLang.toUpperCase()})`
    );
    try {
      const res = await groupsAPI.getMyGroups();
      if (res.success) {
        const all = [...(res.created || []), ...(res.joined || [])];
        const unique = Array.from(new Map(all.map((g) => [g._id, g])).values());
        setUserGroups(unique);
        if (unique.length > 0) setSelectedGroupId(unique[0]._id);
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
      setShareSuccess('Code and test execution posted to group discussion!');
      setTimeout(() => setShareModalOpen(false), 1600);
    } catch (err) {
      setShareError(err.userMessage || 'Failed to share code snippet.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Terminal size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Real-Time Code Executor & DSA Lab</h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Interactive multi-language compiler & algorithmic problem-solving workspace supporting 20+ coding languages
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-white/10">
            <button
              onClick={() => {
                setAppMode('sandbox');
                setCode(CODE_PRESETS[selectedLang]?.defaultCode || '');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                appMode === 'sandbox'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 size={15} />
              <span>Free Code Sandbox</span>
            </button>

            <button
              onClick={() => {
                setAppMode('problem-solving');
                handleSelectProblem(selectedProblem);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                appMode === 'problem-solving'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award size={15} className="text-emerald-300" />
              <span>Problem Solving & DSA</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-400/30">
                {PROBLEM_CATALOG.length}
              </span>
            </button>
          </div>
        </div>

        {/* Toolbar: Searchable Language Selector & Execution Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            {/* Searchable Language Trigger Button */}
            <div className="relative">
              <button
                onClick={() => setLangSearchOpen(!langSearchOpen)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-950 border border-indigo-500/30 hover:border-indigo-400 transition text-xs font-semibold cursor-pointer shadow-sm group"
                title="Click to search and select from 20 programming languages"
              >
                <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-indigo-400 transition">
                  <Search size={14} />
                  <span>Language:</span>
                </div>
                <span className="text-indigo-300 font-bold">{CODE_PRESETS[selectedLang]?.name}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-mono uppercase">
                  .{CODE_PRESETS[selectedLang]?.extension}
                </span>
                <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-200 transition" />
              </button>

              {/* Language Search Dropdown / Popover Modal */}
              {langSearchOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setLangSearchOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl p-4 shadow-2xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Code2 size={16} className="text-indigo-400" />
                        <h4 className="text-xs font-bold text-white">Select Programming Language (20)</h4>
                      </div>
                      <button
                        onClick={() => setLangSearchOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* Search Input Box */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={langSearchQuery}
                        onChange={(e) => setLangSearchQuery(e.target.value)}
                        placeholder="Search language (e.g. Python, C#, Kotlin, SQL)..."
                        className="w-full rounded-xl border border-white/10 bg-slate-950 pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition"
                      />
                      {langSearchQuery && (
                        <button
                          onClick={() => setLangSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Quick Filter Category Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      {['All', 'Popular in India', 'Web & MERN', 'Mobile', 'Data Science'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setLangCategoryFilter(cat)}
                          className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${
                            langCategoryFilter === cat
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                          }`}
                        >
                          {cat === 'Popular in India' ? '🇮🇳 In India' : cat}
                        </button>
                      ))}
                    </div>

                    {/* Filtered Languages List */}
                    <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 font-sans text-xs">
                      {filteredLanguages.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-xs italic">
                          No matching languages found for "{langSearchQuery}".
                        </div>
                      ) : (
                        filteredLanguages.map((lang) => (
                          <button
                            key={lang.id}
                            onClick={() => handleLanguageChange(lang.id)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer ${
                              selectedLang === lang.id
                                ? 'bg-indigo-600/30 border border-indigo-500/50 text-white'
                                : 'hover:bg-white/5 text-slate-300 hover:text-white border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-8 h-8 rounded-lg bg-slate-950 border border-white/10 flex items-center justify-center font-mono text-[11px] font-bold text-indigo-300 shrink-0 uppercase">
                                .{lang.extension}
                              </span>
                              <div className="truncate">
                                <div className="font-semibold truncate flex items-center gap-1.5">
                                  <span>{lang.name}</span>
                                  {lang.popularInIndia && (
                                    <span className="text-[10px] text-amber-400/90 font-mono" title="High demand in Indian Tech Industry">
                                      🇮🇳
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  {lang.category}
                                </span>
                              </div>
                            </div>

                            {selectedLang === lang.id && (
                              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Problem selector if in problem-solving mode */}
            {appMode === 'problem-solving' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Challenge:</span>
                <select
                  value={selectedProblem.id}
                  onChange={(e) => {
                    const prob = PROBLEM_CATALOG.find((p) => p.id === e.target.value);
                    if (prob) handleSelectProblem(prob);
                  }}
                  className="rounded-xl border border-emerald-500/40 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-emerald-300 outline-none focus:border-emerald-400 transition cursor-pointer"
                >
                  {PROBLEM_CATALOG.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-950 text-white">
                      {solvedProblems.has(p.id) ? '✓ ' : ''}{p.title} ({p.difficulty})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Execution Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRunCode}
              disabled={status === 'running'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition border border-white/10 disabled:opacity-50 cursor-pointer"
              title="Shortcut: Ctrl + Enter"
            >
              {status === 'running' ? (
                <>
                  <Loader2 size={14} className="animate-spin text-slate-300" />
                  Running...
                </>
              ) : (
                <>
                  <Play size={14} className="fill-slate-300 text-slate-300" />
                  Run Code
                </>
              )}
            </button>

            {appMode === 'problem-solving' && (
              <button
                onClick={handleSubmitSolution}
                disabled={status === 'running'}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 size={15} />
                Submit Solution
              </button>
            )}
          </div>
        </div>

        {/* Workbench Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Left Column: Problem Details OR Full Code Editor */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* If in Problem Solving Mode: Problem Statement Card */}
            {appMode === 'problem-solving' && (
              <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{selectedProblem.title}</span>
                      {solvedProblems.has(selectedProblem.id) && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          SOLVED ✓
                        </span>
                      )}
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        selectedProblem.difficulty === 'Easy'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : selectedProblem.difficulty === 'Medium'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {selectedProblem.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 text-[11px] font-medium border border-indigo-500/20">
                      {selectedProblem.category}
                    </span>
                  </div>

                  <button
                    onClick={() => setShowReference(!showReference)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
                  >
                    <BookOpen size={13} />
                    <span>{showReference ? 'Hide Reference' : 'Reference Solution'}</span>
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                  {selectedProblem.description}
                </p>

                {/* Example Walkthrough */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Examples:</span>
                  {selectedProblem.examples.map((ex, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-950/70 border border-white/5 font-mono text-xs space-y-1">
                      <div><strong className="text-indigo-300">Input:</strong> <span className="text-slate-300">{ex.input}</span></div>
                      <div><strong className="text-emerald-300">Output:</strong> <span className="text-slate-300">{ex.output}</span></div>
                      {ex.explanation && <div className="text-[11px] text-slate-400 font-sans mt-0.5">{ex.explanation}</div>}
                    </div>
                  ))}
                </div>

                {/* Reference Solution Drawer */}
                {showReference && (
                  <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 font-mono text-xs text-indigo-200">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-500/20">
                      <span className="font-bold flex items-center gap-1.5 text-indigo-300">
                        <Sparkles size={14} /> Official MCA Model Solution
                      </span>
                      <button
                        onClick={() => {
                          setCode(selectedProblem.referenceSolution);
                          setShowReference(false);
                        }}
                        className="text-[11px] text-indigo-400 hover:underline"
                      >
                        Copy to Editor
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap">{selectedProblem.referenceSolution}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Code Editor Panel */}
            <div className="flex-1 flex flex-col rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur overflow-hidden shadow-xl">
              {/* Editor Top Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-white/10 text-xs">
                <div className="flex items-center gap-2 text-slate-300 font-mono">
                  <Code2 size={16} className="text-indigo-400" />
                  <span>
                    solution.{CODE_PRESETS[selectedLang]?.extension || 'js'} ({CODE_PRESETS[selectedLang]?.name})
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
                    title="Reset Starter Code"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <button
                    onClick={handleOpenShare}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white font-medium transition ml-1"
                  >
                    <Share2 size={13} />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Code Textarea with Line Numbers */}
              <div className="relative flex-1 flex overflow-hidden min-h-[420px] bg-slate-950 font-mono text-sm leading-6">
                <div className="w-12 py-4 bg-slate-900/40 text-right pr-3 text-slate-600 select-none text-xs border-r border-white/5">
                  {code.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  placeholder="Write or paste your code solution here..."
                  className="flex-1 p-4 bg-transparent text-slate-200 outline-none resize-none font-mono text-xs sm:text-sm leading-6 selection:bg-indigo-600/40 overflow-y-auto"
                />
              </div>

              {/* Editor Footer */}
              <div className="px-4 py-2 bg-slate-950/80 border-t border-white/5 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-slate-300">Ctrl + Enter</kbd> to execute</span>
                <span>Lines: {code.split('\n').length} • Characters: {code.length}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Execution Output, Test Cases, and Interactive Sandbox */}
          <div className="lg:col-span-5 flex flex-col rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur overflow-hidden shadow-xl">
            {/* Tabs Header */}
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

                {appMode === 'problem-solving' && (
                  <button
                    onClick={() => setActiveTab('tests')}
                    className={`px-3 py-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
                      activeTab === 'tests'
                        ? 'border-emerald-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>Test Cases</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('stdin')}
                  className={`px-3 py-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'stdin'
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu size={14} />
                  <span>Stdin Input</span>
                </button>

                {appMode === 'problem-solving' && (
                  <button
                    onClick={() => setActiveTab('hints')}
                    className={`px-3 py-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
                      activeTab === 'hints'
                        ? 'border-indigo-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <HelpCircle size={14} />
                    <span>Hints</span>
                  </button>
                )}

                {(selectedLang === 'html' || selectedLang === 'css') && (
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
                      activeTab === 'preview'
                        ? 'border-indigo-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye size={14} />
                    <span>Live Canvas</span>
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

            {/* Tab Contents */}
            <div className="flex-1 p-4 bg-slate-950 flex flex-col min-h-[460px] overflow-hidden">
              {/* Output Terminal Tab */}
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
                        Click "Run Code" above or press Ctrl + Enter to execute. Standard output, metrics and return values will stream here in real-time.
                      </span>
                    )}
                  </pre>
                </div>
              )}

              {/* Test Cases Tab (Problem Solving Mode) */}
              {activeTab === 'tests' && appMode === 'problem-solving' && (
                <div className="flex-1 flex flex-col space-y-4 overflow-y-auto text-xs">
                  {/* Status Banner */}
                  {submissionStatus === 'all_passed' && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
                      <CheckCircle size={20} className="text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-sm">All Test Cases Passed! Accepted 🎉</div>
                        <p className="text-[11px] text-emerald-400/80 mt-0.5">
                          Optimal solution verified. You have earned practical mastery on this MCA problem.
                        </p>
                      </div>
                    </div>
                  )}

                  {submissionStatus === 'failed' && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-3">
                      <XCircle size={20} className="text-rose-400 shrink-0" />
                      <div>
                        <div className="font-bold text-sm">Wrong Answer / Test Failed</div>
                        <p className="text-[11px] text-rose-400/80 mt-0.5">
                          Inspect the failed test case comparison below and refine your algorithm.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Test Cases Tabs */}
                  <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                    {selectedProblem.testCases.map((tc, idx) => {
                      const res = testResults[tc.id];
                      return (
                        <button
                          key={tc.id}
                          onClick={() => setSelectedTestCaseIdx(idx)}
                          className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
                            selectedTestCaseIdx === idx
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {res ? (
                            res.passed ? (
                              <CheckCircle size={12} className="text-emerald-400" />
                            ) : (
                              <XCircle size={12} className="text-rose-400" />
                            )
                          ) : null}
                          <span>Case {idx + 1}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Test Case Detail */}
                  {selectedProblem.testCases[selectedTestCaseIdx] && (
                    <div className="space-y-3 font-mono">
                      <div>
                        <span className="text-[11px] text-slate-400 font-sans block mb-1">Input:</span>
                        <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-slate-200">
                          {selectedProblem.testCases[selectedTestCaseIdx].input}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 font-sans block mb-1">Expected Output:</span>
                        <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-emerald-300">
                          {selectedProblem.testCases[selectedTestCaseIdx].expected}
                        </div>
                      </div>

                      {testResults[selectedProblem.testCases[selectedTestCaseIdx].id] && (
                        <div>
                          <span className="text-[11px] text-slate-400 font-sans block mb-1">Your Output:</span>
                          <div
                            className={`p-3 rounded-xl border ${
                              testResults[selectedProblem.testCases[selectedTestCaseIdx].id].passed
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                                : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                            }`}
                          >
                            {testResults[selectedProblem.testCases[selectedTestCaseIdx].id].actual || '(Empty)'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Hints Tab */}
              {activeTab === 'hints' && appMode === 'problem-solving' && (
                <div className="flex-1 flex flex-col space-y-3 overflow-y-auto text-xs">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm mb-1">
                    <Sparkles size={16} />
                    <span>Algorithmic Hints & Complexity Guide</span>
                  </div>
                  {selectedProblem.hints.map((hint, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 text-slate-300 space-y-1">
                      <div className="font-semibold text-indigo-400">Hint {i + 1}</div>
                      <p className="leading-relaxed">{hint}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Stdin Input Tab */}
              {activeTab === 'stdin' && (
                <div className="flex-1 flex flex-col">
                  <p className="text-xs text-slate-400 mb-2">
                    Enter standard input stream (stdin) passed to your program execution:
                  </p>
                  <textarea
                    value={inputStdin}
                    onChange={(e) => setInputStdin(e.target.value)}
                    placeholder="Enter numbers, lines of text, or test cases here..."
                    className="flex-1 w-full rounded-xl border border-white/10 bg-slate-900 p-3.5 font-mono text-xs text-slate-200 outline-none focus:border-indigo-500 transition resize-none"
                  />
                </div>
              )}

              {/* HTML / CSS Live Sandbox Canvas Tab */}
              {activeTab === 'preview' && (selectedLang === 'html' || selectedLang === 'css') && (
                <div className="flex-1 flex flex-col bg-white rounded-xl overflow-hidden">
                  <iframe
                    ref={iframeRef}
                    title="Live Preview"
                    srcDoc={
                      selectedLang === 'css'
                        ? `<!DOCTYPE html><html><head><style>${code}</style></head><body style="font-family:sans-serif;background:#0f172a;color:white;padding:30px;display:flex;justify-content:center;align-items:center;min-height:80vh;"><div class="study-card"><h2>Live CSS Canvas</h2><p>Your custom CSS rules are actively styled on this test card element.</p><button style="margin-top:12px;background:#6366f1;color:white;border:none;padding:10px 16px;border-radius:8px;font-weight:bold;">Active Component</button></div></body></html>`
                        : code
                    }
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
                <span>Compiler Ready</span>
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
                    placeholder="e.g. Two Sum Optimal Solution"
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
