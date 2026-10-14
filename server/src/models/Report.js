import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['User', 'StudyGroup', 'StudySession', 'StudyMaterial', 'Message'],
      required: [true, 'Resource type is required'],
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Resource ID is required'],
      index: true,
    },
    category: {
      type: String,
      enum: [
        'Spam',
        'Harassment',
        'Inappropriate Content',
        'Copyright / Plagiarism',
        'Academic Dishonesty',
        'Other',
      ],
      required: [true, 'Report category is required'],
      default: 'Other',
    },
    description: {
      type: String,
      required: [true, 'Please provide details for the report'],
      trim: true,
      minlength: 5,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    moderatorNotes: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    resolutionReason: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1, resourceType: 1, resourceId: 1 });

export const Report = mongoose.model('Report', reportSchema);
