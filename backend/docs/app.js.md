# Documentation: `app.js`

## 📋 Overview

**Purpose**: The Express application configuration file. This file sets up all middleware, routes, and error handlers for the HTTP server.

**Location**: `backend/app.js`

**Dependencies**:
- `express` - Web framework for Node.js
- `cors` - Cross-Origin Resource Sharing middleware
- Route files: `user.routes.js`, `admin.routes.js`, `local-auth.routes.js`, `cognito.auth.routes.js`

---

## 🎯 What This File Does

1. **Creates the Express app instance**
2. **Configures middleware** (CORS, JSON parsing, request logging)
3. **Registers API routes** (users, admin, auth)
4. **Supports dual deployment** (local development + AWS API Gateway)
5. **Handles errors** with a centralized error handler

---

## 🔧 Key Components

### 1. Express Application Initialization

```javascript
import express from 'express';
const app = express();
```

**What it does**: Creates the Express application instance that will handle all HTTP requests.

**Why it's separate from server.js**:
- `app.js` configures the request handling (routes, middleware)
- `server.js` starts the actual HTTP server
- This separation allows testing the app without starting a server:
  ```javascript
  // In tests
  import app from './app.js';
  import request from 'supertest';
  
  test('GET /health returns 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });
  ```

---

### 2. CORS Configuration

```javascript
app.use(cors({
  origin: '*',  // Allow all origins (TEMPORARY!)
  credentials: true
}));
```

**What it does**: Allows the frontend (running on a different port/domain) to make requests to this backend.

**Current configuration**:
- `origin: '*'` - Allows requests from **any** domain
- `credentials: true` - Allows cookies and auth headers to be sent

**Why `origin: '*'` is TEMPORARY**:
⚠️ **Security risk in production!** This allows any website to call your API.

**Recommended for production**:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-frontend.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**TODO for the user**: Change `origin: '*'` to a specific domain before deploying to production.

---

### 3. Body Parsing Middleware

```javascript
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

**What it does**:
- `express.json()` - Parses incoming requests with JSON payloads
- `express.urlencoded()` - Parses URL-encoded data (form submissions)

**Example**:
```javascript
// Without this middleware:
app.post('/api/users', (req, res) => {
  console.log(req.body); // undefined
});

// With this middleware:
app.post('/api/users', (req, res) => {
  console.log(req.body); // { name: 'John', email: 'john@example.com' }
});
```

**Why `extended: true`**:
- Allows parsing of nested objects in URL-encoded data
- Example: `user[name]=John&user[email]=john@example.com` → `{ user: { name: 'John', email: 'john@example.com' } }`

---

### 4. Request Timing Middleware

```javascript
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start();
    console.log(`⏱️  ${req.method} ${req.url} took ${duration}ms [${res.statusCode}]`);
    if (duration > 1000) {
      console.warn(`⚠️  Slow Request: ${duration}ms`);
    }
  });
  next();
});
```

**What it does**:
1. Records the start time when a request arrives
2. Waits for the response to finish
3. Logs the request method, URL, duration, and status code
4. Warns if the request took longer than 1 second

**Why this is useful**:
- **Performance monitoring**: Immediately see slow endpoints in the console
- **Debugging**: Track which requests are slow (database queries, external API calls)
- **Alerting**: Could be extended to send metrics to monitoring tools (Datadog, CloudWatch)

**Example output**:
```
⏱️  GET /api/users?role=client took 45ms [200]
⏱️  GET /api/portfolio?clientId=C123 took 320ms [200]
⏱️  POST /api/users took 1520ms [500]
⚠️  Slow Request: 1520ms
```

**Design decision**: Only log on finish, not on start
- Commented out: `console.log(➡️ ${req.method} ${req.url} started)`
- Reason: Reduces console noise; we only care about completed requests and their timing

---

### 5. Health Check Endpoint

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    auth: 'Local Development Auth (Dummy Users)',
    note: 'Using test accounts - Cognito disabled'
  });
});
```

**What it does**: Provides a simple endpoint to verify the server is running.

**Use cases**:
- **Docker health checks**:
  ```yaml
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
  ```
- **Load balancer health checks** (AWS ALB, Kubernetes)
- **Monitoring tools** (Uptime Robot, Pingdom)
- **Quick manual check**: `curl http://localhost:5000/health`

**Response example**:
```json
{
  "status": "OK",
  "message": "Server is running",
  "auth": "Local Development Auth (Dummy Users)",
  "note": "Using test accounts - Cognito disabled"
}
```

---

### 6. Conditional Auth Routes (Local vs. Cognito)

```javascript
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
```

**What it does**: Switches between local dummy auth (for development) and real AWS Cognito auth (for production).

**Why this dual system exists**:

| Environment | Auth Type | Reason |
|-------------|-----------|--------|
| **Local dev** | Dummy users (`local-auth.routes.js`) | - No AWS credentials needed<br>- Faster login (no Cognito roundtrip)<br>- Easier testing (predictable test accounts) |
| **Production** | AWS Cognito (`cognito.auth.routes.js`) | - Real user management<br>- MFA support<br>- Password policies<br>- Audit logging |

**How to switch**:
```dotenv
# In .env file

# For local development (no AWS needed)
USE_LOCAL_AUTH=true

# For production (uses AWS Cognito)
USE_LOCAL_AUTH=false
# or simply delete the line (defaults to Cognito)
```

**Test accounts (local auth only)**:
```javascript
// From config/dummyUsers.js
{
  email: 'client@test.com',
  password: 'test123',
  role: 'client'
},
{
  email: 'rm@test.com',
  password: 'test123',
  role: 'rm'
}
```

**Design decision**: Console logs for clarity
- When the server starts, developers immediately see which auth system is active
- Prevents confusion ("Why isn't my Cognito user working?" → Check if `USE_LOCAL_AUTH=true`)

---

### 7. API Routes Registration

```javascript
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
```

**What it does**: Mounts route handlers at specific URL prefixes.

**Example**:
```javascript
// In user.routes.js
router.get('/', getUsers);           // Becomes: GET /api/users
router.get('/clients', getClients);  // Becomes: GET /api/users/clients
router.post('/', createUser);        // Becomes: POST /api/users

// In admin.routes.js
router.post('/users', createUser);   // Becomes: POST /api/admin/users
router.delete('/users/:id', deleteUser); // Becomes: DELETE /api/admin/users/123
```

**Why prefix with `/api`**:
- Clear separation between API endpoints and static files (if any)
- Easier to apply API-specific middleware (rate limiting, auth) in one place
- Standard convention (e.g., `/api/v1/users` for versioning)

---

### 8. Dual Deployment Support (Local + API Gateway)

```javascript
// Local development routes
app.use('/api/users', userRoutes);
app.use('/api/auth', cognitoAuthRoutes);

// AWS API Gateway routes (with /prod prefix)
app.use('/prod/api/users', userRoutes);
app.use('/prod/api/auth', cognitoAuthRoutes);
```

**What it does**: Mounts the same routes at two different path prefixes.

**Why this exists**:

| Environment | URL Prefix | Full URL Example |
|-------------|------------|------------------|
| **Local dev** | `/api` | `http://localhost:5000/api/users` |
| **AWS Lambda + API Gateway** | `/prod/api` | `https://api.example.com/prod/api/users` |

**How API Gateway works**:
- API Gateway is configured with a stage name (e.g., `prod`, `dev`)
- All routes are prefixed with `/{stage}/` when forwarded to Lambda
- Example:
  - Frontend calls: `https://api.example.com/prod/api/users`
  - API Gateway forwards to Lambda: `/prod/api/users`
  - Express app receives: `/prod/api/users`
  - Route handler executes: `userRoutes.get('/')`

**Design decision**: Duplicate route mounting
- Instead of stripping the `/prod` prefix in middleware, we explicitly mount routes twice
- Pros: Simpler, no path manipulation needed
- Cons: Routes are duplicated (but they're imported, so the actual handlers are shared)

**Alternative approach** (not used here):
```javascript
// Middleware to strip /prod prefix
app.use((req, res, next) => {
  req.url = req.url.replace(/^\/prod/, '');
  next();
});
app.use('/api/users', userRoutes);
```

---

### 9. 404 Handler

```javascript
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});
```

**What it does**: Catches all requests that didn't match any previous route.

**When it runs**:
- **After** all route handlers (`app.use('/api/users', ...)`)
- **Before** the error handler

**Example**:
```bash
curl http://localhost:5000/api/nonexistent
```
Response:
```json
{
  "message": "Route not found"
}
```

**Why it's important**:
- Without this, Express returns a default HTML 404 page
- APIs should return JSON responses, not HTML
- Provides a consistent error format for the frontend

---

### 10. Error Handling Middleware

```javascript
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});
```

**What it does**: Catches any error thrown in route handlers or middleware.

**How it works**:
1. Any route that throws an error (or calls `next(error)`) passes the error here
2. Logs the error to the console
3. Returns a JSON response with the error details

**Example usage in a controller**:
```javascript
// controllers/user.controller.js
export const getUsers = async (req, res, next) => {
  try {
    const users = await userRepo.findAll();
    res.json({ users });
  } catch (error) {
    next(error); // Passes error to the error handler
  }
};
```

**Why `process.env.NODE_ENV === 'development'`**:
- **In development**: Full error stack trace is returned in the response (helps debugging)
- **In production**: Only the error message is returned (hides sensitive details)

**Example responses**:

Development (`NODE_ENV=development`):
```json
{
  "message": "Cannot read property 'id' of undefined",
  "error": {
    "stack": "TypeError: Cannot read property 'id' of undefined\n  at getUsers (user.controller.js:15:20)\n  ..."
  }
}
```

Production (`NODE_ENV=production`):
```json
{
  "message": "Internal server error",
  "error": {}
}
```

**Design decision**: Always log, conditionally expose
- Errors are **always** logged to the console (for CloudWatch, server logs)
- Stack traces are **only** sent to the client in development
- Prevents leaking server paths, library versions, etc. in production

---

## 📊 Request Flow Diagram

```
┌─────────────────────────────────────────────────┐
│  1. Request arrives (e.g., GET /api/users)      │
│     ↓                                            │
│  2. CORS middleware (check origin)              │
│     ↓                                            │
│  3. JSON body parser                            │
│     ↓                                            │
│  4. Request timing starts                       │
│     ↓                                            │
│  5. Route matching:                             │
│     ├─ /health → health check                   │
│     ├─ /api/users → userRoutes                  │
│     ├─ /api/auth → localAuthRoutes OR           │
│     │              cognitoAuthRoutes             │
│     └─ No match → 404 handler                   │
│     ↓                                            │
│  6. Controller logic executes                   │
│     ├─ Success → res.json(...)                  │
│     └─ Error → next(error)                      │
│     ↓                                            │
│  7. Error handler (if error occurred)           │
│     ↓                                            │
│  8. Response sent, timing logged                │
└─────────────────────────────────────────────────┘
```

---

## 🚨 Common Issues & Troubleshooting

### Issue 1: CORS errors in frontend

**Symptom**:
```
Access to fetch at 'http://localhost:5000/api/users' from origin 
'http://localhost:3000' has been blocked by CORS policy
```

**Cause**: The frontend's origin is not allowed.

**Current solution**: `origin: '*'` allows all origins (but this is insecure).

**Production fix**:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-frontend.com',
  credentials: true
}));
```

---

### Issue 2: Routes not working with API Gateway

**Symptom**:
```
GET https://api.example.com/prod/api/users → 404
```

**Cause**: API Gateway adds the stage prefix (`/prod`), but routes are not mounted at that path.

**Solution**: Already handled! Routes are mounted at both `/api` and `/prod/api`.

**Verify**:
```bash
# Local
curl http://localhost:5000/api/users

# API Gateway
curl https://api.example.com/prod/api/users
```

---

### Issue 3: Error stack traces leaking in production

**Symptom**: Clients see full stack traces with server file paths.

**Cause**: `NODE_ENV` is not set to `'production'`.

**Solution**:
```bash
# In production .env or environment variables
NODE_ENV=production
```

---

## 🔄 Middleware Execution Order

Middleware runs in the **exact order** it's defined:

```
1. CORS               ← Allows cross-origin requests
2. express.json()     ← Parses JSON body
3. express.urlencoded ← Parses URL-encoded body
4. Request timing     ← Starts timer
5. Route handlers     ← Your actual API logic
6. 404 handler        ← If no route matched
7. Error handler      ← If any error occurred
```

**Why order matters**:
```javascript
// ❌ WRONG: Error handler before routes
app.use(errorHandler);
app.use('/api/users', userRoutes); // Errors here won't be caught

// ✅ CORRECT: Error handler after routes
app.use('/api/users', userRoutes);
app.use(errorHandler); // Catches errors from routes
```

---

## 📝 Best Practices Followed

✅ **Separation of concerns** - App config separate from server startup  
✅ **Request logging** - Every request is timed and logged  
✅ **Error handling** - Centralized error handler catches all errors  
✅ **Environment-aware** - Different behavior in dev vs. prod  
✅ **Health check** - Easy to verify server status  
✅ **Dual deployment** - Works locally and on AWS Lambda  

---

## 🔗 Related Files

- **`server.js`** - Starts the HTTP server with this app
- **`routes/user.routes.js`** - User-related API endpoints
- **`routes/admin.routes.js`** - Admin-related API endpoints
- **`routes/local-auth.routes.js`** - Local dummy authentication
- **`routes/cognito.auth.routes.js`** - AWS Cognito authentication
- **`middleware/auth.middleware.js`** - JWT verification (used in protected routes)

---

## 🎓 Learning Notes

### Why use Express.js?

**Alternatives**: Koa, Fastify, raw Node.js `http` module

**Reasons for Express**:
1. **Mature ecosystem** - Huge library of middleware (cors, helmet, rate-limit, etc.)
2. **Simple API** - Easy to learn and use
3. **Battle-tested** - Used by millions of apps
4. **AWS Lambda support** - Works with `serverless-http` wrapper

### Middleware vs. Route Handlers

**Middleware**: Functions that run **before** the final route handler
```javascript
app.use(express.json());  // Middleware
app.use(authMiddleware);  // Middleware
```

**Route handlers**: Functions that send the response
```javascript
app.get('/api/users', getUsers);  // Route handler
```

**Key difference**: Middleware calls `next()`, route handlers send a response.

---

**Last Updated**: 2026-01-20  
**Maintained By**: Backend Team
