import express from 'express';
import { loginWithPassword, refreshToken } from '../services/cognito.auth.service.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login with username and password
 */
router.post('/login', loginWithPassword);

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
