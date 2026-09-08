import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  addBatch,
  getCategories,
  getInventoryAlerts
} from '../controllers/productController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

// All authenticated roles can search/view product compendium
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/alerts', requireRole('ADMIN', 'PHARMACIST', 'MANAGER'), getInventoryAlerts);
router.get('/:id', getProductById);

// Product modifications: ADMIN and PHARMACIST only
router.post('/', requireRole('ADMIN', 'PHARMACIST'), createProduct);
router.put('/:id', requireRole('ADMIN', 'PHARMACIST'), updateProduct);
router.post('/:id/batches', requireRole('ADMIN', 'PHARMACIST'), addBatch);

export default router;
