import express from 'express';
import {
  getTargets,
  getTargetById,
  createTarget,
  updateTarget,
  getPerformanceSummary
} from '../controllers/targetController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', requireRole('ADMIN', 'MANAGER', 'MEDICAL_REPRESENTATIVE'), getTargets);
router.get('/performance-summary', requireRole('ADMIN', 'MANAGER'), getPerformanceSummary);
router.get('/:id', requireRole('ADMIN', 'MANAGER', 'MEDICAL_REPRESENTATIVE'), getTargetById);

router.post('/', requireRole('ADMIN', 'MANAGER'), createTarget);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), updateTarget);

export default router;
