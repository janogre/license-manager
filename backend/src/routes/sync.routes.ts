import { Router } from 'express';
import { triggerObserviumSync, getSyncLogs } from '../controllers/sync.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post('/observium', authorize(UserRole.ADMIN), triggerObserviumSync);
router.get('/logs', getSyncLogs);

export default router;
