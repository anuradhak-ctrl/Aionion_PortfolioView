import express from 'express';
import { verifyToken, requireRole }
  from '../middleware/auth.middleware.js';
import * as userController from '../controllers/user.controller.js';

const router = express.Router();

router.get('/me', verifyToken, userController.getMe);
router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, userController.updateProfile);

router.get('/portfolio', verifyToken, userController.getClientPortfolio);

router.get(
  '/',
  verifyToken,
  requireRole('super_admin', 'director'),
  userController.getAllUsers
);

router.get(
  '/clients',
  verifyToken,
  requireRole('rm', 'branch_manager', 'zonal_head', 'director', 'super_admin'),
  userController.getClients
);

export default router;
