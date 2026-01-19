import axios from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLTP, getPreviousClosing } from './kambala.service.js';
import { getScripTokens } from './scrip-search.service.js';
import { getTechExcelToken } from './secrets-manager.service.js';
import { getCache, setCache } from './redis.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... existing code ...

/**
 * Get valid authentication token from AWS Secrets Manager
 */
const getAuthToken = async () => {
    try {
        // Fetch token from AWS Secrets Manager (with caching)
        const token = await getTechExcelToken();
        return token;
    } catch (error) {
        console.error('❌ Failed to get TechExcel token:', error.message);
        throw error;
    }
};

// Create an axios instance
const techExcelClient = axios.create({
    baseURL: 'https://uat.bo.aionioncapital.com:8643',
    timeout: 10000,
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
});


// Request interceptor disabled for production
// techExcelClient.interceptors.request.use(request => {
//     console.log('🌐 Outgoing Request:', {
//         url: request.url,
//         method: request.method,
//         headers: request.headers,
//         data: request.data
//     });
//     return request;
// });

// Token management
let authToken = null;
let tokenExpiry = null;

/**
 * Login to TechExcel API and get authentication token
 */
const login = async () => {
    try {
        console.log('🔐 Logging in to TechExcel API...');

        if (!process.env.TECHEXCEL_USERNAME || !process.env.TECHEXCEL_PASSWORD) {
            throw new Error('TechExcel credentials not configured in .env file');
        }

        console.log('📝 Using credentials:');
        console.log('  Username:', process.env.TECHEXCEL_USERNAME);
        console.log('  Password length:', process.env.TECHEXCEL_PASSWORD?.length, 'chars');
        console.log('  Password (full):', process.env.TECHEXCEL_PASSWORD);
        console.log('  Password (JSON):', JSON.stringify(process.env.TECHEXCEL_PASSWORD));
        const response = await techExcelClient.post('/TechBoRest/api/login', {
            name: process.env.TECHEXCEL_USERNAME,
            password: process.env.TECHEXCEL_PASSWORD
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.token) {
            authToken = response.data.token;
            // Set expiry to 23 hours from now (1 hour buffer before 24hr expiry)
            tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
            console.log('✅ TechExcel login successful');
            return authToken;
        } else {
            throw new Error('No token received from login');
        }
    } catch (error) {
        console.error('❌ TechExcel login failed:', error.message);
        throw error;
    }
};

// Cache configuration
const CACHE_DURATION = 10 * 60; // 10 Minutes in seconds (for Redis TTL)

/**
 * Processes raw portfolio data by mapping fields, deduplicating, fetching live prices, and formatting.
 * This function is used for both fresh API calls and cached data.
 * @param {Array} rawData - The raw portfolio data from TechExcel API.
 * @returns {Array} - The processed and formatted portfolio holdings.
 */
const processPortfolioData = async (rawData) => {
    // Map API fields to frontend expected fields
    const mappedData = rawData.map(item => {

        // TODO: CRITICAL - Long-term quantity calculation requires LOT-BASED data

        // Calculate quantities
        const poaQty = parseFloat(item.POAQTY || 0);
        const nonPoaQty = parseFloat(item.NONPOAQTY || 0);
        const qty = poaQty + nonPoaQty; // User requested: quantity should be poa + non poa

        // const qty = parseFloat(item.QTY || item.CLQTY || item.Quantity || 0);
        const avgPrice = parseFloat(item.RATE || item.AVG_RATE || item.Rate || 0);

        // TechExcel / Kambala Price Hierachy
        const cmp = 0;

        // OLD FALLBACK REMOVED PER USER REQUEST
        // const cmp = parseFloat(item.CPRate || item.CL_PRICE || item.PREV_CLOSE || item.RATE || item.mkt_rate || item.cl_rate || item.MarketRate || item.ClosedPrice || 0);

        return {
            security: item.SCRIP_SYMBOL || item.ISIN || '',
            isin: item.ISIN || '',
            qty: qty,
            qtyLongTerm: 0, // TODO: Calculate from lot-based transaction history
            avgPrice: parseFloat(item.PURCHASE_PRICE || 0),
            cmp: cmp,
            prevClosing: 0, // Will be updated from Kambala GetQuotes API
            value: qty * cmp,  // Current market value
            pl: (cmp - avgPrice) * qty,  // Profit/Loss
            return: 0,  // Will be calculated: ((cmp - avgPrice) / avgPrice) * 100
            sector: item.Sectore || item.INDUSTRY || '-',
            tradeDate: item.TRADE_DATE || null,  // Trade date from API
            // Extract exchange properly from COMPANY_CODE (e.g., "BSE_CASH" → "BSE")
            exchange: item.COMPANY_CODE?.startsWith('BSE') ? 'BSE' :
                item.COMPANY_CODE?.startsWith('NSE') ? 'NSE' : 'NSE',
            // New fields as requested
            poaQty: poaQty,
            nonPoaQty: nonPoaQty
        };
    });

    // Deduplicate by ISIN, summing quantities and values
    const deduplicated = Object.values(
        mappedData.reduce((acc, item) => {
            const key = item.isin || item.Symbol;

            if (acc[key]) {
                // Merge duplicates
                acc[key].qty += item.qty;
                acc[key].qtyLongTerm += item.qtyLongTerm;
                acc[key].poaQty += item.poaQty;
                acc[key].nonPoaQty += item.nonPoaQty;
                // acc[key].value += item.value; // Value will be recalculated after CMP update
                // acc[key].pl += item.pl; // P&L will be recalculated after CMP update
                // Recalculate weighted average price
                acc[key].avgPrice = (acc[key].avgPrice * (acc[key].qty - item.qty) + item.avgPrice * item.qty) / acc[key].qty;
            } else {
                acc[key] = { ...item };
            }

            return acc;
        }, {})
    );

    // Fetch Live Prices from Kambala WebSocket
    try {
        // Prepare scrips list in format: Exchange|Symbol
        const scripsToFetch = deduplicated.map(item => {
            let exchange = 'NSE'; // Default to NSE
            if (item.exchange && item.exchange.includes('BSE')) {
                exchange = 'BSE';
            }
            return `${exchange}|${item.security}`;
        });

        const uniqueScrips = [...new Set(scripsToFetch)];

        if (uniqueScrips.length > 0) {
            // OPTIMIZATION: Resolve All Tokens ONCE
            const tokenMap = await getScripTokens(uniqueScrips);

            // Fetch both live prices AND previous closing prices using the pre-resolved map
            const kambalaStart = Date.now();
            const [livePrices, prevClosingPrices] = await Promise.all([
                getLTP(uniqueScrips, tokenMap),
                getPreviousClosing(uniqueScrips, tokenMap)
            ]);
            console.log(`Kambala_LivePrices: ${(Date.now() - kambalaStart).toFixed(3)}ms`);

            deduplicated.forEach(item => {
                let exchange = 'NSE';
                if (item.exchange && item.exchange.startsWith('BSE')) {
                    exchange = 'BSE';
                } else if (item.exchange && item.exchange.startsWith('NSE')) {
                    exchange = 'NSE';
                }

                // Lookup key matches how we requested it: "EXCHANGE|SYMBOL"
                const lookupKey = `${exchange}|${item.security}`;

                // Update CMP (current market price)
                if (livePrices[lookupKey]) {
                    const newPrice = livePrices[lookupKey];
                    // console.log(`⚡ Updating CMP for ${item.security}: ${item.cmp} -> ${newPrice}`);
                    item.cmp = newPrice;
                }

                // Update prevClosing from GetQuotes API
                if (prevClosingPrices[lookupKey]) {
                    item.prevClosing = prevClosingPrices[lookupKey];
                }
            });
        }
    } catch (err) {
        console.error('⚠️ Failed to fetch live prices from Kambala:', err.message);
    }

    // Format numbers and calculate return percentage
    const finalData = deduplicated.map(item => {
        const investment = item.qty * item.avgPrice;  // Original investment
        const currentValue = item.qty * item.cmp;  // Current market value

        // Unrealized P&L = (Current Market Price - Average Buy Price) * Net Quantity
        const profitLoss = (item.cmp - item.avgPrice) * item.qty;

        // Unrealized P&L % = ((LTP - Avg Buy Price) / Avg Buy Price) * 100
        // Explicitly ensuring valid float division, handling zero denominator
        const returnPct = item.avgPrice > 0
            ? ((item.cmp - item.avgPrice) / item.avgPrice) * 100
            : 0;

        return {
            ...item,
            avgPrice: item.avgPrice.toFixed(2),
            cmp: item.cmp.toFixed(2),
            prevClosing: item.prevClosing ? item.prevClosing.toFixed(2) : '0.00', // Previous closing from Kambala GetQuotes
            value: currentValue.toFixed(2),  // Current market value
            pl: profitLoss.toFixed(2),  // Profit/Loss
            return: `${returnPct.toFixed(2)}%`
        };
    });

    return finalData;
};

// In-Flight Request Deduplication
// Key: clientCode, Value: Promise
const pendingRequests = {};

/**
 * READ-ONLY: Get cached portfolio
 * Returns null if not found. Does NOT trigger specific refresh.
 */
export const getCachedPortfolio = async (clientCode) => {
    const finalCacheKey = `portfolio:final:${clientCode}`;
    const cached = await getCache(finalCacheKey);
    // PURE READ: No side effects.
    return cached;
};

/**
 * Fetch client portfolio from TechExcel API (Write/Compute Path)
 * @param {object} payload - The request payload containing clientCode
 */
export const fetchClientPortfolio = async (payload) => {
    try {
        const clientCode = payload.CLIENT_CODE;
        const bypassCache = payload.bypassCache === true;

        // 0. Check FINAL Result Cache (Stale-While-Revalidate pattern)
        const finalCacheKey = `portfolio:final:${clientCode}`;
        if (!bypassCache) {
            const cachedFinal = await getCache(finalCacheKey);
            if (cachedFinal) {
                const AGE = Date.now() - (cachedFinal.timestamp || 0);
                const SOFT_TTL = 10000; // 10 seconds freshness

                if (AGE > SOFT_TTL) {
                    // Cache is stale, refresh in background
                    // Fire and forget - do not await
                    fetchClientPortfolio({ CLIENT_CODE: clientCode, bypassCache: true }).catch(() => { });
                }

                // Return Stale Immediately (Fast!)
                return cachedFinal;
            }
        }

        // 1. Check Redis Cache (Unless bypassed)
        if (!bypassCache) {
            const cached = await getCache(`portfolio:${clientCode}`);
            if (cached && cached.data) {
                console.log(`⚡ Serving Portfolio for ${clientCode} from Redis Cache`);

                // OPTIMIZATION: Run Ledger fetch and Portfolio processing in PARALLEL
                const ledgerPromise = fetchLedger({ CLIENT_CODE: clientCode }).catch(err => {
                    // console.warn('Cache path ledger fetch failed', err.message);
                    return [];
                });

                const holdingsPromise = processPortfolioData(cached.data);

                const [ledgerData, holdings] = await Promise.all([ledgerPromise, holdingsPromise]);

                let cash = { previousClosing: 0, availableBalance: 0 };
                try {
                    const openingEntry = ledgerData.find(item =>
                        item.transTypeCode === 'OP' || item.particulars.toLowerCase().includes('opening balance')
                    );
                    if (openingEntry) {
                        cash.previousClosing = parseFloat(openingEntry.balance || 0);
                        // Available balance is the last entry's balance
                        cash.availableBalance = ledgerData.length > 0 ? parseFloat(ledgerData[ledgerData.length - 1].balance || 0) : cash.previousClosing;
                    }
                } catch (e) {
                    // Ignore processing errors
                }

                const result = { cash, holdings, timestamp: Date.now() };
                // Cache the FINAL computed result for 1 Hour (Hard TTL)
                // We use Soft TTL (10s) for freshness check
                await setCache(finalCacheKey, result, 3600);
                return result;
            }
        }

        // 2. Check Pending Request (Request Deduplication)
        // If a request is already in flight, return that promise
        if (pendingRequests[clientCode]) {
            return pendingRequests[clientCode];
        }

        // 3. Create New Request Execution
        const requestPromise = (async () => {
            try {
                // Get valid auth token
                const authStart = Date.now();
                const token = await getAuthToken();
                console.log(`TechExcel_AuthToken: ${(Date.now() - authStart).toFixed(3)}ms`);

                // OPTIMIZATION: Start Ledger fetch in PARALLEL with Portfolio fetch
                const ledgerPromise = fetchLedger({ CLIENT_CODE: clientCode }).catch(err => {
                    // console.warn('Bg Ledger fetch failed', err.message);
                    return [];
                });

                // POST request
                const apiStart = Date.now();
                const response = await techExcelClient.post("TechBoRest/api/entry/holding_new", {
                    CLIENT_ID: clientCode,
                    TO_DATE: new Date().toLocaleDateString('en-GB').replace(/\//g, '/'),
                }, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 120000 // Increased timeout to 120s
                });
                console.log(`TechExcel_ExternalAPI_Total: ${(Date.now() - apiStart).toFixed(0)}ms`);

                if (response.data && response.data["Success Description"]) {
                    const rawData = response.data["Success Description"];

                    // Cache the RAW data result in Redis with TTL
                    await setCache(`portfolio:${clientCode}`, { data: rawData }, CACHE_DURATION);

                    // Fetch ledger for cash balance
                    let cash = { previousClosing: 0, availableBalance: 0 };
                    try {
                        // Await the parallel promise
                        const ledgerData = await ledgerPromise;

                        const openingEntry = ledgerData.find(item =>
                            item.transTypeCode === 'OP' || item.particulars.toLowerCase().includes('opening balance')
                        );
                        if (openingEntry) {
                            cash.previousClosing = parseFloat(openingEntry.balance || 0);
                            cash.availableBalance = ledgerData.length > 0 ? parseFloat(ledgerData[ledgerData.length - 1].balance || 0) : cash.previousClosing;
                        }
                    } catch (ledgerError) {
                        // console.warn('⚠️ Parse ledger error:', ledgerError.message);
                    }

                    // Process holdings
                    const holdings = await processPortfolioData(rawData);

                    const result = { cash, holdings, timestamp: Date.now() };
                    // Cache the FINAL computed result for 1 Hour (Hard TTL)
                    await setCache(finalCacheKey, result, 3600);
                    return result;
                }

                // If no data returned (or API error handled above)
                const emptyResult = {
                    cash: { previousClosing: 0, availableBalance: 0 },
                    holdings: [],
                    timestamp: Date.now()
                };

                // CRITICAL: Cache the empty result so we don't loop on 'syncing' forever
                await setCache(finalCacheKey, emptyResult, 3600);
                return emptyResult;
            } finally {
                delete pendingRequests[clientCode];
            }
        })();

        pendingRequests[clientCode] = requestPromise;
        return requestPromise;

    } catch (error) {
        console.error('getClientPortfolio error:', error);
        throw new Error('Failed to fetch portfolio data from external system');
    }
};

// In-Flight Ledger Request Deduplication
const pendingLedgerRequests = {};

/**
 * Fetch client ledger/account statement from TechExcel API
 * @param {object} payload - The request payload containing clientCode
 */
export const fetchLedger = async ({ CLIENT_CODE, financialYear }) => {
    // 0. Deduplication Check
    // If a request for this client+year is already in flight, wait for it instead of starting a new one
    const dedupKey = `${CLIENT_CODE}:${financialYear || 'current'}`;
    if (pendingLedgerRequests[dedupKey]) {
        // console.log(`⚡ De-duplicating concurrent Ledger request for ${dedupKey}`);
        return pendingLedgerRequests[dedupKey];
    }

    // Create the promise but don't await it yet
    const requestPromise = (async () => {
        try {
            const clientCode = CLIENT_CODE;
            if (!clientCode) throw new Error('Client code is required');

            // ... rest of function ... we need to return deduplication logic logic
            return await executeFetchLedger({ CLIENT_CODE, financialYear });
        } finally {
            delete pendingLedgerRequests[dedupKey];
        }
    })();

    pendingLedgerRequests[dedupKey] = requestPromise;
    return requestPromise;
};

// Internal function with the actual logic
const executeFetchLedger = async ({ CLIENT_CODE, financialYear }) => {
    try {
        const clientCode = CLIENT_CODE;
        if (!clientCode) throw new Error('Client code is required');

        // Get authentication token
        const token = await getAuthToken();

        const perfStart = Date.now();

        // Calculate financial year dates
        let fyStartYear;

        if (financialYear) {
            // Parse FY like "2024-25" -> start year is 2024
            fyStartYear = parseInt(financialYear.split('-')[0]);
        } else {
            // Calculate current financial year (April to March)
            const today = new Date();
            const currentMonth = today.getMonth(); // 0-11
            const currentYear = today.getFullYear();
            // If we're in Jan-Mar, FY started last year. If Apr-Dec, FY started this year
            fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
        }

        // REDIS CACHE CHECK
        const cacheKey = `ledger:${clientCode}:${fyStartYear}`;
        const cachedLedger = await getCache(cacheKey);
        if (cachedLedger) {
            console.log(`⚡ Serving Ledger for ${clientCode} from Redis Cache`);
            return cachedLedger;
        }

        const fromDate = new Date(fyStartYear, 3, 1); // April 1st
        const toDate = new Date(fyStartYear + 1, 2, 31); // March 31st next year

        const formatDate = (date) => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };

        const response = await techExcelClient.post('/TechBoRest/api/entry/ledger', {
            Client_code: clientCode,
            FromDate: formatDate(fromDate),
            ToDate: formatDate(toDate),
        }, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 120000
        });
        console.log(`TechExcel_Ledger_API: ${(Date.now() - perfStart).toFixed(0)}ms`);

        if (response.data && response.data["Success Description"]) {
            const rawData = response.data["Success Description"];

            // Voucher Type decoder - maps TRANS_TYPE codes to accounting classifications
            const decodeVoucherType = (transType) => {
                // Trim whitespace to handle 'R ' vs 'R'
                const cleanType = (transType || '').trim();

                const voucherTypes = {
                    'BP': 'Bank Payment',
                    'BR': 'Bank Receipt',
                    'CP': 'Cash Payment',
                    'CR': 'Cash Receipt',
                    'JV': 'Journal Voucher',
                    'CN': 'Contra',
                    'PI': 'Purchase Invoice',
                    'SI': 'Sales Invoice',
                    'SJ': 'Journal Entry',
                    'BV': 'Book Voucher',
                    'OP': 'Opening Balance',
                    'R': 'Receipt',
                    'P': 'Payment',
                    'J': 'Journal',
                    'BILL': 'Bill',
                    'DN': 'Debit Note',
                    'CDN': 'Credit/Debit Note'
                };
                const decoded = voucherTypes[cleanType] || cleanType || '-';
                return decoded;
            };

            // Cost Center Mapping Rule: Exchange + Segment
            const getCostCenter = (item) => {
                // Source fields: COCD or TRADING_COCD or CounterCode
                const val = (item.COCD || item.TRADING_COCD || item.CounterCode || '').toUpperCase();

                if (val.includes('BSE_CASH')) return 'BSE-EQ';
                if (val.includes('NSE_CASH')) return 'NSE-EQ';

                // Broad match fallbacks if exact string missing but exchange known
                if (val.includes('BSE')) return 'BSE-EQ';
                if (val.includes('NSE')) return 'NSE-EQ';

                return '-';
            };

            // Pre-process: Consolidate multiple Opening Balance rows into one
            const opRows = rawData.filter(r => r.TRANS_TYPE === 'OP' || (r.NARRATION && r.NARRATION.toLowerCase().includes('opening balance')));
            const otherRows = rawData.filter(r => !(r.TRANS_TYPE === 'OP' || (r.NARRATION && r.NARRATION.toLowerCase().includes('opening balance'))));

            let finalRawData = otherRows;
            if (opRows.length > 0) {
                // Sum all opening balances
                const totalOpening = opRows.reduce((sum, r) => sum + parseFloat(r.OPENINGBALANCE || 0), 0);

                // Create single synthetic OP row
                // We use the first row as a template but clear conflicting fields
                const syntheticOp = {
                    ...opRows[0], // Keep basic structure
                    OPENINGBALANCE: totalOpening,
                    NARRATION: 'OPENING BALANCE',
                    TRANS_TYPE: 'OP',
                    COCD: '', // Clear Cost Center as it is consolidated
                    VOUCHERDATE: null, // Ensure it floats to top
                    VoucherDate1: null,
                    DR_AMT: 0,
                    CR_AMT: 0
                };
                finalRawData = [syntheticOp, ...otherRows];
            }

            // Helper function to format date (remove time portion)
            const formatDate = (dateStr) => {
                if (!dateStr) return null;
                try {
                    // If it's already in DD-MM-YYYY format, return as is
                    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;

                    // Parse the date and format as DD-MM-YYYY
                    const date = new Date(dateStr);
                    if (isNaN(date.getTime())) return dateStr; // Return original if invalid

                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`;
                } catch (e) {
                    return dateStr; // Return original on error
                }
            };

            // Map fields to frontend format (without calculated balance yet)
            let mappedData = finalRawData.map(item => ({
                date: formatDate(item.VOUCHERDATE || item.VoucherDate1),
                particulars: item.NARRATION || '-',
                voucherNo: item.VOUCHERNO || item.VoucherNo1 || '-',
                debit: parseFloat(item.DR_AMT || 0),
                credit: parseFloat(item.CR_AMT || 0),
                openingBalance: parseFloat(item.OPENINGBALANCE || 0), // Opening balance from API
                apiBalance: parseFloat(item.CLOSING_AMT || 0), // Store API balance for reference
                transTypeCode: item.TRANS_TYPE, // Raw code (e.g., 'OP', 'BP', etc.)
                transType: decodeVoucherType(item.TRANS_TYPE),
                costCenter: getCostCenter(item), // Calculated field
                // Additional fields for reference
                billNo: item.BILLNO,
                chequeNo: item.CHQNO || item.ChqNo1,
                settlementNo: item.SETTLEMENT_NO,
                defOrderBy: item.DEFORDERBY // For same-day ordering (TODO: use this)
            }));

            // Sort by date (oldest first for proper running balance calculation)
            // TODO: For same-day entries, use DEFORDERBY to replicate TechExcel ordering
            mappedData.sort((a, b) => {
                // Explicitly pin 'OP' (Opening Balance) to the top
                if (a.transTypeCode === 'OP') return -1;
                if (b.transTypeCode === 'OP') return 1;

                // Handle missing dates (treat as old)
                if (!a.date) return -1;
                if (!b.date) return 1;

                const dateCompare = new Date(a.date) - new Date(b.date);
                return dateCompare;
            });

            // Calculate running balance: Closing = Opening + Credit - Debit (CORRECT FORMULA)
            let runningBalance = 0;

            // Find opening balance entry (OP row)
            // Prefer TRANS_TYPE='OP', use narration as fallback
            const openingEntry = mappedData.find(item =>
                item.transTypeCode === 'OP' || item.particulars.toLowerCase().includes('opening balance')
            );

            // Use OPENINGBALANCE field for OP rows (NOT CLOSING_AMT)
            if (openingEntry) {
                runningBalance = openingEntry.transTypeCode === 'OP'
                    ? openingEntry.openingBalance
                    : openingEntry.apiBalance;
            }

            mappedData = mappedData.map((item, index) => {
                // For opening balance (OP), use OPENINGBALANCE field
                if (item.transTypeCode === 'OP') {
                    item.balance = item.openingBalance;
                    runningBalance = item.openingBalance;
                } else {
                    // CORRECT FORMULA: Closing = Opening + Credit - Debit
                    runningBalance = runningBalance + item.credit - item.debit;
                    item.balance = runningBalance;
                }

                // Format numbers to 2 decimal places
                return {
                    ...item,
                    debit: item.debit.toFixed(2),
                    credit: item.credit.toFixed(2),
                    balance: item.balance.toFixed(2),
                    apiBalance: item.apiBalance.toFixed(2) // Keep for debugging
                };
            });

            // Returning data in ascending order (Oldest First) so Opening Balance is at top
            // mappedData is already sorted by date from earlier step

            // CACHE RESULT
            await setCache(cacheKey, mappedData, 60 * 60); // 1 Hour TTL

            //      console.log(`📊 Ledger entries: ${mappedData.length}`);
            return mappedData;
        }

        //     console.log('⚠️ No "Success Description" in response');
        return [];
    } catch (error) {
        console.error('fetchLedger error:', error);
        throw new Error('Failed to fetch ledger data from external system');
    }
};
