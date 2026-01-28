# Documentation: `services/secrets-manager.service.js`

## 📋 Overview

**Purpose**: Retrieves sensitive configuration (specifically the TechExcel API Token) from AWS Secrets Manager. It provides a secure mechanism for credential management in production environments while supporting simplified local development overrides.

**Location**: `backend/services/secrets-manager.service.js`

**Dependencies**:
- `@aws-sdk/client-secrets-manager` - AWS SDK for Secrets Manager.

---

## 🎯 What This File Does

1.  **Secure Retrieval**: Fetches secrets from AWS instead of hardcoding them.
2.  **Environment Handling**:
    *   **Local Dev**: Checks `.env` first.
    *   **Production**: Fetches from AWS Secrets Manager.
3.  **Caching**: Caches the secret for **10 minutes** to reduce AWS API costs and latency.

---

## 🔧 Key Functions

### 1. `getTechExcelToken()`

**Purpose**: Fetch the Authentication Token required for TechExcel API calls.

**Workflow**:
1.  **Check `.env`**: If `TECHEXCEL_TOKEN` is set, return it immediately (Priority 1).
2.  **Check Cache**: If an in-memory cached token exists and is fresh (<10 min), return it (Priority 2).
3.  **Fetch from AWS**:
    *   Calls `GetSecretValueCommand` for secret ID `techexcel/api-token` (configurable via `TECHEXCEL_SECRET_NAME`).
    *   Parses the JSON response.
    *   Updates cache.

**Returns**: Valid Token String.

**Throws**: Error if token cannot be found in Env or Secrets Manager.

---

### 2. `clearTokenCache()`

**Purpose**: Force invalidation of the in-memory cache.

**Use Case**: Called if the `techexcel.service.js` receives a 401 Unauthorized error, indicating the token has expired or been rotated.

## 📝 Design Patterns
*   **Layered Fallback**: Env -> Cache -> Remote Service.
*   **Lazy Loading**: Only connects to AWS when the token is actually needed.
