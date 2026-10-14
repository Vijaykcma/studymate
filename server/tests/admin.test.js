import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { StudyGroup } from '../src/models/StudyGroup.js';
import { StudySession } from '../src/models/StudySession.js';
import { StudyMaterial } from '../src/models/StudyMaterial.js';
import { Report } from '../src/models/Report.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { PlatformSettings } from '../src/models/PlatformSettings.js';

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
  await StudyMaterial.deleteMany({});
  await Report.deleteMany({});
  await AuditLog.deleteMany({});
  await PlatformSettings.deleteMany({});
});

describe('StudyMate Administrator System Test Suite', () => {
  const adminCredentials = {
    name: 'Super Admin',
    email: 'admin@test.com',
    password: 'AdminPassword123!',
    role: 'admin',
    department: 'Administration',
  };

  const studentCredentials = {
    name: 'Regular Student',
    email: 'student@test.com',
    password: 'StudentPassword123!',
    department: 'MCA',
  };

  // Helper to create test users
  const setupUsers = async () => {
    const admin = await User.create(adminCredentials);
    const student = await User.create(studentCredentials);
    return { admin, student };
  };

  // 1. Admin Login & Role Enforcement
  test('Authenticates valid administrator and rejects student on admin login', async () => {
    await setupUsers();

    // Valid admin login
    const adminLoginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: adminCredentials.email, password: adminCredentials.password });

    expect(adminLoginRes.status).toBe(200);
    expect(adminLoginRes.body.success).toBe(true);
    expect(adminLoginRes.body.token).toBeDefined();
    expect(adminLoginRes.body.user.role).toBe('admin');

    // Audit log should have recorded login
    const loginAudit = await AuditLog.findOne({ action: 'ADMIN_LOGIN' });
    expect(loginAudit).not.toBeNull();
    expect(loginAudit.actorEmail).toBe(adminCredentials.email);

    // Student attempting to login at admin portal must be rejected with 403
    const studentLoginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: studentCredentials.email, password: studentCredentials.password });

    expect(studentLoginRes.status).toBe(403);
    expect(studentLoginRes.body.success).toBe(false);
  });

  // 2. Reject Invalid Credentials with Generic Error
  test('Returns generic 401 on wrong admin password or nonexistent email', async () => {
    await setupUsers();

    const wrongPass = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: adminCredentials.email, password: 'WrongPassword999' });

    expect(wrongPass.status).toBe(401);
    expect(wrongPass.body.message).toContain('Invalid administrator credentials');

    const nonexistent = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'ghost@test.com', password: 'SomePassword123!' });

    expect(nonexistent.status).toBe(401);
    expect(nonexistent.body.message).toContain('Invalid administrator credentials');
  });

  // 3. Authorization Boundary: Student Token Rejected on Admin APIs
  test('Enforces 403 when authenticated student tries to access admin endpoints', async () => {
    await setupUsers();

    // Login as student
    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: studentCredentials.email, password: studentCredentials.password });

    const studentToken = studentLogin.body.token;

    // Student attempts to call admin stats
    const statsAttempt = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(statsAttempt.status).toBe(403);
    expect(statsAttempt.body.message).toContain('Administrator privileges required');

    // Unauthenticated attempt
    const unauthAttempt = await request(app).get('/api/v1/admin/users');
    expect(unauthAttempt.status).toBe(401);
  });

  // 4. Admin Dashboard Stats Calculation
  test('Admin stats calculates real metrics accurately', async () => {
    const { admin, student } = await setupUsers();

    // Create a group
    await StudyGroup.create({
      name: 'Algorithm Group',
      subject: 'Algorithms',
      description: 'Preparing for interviews',
      creator: student._id,
      members: [{ user: student._id, role: 'admin' }],
    });

    const adminLogin = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: adminCredentials.email, password: adminCredentials.password });

    const adminToken = adminLogin.body.token;

    const statsRes = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.success).toBe(true);
    expect(statsRes.body.data.users.total).toBe(2);
    expect(statsRes.body.data.users.students).toBe(1);
    expect(statsRes.body.data.users.admins).toBe(1);
    expect(statsRes.body.data.groups.total).toBe(1);
  });

  // 5. User Suspension and Self-Lockout Protection
  test('Suspends user and blocks suspended user login, protects admin self-lockout', async () => {
    const { admin, student } = await setupUsers();

    const adminLogin = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: adminCredentials.email, password: adminCredentials.password });

    const adminToken = adminLogin.body.token;

    // Admin suspends student
    const suspendRes = await request(app)
      .patch(`/api/v1/admin/users/${student._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'suspended', reason: 'Violation of community code of conduct' });

    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.user.status).toBe('suspended');

    // Suspended student tries to login -> rejected with 403
    const suspendedLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: studentCredentials.email, password: studentCredentials.password });

    expect(suspendedLogin.status).toBe(403);
    expect(suspendedLogin.body.message).toContain('suspended');

    // Admin tries to suspend self -> blocked by safeguard
    const selfSuspend = await request(app)
      .patch(`/api/v1/admin/users/${admin._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'suspended', reason: 'Accidental lockout' });

    expect(selfSuspend.status).toBe(400);
    expect(selfSuspend.body.message).toContain('Self-lockout protection');

    // Admin reactivates student
    const reactivateRes = await request(app)
      .patch(`/api/v1/admin/users/${student._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });

    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.user.status).toBe('active');
  });

  // 6. Reports and Moderation Workflow
  test('Handles report lifecycle and records audit records', async () => {
    const { admin, student } = await setupUsers();

    // Student token
    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: studentCredentials.email, password: studentCredentials.password });
    const studentToken = studentLogin.body.token;

    // Create a group
    const group = await StudyGroup.create({
      name: 'Spam Group',
      subject: 'Spam',
      description: 'Buy cheap items',
      creator: student._id,
      members: [{ user: student._id, role: 'admin' }],
    });

    // Student submits report
    const reportRes = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        resourceType: 'StudyGroup',
        resourceId: group._id,
        category: 'Spam',
        description: 'This group is advertising commercial services.',
      });

    expect(reportRes.status).toBe(201);
    const reportId = reportRes.body.reportId;

    // Admin logs in
    const adminLogin = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: adminCredentials.email, password: adminCredentials.password });
    const adminToken = adminLogin.body.token;

    // Admin views report details
    const viewReport = await request(app)
      .get(`/api/v1/admin/reports/${reportId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(viewReport.status).toBe(200);
    expect(viewReport.body.data.targetResource.name).toBe('Spam Group');

    // Admin resolves report
    const resolveRes = await request(app)
      .patch(`/api/v1/admin/reports/${reportId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'resolved',
        resolutionReason: 'Group was reviewed and warned.',
        moderatorNotes: 'First offense warning issued.',
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.status).toBe('resolved');

    // Check audit log for resolution
    const auditRecord = await AuditLog.findOne({ action: 'REPORT_RESOLVED' });
    expect(auditRecord).not.toBeNull();
  });

  // 7. Platform Settings Management
  test('Updates platform settings and persists changes', async () => {
    await setupUsers();

    const adminLogin = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: adminCredentials.email, password: adminCredentials.password });
    const adminToken = adminLogin.body.token;

    // Update settings
    const updateRes = await request(app)
      .patch('/api/v1/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        allowStudentRegistration: false,
        maxUploadSizeMB: 25,
        systemAnnouncement: 'System scheduled maintenance tonight at 11 PM',
        systemAnnouncementActive: true,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.allowStudentRegistration).toBe(false);
    expect(updateRes.body.data.maxUploadSizeMB).toBe(25);

    // Now, attempting student registration should be rejected
    const regAttempt = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'New Student',
        email: 'newstudent@test.com',
        password: 'Password123!',
        department: 'B.Tech',
        semester: '1st Semester',
      });

    expect(regAttempt.status).toBe(403);
    expect(regAttempt.body.message).toContain('registration is currently disabled');
  });
});
