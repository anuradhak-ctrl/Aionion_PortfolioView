# Documentation: `services/aurora.service.js`

## 📋 Overview

**Purpose**: Acts as a simplified DAL (Data Access Layer) wrapper around the underlying PostgreSQL connection. It combines connection pooling logic and high-level CRUD operations for the User entity into a single module. Note: While `aurora/user.repository.js` is the new standard, this service exists as a legacy/compatibility layer that some parts of the application still import directly.

**Location**: `backend/services/aurora.service.js`

**Dependencies**:
- `aurora/connection.js`: Low-level query execution.

---

## 🎯 What This File Does

1.  **CRUD Operations**: Provides create, read, update, and delete methods for Users.
2.  **Schema Adaptation**: Handles fields like `status` (active/inactive) and maps them to boolean `is_active` for legacy frontend compatibility.
3.  **Search & Filtering**: Implements pagination and role-based filtering logic.
4.  **Health Check**: Simple database connectivity verification.

---

## 🔧 Key Functions

### 1. `getUsersByRole(role, limit, offset)`
**Purpose**: Paginated list of users.
**Logic**:
*   Selects all standard fields.
*   Dynamically builds WHERE clause if `role` is provided.
*   Sorts by `created_at DESC` (newest first).

### 2. `getUserById(userId)` and `getUserByClientId(clientId)`
**Purpose**: Single record lookup.
**Feature**: Includes `hierarchy_path` and computed columns.
**Use Case**:
*   `getUserById`: Admin dashboard, internal references.
*   `getUserByClientId`: Cognito Sync (mapping username -> db record).

### 3. `createUser(userData)`
**Purpose**: Inserts a new user.
**Logic**:
*   Sets default `status = 'active'`.
*   Includes `client_id`, `email`, `role`, etc.
*   Returns the created record.

### 4. `updateUser(userId, updates)`
**Purpose**: Partial update of user fields.
**Feature**: Dynamic SQL generation.
*   Only updates fields present in the `updates` object.
*   Throws error if object is empty.
*   Updates `updated_at` timestamp automatically.

### 5. `healthCheck()`
**Purpose**: Connectivity probe.
**Returns**: ` { status: 'healthy', timestamp: ... }` if successful.

---

## 🚨 Common Issues

### Issue 1: "No fields to update"
**Cause**: Calling `updateUser` with an empty object.
**Fix**: Ensure at least one field is provided.

### Issue 2: Role Filtering
**Note**: Passing `role='all'` bypasses the filter, returning users of all roles.

## 📝 Design Patterns
*   **Dynamic SQL Construction**: Prevents SQL injection using parameterized queries (`$1`, `$2`...) while allowing flexible optional fields.
*   **Soft Delete**: `deleteUser` currently performs a HARD delete in this file (SQL `DELETE`). *Note: Check if `user.repository.js` implements Soft Delete instead.*
