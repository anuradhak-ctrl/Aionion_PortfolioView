/**
 * Admin Controller - User Management APIs
 * 
 * SECURITY: All routes require JWT verification via auth.middleware.js
 * JWT is verified BEFORE this controller is reached
 */

import * as auroraService from '../services/aurora.service.js';

/**
 * Get users by role with pagination
 * GET /api/admin/users?role=client&page=1&limit=50&search=
 */
export const getUsersByRole = async (req, res) => {
    try {
        const { role = 'all', page = 1, limit = 50, search = '' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let users;
        if (search) {
            users = await auroraService.searchUsers(search, role, parseInt(limit));
        } else {
            users = await auroraService.getUsersByRole(
                role === 'all' ? null : role,
                parseInt(limit),
                offset
            );
        }

        // Get counts for stats
        const countResult = await auroraService.getUserCountByRole();
        const roleCounts = {};
        countResult.forEach(row => {
            roleCounts[row.role] = row.count;
        });

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: users.length,
                    hasMore: users.length >= parseInt(limit)
                },
                roleCounts
            }
        });
    } catch (error) {
        console.error('getUsersByRole error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get user statistics (counts by role)
 * GET /api/admin/users/stats
 */
export const getUserStats = async (req, res) => {
    try {
        const countResult = await auroraService.getUserCountByRole();
        const total = await auroraService.getTotalUserCount();

        const roleStats = {};
        countResult.forEach(row => {
            roleStats[row.role] = row.count;
        });

        res.json({
            success: true,
            data: {
                total,
                byRole: roleStats
            }
        });
    } catch (error) {
        console.error('getUserStats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get a single user by ID
 * GET /api/admin/users/:id
 */
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await auroraService.getUserById(parseInt(id));

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('getUserById error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update user status (active/inactive)
 * PATCH /api/admin/users/:id/status
 */
export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isActive must be a boolean'
            });
        }

        const result = await auroraService.updateUserStatus(parseInt(id), isActive);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error('updateUserStatus error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Create a new user
 * POST /api/admin/users
 */
export const createUser = async (req, res) => {
    try {
        const { client_id, email, name, role, phone, branch_code, zone_code } = req.body;

        // Validation
        if (!client_id || !email || !name || !role) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: client_id, email, name, role'
            });
        }

        // Validate role
        const validRoles = ['client', 'rm', 'branch_manager', 'zonal_head', 'super_admin', 'director'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
            });
        }

        const user = await auroraService.createUser({
            client_id, email, name, role, phone, branch_code, zone_code
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user
        });
    } catch (error) {
        console.error('createUser error:', error);

        // Handle duplicate key errors
        if (error.code === '23505') { // PostgreSQL unique violation
            const detail = error.detail || '';
            if (detail.includes('client_id')) {
                return res.status(409).json({
                    success: false,
                    message: 'A user with this client_id already exists'
                });
            }
            if (detail.includes('email')) {
                return res.status(409).json({
                    success: false,
                    message: 'A user with this email already exists'
                });
            }
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update user details
 * PUT /api/admin/users/:id
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, name, role, is_active, phone, branch_code, zone_code } = req.body;

        // Validate at least one field
        if (email === undefined && name === undefined && role === undefined &&
            is_active === undefined && phone === undefined &&
            branch_code === undefined && zone_code === undefined) {
            return res.status(400).json({
                success: false,
                message: 'At least one field must be provided'
            });
        }

        // Validate role if provided
        if (role !== undefined) {
            const validRoles = ['client', 'rm', 'branch_manager', 'zonal_head', 'super_admin', 'director'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
                });
            }
        }

        // Validate email format if provided
        if (email !== undefined && email !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }
        }

        const user = await auroraService.updateUser(parseInt(id), {
            email, name, role, is_active, phone, branch_code, zone_code
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        console.error('updateUser error:', error);

        // Handle duplicate key errors
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'A user with this email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Delete a user
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await auroraService.deleteUser(parseInt(id));

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('deleteUser error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Database health check
 * GET /api/admin/health/db
 */
export const dbHealthCheck = async (req, res) => {
    try {
        const health = await auroraService.healthCheck();

        res.status(health.status === 'healthy' ? 200 : 503).json({
            success: health.status === 'healthy',
            data: health
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            message: 'Database health check failed',
            error: error.message
        });
    }
};
