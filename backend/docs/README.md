# Backend Documentation Index

## 📚 Complete Documentation Guide

This directory contains comprehensive documentation for every file in the backend codebase. Each document explains:
- **What the file does** (purpose and overview)
- **How each function works** (implementation details)
- **Why it's designed that way** (design decisions and rationale)
- **Common issues and troubleshooting** (practical debugging tips)

---

## 📂 Documentation Structure

### 🚀 Entry Points & Core Configuration

| File | Documentation | Description |
|------|---------------|-------------|
| `server.js` | [server.js.md](./server.js.md) | HTTP server startup, graceful shutdown, signal handlers |
| `app.js` | [app.js.md](./app.js.md) | Express app configuration, middleware, routes, error handling |
| `dummyUsers.js` | [config/dummyUsers.js.md](./config/dummyUsers.js.md) | Dummy user credentials for development testing |

### 🌐 Routes (API Endpoints)

| File | Documentation | Description |
|------|---------------|-------------|
| `routes/user.routes.js` | [routes/user.routes.js.md](./routes/user.routes.js.md) | User management endpoints (list, create, update, delete) |
| `routes/admin.routes.js` | [routes/admin.routes.js.md](./routes/admin.routes.js.md) | Admin endpoints (user management, hierarchy) |
| `routes/cognito.auth.routes.js` | [routes/cognito.auth.routes.js.md](./routes/cognito.auth.routes.js.md) | AWS Cognito authentication endpoints |
| `routes/local-auth.routes.js` | [routes/local-auth.routes.js.md](./routes/local-auth.routes.js.md) | Local dummy auth for development |

### 🎮 Controllers (Request Handlers)

| File | Documentation | Description |
|------|---------------|-------------|
| `controllers/user.controller.js` | [controllers/user.controller.js.md](./controllers/user.controller.js.md) | User API logic (getUsers, getClients, getPortfolio, etc.) |
| `controllers/admin.controller.js` | [controllers/admin.controller.js.md](./controllers/admin.controller.js.md) | Admin API logic (createUser, deleteUser, hierarchy management) |
| `controllers/local-auth.controller.js` | [controllers/local-auth.controller.js.md](./controllers/local-auth.controller.js.md) | Local dev auth logic |

### 🔐 Middleware

| File | Documentation | Description |
|------|---------------|-------------|
| `middleware/auth.middleware.js` | [middleware/auth.middleware.js.md](./middleware/auth.middleware.js.md) | JWT verification, role-based access control |

### 💼 Services (Business Logic)

| File | Documentation | Description |
|------|---------------|-------------|
| `services/cognito.auth.service.js` | [services/cognito.auth.service.js.md](./services/cognito.auth.service.js.md) | AWS Cognito admin operations (create user, delete user, MFA setup) |
| `services/auth.service.js` | [services/auth.service.js.md](./services/auth.service.js.md) | JWT generation and verification |
| `services/user-sync.service.js` | [services/user-sync.service.js.md](./services/user-sync.service.js.md) | Sync users between Cognito and Aurora database |
| `services/hierarchy-validation.service.js` | [services/hierarchy-validation.service.js.md](./services/hierarchy-validation.service.js.md) | Validates ZM→BM→RM→Client hierarchy, prevents circular references |
| `services/techexcel.service.js` | [services/techexcel.service.js.md](./services/techexcel.service.js.md) | TechExcel API integration (portfolio, holdings, ledger) |
| `services/kambala.service.js` | [services/kambala.service.js.md](./services/kambala.service.js.md) | WebSocket client for live market prices |
| `services/redis.service.js` | [services/redis.service.js.md](./services/redis.service.js.md) | Redis cache client for portfolio data |
| `services/scrip-search.service.js` | [services/scrip-search.service.js.md](./services/scrip-search.service.js.md) | NIFTY scrip search and lookup |
| `services/secrets-manager.service.js` | [services/secrets-manager.service.js.md](./services/secrets-manager.service.js.md) | AWS Secrets Manager integration for credentials |
| `services/aurora.service.js` | [services/aurora.service.js.md](./services/aurora.service.js.md) | Thin wrapper around Aurora repositories |

### 🗄️ Database Layer (Aurora PostgreSQL)

| File | Documentation | Description |
|------|---------------|-------------|
| `aurora/connection.js` | [aurora/connection.js.md](./aurora/connection.js.md) | PostgreSQL connection pool setup and query helpers |
| `aurora/user.repository.js` | [aurora/user.repository.js.md](./aurora/user.repository.js.md) | User CRUD operations with hierarchy validation |
| `aurora/hierarchy.repository.js` | [aurora/hierarchy.repository.js.md](./aurora/hierarchy.repository.js.md) | Recursive hierarchy queries with cycle detection |
| `aurora/audit.repository.js` | [aurora/audit.repository.js.md](./aurora/audit.repository.js.md) | Audit logging for user actions |
| `aurora/index.js` | [aurora/index.js.md](./aurora/index.js.md) | Re-exports all repositories for clean imports |

### ⚙️ Configuration

| File | Documentation | Description |
|------|---------------|-------------|
| `config/db.js` | [config/db.js.md](./config/db.js.md) | Database connection configuration |

---

## 🎯 Quick Navigation by Feature

### Authentication & Authorization

1. [cognito.auth.routes.js.md](./routes/cognito.auth.routes.js.md) - Login, MFA, password reset endpoints
2. [auth.middleware.js.md](./middleware/auth.middleware.js.md) - JWT verification
3. [cognito.auth.service.js.md](./services/cognito.auth.service.js.md) - Cognito admin operations
4. [auth.service.js.md](./services/auth.service.js.md) - JWT generation

### User Management

1. [user.controller.js.md](./controllers/user.controller.js.md) - API request handlers
2. [user.repository.js.md](./aurora/user.repository.js.md) - Database operations
3. [user-sync.service.js.md](./services/user-sync.service.js.md) - Cognito ↔ Aurora sync

### Hierarchy & Access Control

1. [hierarchy-validation.service.js.md](./services/hierarchy-validation.service.js.md) - **NEW** Validation logic
2. [hierarchy.repository.js.md](./aurora/hierarchy.repository.js.md) - Recursive queries with cycle detection

### Portfolio & Market Data

1. [user.controller.js.md](./controllers/user.controller.js.md) - Portfolio endpoints
2. [techexcel.service.js.md](./services/techexcel.service.js.md) - External API integration
3. [kambala.service.js.md](./services/kambala.service.js.md) - Live price WebSocket
4. [redis.service.js.md](./services/redis.service.js.md) - Portfolio caching

---

## 📖 How to Use This Documentation

### For New Developers

1. **Start with the entry points**:
   - [server.js.md](./server.js.md) - Understand how the server starts
   - [app.js.md](./app.js.md) - Understand middleware and routing

2. **Follow the request flow**:
   - Routes → Controllers → Services → Repositories
   - Example: Login flow
     1. [cognito.auth.routes.js.md](./routes/cognito.auth.routes.js.md) - `/api/auth/login` endpoint
     2. (controller inline in routes) - Validates credentials
     3. [cognito.auth.service.js.md](./services/cognito.auth.service.js.md) - Calls AWS Cognito
     4. [auth.service.js.md](./services/auth.service.js.md) - Generates JWT

3. **Understand the data layer**:
   - [aurora/connection.js.md](./aurora/connection.js.md) - How database connections work
   - [aurora/user.repository.js.md](./aurora/user.repository.js.md) - User CRUD operations

### For Debugging

1. **Find the failing endpoint** in the routes documentation
2. **Read the controller documentation** to understand the logic
3. **Check the service documentation** for external dependencies (Cognito, TechExcel, etc.)
4. **Review the repository documentation** for database queries

### For Adding Features

1. **Check if similar features exist** (use the feature-based navigation above)
2. **Follow the same pattern**:
   - Add route in `routes/*.js`
   - Add controller in `controllers/*.js`
   - Add service logic in `services/*.js`
   - Add database queries in `aurora/*.js`
3. **Update this index** with your new documentation

---

## 🔧 Documentation Standards

Each documentation file follows this structure:

1. **📋 Overview** - Purpose, location, dependencies
2. **🎯 What This File Does** - High-level functionality
3. **🔧 Key Components** - Function-by-function breakdown
4. **📊 Flow Diagrams** - Visual representation of logic
5. **🚨 Common Issues** - Troubleshooting guide
6. **📝 Best Practices** - Design decisions explained
7. **🔗 Related Files** - Cross-references
8. **🎓 Learning Notes** - Conceptual explanations

---

## 🚀 Recent Updates

### 2026-01-20: Hierarchy Validation

**Added**:
- [hierarchy-validation.service.js.md](./services/hierarchy-validation.service.js.md) - **NEW** comprehensive validation service
- Updated [user.repository.js.md](./aurora/user.repository.js.md) - Added validation to create/update
- Updated [hierarchy.repository.js.md](./aurora/hierarchy.repository.js.md) - Added cycle detection to all recursive queries

**Why**: Fixed the circular hierarchy bug that caused "No space left on device" errors. Now impossible to create circular references.

---

## 📞 Need Help?

- **General questions**: Read the overview section of each file
- **Specific function**: Search for the function name in the relevant file
- **Performance issues**: Check the "Common Issues" sections
- **Design rationale**: Read the "Why it's designed that way" explanations

---

**Last Updated**: 2026-01-20  
**Maintained By**: Backend Team
