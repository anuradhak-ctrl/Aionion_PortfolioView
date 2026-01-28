# Documentation: `middleware/auth.middleware.js`

## 📋 Overview

**Purpose**: Provides authentication and authorization middleware functions that protect API endpoints. This is the **most security-critical file** in the backend.

**Location**: `backend/middleware/auth.middleware.js`

**Dependencies**:
- `auth.service.js` - JWT verification using JWKS
- `auth-user.service.js` - User loading and token expiry checks
- `aurora/hierarchy.repository.js` - Hierarchy-based access control

---

## 🎯 What This File Does

This file implements a **multi-layered security architecture** with:

1. **Authentication** - Verifies the user is who they claim to be (JWT verification)
2. **Authorization** - Determines what resources the user can access
3. **Role-Based Access Control (RBAC)** - Different permissions for different roles
4. **MFA Enforcement** - Requires multi-factor auth for internal staff
5. **Hierarchy-Based Access** - Users can only access subordinates in their org tree
6. **Defense in Depth** - Multiple security checks at different layers

---

## 🔧 Middleware Functions

### 1. **`authGuard`** - Primary Authentication Middleware

```javascript
export const authGuard = async (req, res, next) => {
  // 7-step verification process
}
```

**What it does**: Verifies the JWT token and loads the user's data from the database. This is the **foundation** of all security - every protected route uses this.

**The 7-Step Verification Process**:

#### Step 1: Extract Token from Header

```javascript
const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
}

const token = authHeader.substring(7);
```

**What it checks**:
- Header exists
- Starts with `"Bearer "` (standard OAuth 2.0 format)
- Extracts the token (removes the `"Bearer "` prefix)

**Example headers**:
```bash
# ✅ Valid
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

# ❌ Missing
(no Authorization header)

# ❌ Wrong format
Authorization: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Authorization: Token eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Why substring(7)**: `"Bearer "` is exactly 7 characters, so `substring(7)` removes it.

---

#### Step 2: Verify JWT Signature and Claims

```javascript
const decoded = await authService.verifyToken(token);

if (!decoded || !decoded.sub) {
  return res.status(401).json({
    success: false,
    message: 'Invalid token'
  });
}
```

**What `authService.verifyToken` checks**:
- ✅ **Signature verification** - Token was signed by the expected issuer (AWS Cognito)
- ✅ **Expiry check** - Token hasn't expired (`exp` claim)
- ✅ **Issuer validation** - Came from the correct Cognito user pool
- ✅ **Audience validation** - Intended for this application (`aud` claim)
- ✅ **Algorithm check** - Uses RS256 (not HS256 or none)

**What's in `decoded`**:
```json
{
  "sub": "a1b2c3d4-5678-90ab-cdef-1234567890ab",  // Cognito user ID
  "email": "user@example.com",
  "email_verified": true,
  "amr": ["pwd", "mfa"],  // Authentication methods (password + MFA)
  "exp": 1737398400,      // Expiry timestamp
  "iat": 1737394800,      // Issued at timestamp
  "iss": "https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_aXl03h8ts",
  "aud": "your-client-id"
}
```

**Why check `decoded.sub`**: The `sub` (subject) claim is the unique user identifier. If it's missing, the token is malformed.

**Possible errors**:
- **Invalid signature** - Token was tampered with or signed by wrong issuer
- **Expired token** - User needs to log in again
- **Wrong audience** - Token is for a different app
- **Malformed token** - Not a valid JWT

---

#### Step 3: Explicit Expiry Check (Defense in Depth)

```javascript
if (isTokenExpired(decoded)) {
  return res.status(401).json({
    success: false,
    message: 'Token expired'
  });
}
```

**Why check again?** 
- `authService.verifyToken` already checks expiry
- This is **defense in depth** - if the JWT library has a bug or misconfiguration, this catches it
- Uses server time instead of relying solely on the JWT library

**Implementation of `isTokenExpired`**:
```javascript
export const isTokenExpired = (decoded) => {
  const now = Math.floor(Date.now() / 1000);  // Current Unix timestamp
  return decoded.exp && decoded.exp < now;
};
```

---

#### Step 4: Fetch User from Aurora Database

```javascript
const user = await loadAuthUser(decoded);
```

**What `loadAuthUser` does**:
1. Looks up the user in the **Aurora database** using `cognito_sub` (from `decoded.sub`)
2. Returns the user's complete profile from the database

**Why fetch from database?**
- **JWT tokens are immutable** - If a user's role changes, the old token still has the old role
- **Database is the authoritative source** - We trust the database more than the token
- **Additional user data** - Token doesn't contain all user attributes (branch_id, parent_id, etc.)

**Example query**:
```sql
SELECT id, client_id, email, name, role, status, parent_id, branch_id, zone_id
FROM users
WHERE cognito_sub = 'a1b2c3d4-5678-90ab-cdef-1234567890ab';
```

**This prevents**:
- **Privilege escalation** - User can't modify their JWT to claim admin role
- **Stale token abuse** - Deleted/demoted users can't use old tokens
- **Role confusion** - Role in DB overrides role in token

---

#### Step 5: Validate User Exists

```javascript
if (!user) {
  console.warn(`Auth: user not found, sub=${decoded.sub?.substring(0, 8)}...`);
  return res.status(403).json({
    success: false,
    message: 'User not found in system',
    code: 'USER_NOT_FOUND'
  });
}
```

**When this happens**:
- User exists in Cognito but was deleted from Aurora
- User exists in Cognito but was never synced to Aurora
- Database connection failed (rare)

**Why 403 instead of 401**:
- **401 Unauthorized** - Authentication failed (token is invalid)
- **403 Forbidden** - Authentication succeeded, but the user is not authorized to exist in this system

**Real-world scenario**:
```
1. User is created in Cognito
2. User logs in successfully (gets valid JWT)
3. Before Aurora sync completes, user makes API call
4. authGuard checks database → user not found
5. Returns 403 'User not found in system'
6. Frontend can show: "Your account is being set up. Please wait..."
```

---

#### Step 6: Validate User is Active

```javascript
if (user.status !== 'active') {
  console.warn(`Auth: blocked inactive, user_id=${user.id}, status=${user.status}`);
  return res.status(403).json({
    success: false,
    message: 'Account is disabled',
    code: 'ACCOUNT_DISABLED'
  });
}
```

**Possible statuses**:
- `active` - ✅ Can access the system
- `inactive` - ❌ Account disabled by admin
- `suspended` - ❌ Temporarily locked (e.g., failed login attempts)
- `pending` - ❌ Account created but not activated

**This prevents**:
- **Suspended users** from accessing the system with old tokens
- **Deleted users** (marked inactive) from using cached tokens
- **Pending users** who haven't completed onboarding

**Real-world scenario**:
```
1. Admin suspends user in Aurora (sets status = 'inactive')
2. User still has valid JWT (expires in 1 hour)
3. User makes API call
4. authGuard fetches user from database → status = 'inactive'
5. Returns 403 'Account is disabled'
6. Frontend can show: "Your account has been disabled. Contact support."
```

**Without this check**: Suspended users could keep using the app until their token expires (up to 1 hour).

---

#### Step 7: Build Secure User Object

```javascript
req.user = {
  // From JWT (identity only)
  cognitoSub: decoded.sub,
  email: decoded.email || user.email,
  amr: decoded.amr || [],
  tokenExp: decoded.exp,

  // From Aurora database (authoritative data)
  id: user.id,
  username: user.client_id,
  clientId: user.client_id,
  name: user.name,
  role: user.role,
  status: user.status,
  userType: user.user_type || (user.role === 'client' ? 'client' : 'internal'),
  hierarchyLevel: user.hierarchy_level,
  hierarchyPath: user.hierarchy_path,
  parentId: user.parent_id,
  branchId: user.branch_id,
  zoneId: user.zone_id
};
```

**What this does**: Creates a **unified user object** combining data from the JWT and the database.

**Field explanations**:

| Field | Source | Purpose | Example |
|-------|--------|---------|---------|
| `cognitoSub` | JWT | Cognito user ID | `"a1b2c3d4-..."` |
| `email` | JWT first, DB fallback | User's email | `"user@example.com"` |
| `amr` | JWT | Auth methods (pwd, mfa) | `["pwd", "mfa"]` |
| `tokenExp` | JWT | Token expiry timestamp | `1737398400` |
| `id` | Database | Internal user ID | `4` |
| `username` | Database | Client code (used by portfolio API) | `"v001726"` |
| `clientId` | Database | Same as username | `"v001726"` |
| `name` | Database | User's full name | `"John Doe"` |
| `role` | Database | User's role | `"rm"` |
| `status` | Database | Account status | `"active"` |
| `userType` | Database | Client or internal | `"internal"` |
| `hierarchyLevel` | Database | Level in org tree | `3` |
| `hierarchyPath` | Database | Path in org tree | `"1.3.4"` |
| `parentId` | Database | Manager's ID | `3` |
| `branchId` | Database | Branch assignment | `"BR001"` |
| `zoneId` | Database | Zone assignment | `"ZN001"` |

**Why this structure**:
- **Flexibility** - Controllers can access both JWT data and database data
- **Performance** - Data is loaded once per request, not on every controller call
- **Security** - `req.user` is only set after all checks pass

**Important**:
- `username` is set to `client_id` because the **portfolio controller** uses `req.user.username` to call TechExcel API
- If you change this, portfolio endpoints will break

---

#### Step 8: Success Logging and Pass Control

```javascript
console.log(`Auth: success, user_id=${user.id}, role=${user.role}`);
next();
```

**What happens**:
- Logs successful authentication (user ID and role only, not email for privacy)
- Calls `next()` to pass control to the next middleware or route handler

**Log example**:
```
Auth: success, user_id=4, role=rm
```

**Why log user_id and not email**: Compliance with privacy regulations (GDPR, etc.). Logs should not contain PII (personally identifiable information) unless necessary.

---

### Error Handling

```javascript
} catch (err) {
  console.error(`Auth: failed, error=${err.message}`);

  return res.status(401).json({
    success: false,
    message: 'Authentication failed'
  });
}
```

**What errors are caught**:
- Database connection failures
- JWT verification errors (expired, invalid signature, etc.)
- Network errors fetching JWKS
- Malformed tokens

**Why generic error message**: 
- Security best practice - don't leak details about why authentication failed
- Prevents attackers from learning about the system
- Actual error is logged to the console for debugging

**Example error log**:
```
Auth: failed, error=JsonWebTokenError: invalid signature
```

---

## 🔧 Additional Middleware Functions

### 2. **`requireMFA`** - Enforce Multi-Factor Authentication

```javascript
export const requireMFA = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.user.status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Account is disabled',
      code: 'ACCOUNT_DISABLED'
    });
  }

  const mfaRequiredRoles = [
    'super_admin',
    'zonal_head',
    'branch_manager',
    'rm'
  ];

  const role = req.user.role;
  const amr = req.user.amr || [];

  if (mfaRequiredRoles.includes(role)) {
    if (!amr.includes('mfa')) {
      console.warn(`MFA: blocked, user_id=${req.user.id}, role=${role}`);
      return res.status(403).json({
        success: false,
        message: 'MFA required for this account',
        code: 'MFA_REQUIRED',
        detail: 'This action requires Multi-Factor Authentication'
      });
    }
  }

  next();
};
```

**What it does**: Blocks access to sensitive endpoints unless the user has completed MFA during login.

**Who needs MFA**:
- ✅ `super_admin` - Can do anything
- ✅ `zonal_head` - Manages multiple branches
- ✅ `branch_manager` - Manages RMs
- ✅ `rm` - Accesses client portfolios
- ❌ `client` - MFA optional (for now)

**How it works**:
1. Check if user's role requires MFA
2. Check the `amr` (Authentication Methods Reference) claim in the JWT
3. If `amr` includes `"mfa"`, the user completed MFA → allow access
4. Otherwise, block access with 403 error

**Example `amr` values**:
```json
// User logged in with password only
{
  "amr": ["pwd"]
}
// ❌ If role requires MFA: blocked

// User logged in with password + MFA
{
  "amr": ["pwd", "mfa"]
}
// ✅ If role requires MFA: allowed
```

**Usage in routes**:
```javascript
router.post(
  '/admin/users/:id/delete',
  authGuard,     // Check authentication
  requireMFA,    // Ensure MFA was completed
  deleteUser     // Actually delete the user
);
```

**Why this is important**:
- **Sensitive operations** (deleting users, viewing all portfolios) should require stronger authentication
- **Compliance** - Many regulations require MFA for privileged accounts
- **Prevents account takeover** - If someone steals a password, they still can't access sensitive data without MFA

---

### 3. **`requireRole`** - Role-Based Access Control

```javascript
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      console.warn(`Role: denied, user_id=${req.user.id}, has=${userRole}, needs=${allowedRoles.join('|')}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
};
```

**What it does**: Only allows users with specific roles to access an endpoint.

**It's a middleware factory**: Returns a new middleware function configured with the allowed roles.

**Usage examples**:

```javascript
// Only super admins can access
router.get(
  '/admin/audit-logs',
  authGuard,
  requireRole('super_admin'),
  getAuditLogs
);

// RMs, BMs, and ZMs can access
router.get(
  '/users/clients',
  authGuard,
  requireRole('rm', 'branch_manager', 'zonal_head', 'super_admin'),
  getClients
);

// Any internal user (not clients)
router.post(
  '/reports/generate',
  authGuard,
  requireRole('rm', 'branch_manager', 'zonal_head', 'director', 'super_admin'),
  generateReport
);
```

**Why use `...allowedRoles` (rest parameter)**:
- Allows any number of roles: `requireRole('admin')` or `requireRole('rm', 'bm', 'zm')`
- Creates an array automatically: `['rm', 'bm', 'zm']`

**Error logging example**:
```
Role: denied, user_id=10, has=client, needs=rm|branch_manager|zonal_head
```

**Design pattern**: This is a **higher-order function** (function that returns a function).

---

### 4. **`requireInternal`** - Internal Users Only

```javascript
export const requireInternal = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.user.userType !== 'internal') {
    console.warn(`Type: internal required, user_id=${req.user.id}, type=${req.user.userType}`);
    return res.status(403).json({
      success: false,
      message: 'Internal access only',
      code: 'INTERNAL_ONLY'
    });
  }

  next();
};
```

**What it does**: Blocks clients from accessing internal-only features.

**User types**:
- `internal` - Staff members (super_admin, director, zonal_head, branch_manager, rm)
- `client` - Customers

**Usage**:
```javascript
router.get(
  '/admin/dashboard',
  authGuard,
  requireInternal,  // Clients can't access admin dashboard
  getAdminDashboard
);
```

**Why separate from `requireRole`**:
- **Broader restriction** - Blocks all clients at once
- **Easier to maintain** - Don't need to list all internal roles
- **Semantic clarity** - "This is for internal users" vs. "This is for RM, BM, ZM, etc."

---

### 5. **`requireClient`** - Clients Only

```javascript
export const requireClient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.user.userType !== 'client') {
    console.warn(`Type: client required, user_id=${req.user.id}, type=${req.user.userType}`);
    return res.status(403).json({
      success: false,
      message: 'Client access only',
      code: 'CLIENT_ONLY'
    });
  }

  next();
};
```

**What it does**: Only allows clients to access an endpoint (blocks internal staff).

**Usage**:
```javascript
router.post(
  '/client/consent',
  authGuard,
  requireClient,  // Only actual clients can give consent
  submitConsent
);
```

**Why block internal users**:
- **Regulatory compliance** - Some actions must be performed by the actual client (e.g., consent, agreements)
- **Prevent impersonation** - Staff shouldn't be able to act as clients

---

### 6. **`requireAccessTo`** - Hierarchy-Based Access Control

```javascript
export const requireAccessTo = (targetIdPath = 'params.id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Extract target ID from request
    const pathParts = targetIdPath.split('.');
    let targetId = req;
    for (const part of pathParts) {
      targetId = targetId?.[part];
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID required'
      });
    }

    const targetIdNum = parseInt(targetId);

    // Super admin can access anyone
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Same user can access own data
    if (targetIdNum === req.user.id) {
      return next();
    }

    // Check hierarchy access
    const canAccess = await hierarchyRepo.canAccess(req.user.id, targetIdNum);

    if (!canAccess) {
      console.warn(`Hierarchy: denied, user_id=${req.user.id} -> target_id=${targetIdNum}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied to this user',
        code: 'HIERARCHY_ACCESS_DENIED'
      });
    }

    next();
  };
};
```

**What it does**: Ensures users can only access resources that belong to them or their subordinates.

**The 3-level check**:

1. **Super admin bypass** - Super admins can access anyone
2. **Self-access** - User can always access their own data
3. **Hierarchy check** - User can access subordinates (from recursive query)

**How `targetIdPath` works**:

```javascript
// Extract user ID from URL parameter
requireAccessTo('params.id')
// GET /users/123 → targetId = req.params.id = "123"

// Extract user ID from query parameter
requireAccessTo('query.userId')
// GET /portfolio?userId=123 → targetId = req.query.userId = "123"

// Extract user ID from request body
requireAccessTo('body.targetUserId')
// POST /assign { targetUserId: 123 } → targetId = req.body.targetUserId = 123
```

**Path parsing**:
```javascript
const pathParts = 'params.id'.split('.');  // ["params", "id"]
let targetId = req;                         // targetId = req
targetId = targetId['params'];             // targetId = req.params
targetId = targetId['id'];                 // targetId = req.params.id
```

**Usage**:
```javascript
router.get(
  '/users/:id/portfolio',
  authGuard,
  requireAccessTo('params.id'),  // Check if user can access :id
  getPortfolioForUser
);
```

**Example scenarios**:

```javascript
// RM (id=4) trying to access their own client (id=10)
canAccess(4, 10) → true (client's parent_id = 4)
// ✅ Allowed

// RM (id=4) trying to access another RM's client (id=15)
canAccess(4, 15) → false (client's parent_id = 5, not 4)
// ❌ Denied

// ZM (id=3) trying to access any client under their hierarchy
canAccess(3, 10) → true (3 → BM → RM → Client)
canAccess(3, 15) → true (3 → BM → RM → Client)
// ✅ Allowed

// Client (id=10) trying to access another client (id=15)
canAccess(10, 15) → false (no hierarchy relationship)
// ❌ Denied
```

**Why this is critical**: Without this, an RM could access any client's portfolio by guessing user IDs in the URL.

---

## 📊 Middleware Stacking

Middleware can be **stacked** (chained) in routes:

```javascript
router.post(
  '/admin/users/:id/suspend',
  authGuard,                  // 1. Verify JWT, load user
  requireRole('super_admin'), // 2. Check user has super_admin role
  requireMFA,                 // 3. Ensure MFA was completed
  requireAccessTo('params.id'), // 4. Check hierarchy access to target user
  suspendUser                 // 5. Actually suspend the user
);
```

**Execution order**: **Left to right**

1. `authGuard` sets `req.user`
2. `requireRole` checks `req.user.role`
3. `requireMFA` checks `req.user.amr`
4. `requireAccessTo` uses `req.user.id` and `req.params.id`
5. `suspendUser` controller runs

**If any middleware fails**: The chain stops, and an error response is sent.

---

## 🚨 Security Best Practices Implemented

### 1. **Defense in Depth**

Multiple layers of checks:
- JWT signature verification
- Explicit expiry check
- Database user lookup
- Status check
- Role check
- MFA check
- Hierarchy check

**Why**: If one layer fails (e.g., JWT library bug), others catch the issue.

---

### 2. **Least Privilege**

Users can only access what they need:
- Clients can only see their own data
- RMs can only see their clients
- BMs can only see their RMs and clients
- Super admin can see everything

**Implementation**: `requireAccessTo` enforces this with recursive hierarchy queries.

---

### 3. **Fail Secure**

Default behavior is **deny access**:
- Missing token → 401
- Invalid token → 401
- User not found → 403
- User inactive → 403
- Wrong role → 403
- No access → 403

**Never fails open**: If there's an error, access is denied.

---

### 4. **Logging Without PII**

Logs contain:
- User ID (not email or name)
- Roles (not sensitive)
- Error types (not full stack traces in production)

**Why**: Compliance with data privacy regulations.

---

### 5. **Generic Error Messages**

```javascript
// ✅ Good (doesn't leak info)
{ "message": "Authentication failed" }

// ❌ Bad (leaks info)
{ "message": "User with email user@example.com does not exist" }
{ "message": "Invalid JWT signature, expected RS256 but got HS256" }
```

**Why**: Prevents attackers from learning about the system.

---

## 🔄 Request Flow with Middleware

```
┌─────────────────────────────────────────────────────┐
│  Client sends request:                              │
│  GET /users/10/portfolio                            │
│  Authorization: Bearer eyJhbG...                    │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│  1. authGuard                                       │
│     ├─ Extract token from header                   │
│     ├─ Verify JWT signature (RS256)                │
│     ├─ Check expiry                                 │
│     ├─ Fetch user from Aurora database             │
│     ├─ Check status = 'active'                     │
│     └─ Set req.user = { id, role, ... }            │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│  2. requireAccessTo('params.id')                    │
│     ├─ Extract targetId = 10 from req.params.id    │
│     ├─ Check if req.user.role = 'super_admin' → No │
│     ├─ Check if targetId = req.user.id → No        │
│     ├─ Query: canAccess(req.user.id, 10)          │
│     │   → Recursive SQL checks hierarchy           │
│     └─ Result: true (user is RM of client 10)     │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│  3. Controller: getPortfolioForUser                 │
│     ├─ Calls techexcel.service.js                  │
│     ├─ Fetches portfolio data                      │
│     └─ Returns JSON response                       │
└─────────────────────────────────────────────────────┘
```

---

## 🚨 Common Issues & Troubleshooting

### Issue 1: "Authentication required" even with valid token

**Symptom**:
```
GET /users/me → 401 "Authentication required"
```

**Possible causes**:
1. Header is missing `"Bearer "` prefix
2. Token is in cookies instead of header
3. CORS issue (browser blocks header)

**Debug**:
```javascript
// Check the exact header being sent
console.log('Authorization:', req.headers.authorization);

// Should be:
"Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Issue 2: "Invalid token" with seemingly valid JWT

**Symptom**:
```
GET /users/me → 401 "Invalid token"
```

**Possible causes**:
1. Token is expired
2. Token was signed by wrong issuer (different Cognito pool)
3. JWKS public key changed (rare)

**Debug**:
```javascript
// Decode JWT without verification to see claims
const base64Url = token.split('.')[1];
const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
}).join(''));
console.log('JWT payload:', JSON.parse(jsonPayload));

// Check exp claim
const payload = JSON.parse(jsonPayload);
const now = Math.floor(Date.now() / 1000);
console.log('Expired?', payload.exp < now);
```

---

### Issue 3: "Account is disabled" for active user

**Symptom**:
```
GET /users/me → 403 "Account is disabled"
```

**Cause**: User's `status` in Aurora is not `'active'`.

**Debug**:
```sql
SELECT id, client_id, status FROM users WHERE cognito_sub = 'a1b2c3d4-...';
-- If status != 'active', user is blocked
```

**Fix**:
```sql
UPDATE users SET status = 'active' WHERE cognito_sub = 'a1b2c3d4-...';
```

---

### Issue 4: "Access denied" for valid hierarchy

**Symptom**:
```
RM tries to access their client → 403 "Access denied to this user"
```

**Cause**: Hierarchy relationship is broken in database.

**Debug**:
```sql
-- Check if client's parent is the RM
SELECT id, client_id, parent_id FROM users WHERE id = 10;  -- Client
SELECT id, client_id FROM users WHERE id = 4;               -- RM

-- If client.parent_id != 4, hierarchy is broken
```

**Fix**:
```sql
UPDATE users SET parent_id = 4 WHERE id = 10;
```

---

## 🔗 Related Files

- **`services/auth.service.js`** - JWT verification using JWKS
- **`auth/auth-user.service.js`** - User loading and token expiry checks
- **`aurora/hierarchy.repository.js`** - Hierarchy queries with cycle detection
- **`routes/user.routes.js`** - Uses these middleware functions extensively

---

**Last Updated**: 2026-01-20  
**Maintained By**: Backend Team  
**Security Review**: Critical - Review any changes carefully
