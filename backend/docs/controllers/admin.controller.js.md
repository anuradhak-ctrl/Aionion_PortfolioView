# Documentation: `controllers/admin.controller.js`

## 📋 Overview

**Purpose**: Handles HTTP requests for the Administrative Dashboard. Orchestrates logic between the Route layer and the underlying Services (Aurora, Cognito).

**Location**: `backend/controllers/admin.controller.js`

**Dependencies**:
- `aurora.service.js`: For legacy wrapper calls (Search, Health Check).
- `cognito.auth.service.js`: For triggering syncing and user creation in AWS.

---

## 🎯 What This File Does

1.  **User Listings**: Fetches paginated, sorted, and filtered lists of users.
2.  **Statistics**: Aggregates counts (e.g., "10 RMs, 50 Clients").
3.  **User Creation (Dual-Write)**:
    *   Creates user in **AWS Cognito** (Identity).
    *   Creates user in **Aurora** (Application Data).
4.  **Updates**: modifying details, changing parents, activating/deactivating.

---

## 🔧 Key Functions

### 1. `createUser(req, res)`
**Purpose**: Onboard a new user.
**Logic**:
1.  **Validation**: Checks required fields and valid roles.
2.  **Cognito Creation**:
    *   Calls `adminCreateUser` in `cognito.auth.service.js`.
    *   Generates temporary password.
    *   Gets `cognito_sub` (Subject UUID).
3.  **Database Creation**:
    *   Calls `auroraService.createUser`.
    *   Stores the `cognito_sub` link correctly.
4.  **Error Handling**: Smartly detects "User already exists" in either system.

### 2. `syncUsers(req, res)`
**Purpose**: Manual trigger to alignment Cognito and Aurora.
**Logic**:
*   Dynamically imports `cognito.auth.service.js` (to avoid circular dependency issues if any).
*   Calls `syncAllUsersFromCognito`.
*   Returns stats (`synced`, `failed`).

### 3. `getUsersByRole(req, res)`
**Purpose**: Data table feeder.
**Logic**:
*   Handles `search` query parameter (Name/Email/ID search).
*   Handles pagination (`page`, `limit`).
*   Aggregates role counts side-by-side with data for UI badges.

### 4. `assignParent(req, res)`
**Purpose**: Hierarchy Management.
**Logic**:
*   Accepts `parent_id` (or null).
*   Updates database record.
*   *Note*: The Service/Repository layer handles the validation of whether this assignment is legal.

---

## 🚨 Common Issues

### Issue 1: "User already exists"
**Status**: 409 Conflict.
**UI Feedback**: Distinguishes between "Client ID exists" and "Email exists".

### Issue 2: "Sync failed"
**Cause**: Missing AWS credentials or `COGNITO_USER_POOL_ID`.
**Log**: `❌ API: syncUsers error`

## 📝 Best Practices Used
*   **Dual-Write Consistency**: Attempts to keep Cognito and DB in sync during creation.
*   **Dynamic Imports**: Used for the sync service to optimize startup time and manage dependencies.
*   **Role Validation**: Explicit allow-list of roles (`validRoles`) prevents junk data.
