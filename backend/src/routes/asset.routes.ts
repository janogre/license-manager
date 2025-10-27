import { Router } from 'express';
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetLicenses,
  getAssetContracts,
} from '../controllers/asset.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAssets);
router.get('/:id', getAssetById);
router.post('/', authorize(UserRole.ADMIN, UserRole.EDITOR), createAsset);
router.put('/:id', authorize(UserRole.ADMIN, UserRole.EDITOR), updateAsset);
router.delete('/:id', authorize(UserRole.ADMIN), deleteAsset);
router.get('/:id/licenses', getAssetLicenses);
router.get('/:id/contracts', getAssetContracts);

export default router;
