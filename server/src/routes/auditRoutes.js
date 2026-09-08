import express from 'express';
import { getAuditLogs, getAuditModules } from '../controllers/auditController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateUser);
// Only authorized administrators can view audit logs
router.use(requireRole('ADMIN'));

router.get('/', getAuditLogs);
router.get('/modules', getAuditModules);

export default router;
