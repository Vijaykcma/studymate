import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
      maxlength: 120,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
      required: [true, 'Group reference is required'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    date: {
      type: String,
      required: [true, 'Session date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    location: {
      type: String,
      required: [true, 'Location or meeting link is required'],
      default: 'Online (Google Meet)',
    },
    meetingType: {
      type: String,
      enum: ['Online', 'Campus', 'In-Person'],
      default: 'Online',
    },
    meetingLink: {
      type: String,
      default: '',
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['Upcoming', 'Completed', 'Cancelled'],
      default: 'Upcoming',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

studySessionSchema.index({ group: 1 });
studySessionSchema.index({ organizer: 1 });
studySessionSchema.index({ date: 1 });

export const StudySession = mongoose.model('StudySession', studySessionSchema);
