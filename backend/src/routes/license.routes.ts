import { Router } from 'express';
import {
  getLicenses,
  getLicenseById,
  createLicense,
  updateLicense,
  deleteLicense,
  assignLicenseToAsset,
  unassignLicenseFromAsset,
} from '../controllers/license.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', getLicenses);
router.get('/:id', getLicenseById);
router.post('/', authorize(UserRole.ADMIN, UserRole.EDITOR), createLicense);
router.put('/:id', authorize(UserRole.ADMIN, UserRole.EDITOR), updateLicense);
router.delete('/:id', authorize(UserRole.ADMIN), deleteLicense);
router.post('/:id/assign', authorize(UserRole.ADMIN, UserRole.EDITOR), assignLicenseToAsset);
router.delete('/:id/unassign/:assetId', authorize(UserRole.ADMIN, UserRole.EDITOR), unassignLicenseFromAsset);

export default router;
