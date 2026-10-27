import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { PlatformSettings } from '../models/PlatformSettings.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/sendEmail.js';

export const sendTokenCookie = (user, statusCode, res, extraData = {}) => {
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

  const sanitizedUser = user.toJSON ? user.toJSON() : user;

  return res.status(statusCode).json({
    success: true,
    token,
    user: sanitizedUser,
    ...extraData,
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
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const user = new User({
      name,
      email: normalizedEmail,
      password,
      department,
      semester,
      isEmailVerified: false,
    });

    const otp = user.generateEmailVerificationOtp();
    await user.save();

    // Dispatch verification email
    const emailResult = await sendVerificationEmail({
      to: user.email,
      name: user.name,
      otp,
    });

    const isLiveDelivered = Boolean(emailResult?.emailDelivered || (emailResult?.success && emailResult?.isLive));
    const provideOtpOnScreen =
      !isLiveDelivered ||
      process.env.ALLOW_OTP_PREVIEW === 'true' ||
      process.env.NODE_ENV !== 'production';

    sendTokenCookie(user, 201, res, {
      message: isLiveDelivered
        ? 'Registration successful! A 6-digit verification code has been sent to your email.'
        : `Registration successful! Email delivery is delayed or pending. Your verification code is: ${otp}`,
      devOtp: provideOtpOnScreen ? otp : undefined,
      emailSent: isLiveDelivered,
      previewUrl: emailResult?.previewUrl,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
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

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password +emailVerificationOtp +emailVerificationExpires +emailVerificationAttempts'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Your email address is already verified.',
        user: user.toJSON(),
      });
    }

    if (!user.emailVerificationOtp || !user.emailVerificationExpires) {
      return res.status(400).json({
        success: false,
        message: 'No pending verification request. Please request a new verification code.',
      });
    }

    if (new Date() > new Date(user.emailVerificationExpires)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
      });
    }

    if (user.emailVerificationAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new verification code.',
      });
    }

    if (user.emailVerificationOtp !== otp.trim()) {
      user.emailVerificationAttempts = (user.emailVerificationAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check your email and try again.',
        attemptsLeft: Math.max(0, 5 - user.emailVerificationAttempts),
      });
    }

    // Verification successful! Mark verified
    user.isEmailVerified = true;
    user.emailVerificationOtp = undefined;
    user.emailVerificationExpires = undefined;
    user.emailVerificationAttempts = 0;
    await user.save();

    sendTokenCookie(user, 200, res, {
      message: 'Email verified successfully! You are now an authorized and verified user.',
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerificationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+emailVerificationOtp +emailVerificationExpires +emailVerificationAttempts'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'This email is already verified.',
      });
    }

    // Cooldown rate-limit: 60 seconds
    if (user.emailVerificationExpires) {
      const msElapsed = 15 * 60 * 1000 - (new Date(user.emailVerificationExpires) - new Date());
      if (msElapsed > 0 && msElapsed < 60 * 1000) {
        const secondsRemaining = Math.ceil((60 * 1000 - msElapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsRemaining}s before requesting another verification code.`,
          secondsRemaining,
        });
      }
    }

    const otp = user.generateEmailVerificationOtp();
    await user.save();

    const emailResult = await sendVerificationEmail({
      to: user.email,
      name: user.name,
      otp,
    });

    const isLiveDelivered = Boolean(emailResult?.emailDelivered || (emailResult?.success && emailResult?.isLive));
    const provideOtpOnScreen =
      !isLiveDelivered ||
      process.env.ALLOW_OTP_PREVIEW === 'true' ||
      process.env.NODE_ENV !== 'production';

    res.status(200).json({
      success: true,
      message: isLiveDelivered
        ? 'A fresh 6-digit verification code has been dispatched. Please check your Inbox and Spam/Junk folder.'
        : `A new verification code has been generated: ${otp} (Email dispatch is delayed by mail server).`,
      devOtp: provideOtpOnScreen ? otp : undefined,
      emailSent: isLiveDelivered,
      previewUrl: emailResult?.previewUrl,
    });
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

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+passwordResetOtp +passwordResetExpires +passwordResetAttempts'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account registered with this email address.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'This account is suspended. Please contact platform administrators.',
      });
    }

    // Cooldown rate-limit: 60 seconds
    if (user.passwordResetExpires) {
      const msElapsed = 15 * 60 * 1000 - (new Date(user.passwordResetExpires) - new Date());
      if (msElapsed > 0 && msElapsed < 60 * 1000) {
        const secondsRemaining = Math.ceil((60 * 1000 - msElapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsRemaining}s before requesting another reset code.`,
          secondsRemaining,
        });
      }
    }

    const otp = user.generatePasswordResetOtp();
    await user.save();

    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      otp,
    });

    const isLiveDelivered = Boolean(emailResult?.emailDelivered || (emailResult?.success && emailResult?.isLive));
    const provideOtpOnScreen =
      !isLiveDelivered ||
      process.env.ALLOW_OTP_PREVIEW === 'true' ||
      process.env.NODE_ENV !== 'production';

    res.status(200).json({
      success: true,
      message: isLiveDelivered
        ? 'A 6-digit password reset verification code has been dispatched to your email.'
        : `Password reset code: ${otp} (Email dispatch is delayed by mail server).`,
      devOtp: provideOtpOnScreen ? otp : undefined,
      emailSent: isLiveDelivered,
      previewUrl: emailResult?.previewUrl,
    });
  } catch (error) {
    next(error);
  }
};

export const validateResetToken = async (req, res, next) => {
  try {
    const rawToken = req.params.token || req.query.token;
    if (!rawToken) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Password reset token is required.',
      });
    }

    const token = rawToken.trim();
    const user = await User.findOne({
      passwordResetOtp: token,
      passwordResetExpires: { $gt: new Date() },
    }).select('name email');

    if (!user) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Invalid or expired password reset link.',
      });
    }

    // Mask user email for privacy
    const [namePart, domainPart] = user.email.split('@');
    const maskedEmail = `${namePart.slice(0, 2)}***@${domainPart}`;

    res.status(200).json({
      success: true,
      valid: true,
      email: maskedEmail,
      name: user.name,
      message: 'Reset token is valid.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, token, newPassword } = req.body;
    const providedCode = (token || req.params.token || otp || '').trim();

    let user;
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      user = await User.findOne({ email: normalizedEmail }).select(
        '+password +passwordResetOtp +passwordResetExpires +passwordResetAttempts'
      );
    } else if (providedCode) {
      user = await User.findOne({ passwordResetOtp: providedCode }).select(
        '+password +passwordResetOtp +passwordResetExpires +passwordResetAttempts'
      );
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account registered with this reset code.',
      });
    }

    if (!user.passwordResetOtp || !user.passwordResetExpires) {
      return res.status(400).json({
        success: false,
        message: 'No pending password reset request. Please request a new code.',
      });
    }

    if (new Date() > new Date(user.passwordResetExpires)) {
      return res.status(400).json({
        success: false,
        message: 'Password reset code has expired. Please request a fresh one.',
      });
    }

    if ((user.passwordResetAttempts || 0) >= 5) {
      user.passwordResetOtp = undefined;
      user.passwordResetExpires = undefined;
      user.passwordResetAttempts = 0;
      await user.save();
      return res.status(429).json({
        success: false,
        message: 'Too many failed verification attempts. Please request a new reset code.',
      });
    }

    if (user.passwordResetOtp !== providedCode) {
      user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
      await user.save();
      const attemptsRemaining = 5 - user.passwordResetAttempts;
      return res.status(400).json({
        success: false,
        message: `Invalid reset code. ${attemptsRemaining} attempt${
          attemptsRemaining === 1 ? '' : 's'
        } remaining.`,
        attemptsRemaining,
      });
    }

    // Success: set new password, clear reset fields, mark email verified
    user.password = newPassword;
    user.passwordResetOtp = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetAttempts = 0;
    user.isEmailVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully! You can now log in with your new credentials.',
    });
  } catch (error) {
    next(error);
  }
};
