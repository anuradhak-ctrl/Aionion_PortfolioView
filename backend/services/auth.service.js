// services/auth.service.js
// STEP 5.8 — Production-Ready JWT Verification with JWKS

import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const region = process.env.COGNITO_REGION || 'ap-south-1';
const userPoolId = process.env.COGNITO_USER_POOL_ID;

if (!userPoolId) {
  console.warn('⚠️  COGNITO_USER_POOL_ID not set - JWT verification will fail in production');
}

// Initialize JWKS client (caches keys automatically)
const client = jwksClient({
  jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 3600000, // 1 hour
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

/**
 * Get signing key from JWKS
 */
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

/**
 * STEP 5.8 — Verify JWT Token
 * 
 * CRITICAL CHECKS:
 * 1. Signature verification (JWKS)
 * 2. Issuer validation
 * 3. Audience validation
 * 4. Expiry check
 * 5. token_use validation
 */
export const verifyToken = async (token) => {
  return new Promise((resolve, reject) => {
    // Decode header to get key id
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded) {
      reject(new Error('Invalid token format'));
      return;
    }

    const { header, payload } = decoded;

    // Check if this is a local dummy user token (USE_LOCAL_AUTH=true)
    if (payload.isDummyUser && process.env.USE_LOCAL_AUTH === 'true') {
      console.log('🔓 Verifying local dummy user token');
      try {
        const secret = process.env.JWT_SECRET || 'local-dev-secret-key';
        const verified = jwt.verify(token, secret);

        // Return verified user info for dummy users
        resolve({
          sub: verified.sub,
          email: verified.email,
          name: verified.name || verified.email,
          username: verified.email,
          role: verified.role,
          groups: [],
          amr: [],
          poolType: verified.poolType || 'client',
          exp: verified.exp,
          iat: verified.iat
        });
      } catch (verifyError) {
        console.error('Local JWT verification failed:', verifyError.message);
        reject(new Error('Invalid or expired local token'));
      }
      return;
    }

    // Validate issuer
    const expectedIssuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    if (payload.iss !== expectedIssuer) {
      reject(new Error('Invalid token issuer'));
      return;
    }

    // Determine expected audience (client ID)
    const clientAppClientId = process.env.CLIENT_APP_CLIENT_ID;
    const internalAppClientId = process.env.INTERNAL_APP_CLIENT_ID || clientAppClientId;

    const expectedAudiences = [clientAppClientId, internalAppClientId];

    // Get signing key and verify
    getKey(header, (err, key) => {
      if (err) {
        console.error('JWKS error:', err.message);
        reject(new Error('Failed to get signing key'));
        return;
      }

      try {
        const verified = jwt.verify(token, key, {
          issuer: expectedIssuer,
          algorithms: ['RS256']
        });

        // Verify audience manually (since we have multiple possible audiences)
        // Cognito Access Tokens use 'client_id', ID Tokens use 'aud'
        const tokenAudience = verified.aud || verified.client_id;
        if (!expectedAudiences.includes(tokenAudience)) {
          console.error(`Invalid audience. Expected: ${expectedAudiences.join(', ')}, Received: ${tokenAudience}`);
          reject(new Error('Invalid token audience'));
          return;
        }

        // Verify token_use (should be 'id' for ID tokens, 'access' for access tokens)
        if (verified.token_use !== 'id' && verified.token_use !== 'access') {
          reject(new Error('Invalid token_use'));
          return;
        }

        // Determine pool type based on client ID
        const poolType = verified.aud === internalAppClientId ? 'internal' : 'client';

        // Return verified user info
        resolve({
          sub: verified.sub,
          email: verified.email,
          name: verified.name || verified.email,
          username: verified.username || verified['cognito:username'] || verified.sub,
          'cognito:username': verified['cognito:username'],  // Pass through
          role: determineUserRole(verified, poolType),
          groups: verified['cognito:groups'] || [],
          amr: verified.amr || [], // Authentication Methods Reference
          poolType,
          exp: verified.exp,
          iat: verified.iat,
          token_use: verified.token_use
        });
      } catch (verifyError) {
        console.error('JWT verification failed:', verifyError.message);
        if (verifyError.name === 'TokenExpiredError') {
          reject(new Error('Token expired'));
        } else {
          reject(new Error('Invalid or expired token'));
        }
      }
    });
  });
};

/**
 * Determine user role from token payload
 */
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
