/**
 * Auth User Service
 * 
 * Abstraction layer between auth middleware and data access.
 * Guards should never know how data is fetched.
 */

// DISABLED: Aurora database - using Cognito-only mode
// import { userRepo } from '../aurora/index.js';

/**
 * Load authenticated user from JWT token
 * Called by authGuard after JWT verification
 * 
 * COGNITO-ONLY MODE: Build user object from JWT payload without database
 * 
 * @param {Object} decoded - Decoded JWT payload
 * @returns {Object|null} User from JWT token
 */
export const loadAuthUser = async (decoded) => {
    // DISABLED: Database lookup - using Cognito-only mode
    // let user = await userRepo.findByCognitoSub(decoded.sub);
    // if (!user) {
    //     const username = decoded['cognito:username'] || decoded.sub;
    //     user = await userRepo.findByClientId(username);
    // }
    // return user;

    // Build user object from JWT token only
    if (!decoded || !decoded.sub) {
        return null;
    }

    const groups = decoded['cognito:groups'] || [];
    const role = determineUserRole(decoded, groups);
    const userType = determineUserType(role);

    // Map to actual client code
    // Priority: custom:client_code > cognito:username (ID token) > username (access token) > email prefix > sub
    let clientCode = decoded['custom:client_code'] ||
        decoded['cognito:username'] ||  // ID token field
        decoded['username'] ||           // Access token field
        decoded.email?.split('@')[0] ||
        decoded.sub;

    // Convert to uppercase for TechExcel API (expects A000065 not a000065)
    if (clientCode && clientCode !== decoded.sub) {
        clientCode = clientCode.toUpperCase();
    }

    return {
        id: decoded.sub,
        client_id: clientCode,  // This is used as CLIENT_CODE for TechExcel API
        cognito_sub: decoded.sub,
        email: decoded.email,
        name: decoded.name || decoded.email,
        role: role,
        status: 'active', // Assume active if JWT is valid
        user_type: userType,
        hierarchy_level: 0,
        hierarchy_path: null,
        parent_id: null,
        branch_id: null,
        zone_id: null
    };
};

/**
 * Determine user role from JWT token groups/attributes
 */
function determineUserRole(decoded, groups) {
    // Check Cognito groups first
    const groupRoleMap = {
        'ADMIN': 'super_admin',
        'INTERNAL': 'internal',
        'CLIENT': 'client',
        'Admins': 'super_admin',
        'Directors': 'director',
        'ZonalHeads': 'zonal_head',
        'BranchManagers': 'branch_manager',
        'RMs': 'rm',
        'Clients': 'client'
    };

    for (const group of groups) {
        if (groupRoleMap[group]) {
            return groupRoleMap[group];
        }
    }

    // Check custom:role attribute
    if (decoded['custom:role']) {
        return decoded['custom:role'];
    }

    // Default to client
    return 'client';
}

/**
 * Determine user type from role
 */
function determineUserType(role) {
    const internalRoles = ['super_admin', 'director', 'zonal_head', 'branch_manager', 'rm', 'internal'];
    return internalRoles.includes(role) ? 'internal' : 'client';
}

/**
 * Check if user status is valid for authentication
 */
export const isUserActive = (user) => {
    return user && user.status === 'active';
};

/**
 * Check if token is expired (defense in depth)
 * Cognito already checks, but we verify for clock skew
 */
export const isTokenExpired = (decoded) => {
    if (!decoded.exp) return true;

    // Add 30 second grace for clock skew
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < (now - 30);
};

export default {
    loadAuthUser,
    isUserActive,
    isTokenExpired
};
