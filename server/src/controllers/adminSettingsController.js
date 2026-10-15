import { PlatformSettings } from '../models/PlatformSettings.js';
import { recordAuditLog } from '../utils/auditLogger.js';

export const getAdminSettings = async (req, res, next) => {
  try {
    const settings = await PlatformSettings.getSettings();
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminSettings = async (req, res, next) => {
  try {
    const {
      maintenanceMode,
      allowStudentRegistration,
      allowGroupCreation,
      allowMaterialUploads,
      requireEmailVerification,
      maxUploadSizeMB,
      systemAnnouncement,
      systemAnnouncementActive,
    } = req.body;

    const settings = await PlatformSettings.getSettings();

    const previousValues = {
      maintenanceMode: settings.maintenanceMode,
      allowStudentRegistration: settings.allowStudentRegistration,
      allowGroupCreation: settings.allowGroupCreation,
      allowMaterialUploads: settings.allowMaterialUploads,
      requireEmailVerification: settings.requireEmailVerification,
      maxUploadSizeMB: settings.maxUploadSizeMB,
      systemAnnouncementActive: settings.systemAnnouncementActive,
    };

    if (maintenanceMode !== undefined) settings.maintenanceMode = Boolean(maintenanceMode);
    if (allowStudentRegistration !== undefined) settings.allowStudentRegistration = Boolean(allowStudentRegistration);
    if (allowGroupCreation !== undefined) settings.allowGroupCreation = Boolean(allowGroupCreation);
    if (allowMaterialUploads !== undefined) settings.allowMaterialUploads = Boolean(allowMaterialUploads);
    if (requireEmailVerification !== undefined) settings.requireEmailVerification = Boolean(requireEmailVerification);
    if (maxUploadSizeMB !== undefined) {
      const parsedSize = Number(maxUploadSizeMB);
      if (parsedSize >= 1 && parsedSize <= 100) {
        settings.maxUploadSizeMB = parsedSize;
      }
    }
    if (systemAnnouncement !== undefined) settings.systemAnnouncement = String(systemAnnouncement).trim();
    if (systemAnnouncementActive !== undefined) settings.systemAnnouncementActive = Boolean(systemAnnouncementActive);

    settings.updatedBy = req.user._id;
    await settings.save();

    await recordAuditLog({
      actor: req.user,
      action: 'PLATFORM_SETTINGS_UPDATE',
      resourceType: 'PlatformSettings',
      resourceId: 'GLOBAL_SETTINGS',
      status: 'SUCCESS',
      details: {
        previous: previousValues,
        updated: {
          maintenanceMode: settings.maintenanceMode,
          allowStudentRegistration: settings.allowStudentRegistration,
          allowGroupCreation: settings.allowGroupCreation,
          allowMaterialUploads: settings.allowMaterialUploads,
          requireEmailVerification: settings.requireEmailVerification,
          maxUploadSizeMB: settings.maxUploadSizeMB,
          systemAnnouncementActive: settings.systemAnnouncementActive,
        },
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Platform settings updated successfully.',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
