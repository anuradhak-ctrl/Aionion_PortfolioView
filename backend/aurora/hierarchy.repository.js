/**
 * Hierarchy Repository
 * 
 * Handles: User hierarchy queries (subordinates, ancestors, access control)
 * Pure data access layer - no business logic
 */

import { query, queryRows, queryOne } from './connection.js';

// ==================== HIERARCHY QUERIES ====================

/**
 * Get user's hierarchy path and level
 */
export const getHierarchyInfo = async (userId) => {
    const sql = `
        SELECT id, hierarchy_path, hierarchy_level, parent_id, role
        FROM users
        WHERE id = $1
    `;
    return queryOne(sql, [userId]);
};

/**
 * Get all subordinates using hierarchy_path (fast)
 */
export const findSubordinates = async (userId, includeNested = true) => {
    const user = await getHierarchyInfo(userId);

    if (!user) {
        throw new Error('User not found');
    }

    if (includeNested) {
        // All subordinates at any level
        const sql = `
            SELECT id, client_id, email, name, role, status, 
                   hierarchy_level, parent_id, branch_id, zone_id,
                   created_at
            FROM users
            WHERE hierarchy_path LIKE $1
              AND id != $2
            ORDER BY hierarchy_level, name
        `;
        return queryRows(sql, [user.hierarchy_path + '%', userId]);
    } else {
        // Direct subordinates only
        const sql = `
            SELECT id, client_id, email, name, role, status,
                   hierarchy_level, parent_id, branch_id, zone_id,
                   created_at
            FROM users
            WHERE parent_id = $1
            ORDER BY role, name
        `;
        return queryRows(sql, [userId]);
    }
};

/**
 * Count subordinates by role
 */
export const countSubordinatesByRole = async (userId) => {
    const user = await getHierarchyInfo(userId);

    if (!user) {
        throw new Error('User not found');
    }

    const sql = `
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
    `;
    return queryRows(sql, [user.hierarchy_path + '%', userId]);
};

/**
 * Get all ancestors (managers up the chain)
 */
export const findAncestors = async (userId) => {
    const sql = `
        WITH RECURSIVE ancestors AS (
            SELECT id, name, role, hierarchy_level, parent_id
            FROM users
            WHERE id = (SELECT parent_id FROM users WHERE id = $1)
            
            UNION ALL
            
            SELECT u.id, u.name, u.role, u.hierarchy_level, u.parent_id
            FROM users u
            INNER JOIN ancestors a ON u.id = a.parent_id
        )
        SELECT id, name, role, hierarchy_level
        FROM ancestors
        ORDER BY hierarchy_level
    `;
    return queryRows(sql, [userId]);
};

/**
 * Get parent (direct manager)
 */
export const findParent = async (userId) => {
    const sql = `
        SELECT p.id, p.client_id, p.name, p.role, p.email
        FROM users u
        JOIN users p ON u.parent_id = p.id
        WHERE u.id = $1
    `;
    return queryOne(sql, [userId]);
};

// ==================== ACCESS CONTROL ====================

/**
 * Check if accessor can access target user's data
 */
export const canAccess = async (accessorId, targetId) => {
    // Same user - always allowed
    if (accessorId === targetId) {
        return true;
    }

    const accessor = await getHierarchyInfo(accessorId);

    if (!accessor) {
        return false;
    }

    // Super admin can access everyone
    if (accessor.role === 'super_admin') {
        return true;
    }

    // Check if target is a subordinate
    const target = await getHierarchyInfo(targetId);

    if (!target) {
        return false;
    }

    // Target's path should start with accessor's path
    return target.hierarchy_path.startsWith(accessor.hierarchy_path);
};

/**
 * Get all users accessible by accessor
 */
export const findAccessibleUsers = async (accessorId, role, filters = {}) => {
    const accessor = await getHierarchyInfo(accessorId);

    if (!accessor) {
        return [];
    }

    let sql, params;

    if (accessor.role === 'super_admin') {
        sql = `
            SELECT id, client_id, email, name, role, status, branch_id, zone_id
            FROM users
            WHERE 1=1
        `;
        params = [];
    } else {
        sql = `
            SELECT id, client_id, email, name, role, status, branch_id, zone_id
            FROM users
            WHERE hierarchy_path LIKE $1
        `;
        params = [accessor.hierarchy_path + '%'];
    }

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

    return queryRows(sql, params);
};

// ==================== HIERARCHY UPDATES ====================

/**
 * Assign user to parent
 */
export const assignParent = async (userId, parentId) => {
    const sql = `
        UPDATE users 
        SET parent_id = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, parent_id, hierarchy_path, hierarchy_level
    `;
    return queryOne(sql, [parentId, userId]);
};

/**
 * Remove parent assignment
 */
export const removeParent = async (userId) => {
    const sql = `
        UPDATE users 
        SET parent_id = NULL, updated_at = NOW()
        WHERE id = $1
        RETURNING id, parent_id, hierarchy_path, hierarchy_level
    `;
    return queryOne(sql, [userId]);
};

// ==================== FULL PROFILE ====================

/**
 * Get user with full hierarchy info (joined data)
 */
export const findWithFullHierarchy = async (userId) => {
    const sql = `
        SELECT 
            u.*,
            p.name as parent_name,
            p.role as parent_role,
            p.email as parent_email,
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
    `;
    return queryOne(sql, [userId]);
};

export default {
    getHierarchyInfo,
    findSubordinates,
    countSubordinatesByRole,
    findAncestors,
    findParent,
    canAccess,
    findAccessibleUsers,
    assignParent,
    removeParent,
    findWithFullHierarchy
};
