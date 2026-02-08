import express from 'express';
import * as transactionController from '../controllers/transactionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/deposit', authenticateToken, transactionController.depositFunds);
router.post('/withdraw', authenticateToken, transactionController.withdrawFunds);
router.get('/history', authenticateToken, transactionController.getTransactionHistory);

export default router;
