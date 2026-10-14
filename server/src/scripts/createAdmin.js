import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { recordAuditLog } from '../utils/auditLogger.js';

// Resolve current directory and load server .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

// Parse command line arguments if provided: e.g. node createAdmin.js --email admin@example.com --password Pass123! --name "Admin User"
const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      parsed[key] = val;
    }
  }
  return parsed;
};

const createOrPromoteAdmin = async () => {
  try {
    console.log('====================================================');
    console.log('   StudyMate — Secure Administrator Provisioning   ');
    console.log('====================================================');

    await connectDB();

    const args = parseArgs();

    let email = args.email || process.env.INITIAL_ADMIN_EMAIL;
    let password = args.password || process.env.INITIAL_ADMIN_PASSWORD;
    let name = args.name || process.env.INITIAL_ADMIN_NAME || 'Platform Administrator';
    let department = args.department || 'Administration';

    if (!email) {
      email = await askQuestion('Enter Administrator Email: ');
    }
    email = email ? email.trim().toLowerCase() : '';

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      console.error('❌ Error: A valid email address is required.');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log(`ℹ️ User "${email}" is already an active platform administrator.`);
        console.log(`No changes made (Operation is safely idempotent).`);
        rl.close();
        process.exit(0);
      }

      console.log(`Found existing user account for "${email}" with role "${existingUser.role}".`);
      let confirmPromote = args.confirm;
      if (confirmPromote === undefined) {
        const answer = await askQuestion(`Promote this user to platform administrator? (y/N): `);
        confirmPromote = answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes';
      }

      if (!confirmPromote) {
        console.log('Aborted. No user permissions were modified.');
        rl.close();
        process.exit(0);
      }

      existingUser.role = 'admin';
      existingUser.status = 'active';
      existingUser.suspendedReason = '';
      existingUser.suspendedUntil = null;
      await existingUser.save();

      await recordAuditLog({
        actor: existingUser,
        action: 'ADMIN_PROMOTION',
        resourceType: 'User',
        resourceId: String(existingUser._id),
        status: 'SUCCESS',
        details: { email: existingUser.email, promotedVia: 'CLI Bootstrap' },
      });

      console.log(`✅ Success: User "${email}" has been promoted to platform administrator.`);
      rl.close();
      process.exit(0);
    }

    // New Administrator Account Creation
    if (!password) {
      password = await askQuestion('Enter Administrator Password (min 8 chars, 1 number, 1 uppercase): ');
    }

    if (!password || password.length < 8) {
      console.error('❌ Error: Password must be at least 8 characters long.');
      process.exit(1);
    }

    const newAdmin = await User.create({
      name,
      email,
      password,
      department,
      semester: 'Staff',
      role: 'admin',
      status: 'active',
      bio: 'Verified StudyMate platform administrator.',
    });

    await recordAuditLog({
      actor: newAdmin,
      action: 'ADMIN_PROVISIONED',
      resourceType: 'User',
      resourceId: String(newAdmin._id),
      status: 'SUCCESS',
      details: { email: newAdmin.email, provisionedVia: 'CLI Bootstrap' },
    });

    console.log(`✅ Success: New platform administrator "${email}" created successfully!`);
    console.log(`You can now sign in at http://localhost:5173/admin/login`);
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to provision administrator:', error.message);
    rl.close();
    process.exit(1);
  }
};

createOrPromoteAdmin();
