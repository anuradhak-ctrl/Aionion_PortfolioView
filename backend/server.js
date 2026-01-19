// Load environment variables from .env file
import 'dotenv/config';
import app from './app.js';

import { connectKambala } from './services/kambala.service.js';

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👤 User API: http://localhost:${PORT}/api/users`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Pre-warm Kambala Connection
  connectKambala().catch(err => console.error('⚠️ Kambala pre-warm failed:', err));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

import redisClient from './services/redis.service.js';

// Handle SIGTERM and SIGINT for graceful shutdown
const gracefulShutdown = () => {
  console.log('🛑 Shutting down server...');
  redisClient.quit().finally(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
