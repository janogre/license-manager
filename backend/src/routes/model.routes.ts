import { Router } from 'express';
import {
  getModels,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
} from '../controllers/model.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', getModels);
router.get('/:id', getModelById);
router.post('/', authorize(UserRole.ADMIN, UserRole.EDITOR), createModel);
router.put('/:id', authorize(UserRole.ADMIN, UserRole.EDITOR), updateModel);
router.delete('/:id', authorize(UserRole.ADMIN), deleteModel);

export default router;
