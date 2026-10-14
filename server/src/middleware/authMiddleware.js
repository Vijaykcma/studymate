import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.',
      });
    }

    const secret = process.env.JWT_SECRET || 'studymate_default_secret_key_123456';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    // Enforce account suspension check
    if (user.status === 'suspended') {
      if (user.suspendedUntil && new Date(user.suspendedUntil) <= new Date()) {
        // Suspension period has elapsed: auto-reactivate
        user.status = 'active';
        user.suspendedReason = '';
        user.suspendedUntil = null;
        await user.save();
      } else {
        return res.status(403).json({
          success: false,
          message: `Your account has been suspended${
            user.suspendedReason ? `: ${user.suspendedReason}` : '.'
          }`,
        });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please sign in again.',
    });
  }
};

/**
 * Enforce platform-wide administrator authorization.
 * Centralized server-side role check; rejects students and moderators with HTTP 403.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Administrator privileges required.',
    });
  }
  next();
};
