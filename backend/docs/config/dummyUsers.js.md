# Documentation: `config/dummyUsers.js`

## 📋 Overview

**Purpose**: Stores static user credentials for Local Development. Used by the `local-auth.controller.js` to simulate authentication without needing a connection to AWS Cognito.

**Location**: `backend/config/dummyUsers.js`

**Dependencies**: None.

---

## 🎯 What This File Does

1.  **Data Source**: Exports an array `DUMMY_USERS` containing test accounts for every hierarchy role.
2.  **Helper**: `findDummyUser(email, password)` for simple lookup.

## 🔧 Users Provided

| Email | Password | Role |
|-------|----------|------|
| `client@test.com` | `test123` | Client |
| `rm@test.com` | `test123` | Relationship Manager |
| `bm@test.com` | `test123` | Branch Manager |
| `zh@test.com` | `test123` | Zonal Head |
| `director@test.com` | `test123` | Director |
| `admin@test.com` | `test123` | Super Admin |

## 🚨 Security
**NEVER** deploy this file or its logic to production. It contains hardcoded passwords. The `local-auth.routes.js` ensures this is only accessible if explicitly enabled.
