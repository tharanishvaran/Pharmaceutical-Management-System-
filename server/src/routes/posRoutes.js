import express from 'express';
import {
  createSaleTransaction,
  getTransactions,
  getTransactionByInvoice
} from '../controllers/posController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

// Process sales transaction: CASHIER and ADMIN
router.post('/checkout', requireRole('CASHIER', 'ADMIN'), createSaleTransaction);

// View transaction history: CASHIER (own), MANAGER, ADMIN
router.get('/transactions', requireRole('CASHIER', 'MANAGER', 'ADMIN', 'CUSTOMER'), getTransactions);
router.get('/transactions/:invoice', getTransactionByInvoice);

export default router;
