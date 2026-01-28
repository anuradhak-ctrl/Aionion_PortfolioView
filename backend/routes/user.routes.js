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

/**
 * GET /api/users/me/subordinates
 * Get all subordinates of the current user (with mock data for development)
 */
router.get('/me/subordinates', authGuard, async (req, res) => {
  try {
    const userRole = req.user?.role;

    // Mock data for development - returns hierarchical data based on user role
    const mockSubordinates = [];

    // For ZM: return BMs, RMs, and Clients
    if (userRole === 'zonal_head' || userRole === 'zh') {
      // 2 Branch Managers
      mockSubordinates.push(
        { id: 101, client_id: 'BM001', name: 'Arun Sharma', email: 'arun.sharma@example.com', role: 'branch_manager', status: 'active', parent_id: null },
        { id: 102, client_id: 'BM002', name: 'Deepika Menon', email: 'deepika.menon@example.com', role: 'branch_manager', status: 'active', parent_id: null }
      );

      // 2 RMs under each BM
      mockSubordinates.push(
        { id: 201, client_id: 'RM001', name: 'Vikram Singh', email: 'vikram.singh@example.com', role: 'rm', status: 'active', parent_id: 101 },
        { id: 202, client_id: 'RM002', name: 'Anita Desai', email: 'anita.desai@example.com', role: 'rm', status: 'active', parent_id: 101 },
        { id: 203, client_id: 'RM003', name: 'Suresh Rao', email: 'suresh.rao@example.com', role: 'rm', status: 'active', parent_id: 102 },
        { id: 204, client_id: 'RM004', name: 'Meera Joshi', email: 'meera.joshi@example.com', role: 'rm', status: 'active', parent_id: 102 }
      );

      // 3 Clients under each RM
      const clientData = [
        { id: 301, client_id: 'CL0001', name: 'Aarav Sharma', email: 'aarav.sharma@client.com', parent_id: 201 },
        { id: 302, client_id: 'CL0002', name: 'Aditi Patel', email: 'aditi.patel@client.com', parent_id: 201 },
        { id: 303, client_id: 'CL0003', name: 'Arjun Kumar', email: 'arjun.kumar@client.com', parent_id: 201 },
        { id: 304, client_id: 'CL0004', name: 'Diya Reddy', email: 'diya.reddy@client.com', parent_id: 202 },
        { id: 305, client_id: 'CL0005', name: 'Ishaan Verma', email: 'ishaan.verma@client.com', parent_id: 202 },
        { id: 306, client_id: 'CL0006', name: 'Kiara Nair', email: 'kiara.nair@client.com', parent_id: 202 },
        { id: 307, client_id: 'CL0007', name: 'Navya Iyer', email: 'navya.iyer@client.com', parent_id: 203 },
        { id: 308, client_id: 'CL0008', name: 'Reyansh Gupta', email: 'reyansh.gupta@client.com', parent_id: 203 },
        { id: 309, client_id: 'CL0009', name: 'Sara Mehta', email: 'sara.mehta@client.com', parent_id: 203 },
        { id: 310, client_id: 'CL0010', name: 'Vihaan Shah', email: 'vihaan.shah@client.com', parent_id: 204 },
        { id: 311, client_id: 'CL0011', name: 'Aanya Chopra', email: 'aanya.chopra@client.com', parent_id: 204 },
        { id: 312, client_id: 'CL0012', name: 'Kabir Malhotra', email: 'kabir.malhotra@client.com', parent_id: 204 }
      ];

      clientData.forEach(client => {
        mockSubordinates.push({ ...client, role: 'client', status: 'active' });
      });
    }

    // For BM: return RMs and Clients
    else if (userRole === 'branch_manager' || userRole === 'bm') {
      // 2 RMs
      mockSubordinates.push(
        { id: 201, client_id: 'RM001', name: 'Vikram Singh', email: 'vikram.singh@example.com', role: 'rm', status: 'active', parent_id: null },
        { id: 202, client_id: 'RM002', name: 'Anita Desai', email: 'anita.desai@example.com', role: 'rm', status: 'active', parent_id: null }
      );

      // 3 Clients under each RM
      const clientData = [
        { id: 301, client_id: 'CL0001', name: 'Aarav Sharma', email: 'aarav.sharma@client.com', parent_id: 201 },
        { id: 302, client_id: 'CL0002', name: 'Aditi Patel', email: 'aditi.patel@client.com', parent_id: 201 },
        { id: 303, client_id: 'CL0003', name: 'Arjun Kumar', email: 'arjun.kumar@client.com', parent_id: 201 },
        { id: 304, client_id: 'CL0004', name: 'Diya Reddy', email: 'diya.reddy@client.com', parent_id: 202 },
        { id: 305, client_id: 'CL0005', name: 'Ishaan Verma', email: 'ishaan.verma@client.com', parent_id: 202 },
        { id: 306, client_id: 'CL0006', name: 'Kiara Nair', email: 'kiara.nair@client.com', parent_id: 202 }
      ];

      clientData.forEach(client => {
        mockSubordinates.push({ ...client, role: 'client', status: 'active' });
      });
    }

    // For RM: return Clients only
    else if (userRole === 'rm' || userRole === 'relationship_manager') {
      const clientData = [
        { id: 301, client_id: 'CL0001', name: 'Aarav Sharma', email: 'aarav.sharma@client.com' },
        { id: 302, client_id: 'CL0002', name: 'Aditi Patel', email: 'aditi.patel@client.com' },
        { id: 303, client_id: 'CL0003', name: 'Arjun Kumar', email: 'arjun.kumar@client.com' },
        { id: 304, client_id: 'CL0004', name: 'Diya Reddy', email: 'diya.reddy@client.com' },
        { id: 305, client_id: 'CL0005', name: 'Ishaan Verma', email: 'ishaan.verma@client.com' },
        { id: 306, client_id: 'CL0006', name: 'Kiara Nair', email: 'kiara.nair@client.com' }
      ];

      clientData.forEach(client => {
        mockSubordinates.push({ ...client, role: 'client', status: 'active', parent_id: null });
      });
    }

    res.json({
      success: true,
      data: mockSubordinates,
      count: mockSubordinates.length
    });
  } catch (error) {
    console.error('❌ Get /me/subordinates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subordinates'
    });
  }
});

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

