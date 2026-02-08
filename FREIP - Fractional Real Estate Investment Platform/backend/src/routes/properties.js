import express from 'express';
import * as propertyController from '../controllers/propertyController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyById);
router.post('/', authenticateToken, authorize('seller', 'super_admin'), propertyController.createProperty);
router.put('/:id', authenticateToken, authorize('seller', 'super_admin'), propertyController.updateProperty);
router.get('/seller/my-properties', authenticateToken, propertyController.getSellerProperties);

export default router;
