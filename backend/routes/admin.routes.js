// Admin Routes - User Management
import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import * as adminController from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes require authentication and admin role
const adminAuth = [verifyToken, requireRole('super_admin', 'director')];

// GET /api/admin/users - Get users by role with pagination
router.get('/users', adminAuth, adminController.getUsersByRole);

// GET /api/admin/users/stats - Get user statistics
router.get('/users/stats', adminAuth, adminController.getUserStats);

// GET /api/admin/users/:id - Get single user
router.get('/users/:id', adminAuth, adminController.getUserById);

// POST /api/admin/users - Create new user
router.post('/users', adminAuth, adminController.createUser);

// PATCH /api/admin/users/:id/status - Update user status
router.patch('/users/:id/status', adminAuth, adminController.updateUserStatus);

// PUT /api/admin/users/:id - Update user details
router.put('/users/:id', adminAuth, adminController.updateUser);

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', adminAuth, adminController.deleteUser);

// GET /api/admin/health/db - Database health check
router.get('/health/db', adminAuth, adminController.dbHealthCheck);

export default router;
