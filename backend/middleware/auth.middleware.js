// middleware/auth.middleware.js
// PURE ES MODULE — FINAL VERSION

import * as authService from '../services/auth.service.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    req.user = await authService.verifyToken(token);
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

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

export const requireInternal = (req, res, next) => {
  if (req.user.poolType !== 'internal') {
    return res.status(403).json({ message: 'Internal access only' });
  }
  next();
};

export const requireClient = (req, res, next) => {
  if (req.user.poolType !== 'client') {
    return res.status(403).json({ message: 'Client access only' });
  }
  next();
};
