import express from 'express';
import * as investmentController from '../controllers/investmentController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, authorize('investor', 'super_admin'), investmentController.investInProperty);
router.get('/portfolio', authenticateToken, authorize('investor', 'super_admin'), investmentController.getInvestorPortfolio);
router.get('/:property_id/investors', investmentController.getPropertyInvestments);

export default router;
