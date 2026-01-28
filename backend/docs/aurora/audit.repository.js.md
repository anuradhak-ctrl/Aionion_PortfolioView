# Documentation: `aurora/audit.repository.js`

## 📋 Overview

**Purpose**: Maintains a historical trail of system actions. Essential for security audits, debugging, and compliance. It logs "Who did What to Whom" in the `activity_logs` table.

**Location**: `backend/aurora/audit.repository.js`

**Dependencies**:
- `connection.js` - Data access.

---

## 🎯 What This File Does

1.  **Logging**: Write-only operations to record events (`log(...)`).
2.  **Specialized Wrappers**: Shortcuts like `logLogin`, `logUserUpdated` to enforce consistent naming conventions for standard actions.
3.  **Reporting**: Read operations to fetch logs for Admin dashboards, User Timelines, or Security Audits.
4.  **Maintenance**: `deleteOlderThan` for log retention policies.

---

## 🔧 DB Schema (Implicit)
Expected structure of `activity_logs`:
- `user_id` (Actor)
- `action` (e.g., "USER_LOGIN")
- `resource` (e.g., "users")
- `resource_id` (Target ID)
- `details` (JSONB payload)
- `ip_address`
- `user_agent`

---

## 🔧 Key Functions

### 1. `log(userId, action, ...)`
**Purpose**: Generic logger.
**Features**:
*   Automated stringification of `details` JSON.
*   Handles optional metadata like IP and User Agent.

### 2. `logLogin(userId, meta)`
**Purpose**: Security wrapper.
**Usage**: Called by `user.controller.js` or `auth.service.js` after successful authentication.

### 3. `logUserUpdated(updatedBy, userId, changes)`
**Purpose**: Data integrity wrapper.
**Usage**: Captures *what* changed (e.g., `{ role: 'old' -> 'new' }`).

### 4. `findRecent(limit)`
**Purpose**: Admin Dashboard Feed.
**Returns**: Joined stream of logs with Actor Name and Role.

### 5. `countByAction(since)`
**Purpose**: Statistics.
**Example**: "How many logins in the last 24 hours?"

### 6. `deleteOlderThan(days)`
**Purpose**: Cleanup job.
**Usage**: Recommended to run via Cron job/Lambda to purge logs older than 90/180 days (GDPR compliance/storage optimization).

---

## 📝 Best Practices Used
*   **JSONB Details**: Uses proper PostgreSQL JSONB columns for flexible schema-less logging of event details.
*   **Actor Pattern**: Always logs `user_id` (the actor) separate from `resource_id` (the target).
*   **Separation of Concerns**: Audit logic is isolated from business logic, ensuring logs are written even if business flow has edge cases (provided transactions commit).
