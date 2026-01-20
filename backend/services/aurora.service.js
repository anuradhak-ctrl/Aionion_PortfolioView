import { queryRows, queryOne } from '../aurora/connection.js';

// ==================== USER MANAGEMENT QUERIES ====================

/**
 * Get users by role with pagination
 * Updated for enhanced schema with status column
 */
export const getUsersByRole = async (role = null, limit = 50, offset = 0) => {
    let sql = `
        SELECT id, client_id, cognito_sub, email, name, role, status, (status = 'active') AS is_active, phone, 
               branch_id, zone_id, hierarchy_level, parent_id,
               created_at, updated_at, last_login_at
        FROM users
    `;
    const params = [];
    let paramIndex = 1;

    if (role && role !== 'all') {
        sql += ` WHERE role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    return queryRows(sql, params);
};

/**
 * Get user count grouped by role
 */
export const getUserCountByRole = async () => {
    const sql = `
        SELECT role, COUNT(*)::int as count
        FROM users
        GROUP BY role
    `;
    return queryRows(sql);
};

/**
 * Get total user count
 */
export const getTotalUserCount = async () => {
    const result = await queryOne('SELECT COUNT(*)::int as total FROM users');
    return result?.total || 0;
};

/**
 * Get user by internal ID
 */
export const getUserById = async (userId) => {
    const sql = `
        SELECT id, client_id, cognito_sub, email, name, role, status, (status = 'active') AS is_active, phone,
               branch_id, zone_id, hierarchy_level, parent_id, hierarchy_path,
               created_at, updated_at, last_login_at
        FROM users
        WHERE id = $1
    `;
    return queryOne(sql, [userId]);
};

/**
 * Get user by client_id (Cognito username/sub)
 * PRIMARY lookup for Cognito → Aurora mapping
 */
export const getUserByClientId = async (clientId) => {
    const sql = `
        SELECT id, client_id, cognito_sub, email, name, role, status, (status = 'active') AS is_active, phone,
               branch_id, zone_id, hierarchy_level, parent_id, hierarchy_path,
               created_at, updated_at, last_login_at
        FROM users
        WHERE client_id = $1
    `;
    return queryOne(sql, [clientId]);
};

/**
 * Create a new user
 * Updated for enhanced schema
 */
export const createUser = async (userData) => {
    const { client_id, cognito_sub, email, name, role, phone, branch_id, zone_id, parent_id } = userData;

    const sql = `
        INSERT INTO users (client_id, cognito_sub, email, name, role, phone, branch_id, zone_id, parent_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
        RETURNING *
    `;

    return queryOne(sql, [
        client_id,
        cognito_sub || null,
        email,
        name,
        role || 'client',
        phone || null,
        branch_id || null,
        zone_id || null,
        parent_id || null
    ]);
};

/**
 * Update user details
 */
export const updateUser = async (userId, updates) => {
    const { email, name, role, is_active, phone, branch_code, zone_code } = updates;

    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    if (email !== undefined) {
        setClauses.push(`email = $${paramIndex++}`);
        params.push(email);
    }
    if (name !== undefined) {
        setClauses.push(`name = $${paramIndex++}`);
        params.push(name);
    }
    if (role !== undefined) {
        setClauses.push(`role = $${paramIndex++}`);
        params.push(role);
    }
    if (is_active !== undefined) {
        setClauses.push(`status = $${paramIndex++}`);
        params.push(is_active ? 'active' : 'inactive');
    }
    if (phone !== undefined) {
        setClauses.push(`phone = $${paramIndex++}`);
        params.push(phone);
    }
    if (branch_code !== undefined) {
        setClauses.push(`branch_code = $${paramIndex++}`);
        params.push(branch_code);
    }
    if (zone_code !== undefined) {
        setClauses.push(`zone_code = $${paramIndex++}`);
        params.push(zone_code);
    }

    if (setClauses.length === 0) {
        throw new Error('No fields to update');
    }

    setClauses.push('updated_at = NOW()');
    params.push(userId);

    const sql = `
        UPDATE users 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, client_id, email, name, role, status, (status = 'active') AS is_active, phone, branch_code, zone_code, updated_at
    `;

    return queryOne(sql, params);
};

/**
 * Update user status only
 */
export const updateUserStatus = async (userId, isActive) => {
    const status = isActive ? 'active' : 'inactive';
    const sql = `
        UPDATE users 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, status, (status = 'active') AS is_active
    `;
    return queryOne(sql, [status, userId]);
};

/**
 * Assign user to parent (update hierarchy)
 */
export const assignParent = async (userId, parentId) => {
    // If parentId provided, verify it exists first
    if (parentId) {
        const parent = await getUserById(parentId);
        if (!parent) return null;
    }

    const sql = `
        UPDATE users 
        SET parent_id = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, parent_id, role
    `;
    return queryOne(sql, [parentId, userId]);
};

/**
 * Delete user
 */
export const deleteUser = async (userId) => {
    const sql = 'DELETE FROM users WHERE id = $1 RETURNING id';
    return queryOne(sql, [userId]);
};

/**
 * Search users by name or email
 */
export const searchUsers = async (searchTerm, role = null, limit = 50) => {
    let sql = `
        SELECT id, client_id, email, name, role, status, (status = 'active') AS is_active, created_at
        FROM users
        WHERE (name ILIKE $1 OR email ILIKE $1)
    `;
    const params = [`%${searchTerm}%`];
    let paramIndex = 2;

    if (role && role !== 'all') {
        sql += ` AND role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
    }

    sql += ` ORDER BY name ASC LIMIT $${paramIndex}`;
    params.push(limit);

    return queryRows(sql, params);
};

/**
 * Update last login timestamp
 */
export const updateLastLogin = async (clientId) => {
    const sql = `
        UPDATE users 
        SET last_login_at = NOW()
        WHERE client_id = $1
        RETURNING id, last_login_at
    `;
    return queryOne(sql, [clientId]);
};

// ==================== HEALTH CHECK ====================

/**
 * Test database connection
 */
export const healthCheck = async () => {
    try {
        const result = await queryOne('SELECT NOW() as timestamp, current_database() as database');
        return {
            status: 'healthy',
            database: result.database,
            timestamp: result.timestamp,
            connection: 'active'
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message
        };
    }
};

// ==================== CLEANUP ====================

/**
 * Close the connection pool (for graceful shutdown)
 */
export const closePool = async () => {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('✅ PostgreSQL pool closed');
    }
};

// Default export
export default {
    // query,
    queryRows,
    queryOne,
    getUsersByRole,
    getUserCountByRole,
    getTotalUserCount,
    getUserById,
    getUserByClientId,
    createUser,
    updateUser,
    updateUserStatus,
    assignParent,
    deleteUser,
    searchUsers,
    updateLastLogin,
    healthCheck,
    closePool
};
