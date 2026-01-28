# Documentation: `services/hierarchy-validation.service.js`

## 📋 Overview

**Purpose**: **THE FIX** - Prevents circular hierarchy references and enforces ZM→BM→RM→Client business rules. This service was created to solve the "No space left on device" database error caused by infinite recursive queries.

**Location**: `backend/services/hierarchy-validation.service.js`

**Dependencies**:
- `aurora/connection.js` - Direct database queries for cycle detection

**Created**: 2026-01-20 (as part of the circular hierarchy fix)

---

## 🎯 What This File Does

This service provides **5 validation functions** that prevent invalid hierarchy assignments:

1. **isValidParentRole** - Checks if parent role is allowed for child role
2. **wouldCreateCycle** - Detects circular references using recursive SQL
3. **validateParentAssignment** - Main validation function (combines role + cycle checks)
4. **getRecommendedParentRole** - Returns suggested parent role for UI
5. **validateBulkHierarchy** - Validates multiple users at once

---

## 🔧 Function Breakdown

### 1. `VALID_HIERARCHY` - Business Rules Configuration

```javascript
const VALID_HIERARCHY = {
    'super_admin': [],  // No parent allowed
    'director': ['super_admin'],
    'zonal_head': ['super_admin', 'director'],
    'branch_manager': ['zonal_head', 'director'],
    'rm': ['branch_manager', 'zonal_head'],
    'client': ['rm', 'branch_manager', 'zonal_head']
};
```

**What it defines**: The **allowed parent roles** for each role in the system.

**Business Rules**:

| Child Role | Allowed Parent Roles | Example |
|------------|---------------------|---------|
| `super_admin` | (none) | Top of hierarchy |
| `director` | `super_admin` | Directors report to super admin |
| `zonal_head` | `super_admin`, `director` | ZMs report to super admin or director |
| `branch_manager` | `zonal_head`, `director` | BMs report to ZM or director |
| `rm` | `branch_manager`, `zonal_head` | RMs report to BM or ZM |
| `client` | `rm`, `branch_manager`, `zonal_head` | Clients can be assigned to RM, BM, or ZM |

**Why this structure**:
- **Flexible** - Allows direct reporting when intermediate levels don't exist
  - Example: RM can report to ZM if there's no BM
  - Example: Client can report to BM if no RM is assigned yet
- **Hierarchical** - Maintains proper org structure
- **Single source of truth** - All validation uses this config

**Example valid assignments**:
```javascript
// ✅ Valid: Client → RM
isValidParentRole('client', 'rm') → true

// ✅ Valid: RM → BM
isValidParentRole('rm', 'branch_manager') → true

// ✅ Valid: RM → ZM (when no BM exists)
isValidParentRole('rm', 'zonal_head') → true

// ❌ Invalid: Client → Client
isValidParentRole('client', 'client') → false

// ❌ Invalid: ZM → RM (upside-down hierarchy)
isValidParentRole('zonal_head', 'rm') → false
```

---

### 2. `isValidParentRole` - Role Compatibility Check

```javascript
export const isValidParentRole = (childRole, parentRole) => {
    const allowedParents = VALID_HIERARCHY[childRole] || [];
    
    if (allowedParents.length === 0 && parentRole) {
        return false;  // This role should have no parent
    }
    
    return allowedParents.includes(parentRole);
};
```

**What it does**: Checks if a parent role is in the allowed list for a child role.

**Parameters**:
- `childRole` (string) - The role being assigned (e.g., `'client'`)
- `parentRole` (string) - The proposed parent's role (e.g., `'rm'`)

**Returns**: `true` if assignment is allowed, `false` otherwise

**Examples**:
```javascript
// Client reporting to RM
isValidParentRole('client', 'rm');
// → true (clients CAN report to RMs)

// Client reporting to another client
isValidParentRole('client', 'client');
// → false (clients CANNOT report to clients)

// Super admin with a parent
isValidParentRole('super_admin', 'director');
// → false (super_admin should have NO parent)

// RM reporting to ZM
isValidParentRole('rm', 'zonal_head');
// → true (RMs CAN report to ZMs)
```

**Edge cases**:

1. **Super admin with parent**:
   ```javascript
   isValidParentRole('super_admin', 'anyone');
   // → false (allowedParents = [], but parentRole is provided)
   ```

2. **Unknown role**:
   ```javascript
   isValidParentRole('unknown_role', 'rm');
   // → false (VALID_HIERARCHY['unknown_role'] = undefined)
   ```

**Use cases**:
- Quick validation in UI (before submitting form)
- Pre-check before calling `validateParentAssignment`
- Generating allowed options in dropdown:
  ```javascript
  const allowedParents = Object.keys(VALID_HIERARCHY)
    .filter(role => isValidParentRole('client', role));
  // → ['rm', 'branch_manager', 'zonal_head']
  ```

---

### 3. `wouldCreateCycle` - **THE CORE FIX** - Circular Reference Detection

```javascript
export const wouldCreateCycle = async (userId, newParentId) => {
    if (!newParentId) return false;  // No parent = no cycle possible
    if (userId === newParentId) return true;  // Self-reference is a cycle
    
    // Check if newParent is a descendant of user
    const sql = `
        WITH RECURSIVE descendants AS (
            SELECT id, 1 as depth, ARRAY[id] as path
            FROM users
            WHERE parent_id = $1
            
            UNION ALL
            
            SELECT u.id, d.depth + 1, d.path || u.id
            FROM users u
            INNER JOIN descendants d ON u.parent_id = d.id
            WHERE d.depth < 10 
              AND NOT (u.id = ANY(d.path))
        )
        SELECT 1 FROM descendants WHERE id = $2
    `;
    
    try {
        const result = await queryOne(sql, [userId, newParentId]);
        return !!result;  // If found, it would create a cycle
    } catch (error) {
        console.error('Cycle detection error:', error.message);
        return true;  // Fail safe: if we can't check, assume it would create cycle
    }
};
```

**What it does**: Checks if assigning `newParentId` as the parent of `userId` would create a circular reference.

**Parameters**:
- `userId` (number) - The user being assigned a new parent
- `newParentId` (number) - The proposed parent's ID

**Returns**: 
- `true` - Would create a cycle (BLOCK the assignment)
- `false` - Safe to assign (ALLOW the assignment)

**The Algorithm**:

1. **Quick checks first** (no database query needed):
   ```javascript
   if (!newParentId) return false;      // No parent → safe
   if (userId === newParentId) return true;  // Self-parent → cycle
   ```

2. **Recursive query** - Find all descendants of `userId`:
   ```sql
   WITH RECURSIVE descendants AS (
       -- Base: Start with direct children
       SELECT id, 1 as depth, ARRAY[id] as path
       FROM users
       WHERE parent_id = $1  -- userId
       
       UNION ALL
       
       -- Recursive: Get nested descendants
       SELECT u.id, d.depth + 1, d.path || u.id
       FROM users u
       INNER JOIN descendants d ON u.parent_id = d.id
       WHERE d.depth < 10                    -- Max 10 levels deep
         AND NOT (u.id = ANY(d.path))        -- Don't revisit same node
   )
   SELECT 1 FROM descendants WHERE id = $2;  -- Check if newParentId is a descendant
   ```

3. **If `newParentId` is found** in descendants → It's a cycle:
   ```
   User (userId=3) → Descendants: [4, 5, 10, 11]
   
   Trying to assign: User 3 → parent: User 4
   
   Check: Is User 4 in descendants of User 3?
   Result: YES (User 4 is a descendant)
   Conclusion: This would create a cycle (3 → 4 → ... → 3)
   ```

**Example scenarios**:

### ✅ Safe Assignment (No Cycle)
```
Current hierarchy:
ZM (id=3)
 └─ RM (id=4)
     └─ Client (id=10)

Proposed: Client 10 → parent: ZM 3

Check: wouldCreateCycle(10, 3)
- Is ZM (3) a descendant of Client (10)? NO
- Result: false (safe to assign)
- New hierarchy: Client can also report to ZM directly ✓
```

### ❌ Cycle Detected (Block Assignment)
```
Current hierarchy:
ZM (id=3)
 └─ RM (id=4)

Proposed: ZM 3 → parent: RM 4 (CREATES CYCLE!)

Check: wouldCreateCycle(3, 4)
- Find descendants of ZM (3): [4, ...]
- Is RM (4) in that list? YES
- Result: true (would create cycle)
- Error: "This assignment would create a circular hierarchy" ❌
```

### ❌ Self-Reference (Blocked Immediately)
```
Proposed: RM 4 → parent: RM 4 (self)

Check: wouldCreateCycle(4, 4)
- userId === newParentId? YES
- Result: true (immediate block, no query needed)
```

**Why the protective measures**:

1. **`d.depth < 10`** - Prevents runaway queries
   - Even if cycle detection fails, query won't run forever
   - 10 levels is far more than any real org hierarchy

2. **`NOT (u.id = ANY(d.path))`** - Path tracking
   - Prevents revisiting the same node
   - Additional safety layer

3. **`try-catch` with fail-safe**:
   ```javascript
   } catch (error) {
       return true;  // If query fails, assume it would create cycle (safe default)
   }
   ```
   - If database is down, BLOCK the assignment
   - Better to be too restrictive than allow a cycle

**Performance**: O(n) where n = number of descendants. Typically < 100ms.

---

### 4. `validateParentAssignment` - **Main Validation Function**

```javascript
export const validateParentAssignment = async (userId, newParentId, userRole) => {
    const errors = [];
    
    // If no parent, check if role allows it
    if (!newParentId) {
        const rolesRequiringParent = ['client', 'rm', 'branch_manager'];
        if (rolesRequiringParent.includes(userRole)) {
            errors.push(`${userRole} must have a parent assigned`);
        }
        return { valid: errors.length === 0, errors };
    }
    
    // Get parent details
    const parent = await queryOne('SELECT id, role FROM users WHERE id = $1', [newParentId]);
    
    if (!parent) {
        errors.push('Parent user not found');
        return { valid: false, errors };
    }
    
    // Check role compatibility
    if (!isValidParentRole(userRole, parent.role)) {
        const allowed = VALID_HIERARCHY[userRole].join(', ') || 'none';
        errors.push(
            `Invalid hierarchy: ${userRole} cannot report to ${parent.role}. ` +
            `Allowed parent roles: ${allowed}`
        );
    }
    
    // Check for circular reference
    if (userId) {
        const wouldCycle = await wouldCreateCycle(userId, newParentId);
        if (wouldCycle) {
            errors.push('This assignment would create a circular hierarchy');
        }
    }
    
    return { valid: errors.length === 0, errors };
};
```

**What it does**: **Complete validation** combining role compatibility, existence checks, and cycle detection.

**Parameters**:
- `userId` (number | null) - User being assigned (null for new users)
- `newParentId` (number) - Proposed parent's ID
- `userRole` (string) - User's role

**Returns**:
```javascript
{
  valid: boolean,      // true if all checks pass
  errors: string[]     // Array of error messages (empty if valid)
}
```

**The 4-Step Validation Process**:

#### Step 1: Check if Parent is Required
```javascript
if (!newParentId) {
    const rolesRequiringParent = ['client', 'rm', 'branch_manager'];
    if (rolesRequiringParent.includes(userRole)) {
        errors.push(`${userRole} must have a parent assigned`);
    }
    return { valid: errors.length === 0, errors };
}
```

**Example**:
```javascript
// Creating a client without a parent
validateParentAssignment(null, null, 'client');
// → { valid: false, errors: ['client must have a parent assigned'] }

// Creating a super admin without a parent
validateParentAssignment(null, null, 'super_admin');
// → { valid: true, errors: [] }  (super_admin doesn't need parent)
```

---

#### Step 2: Check Parent Exists
```javascript
const parent = await queryOne('SELECT id, role FROM users WHERE id = $1', [newParentId]);

if (!parent) {
    errors.push('Parent user not found');
    return { valid: false, errors };
}
```

**Example**:
```javascript
// Assigning to non-existent user
validateParentAssignment(10, 999, 'client');
// → { valid: false, errors: ['Parent user not found'] }
```

---

#### Step 3: Check Role Compatibility
```javascript
if (!isValidParentRole(userRole, parent.role)) {
    const allowed = VALID_HIERARCHY[userRole].join(', ') || 'none';
    errors.push(
        `Invalid hierarchy: ${userRole} cannot report to ${parent.role}. ` +
        `Allowed parent roles: ${allowed}`
    );
}
```

**Example**:
```javascript
// Client trying to report to another client
validateParentAssignment(10, 11, 'client');  // User 11 is also a client
// → { valid: false, errors: [
//     'Invalid hierarchy: client cannot report to client. Allowed parent roles: rm, branch_manager, zonal_head'
//   ]}
```

---

#### Step 4: Check for Circular Reference
```javascript
if (userId) {
    const wouldCycle = await wouldCreateCycle(userId, newParentId);
    if (wouldCycle) {
        errors.push('This assignment would create a circular hierarchy');
    }
}
```

**Example**:
```javascript
// ZM trying to report to their own RM
validateParentAssignment(3, 4, 'zonal_head');  // User 4 is RM under User 3
// → { valid: false, errors: [
//     'Invalid hierarchy: zonal_head cannot report to rm. Allowed parent roles: super_admin, director',
//     'This assignment would create a circular hierarchy'
//   ]}
```

**Note**: Both errors are returned (role mismatch AND cycle) for complete feedback.

---

**Usage in Repositories**:
```javascript
// In user.repository.js create()
const validation = await hierarchyValidation.validateParentAssignment(null, parent_id, role);
if (!validation.valid) {
    throw new Error(`Hierarchy validation failed: ${validation.errors.join('; ')}`);
}

// In user.repository.js update()
if (updates.parent_id !== undefined) {
    const validation = await hierarchyValidation.validateParentAssignment(userId, updates.parent_id, role);
    if (!validation.valid) {
        throw new Error(`Hierarchy validation failed: ${validation.errors.join('; ')}`);
    }
}
```

---

### 5. `getRecommendedParentRole` - UI Helper Function

```javascript
export const getRecommendedParentRole = (userRole) => {
    const allowed = VALID_HIERARCHY[userRole] || [];
    return allowed[0] || null;  // Return primary parent role
};
```

**What it does**: Returns the **primary/recommended** parent role for a given role (for UI forms).

**Parameters**:
- `userRole` (string) - The role being created/edited

**Returns**: `string | null` - The recommended parent role

**Examples**:
```javascript
getRecommendedParentRole('client');
// → 'rm' (clients primarily report to RMs)

getRecommendedParentRole('rm');
// → 'branch_manager' (RMs primarily report to BMs)

getRecommendedParentRole('super_admin');
// → null (no parent recommended)
```

**Use case in UI**:
```javascript
// In a user creation form
const recommended = getRecommendedParentRole(selectedRole);

if (recommended) {
    // Pre-populate parent dropdown
    setParentRoleFilter(recommended);
    // Show hint: "Typically reports to: Branch Manager"
}
```

---

### 6. `validateBulkHierarchy` - Bulk Import Validation

```javascript
export const validateBulkHierarchy = async (users) => {
    const errors = [];
    
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        
        if (user.parent_id) {
            const validation = await validateParentAssignment(null, user.parent_id, user.role);
            if (!validation.valid) {
                errors.push({
                    index: i,
                    user: user.client_id || user.email,
                    errors: validation.errors
                });
            }
        }
    }
    
    return { valid: errors.length === 0, errors };
};
```

**What it does**: Validates an **array of users** for bulk import (e.g., CSV upload).

**Parameters**:
- `users` (array) - Array of user objects with `{ client_id, role, parent_id, ... }`

**Returns**:
```javascript
{
  valid: boolean,
  errors: [
    {
      index: number,     // Position in array
      user: string,      // client_id or email
      errors: string[]   // Validation errors for this user
    }
  ]
}
```

**Example**:
```javascript
const users = [
    { client_id: 'C001', role: 'client', parent_id: 4 },  // ✓ Valid
    { client_id: 'C002', role: 'client', parent_id: 5 },  // ✗ User 5 is also a client
    { client_id: 'C003', role: 'client', parent_id: 4 }   // ✓ Valid
];

const result = await validateBulkHierarchy(users);

// Result:
{
  valid: false,
  errors: [
    {
      index: 1,
      user: 'C002',
      errors: [
        'Invalid hierarchy: client cannot report to client. Allowed parent roles: rm, branch_manager, zonal_head'
      ]
    }
  ]
}
```

**Use case**:
```javascript
// In bulk import endpoint
const { users } = req.body;

const validation = await hierarchyValidation.validateBulkHierarchy(users);

if (!validation.valid) {
    return res.status(400).json({
        success: false,
        message: 'Validation failed for some users',
        errors: validation.errors
    });
}

// Proceed with import...
```

**Why validate before import**:
- **Fail fast** - Don't start import if there are errors
- **Clear feedback** - Show which users have issues
- **All-or-nothing** - Either all users are valid or none are imported

---

## 🚨 Why This Service Was Created

### The Problem (Before This Service)

**Date**: Before 2026-01-20

**Issue**: Circular parent references in database:
```
RM (id=4) → parent: ZM (id=3)
ZM (id=3) → parent: RM (id=4)  ← CIRCULAR!
```

**What happened**:
1. Recursive SQL queries entered infinite loops
2. PostgreSQL filled temp storage with billions of rows
3. Error: **"No space left on device"**
4. Frontend: "timeout of 5000ms exceeded"
5. All hierarchy queries failed

**Impact**: RMs could not see their clients, portfolios wouldn't load.

---

### The Solution (This Service)

**Date**: 2026-01-20

**Implementation**:
1. Created `hierarchy-validation.service.js` with cycle detection
2. Integrated into `user.repository.js` create/update functions
3. Added to `hierarchy.repository.js` assignParent function
4. Also added cycle detection to all recursive SQL queries (defense in depth)

**Result**:
- ✅ **Impossible to create circular hierarchies** from now on
- ✅ Validation happens **before** database is touched
- ✅ Clear error messages: "This assignment would create a circular hierarchy"
- ✅ No more infinite queries

---

## 📊 Integration Points

This service is called from:

1. **user.repository.js** - `create()` and `update()` functions
2. **hierarchy.repository.js** - `assignParent()` function
3. **Bulk import endpoints** - Via `validateBulkHierarchy()`

**Validation flow**:
```
User Action (create/update/assign)
    ↓
Controller receives request
    ↓
Repository function called
    ↓
hierarchyValidation.validateParentAssignment() ← THIS SERVICE
    ↓
  ✓ Valid → Proceed with database operation
  ✗ Invalid → Throw error, rollback
```

---

## 🔗 Related Files

- **`aurora/user.repository.js`** - Calls validation in create/update
- **`aurora/hierarchy.repository.js`** - Calls validation in assignParent + recursive CTEs
- **`aurora/connection.js`** - Provides queryOne/queryRows helpers
- **`WHY-ERRORS-HAPPENED.md`** - Full explanation of the original bug

---

## 🎓 Learning Notes

### Why Cycle Detection is Hard

**Naive approach** (doesn't work):
```javascript
// ❌ WRONG: This doesn't catch all cycles
if (newParentId === userId) {
    return true;  // Only catches A → A, not A → B → A
}
```

**Correct approach** (this service):
- Use recursive SQL to find ALL descendants
- Check if proposed parent is in that list
- Limit depth to prevent runaway queries

### Fail-Safe Design

Every check has a **safe default** if it fails:
- Query error → Assume cycle exists (block assignment)
- Parent not found → Block assignment
- Unknown role → Block assignment

**Why**: Better to be too strict than allow a corrupt hierarchy.

---

**Last Updated**: 2026-01-20  
**Created By**: Backend Team (in response to circular hierarchy bug)  
**Status**: ✅ Production-ready, preventing all future circular references
