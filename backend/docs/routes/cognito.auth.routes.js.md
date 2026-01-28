# Documentation: `routes/cognito.auth.routes.js`

## 📋 Overview

**Purpose**: Defines public endpoints for Authentication. These routes map directly to the `cognito.auth.service.js` functions and handle the multi-stage login flow (Password -> MFA -> Tokens).

**Location**: `backend/routes/cognito.auth.routes.js`

**Dependencies**:
- `cognito.auth.service.js`: The service logic for AWS Cognito interactions.

---

## 🎯 What This File Does

Exposes the state machine transitions for the auth flow:
1.  **Initial Login**: `loginWithPassword`
2.  **Challenge Handling**:
    *   **New Password**: `changePassword`
    *   **MFA Setup**: `setupMfa` -> `verifyMfaSetup`
    *   **MFA Login**: `verifyMfaChallenge`
3.  **Session Management**: `refreshToken`

---

## 🔧 Routes & Endpoints

| Method | Endpoint | Handler | Purpose |
|--------|----------|---------|---------|
| `POST` | `/login` | `loginWithPassword` | Start login flow. Returns tokens or challenge. |
| `POST` | `/mfa/setup` | `setupMfa` | Get QR Code (if challenge is `MFA_SETUP`). |
| `POST` | `/mfa/verify-setup` | `verifyMfaSetup` | Confirm connection (if challenge is `MFA_SETUP`). |
| `POST` | `/mfa/verify` | `verifyMfaChallenge` | Submit OTP (if challenge is `SOFTWARE_TOKEN_MFA`). |
| `POST` | `/password/new` | `changePassword` | Submit new password (if challenge is `NEW_PASSWORD_REQUIRED`). |
| `POST` | `/refresh` | `refreshToken` | Get new Access Token using Refresh Token. |
| `POST` | `/logout` | `(lambda)` | Stateless logout (frontend clears storage). |

## 🚨 Integration Notes
*   **Public Access**: None of these routes use `verifyToken` middleware, as their purpose is to *obtain* a token.
*   **Sessions**: Most steps require a `session` string provided by the previous step's response.
