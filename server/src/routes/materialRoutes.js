import express from 'express';
import {
  getMaterials,
  uploadMaterial,
  getMaterialById,
  downloadMaterial,
  deleteMaterial,
} from '../controllers/materialController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getMaterials);
router.post('/', upload.single('file'), uploadMaterial);
router.get('/:materialId', getMaterialById);
router.get('/:materialId/download', downloadMaterial);
router.delete('/:materialId', deleteMaterial);

export default router;
