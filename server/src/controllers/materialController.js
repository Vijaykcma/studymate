import path from 'path';
import fs from 'fs';
import { StudyMaterial } from '../models/StudyMaterial.js';
import { StudyGroup } from '../models/StudyGroup.js';

export const getMaterials = async (req, res, next) => {
  try {
    const { groupId, search } = req.query;
    let query = {};

    if (groupId) {
      query.group = groupId;
    } else {
      // Find all groups user belongs to
      const userGroups = await StudyGroup.find({ 'members.user': req.user._id }).select('_id');
      const groupIds = userGroups.map((g) => g._id);
      query.group = { $in: groupIds };
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { originalFilename: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const materials = await StudyMaterial.find(query)
      .populate('group', 'name subject')
      .populate('uploader', 'name email department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: materials.length,
      materials,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadMaterial = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please choose a file to upload.',
      });
    }

    const { title, description, group: groupId } = req.body;

    const group = await StudyGroup.findById(groupId);
    if (!group) {
      // Clean up uploaded file if group doesn't exist
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Study group not found.',
      });
    }

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Only members of this study group can upload study materials.',
      });
    }

    const ext = path.extname(req.file.originalname).replace('.', '').toUpperCase();

    const material = await StudyMaterial.create({
      title,
      description: description || '',
      group: groupId,
      uploader: req.user._id,
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      fileType: ext || 'FILE',
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    const populatedMaterial = await StudyMaterial.findById(material._id)
      .populate('group', 'name subject')
      .populate('uploader', 'name email department');

    res.status(201).json({
      success: true,
      message: 'Material uploaded successfully.',
      material: populatedMaterial,
    });
  } catch (error) {
    next(error);
  }
};

export const getMaterialById = async (req, res, next) => {
  try {
    const material = await StudyMaterial.findById(req.params.materialId)
      .populate('group', 'name subject')
      .populate('uploader', 'name email department');

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found.',
      });
    }

    res.status(200).json({
      success: true,
      material,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadMaterial = async (req, res, next) => {
  try {
    const material = await StudyMaterial.findById(req.params.materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found.',
      });
    }

    const group = await StudyGroup.findById(material.group);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Associated group not found.',
      });
    }

    // Verify membership authorization if group is private or restricted
    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (group.visibility === 'private' && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this private study group to download materials.',
      });
    }

    const filePath = path.resolve('uploads', material.storedFilename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File content not found on server.',
      });
    }

    res.download(filePath, material.originalFilename);
  } catch (error) {
    next(error);
  }
};

export const deleteMaterial = async (req, res, next) => {
  try {
    const material = await StudyMaterial.findById(req.params.materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found.',
      });
    }

    const group = await StudyGroup.findById(material.group);

    const isUploader = material.uploader.toString() === req.user._id.toString();
    const isGroupCreator = group && group.creator.toString() === req.user._id.toString();

    if (!isUploader && !isGroupCreator) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this material.',
      });
    }

    const filePath = path.resolve('uploads', material.storedFilename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn('Could not unlink local file:', err.message);
      }
    }

    await StudyMaterial.findByIdAndDelete(req.params.materialId);

    res.status(200).json({
      success: true,
      message: 'Study material deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
