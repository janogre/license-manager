import { Router } from 'express';
import {
  getInstallBaseReport,
  getCoverageGapReport,
  getCostReport,
} from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/install-base', getInstallBaseReport);
router.get('/coverage-gap', getCoverageGapReport);
router.get('/cost', getCostReport);

export default router;
