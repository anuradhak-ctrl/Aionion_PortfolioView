# Documentation: `aurora/user.repository.js`

## 📋 Overview

**Purpose**: The primary Data Access Layer for the `users` table. Combines CRUD logic with **integrated hierarchy validation** to ensure data integrity.

**Location**: `backend/aurora/user.repository.js`

**Dependencies**:
- `connection.js` - Query execution.
- `hierarchy-validation.service.js` - Logic for ensuring valid parent/child relationships.

---

## 🎯 What This File Does

1.  **Read Operations**: lookup by ID, Client Code, Email, Role, etc.
2.  **Write Operations**: Create, Update, Hard Delete, and **Soft Delete**.
3.  **Validation**: Intercepts `create` and `update` calls to check:
    *   **Role Hierarchy**: e.g., A Zonal Head can only report to a Director.
    *   **Circular References**: Prevents User A -> User B -> User A.
4.  **Upsert Logic**: Handle "Create or Update" scenarios, useful for Cognito Sync.

---

## 🔧 Workflow

### Create/Update Flow with Validation

```mermaid
graph TD
    A[update(userId, { parentId: 5 })] --> B{Parent ID changed?}
    B -- Yes --> C[hierarchyValidation.validateParentAssignment]
    C --> D{Is Valid?}
    D -- No --> E[Throw Error]
    D -- Yes --> F[Execute UPDATE SQL]
```

---

## 🔧 Key Functions

### 1. Read Operations
*   `findById(id)`: Returns full user profile.
*   `findByClientId(clientId)`: Lookup by username (case-insensitive `ILIKE`).
*   `findByRole(role, limit, offset)`: Paginated list.

### 2. `create(userData)`
**Purpose**: Insert new user.
**Validation**: Calls `hierarchyValidation.validateParentAssignment` if `parent_id` is provided. If validation fails, the INSERT is blocked.
**Defaults**:
*   `role`: 'client'
*   `status`: 'active'
*   `user_type`: Derived from role.

### 3. `update(userId, updates)`
**Purpose**: Dynamic update.
**Validation**:
*   Fetches current user first.
*   Determines new Parent ID and new Role.
*   Runs hierarchy checks if either changed.
*   **Allowed Fields**: Whitelist strategy prevents mutating immutable fields (like `id`).

### 4. `upsert(userData)`
**Purpose**: Sync-friendly insert.
**Logic**:
*   Tries to INSERT.
*   On Conflict (`client_id`): Updates Email, Name, Last Login.
*   **Does NOT update Role** automatically (safeguard against accidental demotions).

### 5. `softDelete(userId)`
**Purpose**: Sets `status = 'inactive'`. Preferred over `remove()` for historical integrity.

---

## 🚨 Common Issues

### Issue 1: "Hierarchy validation failed"
**Error**: `Hierarchy validation failed: Parent role 'rm' cannot manage 'zonal_head'`
**Cause**: Attempting to assign a superior as a subordinate to a lower role.
**Fix**: Correct the logic or inputs.

### Issue 2: "User not found" during Update
**Cause**: The ID passed to `update()` does not exist.
**Fix**: Verify ID before calling.

## 📝 Best Practices Used
*   **Whitelist Update**: `allowedFields` array prevents mass-assignment vulnerabilities.
*   **Defense in Depth**: Database-level constraints are backed up by Application-level checks (Validation Service).
*   **Case Insensitivity**: `ILIKE` for username lookups handles "User" vs "user".
