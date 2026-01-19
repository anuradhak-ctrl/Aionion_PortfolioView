import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getScripTokens } from './scrip-search.service.js';
import { getCache, setCache } from './redis.service.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const WS_URL = 'wss://nebulauat.aionioncapital.com/NorenWSTP/';
const SESSION_PATH = path.join(__dirname, '../session.json');

// Global Persistent State
let wsClient = null;
const livePrices = {};        // Cache: "EXCHANGE|TOKEN" -> Price
const activeSubscriptions = new Set(); // Cache: "EXCHANGE|TOKEN"
let isConnecting = false;
let connectionPromise = null;

// Helper to load session
function loadSession() {
    try {
        if (!fs.existsSync(SESSION_PATH)) return null;
        const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
        if (!session.uid || !session.susertoken) return null;
        return session;
    } catch (err) {
        console.error('❌ Error reading session.json:', err.message);
        return null;
    }
}

/**
 * ESTABLISH PERSISTENT CONNECTION
 * Single connection for the lifetime of the server.
 */
export function connectKambala() {
    // If already connected, return existing client
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        return Promise.resolve(wsClient);
    }

    // If connection in progress, return existing promise
    if (isConnecting && connectionPromise) {
        return connectionPromise;
    }

    isConnecting = true;
    const session = loadSession();

    if (!session) {
        isConnecting = false;
        return Promise.reject('Invalid Session Credentials');
    }

    console.log('🔌 Connecting to Kambala Persistent WebSocket...');

    connectionPromise = new Promise((resolve, reject) => {
        const ws = new WebSocket(WS_URL);

        ws.on('open', () => {
            console.log('✅ Connected! Authenticating...');
            const authPayload = {
                t: 'c',
                uid: session.uid,
                actid: session.actid,
                susertoken: session.susertoken,
                source: session.source || 'API'
            };
            ws.send(JSON.stringify(authPayload));
        });

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());

                // 1. Auth Success
                if (msg.t === 'ck' && msg.s === 'OK') {
                    console.log('✅ Kambala Auth Success! Ready to stream.');
                    wsClient = ws;
                    isConnecting = false;

                    // Resubscribe to existing subscriptions on reconnect
                    if (activeSubscriptions.size > 0) {
                        const tokens = Array.from(activeSubscriptions);
                        console.log(`🔄 Re-subscribing to ${tokens.length} instruments...`);

                        const payload = {
                            t: 'l',
                            k: tokens.join('#')
                        };
                        ws.send(JSON.stringify(payload));
                    }
                    resolve(ws);
                }

                // 2. Live Feed (lf) OR Subscription ACK (lk)
                // We use 'lk' opportunistically because in this environment it DOES contain 'lp' (Snapshot)
                // 2. Live Feed (lf) OR Subscription ACK (lk)
                if (msg.t === 'lf' || msg.t === 'lk') {
                    if (msg.e && msg.tk && msg.lp) {
                        const key = `${msg.e}|${msg.tk}`;
                        livePrices[key] = parseFloat(msg.lp);
                    }
                }

            } catch (e) {
                console.error('WS Parse Error:', e);
            }
        });

        ws.on('error', (err) => {
            console.error('❌ WebSocket Error:', err.message);
            isConnecting = false;
            // Don't reject global promise here if it's a runtime error, only on initial connect
        });

        ws.on('close', () => {
            // console.log('🔌 WebSocket disconnected. Will reconnect on next request.');
            wsClient = null;
            isConnecting = false;
            connectionPromise = null;
        });
    });

    return connectionPromise;
}

/**
 * Update Subscriptions
 * Sends subscription packet for new tokens only.
 */
function subscribeToTokens(tokenScrips) {
    if (!wsClient || wsClient.readyState !== WebSocket.OPEN) return;

    // Filter out already subscribed
    const newTokens = tokenScrips.filter(t => !activeSubscriptions.has(t));

    if (newTokens.length === 0) return;

    // Add to active set
    newTokens.forEach(t => activeSubscriptions.add(t));

    const payload = {
        t: 'l',
        k: newTokens.join('#')
    };

    // console.log(`📤 Subscribing to ${newTokens.length} new instruments`);
    wsClient.send(JSON.stringify(payload));
}

/**
 * Get LTP (Non-blocking)
 * Returns cached prices immediately.
 * Triggers connection/subscription in background if needed.
 */
export async function getLTP(scrips, predefinedTokenMap = null) {
    // 1. Resolve Symbols to Tokens (Use injected map if available)
    const tokenMap = predefinedTokenMap || await getScripTokens(scrips);
    const validTokenStrings = Object.values(tokenMap).filter(Boolean);

    // 2. Ensure Connection (Background / Async check)
    // We await connection just to ensure we can subscribe, but we don't wait for TICKS.
    try {
        await connectKambala();
    } catch (err) {
        console.error('Failed to connect to Kambala:', err);
        // Fallback to empty cache if connection fails
    }

    // 3. Subscribe if new tokens found
    if (validTokenStrings.length > 0) {
        subscribeToTokens(validTokenStrings);
    }

    // WAITING LOGIC: If we don't have prices for requested scrips, wait briefly for WebSocket snapshot
    // WAITING LOGIC: Smart Poll for Prices
    let missingTokens = [];
    scrips.forEach(scrip => {
        const tokenString = tokenMap[scrip];
        if (tokenString && !livePrices[tokenString]) {
            missingTokens.push(tokenString);
        }
    });

    if (missingTokens.length > 0) {
        // console.log(`⏳ Waiting for ${missingTokens.length} prices...`);
        const startTime = Date.now();
        const TIMEOUT = 2500; // Wait up to 2.5s for initial snapshot

        while (Date.now() - startTime < TIMEOUT) {
            // Check if we still have missing items
            const stillMissing = missingTokens.some(t => !livePrices[t]);
            if (!stillMissing) break; // All found! Exit early.

            // Wait 100ms before checking again
            await new Promise(r => setTimeout(r, 100));
        }
    }

    // 4. Return Cache (Now potentially populated)
    const result = {};
    let foundCount = 0;

    scrips.forEach(scrip => { // scrip = "NSE|RELIANCE"
        const tokenString = tokenMap[scrip]; // "NSE|2885" or "BSE|2312"

        // Return price if it exists in cache
        if (tokenString && livePrices[tokenString]) {
            result[scrip] = livePrices[tokenString];
            foundCount++;
        }
    });

    // console.log(`📊 Returning ${foundCount} cached live prices`);
    return result;
}
// PERSISTENT PREVIOUS CLOSE CACHE LOGIC (Redis)
// Cache expires daily at midnight (handled by TTL)
const PREV_CLOSE_TTL = 24 * 60 * 60; // 24 hours

/**
 * Get Previous Closing Prices from Kambala GetQuotes API
 * Returns object with exchange|token as key and previous closing (c field) as value
 * IMPLEMENTS: Caching + Background Fetching + Disk Persistence + Stale Refresh
 */
export async function getPreviousClosing(scrips, predefinedTokenMap = null) {
    const axios = (await import('axios')).default;
    const API_BASE_URL = 'https://nebulauat.aionioncapital.com/NorenWClientTP';

    // Load session for authentication
    const session = loadSession();
    if (!session) {
        console.warn('⚠️ No session found for GetQuotes');
        return {};
    }

    // Resolve symbols to tokens (Use injected map if available)
    const tokenMap = predefinedTokenMap || await getScripTokens(scrips);
    const result = {};

    const itemsToFetch = [];
    const seenTokens = new Set(); // Prevent duplicates in fetch queue

    // 1. Check Redis Cache IN PARALLEL (not sequential)
    const cacheCheckPromises = Object.entries(tokenMap).map(async ([scrip, tokenString]) => {
        if (!tokenString) return null;
        const cachedPrice = await getCache(`prevclose:${tokenString}`);
        return { scrip, tokenString, cachedPrice };
    });

    const cacheResults = await Promise.all(cacheCheckPromises);

    // 2. Process cache results and build fetch queue
    for (const item of cacheResults) {
        if (!item) continue;
        const { scrip, tokenString, cachedPrice } = item;

        if (cachedPrice !== null) {
            result[scrip] = cachedPrice;
        } else {
            // Not in cache, fetch it
            if (!seenTokens.has(tokenString)) {
                itemsToFetch.push({ scrip, tokenString });
                seenTokens.add(tokenString);
            }
        }
    }

    // 2. Trigger Background Fetch (Non-blocking)
    if (itemsToFetch.length > 0) {
        // console.log(`📊 GetQuotes: Cached ${Object.keys(result).length}, Fetching/Refreshing ${itemsToFetch.length} in background ${refreshStale ? '(Stale Refresh)' : ''}`);

        // Fire and forget - do NOT await
        (async () => {
            for (const item of itemsToFetch) {
                const { scrip, tokenString } = item;

                // Rate limit: 600ms delay to stay under 120 req/minute
                await new Promise(r => setTimeout(r, 600));

                try {
                    const [exchange, token] = tokenString.split('|');
                    const symbol = scrip.split('|')[1];

                    const requestBody = {
                        uid: session.uid,
                        actid: session.actid,
                        exch: exchange,
                        token: token
                    };
                    const payload = `jData=${JSON.stringify(requestBody)}&jKey=${session.susertoken}`;

                    const response = await axios.post(`${API_BASE_URL}/GetQuotes`, payload);

                    if (response.data && response.data.stat === 'Ok' && response.data.c) {
                        const val = parseFloat(response.data.c);
                        // Save to Redis with daily TTL
                        await setCache(`prevclose:${tokenString}`, val, PREV_CLOSE_TTL);
                        // console.log(`📈 Updated ${symbol} prev close: ${val}`);
                    }
                } catch (bgErr) {
                    // console.warn(`Bg Fetch Error ${scrip}: ${bgErr.message}`);
                }
            }
            // console.log(`✅ Background fetch of ${itemsToFetch.length} items completed.`);
        })();
    }

    // Return what we have immediately (from memory cache)
    return result;
}
