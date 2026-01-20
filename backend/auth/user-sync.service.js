import { userRepo, hierarchyRepo, auditRepo } from '../aurora/index.js';

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
    'INTERNAL': 'rm'
};

/**
 * Get Aurora role from Cognito token payload
 */
export const getRoleFromCognitoPayload = (payload, userType = 'client') => {
    const groups = payload['cognito:groups'] || [];

    // Priority 1: Cognito groups
    for (const group of groups) {
        if (COGNITO_GROUP_TO_ROLE[group]) {
            return COGNITO_GROUP_TO_ROLE[group];
        }
    }

    // Priority 2: custom:role attribute
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

// ==================== SYNC OPERATIONS ====================

/**
 * Sync Cognito user to Aurora database
 * Called after successful Cognito authentication
 */
export const syncCognitoUserToAurora = async (cognitoPayload, userType = 'client') => {
    const cognitoSub = cognitoPayload.sub;
    const username = cognitoPayload['cognito:username'] || cognitoSub;
    const email = cognitoPayload.email;
    const name = cognitoPayload.name || email?.split('@')[0] || username;
    const phone = cognitoPayload.phone_number || null;
    const role = getRoleFromCognitoPayload(cognitoPayload, userType);

    console.log(`🔄 Syncing user to Aurora: ${username} (${role})`);

    try {
        // Check if user exists
        let existingUser = await userRepo.findByCognitoSub(cognitoSub);

        if (!existingUser) {
            existingUser = await userRepo.findByClientId(username);
        }

        if (!existingUser && email) {
            existingUser = await userRepo.findByEmail(email);
            if (existingUser) {
                console.log(`📝 found user by email: ${email} (client_id: ${existingUser.client_id})`);
            }
        }

        if (existingUser) {
            // Update existing user
            console.log(`📝 Existing user found: ${existingUser.id}`);

            // Link cognito_sub if not linked
            if (!existingUser.cognito_sub) {
                await userRepo.linkCognitoSub(existingUser.id, cognitoSub);
            }

            // Update last login
            await userRepo.updateLastLogin(existingUser.id);

            // Log the login
            await auditRepo.logLogin(existingUser.id);

            // Sync Role from Cognito if different (Auto-Update on Login)
            // SAFETY CHECK: Do NOT downgrade privileged users to 'client' automatically
            // This prevents accidental loss of admin access if Cognito groups are missing
            const sensitiveRoles = ['super_admin', 'director', 'zonal_head', 'branch_manager'];
            const isDowngrade = role === 'client' && sensitiveRoles.includes(existingUser.role);

            if (role && existingUser.role !== role && !isDowngrade) {
                console.log(`📝 Updating user role from ${existingUser.role} to ${role} based on Cognito Group`);
                await userRepo.update(existingUser.id, { role });
            } else if (isDowngrade) {
                console.warn(`🛡️ Skipped role update for ${existingUser.client_id}: Prevented downgrade from ${existingUser.role} to ${role}`);
            }

            return await userRepo.findById(existingUser.id);
        }

        // Create new user
        console.log(`➕ Creating new user: ${username}`);

        const newUser = await userRepo.upsert({
            client_id: username,
            cognito_sub: cognitoSub,
            email,
            name,
            phone,
            role,
            client_code: role === 'client' ? username : null
        });

        // Log user creation
        await auditRepo.logUserCreated(null, newUser.id, { source: 'cognito_sync' });

        console.log(`✅ User created/synced: ${newUser.id} (${newUser.role})`);
        return newUser;

    } catch (error) {
        console.error('❌ User sync error:', error.message);
        throw error;
    }
};

/**
 * Get user by Cognito sub
 */
export const getUserByCognitoSub = async (cognitoSub) => {
    return userRepo.findByCognitoSub(cognitoSub);
};

/**
 * Get full user profile with hierarchy
 */
export const getFullUserProfile = async (userId) => {
    return hierarchyRepo.findWithFullHierarchy(userId);
};

// ==================== HIERARCHY MANAGEMENT ====================

/**
 * Assign user to parent (manager)
 */
export const assignUserToParent = async (userId, parentId, assignedBy = null) => {
    // Validate parent exists
    const parent = await userRepo.findById(parentId);
    if (!parent) {
        throw new Error('Parent user not found');
    }

    // Assign
    const result = await hierarchyRepo.assignParent(userId, parentId);

    // Log
    if (assignedBy) {
        await auditRepo.logUserAssigned(assignedBy, userId, parentId);
    }

    console.log(`✅ User ${userId} assigned to parent ${parentId}`);
    return result;
};

/**
 * Get all subordinates
 */
export const getSubordinates = async (userId, includeNested = true) => {
    return hierarchyRepo.findSubordinates(userId, includeNested);
};

/**
 * Get subordinate count by role
 */
export const getSubordinateCountByRole = async (userId) => {
    return hierarchyRepo.countSubordinatesByRole(userId);
};

/**
 * Check if user can access another user
 */
export const canAccessUser = async (accessorId, targetId) => {
    return hierarchyRepo.canAccess(accessorId, targetId);
};

/**
 * Get accessible users
 */
export const getAccessibleUsers = async (userId, role, filters = {}) => {
    return hierarchyRepo.findAccessibleUsers(userId, role, filters);
};

// ==================== BULK OPERATIONS ====================

/**
 * Bulk import users
 */
export const bulkImportUsers = async (users, defaultParentId = null, importedBy = null) => {
    const results = {
        success: 0,
        failed: 0,
        errors: []
    };

    for (const userData of users) {
        try {
            await userRepo.create({
                client_id: userData.client_id || userData.username,
                email: userData.email,
                name: userData.name,
                role: userData.role || 'client',
                phone: userData.phone,
                client_code: userData.client_code,
                employee_code: userData.employee_code,
                parent_id: userData.parent_id || defaultParentId
            });

            results.success++;
        } catch (error) {
            results.failed++;
            results.errors.push({
                user: userData.client_id || userData.email,
                error: error.message
            });
        }
    }

    // Log the import
    if (importedBy) {
        await auditRepo.logBulkImport(importedBy, results.success, results.failed);
    }

    console.log(`📊 Bulk import: ${results.success} success, ${results.failed} failed`);
    return results;
};

// ==================== EXPORTS ====================

export default {
    COGNITO_GROUP_TO_ROLE,
    getRoleFromCognitoPayload,
    syncCognitoUserToAurora,
    getUserByCognitoSub,
    getFullUserProfile,
    assignUserToParent,
    getSubordinates,
    getSubordinateCountByRole,
    canAccessUser,
    getAccessibleUsers,
    bulkImportUsers
};
