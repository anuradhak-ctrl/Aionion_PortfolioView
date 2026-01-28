# Documentation: `services/kambala.service.js`

## 📋 Overview

**Purpose**: Manages real-time market data connection via WebSocket (Nebula/Kambala). Streams Live Stock Prices (LTP) and fetches Previous Closing prices.

**Location**: `backend/services/kambala.service.js`

**Dependencies**:
- `ws` - WebSocket client.
- `session.json` - Local session file containing valid credentials (`uid`, `susertoken`).
- `redis.service.js` - Caching for previous close prices.

---

## 🎯 What This File Does

1.  **Persistent WebSocket Connection**: Maintains a single, long-lived connection to the market data server.
2.  **Subscription Management**: Tracks active scrips and automatically re-subscribes upon reconnection.
3.  **Live Price Streaming (`getLTP`)**:
    *   Accepts list of scrips (e.g., `["NSE|RELIANCE", "BSE|TCS"]`).
    *   Subscribes to them on the WebSocket.
    *   **Smart Polling**: Waits briefly (up to 2.5s) for initial data snapshot so UI gets data immediately.
    *   Caches prices in-memory (`livePrices`) for microsecond access.
4.  **Previous Close Fetching (`getPreviousClosing`)**:
    *   Uses REST API (`GetQuotes`).
    *   Implements "Cache First, Background Fetch" strategy to avoid blocking.
    *   persists values in Redis for 24 hours.

---

## 🔧 Key Functions

### 1. `connectKambala()`

**Purpose**: Establishes the WebSocket connection.

**Logic**:
*   **Singleton**: Returns existing promise/client if already connecting/connected.
*   **Authentication**: Reads `session.json` and sends auth packet (`t: 'c'`).
*   **Handlers**:
    *   `ck` (Auth OK): Sets state to connected, re-sends subscriptions.
    *   `lf` / `lk` (Live Feed): Updates `livePrices` global object.
*   **Reconnection**: Handled by client logic calling `connectKambala()` implicitly via `getLTP`.

---

### 2. `getLTP(scrips, predefinedTokenMap)`

**Purpose**: Get Last Traded Price for a list of scrips.

**The "Smart Poll" Pattern**:
Fetching live prices is asynchronous (Subscribe -> Wait for Tick). To prevent sending `0` to the frontend on first load:

1.  **Subscribe**: Send subscription packet.
2.  **Check Cache**: Do we have prices in `livePrices`?
3.  **Wait Loop**:
    *   If prices are missing, wait **100ms**.
    *   Check again.
    *   Repeat until **2.5s** timeout or all prices found.
4.  **Return**: Returns whatever data is available.

**Why this matters**:
*   Without this, the first API call would return `0` cost/value.
*   With this, the first call waits just enough time to get real data.

---

### 3. `getPreviousClosing(scrips)`

**Purpose**: Get yesterday's closing price (critical for "Day Change %").

**Strategy**:
1.  **Cache First**: Checks Redis (`prevclose:EXCHANGE|TOKEN`).
2.  **Return Fast**: Returns available cached data immediately.
3.  **Background Queue**:
    *   Identifies missing items.
    *   Spawns a **detached background process**.
    *   Fetches from `GetQuotes` API one by one.
    *   **Rate Limit**: 600ms delay between calls (avoids 429 errors).
    *   Updates Redis.

**Why Background Fetch**:
*   `GetQuotes` API is slow (HTTP).
*   Fetching 50 scrips sequentially would take 30 seconds.
*   We return partial data instantly, and the cache warms up for the next refresh.

---

## 🔧 Data Structures

### In-Memory Cache (Global)

```javascript
const livePrices = {
    "NSE|2885": 2450.50,
    "BSE|500325": 2448.00
};

const activeSubscriptions = new Set([
    "NSE|2885", 
    "BSE|500325"
]);
```

**Why Memory vs Redis for LTP**:
*   LTP updates hundreds of times per second.
*   Writing to Redis for every tick is too much I/O overhead.
*   Node.js memory access is nanosecond-scale.

### Redis Cache (Previous Close)

```
Key: prevclose:NSE|2885
Value: 2420.00
TTL: 24 hours
```

---

## 🚨 Common Issues

### Issue 1: "Invalid Session Credentials"
**Log**: `❌ Error reading session.json`
**Cause**: `backend/session.json` is missing or expired.
**Fix**: Must generate a new session (usually via a separate script or login tool) and place it in the backend folder.
*Note: This system currently relies on file-based session management for the WebSocket.*

### Issue 2: "WebSocket Error"
**Cause**: Network interruption or server disconnect.
**Behavior**: Client sets `wsClient = null`. Next call to `getLTP` triggers reconnection + resubscription logic.

### Issue 3: Prices causing blocking
**Symptom**: Portfolio API takes exactly 2.5s to respond.
**Cause**: "Smart Poll" waiting for a scrip that is illiquid or delisted (no ticks receiving).
**Mitigation**: The 2.5s timeout ensures request eventually completes.

## 📝 Design Patterns
*   **Singleton**: Single WS connection.
*   **Pub/Sub**: Single subscriber for multiple requests.
*   **Optimistic UI**: Return cache immediately, fetch missing data in background.
*   **Polling w/ Timeout**: Best-effort wait for async data.
