// middleware/auth.middleware.js
// STEP 5.6 — CRITICAL SECURITY ENFORCEMENT

import * as authService from '../services/auth.service.js';

/**
 * Verify JWT Token (STEP 5.8)
 * Validates signature, issuer, audience, expiry, token_use
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ 401: No token provided in header:', authHeader);
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    console.log('🔍 Verifying token:', token.substring(0, 20) + '...');
    req.user = await authService.verifyToken(token);
    console.log('✅ Token verified for user:', req.user.username, 'Role:', req.user.role);
    next();
  } catch (err) {
    console.error('❌ Token verification error:', err.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack:', err.stack);
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * STEP 5.6 — MFA ENFORCEMENT (CRITICAL)
 * 
 * For ADMIN / INTERNAL users:
 * - Requires MFA to be enrolled
 * - Requires 'mfa' in amr claim
 * 
 * If not present → reject session (403)
 * 
 * This prevents:
 * - Admins logging in without MFA
 * - Token replay attacks without MFA
 * - Refresh token misuse
 */
export const requireMFA = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const role = req.user.role;
  const amr = req.user.amr || [];

  // Check if user is ADMIN or INTERNAL
  const requiresMFA = ['super_admin', 'internal', 'director', 'zonal_head', 'branch_manager'].includes(role);

  if (requiresMFA) {
    // Check if MFA was used during authentication
    if (!amr.includes('mfa')) {
      console.warn(`⚠️  MFA ENFORCEMENT BLOCKED: ${req.user.email} (${role}) - Missing MFA`);
      return res.status(403).json({
        message: 'MFA required for this account',
        code: 'MFA_REQUIRED',
        detail: 'Administrative accounts must have MFA enabled and verified'
      });
    }
  }

  console.log(`✅ MFA check passed: ${req.user.email} (${role}) - AMR: ${JSON.stringify(amr)}`);
  next();
};

/**
 * Role-based access control
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Require internal pool users
 */
export const requireInternal = (req, res, next) => {
  if (req.user.poolType !== 'internal') {
    return res.status(403).json({ message: 'Internal access only' });
  }
  next();
};

/**
 * Require client pool users
 */
export const requireClient = (req, res, next) => {
  if (req.user.poolType !== 'client') {
    return res.status(403).json({ message: 'Client access only' });
  }
  next();
};
