import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { User } from '../models/User.js';
import { StudyGroup } from '../models/StudyGroup.js';
import { StudySession } from '../models/StudySession.js';
import { StudyMaterial } from '../models/StudyMaterial.js';
import { Message } from '../models/Message.js';
import { AuditLog } from '../models/AuditLog.js';
import { Report } from '../models/Report.js';
import { PlatformSettings } from '../models/PlatformSettings.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Clearing existing demo data...');
    await User.deleteMany({});
    await StudyGroup.deleteMany({});
    await StudySession.deleteMany({});
    await StudyMaterial.deleteMany({});
    await Message.deleteMany({});
    await AuditLog.deleteMany({});
    await Report.deleteMany({});
    await PlatformSettings.deleteMany({});

    console.log('[Seed] Creating demo users...');
    const demoPassword = 'Password123!';

    const vijay = await User.create({
      name: 'Vijay Kumar',
      email: 'vijay@example.com',
      password: demoPassword,
      department: 'MCA',
      semester: '2nd Semester',
      college: 'Apex Institute of Technology',
      registrationNumber: 'MCA2026-001',
      bio: 'MCA student passionate about databases, backend engineering, and distributed systems.',
    });

    const priya = await User.create({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: demoPassword,
      department: 'MCA',
      semester: '2nd Semester',
      college: 'Apex Institute of Technology',
      registrationNumber: 'MCA2026-042',
      bio: 'Frontend enthusiast working on React, UI/UX design, and web accessibility.',
    });

    const arun = await User.create({
      name: 'Arun Kumar',
      email: 'arun@example.com',
      password: demoPassword,
      department: 'B.Tech',
      semester: '4th Semester',
      college: 'Apex Institute of Technology',
      registrationNumber: 'BT2024-112',
      bio: 'Competitive programming & algorithms enthusiast.',
    });

    const rahul = await User.create({
      name: 'Rahul Verma',
      email: 'rahul@example.com',
      password: demoPassword,
      department: 'BCA',
      semester: '3rd Semester',
      college: 'Apex Institute of Technology',
      registrationNumber: 'BCA2025-089',
      bio: 'Computer networks and cybersecurity explorer.',
    });

    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@studymate.internal',
      password: demoPassword,
      department: 'Administration',
      semester: 'Staff',
      college: 'Apex Institute of Technology',
      registrationNumber: 'ADMIN-001',
      role: 'admin',
      status: 'active',
      bio: 'Verified StudyMate platform administrator and system overseer.',
    });

    console.log('[Seed] Creating study groups...');
    const dbmsGroup = await StudyGroup.create({
      name: 'DBMS Exam Preparation',
      subject: 'Database Management',
      description: 'Prepare together for upcoming DBMS university exams, normalization problems, SQL queries, and ACID transactions.',
      creator: vijay._id,
      maxMembers: 12,
      skillLevel: 'Intermediate',
      meetingDays: ['Monday', 'Wednesday', 'Friday'],
      meetingTime: '7:00 PM',
      location: 'Online',
      department: 'MCA',
      semester: '2nd Semester',
      visibility: 'public',
      members: [
        { user: vijay._id, role: 'admin', joinedAt: new Date() },
        { user: priya._id, role: 'member', joinedAt: new Date() },
        { user: arun._id, role: 'member', joinedAt: new Date() },
        { user: rahul._id, role: 'member', joinedAt: new Date() },
      ],
    });

    const mernGroup = await StudyGroup.create({
      name: 'MERN Stack Learners',
      subject: 'Web Development',
      description: 'Hands-on collaborative projects learning React 19, Node.js, Express, and MongoDB with modern architectural patterns.',
      creator: priya._id,
      maxMembers: 15,
      skillLevel: 'Beginner',
      meetingDays: ['Tuesday', 'Thursday'],
      meetingTime: '6:30 PM',
      location: 'College Library',
      department: 'MCA',
      semester: '2nd Semester',
      visibility: 'public',
      members: [
        { user: priya._id, role: 'admin', joinedAt: new Date() },
        { user: vijay._id, role: 'member', joinedAt: new Date() },
        { user: arun._id, role: 'member', joinedAt: new Date() },
      ],
    });

    const daaGroup = await StudyGroup.create({
      name: 'DAA Problem Solvers',
      subject: 'Algorithms',
      description: 'Daily practice on dynamic programming, graph algorithms, and asymptotic complexity analysis.',
      creator: arun._id,
      maxMembers: 10,
      skillLevel: 'Advanced',
      meetingDays: ['Saturday', 'Sunday'],
      meetingTime: '5:00 PM',
      location: 'Online',
      department: 'B.Tech',
      semester: '4th Semester',
      visibility: 'public',
      members: [
        { user: arun._id, role: 'admin', joinedAt: new Date() },
        { user: vijay._id, role: 'member', joinedAt: new Date() },
        { user: rahul._id, role: 'member', joinedAt: new Date() },
      ],
    });

    const netGroup = await StudyGroup.create({
      name: 'Computer Networks Crew',
      subject: 'Computer Networks',
      description: 'Master OSI model layers, TCP/IP handshakes, routing protocols, and socket programming.',
      creator: rahul._id,
      maxMembers: 10,
      skillLevel: 'Intermediate',
      meetingDays: ['Monday', 'Friday'],
      meetingTime: '4:30 PM',
      location: 'Room 204',
      department: 'BCA',
      semester: '3rd Semester',
      visibility: 'public',
      members: [
        { user: rahul._id, role: 'admin', joinedAt: new Date() },
        { user: priya._id, role: 'member', joinedAt: new Date() },
      ],
    });

    const seGroup = await StudyGroup.create({
      name: 'Software Engineering Hub',
      subject: 'Software Engineering',
      description: 'Collaborate on UML diagrams, agile sprints, design patterns, and SRS documentation.',
      creator: vijay._id,
      maxMembers: 8,
      skillLevel: 'Intermediate',
      meetingDays: ['Wednesday'],
      meetingTime: '7:30 PM',
      location: 'Online',
      visibility: 'public',
      members: [
        { user: vijay._id, role: 'admin', joinedAt: new Date() },
        { user: priya._id, role: 'member', joinedAt: new Date() },
      ],
    });

    console.log('[Seed] Creating study sessions...');
    await StudySession.create([
      {
        title: 'DBMS Normalization Deep Dive (1NF to BCNF)',
        group: dbmsGroup._id,
        description: 'Comprehensive review of functional dependencies, Armstrong axioms, and BCNF decomposition.',
        date: '2026-10-15',
        startTime: '07:00 PM',
        endTime: '08:30 PM',
        location: 'Google Meet',
        meetingType: 'Online',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        organizer: vijay._id,
        participants: [vijay._id, priya._id, arun._id],
      },
      {
        title: 'React Custom Hooks & Context Architecture',
        group: mernGroup._id,
        description: 'Building custom hooks, handling asynchronous state, and eliminating prop drilling.',
        date: '2026-10-16',
        startTime: '06:30 PM',
        endTime: '08:00 PM',
        location: 'College Library, Study Hall B',
        meetingType: 'Campus',
        organizer: priya._id,
        participants: [priya._id, vijay._id],
      },
      {
        title: 'Dynamic Programming & Memoization',
        group: daaGroup._id,
        description: 'Solving 0/1 Knapsack, Longest Common Subsequence, and Matrix Chain Multiplication.',
        date: '2026-10-18',
        startTime: '05:00 PM',
        endTime: '06:30 PM',
        location: 'Google Meet',
        meetingType: 'Online',
        organizer: arun._id,
        participants: [arun._id, vijay._id, rahul._id],
      },
    ]);

    console.log('[Seed] Creating study materials...');
    // Create dummy files in uploads directory
    const uploadDir = path.resolve('uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const dummyFile1 = path.join(uploadDir, 'demo-dbms-unit1.pdf');
    const dummyFile2 = path.join(uploadDir, 'demo-react-hooks.pdf');
    fs.writeFileSync(dummyFile1, 'Demo Study Material: DBMS Unit 1 Notes PDF Content');
    fs.writeFileSync(dummyFile2, 'Demo Study Material: React Hooks Reference Guide Content');

    await StudyMaterial.create([
      {
        title: 'DBMS Unit 1 Comprehensive Notes',
        description: 'Covers Relational Algebra, ER Models, and SQL DDL/DML fundamentals.',
        group: dbmsGroup._id,
        uploader: vijay._id,
        originalFilename: 'DBMS Unit 1 Notes.pdf',
        storedFilename: 'demo-dbms-unit1.pdf',
        fileType: 'PDF',
        fileSize: 4800000,
        mimeType: 'application/pdf',
      },
      {
        title: 'React 19 & Hooks Cheatsheet',
        description: 'Quick reference guide for useEffect, useMemo, useCallback, and Context.',
        group: mernGroup._id,
        uploader: priya._id,
        originalFilename: 'React Hooks Guide.pdf',
        storedFilename: 'demo-react-hooks.pdf',
        fileType: 'PDF',
        fileSize: 2100000,
        mimeType: 'application/pdf',
      },
    ]);

    console.log('[Seed] Creating sample discussion messages...');
    await Message.create([
      {
        group: dbmsGroup._id,
        sender: arun._id,
        senderName: 'Arun Kumar',
        content: 'Hey everyone! Are we meeting today for the normalization session?',
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        group: dbmsGroup._id,
        sender: priya._id,
        senderName: 'Priya Sharma',
        content: 'Yes! Let us start with 3NF and BCNF decomposition examples.',
        createdAt: new Date(Date.now() - 1800000),
      },
      {
        group: dbmsGroup._id,
        sender: vijay._id,
        senderName: 'Vijay Kumar',
        content: 'Sounds great! I uploaded the Unit 1 notes for everyone to review beforehand.',
        createdAt: new Date(Date.now() - 600000),
      },
      {
        group: mernGroup._id,
        sender: priya._id,
        senderName: 'Priya Sharma',
        content: 'Welcome to MERN Stack Learners! Looking forward to building our first full-stack project.',
        createdAt: new Date(Date.now() - 7200000),
      },
    ]);

    console.log('[Seed] Initializing platform settings and moderation data...');
    await PlatformSettings.create({
      singletonId: 'GLOBAL_SETTINGS',
      maintenanceMode: false,
      allowStudentRegistration: true,
      allowGroupCreation: true,
      allowMaterialUploads: true,
      maxUploadSizeMB: 15,
      systemAnnouncement: 'Welcome to the new academic term on StudyMate! Group formation is now active.',
      systemAnnouncementActive: true,
      updatedBy: admin._id,
    });

    // Sample Report for moderation queue demonstration
    await Report.create({
      reporter: rahul._id,
      resourceType: 'StudyGroup',
      resourceId: mernGroup._id,
      category: 'Inappropriate Content',
      description: 'Requesting review of group rules regarding commercial advertising in project channels.',
      status: 'pending',
    });

    // Initial Audit Log entry
    await AuditLog.create({
      actor: admin._id,
      actorRole: 'admin',
      actorName: 'System Administrator',
      actorEmail: 'admin@studymate.internal',
      action: 'SYSTEM_INITIALIZED',
      resourceType: 'PlatformSettings',
      resourceId: 'GLOBAL_SETTINGS',
      status: 'SUCCESS',
      details: { environment: 'development', mode: 'seeded' },
    });

    console.log('\n=================================================');
    console.log('✅ Demo database seeded successfully!');
    console.log('-------------------------------------------------');
    console.log('Student Accounts:');
    console.log('1. vijay@example.com           | Password: Password123!');
    console.log('2. priya@example.com           | Password: Password123!');
    console.log('3. arun@example.com            | Password: Password123!');
    console.log('4. rahul@example.com           | Password: Password123!');
    console.log('-------------------------------------------------');
    console.log('Platform Administrator Account:');
    console.log('🔑 admin@studymate.internal    | Password: Password123!');
    console.log('Admin Portal: http://localhost:5173/admin/login');
    console.log('=================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedDatabase();
