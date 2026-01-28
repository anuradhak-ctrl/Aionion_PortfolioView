# Documentation: `server.js`

## 📋 Overview

**Purpose**: The main entry point for the backend Node.js application. This file starts the HTTP server, initializes external connections, and handles graceful shutdown.

**Location**: `backend/server.js`

**Dependencies**:
- `dotenv/config` - Loads environment variables from `.env` file
- `./app.js` - The Express application instance with all routes and middleware
- `./services/kambala.service.js` - WebSocket service for real-time market data
- `./services/redis.service.js` - Redis cache client

---

## 🎯 What This File Does

1. **Loads environment variables** from `.env` file before anything else runs
2. **Starts the HTTP server** on the configured port (default: 5000)
3. **Pre-warms external connections** (Kambala WebSocket) to reduce first-request latency
4. **Handles graceful shutdown** when the process receives termination signals
5. **Catches unhandled promise rejections** to prevent silent failures

---

## 🔧 Key Components

### 1. Environment Configuration

```javascript
import 'dotenv/config';
```

**What it does**: Loads all variables from `backend/.env` into `process.env` before any other code runs.

**Why it's first**: Environment variables (like `PORT`, `DB_HOST`, `AWS_PROFILE`) must be available before any service initializes.

**Example variables loaded**:
- `PORT` - HTTP server port
- `DB_HOST`, `DB_USER`, `DB_PASSWORD` - Database credentials
- `AWS_PROFILE` - AWS SSO profile for Cognito/Secrets Manager
- `REDIS_HOST` - Redis cache connection

---

### 2. Server Startup

```javascript
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👤 User API: http://localhost:${PORT}/api/users`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Pre-warm Kambala Connection
  connectKambala().catch(err => console.error('⚠️ Kambala pre-warm failed:', err));
});
```

**What it does**:
- Starts the Express app on the specified port
- Prints helpful console messages showing available endpoints
- Pre-warms the Kambala WebSocket connection asynchronously

**Why pre-warm Kambala**:
- The first API request that needs live market data would otherwise wait for the WebSocket to connect
- By connecting during startup, first requests are faster
- The `.catch()` ensures that if Kambala is unavailable, the server still starts (fails gracefully)

**Design decision**: Non-blocking startup
- `connectKambala()` is called asynchronously without `await`
- Server starts immediately, Kambala connects in the background
- If Kambala fails, only live price features are affected, not the entire server

---

### 3. Unhandled Rejection Handler

```javascript
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});
```

**What it does**: Catches any promise that rejects without a `.catch()` handler.

**Why it's critical**:
- Without this, unhandled rejections crash the Node process silently (or with a deprecation warning)
- With this handler, we:
  1. Log the error details for debugging
  2. Exit with code `1` (failure) to signal the process manager (PM2, Docker, systemd) that a restart is needed

**Example scenario**:
```javascript
// Somewhere in the code, a promise is created but not handled
someAsyncFunction().then(result => {
  // If this throws, and there's no .catch(), the unhandledRejection handler catches it
  throw new Error('Oops');
});
```

**Design decision**: Fail fast
- Instead of leaving the process in a broken state, we exit immediately
- The process manager (e.g., Docker, systemd, or PM2) will restart the server automatically

---

### 4. Graceful Shutdown Handling

```javascript
const gracefulShutdown = () => {
  console.log('🛑 Shutting down server...');
  redisClient.quit().finally(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

**What it does**:
- Listens for termination signals (`SIGTERM` from Docker/K8s, `SIGINT` from Ctrl+C)
- Closes the Redis connection cleanly
- Exits with code `0` (success)

**Why this matters**:
- **SIGTERM**: Sent by Docker, Kubernetes, or systemd when stopping the container/service
- **SIGINT**: Sent when you press Ctrl+C in the terminal
- Without graceful shutdown:
  - Redis connections may be left open (exhausting connection pool)
  - In-flight requests may be abruptly terminated
  - Database transactions may be left uncommitted

**Why Redis is closed first**:
- Redis is a persistent connection that should be closed explicitly
- The Express server automatically stops accepting new connections when the process exits
- Database connections (PostgreSQL) are pool-based and clean up automatically

**Design decision**: Redis-only cleanup
- Currently only Redis is explicitly closed
- Database pool (`aurora/connection.js`) could also be added here if needed:
  ```javascript
  const gracefulShutdown = async () => {
    console.log('🛑 Shutting down server...');
    await redisClient.quit();
    await dbPool.end();  // If you want to add this
    process.exit(0);
  };
  ```

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────┐
│  1. Load .env variables                         │
│     ↓                                            │
│  2. Import app.js (Express app with routes)     │
│     ↓                                            │
│  3. Start HTTP server on PORT                   │
│     ↓                                            │
│  4. Print console logs (endpoints, env)         │
│     ↓                                            │
│  5. Pre-warm Kambala WebSocket (async)          │
│     ↓                                            │
│  6. Server is ready to accept requests          │
│                                                  │
│  [Running]                                       │
│     │                                            │
│     ├─ If unhandled rejection → Log & Exit(1)   │
│     ├─ If SIGTERM/SIGINT → Close Redis & Exit(0)│
│     └─ On process crash → systemd/Docker restart│
└─────────────────────────────────────────────────┘
```

---

## 🚨 Common Issues & Troubleshooting

### Issue 1: Server won't start

**Symptom**:
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Cause**: Another process is using port 5000.

**Solution**:
```bash
# Find and kill the process
netstat -ano | findstr :5000   # Windows
lsof -i :5000                   # Mac/Linux

# Or change the port in .env
PORT=5001
```

---

### Issue 2: Kambala pre-warm fails but server still starts

**Symptom**:
```
⚠️ Kambala pre-warm failed: Error: connect ECONNREFUSED
🚀 Server is running on port 5000
```

**Cause**: Kambala WebSocket service is unavailable (normal in local dev if not running).

**Impact**: 
- Server starts successfully
- Live portfolio prices will not work
- Fallback to cached prices or TechExcel data

**Solution**: This is expected behavior. Kambala is optional for most features.

---

### Issue 3: Unhandled rejection crashes server

**Symptom**:
```
Unhandled Promise Rejection: Error: Division by zero
[Process exits]
```

**Cause**: A promise rejection was not caught somewhere in the code.

**Solution**:
1. Check the stack trace to find the source
2. Add proper `.catch()` handlers:
   ```javascript
   // Before (bad)
   asyncFunction();
   
   // After (good)
   asyncFunction().catch(err => console.error('Error:', err));
   ```

3. Or use try-catch in async functions:
   ```javascript
   async function myHandler() {
     try {
       await asyncFunction();
     } catch (err) {
       console.error('Error:', err);
     }
   }
   ```

---

## 🔄 Lifecycle

### Startup Sequence

1. **`dotenv/config` is imported** → `.env` loaded
2. **`app.js` is imported** → Express app created, routes registered
3. **`app.listen()` is called** → HTTP server starts
4. **Console logs print** → Developer sees the server is ready
5. **`connectKambala()` is called** → WebSocket connection starts (async)
6. **Event listeners registered** → `unhandledRejection`, `SIGTERM`, `SIGINT`

### Shutdown Sequence

1. **Signal received** (SIGTERM from Docker or SIGINT from Ctrl+C)
2. **`gracefulShutdown()` is called**
3. **Redis connection closed** (`redisClient.quit()`)
4. **Process exits** with code `0`
5. **Process manager restarts** (if configured to auto-restart)

---

## 📝 Best Practices Followed

✅ **Environment variables loaded first** - Ensures all config is available  
✅ **Non-fatal pre-warming** - Kambala failure doesn't crash the server  
✅ **Graceful shutdown** - Connections are closed cleanly  
✅ **Unhandled rejection handling** - Prevents silent failures  
✅ **Clear console output** - Developers immediately see the server status  

---

## 🔗 Related Files

- **`app.js`** - The Express application with routes and middleware
- **`services/kambala.service.js`** - WebSocket client for live market data
- **`services/redis.service.js`** - Redis cache client
- **`.env`** - Environment configuration

---

## 🎓 Learning Notes

### Why separate `server.js` and `app.js`?

**server.js** (this file):
- Concerns: Process lifecycle, server startup, shutdown
- Responsibilities: Start HTTP listener, handle signals

**app.js**:
- Concerns: Request handling, routing, middleware
- Responsibilities: Configure Express, register routes

**Benefit**: In testing, you can import `app` without starting the server:
```javascript
// In tests
import app from './app.js';
import request from 'supertest';

test('GET /health returns 200', async () => {
  const response = await request(app).get('/health');
  expect(response.status).toBe(200);
});
```

### Why exit on unhandled rejection?

Node.js default behavior (as of v15+) is to crash on unhandled rejections. We make this explicit to:
1. **Log the error** before exiting (helpful for debugging)
2. **Ensure the process manager restarts** the server in a clean state
3. **Prevent zombie processes** that appear running but are broken

---

**Last Updated**: 2026-01-20  
**Maintained By**: Backend Team
