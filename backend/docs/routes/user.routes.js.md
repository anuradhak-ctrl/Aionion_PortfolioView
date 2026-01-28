# Documentation: `routes/user.routes.js`

## 📋 Overview

**Purpose**: Defines all user-related API endpoints including profile management, portfolio access, hierarchy operations, and bulk import.

**Location**: `backend/routes/user.routes.js`

**Dependencies**:
- `express` - Router creation
- `auth.middleware.js` - Authentication and authorization guards
- `user.controller.js` - Controller functions for common operations
- `user-sync.service.js` - Hierarchy and user management services
- `user.repository.js` - Database operations

---

## 🎯 What This File Does

This file registers all **user-related routes** and maps them to appropriate controller functions or inline handlers. It handles:

1. **User Profile Management** - Get/update current user's profile
2. **Portfolio & Financial Data** - Portfolio, ledger access
3. **User Listing** - Get all users (admin) or accessible users (hierarchy-based)
4. **Hierarchy Management** - View subordinates, assign parents
5. **Statistics** - User counts by role
6. **Bulk Operations** - Import multiple users at once

---

## 🔧 Routes Breakdown

### 1. **GET `/api/users/me`** - Get Current User Info

```javascript
router.get('/me', authGuard, userController.getMe);
```

**What it does**: Returns basic information about the currently authenticated user.

**Middleware**:
- `authGuard` - Verifies JWT token, attaches `req.user`

**Controller**: `userController.getMe`

**Request**:
```bash
GET /api/users/me
Authorization: Bearer <jwt-token>
```

**Response** (200 OK):
```json
{
  "id": 4,
  "client_id": "v001726",
  "email": "rm@example.com",
  "name": "RM User",
  "role": "rm",
  "status": "active"
}
```

**Use case**: Frontend uses this to display user name, role in the navbar/header.

**Why separate from `/me/aurora-profile`**: This endpoint returns minimal data (fast), while `aurora-profile` includes hierarchy relationships (slower, more complex).

---

### 2. **GET `/api/users/profile`** - Get Full User Profile

```javascript
router.get('/profile', authGuard, userController.getProfile);
```

**What it does**: Returns detailed profile information including phone, branch, zone, etc.

**Middleware**: `authGuard`

**Controller**: `userController.getProfile`

**Response** (200 OK):
```json
{
  "id": 4,
  "client_id": "v001726",
  "email": "rm@example.com",
  "name": "RM User",
  "role": "rm",
  "phone": "+919876543210",
  "branch_id": "BR001",
  "zone_id": "ZN001",
  "status": "active",
  "mfa_enabled": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Use case**: Profile page in the frontend showing all editable fields.

---

### 3. **PUT `/api/users/profile`** - Update User Profile

```javascript
router.put('/profile', authGuard, userController.updateProfile);
```

**What it does**: Allows user to update their own profile (name, phone, etc.).

**Request**:
```bash
PUT /api/users/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+919998887776"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile updated",
  "user": {
    "id": 4,
    "name": "Updated Name",
    "phone": "+919998887776"
  }
}
```

**Security**: Users can only update their **own** profile (enforced by `authGuard` providing `req.user.id`).

---

### 4. **GET `/api/users/portfolio`** - Get Client Portfolio

```javascript
router.get('/portfolio', authGuard, userController.getClientPortfolio);
```

**What it does**: Returns portfolio data (holdings, P&L) for the authenticated user.

**Middleware**: `authGuard`

**Controller**: `userController.getClientPortfolio`

**Query Parameters**:
- `clientCode` (optional) - If the requester is RM/BM/ZM, fetch portfolio for a specific client

**Request examples**:
```bash
# Client fetching their own portfolio
GET /api/users/portfolio
Authorization: Bearer <client-jwt>

# RM fetching client's portfolio
GET /api/users/portfolio?clientCode=s000216
Authorization: Bearer <rm-jwt>
```

**Response** (200 OK):
```json
{
  "success": true,
  "portfolio": {
    "holdings": [
      {
        "scrip_code": "RELIANCE",
        "quantity": 100,
        "avg_price": 2450.50,
        "current_price": 2520.00,
        "unrealized_pnl": 6950.00
      }
    ],
    "summary": {
      "total_investment": 245050,
      "current_value": 252000,
      "total_pnl": 6950,
      "pnl_percentage": 2.83
    }
  }
}
```

**Caching**: Portfolio data is cached in Redis (handled in controller/service layer).

---

### 5. **POST `/api/users/portfolio/refresh`** - Force Refresh Portfolio

```javascript
router.post('/portfolio/refresh', authGuard, userController.refreshClientPortfolio);
```

**What it does**: Forces a fresh fetch of portfolio data from TechExcel API, bypassing cache.

**When to use**: 
- User clicks "Refresh" button to get latest prices
- Cache is stale or empty

**Request**:
```bash
POST /api/users/portfolio/refresh
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "clientCode": "s000216"  // Optional, for RM/BM/ZM
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Portfolio refreshed",
  "portfolio": { ... }
}
```

**Why POST instead of GET**: POST indicates a state change (cache invalidation + external API call).

---

### 6. **GET `/api/users/ledger`** - Get Account Ledger

```javascript
router.get('/ledger', authGuard, userController.getLedger);
```

**What it does**: Returns ledger/statement data (transactions, balances) from TechExcel.

**Query Parameters**:
- `clientCode` (required for RM/BM/ZM)
- `fromDate` (optional) - Filter transactions after this date
- `toDate` (optional) - Filter transactions before this date

**Request**:
```bash
GET /api/users/ledger?clientCode=s000216&fromDate=2024-01-01
Authorization: Bearer <rm-jwt>
```

**Response** (200 OK):
```json
{
  "success": true,
  "ledger": {
    "transactions": [
      {
        "date": "2024-01-15",
        "description": "Buy RELIANCE",
        "debit": 245050,
        "credit": 0,
        "balance": -245050
      }
    ],
    "closing_balance": -245050
  }
}
```

---

### 7. **GET `/api/users`** - Get All Users (Admin Only)

```javascript
router.get(
  '/',
  authGuard,
  requireRole('super_admin', 'director'),
  userController.getAllUsers
);
```

**What it does**: Returns a paginated list of ALL users in the system (no hierarchy filtering).

**Middleware**:
- `authGuard` - Verify JWT
- `requireRole('super_admin', 'director')` - Only these roles can access

**Controller**: `userController.getAllUsers`

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 50)
- `role` (optional) - Filter by role
- `status` (optional) - Filter by status

**Request**:
```bash
GET /api/users?page=1&limit=50&role=client&status=active
Authorization: Bearer <super-admin-jwt>
```

**Response** (200 OK):
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "client_id": "s000216",
      "email": "client@example.com",
      "name": "Client User",
      "role": "client",
      "status": "active"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "pages": 3
  }
}
```

**Why admin-only**: Viewing all users without hierarchy restrictions is a privileged operation.

---

### 8. **GET `/api/users/clients`** - Get My Clients (Hierarchy-Based)

```javascript
router.get(
  '/clients',
  authGuard,
  requireRole('rm', 'branch_manager', 'zonal_head', 'director', 'super_admin'),
  userController.getClients
);
```

**What it does**: Returns clients that the authenticated user can access based on hierarchy.

**Middleware**:
- `authGuard`
- `requireRole` - Only managers/admins can access (clients cannot)

**Controller**: `userController.getClients`

**Hierarchy logic**:
- **RM**: Sees only their direct clients
- **BM**: Sees clients of all RMs under them
- **ZM**: Sees clients of all BMs and RMs under them
- **Super Admin**: Sees ALL clients

**Request**:
```bash
GET /api/users/clients
Authorization: Bearer <rm-jwt>
```

**Response** (200 OK):
```json
{
  "success": true,
  "clients": [
    {
      "id": 5,
      "client_id": "s000216",
      "email": "client@example.com",
      "name": "Client User",
      "role": "client",
      "parent_id": 4
    }
  ],
  "count": 1
}
```

**Use case**: RM dashboard showing "My Clients" list.

---

### 9. **GET `/api/users/me/aurora-profile`** - Get Aurora Profile with Hierarchy

```javascript
router.get('/me/aurora-profile', authGuard, async (req, res) => {
  try {
    const userId = req.user.id;
    const fullProfile = await userSync.getFullUserProfile(userId);

    res.json({
      success: true,
      data: fullProfile
    });
  } catch (error) {
    console.error('❌ Get Aurora profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile from Aurora'
    });
  }
});
```

**What it does**: Returns user profile WITH hierarchy relationships (parent, children, ancestors).

**Inline handler** (no separate controller function)

**Service**: `userSync.getFullUserProfile(userId)`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 4,
      "client_id": "v001726",
      "email": "rm@example.com",
      "name": "RM User",
      "role": "rm"
    },
    "parent": {
      "id": 3,
      "client_id": "a000065",
      "name": "Zonal Head",
      "role": "zonal_head"
    },
    "children": [
      {
        "id": 5,
        "client_id": "s000216",
        "name": "Client User",
        "role": "client"
      }
    ],
    "ancestors": [
      { "id": 1, "name": "Super Admin", "role": "super_admin" },
      { "id": 3, "name": "Zonal Head", "role": "zonal_head" }
    ]
  }
}
```

**Why inline**: This is a complex query that's only used once, so a dedicated controller function wasn't needed.

**Performance**: Heavier than `/me` because it fetches hierarchy relationships (uses multiple recursive queries).

---

### 10. **GET `/api/users/stats`** - Get User Statistics

```javascript
router.get('/stats', authGuard, async (req, res) => {
  try {
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    let stats;

    if (requesterRole === 'super_admin') {
      // Get ALL users
      const [total, byRole] = await Promise.all([
        userRepo.count(),
        userRepo.countByRole()
      ]);

      stats = {
        total,
        byRole: byRole.reduce((acc, item) => {
          acc[item.role] = item.count;
          return acc;
        }, {})
      };
    } else if (requesterId) {
      // Get subordinates only
      const subordinateCounts = await userSync.getSubordinateCountByRole(requesterId);
      const total = subordinateCounts.reduce((sum, item) => sum + item.count, 0);

      stats = {
        total,
        byRole: subordinateCounts.reduce((acc, item) => {
          acc[item.role] = item.count;
          return acc;
        }, {})
      };
    } else {
      stats = { total: 0, byRole: {} };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
});
```

**What it does**: Returns user count statistics for dashboard widgets.

**Logic**:

1. **If Super Admin**:
   - Counts ALL users in the system
   - Groups by role (client, rm, branch_manager, etc.)

2. **If other role**:
   - Counts only subordinates (users in their hierarchy)
   - Groups by role

**Response for Super Admin**:
```json
{
  "success": true,
  "data": {
    "total": 203,
    "byRole": {
      "client": 150,
      "rm": 30,
      "branch_manager": 15,
      "zonal_head": 7,
      "super_admin": 1
    }
  }
}
```

**Response for RM**:
```json
{
  "success": true,
  "data": {
    "total": 5,
    "byRole": {
      "client": 5
    }
  }
}
```

**Use case**: Dashboard showing "Total Users: 203" or "My Clients: 5".

**Why `await Promise.all()`**: Runs both queries in parallel for better performance.

---

### 11. **GET `/api/users/:id/subordinates`** - Get User's Subordinates

```javascript
router.get('/:id/subordinates', authGuard, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { nested = 'true' } = req.query;

    const subordinates = await userSync.getSubordinates(userId, nested === 'true');

    res.json({
      success: true,
      data: subordinates,
      count: subordinates.length
    });
  } catch (error) {
    console.error('❌ Get subordinates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subordinates'
    });
  }
});
```

**What it does**: Returns all users below a specific user in the hierarchy.

**Path Parameters**:
- `id` - User ID to get subordinates for

**Query Parameters**:
- `nested` - `"true"` (default) returns nested hierarchy, `"false"` returns only direct children

**Request**:
```bash
GET /api/users/3/subordinates?nested=true
Authorization: Bearer <jwt>
```

**Response with `nested=true`**:
```json
{
  "success": true,
  "data": [
    { "id": 4, "name": "RM 1", "role": "rm", "parent_id": 3 },
    { "id": 5, "name": "RM 2", "role": "rm", "parent_id": 3 },
    { "id": 10, "name": "Client 1", "role": "client", "parent_id": 4 },
    { "id": 11, "name": "Client 2", "role": "client", "parent_id": 4 }
  ],
  "count": 4
}
```

**Response with `nested=false`**:
```json
{
  "success": true,
  "data": [
    { "id": 4, "name": "RM 1", "role": "rm", "parent_id": 3 },
    { "id": 5, "name": "RM 2", "role": "rm", "parent_id": 3 }
  ],
  "count": 2
}
```

**Use case**: Org chart visualization, cascade operations (e.g., "reassign all subordinates").

**Security note**: Currently no access control - any authenticated user can view any user's subordinates. Consider adding:
```javascript
// Check if requester can access this user's subordinates
const canAccess = await hierarchyRepo.canAccess(req.user.id, userId);
if (!canAccess) {
  return res.status(403).json({ message: 'Access denied' });
}
```

---

### 12. **POST `/api/users/:id/assign`** - Assign User to Parent

```javascript
router.post('/:id/assign', authGuard, requireRole('super_admin', 'zonal_head', 'branch_manager'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { parent_id } = req.body;
    const assignedBy = req.user?.auroraId;

    if (!parent_id) {
      return res.status(400).json({
        success: false,
        message: 'parent_id is required'
      });
    }

    const result = await userSync.assignUserToParent(userId, parent_id, assignedBy);

    res.json({
      success: true,
      data: result,
      message: 'User assigned successfully'
    });
  } catch (error) {
    console.error('❌ Assign user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign user'
    });
  }
});
```

**What it does**: Changes a user's parent (manager) in the hierarchy.

**Middleware**:
- `requireRole` - Only admins and managers can reassign users

**Request**:
```bash
POST /api/users/10/assign
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "parent_id": 4
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 10,
    "parent_id": 4
  },
  "message": "User assigned successfully"
}
```

**Validation (in `userSync.assignUserToParent`)**:
- ✅ Parent exists
- ✅ No circular reference (user → parent → ... → user)
- ✅ Role compatibility (client can't report to another client)

**Audit logging**: The `assignedBy` parameter tracks who made the change.

**Error example**:
```json
{
  "success": false,
  "message": "Hierarchy validation failed: This assignment would create a circular hierarchy"
}
```

---

### 13. **GET `/api/users/accessible`** - Get Accessible Users

```javascript
router.get('/accessible', authGuard, async (req, res) => {
  try {
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    const { role, status } = req.query;

    const users = await userSync.getAccessibleUsers(requesterId, requesterRole, {
      role,
      status
    });

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('❌ Get accessible users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accessible users'
    });
  }
});
```

**What it does**: Returns all users the requester can "see" (self + subordinates).

**Query Parameters**:
- `role` (optional) - Filter by role (e.g., `role=client`)
- `status` (optional) - Filter by status (e.g., `status=active`)

**Request**:
```bash
GET /api/users/accessible?role=client&status=active
Authorization: Bearer <rm-jwt>
```

**Response**:
```json
{
  "success": true,
  "data": [
    { "id": 4, "client_id": "v001726", "name": "RM User", "role": "rm" },  // Self
    { "id": 10, "client_id": "c001", "name": "Client 1", "role": "client" },
    { "id": 11, "client_id": "c002", "name": "Client 2", "role": "client" }
  ],
  "count": 3
}
```

**Use case**: Dropdown menus ("Select a client"), autocomplete fields.

**Why separate from `/clients`**: 
- `/clients` returns **only** clients
- `/accessible` returns **any role** (clients, RMs, BMs, etc.) that are accessible

---

### 14. **POST `/api/users/bulk-import`** - Bulk Import Users

```javascript
router.post('/bulk-import', authGuard, requireRole('super_admin'), async (req, res) => {
  try {
    const { users, default_parent_id } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'users array is required'
      });
    }

    const result = await userSync.bulkImportUsers(users, default_parent_id);

    res.json({
      success: true,
      data: result,
      message: `Imported ${result.success} users, ${result.failed} failed`
    });
  } catch (error) {
    console.error('❌ Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import users'
    });
  }
});
```

**What it does**: Creates multiple users at once from a JSON array (e.g., CSV upload converted to JSON).

**Middleware**: `requireRole('super_admin')` - Only admins can bulk import

**Request Body**:
```json
{
  "users": [
    {
      "client_id": "c001",
      "email": "client1@example.com",
      "name": "Client 1",
      "role": "client",
      "parent_id": 4
    },
    {
      "client_id": "c002",
      "email": "client2@example.com",
      "name": "Client 2",
      "role": "client",
      "parent_id": 4
    }
  ],
  "default_parent_id": 4  // Optional: Used if a user doesn't have parent_id
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "success": 2,
    "failed": 0,
    "errors": []
  },
  "message": "Imported 2 users, 0 failed"
}
```

**Error handling**: If some users fail, the endpoint still returns 200 OK with details:
```json
{
  "success": true,
  "data": {
    "success": 1,
    "failed": 1,
    "errors": [
      {
        "user": { "client_id": "c002", ... },
        "error": "Hierarchy validation failed: client cannot report to client"
      }
    ]
  },
  "message": "Imported 1 users, 1 failed"
}
```

**Validation**: Each user goes through the same validation as single create (hierarchy rules, circular reference check).

---

## 📊 Route Organization

```
User Routes
│
├─ Profile & Auth
│  ├─ GET /me              (basic info)
│  ├─ GET /profile         (detailed profile)
│  ├─ PUT /profile         (update profile)
│  └─ GET /me/aurora-profile  (profile + hierarchy)
│
├─ Financial Data
│  ├─ GET /portfolio       (holdings, P&L)
│  ├─ POST /portfolio/refresh  (force refresh)
│  └─ GET /ledger          (transactions)
│
├─ User Listing
│  ├─ GET /               (all users - admin only)
│  ├─ GET /clients        (my clients - hierarchy)
│  ├─ GET /accessible     (all accessible users)
│  └─ GET /stats          (user counts)
│
├─ Hierarchy Management
│  ├─ GET /:id/subordinates   (view hierarchy tree)
│  └─ POST /:id/assign        (change parent)
│
└─ Bulk Operations
   └─ POST /bulk-import    (import multiple users)
```

---

## 🚨 Common Issues & Troubleshooting

### Issue 1: "Access denied" when RM tries to view client

**Symptom**:
```
GET /api/users/clients → { clients: [] }
```

**Cause**: Client's `parent_id` doesn't point to the RM.

**Debug**:
```sql
SELECT id, client_id, parent_id FROM users WHERE client_id = 's000216';
-- If parent_id is NULL or points to wrong user, the RM won't see them
```

**Fix**: Assign the client to the RM:
```bash
POST /api/users/10/assign
{ "parent_id": 4 }
```

---

### Issue 2: Portfolio returns 500 error

**Symptom**:
```
GET /api/users/portfolio → 500 Internal Server Error
```

**Possible causes**:
1. TechExcel API is down
2. `clientCode` is invalid
3. Redis connection failed

**Debug**: Check server logs for the actual error from `userController.getClientPortfolio`.

---

### Issue 3: Bulk import fails silently

**Symptom**:
```
POST /api/users/bulk-import → { success: 0, failed: 100 }
```

**Cause**: Usually hierarchy validation errors.

**Solution**: Check the `errors` array in the response:
```json
{
  "data": {
    "errors": [
      {
        "user": { "client_id": "c001" },
        "error": "Hierarchy validation failed: parent_id 999 not found"
      }
    ]
  }
}
```

---

## 📝 Best Practices Followed

✅ **RESTful design** - Proper HTTP verbs (GET for read, POST for create, PUT for update)  
✅ **Consistent response format** - All responses use `{ success, data/message }`  
✅ **Error handling** - All routes have try-catch blocks  
✅ **Role-based access** - `requireRole` middleware protects sensitive endpoints  
✅ **Inline handlers for one-off routes** - Complex logic for single-use endpoints  
✅ **Query parameter support** - Flexible filtering (role, status, nested)  

---

## 🔗 Related Files

- **`controllers/user.controller.js`** - Controller functions called from these routes
- **`middleware/auth.middleware.js`** - Authentication and authorization guards
- **`services/user-sync.service.js`** - Hierarchy and user management logic
- **`aurora/user.repository.js`** - Database queries
- **`aurora/hierarchy.repository.js`** - Recursive hierarchy queries

---

**Last Updated**: 2026-01-20  
**Maintained By**: Backend Team
