import express from 'express';
import {
  loginWithPassword,
  refreshToken,
  setupMfa,
  verifyMfaSetup,
  verifyMfaChallenge,
  changePassword
} from '../services/cognito.auth.service.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Main login endpoint - returns tokens OR challenge
 */
router.post('/login', loginWithPassword);

/**
 * POST /api/auth/mfa/setup
 * Generate MFA secret and QR code (during MFA_SETUP challenge)
 */
router.post('/mfa/setup', setupMfa);

/**
 * POST /api/auth/mfa/verify-setup
 * Verify MFA code during initial enrollment
 */
router.post('/mfa/verify-setup', verifyMfaSetup);

/**
 * POST /api/auth/mfa/verify
 * Verify MFA code during login (SOFTWARE_TOKEN_MFA challenge)
 */
router.post('/mfa/verify', verifyMfaChallenge);

/**
 * POST /api/auth/password/new
 * Handle NEW_PASSWORD_REQUIRED challenge
 */
router.post('/password/new', changePassword);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', refreshToken);

/**
 * POST /api/auth/logout
 * Logout (client-side only, just clear tokens)
 */
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;

