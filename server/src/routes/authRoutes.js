import express from 'express';
import { login, logout, getMe } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', authenticateUser, logout);
router.get('/me', authenticateUser, getMe);

export default router;
