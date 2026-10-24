import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import { connectDB } from './config/db.js';
import { setupSocket } from './sockets/socketHandler.js';
import { User } from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const PORT = process.env.PORT || 5000;

const bootstrapAdmin = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'aiinterviewbotvk@gmail.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'vk2005';

    let admin = await User.findOne({ email: adminEmail }).select('+password');
    if (!admin) {
      admin = new User({
        name: 'System Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        department: 'Administration',
        semester: 'Staff',
        isEmailVerified: true,
        status: 'active',
        bio: 'Verified StudyMate platform administrator and system overseer.',
      });
      await admin.save();
      console.log(`[Bootstrap] Created administrator account: ${adminEmail} (password: ${adminPassword})`);
    } else {
      const isSamePass = await admin.matchPassword(adminPassword);
      let needsSave = false;
      if (!isSamePass) {
        admin.password = adminPassword;
        needsSave = true;
      }
      if (admin.role !== 'admin') {
        admin.role = 'admin';
        needsSave = true;
      }
      if (!admin.isEmailVerified) {
        admin.isEmailVerified = true;
        needsSave = true;
      }
      if (admin.status !== 'active') {
        admin.status = 'active';
        needsSave = true;
      }
      if (needsSave) {
        await admin.save();
        console.log(`[Bootstrap] Updated administrator credentials for: ${adminEmail}`);
      }
    }
  } catch (error) {
    console.error(`[Bootstrap Admin Warning]: ${error.message}`);
  }
};

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Ensure platform administrator exists
    await bootstrapAdmin();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.io
    const io = new Server(server, {
      cors: {
        origin: [
          process.env.CLIENT_URL || 'http://localhost:5173',
          'http://localhost:5173',
          'http://127.0.0.1:5173',
        ],
        credentials: true,
      },
    });

    app.set('io', io);
    setupSocket(io);

    server.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`🚀 StudyMate Backend Server is running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error(`[Server Start Error]: ${error.message}`);
    process.exit(1);
  }
};

startServer();
