import express from 'express';
import { getActivities, createActivity } from '../controllers/activityController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', requireRole('ADMIN', 'MANAGER', 'MEDICAL_REPRESENTATIVE', 'DOCTOR'), getActivities);
router.post('/', requireRole('ADMIN', 'MEDICAL_REPRESENTATIVE'), createActivity);

export default router;
