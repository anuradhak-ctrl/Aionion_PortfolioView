import * as authService from '../services/auth.service.js';
import { loadAuthUser, isTokenExpired } from '../auth/auth-user.service.js';
// DISABLED: Aurora database - using Cognito-only mode
// import { hierarchyRepo } from '../aurora/index.js';

export const authGuard = async (req, res, next) => {
  try {
    // Step 1: Extract token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);

    // Step 2: Verify JWT (signature, expiry, issuer, audience)
    const decoded = await authService.verifyToken(token);

    if (!decoded || !decoded.sub) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Step 3: Explicit token expiry check (defense in depth)
    if (isTokenExpired(decoded)) {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    // Step 4: Fetch user from Aurora (AUTHORITATIVE source)
    const user = await loadAuthUser(decoded);

    // Step 5: Validate user exists
    if (!user) {
      console.warn(`Auth: user not found, sub=${decoded.sub?.substring(0, 8)}...`);
      return res.status(403).json({
        success: false,
        message: 'User not found in system',
        code: 'USER_NOT_FOUND'
      });
    }

    // Step 6: Validate user is active
    if (user.status !== 'active') {
      console.warn(`Auth: blocked inactive, user_id=${user.id}, status=${user.status}`);
      return res.status(403).json({
        success: false,
        message: 'Account is disabled',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Step 7: Build secure user object
    // In Cognito-only mode: data comes from JWT token
    req.user = {
      // From JWT (identity only)
      cognitoSub: decoded.sub,
      email: decoded.email || user.email,
      amr: decoded.amr || [],
      tokenExp: decoded.exp,

      // From JWT token (Cognito-only mode)
      id: user.id,
      username: user.client_id,           // IMPORTANT: Used by portfolio controller
      clientId: user.client_id,
      name: user.name,
      role: user.role,
      status: user.status,
      userType: user.user_type || (user.role === 'client' ? 'client' : 'internal'),
      hierarchyLevel: user.hierarchy_level,
      hierarchyPath: user.hierarchy_path,
      parentId: user.parent_id,
      branchId: user.branch_id,
      zoneId: user.zone_id
    };

    // Log IDs only, not identities
    console.log(`Auth: success, user_id=${user.id}, role=${user.role}`);
    next();

  } catch (err) {
    console.error(`Auth: failed, error=${err.message}`);

    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

export const requireMFA = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  // Double-check status (defense in depth)
  if (req.user.status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Account is disabled',
      code: 'ACCOUNT_DISABLED'
    });
  }

  // Roles that require MFA (internal staff)
  const mfaRequiredRoles = [
    'super_admin',
    'zonal_head',
    'branch_manager',
    'rm'
  ];

  const role = req.user.role;
  const amr = req.user.amr || [];

  if (mfaRequiredRoles.includes(role)) {
    if (!amr.includes('mfa')) {
      console.warn(`MFA: blocked, user_id=${req.user.id}, role=${role}`);
      return res.status(403).json({
        success: false,
        message: 'MFA required for this account',
        code: 'MFA_REQUIRED',
        detail: 'This action requires Multi-Factor Authentication'
      });
    }
  }

  next();
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      console.warn(`Role: denied, user_id=${req.user.id}, has=${userRole}, needs=${allowedRoles.join('|')}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
};

export const requireInternal = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.user.userType !== 'internal') {
    console.warn(`Type: internal required, user_id=${req.user.id}, type=${req.user.userType}`);
    return res.status(403).json({
      success: false,
      message: 'Internal access only',
      code: 'INTERNAL_ONLY'
    });
  }

  next();
};

export const requireClient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.user.userType !== 'client') {
    console.warn(`Type: client required, user_id=${req.user.id}, type=${req.user.userType}`);
    return res.status(403).json({
      success: false,
      message: 'Client access only',
      code: 'CLIENT_ONLY'
    });
  }

  next();
};


export const requireAccessTo = (targetIdPath = 'params.id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Extract target ID from request
    const pathParts = targetIdPath.split('.');
    let targetId = req;
    for (const part of pathParts) {
      targetId = targetId?.[part];
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID required'
      });
    }

    const targetIdNum = parseInt(targetId);

    // Super admin can access anyone
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Same user can access own data
    if (targetIdNum === req.user.id) {
      return next();
    }

    // Check hierarchy access (static import)
    const canAccess = await hierarchyRepo.canAccess(req.user.id, targetIdNum);

    if (!canAccess) {
      console.warn(`Hierarchy: denied, user_id=${req.user.id} -> target_id=${targetIdNum}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied to this user',
        code: 'HIERARCHY_ACCESS_DENIED'
      });
    }

    next();
  };
};

export const verifyToken = authGuard;

export default {
  authGuard,
  verifyToken,
  requireMFA,
  requireRole,
  requireInternal,
  requireClient,
  requireAccessTo
};
