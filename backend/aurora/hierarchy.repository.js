/**
 * Hierarchy Repository
 * 
 * Handles: User hierarchy queries (subordinates, ancestors, access control)
 * Pure data access layer - no business logic
 * Uses Recursive CTEs (Common Table Expressions) for hierarchy traversal
 */

import { query, queryRows, queryOne } from './connection.js';

// ==================== HIERARCHY QUERIES ====================

/**
 * Get user's basic hierarchy info
 */
export const getHierarchyInfo = async (userId) => {
    const sql = `
        SELECT id, parent_id, role
        FROM users
        WHERE id = $1
    `;
    return queryOne(sql, [userId]);
};

/**
 * Get all subordinates (Recursive)
 */
export const findSubordinates = async (userId, includeNested = true) => {
    if (includeNested) {
        const sql = `
            WITH RECURSIVE subordinates AS (
                SELECT id, client_id, email, name, role, status, parent_id, created_at, 1 as level
                FROM users
                WHERE parent_id = $1
                
                UNION ALL
                
                SELECT u.id, u.client_id, u.email, u.name, u.role, u.status, u.parent_id, u.created_at, s.level + 1
                FROM users u
                INNER JOIN subordinates s ON u.parent_id = s.id
            )
            SELECT * FROM subordinates ORDER BY level, name
        `;
        return queryRows(sql, [userId]);
    } else {
        // Direct subordinates only
        const sql = `
            SELECT id, client_id, email, name, role, status, parent_id, created_at
            FROM users
            WHERE parent_id = $1
            ORDER BY role, name
        `;
        return queryRows(sql, [userId]);
    }
};

/**
 * Count subordinates by role (Recursive)
 */
export const countSubordinatesByRole = async (userId) => {
    const sql = `
        WITH RECURSIVE subordinates AS (
            SELECT id, role, parent_id
            FROM users
            WHERE parent_id = $1
            
            UNION ALL
            
            SELECT u.id, u.role, u.parent_id
            FROM users u
            INNER JOIN subordinates s ON u.parent_id = s.id
        )
        SELECT role, COUNT(*)::int as count
        FROM subordinates
        GROUP BY role
        ORDER BY role
    `;
    return queryRows(sql, [userId]);
};

/**
 * Get all ancestors (Recursive)
 */
export const findAncestors = async (userId) => {
    const sql = `
        WITH RECURSIVE ancestors AS (
            SELECT id, name, role, parent_id, 1 as level
            FROM users
            WHERE id = (SELECT parent_id FROM users WHERE id = $1)
            
            UNION ALL
            
            SELECT u.id, u.name, u.role, u.parent_id, a.level + 1
            FROM users u
            INNER JOIN ancestors a ON u.id = a.parent_id
        )
        SELECT id, name, role
        FROM ancestors
        ORDER BY level
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
    if (accessorId === targetId) return true;

    // Check if accessor is Super Admin (no query needed if role logic is handled elsewhere, but safer to check DB)
    const accessor = await getHierarchyInfo(accessorId);
    if (!accessor) return false;
    if (accessor.role === 'super_admin') return true;

    // Check if target is a descendant of accessor
    const sql = `
        WITH RECURSIVE subordinates AS (
            SELECT id
            FROM users
            WHERE parent_id = $1
            
            UNION ALL
            
            SELECT u.id
            FROM users u
            INNER JOIN subordinates s ON u.parent_id = s.id
        )
        SELECT 1 FROM subordinates WHERE id = $2
    `;
    const result = await queryOne(sql, [accessorId, targetId]);
    return !!result;
};

/**
 * Get all users accessible by accessor
 */
export const findAccessibleUsers = async (accessorId, role, filters = {}) => {
    const accessor = await getHierarchyInfo(accessorId);
    if (!accessor) return [];

    let sql, params;

    if (accessor.role === 'super_admin') {
        sql = `
            SELECT id, client_id, email, name, role, status, branch_id, zone_id
            FROM users
            WHERE 1=1
        `;
        params = [];
    } else {
        // Recursive CTE to get self + all descendants
        sql = `
            WITH RECURSIVE accessible_users AS (
                SELECT id, client_id, email, name, role, status, branch_id, zone_id
                FROM users
                WHERE id = $1
                
                UNION ALL
                
                SELECT u.id, u.client_id, u.email, u.name, u.role, u.status, u.branch_id, u.zone_id
                FROM users u
                INNER JOIN accessible_users a ON u.parent_id = a.id
            )
            SELECT * FROM accessible_users WHERE 1=1
        `;
        params = [accessorId];
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
        RETURNING id, parent_id, role
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
        RETURNING id, parent_id, role
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
