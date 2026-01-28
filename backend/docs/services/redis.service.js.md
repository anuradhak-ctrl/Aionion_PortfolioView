# Documentation: `services/redis.service.js`

## 📋 Overview

**Purpose**: Provides a robust Redis client wrapper with automatic connection handling, JSON serialization/deserialization, and error resilience.

**Location**: `backend/services/redis.service.js`

**Dependencies**:
- `ioredis` - Robust Redis client for Node.js.

---

## 🎯 What This File Does

1.  **Connection Management**: Creates and manages the Redis connection with retry strategies.
2.  **Serialization**: Automatically stringifies objects on SET and parses JSON on GET.
3.  **Fail-Safe**: Catches errors gracefully so cache failures don't crash the application (treating cache miss as default).
4.  **Utility Methods**: Simplified API for common operations (`get`, `set`, `del`).

---

## 🔧 Configuration

The client is configured via environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `REDIS_HOST` | `localhost` | Redis server hostname/IP |
| `REDIS_PORT` | `6379` | Redis server port |
| `REDIS_PASSWORD` | `undefined` | Auth password (if enabled) |

**Retry Strategy**:
*   Exponential backoff: `Math.min(times * 50, 2000)` ms.
*   Cap at 2 seconds delay.
*   Max retries per request: 3.

---

## 🔧 Functions

### 1. `getCache(key)`

**Purpose**: Get a value and parse it as JSON.

**Parameters**:
- `key` (string) - The lookup key.

**Returns**: Promise resolving to the Object (if found and valid JSON) or `null` (if missing or error).

**Fail-Safe**: Returns `null` if Redis is down, acting like a cache miss.

---

### 2. `setCache(key, value, ttl)`

**Purpose**: Store a value with optional expiry.

**Parameters**:
- `key` (string) - The key to set.
- `value` (any) - Object/Array/String to store (automatically JSON.stringified).
- `ttl` (number, optional) - Time-To-Live in seconds. Calls `SETEX` if provided, otherwise `SET`.

---

### 3. `deleteCache(key)`

**Purpose**: Remove a specific key.

---

### 4. `getKeys(pattern)`

**Purpose**: Find keys matching a Glob-style pattern.
- Example: `getKeys("portfolio:*")` finds all portfolio caches.
- **Warning**: `KEYS` command can be slow on large databases. Use with care.

### 5. `flushAll()`

**Purpose**: **DANGER** - Clears the entire Redis database. Used during development or manual cache purge.

---

## 🚨 Common Issues

### Issue 1: "Redis Connection Failed"
**Log**: `⚠️ Redis Connection Failed: Is Redis running on localhost:6379?`
**Cause**: Redis server is not installed or not running.
**Impact**: Application continues to work but performance is degraded (API calls hit upstream services directly).
**Fix**: Start Redis service (`sudo systemctl start redis` or run executable).

### Issue 2: Serialization Errors
**Cause**: Trying to cache circular objects or non-serializable data.
**Behavior**: Error logged, cache write fails, but app logic proceeds.

## 📝 Usage Pattern

```javascript
import { getCache, setCache } from './redis.service.js';

// Try Cache
const cached = await getCache('my:key');
if (cached) return cached;

// Compute/Fetch
const data = await fetchExpensiveData();

// Save Cache (TTL: 1 hour)
await setCache('my:key', data, 3600);

return data;
```
