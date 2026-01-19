import express from 'express';
import cors from 'cors';

// Note: dotenv is configured in server.js to load environment-specific files

// Import routes
import userRoutes from './routes/user.routes.js';
import localAuthRoutes from './routes/local-auth.routes.js';
import cognitoAuthRoutes from './routes/cognito.auth.routes.js';
import adminRoutes from './routes/admin.routes.js';

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
// Request timing middleware
// Request timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  // console.log(`➡️  ${req.method} ${req.url} started`); // Quiet mode

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`⏱️  ${req.method} ${req.url} took ${duration}ms [${res.statusCode}]`);
    if (duration > 1000) {
      console.warn(`⚠️  Slow Request: ${duration}ms`);
    }
  });
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    auth: 'Local Development Auth (Dummy Users)',
    note: 'Using test accounts - Cognito disabled'
  });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Auth Routes Configuration
if (process.env.USE_LOCAL_AUTH === 'true') {
  // Use Local/Dummy Auth
  app.use('/api/auth', localAuthRoutes);
  console.log('🔓 Local auth enabled - mounted at /api/auth');
  console.log('📧 Test accounts: client@test.com, rm@test.com, bm@test.com, etc.');
  console.log('🔑 Password for all: test123');
} else {
  // Use Real Cognito Auth
  app.use('/api/auth', cognitoAuthRoutes);
  console.log('🔐 Cognito authentication routes enabled');
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
app.use('/prod/api/admin', adminRoutes);

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
