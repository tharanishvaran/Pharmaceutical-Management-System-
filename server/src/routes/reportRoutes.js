import express from 'express';
import {
  getOrganizationOverview,
  getUserReport,
  getProductReport,
  getSalesReport,
  getRepresentativeReport,
  getVendorReport
} from '../controllers/reportController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/overview', requireRole('ADMIN', 'MANAGER'), getOrganizationOverview);
router.get('/users', requireRole('ADMIN', 'MANAGER'), getUserReport);
router.get('/products', requireRole('ADMIN', 'MANAGER', 'PHARMACIST'), getProductReport);
router.get('/sales', requireRole('ADMIN', 'MANAGER'), getSalesReport);
router.get('/representatives', requireRole('ADMIN', 'MANAGER'), getRepresentativeReport);
router.get('/vendors', requireRole('ADMIN', 'MANAGER'), getVendorReport);

export default router;
