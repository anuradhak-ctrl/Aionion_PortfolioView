# Documentation: `aurora/index.js`

## 📋 Overview

**Purpose**: The central export point (Barrel file) for the Database Layer. It aggregates `connection`, `user`, `hierarchy`, and `audit` modules into a single importable package.

**Location**: `backend/aurora/index.js`

---

## 🎯 What This File Does

1.  **Simplifies Imports**: Allows consumers (Services/Controllers) to import everything from one place.
    *   *Before*: `import { userRepo } from '../aurora/user.repository.js'`
    *   *After*: `import { userRepo } from '../aurora/index.js'`
2.  **Namespace Management**: Exports both named exports and a default object.

---

## 🔧 Structure

### Named Exports
*   `db`: Alias for `connection.js`.
*   Direct exports of `query`, `queryRows`, etc., for specific usage.
*   `userRepo`: User CRUD operations.
*   `hierarchyRepo`: Tree traversal operations.
*   `auditRepo`: Log operations.

### Default Export
An object containing all namespaces:
```javascript
{
  db,
  userRepo,
  hierarchyRepo,
  auditRepo
}
```

## 📝 Best Practices
*   **Encapsulation**: Consumers don't need to know the internal file structure of the `aurora/` directory, just the public API surface exposed here.
