import pg from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const { Pool } = pg;

// ==================== CONFIGURATION ====================

const config = {
    // RDS Proxy endpoint (NOT direct Aurora endpoint)
    host: process.env.RDS_PROXY_ENDPOINT || 'portfolioview-proxy.proxy-ctcksa6gau5m.ap-south-1.rds.amazonaws.com',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'portfolioview',

    // Connection pool settings optimized for Lambda + RDS Proxy
    max: 1,                    // Lambda: 1 connection per instance (RDS Proxy handles pooling)
    idleTimeoutMillis: 120000, // 2 minutes - longer than Lambda timeout
    connectionTimeoutMillis: 10000,

    // SSL required for RDS Proxy
    // rejectUnauthorized: false for RDS Proxy (it uses its own cert)
    ssl: {
        rejectUnauthorized: false
    }
};

// Secrets Manager client
const secretsClient = new SecretsManagerClient({
    region: process.env.AWS_REGION || 'ap-south-1'
});

// Connection pool singleton
let pool = null;
let dbCredentials = null;

// ==================== CREDENTIALS FROM SECRETS MANAGER ====================

/**
 * Fetch database credentials from AWS Secrets Manager
 * Cached to avoid repeated API calls
 */
const getDbCredentials = async () => {
    if (dbCredentials) {
        return dbCredentials;
    }

    const secretArn = process.env.DB_SECRET_ARN;

    if (!secretArn) {
        // Fallback to env vars for local development
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
        console.error('❌ Failed to fetch DB credentials from Secrets Manager:', error.message);
        throw error;
    }
};

// ==================== CONNECTION POOL ====================

/**
 * Get or create the connection pool
 * Uses RDS Proxy endpoint - NEVER direct Aurora endpoint
 */
const getPool = async () => {
    if (pool) {
        return pool;
    }

    const credentials = await getDbCredentials();

    pool = new Pool({
        ...config,
        user: credentials.username,
        password: credentials.password
    });

    // Connection error handler
    pool.on('error', (err) => {
        console.error('❌ Unexpected pool error:', err.message);
        pool = null; // Reset pool on error
    });

    console.log(`✅ PostgreSQL pool created → ${config.host}:${config.port}/${config.database}`);
    return pool;
};

// ==================== QUERY EXECUTION ====================

/**
 * Execute a parameterized query
 * @param {string} text - SQL query with $1, $2, etc. placeholders
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result with rows
 */
export const query = async (text, params = []) => {
    const dbPool = await getPool();
    const start = Date.now();

    try {
        const result = await dbPool.query(text, params);
        const duration = Date.now() - start;

        console.log(`📊 Query executed [${duration}ms] - ${result.rowCount} rows`);
        return result;
    } catch (error) {
        console.error('❌ Query error:', error.message);
        console.error('   SQL:', text);
        throw error;
    }
};

/**
 * Execute a query and return just the rows
 */
export const queryRows = async (text, params = []) => {
    const result = await query(text, params);
    return result.rows;
};

/**
 * Execute a query expecting a single row
 */
export const queryOne = async (text, params = []) => {
    const result = await query(text, params);
    return result.rows[0] || null;
};

// ==================== USER MANAGEMENT QUERIES ====================

/**
 * Get users by role with pagination
 * Updated for enhanced schema with status column
 */
export const getUsersByRole = async (role = null, limit = 50, offset = 0) => {
    let sql = `
        SELECT id, client_id, cognito_sub, email, name, role, status, phone, 
               branch_id, zone_id, hierarchy_level, parent_id,
               created_at, updated_at, last_login_at
        FROM users
    `;
    const params = [];
    let paramIndex = 1;

    if (role && role !== 'all') {
        sql += ` WHERE role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    return queryRows(sql, params);
};

/**
 * Get user count grouped by role
 */
export const getUserCountByRole = async () => {
    const sql = `
        SELECT role, COUNT(*)::int as count
        FROM users
        GROUP BY role
    `;
    return queryRows(sql);
};

/**
 * Get total user count
 */
export const getTotalUserCount = async () => {
    const result = await queryOne('SELECT COUNT(*)::int as total FROM users');
    return result?.total || 0;
};

/**
 * Get user by internal ID
 */
export const getUserById = async (userId) => {
    const sql = `
        SELECT id, client_id, cognito_sub, email, name, role, status, phone,
               branch_id, zone_id, hierarchy_level, parent_id, hierarchy_path,
               created_at, updated_at, last_login_at
        FROM users
        WHERE id = $1
    `;
    return queryOne(sql, [userId]);
};

/**
 * Get user by client_id (Cognito username/sub)
 * PRIMARY lookup for Cognito → Aurora mapping
 */
export const getUserByClientId = async (clientId) => {
    const sql = `
        SELECT id, client_id, cognito_sub, email, name, role, status, phone,
               branch_id, zone_id, hierarchy_level, parent_id, hierarchy_path,
               created_at, updated_at, last_login_at
        FROM users
        WHERE client_id = $1
    `;
    return queryOne(sql, [clientId]);
};

/**
 * Create a new user
 * Updated for enhanced schema
 */
export const createUser = async (userData) => {
    const { client_id, cognito_sub, email, name, role, phone, branch_id, zone_id, parent_id } = userData;

    const sql = `
        INSERT INTO users (client_id, cognito_sub, email, name, role, phone, branch_id, zone_id, parent_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
        RETURNING *
    `;

    return queryOne(sql, [
        client_id,
        cognito_sub || null,
        email,
        name,
        role || 'client',
        phone || null,
        branch_id || null,
        zone_id || null,
        parent_id || null
    ]);
};

/**
 * Update user details
 */
export const updateUser = async (userId, updates) => {
    const { email, name, role, is_active, phone, branch_code, zone_code } = updates;

    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    if (email !== undefined) {
        setClauses.push(`email = $${paramIndex++}`);
        params.push(email);
    }
    if (name !== undefined) {
        setClauses.push(`name = $${paramIndex++}`);
        params.push(name);
    }
    if (role !== undefined) {
        setClauses.push(`role = $${paramIndex++}`);
        params.push(role);
    }
    if (is_active !== undefined) {
        setClauses.push(`is_active = $${paramIndex++}`);
        params.push(is_active);
    }
    if (phone !== undefined) {
        setClauses.push(`phone = $${paramIndex++}`);
        params.push(phone);
    }
    if (branch_code !== undefined) {
        setClauses.push(`branch_code = $${paramIndex++}`);
        params.push(branch_code);
    }
    if (zone_code !== undefined) {
        setClauses.push(`zone_code = $${paramIndex++}`);
        params.push(zone_code);
    }

    if (setClauses.length === 0) {
        throw new Error('No fields to update');
    }

    setClauses.push('updated_at = NOW()');
    params.push(userId);

    const sql = `
        UPDATE users 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, client_id, email, name, role, is_active, phone, branch_code, zone_code, updated_at
    `;

    return queryOne(sql, params);
};

/**
 * Update user status only
 */
export const updateUserStatus = async (userId, isActive) => {
    const sql = `
        UPDATE users 
        SET is_active = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, is_active
    `;
    return queryOne(sql, [isActive, userId]);
};

/**
 * Delete user
 */
export const deleteUser = async (userId) => {
    const sql = 'DELETE FROM users WHERE id = $1 RETURNING id';
    return queryOne(sql, [userId]);
};

/**
 * Search users by name or email
 */
export const searchUsers = async (searchTerm, role = null, limit = 50) => {
    let sql = `
        SELECT id, client_id, email, name, role, is_active, created_at
        FROM users
        WHERE (name ILIKE $1 OR email ILIKE $1)
    `;
    const params = [`%${searchTerm}%`];
    let paramIndex = 2;

    if (role && role !== 'all') {
        sql += ` AND role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
    }

    sql += ` ORDER BY name ASC LIMIT $${paramIndex}`;
    params.push(limit);

    return queryRows(sql, params);
};

/**
 * Update last login timestamp
 */
export const updateLastLogin = async (clientId) => {
    const sql = `
        UPDATE users 
        SET last_login_at = NOW()
        WHERE client_id = $1
        RETURNING id, last_login_at
    `;
    return queryOne(sql, [clientId]);
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
 * Close the connection pool (for graceful shutdown)
 */
export const closePool = async () => {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('✅ PostgreSQL pool closed');
    }
};

// Default export
export default {
    query,
    queryRows,
    queryOne,
    getUsersByRole,
    getUserCountByRole,
    getTotalUserCount,
    getUserById,
    getUserByClientId,
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser,
    searchUsers,
    updateLastLogin,
    healthCheck,
    closePool
};
