import mongoose from 'mongoose';

const studyGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 60,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 1000,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    maxMembers: {
      type: Number,
      default: 10,
      min: [2, 'Maximum members must be at least 2'],
      max: [100, 'Maximum members cannot exceed 100'],
    },
    skillLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'All Levels',
    },
    meetingDays: {
      type: [String],
      default: ['Monday', 'Wednesday'],
    },
    meetingTime: {
      type: String,
      default: '7:00 PM',
    },
    location: {
      type: String,
      default: 'Online',
    },
    department: {
      type: String,
      default: '',
    },
    semester: {
      type: String,
      default: '',
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    status: {
      type: String,
      enum: ['active', 'hidden', 'archived', 'suspended'],
      default: 'active',
      index: true,
    },
    moderationReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for memberCount
studyGroupSchema.virtual('memberCount').get(function () {
  return this.members ? this.members.length : 0;
});

// Indexes for searching and filtering
studyGroupSchema.index({ name: 'text', subject: 'text', description: 'text' });
studyGroupSchema.index({ subject: 1 });
studyGroupSchema.index({ skillLevel: 1 });
studyGroupSchema.index({ creator: 1 });
studyGroupSchema.index({ 'members.user': 1 });

export const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema);
