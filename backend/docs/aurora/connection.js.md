# Documentation: `aurora/connection.js`

## 📋 Overview

**Purpose**: The low-level database infrastructure layer. It manages the PostgreSQL connection pool, AWS RDS credentials retrieval, and provides basic query helper functions.

**Location**: `backend/aurora/connection.js`

**Dependencies**:
- `pg` - PostgreSQL client for Node.js.
- `@aws-sdk/client-secrets-manager` - For fetching database passwords in production.

---

## 🎯 What This File Does

1.  **Connection Pooling**: Uses `pg.Pool` to manage database connections efficiently (default 2-20 connections).
2.  **Credential Management**:
    *   **Production**: Fetches credentials from AWS Secrets Manager using `DB_SECRET_ARN`.
    *   **Fallback/Local**: Uses `DB_USER` and `DB_PASSWORD` from `.env`.
3.  **Unified Query Interface**: Provides standardized `query`, `queryRows`, and `queryOne` functions to reduce boilerplate.
4.  **Transaction Support**: Helper for atomic transaction execution logic.

---

## 🔧 Workflow & Configuration

### Configuration Object
```javascript
const config = {
    host: process.env.RDS_PROXY_ENDPOINT || process.env.DB_HOST,
    port: 5432,
    database: process.env.DB_NAME || 'portfolioview',
    max: 20, // Max concurrent connections
    idleTimeoutMillis: 120000,
    ssl: { rejectUnauthorized: false } // Required for AWS RDS
};
```

### Credentials Logic
The `getDbCredentials()` function implements a prioritization logic:
1.  **Cache**: If credentials already fetched, use them.
2.  **AWS Secrets**: If `DB_SECRET_ARN` is set, fetch JSON from AWS.
3.  **Environment**: Fallback to `.env` variables.

---

## 🔧 Key Functions

### 1. `getPool()`
**Purpose**: Singleton pattern for the database pool. Ensures only one pool is created per application instance.

### 2. `query(text, params)`
**Purpose**: Execute raw SQL.
**Features**:
*   Automated logging in `development` mode (Time taken, row count).
*   Error logging with the problematic SQL snippet.
*   Uses `pool.query`.

### 3. `queryRows(text, params)`
**Purpose**: Syntactic sugar. Returns `result.rows` array directly.

### 4. `queryOne(text, params)`
**Purpose**: Syntactic sugar. Returns `result.rows[0]` or `null` if empty.

### 5. `transaction(callback)`
**Purpose**: Safe transaction handling.
**Usage**:
```javascript
await transaction(async (client) => {
  await client.query('INSERT ...');
  await client.query('UPDATE ...');
});
```
**Behavior**: Automatic `BEGIN`, `COMMIT` on success, `ROLLBACK` on error, and `release()` of the client.

### 6. `healthCheck()`
**Purpose**: Diagnostic. Checks database connectivity and returns server time + current database name.

---

## 🚨 Common Issues

### Issue 1: "Self-signed certificate in certificate chain"
**Cause**: Connecting to AWS RDS/Aurora from local machine or non-AWS environment without proper SSL CA bundle.
**Config**: `ssl: { rejectUnauthorized: false }` is used to bypass this for simplicity, though production usually relies on VPC trust or valid certs.

### Issue 2: "ETIMEDOUT"
**Cause**: Database host unreachable. Check Security Groups (port 5432) and VPN/VPC peering if relevant.

## 📝 Best Practices Used
*   **Singleton Pool**: Prevents connection leaks.
*   **Lazy Loading**: Credentials are fetched only when the first query is executed.
*   **Environment Agnostic**: Works seamlessly in both local and AWS environments.
