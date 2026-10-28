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
      enum: ['text', 'voice', 'code', 'file'],
      default: 'text',
    },
    voiceDuration: {
      type: Number,
      default: 0,
    },
    codeSnippet: {
      language: { type: String, default: '' },
      code: { type: String, default: '' },
      title: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'read',
    },
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

