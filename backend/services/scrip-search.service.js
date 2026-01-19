import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCache, setCache } from './redis.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load session credentials ONCE at module level
let sessionCredentials = null;
try {
    const sessionPath = path.join(__dirname, '..', 'session.json');
    sessionCredentials = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
} catch (err) {
    console.error('❌ Failed to load session.json:', err.message);
}

/**
 * Search for scrip token with multi-exchange fallback
 * @param {string} symbol - Symbol name
 * @param {string} preferredExchange - Preferred exchange (usually from COMPANY_CODE)
 * @returns {Promise<string|null>} Token number or null
 */
export async function getScripToken(symbol, preferredExchange = 'NSE') {
    // Clean the symbol
    const cleanSymbol = symbol.replace(/-EQ$/i, '').trim();

    // Check if session is loaded
    if (!sessionCredentials || !sessionCredentials.uid || !sessionCredentials.susertoken) {
        console.error('❌ Invalid session credentials');
        return null;
    }

    const uid = sessionCredentials.uid;
    const jKey = sessionCredentials.susertoken;

    // Intelligent Exchange Selection
    const isNumeric = /^\d+$/.test(cleanSymbol);
    const exchangesToTry = [preferredExchange];

    // Optimization: If symbol is numeric (e.g., 530421), it is definitely BSE. DO NOT search NSE.
    if (isNumeric) {
        if (preferredExchange !== 'BSE') {
            // Force BSE if it was somehow set to NSE but symbol is numeric
            exchangesToTry[0] = 'BSE';
        }
        // Do not add NSE fallback
    } else {
        // Standard fallback logic for text symbols
        if (preferredExchange === 'NSE') exchangesToTry.push('BSE');
        else if (preferredExchange === 'BSE') exchangesToTry.push('NSE');
    }

    for (const exchange of exchangesToTry) {
        const cacheKey = `${exchange}|${cleanSymbol}`;

        // Return cached if available from Redis
        const cachedToken = await getCache(`scrip:${cacheKey}`);
        if (cachedToken) {
            // console.log(`✅ ${cleanSymbol} (${exchange}) → Token ${cachedToken} (cached)`);
            return { token: cachedToken, foundExchange: exchange };
        }

        try {
            // Search WITHOUT exchange filter - get all exchanges, then filter
            const jData = { uid, stext: cleanSymbol };  // No exch parameter
            const payload = `jData=${JSON.stringify(jData)}&jKey=${jKey}`;
            const headers = { 'Content-Type': 'text/plain' };

            const response = await axios.post(
                'https://nebulauat.aionioncapital.com/NorenWClientTP/SearchScrip',
                payload,
                { headers, timeout: 2000 }
            );

            // API returns: { stat: "Ok", values: [...] }
            const results = response.data?.values;

            // console.log(`📋 API returned ${results?.length || 0} results for ${cleanSymbol}`);

            if (Array.isArray(results) && results.length > 0) {
                // Use flexible matching - filter by exchange
                const match = results.find(item =>
                    item.exch === exchange &&
                    (
                        item.symname === cleanSymbol ||
                        item.tsym === cleanSymbol ||
                        item.tsym === `${cleanSymbol}-EQ` ||
                        item.tsym?.startsWith(cleanSymbol + '-') ||
                        item.tsym?.startsWith(cleanSymbol)
                    )
                );

                if (match && match.token) {
                    // Cache in Redis (no TTL - tokens don't change)
                    await setCache(`scrip:${cacheKey}`, match.token);
                    // console.log(`✅ ${cleanSymbol} (${exchange}) → Token ${match.token}`);
                    return { token: match.token, foundExchange: exchange };
                }
            }
        } catch (error) {
            // Continue to next exchange
            // console.error(`❌ Error for ${cleanSymbol} on ${exchange}:`, error.message);
        }
    }

    // console.warn(`⚠️ No token: ${cleanSymbol} (tried ${exchangesToTry.join(', ')})`);
    return null;
}

/**
 * Batch search for multiple scrips
 * @param {Array<string>} scrips - Array of "EXCHANGE|SYMBOL" strings
 * @returns {Promise<Object>} Map of "EXCHANGE|SYMBOL" → "EXCHANGE|TOKEN" or null
 */
export async function getScripTokens(scrips) {
    const tokenMap = {};

    // console.log(`🔍 Looking up tokens for ${scrips.length} scrips...`);

    // Process in parallel with a limit to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < scrips.length; i += batchSize) {
        const batch = scrips.slice(i, i + batchSize);

        await Promise.all(batch.map(async (scrip) => {
            const [preferredExchange, symbol] = scrip.split('|');
            const result = await getScripToken(symbol, preferredExchange);

            if (result && result.token) {
                // Use the exchange where the token was ACTUALLY found
                tokenMap[scrip] = `${result.foundExchange}|${result.token}`;
            } else {
                // Store NULL for failures - don't lie about success
                tokenMap[scrip] = null;
            }
        }));
    }

    // Count ONLY valid tokens
    const foundCount = Object.values(tokenMap).filter(Boolean).length;
    // console.log(`✅ Found ${foundCount}/${scrips.length} valid tokens`);

    return tokenMap;
}

/**
 * Clear token cache (useful for testing)
 */
export function clearTokenCache() {
    Object.keys(tokenCache).forEach(key => delete tokenCache[key]);
    console.log('🔄 Token cache cleared');
}
