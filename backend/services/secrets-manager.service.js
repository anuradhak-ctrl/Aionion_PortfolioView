import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

// Initialize Secrets Manager client
const secretsClient = new SecretsManagerClient({
    region: process.env.AWS_REGION || "ap-south-1"
});

// In-memory cache
let cachedToken = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Fetches TechExcel API token from AWS Secrets Manager
 * Uses in-memory caching to reduce API calls
 * @returns {Promise<string>} API token
 */
export async function getTechExcelToken() {
    // Priority 1: Use .env token if available (for local development)
    if (process.env.TECHEXCEL_TOKEN) {
        console.log('✅ Using TechExcel token from .env');
        return process.env.TECHEXCEL_TOKEN;
    }

    // Priority 2: Return cached token if still valid
    if (cachedToken && Date.now() - lastFetchTime < CACHE_DURATION) {
        console.log('✅ Using cached TechExcel token from Secrets Manager');
        return cachedToken;
    }

    // Priority 3: Fetch from AWS Secrets Manager
    try {
        console.log('🔐 Fetching TechExcel token from AWS Secrets Manager...');

        const command = new GetSecretValueCommand({
            SecretId: process.env.TECHEXCEL_SECRET_NAME || "techexcel/api-token"
        });

        const response = await secretsClient.send(command);
        const secret = JSON.parse(response.SecretString);

        cachedToken = secret.token;
        lastFetchTime = Date.now();

        console.log('✅ TechExcel token fetched successfully from Secrets Manager');
        return cachedToken;

    } catch (error) {
        console.error('❌ Failed to fetch token from Secrets Manager:', error.message);
        throw new Error('No TechExcel token available - set TECHEXCEL_TOKEN in .env or configure AWS Secrets Manager');
    }
}

/**
 * Clears cached token (useful for force refresh)
 */
export function clearTokenCache() {
    cachedToken = null;
    lastFetchTime = 0;
    console.log('🔄 Token cache cleared');
}
