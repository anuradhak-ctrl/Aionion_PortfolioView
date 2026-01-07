import jwt from 'jsonwebtoken';
import { findDummyUser } from '../config/dummyUsers.js';

// Local development authentication (dummy users)
// ONLY used when NODE_ENV=development and USE_LOCAL_AUTH=true

export const login = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    // Accept either email or username
    const loginEmail = email || username;

    if (!loginEmail || !password) {
      return res.status(400).json({ message: 'Email/username and password required' });
    }

    // Find dummy user
    const user = findDummyUser(loginEmail, password);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // All users are treated as client type for now
    // No userType validation needed

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: user.email, // Use email as ID for dummy users
        email: user.email,
        name: user.name,
        role: user.role,
        poolType: user.poolType,
        isDummyUser: true // Flag to identify dummy users
      },
      process.env.JWT_SECRET || 'local-dev-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful (DUMMY USER)',
      token: token,
      accessToken: token,
      refreshToken: token,
      user: {
        id: user.email,
        email: user.email,
        name: user.name,
        role: user.role,
        poolType: user.poolType
      }
    });

  } catch (error) {
    console.error('Local auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};
