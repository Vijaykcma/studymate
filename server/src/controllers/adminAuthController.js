import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { recordAuditLog } from '../utils/auditLogger.js';

export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // Generic error to avoid user enumeration
    if (!user) {
      await recordAuditLog({
        action: 'ADMIN_LOGIN_FAILED',
        resourceType: 'Auth',
        status: 'FAILURE',
        details: { emailAttempted: normalizedEmail, reason: 'Invalid credentials or user not found' },
        req,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await recordAuditLog({
        actor: user,
        action: 'ADMIN_LOGIN_FAILED',
        resourceType: 'Auth',
        status: 'FAILURE',
        details: { emailAttempted: normalizedEmail, reason: 'Password mismatch' },
        req,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.',
      });
    }

    // Role check: ONLY platform administrators are allowed
    if (user.role !== 'admin') {
      await recordAuditLog({
        actor: user,
        action: 'ADMIN_LOGIN_DENIED_ROLE',
        resourceType: 'Auth',
        status: 'FAILURE',
        details: { emailAttempted: normalizedEmail, attemptedRole: user.role, reason: 'Unauthorized role' },
        req,
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied: Platform administrator privileges required.',
      });
    }

    // Check account status
    if (user.status === 'suspended') {
      if (user.suspendedUntil && new Date(user.suspendedUntil) <= new Date()) {
        user.status = 'active';
        user.suspendedReason = '';
        user.suspendedUntil = null;
        await user.save();
      } else {
        await recordAuditLog({
          actor: user,
          action: 'ADMIN_LOGIN_SUSPENDED',
          resourceType: 'Auth',
          status: 'FAILURE',
          details: { reason: user.suspendedReason },
          req,
        });

        return res.status(403).json({
          success: false,
          message: `Administrator account is currently suspended${
            user.suspendedReason ? `: ${user.suspendedReason}` : '.'
          }`,
        });
      }
    }

    // Issue JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'studymate_default_secret_key_123456',
      { expiresIn: '7d' }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Record successful admin login
    await recordAuditLog({
      actor: user,
      action: 'ADMIN_LOGIN',
      resourceType: 'Auth',
      status: 'SUCCESS',
      details: { email: user.email },
      req,
    });

    // Sanitize user object
    const userSafe = user.toJSON();

    res.status(200).json({
      success: true,
      token,
      user: userSafe,
      message: 'Administrator authenticated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const adminGetMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const adminLogout = async (req, res) => {
  if (req.user) {
    await recordAuditLog({
      actor: req.user,
      action: 'ADMIN_LOGOUT',
      resourceType: 'Auth',
      status: 'SUCCESS',
      details: { email: req.user.email },
      req,
    });
  }

  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Administrator logged out successfully.',
  });
};
