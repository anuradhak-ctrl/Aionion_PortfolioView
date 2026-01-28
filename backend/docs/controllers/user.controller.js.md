# Documentation: `controllers/user.controller.js`

## 📋 Overview

**Purpose**: Request handlers for user-related endpoints. These functions process incoming HTTP requests, orchestrate business logic (via services), and return JSON responses.

**Location**: `backend/controllers/user.controller.js`

**Dependencies**:
- `techexcel.service.js` - External portfolio/ledger API integration
- `user-sync.service.js` - Hierarchy and user management
- `aurora/user.repository.js` - Database user operations

---

## 🎯 What This File Does

This controller handles **9 main operations**:

1. **getMe** - Returns user info with permissions and dashboard type
2. **getProfile** - Returns detailed user profile
3. **updateProfile** - Updates user profile (placeholder)
4. **getAllUsers** - Lists all users (admin only)
5. **getClients** - Lists clients based on hierarchy
6. **getUserById** - Gets specific user by ID
7. **getClientPortfolio** - Fetches portfolio with caching strategy
8. **refreshClientPortfolio** - Forces fresh portfolio fetch
9. **getLedger** - Fetches account ledger/statement

---

## 🔧 Controller Functions

### 1. `getMe` - Get Current User with Permissions

```javascript
export const getMe = (req, res) => {
  // Returns user data + role-based permissions + dashboard type
}
```

**What it does**: Returns the authenticated user's information along with **computed permissions** and the **appropriate dashboard** for their role.

**Called by**: Frontend on app load to determine which features to show.

**Request**:
```bash
GET /api/users/me
Authorization: Bearer <jwt>
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "a1b2c3d4-...",
    "email": "rm@example.com",
    "name": "RM User",
    "role": "rm",
    "poolType": "internal"
  },
  "dashboard": "RM_DASHBOARD",
  "permissions": {
    "canViewClients": true,
    "canManageTeam": false,
    "canAccessReports": false,
    "canManageUsers": false,
    "isInternal": true,
    "isClient": false,
    "isAdmin": false
  }
}
```

**Dashboard Mapping**:
```javascript
const dashboardMap = {
  client: 'CLIENT_DASHBOARD',              // Portfolio, holdings
  rm: 'RM_DASHBOARD',                      // My clients list
  branch_manager: 'BRANCH_MANAGER_DASHBOARD',  // Team management
  zonal_head: 'ZONAL_HEAD_DASHBOARD',      // Multi-branch view
  super_admin: 'SUPER_ADMIN_DASHBOARD',    // Full admin panel
  director: 'DIRECTOR_DASHBOARD'           // Executive overview
};
```

**Permission Rules**:

| Permission | Roles with Access |
|------------|-------------------|
| `canViewClients` | RM, BM, ZM, Director, Super Admin |
| `can ManageTeam` | BM, ZM, Director, Super Admin |
| `canAccessReports` | BM, ZM, Director, Super Admin |
| `canManageUsers` | Director, Super Admin |
| `isInternal` | All except clients |
| `isClient` | Only clients |
| `isAdmin` | Director, Super Admin |

**Why compute permissions**: 
- Frontend uses this to show/hide UI elements
- Prevents client-side permission logic (single source of truth)
- Easy to update permission rules in one place

**Disabled Feature** (commented out):
```javascript
// Proactive Cache Warmup: DISABLED
// Used to pre-load portfolio in background on login
// Removed because it conflicted with frontend hydration
```

**Why disabled**: 
- Frontend now handles portfolio loading explicitly
- Background warmup caused race conditions
- Users prefer seeing "Loading..." vs. empty data

---

### 2. `getProfile` - Get User Profile Details

```javascript
export const getProfile = (req, res) => {
  // Returns profile with token metadata
}
```

**What it does**: Returns user profile including JWT token metadata (issued time, expiry).

**Request**:
```bash
GET /api/users/profile
Authorization: Bearer <jwt>
```

**Response** (200 OK):
```json
{
  "id": "a1b2c3d4-...",
  "email": "user@example.com",
  "name": "User Name",
  "role": "rm",
  "poolType": "internal",
  "tokenIssued": "2024-01-20T10:30:00.000Z",
  "tokenExpires": "2024-01-20T11:30:00.000Z"
}
```

**Use case**: Profile page showing when user logged in and when session expires.

**Token metadata**:
- `tokenIssued` - When the user logged in (from `iat` claim)
- `tokenExpires` - When the session expires (from `exp` claim)

---

### 3. `updateProfile` - Update User Profile (Placeholder)

```javascript
export const updateProfile = async (req, res) => {
  // Placeholder - returns requested changes
}
```

**What it does**: Currently a placeholder that acknowledges the update request.

**Request**:
```bash
PUT /api/users/profile
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "name": "Updated Name"
}
```

**Response** (200 OK):
```json
{
  "message": "Profile update endpoint",
  "userId": "a1b2c3d4-...",
  "requestedChanges": {
    "name": "Updated Name"
  }
}
```

**TODO for implementation**:
```javascript
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    // Update in Aurora database
    const updated = await userRepo.update(req.user.id, { name, phone });
    
    // Optionally update in Cognito
    await cognitoService.updateUserAttributes(req.user.cognitoSub, {
      name,
      phone_number: phone
    });
    
    res.json({
      success: true,
      message: 'Profile updated',
      user: updated
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
```

---

### 4. `getAllUsers` - Get All Users (Admin Only)

```javascript
export const getAllUsers = async (req, res) => {
  // Placeholder - returns empty array
}
```

**What it does**: Placeholder for admin user listing.

**Protected by**: `requireRole('super_admin', 'director')` in routes.

**TODO for implementation**:
```javascript
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, role, status } = req.query;
    
    const users = await userRepo.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      filters: { role, status }
    });
    
    res.json({
      success: true,
      users: users.data,
      pagination: {
        total: users.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(users.total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('getAllUsers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
```

---

### 5. `getClients` - Get Accessible Clients (Hierarchy-Based)

```javascript
export const getClients = async (req, res) => {
  try {
    const clients = await userSyncService.getAccessibleUsers(
      req.user.id, 
      req.user.role, 
      { role: 'client' }
    );

    res.json({
      message: 'Client list',
      requestedBy: req.user.email,
      role: req.user.role,
      clients: clients
    });
  } catch (err) {
    console.error('getClients error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
```

**What it does**: Returns clients the user can access based on hierarchy.

**Hierarchy logic** (in `userSyncService.getAccessibleUsers`):
- **RM**: Only their direct clients
- **BM**: Clients of all RMs under them
- **ZM**: Clients of all BMs and RMs
- **Super Admin**: All clients

**Request**:
```bash
GET /api/users/clients
Authorization: Bearer <rm-jwt>
```

**Response** (200 OK):
```json
{
  "message": "Client list",
  "requestedBy": "rm@example.com",
  "role": "rm",
  "clients": [
    {
      "id": 10,
      "client_id": "s000216",
      "email": "client@example.com",
      "name": "Client User",
      "role": "client"
    }
  ]
}
```

**Protected by**: `requireRole('rm', 'branch_manager', 'zonal_head', 'director', 'super_admin')`

---

### 6. `getUserById` - Get User By ID (Placeholder)

```javascript
export const getUserById = async (req, res) => {
  // Placeholder - returns user ID
}
```

**Current behavior**: Returns the requested user ID (placeholder).

**TODO for implementation**:
```javascript
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    // Check access permission
    if (req.user.role !== 'super_admin') {
      const canAccess = await hierarchyRepo.canAccess(req.user.id, userId);
      if (!canAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const user = await userRepo.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
```

---

### 7. `getClientPortfolio` - Get Portfolio (Cache-First Strategy)

```javascript
export const getClientPortfolio = async (req, res) => {
  // Multi-user support + caching strategy
}
```

**What it does**: Returns portfolio data (holdings, P&L) with a **cache-first** read strategy.

**Supports**:
- ✅ Clients viewing their own portfolio
- ✅ RMs/BMs/ZMs viewing client portfolios (with hierarchy check)

**The Flow**:

#### Step 1: Determine Target Client

```javascript
let clientCode = req.user.username;  // Default: requester's own code

// If RM/BM/ZM requesting specific client
if (req.query.clientCode && req.user.role !== 'client') {
  const requestedCode = req.query.clientCode;
  
  // Find target user
  const targetUser = await userRepo.findByClientId(requestedCode);
  if (!targetUser) {
    return res.status(404).json({ message: 'Client not found' });
  }
  
  // Check hierarchy access
  if (req.user.role !== 'super_admin') {
    const canAccess = await userSyncService.canAccessUser(req.user.id, targetUser.id);
    if (!canAccess) {
      return res.status(403).json({ message: 'Access denied to this client' });
    }
  }
  
  clientCode = requestedCode;
}
```

**Why this check**:
- Prevents RMs from viewing other RMs' clients
- Ensures hierarchy boundaries are respected
- Super admins bypass the check

---

#### Step 2: Try Cache First

```javascript
const cachedData = await techexcelService.getCachedPortfolio(clientCode);

if (cachedData) {
  return res.json({
    success: true,
    clientCode,
    cash: cachedData.cash,
    data: cachedData.holdings,
    timestamp: cachedData.timestamp
  });
}
```

**Why cache-first**:
- **Fast response** - Sub-second instead of 3-5 seconds
- **Reduces TechExcel load** - Avoids repeated external API calls
- **Better UX** - Data appears instantly

**Cache structure** (Redis):
```json
{
  "cash": {
    "previousClosing": 100000,
    "availableBalance": 95000
  },
  "holdings": [
    {
      "scrip": "RELIANCE",
      "qty": 100,
      "avgPrice": 2450.50,
      "ltp": 2520.00,
      "unrealizedPnL": 6950.00
    }
  ],
  "timestamp": 1737398400
}
```

---

#### Step 3: Cache Miss Handling

```javascript
// No cached data available
console.log(`⚠️ Pure Cache Miss for ${clientCode}. Waiting for client trigger.`);

return res.json({
  success: true,
  clientCode,
  cash: { previousClosing: 0, availableBalance: 0 },
  data: [],
  timestamp: 0,
  status: 'syncing'  // Frontend shows "Loading..." spinner
});
```

**Why return empty instead of fetching**:
- **Explicit refresh pattern** - User must click "Refresh" to fetch
- **Prevents accidental load** - First load doesn't hit TechExcel API
- **Frontend handles gracefully** - Shows "No data yet, click refresh"

**Alternative approach** (not used):
```javascript
// Could auto-fetch on cache miss (slower)
const freshData = await techexcelService.fetchClientPortfolio({
  CLIENT_CODE: clientCode,
  bypassCache: false
});
```

---

#### Step 4: Error Handling

```javascript
} catch (err) {
  console.error('getClientPortfolio error:', err);
  
  // Return empty data instead of error (graceful degradation)
  res.json({
    success: false,
    clientCode: req.user.username,
    cash: { previousClosing: 0, availableBalance: 0 },
    data: [],
    message: 'Unable to fetch portfolio data. Please check your network connection or try again later.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}
```

**Why return 200 with error flag**:
- Frontend can show "No data found" message instead of error page
- User can retry instead of navigating away
- Logs still capture the error for debugging

---

### 8. `refreshClientPortfolio` - Explicit Portfolio Refresh

```javascript
export const refreshClientPortfolio = async (req, res) => {
  // Forces fresh fetch from TechExcel API
}
```

**What it does**: **Forces** a fresh portfolio fetch, bypassing all caches.

**When to use**:
- User clicks "Refresh" button
- Portfolio data is stale
- User wants live prices

**The Flow** (similar to getClientPortfolio):

1. **Determine target client** (same logic as getClientPortfolio)
2. **Hierarchy check** (if RM/BM/ZM requesting specific client)
3. **Force fetch** with cache bypass:
   ```javascript
   const result = await techexcelService.fetchClientPortfolio({
     CLIENT_CODE: clientCode,
     bypassCache: true  // ← Ignores cache, fetches fresh
   });
   ```
4. **Return fresh data**

**Request**:
```bash
# Client refreshing own portfolio
POST /api/users/portfolio/refresh
Authorization: Bearer <client-jwt>

# RM refreshing client's portfolio
POST /api/users/portfolio/refresh?clientCode=s000216
Authorization: Bearer <rm-jwt>
```

**Response** (200 OK):
```json
{
  "success": true,
  "clientCode": "s000216",
  "cash": {
    "previousClosing": 100000,
    "availableBalance": 95000
  },
  "data": [
    {
      "scrip": "RELIANCE",
      "qty": 100,
      "avgPrice": 2450.50,
      "ltp": 2520.00,
      "unrealizedPnL": 6950.00
    }
  ],
  "timestamp": 1737398400
}
```

**Why POST instead of GET**:
- POST indicates a **state change** (cache invalidation)
- Prevents browser/proxy caching
- Semantic clarity: "Do an action" vs. "Fetch data"

**Performance note**: Takes 3-5 seconds (TechExcel API call + live price lookup)

---

### 9. `getLedger` - Get Account Ledger/Statement

```javascript
export const getLedger = async (req, res) => {
  // Fetches ledger with hierarchy access check
}
```

**What it does**: Returns account ledger/statement (transactions, balances) from TechExcel API.

**Supports**:
- ✅ Clients viewing their own ledger
- ✅ RMs/BMs/ZMs viewing client ledgers (with hierarchy check)

**The Flow**:

1. **Determine target client** (same logic as portfolio)
2. **Hierarchy check** (if RM/BM/ZM)
3. **Fetch ledger from TechExcel**:
   ```javascript
   const ledgerData = await techexcelService.fetchLedger({
     CLIENT_CODE: clientCode,
     financialYear  // Optional: e.g., "2025-26"
   });
   ```

**Query Parameters**:
- `clientCode` (optional) - For RMs/BMs/ZMs to view specific client
- `financialYear` (optional) - e.g., `"2025-26"` (defaults to current FY)

**Request examples**:
```bash
# Client viewing own ledger
GET /api/users/ledger
Authorization: Bearer <client-jwt>

# RM viewing client's ledger for specific FY
GET /api/users/ledger?clientCode=s000216&financialYear=2024-25
Authorization: Bearer <rm-jwt>
```

**Response** (200 OK):
```json
{
  "success": true,
  "clientCode": "s000216",
  "data": {
    "transactions": [
      {
        "date": "2024-01-15",
        "description": "Buy RELIANCE",
        "debit": 245050,
        "credit": 0,
        "balance": -245050
      },
      {
        "date": "2024-01-20",
        "description": "Dividend Credit",
        "debit": 0,
        "credit": 5000,
        "balance": -240050
      }
    ],
    "openingBalance": 0,
    "closingBalance": -240050
  }
}
```

**Error handling** (specific error messages):
```javascript
const errorMessage = err.message && err.message.includes('not found in TechExcel')
  ? err.message  // "Client s000216 not found in TechExcel system"
  : 'Failed to fetch ledger data';

res.status(500).json({
  success: false,
  message: errorMessage,
  error: process.env.NODE_ENV === 'development' ? err.message : undefined
});
```

**Why specific error for "not found"**:
- Client code might be in Aurora but not synced to TechExcel yet
- Frontend can show "Account pending setup" vs. generic error
- Helps support team troubleshoot sync issues

---

## 📊 Common Patterns Across Functions

### 1. Hierarchy Access Check Pattern

All multi-user endpoints (portfolio, ledger) follow this pattern:

```javascript
// 1. Default to self
let targetCode = req.user.username;

// 2. If requesting someone else's data
if (req.query.clientCode && req.user.role !== 'client') {
  // 3. Find target user
  const targetUser = await userRepo.findByClientId(req.query.clientCode);
  if (!targetUser) {
    return res.status(404).json({ message: 'Client not found' });
  }
  
  // 4. Check hierarchy access (unless super admin)
  if (req.user.role !== 'super_admin') {
    const canAccess = await userSyncService.canAccessUser(req.user.id, targetUser.id);
    if (!canAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
  }
  
  targetCode = req.query.clientCode;
}
```

**Why this pattern**:
- ✅ **Defaults to safe** - If no clientCode, use own data
- ✅ **Explicit permission** - Checks hierarchy before allowing access
- ✅ **Super admin bypass** - Flexible for admins
- ✅ **Clear errors** - 404 vs. 403 tells the user what went wrong

---

### 2. Error Response Pattern

```javascript
} catch (err) {
  console.error('functionName error:', err);
  res.status(500).json({ 
    message: 'User-friendly message',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}
```

**Why this pattern**:
- Always log errors to console (for CloudWatch, debugging)
- Return user-friendly message (not stack traces)
- Only expose error details in development
- Prevents leaking server internals in production

---

### 3. Cache-First Read Pattern (Portfolio)

```javascript
// 1. Try cache first (fast)
const cached = await getCached(key);
if (cached) return cached;

// 2. Cache miss → return empty with status
return { data: [], status: 'syncing' };

// 3. Explicit refresh → fetch fresh
POST /refresh → fetchFresh({ bypassCache: true })
```

**Benefits**:
- ✅ Sub-second initial load
- ✅ User controls when to fetch fresh data
- ✅ Reduces external API load
- ✅ Clear UX: "cached" vs. "loading" vs. "error"

---

## 🚨 Common Issues & Troubleshooting

### Issue 1: RM sees empty client list

**Symptom**:
```bash
GET /api/users/clients → { clients: [] }
```

**Causes**:
1. No clients assigned to RM (check `parent_id` in database)
2. Circular hierarchy (old bug, now fixed with cycle detection)

**Debug**:
```sql
SELECT id, client_id, parent_id, role FROM users WHERE role = 'client';
-- Check if any client has parent_id = RM's id
```

---

### Issue 2: Portfolio returns empty on first load

**Symptom**:
```bash
GET /api/users/portfolio → { data: [], status: 'syncing' }
```

**Cause**: Cache miss (expected behavior).

**Solution**: Click "Refresh" button to trigger:
```bash
POST /api/users/portfolio/refresh
```

---

### Issue 3: "Access denied" when RM views client portfolio

**Symptom**:
```bash
GET /api/users/portfolio?clientCode=s000216 → 403 Access denied
```

**Causes**:
1. Client's `parent_id` doesn't point to the RM
2. Hierarchy relationship is broken

**Debug**:
```sql
-- Check client's parent
SELECT id, client_id, parent_id FROM users WHERE client_id = 's000216';

-- Check RM's id
SELECT id, client_id FROM users WHERE client_id = 'v001726';

-- They should match: client.parent_id = rm.id
```

---

## 🔗 Related Files

- **`routes/user.routes.js`** - Maps URLs to these controller functions
- **`services/techexcel.service.js`** - External API integration
- **`services/user-sync.service.js`** - Hierarchy logic
- **`aurora/user.repository.js`** - Database queries
- **`middleware/auth.middleware.js`** - Protects all these endpoints

---

**Last Updated**: 2026-01-20  
**Maintained By**: Backend Team
