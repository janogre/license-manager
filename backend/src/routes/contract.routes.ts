import { Router } from 'express';
import {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  getExpiringContracts,
  assignContractToAsset,
  unassignContractFromAsset,
  unassignContractFromLicense,
} from '../controllers/contract.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', getContracts);
router.get('/expiring', getExpiringContracts);
router.get('/:id', getContractById);
router.post('/', authorize(UserRole.ADMIN, UserRole.EDITOR), createContract);
router.put('/:id', authorize(UserRole.ADMIN, UserRole.EDITOR), updateContract);
router.delete('/:id', authorize(UserRole.ADMIN), deleteContract);
router.post('/:id/assign', authorize(UserRole.ADMIN, UserRole.EDITOR), assignContractToAsset);
router.delete('/:id/unassign/:assetId', authorize(UserRole.ADMIN, UserRole.EDITOR), unassignContractFromAsset);
router.delete('/:id/unassign-license/:licenseId', authorize(UserRole.ADMIN, UserRole.EDITOR), unassignContractFromLicense);

export default router;
