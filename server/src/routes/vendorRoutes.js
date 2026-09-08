import express from 'express';
import { getVendors, getVendorById, createVendor, updateVendor } from '../controllers/vendorController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', requireRole('ADMIN', 'MANAGER', 'VENDOR'), getVendors);
router.get('/:id', requireRole('ADMIN', 'MANAGER', 'VENDOR'), getVendorById);
router.post('/', requireRole('ADMIN'), createVendor);
router.put('/:id', requireRole('ADMIN', 'VENDOR'), updateVendor);

export default router;
