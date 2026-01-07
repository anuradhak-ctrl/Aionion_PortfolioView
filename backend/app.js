import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Import routes
import userRoutes from './routes/user.routes.js';

// Initialize express app
const app = express();

// Middleware
// TEMPORARY: Allow all origins for testing
// TODO: Change back to specific domain after testing
app.use(cors({
  origin: '*',  // Allow all origins (TEMPORARY!)
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Full URL:', req.url);
  console.log('Base URL:', req.baseUrl);
  console.log('Original URL:', req.originalUrl);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    auth: 'AWS Cognito USER_PASSWORD_AUTH',
    note: 'Custom login via backend (no Hosted UI)'
  });
});

// API routes
app.use('/api/users', userRoutes);

// Cognito authentication routes (production)
import cognitoAuthRoutes from './routes/cognito.auth.routes.js';
app.use('/api/auth', cognitoAuthRoutes);
console.log('🔐 Cognito authentication enabled');

// Local development auth (dummy users) - can coexist
if (process.env.USE_LOCAL_AUTH === 'true') {
  import('./routes/local-auth.routes.js')
    .then(module => {
      app.use('/api/local-auth', module.default);
      console.log('🔓 Local auth enabled - using dummy users');
      console.log('📧 Test accounts: client@test.com, rm@test.com, bm@test.com, etc.');
      console.log('🔑 Password for all: test123');
    })
    .catch(err => {
      console.error('Failed to load local auth routes:', err);
    });
}

// Also mount routes at /prod for API Gateway
app.get('/prod/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    auth: 'AWS Cognito USER_PASSWORD_AUTH',
    note: 'Custom login via backend (no Hosted UI)'
  });
});

app.use('/prod/api/users', userRoutes);
app.use('/prod/api/auth', cognitoAuthRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

export default app;
