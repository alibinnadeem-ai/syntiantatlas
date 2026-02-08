import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-token', authController.verifyToken);
router.post('/logout', authController.logout);

export default router;
