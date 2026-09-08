import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  getRoles
} from '../controllers/userController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

// Roles allowed to view users
router.get('/', requireRole('ADMIN', 'MANAGER'), getUsers);
router.get('/roles', requireRole('ADMIN'), getRoles);
router.get('/:id', requireRole('ADMIN', 'MANAGER'), getUserById);

// Admin-only mutation endpoints
router.post('/', requireRole('ADMIN'), createUser);
router.put('/:id', requireRole('ADMIN'), updateUser);
router.patch('/:id/status', requireRole('ADMIN'), toggleUserStatus);

export default router;
