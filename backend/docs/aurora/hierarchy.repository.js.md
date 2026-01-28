# Documentation: `aurora/hierarchy.repository.js`

## 📋 Overview

**Purpose**: Handles complex recursive queries for managing and traversing the user tree structure (ZM → BM → RM → Client). It is optimized for both "Top-Down" (Subordinates) and "Bottom-Up" (Ancestors) queries.

**Location**: `backend/aurora/hierarchy.repository.js`

**Dependencies**:
- `hierarchy-validation.service.js` - Integrated Validation logic.
- `connection.js` - Database query engine.

---

## 🎯 What This File Does

1.  **Traversal**: Finds all descendants or ancestors of a user using **Recursive Common Table Expressions (CTEs)**.
2.  **Access Control**: Determines if User A has permission to view User B based on hierarchy (`canAccess`, `findAccessibleUsers`).
3.  **Assignments**: assign/remove parents with validation.
4.  **Cycle Detection**: Includes built-in mechanisms in SQL queries to prevent infinite loops if circular references exist (Defense in Depth).

---

## 🔧 Critical SQL Pattern: Recursive CTE with Cycle Detection

All recursive queries in this file use a robust pattern:

```sql
WITH RECURSIVE traversal AS (
    -- Anchor member
    SELECT id, 1 as depth, ARRAY[id] as path FROM users WHERE ...
    
    UNION ALL
    
    -- Recursive member
    SELECT u.id, t.depth + 1, t.path || u.id
    FROM users u JOIN traversal t ON u.parent_id = t.id
    WHERE t.depth < 10            -- Safe Depth Limit
      AND NOT (u.id = ANY(t.path)) -- Cycle Detection
)
```
**Why this is huge**:
*   **Depth Limit (<10)**: Optimization. No hierarchy in this company exceeds 10 levels. Prevents runaway queries.
*   **Path Check**: `NOT (u.id = ANY(t.path))` ensures that if User A -> B -> C -> A exists, the query stops at C instead of looping infinitely and crashing the DB server.

---

## 🔧 Key Functions

### 1. `findSubordinates(userId, includeNested)`
**Purpose**: Build organization charts.
*   **Nested**: Uses Recursive CTE to get the full tree.
*   **Direct**: Simple `WHERE parent_id = $1`.

### 2. `findAccessibleUsers(accessorId, role)`
**Purpose**: Populates "Select Client" dropdowns for RMs/Managers.
**Logic**:
*   **Super Admin**: `SELECT * FROM users`.
*   **Others**: Returns **Self + All Subordinates**.
*   **Filters**: Supports filtering this subset by Branch/Zone.

### 3. `canAccess(accessorId, targetId)`
**Purpose**: Row Level Security (RLS) implementation app-side.
**Returns**: `true` if target is found in the accessor's descendant tree.

### 4. `assignParent(userId, parentId)`
**Purpose**: Update connection.
**Validation**: Calls `hierarchyValidation.validateParentAssignment()`. Blocks invalid moves (e.g., RM managing a Zonal Head).

### 5. `findWithFullHierarchy(userId)`
**Purpose**: User Profile view.
**Returns**: Combined object with User details + Parent Name + Branch Name + Zone Name.

---

## 🚨 Common Issues

### Issue 1: "Maximum recursion depth exceeded"
**Cause**: Before the fix, circular references caused this.
**Fix**: The `depth < 10` clause and `path` check now silently handle these edge cases without erroring.

### Issue 2: Performance
**Note**: Recursive CTEs are expensive.
**Optimization**: The `user-sync.service.js` uses `hierarchy_path` (Materialized Path) for simpler lookups (LIKE query) which is faster. This repository is used when *structural traversal* or graph-like properties are needed.

## 📝 Design Patterns
*   **Recursive CTE**: Standard SQL pattern for tree traversal.
*   **Safety Guards**: Depth limits and Path tracking.
*   **Polymorphic Access**: Unified function `findAccessibleUsers` behaves differently for Admin vs Standard users.
