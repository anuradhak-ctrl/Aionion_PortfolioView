/**
 * Hierarchy Validation Service
 * 
 * Enforces business rules:
 * - ZM (Zonal Manager) → BM (Branch Manager) → RM → Client
 * - Prevents circular references
 * - Validates parent-child role relationships
 */

import { queryOne, queryRows } from '../aurora/connection.js';

// Valid parent-child role relationships
const VALID_HIERARCHY = {
    'super_admin': [],  // No parent allowed
    'director': ['super_admin'],  // Can report to super_admin
    'zonal_head': ['super_admin', 'director'],  // ZM can report to super_admin or director
    'branch_manager': ['zonal_head', 'director'],  // BM must report to ZM or director
    'rm': ['branch_manager', 'zonal_head'],  // RM must report to BM or ZM
    'client': ['rm', 'branch_manager', 'zonal_head']  // Client must report to RM, BM, or ZM
};

/**
 * Check if a role can have a specific parent role
 */
export const isValidParentRole = (childRole, parentRole) => {
    const allowedParents = VALID_HIERARCHY[childRole] || [];

    if (allowedParents.length === 0 && parentRole) {
        return false;  // This role should have no parent
    }

    return allowedParents.includes(parentRole);
};

/**
 * Check if assigning a parent would create a circular reference
 * Uses cycle detection to prevent A → B → A scenarios
 */
export const wouldCreateCycle = async (userId, newParentId) => {
    if (!newParentId) return false;  // No parent = no cycle possible
    if (userId === newParentId) return true;  // Self-reference is a cycle

    // Check if newParent is a descendant of user
    // If yes, assignment would create a cycle
    const sql = `
        WITH RECURSIVE descendants AS (
            -- Start with direct children
            SELECT id, 1 as depth, ARRAY[id] as path
            FROM users
            WHERE parent_id = $1
            
            UNION ALL
            
            -- Get nested descendants
            SELECT u.id, d.depth + 1, d.path || u.id
            FROM users u
            INNER JOIN descendants d ON u.parent_id = d.id
            WHERE d.depth < 10 
              AND NOT (u.id = ANY(d.path))  -- Prevent infinite loops
        )
        SELECT 1 FROM descendants WHERE id = $2
    `;

    try {
        const result = await queryOne(sql, [userId, newParentId]);
        return !!result;  // If found, it would create a cycle
    } catch (error) {
        console.error('Cycle detection error:', error.message);
        return true;  // Fail safe: if we can't check, assume it would create cycle
    }
};

/**
 * Validate parent assignment based on business rules
 */
export const validateParentAssignment = async (userId, newParentId, userRole) => {
    const errors = [];

    // If no parent, check if role allows it
    if (!newParentId) {
        const rolesRequiringParent = ['client', 'rm', 'branch_manager'];
        if (rolesRequiringParent.includes(userRole)) {
            errors.push(`${userRole} must have a parent assigned`);
        }
        return { valid: errors.length === 0, errors };
    }

    // Get parent details
    const parent = await queryOne('SELECT id, role FROM users WHERE id = $1', [newParentId]);

    if (!parent) {
        errors.push('Parent user not found');
        return { valid: false, errors };
    }

    // Check role compatibility
    if (!isValidParentRole(userRole, parent.role)) {
        const allowed = VALID_HIERARCHY[userRole].join(', ') || 'none';
        errors.push(
            `Invalid hierarchy: ${userRole} cannot report to ${parent.role}. ` +
            `Allowed parent roles: ${allowed}`
        );
    }

    // Check for circular reference
    if (userId) {
        const wouldCycle = await wouldCreateCycle(userId, newParentId);
        if (wouldCycle) {
            errors.push('This assignment would create a circular hierarchy');
        }
    }

    return { valid: errors.length === 0, errors };
};

/**
 * Get recommended parent for a role (for UI)
 */
export const getRecommendedParentRole = (userRole) => {
    const allowed = VALID_HIERARCHY[userRole] || [];
    return allowed[0] || null;  // Return primary parent role
};

/**
 * Validate bulk user imports
 */
export const validateBulkHierarchy = async (users) => {
    const errors = [];

    for (let i = 0; i < users.length; i++) {
        const user = users[i];

        if (user.parent_id) {
            const validation = await validateParentAssignment(null, user.parent_id, user.role);
            if (!validation.valid) {
                errors.push({
                    index: i,
                    user: user.client_id || user.email,
                    errors: validation.errors
                });
            }
        }
    }

    return { valid: errors.length === 0, errors };
};

export default {
    VALID_HIERARCHY,
    isValidParentRole,
    wouldCreateCycle,
    validateParentAssignment,
    getRecommendedParentRole,
    validateBulkHierarchy
};
