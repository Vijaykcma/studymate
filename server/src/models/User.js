import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    department: {
      type: String,
      required: [true, 'Please select your department'],
      trim: true,
      default: 'General',
    },
    semester: {
      type: String,
      required: [true, 'Please select your semester'],
      trim: true,
      default: '1st Semester',
    },
    college: {
      type: String,
      trim: true,
      default: '',
    },
    registrationNumber: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    suspendedReason: {
      type: String,
      default: '',
    },
    suspendedUntil: {
      type: Date,
      default: null,
    },
    settings: {
      notifications: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
      groupInvites: { type: Boolean, default: true },
      profileVisible: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: true },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOtp: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    emailVerificationAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    passwordResetOtp: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    passwordResetAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateEmailVerificationOtp = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationOtp = otp;
  this.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  this.emailVerificationAttempts = 0;
  return otp;
};

userSchema.methods.generatePasswordResetOtp = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.passwordResetOtp = otp;
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  this.passwordResetAttempts = 0;
  return otp;
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationOtp;
  delete obj.emailVerificationExpires;
  delete obj.emailVerificationAttempts;
  delete obj.passwordResetOtp;
  delete obj.passwordResetExpires;
  delete obj.passwordResetAttempts;
  return obj;
};

export const User = mongoose.model('User', userSchema);
