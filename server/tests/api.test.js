import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { StudyGroup } from '../src/models/StudyGroup.js';
import { StudySession } from '../src/models/StudySession.js';
import { Message } from '../src/models/Message.js';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/studymate_test';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  await StudyGroup.deleteMany({});
  await StudySession.deleteMany({});
  await Message.deleteMany({});
});

describe('StudyMate Complete API Test Suite', () => {
  // 1. Health Check
  test('Health check endpoint returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  // 2. Registration & 3. Duplicate Registration Rejection
  test('Registers a new user and rejects duplicate email', async () => {
    const userData = {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'Password123!',
      department: 'Computer Science',
      semester: '3rd Semester',
    };

    // First registration should succeed
    const res1 = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    expect(res1.body.user).toBeDefined();
    expect(res1.body.user.email).toBe(userData.email);
    expect(res1.body.user.password).toBeUndefined(); // never expose password

    // Duplicate registration should be rejected
    const res2 = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    expect(res2.status).toBe(400);
    expect(res2.body.success).toBe(false);
  });

  // 4. Login with correct credentials & 5. Incorrect credentials
  test('Logs in with correct credentials and rejects incorrect password', async () => {
    // Create user
    await request(app).post('/api/v1/auth/register').send({
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: 'SecretPassword123!',
      department: 'MCA',
      semester: '2nd Semester',
    });

    // Valid login
    const validLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bob@example.com', password: 'SecretPassword123!' });

    expect(validLogin.status).toBe(200);
    expect(validLogin.body.success).toBe(true);
    expect(validLogin.body.token).toBeDefined();

    // Invalid login
    const invalidLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bob@example.com', password: 'WrongPassword' });

    expect(invalidLogin.status).toBe(401);
    expect(invalidLogin.body.success).toBe(false);
  });

  // 6. Auth middleware & 7. Unauthorized API access
  test('Enforces authentication on protected routes', async () => {
    // Request without token
    const unauth = await request(app).get('/api/v1/auth/me');
    expect(unauth.status).toBe(401);

    // Register and get token
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      password: 'Password123!',
      department: 'B.Tech',
      semester: '1st Semester',
    });

    const token = reg.body.token;

    // Request with token
    const authRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(authRes.status).toBe(200);
    expect(authRes.body.user.name).toBe('Charlie Brown');
  });

  // 8. Group creation & 9. Group retrieval
  test('Creates and retrieves study groups', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Owner User',
      email: 'owner@example.com',
      password: 'Password123!',
      department: 'MCA',
      semester: '2nd Semester',
    });
    const token = reg.body.token;

    const groupData = {
      name: 'Advanced React Architecture',
      subject: 'Web Development',
      description: 'Studying modern patterns in React and state management.',
      maxMembers: 5,
      skillLevel: 'Advanced',
      meetingDays: ['Monday', 'Wednesday'],
      meetingTime: '6:00 PM',
      location: 'Online',
    };

    const createRes = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${token}`)
      .send(groupData);

    expect(createRes.status).toBe(201);
    expect(createRes.body.group.name).toBe(groupData.name);
    expect(createRes.body.group.members.length).toBe(1); // creator is automatically a member

    // Retrieve groups
    const getRes = await request(app).get('/api/v1/groups?subject=Web Development');
    expect(getRes.status).toBe(200);
    expect(getRes.body.groups.length).toBeGreaterThanOrEqual(1);
    expect(getRes.body.groups[0].name).toBe(groupData.name);
  });

  // 10. Group joining, 11. Duplicate prevention, 12. Capacity enforcement
  test('Handles group joining, duplicate prevention, and capacity enforcement', async () => {
    // Creator user
    const u1 = await request(app).post('/api/v1/auth/register').send({
      name: 'User One',
      email: 'u1@example.com',
      password: 'Password123!',
      department: 'MCA',
      semester: '2nd Semester',
    });

    // Create group with maxMembers = 2 (creator takes 1 slot)
    const grp = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${u1.body.token}`)
      .send({
        name: 'Small Group',
        subject: 'Algorithms',
        description: 'Small intensive algorithm study group.',
        maxMembers: 2,
        skillLevel: 'Intermediate',
        meetingDays: ['Tuesday'],
        meetingTime: '5:00 PM',
        location: 'Online',
      });

    const groupId = grp.body.group._id;

    // Second user sends join request
    const u2 = await request(app).post('/api/v1/auth/register').send({
      name: 'User Two',
      email: 'u2@example.com',
      password: 'Password123!',
      department: 'MCA',
      semester: '2nd Semester',
    });

    const joinRes = await request(app)
      .post(`/api/v1/groups/${groupId}/join`)
      .set('Authorization', `Bearer ${u2.body.token}`);

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.status).toBe('pending');

    // Duplicate join attempt while pending
    const dupJoin = await request(app)
      .post(`/api/v1/groups/${groupId}/join`)
      .set('Authorization', `Bearer ${u2.body.token}`);

    expect(dupJoin.status).toBe(400);
    expect(dupJoin.body.message).toMatch(/already pending approval/i);

    // Group creator approves the request
    const approveRes = await request(app)
      .patch(`/api/v1/groups/${groupId}/requests/${u2.body.user._id}`)
      .set('Authorization', `Bearer ${u1.body.token}`)
      .send({ action: 'approve' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.group.members.length).toBe(2);

    // Third user tries to join but group has reached capacity (2/2)
    const u3 = await request(app).post('/api/v1/auth/register').send({
      name: 'User Three',
      email: 'u3@example.com',
      password: 'Password123!',
      department: 'MCA',
      semester: '2nd Semester',
    });

    const capacityJoin = await request(app)
      .post(`/api/v1/groups/${groupId}/join`)
      .set('Authorization', `Bearer ${u3.body.token}`);

    expect(capacityJoin.status).toBe(400);
    expect(capacityJoin.body.message).toMatch(/capacity/i);
  });

  // 13. Group ownership permissions
  test('Restricts group editing to the group creator', async () => {
    const u1 = await request(app).post('/api/v1/auth/register').send({
      name: 'Owner',
      email: 'owner2@example.com',
      password: 'Password123!',
      department: 'MCA',
      semester: '2nd Semester',
    });

    const grp = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${u1.body.token}`)
      .send({
        name: 'Original Title',
        subject: 'Math',
        description: 'Mathematics revision group.',
        maxMembers: 10,
        skillLevel: 'Beginner',
        meetingDays: ['Monday'],
        meetingTime: '10:00 AM',
        location: 'Online',
      });

    const groupId = grp.body.group._id;

    // Non-owner attempts to edit
    const u2 = await request(app).post('/api/v1/auth/register').send({
      name: 'Hacker',
      email: 'hacker@example.com',
      password: 'Password123!',
      department: 'MCA',
      semester: '2nd Semester',
    });

    const editRes = await request(app)
      .patch(`/api/v1/groups/${groupId}`)
      .set('Authorization', `Bearer ${u2.body.token}`)
      .send({ name: 'Hacked Title' });

    expect(editRes.status).toBe(403);
  });

  // 14. Session management and validation
  test('Creates and manages study sessions for group members', async () => {
    const u = await request(app).post('/api/v1/auth/register').send({
      name: 'Session Organizer',
      email: 'org@example.com',
      password: 'Password123!',
      department: 'MCA',
      semester: '2nd Semester',
    });
    const token = u.body.token;

    const grp = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Database Theory',
        subject: 'Database',
        description: 'Database normalization and relational calculus.',
        maxMembers: 10,
        skillLevel: 'Intermediate',
        meetingDays: ['Friday'],
        meetingTime: '7:00 PM',
        location: 'Online',
      });

    const groupId = grp.body.group._id;

    // Create session
    const sessRes = await request(app)
      .post('/api/v1/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'B+ Tree Indexing Workshop',
        group: groupId,
        description: 'Deep dive into B+ trees and storage engines.',
        date: '2026-10-25',
        startTime: '07:00 PM',
        endTime: '08:30 PM',
        location: 'Online (Google Meet)',
      });

    expect(sessRes.status).toBe(201);
    expect(sessRes.body.session.title).toBe('B+ Tree Indexing Workshop');
  });

  // 15. Message authorization
  test('Prevents non-members from viewing or posting messages', async () => {
    const creator = await request(app).post('/api/v1/auth/register').send({
      name: 'Member',
      email: 'member@example.com',
      password: 'Password123!',
      department: 'MCA',
      semester: '2nd Semester',
    });

    const outsider = await request(app).post('/api/v1/auth/register').send({
      name: 'Outsider',
      email: 'outsider@example.com',
      password: 'Password123!',
      department: 'MCA',
      semester: '2nd Semester',
    });

    const grp = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${creator.body.token}`)
      .send({
        name: 'Secret Group',
        subject: 'Security',
        description: 'Confidential study group discussions.',
        maxMembers: 10,
        skillLevel: 'Advanced',
        meetingDays: ['Monday'],
        meetingTime: '8:00 PM',
        location: 'Online',
      });

    const groupId = grp.body.group._id;

    // Outsider tries to view messages
    const viewRes = await request(app)
      .get(`/api/v1/groups/${groupId}/messages`)
      .set('Authorization', `Bearer ${outsider.body.token}`);

    expect(viewRes.status).toBe(403);

    // Outsider tries to send message
    const sendRes = await request(app)
      .post(`/api/v1/groups/${groupId}/messages`)
      .set('Authorization', `Bearer ${outsider.body.token}`)
      .send({ content: 'Hello secret group!' });

    expect(sendRes.status).toBe(403);
  });

  // 16. Invalid route parameters and 404 handling
  test('Handles invalid ObjectIds and unknown endpoints gracefully', async () => {
    const resBadId = await request(app).get('/api/v1/groups/not-a-valid-object-id');
    expect(resBadId.status).toBe(404);

    const res404 = await request(app).get('/api/v1/non-existent-route');
    expect(res404.status).toBe(404);
  });

  // 17. Email Verification Flow
  test('Generates OTP on registration and verifies real user with valid code', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Charlie Davis',
      email: 'charlie@example.com',
      password: 'SecurePassword123!',
      department: 'Data Science',
      semester: '1st Semester',
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.user.isEmailVerified).toBe(false);
    expect(regRes.body.devOtp).toBeDefined();

    const devOtp = regRes.body.devOtp;

    // Test rejection of invalid OTP
    const invalidVerify = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ email: 'charlie@example.com', otp: '000000' });

    expect(invalidVerify.status).toBe(400);
    expect(invalidVerify.body.success).toBe(false);

    // Test successful verification with valid OTP
    const validVerify = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ email: 'charlie@example.com', otp: devOtp });

    expect(validVerify.status).toBe(200);
    expect(validVerify.body.success).toBe(true);
    expect(validVerify.body.user.isEmailVerified).toBe(true);
  });

  // 18. Real-Time Code Execution Engine
  test('Executes sandboxed JavaScript and returns stdout and execution metrics', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Coder Student',
      email: 'coder@example.com',
      password: 'Password123!',
      department: 'MCA',
      semester: '2nd Semester',
    });

    const execRes = await request(app)
      .post('/api/v1/executor/run')
      .set('Authorization', `Bearer ${reg.body.token}`)
      .send({
        language: 'javascript',
        code: 'const a = 10; const b = 20; console.log("Sum:", a + b);',
      });

    expect(execRes.status).toBe(200);
    expect(execRes.body.success).toBe(true);
    expect(execRes.body.output).toContain('Sum: 30');
    expect(execRes.body.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  // 19. Forgot Password & OTP Reset Flow
  test('Handles forgot password request and resets password with valid OTP', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Password Reset User',
      email: 'resetuser@example.com',
      password: 'OldPassword123!',
      department: 'MCA',
      semester: '1st Semester',
    });

    // Request reset code
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'resetuser@example.com' });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.success).toBe(true);
    expect(forgotRes.body.devOtp).toBeDefined();

    const resetOtp = forgotRes.body.devOtp;

    // Reset password with valid OTP
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        email: 'resetuser@example.com',
        otp: resetOtp,
        newPassword: 'NewPassword999!',
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // Verify user can login with new password
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'resetuser@example.com',
        password: 'NewPassword999!',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });
});
