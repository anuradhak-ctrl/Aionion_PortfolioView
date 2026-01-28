# Documentation: `services/scrip-search.service.js`

## 📋 Overview

**Purpose**: Resolves human-readable stock symbols (e.g., "RELIANCE") into machine-readable numeric Tokens (e.g., "2885") required by the Kambala/Noren WebSocket API.

**Location**: `backend/services/scrip-search.service.js`

**Dependencies**:
- `axios` - HTTP client.
- `session.json` - Session credentials.
- `redis.service.js` - Caching layer.

---

## 🎯 What This File Does

1.  **Symbol Resolution**: Converts symbols to tokens.
2.  **Exchange Logic**: Determines whether to search NSE or BSE.
3.  **Result Caching**: Stores mapped tokens in Redis indefinitely (tokens rarely change).
4.  **Batch Processing**: Handles bulk lookups efficiently for large portfolios.

---

## 🔧 Workflow

```mermaid
graph TD
    A[Scrip Request: "RELIANCE", Pref: "NSE"] --> B{Cached in Redis?}
    B -- Yes --> C[Return Token "2885"]
    B -- No --> D{Is Numeric?}
    
    D -- Yes (530421) --> E[Force BSE Search]
    D -- No --> F[Try Prerred Exchange]
    
    E --> G[Call SearchScrip API]
    F --> G
    
    G --> H{Found Match?}
    H -- Yes --> I[Cache Token]
    I --> C
    H -- No --> J[Try Fallback Exchange]
```

---

## 🔧 Key Functions

### 1. `getScripToken(symbol, preferredExchange)`

**Purpose**: Find token for a single symbol.

**Optimization Logic**:
*   **Numeric check**: If symbol is "500325", it forces **BSE** search. Does not attempt NSE (saves API call).
*   **Fallback**: If `preferredExchange` = NSE fails, automatically tries BSE.

**Match Logic**:
API returns rough matches. Service strictly verifies:
*   Matches symbol name exactly?
*   Matches with `-EQ` suffix?
*   Matches with `prefix`?

**Caching**:
*   Key: `scrip:NSE|RELIANCE`
*   TTL: None (Indefinite). Tokens are stable identifiers.

---

### 2. `getScripTokens(scrips)`

**Purpose**: Resolves a list of "EXCHANGE|SYMBOL" strings.

**Performance**:
*   **Batching**: Processes requests in parallel chunks of **10** to manage concurrency.
*   **Promise.all**: Waits for all chunks to resolve.

**Returns**:
Object mapping input to output:
```javascript
{
    "NSE|RELIANCE": "NSE|2885",
    "BSE|500325": "BSE|500325"
}
```

---

## 🚨 Common Issues

### Issue 1: "Invalid session credentials"
**Log**: `❌ Invalid session credentials`
**Cause**: `session.json` is missing or expired.
**Fix**: Regenerate session.

### Issue 2: Token Not Found
**Log**: `⚠️ No token: SYMBOL (tried NSE, BSE)`
**Cause**: Symbol name mismatch between TechExcel (Backoffice) and Kambala (Market Data).
**Fix**: Requires manual mapping update or fuzzy match improvement.

## 📝 Design Patterns
*   **Smart Fallback**: Exchange selection logic reduces API calls.
*   **Read-Through Cache**: Checks Redis, fetches from API, writes to Redis.
*   **Throttling**: Batch size limits concurrent connection load.
