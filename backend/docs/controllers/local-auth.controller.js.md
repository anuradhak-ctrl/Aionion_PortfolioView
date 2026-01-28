# Documentation: `controllers/local-auth.controller.js`

## 📋 Overview

**Purpose**: Handles authentication requests in **Local Development Mode**. Bypasses AWS Cognito and authenticates against a static list of dummy users.

**Location**: `backend/controllers/local-auth.controller.js`

**Dependencies**:
- `dummyUsers.js`: Source of static user data.
- `jsonwebtoken`: Signing mock tokens locally.

---

## 🎯 What This File Does

1.  **Mock Login**: Validates credentials against `dummyUsers.js`.
2.  **Mock Token Generation**: Issues a JWT signed with a local secret (`local-dev-secret-key`) instead of RS256/Cognito keys.
3.  **Payload Structuring**: Matches the structure of Cognito tokens so the frontend doesn't need to change logic.

---

## 🔧 Key Functions

### `login(req, res)`

**Logic**:
1.  Check input (username/email + password).
2.  Call `findDummyUser()`.
3.  If found:
    *   Sign JWT with `HS256`.
    *   Set `isDummyUser: true` in payload.
    *   Return same structure as real auth (`token`, `accessToken`, `user` object).
4.  If not found: Return 401.

**Environment**:
*   Requires `USE_LOCAL_AUTH=true`.

---

## 🚨 Integration Notes
*   **Token Verification**: The `auth.middleware.js` must be configured to check for `isDummyUser` and verify using the local secret if this flag is present, bypassing JWKS verification.
