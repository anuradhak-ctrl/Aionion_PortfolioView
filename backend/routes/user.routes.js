import express from 'express';
import { authGuard, requireRole, requireMFA }
  from '../middleware/auth.middleware.js';
import * as userController from '../controllers/user.controller.js';
import * as userSync from '../auth/user-sync.service.js';
import { userRepo } from '../aurora/index.js';

const router = express.Router();

// ==================== EXISTING ROUTES ====================

router.get('/me', authGuard, userController.getMe);
router.get('/profile', authGuard, userController.getProfile);
router.put('/profile', authGuard, userController.updateProfile);

router.get('/portfolio', authGuard, userController.getClientPortfolio);
router.post('/portfolio/refresh', authGuard, userController.refreshClientPortfolio);
router.get('/ledger', authGuard, userController.getLedger);

router.get(
  '/',
  authGuard,
  requireRole('super_admin', 'director'),
  userController.getAllUsers
);

router.get(
  '/clients',
  authGuard,
  requireRole('rm', 'branch_manager', 'zonal_head', 'director', 'super_admin'),
  userController.getClients
);

// ==================== AURORA HIERARCHY ROUTES ====================

/**
 * GET /api/users/me/aurora-profile
 * Get current user's full profile from Aurora with hierarchy info
 */
router.get('/me/aurora-profile', authGuard, async (req, res) => {
  try {
    // authGuard already fetched user from Aurora - get full profile
    const userId = req.user.id;

    const fullProfile = await userSync.getFullUserProfile(userId);

    res.json({
      success: true,
      data: fullProfile
    });
  } catch (error) {
    console.error('❌ Get Aurora profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile from Aurora'
    });
  }
});

/**
 * GET /api/users/stats
 * Get user statistics (for dashboard)
 */
router.get('/stats', authGuard, async (req, res) => {
  try {
    // authGuard provides Aurora user data directly
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    let stats;

    if (requesterRole === 'super_admin') {
      const [total, byRole] = await Promise.all([
        userRepo.count(),
        userRepo.countByRole()
      ]);

      stats = {
        total,
        byRole: byRole.reduce((acc, item) => {
          acc[item.role] = item.count;
          return acc;
        }, {})
      };
    } else if (requesterId) {
      const subordinateCounts = await userSync.getSubordinateCountByRole(requesterId);
      const total = subordinateCounts.reduce((sum, item) => sum + item.count, 0);

      stats = {
        total,
        byRole: subordinateCounts.reduce((acc, item) => {
          acc[item.role] = item.count;
          return acc;
        }, {})
      };
    } else {
      stats = { total: 0, byRole: {} };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
});

/**
 * GET /api/users/:id/subordinates
 * Get all subordinates of a user
 */
router.get('/:id/subordinates', authGuard, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { nested = 'true' } = req.query;

    const subordinates = await userSync.getSubordinates(userId, nested === 'true');

    res.json({
      success: true,
      data: subordinates,
      count: subordinates.length
    });
  } catch (error) {
    console.error('❌ Get subordinates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subordinates'
    });
  }
});

/**
 * POST /api/users/:id/assign
 * Assign user to a parent (manager)
 */
router.post('/:id/assign', authGuard, requireRole('super_admin', 'zonal_head', 'branch_manager'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { parent_id } = req.body;
    const assignedBy = req.user?.auroraId;

    if (!parent_id) {
      return res.status(400).json({
        success: false,
        message: 'parent_id is required'
      });
    }

    const result = await userSync.assignUserToParent(userId, parent_id, assignedBy);

    res.json({
      success: true,
      data: result,
      message: 'User assigned successfully'
    });
  } catch (error) {
    console.error('❌ Assign user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign user'
    });
  }
});

/**
 * GET /api/users/accessible
 * Get all users accessible by current user (for dropdowns)
 */
router.get('/accessible', authGuard, async (req, res) => {
  try {
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    const { role, status } = req.query;

    const users = await userSync.getAccessibleUsers(requesterId, requesterRole, {
      role,
      status
    });

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('❌ Get accessible users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accessible users'
    });
  }
});

/**
 * POST /api/users/bulk-import
 * Import multiple users from JSON (admin only)
 */
router.post('/bulk-import', authGuard, requireRole('super_admin'), async (req, res) => {
  try {
    const { users, default_parent_id } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'users array is required'
      });
    }

    const result = await userSync.bulkImportUsers(users, default_parent_id);

    res.json({
      success: true,
      data: result,
      message: `Imported ${result.success} users, ${result.failed} failed`
    });
  } catch (error) {
    console.error('❌ Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import users'
    });
  }
});

export default router;

