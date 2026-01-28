/**
 * User Repository
 * 
 * Handles: User CRUD operations against Aurora database
 * Pure data access layer - no business logic
 */

import { query, queryRows, queryOne } from './connection.js';
import hierarchyValidation from '../services/hierarchy-validation.service.js';

// ==================== READ OPERATIONS ====================

/**
 * Get user by internal ID
 */
export const findById = async (userId) => {
    const sql = `
        SELECT id, client_id, cognito_sub, email, name, role, status, user_type, phone,
               branch_id, zone_id, hierarchy_level, parent_id, hierarchy_path,
               client_code, employee_code, mfa_enabled,
               created_at, updated_at, last_login_at
        FROM users
        WHERE id = $1
    `;
    return queryOne(sql, [userId]);
};

/**
 * Get user by client_id (Cognito username)
 */
export const findByClientId = async (clientId) => {
    const sql = `
        SELECT id, client_id, cognito_sub, email, name, role, status, user_type, phone,
               branch_id, zone_id, hierarchy_level, parent_id, hierarchy_path,
               client_code, employee_code, mfa_enabled,
               created_at, updated_at, last_login_at
        FROM users
        WHERE client_id ILIKE $1
    `;
    return queryOne(sql, [clientId]);
};

/**
 * Get user by Cognito sub (UUID)
 */
export const findByCognitoSub = async (cognitoSub) => {
    const sql = `
        SELECT id, client_id, cognito_sub, email, name, role, status, user_type, phone,
               branch_id, zone_id, hierarchy_level, parent_id, hierarchy_path,
               client_code, employee_code, mfa_enabled,
               created_at, updated_at, last_login_at
        FROM users
        WHERE cognito_sub = $1
    `;
    return queryOne(sql, [cognitoSub]);
};

/**
 * Get user by email
 */
export const findByEmail = async (email) => {
    const sql = `SELECT * FROM users WHERE LOWER(email) = LOWER($1)`;
    return queryOne(sql, [email]);
};

/**
 * Get users by role with pagination
 */
export const findByRole = async (role = null, limit = 50, offset = 0) => {
    let sql = `
        SELECT id, client_id, cognito_sub, email, name, role, status, phone, 
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
 * Search users by name or email
 */
export const search = async (searchTerm, role = null, limit = 50) => {
    let sql = `
        SELECT id, client_id, email, name, role, status, created_at
        FROM users
        WHERE (name ILIKE $1 OR email ILIKE $1 OR client_id ILIKE $1)
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

// ==================== COUNTS ====================

/**
 * Get total user count
 */
export const count = async () => {
    const result = await queryOne('SELECT COUNT(*)::int as total FROM users');
    return result?.total || 0;
};

/**
 * Get user count grouped by role
 */
export const countByRole = async () => {
    const sql = `
        SELECT role, COUNT(*)::int as count
        FROM users
        GROUP BY role
    `;
    return queryRows(sql);
};

/**
 * Get user count by status
 */
export const countByStatus = async () => {
    const sql = `
        SELECT status, COUNT(*)::int as count
        FROM users
        GROUP BY status
    `;
    return queryRows(sql);
};

// ==================== WRITE OPERATIONS ====================

/**
 * Create a new user
 */
export const create = async (userData) => {
    const {
        client_id, cognito_sub, email, name, role = 'client',
        phone, branch_id, zone_id, parent_id,
        client_code, employee_code, status = 'active',
        user_type  // Explicit user type
    } = userData;

    // VALIDATE HIERARCHY BEFORE CREATING
    if (parent_id) {
        const validation = await hierarchyValidation.validateParentAssignment(null, parent_id, role);
        if (!validation.valid) {
            throw new Error(`Hierarchy validation failed: ${validation.errors.join('; ')}`);
        }
    }

    // Derive user_type if not provided
    const derivedUserType = user_type || (role === 'client' ? 'client' : 'internal');

    const sql = `
        INSERT INTO users (
            client_id, cognito_sub, email, name, role, status, user_type,
            phone, branch_id, zone_id, parent_id,
            client_code, employee_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
    `;

    return queryOne(sql, [
        client_id,
        cognito_sub || null,
        email,
        name,
        role,
        status,
        derivedUserType,
        phone || null,
        branch_id || null,
        zone_id || null,
        parent_id || null,
        client_code || null,
        employee_code || null
    ]);
};

/**
 * Update user by ID
 */
export const update = async (userId, updates) => {
    const allowedFields = [
        'email', 'name', 'phone', 'role', 'status', 'user_type',
        'branch_id', 'zone_id', 'parent_id',
        'client_code', 'employee_code', 'mfa_enabled', 'mfa_verified'
    ];

    // VALIDATE HIERARCHY IF UPDATING PARENT OR ROLE
    if (updates.parent_id !== undefined || updates.role) {
        // Get current user to check role
        const currentUser = await queryOne('SELECT id, role FROM users WHERE id = $1', [userId]);
        if (!currentUser) {
            throw new Error('User not found');
        }

        const newParentId = updates.parent_id !== undefined ? updates.parent_id : currentUser.parent_id;
        const newRole = updates.role || currentUser.role;

        if (newParentId) {
            const validation = await hierarchyValidation.validateParentAssignment(userId, newParentId, newRole);
            if (!validation.valid) {
                throw new Error(`Hierarchy validation failed: ${validation.errors.join('; ')}`);
            }
        }
    }

    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
            setClauses.push(`${key} = $${paramIndex++}`);
            params.push(value);
        }
    }

    if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
    }

    setClauses.push('updated_at = NOW()');
    params.push(userId);

    const sql = `
        UPDATE users 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
    `;

    return queryOne(sql, params);
};

/**
 * Update user status
 */
export const updateStatus = async (userId, status) => {
    const sql = `
        UPDATE users 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, status
    `;
    return queryOne(sql, [status, userId]);
};

/**
 * Update last login timestamp
 */
export const updateLastLogin = async (userId) => {
    const sql = `
        UPDATE users 
        SET last_login_at = NOW()
        WHERE id = $1
        RETURNING id, last_login_at
    `;
    return queryOne(sql, [userId]);
};

/**
 * Link Cognito sub to user
 */
export const linkCognitoSub = async (userId, cognitoSub) => {
    const sql = `
        UPDATE users 
        SET cognito_sub = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, cognito_sub
    `;
    return queryOne(sql, [cognitoSub, userId]);
};

/**
 * Delete user (hard delete)
 */
export const remove = async (userId) => {
    const sql = 'DELETE FROM users WHERE id = $1 RETURNING id';
    return queryOne(sql, [userId]);
};

/**
 * Soft delete (set status to inactive)
 */
export const softDelete = async (userId) => {
    return updateStatus(userId, 'inactive');
};

// ==================== UPSERT ====================

/**
 * Upsert user (insert or update on conflict)
 */
export const upsert = async (userData) => {
    const {
        client_id, cognito_sub, email, name, role = 'client',
        phone, client_code, user_type
    } = userData;

    // Derive user_type if not provided
    const derivedUserType = user_type || (role === 'client' ? 'client' : 'internal');

    const sql = `
        INSERT INTO users (
            client_id, cognito_sub, email, name, role, status, user_type, phone, client_code
        ) VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8)
        ON CONFLICT (client_id) DO UPDATE SET
            cognito_sub = COALESCE(EXCLUDED.cognito_sub, users.cognito_sub),
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            phone = COALESCE(EXCLUDED.phone, users.phone),
            last_login_at = NOW(),
            updated_at = NOW()
        RETURNING *
    `;

    return queryOne(sql, [
        client_id,
        cognito_sub || null,
        email,
        name,
        role,
        derivedUserType,
        phone || null,
        client_code || null
    ]);
};

export default {
    findById,
    findByClientId,
    findByCognitoSub,
    findByEmail,
    findByRole,
    search,
    count,
    countByRole,
    countByStatus,
    create,
    update,
    updateStatus,
    updateLastLogin,
    linkCognitoSub,
    remove,
    softDelete,
    upsert
};
