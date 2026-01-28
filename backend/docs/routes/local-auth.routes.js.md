# Documentation: `routes/local-auth.routes.js`

## 📋 Overview

**Purpose**: Provides simple authentication routes (`/login`, `/logout`) for **Local Development** only. These routes bypass AWS Cognito and issue mock tokens for testing.

**Location**: `backend/routes/local-auth.routes.js`

**Dependencies**:
- `local-auth.controller.js`: Mock auth logic.

---

## 🎯 What This File Does

1.  **Mock Login**: Authenticates against a dummy user list or database directly (bypassing Cognito).
2.  **Conditional Usage**: Typically mounted in `app.js` only when `USE_LOCAL_AUTH=true`.

## 🔧 Routes & Endpoints

| Method | Endpoint | Handler | Access |
|--------|----------|---------|--------|
| `POST` | `/login` | `login` | Public (Dev Only) |
| `POST` | `/logout` | `logout` | Public (Dev Only) |

## 🚨 Security Warning
**NEVER** enable this in production. These routes typically lack rate limiting, MFA, or secure password policies provided by Cognito.
