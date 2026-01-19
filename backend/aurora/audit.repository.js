/**
 * Audit Repository
 * 
 * Handles: Activity logging and audit trail
 * Pure data access layer - no business logic
 */

import { query, queryRows, queryOne } from './connection.js';

// ==================== ACTIVITY LOGGING ====================

/**
 * Log an activity
 */
export const log = async (userId, action, resource = null, resourceId = null, details = null, meta = {}) => {
    const { ip_address, user_agent } = meta;

    const sql = `
        INSERT INTO activity_logs (
            user_id, action, resource, resource_id, details, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at
    `;

    return queryOne(sql, [
        userId,
        action,
        resource,
        resourceId?.toString() || null,
        details ? JSON.stringify(details) : null,
        ip_address || null,
        user_agent || null
    ]);
};

/**
 * Log user login
 */
export const logLogin = async (userId, meta = {}) => {
    return log(userId, 'USER_LOGIN', 'users', userId, { success: true }, meta);
};

/**
 * Log user logout
 */
export const logLogout = async (userId, meta = {}) => {
    return log(userId, 'USER_LOGOUT', 'users', userId, null, meta);
};

/**
 * Log user creation
 */
export const logUserCreated = async (createdBy, userId, details = {}) => {
    return log(createdBy, 'USER_CREATED', 'users', userId, details);
};

/**
 * Log user update
 */
export const logUserUpdated = async (updatedBy, userId, changes = {}) => {
    return log(updatedBy, 'USER_UPDATED', 'users', userId, { changes });
};

/**
 * Log user deletion
 */
export const logUserDeleted = async (deletedBy, userId) => {
    return log(deletedBy, 'USER_DELETED', 'users', userId);
};

/**
 * Log user assignment to parent
 */
export const logUserAssigned = async (assignedBy, userId, parentId) => {
    return log(assignedBy, 'USER_ASSIGNED', 'users', userId, { parent_id: parentId });
};

/**
 * Log role change
 */
export const logRoleChanged = async (changedBy, userId, oldRole, newRole) => {
    return log(changedBy, 'ROLE_CHANGED', 'users', userId, { old_role: oldRole, new_role: newRole });
};

/**
 * Log bulk import
 */
export const logBulkImport = async (importedBy, successCount, failedCount) => {
    return log(importedBy, 'BULK_IMPORT', 'users', null, { success: successCount, failed: failedCount });
};

// ==================== QUERY LOGS ====================

/**
 * Get activity logs for a user
 */
export const findByUserId = async (userId, limit = 50, offset = 0) => {
    const sql = `
        SELECT id, action, resource, resource_id, details, ip_address, created_at
        FROM activity_logs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
    `;
    return queryRows(sql, [userId, limit, offset]);
};

/**
 * Get activity logs by action type
 */
export const findByAction = async (action, limit = 50, offset = 0) => {
    const sql = `
        SELECT al.id, al.user_id, u.name as user_name, al.action, 
               al.resource, al.resource_id, al.details, al.created_at
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.action = $1
        ORDER BY al.created_at DESC
        LIMIT $2 OFFSET $3
    `;
    return queryRows(sql, [action, limit, offset]);
};

/**
 * Get activity logs for a resource
 */
export const findByResource = async (resource, resourceId, limit = 50) => {
    const sql = `
        SELECT al.id, al.user_id, u.name as user_name, al.action, 
               al.details, al.ip_address, al.created_at
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.resource = $1 AND al.resource_id = $2
        ORDER BY al.created_at DESC
        LIMIT $3
    `;
    return queryRows(sql, [resource, resourceId.toString(), limit]);
};

/**
 * Get recent activity logs (for admin dashboard)
 */
export const findRecent = async (limit = 100) => {
    const sql = `
        SELECT al.id, al.user_id, u.name as user_name, u.role as user_role,
               al.action, al.resource, al.resource_id, al.created_at
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT $1
    `;
    return queryRows(sql, [limit]);
};

/**
 * Get activity count by action (for stats)
 */
export const countByAction = async (since = null) => {
    let sql = `
        SELECT action, COUNT(*)::int as count
        FROM activity_logs
    `;
    const params = [];

    if (since) {
        sql += ` WHERE created_at >= $1`;
        params.push(since);
    }

    sql += ` GROUP BY action ORDER BY count DESC`;

    return queryRows(sql, params);
};

/**
 * Get login attempts for a user
 */
export const getLoginAttempts = async (userId, since = null) => {
    let sql = `
        SELECT id, action, details, ip_address, created_at
        FROM activity_logs
        WHERE user_id = $1
          AND action IN ('USER_LOGIN', 'LOGIN_FAILED')
    `;
    const params = [userId];

    if (since) {
        sql += ` AND created_at >= $2`;
        params.push(since);
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`;

    return queryRows(sql, params);
};

// ==================== CLEANUP ====================

/**
 * Delete old logs (for maintenance)
 */
export const deleteOlderThan = async (days) => {
    const sql = `
        DELETE FROM activity_logs
        WHERE created_at < NOW() - INTERVAL '${days} days'
        RETURNING COUNT(*)::int as deleted_count
    `;
    const result = await query(sql);
    return result.rowCount;
};

export default {
    log,
    logLogin,
    logLogout,
    logUserCreated,
    logUserUpdated,
    logUserDeleted,
    logUserAssigned,
    logRoleChanged,
    logBulkImport,
    findByUserId,
    findByAction,
    findByResource,
    findRecent,
    countByAction,
    getLoginAttempts,
    deleteOlderThan
};
