/**
 * 🔴 Redis Configuration
 * Caching and session management with Railway.app support
 */

const redis = require('redis');

// Redis configuration
const getRedisConfig = () => {
    if (process.env.REDIS_URL) {
        // Railway provides REDIS_URL in production
        return process.env.REDIS_URL;
    }
    
    // Local development configuration
    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
    };
};

// Create Redis client
const client = redis.createClient(getRedisConfig());

// Error handling
client.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});

client.on('connect', () => {
    console.log('✅ Connected to Redis server');
});

client.on('ready', () => {
    console.log('🔴 Redis client ready');
});

// Connect to Redis
const connectRedis = async () => {
    try {
        if (!client.isOpen) {
            await client.connect();
        }
    } catch (error) {
        console.error('❌ Redis connection failed:', error);
    }
};

// Redis helper functions
const redisHelpers = {
    // Set key-value with expiration
    set: async (key, value, expireInSeconds = 3600) => {
        try {
            await client.setEx(key, expireInSeconds, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('❌ Redis SET error:', error);
            return false;
        }
    },
    
    // Get value by key
    get: async (key) => {
        try {
            const value = await client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('❌ Redis GET error:', error);
            return null;
        }
    },
    
    // Delete key
    del: async (key) => {
        try {
            await client.del(key);
            return true;
        } catch (error) {
            console.error('❌ Redis DEL error:', error);
            return false;
        }
    },
    
    // Check if key exists
    exists: async (key) => {
        try {
            const exists = await client.exists(key);
            return exists === 1;
        } catch (error) {
            console.error('❌ Redis EXISTS error:', error);
            return false;
        }
    },
    
    // Increment counter
    incr: async (key) => {
        try {
            return await client.incr(key);
        } catch (error) {
            console.error('❌ Redis INCR error:', error);
            return 0;
        }
    },
    
    // Set with no expiration
    setNoExpire: async (key, value) => {
        try {
            await client.set(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('❌ Redis SET (no expire) error:', error);
            return false;
        }
    }
};

// Cache middleware for Express routes
const cacheMiddleware = (duration = 300) => {
    return async (req, res, next) => {
        // Skip caching in development or for authenticated routes
        if (process.env.NODE_ENV === 'development' || req.user) {
            return next();
        }
        
        const key = `cache:${req.originalUrl}`;
        
        try {
            const cachedData = await redisHelpers.get(key);
            
            if (cachedData) {
                console.log('🔴 Cache HIT:', key);
                return res.json(cachedData);
            }
            
            // Override res.json to cache the response
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                // Cache successful responses only
                if (res.statusCode === 200) {
                    redisHelpers.set(key, body, duration);
                    console.log('🔴 Cache SET:', key);
                }
                return originalJson(body);
            };
            
            next();
        } catch (error) {
            console.error('❌ Cache middleware error:', error);
            next();
        }
    };
};

// Session management helpers
const sessionHelpers = {
    // Create user session
    createSession: async (userId, sessionData) => {
        const sessionId = `session:${userId}:${Date.now()}`;
        await redisHelpers.set(sessionId, {
            userId,
            ...sessionData,
            createdAt: new Date().toISOString()
        }, 86400); // 24 hours
        return sessionId;
    },
    
    // Get session data
    getSession: async (sessionId) => {
        return await redisHelpers.get(sessionId);
    },
    
    // Destroy session
    destroySession: async (sessionId) => {
        return await redisHelpers.del(sessionId);
    },
    
    // Update session activity
    updateSessionActivity: async (sessionId) => {
        const session = await redisHelpers.get(sessionId);
        if (session) {
            session.lastActivity = new Date().toISOString();
            await redisHelpers.set(sessionId, session, 86400);
        }
    }
};

// Graceful shutdown
const closeRedis = async () => {
    try {
        if (client.isOpen) {
            await client.quit();
            console.log('✅ Redis connection closed');
        }
    } catch (error) {
        console.error('❌ Error closing Redis connection:', error);
    }
};

module.exports = {
    client,
    connectRedis,
    closeRedis,
    ...redisHelpers,
    cacheMiddleware,
    sessionHelpers
};
