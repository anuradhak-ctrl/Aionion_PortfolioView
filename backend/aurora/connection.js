/**
 * Aurora Database Connection Manager
 * 
 * Handles: Connection pool, credentials, and raw query execution
 * Does NOT contain business logic - only infrastructure
 */

import pg from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const { Pool } = pg;

// ==================== CONFIGURATION ====================

const config = {
    host: process.env.RDS_PROXY_ENDPOINT || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'portfolioview',
    max: 20,
    min: 2,
    idleTimeoutMillis: 120000,
    connectionTimeoutMillis: 30000,
    ssl: { rejectUnauthorized: false }
};

// Secrets Manager client
const secretsClient = new SecretsManagerClient({
    region: process.env.AWS_REGION || 'ap-south-1'
});

// Singleton instances
let pool = null;
let dbCredentials = null;

// ==================== CREDENTIALS ====================

/**
 * Fetch database credentials from AWS Secrets Manager
 */
const getDbCredentials = async () => {
    if (dbCredentials) {
        return dbCredentials;
    }

    const secretArn = process.env.DB_SECRET_ARN;

    if (!secretArn) {
        console.warn('⚠️ DB_SECRET_ARN not set, using environment variables');
        dbCredentials = {
            username: process.env.DB_USER || 'portfolio_admin',
            password: process.env.DB_PASSWORD || ''
        };
        return dbCredentials;
    }

    try {
        const command = new GetSecretValueCommand({ SecretId: secretArn });
        const response = await secretsClient.send(command);

        if (response.SecretString) {
            dbCredentials = JSON.parse(response.SecretString);
            console.log('✅ Database credentials loaded from Secrets Manager');
        }

        return dbCredentials;
    } catch (error) {
        console.error('❌ Failed to fetch DB credentials:', error.message);
        console.warn('⚠️ Falling back to environment variables for DB credentials');
        dbCredentials = {
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        };
        return dbCredentials;
    }
};

// ==================== CONNECTION POOL ====================

/**
 * Get or create the connection pool
 */
export const getPool = async () => {
    if (pool) {
        return pool;
    }

    const credentials = await getDbCredentials();

    pool = new Pool({
        ...config,
        user: credentials.username,
        password: credentials.password
    });

    pool.on('error', (err) => {
        console.error('❌ Unexpected pool error:', err.message);
        pool = null;
    });

    console.log(`✅ PostgreSQL pool created → ${config.host}:${config.port}/${config.database}`);
    return pool;
};

// ==================== QUERY HELPERS ====================

/**
 * Execute a parameterized query
 */
export const query = async (text, params = []) => {
    const dbPool = await getPool();
    const start = Date.now();

    try {
        const result = await dbPool.query(text, params);
        const duration = Date.now() - start;

        if (process.env.NODE_ENV === 'development') {
            console.log(`📊 Query [${duration}ms] - ${result.rowCount} rows`);
        }
        return result;
    } catch (error) {
        console.error('❌ Query error:', error.message);
        console.error('   SQL:', text.substring(0, 200));
        throw error;
    }
};

/**
 * Execute query and return rows only
 */
export const queryRows = async (text, params = []) => {
    const result = await query(text, params);
    return result.rows;
};

/**
 * Execute query expecting a single row
 */
export const queryOne = async (text, params = []) => {
    const result = await query(text, params);
    return result.rows[0] || null;
};

/**
 * Execute a transaction
 */
export const transaction = async (callback) => {
    const dbPool = await getPool();
    const client = await dbPool.connect();

    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// ==================== HEALTH CHECK ====================

/**
 * Test database connection
 */
export const healthCheck = async () => {
    try {
        const result = await queryOne('SELECT NOW() as timestamp, current_database() as database');
        return {
            status: 'healthy',
            database: result.database,
            timestamp: result.timestamp,
            connection: `${config.host}:${config.port}`
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message
        };
    }
};

// ==================== CLEANUP ====================

/**
 * Close the connection pool
 */
export const closePool = async () => {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('✅ PostgreSQL pool closed');
    }
};

export default {
    getPool,
    query,
    queryRows,
    queryOne,
    transaction,
    healthCheck,
    closePool
};
