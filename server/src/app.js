import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/authRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import userRoutes from './routes/userRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import executorRoutes from './routes/executorRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { PlatformSettings } from './models/PlatformSettings.js';
import { errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, client credentials handled
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve('uploads')));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
});

// Health check endpoints
app.get(['/api/health', '/api/v1/health'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'StudyMate API Server',
  });
});

// Optional platform maintenance check middleware for student routes
app.use(async (req, res, next) => {
  // Allow health check, admin operations, and admin auth regardless of maintenance
  if (
    req.path.startsWith('/api/health') ||
    req.path.startsWith('/api/v1/health') ||
    req.path.startsWith('/api/v1/admin')
  ) {
    return next();
  }

  try {
    const settings = await PlatformSettings.getSettings();
    if (settings && settings.maintenanceMode) {
      return res.status(503).json({
        success: false,
        message: 'StudyMate is currently undergoing scheduled platform maintenance. Please try again shortly.',
      });
    }
  } catch (err) {
    // Graceful fallback if database check fails
  }

  next();
});

// Mount API routes under /api/v1
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/materials', materialRoutes);
app.use('/api/v1/groups', messageRoutes); // for /api/v1/groups/:groupId/messages
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/executor', executorRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Also alias under /api for clean REST compatibility
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/groups', messageRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve static client build assets in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
