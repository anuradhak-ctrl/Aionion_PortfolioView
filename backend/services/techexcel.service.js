import axios from 'axios';
import https from 'https';

// Create an axios instance
const techExcelClient = axios.create({
    baseURL: 'https://sync.aionioncapital.com:8643',
    timeout: 10000,
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
});

// Add request interceptor for debugging
techExcelClient.interceptors.request.use(request => {
    console.log('🌐 Outgoing Request:', {
        url: request.url,
        method: request.method,
        headers: request.headers,
        data: request.data
    });
    return request;
});

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

/**
 * Get valid authentication token (login if needed)
 */
const getAuthToken = async () => {
    // If manual token is provided in .env, use it directly
    if (process.env.TECHEXCEL_TOKEN) {
        console.log('✅ Using manual TechExcel token from .env');
        return process.env.TECHEXCEL_TOKEN;
    }

    // Otherwise, try automatic login
    if (!authToken || !tokenExpiry || Date.now() >= tokenExpiry) {
        await login();
    }
    return authToken;
};

/**
 * Fetch client portfolio from TechExcel API
 * @param {string} clientCode - The client code (username)
 */
export const fetchClientPortfolio = async (clientCode) => {
    try {
        console.log(`📡 Fetching portfolio for client: ${clientCode}`);

        // Get valid auth token
        const token = await getAuthToken();

        // POST request with body as per API documentation
        const response = await techExcelClient.post('/TechBoRest/api/entry/client_portfolio', {
            CLIENT_CODE: clientCode,
            BRANCH_CODE: "",
            FAMILY_CODE: "",
            COMPANY_CODE: 1,
            TO_DATE: new Date().toLocaleDateString('en-GB').replace(/\//g, '/'),
            SCRIP_SYMBOL: "",
            TRTYPE: "ASSETS",
            From_Expiry: "",
            To_Expiry: "",
            OPTIONCLPRICE: "Y",
            WITH_ACCOUNT_CHGS: "N"
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`✅ TechExcel API Response Status: ${response.status}`);
        console.log('📦 Portfolio Data Sample:', JSON.stringify(response.data).substring(0, 400));

        // Extract the portfolio data array from response
        if (response.data && response.data["Success Description"]) {
            const rawData = response.data["Success Description"];

            // Map API fields to frontend expected fields
            const mappedData = rawData.map(item => ({
                security: item.SCRIP_SYMBOL || item.ISIN || '',
                isin: item.ISIN || '',
                qty: parseFloat(item.QTY || item.CLQTY || 0),
                avgPrice: parseFloat(item.RATE || item.AVG_RATE || 0).toFixed(2),
                cmp: parseFloat(item.CMP || item.CLOSE_PRICE || 0).toFixed(2),
                value: parseFloat(item.MKT_VALUE || item.MARKET_VALUE || 0).toFixed(2),
                pl: parseFloat(item.PL_AMT || 0).toFixed(2),
                return: item.PL_PER ? `${parseFloat(item.PL_PER).toFixed(2)}%` : '0%',
                sector: item.INDUSTRY || '-'
            }));

            console.log('📊 Mapped Data Sample:', JSON.stringify(mappedData[0], null, 2));
            return mappedData;
        }

        return [];
    } catch (error) {
        console.error('❌ TechExcel API Error:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
        }
        throw new Error('Failed to fetch portfolio data from external system');
    }
};
