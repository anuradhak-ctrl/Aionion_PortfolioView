// services/auth.service.js
// ES MODULE VERSION — FINAL

import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import axios from 'axios';

// Cache for JWKs
let clientJWKs = null;
let internalJWKs = null;
let jwkCacheTime = null;
const JWK_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getJWKs(userPoolId, region) {
  const url = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
  const response = await axios.get(url);
  return response.data.keys;
}

export const verifyToken = async (token) => {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) throw new Error('Invalid token');

    const { header, payload } = decoded;

    const region = process.env.COGNITO_REGION || 'ap-south-1';
    const clientPoolId = process.env.CLIENT_USER_POOL_ID;
    const internalPoolId = process.env.INTERNAL_USER_POOL_ID;

    const clientIssuer = `https://cognito-idp.${region}.amazonaws.com/${clientPoolId}`;
    const internalIssuer = `https://cognito-idp.${region}.amazonaws.com/${internalPoolId}`;

    let jwks;
    let expectedIssuer;
    let expectedAudience;
    let poolType;

    const now = Date.now();
    if (!jwkCacheTime || now - jwkCacheTime > JWK_CACHE_TTL) {
      clientJWKs = null;
      internalJWKs = null;
      jwkCacheTime = now;
    }

    if (payload.iss === clientIssuer) {
      if (!clientJWKs) clientJWKs = await getJWKs(clientPoolId, region);
      jwks = clientJWKs;
      expectedIssuer = clientIssuer;
      expectedAudience = process.env.CLIENT_APP_CLIENT_ID;
      poolType = 'client';
    } else if (payload.iss === internalIssuer) {
      if (!internalJWKs) internalJWKs = await getJWKs(internalPoolId, region);
      jwks = internalJWKs;
      expectedIssuer = internalIssuer;
      expectedAudience = process.env.INTERNAL_APP_CLIENT_ID;
      poolType = 'internal';
    } else {
      throw new Error('Unknown token issuer');
    }

    const key = jwks.find(k => k.kid === header.kid);
    if (!key) throw new Error('JWK not found');

    const pem = jwkToPem(key);

    const verified = jwt.verify(token, pem, {
      issuer: expectedIssuer,
      audience: expectedAudience,
      algorithms: ['RS256']
    });

    return {
      sub: verified.sub,
      email: verified.email,
      name: verified.name || verified.email,
      role:
        poolType === 'client'
          ? 'client'
          : verified['custom:role'] || verified['cognito:groups']?.[0],
      poolType,
      exp: verified.exp,
      iat: verified.iat
    };
  } catch (err) {
    console.error('verifyToken failed:', err.message);
    throw new Error('Invalid or expired token');
  }
};
