# Documentation: `services/auth.service.js`

## 📋 Overview

**Purpose**: JWT token verification using JWKS (JSON Web Key Set) for production-grade authentication. This service verifies tokens issued by AWS Cognito.

**Location**: `backend/services/auth.service.js`

**Dependencies**:
- `jsonwebtoken` - JWT encoding/decoding
- `jwks-rsa` - JWKS client for fetching Cognito public keys

---

## 🎯 What This File Does

This service provides **secure JWT verification** using AWS Cognito's public keys:

1. **Fetches public keys** from Cognito's JWKS endpoint
2. **Verifies JWT signatures** using RS256 algorithm
3. **Validates claims** (issuer, audience, expiry, token_use)
4. **Determines user role** from Cognito groups or custom attributes
5. **Caches keys** for performance (1-hour cache)

---

## 🔧 Configuration

### Environment Variables Required

```bash
COGNITO_REGION=ap-south-1
COGNITO_USER_POOL_ID=ap-south-1_aXl03h8ts
CLIENT_APP_CLIENT_ID=abc123...         # Client web app ID
INTERNAL_APP_CLIENT_ID=def456...       # Internal web app ID (optional)
```

### JWKS Client Initialization

```javascript
const client = jwksClient({
  jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 3600000, // 1 hour
  rateLimit: true,
  jwksRequestsPerMinute: 10
});
```

**Configuration Details**:

| Option | Value | Purpose |
|--------|-------|---------|
| `jwksUri` | Cognito's JWKS endpoint | Where to fetch public keys |
| `cache` | `true` | Cache keys to avoid repeated fetches |
| `cacheMaxAge` | `3600000ms` (1 hour) | How long to cache keys |
| `rateLimit` | `true` | Limit requests to JWKS endpoint |
| `jwksRequestsPerMinute` | `10` | Max 10 fetches per minute |

**Why rate limiting**: Prevents DDoS-ing Cognito's JWKS endpoint during traffic spikes.

**Why caching**: Public keys rarely change (only when rotated), so caching dramatically improves performance.

---

## 🔧 Functions

### 1. `getKey(header, callback)` - Fetch Signing Key

```javascript
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}
```

**What it does**: Fetches the public key used to sign a specific JWT.

**Parameters**:
- `header` (object) - JWT header containing `kid` (Key ID)
- `callback` (function) - Node.js callback pattern

**How it works**:

1. **JWT header contains `kid`** (Key ID):
   ```json
   {
     "alg": "RS256",
     "kid": "abc123...==",
     "typ": "JWT"
   }
   ```

2. **Client fetches key** from JWKS endpoint:
   ```
   GET https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_aXl03h8ts/.well-known/jwks.json
   
   Response:
   {
     "keys": [
       {
         "kid": "abc123...==",
         "kty": "RSA",
         "n": "...",  // Public key modulus
         "e": "AQAB"  // Public key exponent
       }
     ]
   }
   ```

3. **Returns signing key** (public key as PEM format)

**Caching**: If key was fetched recently (< 1 hour), uses cached version.

**Error handling**:
```javascript
// Key not found in JWKS
callback(new Error('Unable to find a signing key'))

// Network error
callback(new Error('Failed to fetch JWKS'))
```

---

### 2. `verifyToken(token)` - **Main Verification Function**

```javascript
export const verifyToken = async (token) => {
  // Returns Promise<UserObject>
}
```

**What it does**: **Complete JWT verification** with all security checks.

**Parameters**:
- `token` (string) - JWT token from `Authorization: Bearer <token>` header

**Returns**: Promise resolving to user object:
```javascript
{
  sub: "a1b2c3d4-...",           // Cognito user ID
  email: "user@example.com",
  name: "User Name",
  username: "user@example.com",
  role: "rm",                    // Determined from groups/attributes
  groups: ["RMs"],               // Cognito groups
  amr: ["pwd", "mfa"],           // Authentication methods
  poolType: "internal",          // 'internal' or 'client'
  exp: 1737398400,               // Expiry timestamp
  iat: 1737394800,               // Issued at timestamp
  token_use: "id"                // 'id' or 'access'
}
```

**The 6-Step Verification Process**:

---

#### Step 1: Decode Token Header (Without Verification)

```javascript
const decoded = jwt.decode(token, { complete: true });

if (!decoded) {
  reject(new Error('Invalid token format'));
  return;
}

const { header, payload } = decoded;
```

**What it does**: Decodes JWT to extract header and payload **without verifying signature**.

**Why decode first**:
- Need `kid` from header to fetch the right public key
- Need `iss` and `aud` from payload to validate claims before verification

**JWT Structure**:
```
eyJhbGciOiJSUzI1NiIsImtpZCI6ImFiYzEyMy4uLiJ9.   ← HEADER (base64)
eyJzdWIiOiJhMWIyYzNkNC4uLiIsImVtYWlsIjoi...   ← PAYLOAD (base64)
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c    ← SIGNATURE (base64)
```

**Decoded result**:
```javascript
{
  header: {
    alg: "RS256",
    kid: "abc123...==",
    typ: "JWT"
  },
  payload: {
    sub: "a1b2c3d4-...",
    email: "user@example.com",
    iss: "https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_aXl03h8ts",
    aud: "client-app-id",
    exp: 1737398400,
    iat: 1737394800
  }
}
```

---

#### Step 2: Validate Issuer (Before Fetching Key)

```javascript
const expectedIssuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
if (payload.iss !== expected Issuer) {
  reject(new Error('Invalid token issuer'));
  return;
}
```

**What it checks**: Token was issued by the expected Cognito user pool.

**Why check before verification**:
- **Security**: Don't fetch keys for tokens from unknown issuers
- **Performance**: Fail fast if issuer is wrong

**Example**:
```javascript
// ✅ Valid issuer
{
  iss: "https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_aXl03h8ts"
}

// ❌ Different user pool
{
  iss: "https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_DIFFERENT"
}
// Rejected immediately

// ❌ Different region
{
  iss: "https://cognito-idp.us-east-1.amazonaws.com/ap-south-1_aXl03h8ts"
}
// Rejected immediately
```

**Prevents**: Token substitution attacks (using tokens from different Cognito pools)

---

#### Step 3: Fetch Signing Key

```javascript
getKey(header, (err, key) => {
  if (err) {
    console.error('JWKS error:', err.message);
    reject(new Error('Failed to get signing key'));
    return;
  }
  // Continue with verification...
});
```

**What it does**: Fetches the public key that matches the `kid` in the JWT header.

**Possible errors**:
```javascript
// Key ID not found in JWKS
Error: Unable to find a signing key that matches 'abc123...=='

// Network error
Error: Failed to fetch JWKS from Cognito

// Rate limit exceeded
Error: JWKS requests per minute exceeded
```

**Caching effect**:
- First request: Fetches from Cognito (~100-200ms)
- Subsequent requests (< 1 hour): Uses cache (~1ms)

---

#### Step 4: Verify Signature and Claims

```javascript
const verified = jwt.verify(token, key, {
  issuer: expectedIssuer,
  algorithms: ['RS256']
});
```

**What `jwt.verify()` checks**:

1. **Signature verification**:
   - Decodes signature using public key
   - Compares with hash of header + payload
   - If mismatch → token was tampered with

2. **Expiry check**:
   - Checks `exp` claim against current time
   - If `exp < now` → token expired

3. **Issuer validation** (again):
   - Verifies `iss` claim matches expected issuer

4. **Algorithm check**:
   - Ensures token uses RS256 (not HS256 or none)

**Possible errors**:
```javascript
// Signature invalid
JsonWebTokenError: invalid signature

// Token expired
TokenExpiredError: jwt expired

// Wrong algorithm
JsonWebTokenError: invalid algorithm

// Issuer mismatch (redundant check)
JsonWebTokenError: jwt issuer invalid
```

---

#### Step 5: Validate Audience

```javascript
const clientAppClientId = process.env.CLIENT_APP_CLIENT_ID;
const internalAppClientId = process.env.INTERNAL_APP_CLIENT_ID || clientAppClientId;

const expectedAudiences = [clientAppClientId, internalAppClientId];

const tokenAudience = verified.aud || verified.client_id;
if (!expectedAudiences.includes(tokenAudience)) {
  console.error(`Invalid audience. Expected: ${expectedAudiences.join(', ')}, Received: ${tokenAudience}`);
  reject(new Error('Invalid token audience'));
  return;
}
```

**What it checks**: Token is intended for this application.

**Why two possible audiences**:
- **Client app** (clients use this)
- **Internal app** (RMs, BMs, admins use this)

**Token types**:
```javascript
// ID Token (has 'aud')
{
  aud: "client-app-id",
  ...
}

// Access Token (has 'client_id')
{
  client_id: "client-app-id",
  ...
}
```

**Why this matters**:
- Prevents tokens for App A being used in App B
- Even if both apps use the same user pool

**Example scenario**:
```
User logs into Mobile App → Gets token with aud="mobile-app-id"
↓
User tries to use that token in Web App (expecting aud="web-app-id")
↓
Validation fails → 401 Unauthorized
```

---

#### Step 6: Validate token_use

```javascript
if (verified.token_use !== 'id' && verified.token_use !== 'access') {
  reject(new Error('Invalid token_use'));
  return;
}
```

**What it checks**: Token is either an ID token or Access token.

**Token types in Cognito**:

| Type | token_use | Purpose | Contains |
|------|-----------|---------|----------|
| ID Token | `id` | User identity | `sub`, `email`, `name`, custom attributes |
| Access Token | `access` | Authorization | `sub`, `client_id`, `scope`, groups |
| Refresh Token | N/A | Get new tokens | Not a JWT |

**This app accepts**: Both `id` and `access` tokens

**Why reject others**: Prevents misuse of refresh tokens or custom token types

---

#### Step 7: Determine Pool Type and Role

```javascript
const poolType = verified.aud === internalAppClientId ? 'internal' : 'client';

resolve({
  sub: verified.sub,
  email: verified.email,
  name: verified.name || verified.email,
  username: verified.username || verified['cognito:username'] || verified.sub,
  role: determineUserRole(verified, poolType),
  groups: verified['cognito:groups'] || [],
  amr: verified.amr || [],
  poolType,
  exp: verified.exp,
  iat: verified.iat,
  token_use: verified.token_use
});
```

**What it does**: Constructs final user object with role and pool type.

**Pool type logic**:
```javascript
// If token audience matches internal app → internal user
verified.aud === "internal-app-id" → poolType = "internal"

// Otherwise → client user
verified.aud === "client-app-id" → poolType = "client"
```

**Fields returned**:
- `sub` - Cognito unique user ID (never changes)
- `email` - User's email
- `name` - Display name (fallback to email)
- `username` - Username (used for portfolio lookups)
- `role` - Determined by `determineUserRole()`
- `groups` - Cognito groups user belongs to
- `amr` - Authentication methods (e.g., `["pwd", "mfa"]`)
- `poolType` - "internal" or "client"
- `exp` / `iat` - Token timestamps

---

### 3. `determineUserRole(payload, poolType)` - Role Extraction

```javascript
function determineUserRole(payload, poolType) {
  const groups = payload['cognito:groups'] || [];
  if (groups.length > 0) {
    const groupRoleMap = {
      'ADMIN': 'super_admin',
      'INTERNAL': 'internal',
      'CLIENT': 'client',
      'Admins': 'super_admin',
      'Directors': 'director',
      'ZonalHeads': 'zonal_head',
      'BranchManagers': 'branch_manager',
      'RMs': 'rm',
      'Clients': 'client'
    };
    
    for (const group of groups) {
      if (groupRoleMap[group]) {
        return groupRoleMap[group];
      }
    }
  }
  
  if (payload['custom:role']) {
    return payload['custom:role'];
  }
  
  return poolType === 'client' ? 'client' : 'user';
}
```

**What it does**: Maps Cognito groups or custom attributes to application roles.

**Priority order**:
1. **Cognito groups** (highest priority)
2. **Custom attribute** (`custom:role`)
3. **Pool type** (fallback)

**Group mapping**:

| Cognito Group | App Role |
|---------------|----------|
| `Admins` | `super_admin` |
| `Directors` | `director` |
| `ZonalHeads` | `zonal_head` |
| `BranchManagers` | `branch_manager` |
| `RMs` | `rm` |
| `Clients` | `client` |

**Examples**:

```javascript
// User in "RMs" group
determineUserRole({ 'cognito:groups': ['RMs'] }, 'internal')
// → 'rm'

// User with custom:role attribute
determineUserRole({ 'custom:role': 'director' }, 'internal')
// → 'director'

// Client user with no groups/attributes
determineUserRole({}, 'client')
// → 'client'

// Internal user with no groups/attributes
determineUserRole({}, 'internal')
// → 'user' (generic internal user)
```

**Why group mapping**: Cognito group names can be user-friendly ("Branch Managers") while app uses snake_case ("branch_manager")

---

## 📊 Complete Verification Flow

```
1. Client sends request
   Authorization: Bearer eyJhbGciOiJSUzI1NiIsIm...
        ↓
2. authGuard middleware calls verifyToken()
        ↓
3. Decode token (no verification)
   Extract: { header, payload }
        ↓
4. Validate issuer
   ✓ Matches expected Cognito user pool?
        ↓
5. Fetch signing key from JWKS
   GET https://cognito-idp.../.well-known/jwks.json
   ✓ Kid: "abc123..." found in JWKS?
        ↓
6. Verify signature with public key
   ✓ Signature matches hash(header + payload)?
   ✓ Token not expired?
   ✓ Algorithm is RS256?
        ↓
7. Validate audience
   ✓ Audience matches client or internal app?
        ↓
8. Validate token_use
   ✓ Is 'id' or 'access' token?
        ↓
9. Determine role from groups/attributes
   Groups: ["RMs"] → role: "rm"
        ↓
10. Return user object
    { sub, email, name, role, ... }
        ↓
11. authGuard sets req.user
        ↓
12. Request proceeds to controller
```

---

## 🚨 Common Issues & Troubleshooting

### Issue 1: "Failed to get signing key"

**Symptom**:
```
JWKS error: Unable to find a signing key that matches 'abc123...'
```

**Causes**:
1. **Cognito rotated keys** (rare, but happens)
2. **Wrong user pool ID** in environment variables
3. **Network issue** fetching JWKS

**Solution**:
```bash
# Clear JWKS cache (restart server)
npm start

# Verify environment variables
echo $COGNITO_USER_POOL_ID
echo $COGNITO_REGION

# Test JWKS endpoint directly
curl https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_aXl03h8ts/.well-known/jwks.json
```

---

### Issue 2: "Invalid token audience"

**Symptom**:
```
Invalid audience. Expected: abc123, Received: def456
```

**Cause**: Token was issued for different app client.

**Debug**:
```javascript
// Decode token without verification
const decoded = jwt.decode(token);
console.log('Token audience:', decoded.aud || decoded.client_id);

// Check environment
console.log('Expected Client ID:', process.env.CLIENT_APP_CLIENT_ID);
console.log('Expected Internal ID:', process.env.INTERNAL_APP_CLIENT_ID);
```

**Fix**: Update environment variables to match Cognito app client IDs.

---

### Issue 3: "Invalid token issuer"

**Symptom**:
```
Invalid token issuer
```

**Cause**: Token from different Cognito user pool or region.

**Debug**:
```javascript
const decoded = jwt.decode(token);
console.log('Token issuer:', decoded.iss);
console.log('Expected:', `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`);
```

**Common mistake**: Using dev pool token in prod environment (or vice versa).

---

### Issue 4: Token expired

**Symptom**:
```
TokenExpiredError: jwt expired
```

**Cause**: Token's `exp` claim is in the past.

**Debug**:
```javascript
const decoded = jwt.decode(token);
const now = Math.floor(Date.now() / 1000);
console.log('Token exp:', decoded.exp);
console.log('Current time:', now);
console.log('Expired?:', decoded.exp < now);
```

**Solution**: Frontend must refresh token using refresh token flow.

---

## 📝 Security Best Practices Implemented

### 1. **RS256 Algorithm Only**
```javascript
algorithms: ['RS256']
```
**Why**: Prevents algorithm confusion attacks (e.g., HS256 with public key)

### 2. **Issuer Validation**
**Prevents**: Tokens from other Cognito pools or identity providers

### 3. **Audience Validation**
**Prevents**: Token reuse across different applications

### 4. **Public Key Verification (JWKS)**
**Benefits**:
- No shared secrets
- Keys can be rotated without code changes
- Automatic key discovery

### 5. **Rate Limiting JWKS Requests**
**Why**: Prevents DDoS on Cognito's JWKS endpoint

### 6. **Key Caching (1 hour)**
**Benefits**:
- Improves performance (1ms vs. 100ms)
- Reduces load on Cognito

---

## 🔗 Related Files

- **middleware/auth.middleware.js** - Calls `verifyToken()` in authGuard
- **services/cognito.auth.service.js** - Creates users that get these tokens
- **routes/cognito.auth.routes.js** - Login endpoint that issues tokens

---

## 🎓 Learning Notes

### What is JWKS?

**JWKS** (JSON Web Key Set) is a set of keys containing public keys used to verify JWTs signed by an authorization server.

**Structure**:
```json
{
  "keys": [
    {
      "kid": "abc123...==",
      "kty": "RSA",
      "alg": "RS256",
      "use": "sig",
      "n": "...",     // Public key modulus (base64)
      "e": "AQAB"     // Public key exponent (base64)
    }
  ]
}
```

**How it works**:
1. Cognito signs JWTs with its **private key**
2. Cognito publishes **public keys** at JWKS endpoint
3. Your app fetches public keys
4. Your app verifies JWT signatures using public keys

**Benefits**:
- No shared secrets between Cognito and your app
- Cognito can rotate keys without notifying you
- Industry standard (OAuth 2.0, OpenID Connect)

### Why RS256 vs. HS256?

**HS256** (HMAC + SHA256):
- Symmetric algorithm (same secret for signing and verifying)
- Secret must be shared between Cognito and your app
- If secret leaks, attackers can forge tokens

**RS256** (RSA + SHA256):
- Asymmetric algorithm (private key for signing, public key for verifying)
- Only Cognito has private key
- Public key can be safely distributed
- Even if public key leaks, attackers can't forge tokens

**This app uses RS256** for maximum security.

---

**Last Updated**: 2026-01-20  
**Maintained By**: Backend Team  
**Security**: Critical - Handle with care
