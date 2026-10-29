import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    chatType: {
      type: String,
      enum: ['group', 'direct'],
      default: 'group',
      index: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
      required: function () {
        return this.chatType === 'group';
      },
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function () {
        return this.chatType === 'direct';
      },
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: '',
      trim: true,
      maxlength: 5000,
    },
    messageType: {
      type: String,
      enum: ['text', 'voice', 'code', 'file', 'image', 'call_log'],
      default: 'text',
    },
    voiceDuration: {
      type: Number,
      default: 0,
    },
    audioUrl: {
      type: String,
      default: '',
    },
    codeSnippet: {
      language: { type: String, default: '' },
      code: { type: String, default: '' },
      title: { type: String, default: '' },
    },
    attachments: [
      {
        url: { type: String, required: true },
        fileType: { type: String, default: 'file' },
        fileName: { type: String, default: '' },
        fileSize: { type: Number, default: 0 },
      },
    ],
    // Quoted / Replied message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    // Emoji Reactions
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        emoji: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // WhatsApp Edit Status
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    // Delete for me vs Delete for everyone
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },
    // Star & Pin
    starredBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    pinnedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Delivery & Read Receipts
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedReason: {
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

messageSchema.index({ group: 1, createdAt: 1 });
messageSchema.index({ sender: 1, recipient: 1, createdAt: 1 });
messageSchema.index({ recipient: 1, sender: 1, createdAt: 1 });

export const Message = mongoose.model('Message', messageSchema);
