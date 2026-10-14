import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { PlatformSettings } from '../models/PlatformSettings.js';

export const sendTokenCookie = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'studymate_default_secret_key_123456',
    { expiresIn: '7d' }
  );

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  res.cookie('token', token, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    token,
    user,
  });
};

export const register = async (req, res, next) => {
  try {
    const settings = await PlatformSettings.getSettings();
    if (settings && !settings.allowStudentRegistration) {
      return res.status(403).json({
        success: false,
        message: 'Student registration is currently disabled by system administrator.',
      });
    }

    const { name, email, password, department, semester } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      department,
      semester,
    });

    sendTokenCookie(user, 201, res);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check account suspension
    if (user.status === 'suspended') {
      if (user.suspendedUntil && new Date(user.suspendedUntil) <= new Date()) {
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

    sendTokenCookie(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};
