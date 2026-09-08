import express from 'express';
import { getDoctors, getDoctorById, createDoctor, updateDoctor } from '../controllers/doctorController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', requireRole('ADMIN', 'MANAGER', 'MEDICAL_REPRESENTATIVE', 'DOCTOR'), getDoctors);
router.get('/:id', requireRole('ADMIN', 'MANAGER', 'MEDICAL_REPRESENTATIVE', 'DOCTOR'), getDoctorById);
router.post('/', requireRole('ADMIN'), createDoctor);
router.put('/:id', requireRole('ADMIN', 'DOCTOR'), updateDoctor);

export default router;
