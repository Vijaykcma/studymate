import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    singletonId: {
      type: String,
      default: 'GLOBAL_SETTINGS',
      unique: true,
      immutable: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    allowStudentRegistration: {
      type: Boolean,
      default: true,
    },
    allowGroupCreation: {
      type: Boolean,
      default: true,
    },
    allowMaterialUploads: {
      type: Boolean,
      default: true,
    },
    requireEmailVerification: {
      type: Boolean,
      default: true,
    },
    maxUploadSizeMB: {
      type: Number,
      default: 15,
      min: 1,
      max: 100,
    },
    systemAnnouncement: {
      type: String,
      default: '',
      maxlength: 500,
    },
    systemAnnouncementActive: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

platformSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ singletonId: 'GLOBAL_SETTINGS' });
  if (!settings) {
    settings = await this.create({ singletonId: 'GLOBAL_SETTINGS' });
  }
  return settings;
};

export const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);
