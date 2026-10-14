import path from 'path';
import fs from 'fs';
import { StudyMaterial } from '../models/StudyMaterial.js';
import { recordAuditLog } from '../utils/auditLogger.js';

export const getAdminMaterials = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      fileType = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { originalFilename: searchRegex }, { description: searchRegex }];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (fileType && fileType !== 'all') {
      query.fileType = fileType.toUpperCase();
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const allowedSort = ['title', 'createdAt', 'fileSize', 'status', 'fileType'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';

    const [materials, totalCount] = await Promise.all([
      StudyMaterial.find(query)
        .populate('uploader', 'name email department')
        .populate('group', 'name subject')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum),
      StudyMaterial.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        materials,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum) || 1,
          totalMaterials: totalCount,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMaterialStatusByAdmin = async (req, res, next) => {
  try {
    const { materialId } = req.params;
    const { status, quarantinedReason = '' } = req.body;

    const allowedStatuses = ['active', 'quarantined', 'removed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const material = await StudyMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found.',
      });
    }

    const oldStatus = material.status;
    material.status = status;
    material.quarantinedReason = quarantinedReason.trim();
    material.moderatedBy = req.user._id;
    await material.save();

    await recordAuditLog({
      actor: req.user,
      action: status === 'quarantined' ? 'MATERIAL_QUARANTINED' : 'MATERIAL_STATUS_UPDATE',
      resourceType: 'StudyMaterial',
      resourceId: String(material._id),
      status: 'SUCCESS',
      details: {
        title: material.title,
        filename: material.originalFilename,
        oldStatus,
        newStatus: status,
        reason: material.quarantinedReason,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Material status updated to "${status}".`,
      material,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMaterialByAdmin = async (req, res, next) => {
  try {
    const { materialId } = req.params;

    const material = await StudyMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found.',
      });
    }

    // Securely delete file from disk if present
    const uploadsFolder = path.resolve('uploads');
    const safePath = path.join(uploadsFolder, path.basename(material.storedFilename));

    if (safePath.startsWith(uploadsFolder) && fs.existsSync(safePath)) {
      try {
        fs.unlinkSync(safePath);
      } catch (err) {
        console.warn(`[Material Delete Warning]: Could not unlink file: ${err.message}`);
      }
    }

    await StudyMaterial.findByIdAndDelete(material._id);

    await recordAuditLog({
      actor: req.user,
      action: 'MATERIAL_DELETE',
      resourceType: 'StudyMaterial',
      resourceId: String(material._id),
      status: 'SUCCESS',
      details: {
        title: material.title,
        originalFilename: material.originalFilename,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Study material was permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

export const downloadMaterialByAdmin = async (req, res, next) => {
  try {
    const { materialId } = req.params;

    const material = await StudyMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found.',
      });
    }

    const uploadsDir = path.resolve('uploads');
    const filename = path.basename(material.storedFilename);
    const targetFile = path.join(uploadsDir, filename);

    // Path traversal check
    if (!targetFile.startsWith(uploadsDir) || !fs.existsSync(targetFile)) {
      return res.status(404).json({
        success: false,
        message: 'File content does not exist on server.',
      });
    }

    res.download(targetFile, material.originalFilename);
  } catch (error) {
    next(error);
  }
};
