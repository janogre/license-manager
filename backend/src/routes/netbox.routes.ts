import { Router } from 'express';
import {
  getSites,
  getLocations,
  getRacks,
  getRackElevation,
  syncNetbox,
} from '../controllers/netbox.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Get Netbox data
router.get('/sites', getSites);
router.get('/locations', getLocations);
router.get('/racks', getRacks);
router.get('/racks/:id/elevation', getRackElevation);

// Trigger manual sync (admin only)
router.post('/sync', authorize(UserRole.ADMIN), syncNetbox);

export default router;
