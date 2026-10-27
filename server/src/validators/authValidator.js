import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  department: z.string().trim().min(1, 'Please select a department'),
  semester: z.string().trim().min(1, 'Please select a semester'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  otp: z.string().trim().length(6, 'Verification code must be exactly 6 digits'),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().email('Invalid email address').toLowerCase().optional(),
    otp: z.string().trim().min(6).optional(),
    token: z.string().trim().min(6).optional(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  })
  .refine((data) => data.otp || data.token, {
    message: 'Reset token or verification code is required',
    path: ['otp'],
  });

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  department: z.string().trim().optional(),
  semester: z.string().trim().optional(),
  college: z.string().trim().max(100).optional(),
  registrationNumber: z.string().trim().max(50).optional(),
  bio: z.string().trim().max(300).optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const updateSettingsSchema = z.object({
  notifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  groupInvites: z.boolean().optional(),
  profileVisible: z.boolean().optional(),
  darkMode: z.boolean().optional(),
});
