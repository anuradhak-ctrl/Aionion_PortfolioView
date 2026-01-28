# Documentation: `routes/admin.routes.js`

## 📋 Overview

**Purpose**: Defines routes for administrative actions, primarily User Management. These routes are protected by robust Role-Based Access Control (RBAC).

**Location**: `backend/routes/admin.routes.js`

**Dependencies**:
- `auth.middleware.js`: For `verifyToken` and `requireRole`.
- `admin.controller.js`: Request handlers.

---

## 🎯 What This File Does

1.  **Security Gates**: Applies global middleware `verifyToken` and `requireRole` to **all** routes in this file.
    *   **Allowed Roles**: `super_admin`, `director`, `zonal_head`, `branch_manager`.
2.  **User Management**: Routes for CRUD ops on the User entity.
3.  **System Ops**: Routes for triggering sync logic and health checks.

---

## 🔧 Routes & Endpoints

### User Management
| Method | Endpoint | Handler | Access |
|--------|----------|---------|--------|
| `GET` | `/users` | `getUsersByRole` | Admin+ |
| `GET` | `/users/:id` | `getUserById` | Admin+ |
| `POST` | `/users` | `createUser` | Admin+ |
| `PUT` | `/users/:id` | `updateUser` | Admin+ |
| `DELETE` | `/users/:id` | `deleteUser` | Admin+ |

### Hierarchical Actions
| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| `PATCH` | `/users/:id/status` | `updateUserStatus` | Activate/Deactivate user |
| `PATCH` | `/users/:id/parent` | `assignParent` | Change reporting manager |

### System & Stats
| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| `GET` | `/users/stats` | `getUserStats` | Counts by role/status |
| `POST` | `/users/sync` | `syncUsers` | Trigger Cognito Sync |
| `GET` | `/health/db` | `dbHealthCheck` | Admin-only DB ping |

---

## 🚨 Security Considerations
*   **RBAC**: Defined strictly as `['super_admin', 'director', 'zonal_head', 'branch_manager']`.
*   **Note**: While this file allows BMs to access these routes, the *Controller* may apply finer-grained logic (e.g., a BM can only create RMs, not Directors).

## 📝 Usage
Map this router in `app.js` under `/api/admin`.
