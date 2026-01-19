import Redis from 'ioredis';

// Redis connection configuration
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
};

// Create Redis client
const redisClient = new Redis(redisConfig);

// Connection event handlers
redisClient.on('connect', () => {
    console.log('✅ Redis connected');
});

redisClient.on('error', (err) => {
    // Suppress easy-to-understand connection refused errors to avoid spam
    if (err.code === 'ECONNREFUSED') {
        console.error(`⚠️ Redis Connection Failed: Is Redis running on ${redisConfig.host}:${redisConfig.port}?`);
    } else {
        console.error('❌ Redis error:', err.message || err);
    }
});

redisClient.on('close', () => {
    // console.log('🔌 Redis connection closed');
});

redisClient.on('reconnecting', () => {
    // console.log('🔄 Redis reconnecting...');
});

/**
 * Get value from Redis
 * @param {string} key - Cache key
 * @returns {Promise<any>} Parsed JSON value or null
 */
export async function getCache(key) {
    try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error(`Redis GET error for key ${key}:`, error.message);
        return null;
    }
}

/**
 * Set value in Redis with optional TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache (will be JSON stringified)
 * @param {number} ttl - Time to live in seconds (optional)
 */
export async function setCache(key, value, ttl = null) {
    try {
        const stringValue = JSON.stringify(value);
        if (ttl) {
            await redisClient.setex(key, ttl, stringValue);
        } else {
            await redisClient.set(key, stringValue);
        }
    } catch (error) {
        console.error(`Redis SET error for key ${key}:`, error.message);
    }
}

/**
 * Delete value from Redis
 * @param {string} key - Cache key
 */
export async function deleteCache(key) {
    try {
        await redisClient.del(key);
    } catch (error) {
        console.error(`Redis DEL error for key ${key}:`, error.message);
    }
}

/**
 * Check if key exists in Redis
 * @param {string} key - Cache key
 * @returns {Promise<boolean>}
 */
export async function hasCache(key) {
    try {
        const exists = await redisClient.exists(key);
        return exists === 1;
    } catch (error) {
        console.error(`Redis EXISTS error for key ${key}:`, error.message);
        return false;
    }
}

/**
 * Get all keys matching pattern
 * @param {string} pattern - Key pattern (e.g., "portfolio:*")
 * @returns {Promise<string[]>}
 */
export async function getKeys(pattern) {
    try {
        return await redisClient.keys(pattern);
    } catch (error) {
        console.error(`Redis KEYS error for pattern ${pattern}:`, error.message);
        return [];
    }
}

/**
 * Flush all Redis data (use with caution)
 */
export async function flushAll() {
    try {
        await redisClient.flushall();
        console.log('🗑️ Redis cache flushed');
    } catch (error) {
        console.error('Redis FLUSHALL error:', error.message);
    }
}

export default redisClient;
