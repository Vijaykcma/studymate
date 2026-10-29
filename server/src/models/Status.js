import mongoose from 'mongoose';

const statusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userAvatar: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['text', 'image', 'video'],
      default: 'text',
    },
    backgroundColor: {
      type: String,
      default: '#4f46e5',
    },
    viewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export const Status = mongoose.model('Status', statusSchema);
