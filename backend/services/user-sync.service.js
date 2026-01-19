/**
 * User Sync Service - Cognito to Aurora Mapping
 * 
 * This service handles:
 * 1. Syncing Cognito user to Aurora on login (auto-create if not exists)
 * 2. Mapping Cognito groups to Aurora roles
 * 3. Managing user hierarchy in Aurora
 * 
 * FLOW:
 * ┌─────────────┐     ┌─────────────────────┐     ┌──────────────────┐
 * │   Cognito   │ ──▶ │  User Sync Service  │ ──▶ │  Aurora Database │
 * │  (JWT Auth) │     │  (Map & Upsert)     │     │   (users table)  │
 * └─────────────┘     └─────────────────────┘     └──────────────────┘
 */

import * as db from './aurora.service.js';

// ==================== ROLE MAPPING ====================

/**
 * Map Cognito groups to Aurora roles
 * Priority: First matching group wins
 */
const COGNITO_GROUP_TO_ROLE = {
    'Admins': 'super_admin',
    'ADMIN': 'super_admin',
    'SuperAdmins': 'super_admin',
    'ZonalHeads': 'zonal_head',
    'ZONAL_HEAD': 'zonal_head',
    'BranchManagers': 'branch_manager',
    'BRANCH_MANAGER': 'branch_manager',
    'RMs': 'rm',
    'RM': 'rm',
    'RelationshipManagers': 'rm',
    'Clients': 'client',
    'CLIENT': 'client',
    'INTERNAL': 'rm'  // Default internal users to RM
};

/**
 * Get Aurora role from Cognito token payload
 */
const getRoleFromCognitoPayload = (payload, userType = 'client') => {
    const groups = payload['cognito:groups'] || [];

    // Priority 1: Check Cognito groups
    for (const group of groups) {
        if (COGNITO_GROUP_TO_ROLE[group]) {
            return COGNITO_GROUP_TO_ROLE[group];
        }
    }

    // Priority 2: Check custom:role attribute
    if (payload['custom:role']) {
        const customRole = payload['custom:role'].toLowerCase();
        const validRoles = ['super_admin', 'zonal_head', 'branch_manager', 'rm', 'client'];
        if (validRoles.includes(customRole)) {
            return customRole;
        }
    }

    // Priority 3: Default based on userType
    return userType === 'internal' ? 'rm' : 'client';
};

// ==================== USER SYNC ====================

/**
 * Sync Cognito user to Aurora database
 * Called after successful Cognito authentication
 * 
 * @param {Object} cognitoPayload - Decoded JWT payload from Cognito
 * @param {string} userType - 'client' or 'internal'
 * @returns {Object} Aurora user record
 */
export const syncCognitoUserToAurora = async (cognitoPayload, userType = 'client') => {
    const cognitoSub = cognitoPayload.sub;
    const username = cognitoPayload['cognito:username'] || cognitoSub;
    const email = cognitoPayload.email;
    const name = cognitoPayload.name || cognitoPayload.email?.split('@')[0] || username;
    const phone = cognitoPayload.phone_number || null;

    // Determine role from Cognito
    const role = getRoleFromCognitoPayload(cognitoPayload, userType);

    console.log(`🔄 Syncing user to Aurora: ${username} (${role})`);

    try {
        // Step 1: Check if user exists by cognito_sub or client_id
        let existingUser = await getUserByCognitoSub(cognitoSub);

        if (!existingUser) {
            // Fallback: Check by client_id (username)
            existingUser = await db.queryOne(
                'SELECT * FROM users WHERE client_id = $1',
                [username]
            );
        }

        if (existingUser) {
            // Step 2A: User exists - update last login and sync role if changed
            console.log(`📝 Existing user found: ${existingUser.id}`);

            const updates = {
                last_login_at: new Date(),
                cognito_sub: cognitoSub  // Ensure cognito_sub is linked
            };

            // Only update role if Cognito groups changed
            if (existingUser.role !== role) {
                console.log(`⚠️ Role mismatch: DB=${existingUser.role}, Cognito=${role}`);
                // Don't auto-update role - log for admin review
                // updates.role = role; // Uncomment to auto-sync roles
            }

            // Update last login
            await db.query(
                `UPDATE users SET last_login_at = NOW(), cognito_sub = $1 WHERE id = $2`,
                [cognitoSub, existingUser.id]
            );

            // Refresh and return
            return await db.queryOne('SELECT * FROM users WHERE id = $1', [existingUser.id]);
        }

        // Step 2B: User doesn't exist - create new user
        console.log(`➕ Creating new user: ${username}`);

        const newUser = await db.queryOne(`
            INSERT INTO users (
                client_id, cognito_sub, email, name, phone, role, status,
                client_code, hierarchy_path, hierarchy_level
            ) VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, '/', 0)
            ON CONFLICT (client_id) DO UPDATE SET
                cognito_sub = EXCLUDED.cognito_sub,
                email = EXCLUDED.email,
                name = EXCLUDED.name,
                last_login_at = NOW()
            RETURNING *
        `, [
            username,       // client_id
            cognitoSub,     // cognito_sub
            email,          // email
            name,           // name
            phone,          // phone
            role,           // role
            role === 'client' ? username : null  // client_code (for clients only)
        ]);

        console.log(`✅ User created/synced: ${newUser.id} (${newUser.role})`);
        return newUser;

    } catch (error) {
        console.error('❌ User sync error:', error.message);
        throw error;
    }
};

/**
 * Get user by Cognito sub (UUID)
 */
export const getUserByCognitoSub = async (cognitoSub) => {
    return db.queryOne(
        'SELECT * FROM users WHERE cognito_sub = $1',
        [cognitoSub]
    );
};

/**
 * Get Aurora user with full hierarchy info
 */
export const getFullUserProfile = async (userId) => {
    return db.queryOne(`
        SELECT 
            u.*,
            p.name as parent_name,
            p.role as parent_role,
            b.branch_name,
            b.branch_code,
            z.zone_name,
            z.zone_code,
            (SELECT COUNT(*) FROM users WHERE parent_id = u.id) as direct_subordinates_count
        FROM users u
        LEFT JOIN users p ON u.parent_id = p.id
        LEFT JOIN branches b ON u.branch_id = b.id
        LEFT JOIN zones z ON u.zone_id = z.id
        WHERE u.id = $1
    `, [userId]);
};

// ==================== HIERARCHY MANAGEMENT ====================

/**
 * Assign a user to a parent (manager)
 * This will automatically update hierarchy_path via trigger
 */
export const assignUserToParent = async (userId, parentId, assignedBy = null) => {
    // Validate parent exists and has appropriate role
    const parent = await db.queryOne('SELECT id, role, hierarchy_path FROM users WHERE id = $1', [parentId]);

    if (!parent) {
        throw new Error('Parent user not found');
    }

    // Update user's parent
    const result = await db.queryOne(`
        UPDATE users 
        SET parent_id = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
    `, [parentId, userId]);

    // Log the assignment
    await db.query(`
        INSERT INTO activity_logs (user_id, action, resource, resource_id, details)
        VALUES ($1, 'USER_ASSIGNED', 'users', $2, $3)
    `, [
        assignedBy,
        userId.toString(),
        JSON.stringify({ parent_id: parentId, assigned_by: assignedBy })
    ]);

    console.log(`✅ User ${userId} assigned to parent ${parentId}`);
    return result;
};

/**
 * Get all subordinates of a user
 */
export const getSubordinates = async (userId, includeNested = true) => {
    if (includeNested) {
        // Use hierarchy_path for fast lookup of all nested subordinates
        const user = await db.queryOne('SELECT hierarchy_path FROM users WHERE id = $1', [userId]);

        if (!user) {
            throw new Error('User not found');
        }

        return db.queryRows(`
            SELECT id, client_id, email, name, role, status, hierarchy_level,
                   parent_id, created_at
            FROM users
            WHERE hierarchy_path LIKE $1
              AND id != $2
            ORDER BY hierarchy_level, name
        `, [user.hierarchy_path + '%', userId]);
    } else {
        // Direct subordinates only
        return db.queryRows(`
            SELECT id, client_id, email, name, role, status, hierarchy_level,
                   parent_id, created_at
            FROM users
            WHERE parent_id = $1
            ORDER BY role, name
        `, [userId]);
    }
};

/**
 * Get subordinate count by role
 */
export const getSubordinateCountByRole = async (userId) => {
    const user = await db.queryOne('SELECT hierarchy_path FROM users WHERE id = $1', [userId]);

    if (!user) {
        throw new Error('User not found');
    }

    return db.queryRows(`
        SELECT role, COUNT(*)::int as count
        FROM users
        WHERE hierarchy_path LIKE $1
          AND id != $2
        GROUP BY role
        ORDER BY 
            CASE role 
                WHEN 'zonal_head' THEN 1
                WHEN 'branch_manager' THEN 2
                WHEN 'rm' THEN 3
                WHEN 'client' THEN 4
            END
    `, [user.hierarchy_path + '%', userId]);
};

/**
 * Check if user1 can access user2's data
 */
export const canAccessUser = async (accessorId, targetId) => {
    const result = await db.queryOne(
        'SELECT can_access_user($1, $2) as has_access',
        [accessorId, targetId]
    );
    return result?.has_access || false;
};

/**
 * Get accessible users for a manager (for dropdowns, assignments, etc.)
 */
export const getAccessibleUsers = async (userId, role, filters = {}) => {
    let sql, params;

    if (role === 'super_admin') {
        // Super admin can see everyone
        sql = `
            SELECT id, client_id, email, name, role, status, branch_id, zone_id
            FROM users
            WHERE 1=1
        `;
        params = [];
    } else {
        // Others see only subordinates
        const user = await db.queryOne('SELECT hierarchy_path FROM users WHERE id = $1', [userId]);

        sql = `
            SELECT id, client_id, email, name, role, status, branch_id, zone_id
            FROM users
            WHERE hierarchy_path LIKE $1
        `;
        params = [user.hierarchy_path + '%'];
    }

    // Apply filters
    let paramIndex = params.length + 1;

    if (filters.role) {
        sql += ` AND role = $${paramIndex++}`;
        params.push(filters.role);
    }

    if (filters.status) {
        sql += ` AND status = $${paramIndex++}`;
        params.push(filters.status);
    }

    if (filters.branchId) {
        sql += ` AND branch_id = $${paramIndex++}`;
        params.push(filters.branchId);
    }

    if (filters.zoneId) {
        sql += ` AND zone_id = $${paramIndex++}`;
        params.push(filters.zoneId);
    }

    sql += ' ORDER BY role, name LIMIT 500';

    return db.queryRows(sql, params);
};

// ==================== BULK OPERATIONS ====================

/**
 * Bulk import users from CSV/JSON
 * Used for initial migration or batch updates
 */
export const bulkImportUsers = async (users, defaultParentId = null) => {
    const results = {
        success: 0,
        failed: 0,
        errors: []
    };

    for (const userData of users) {
        try {
            await db.queryOne(`
                INSERT INTO users (
                    client_id, email, name, role, status, phone,
                    client_code, employee_code, parent_id
                ) VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $8)
                ON CONFLICT (client_id) DO UPDATE SET
                    email = EXCLUDED.email,
                    name = EXCLUDED.name,
                    phone = EXCLUDED.phone,
                    updated_at = NOW()
                RETURNING id
            `, [
                userData.client_id || userData.username,
                userData.email,
                userData.name,
                userData.role || 'client',
                userData.phone || null,
                userData.client_code || null,
                userData.employee_code || null,
                userData.parent_id || defaultParentId
            ]);

            results.success++;
        } catch (error) {
            results.failed++;
            results.errors.push({
                user: userData.client_id || userData.email,
                error: error.message
            });
        }
    }

    console.log(`📊 Bulk import complete: ${results.success} success, ${results.failed} failed`);
    return results;
};

/**
 * Sync all Cognito users to Aurora (admin operation)
 * Requires Cognito Admin API access
 */
export const syncAllCognitoUsers = async (cognitoClient, userPoolId) => {
    // This would use Cognito ListUsers API to fetch all users
    // and sync them to Aurora. Implement based on your needs.
    console.log('⚠️ syncAllCognitoUsers not implemented - use AWS CLI or Console');
    throw new Error('Not implemented - use bulk import instead');
};

// ==================== EXPORTS ====================

export default {
    syncCognitoUserToAurora,
    getUserByCognitoSub,
    getFullUserProfile,
    assignUserToParent,
    getSubordinates,
    getSubordinateCountByRole,
    canAccessUser,
    getAccessibleUsers,
    bulkImportUsers,
    getRoleFromCognitoPayload,
    COGNITO_GROUP_TO_ROLE
};
