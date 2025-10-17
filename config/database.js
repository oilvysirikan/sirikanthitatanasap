/**
 * 🗄️ Database Configuration
 * PostgreSQL connection with Railway.app support
 */

const { Pool } = require('pg');

// Parse DATABASE_URL for Railway deployment
const getDatabaseConfig = () => {
    if (process.env.DATABASE_URL) {
        // Railway provides DATABASE_URL in production
        return {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        };
    }
    
    // Local development configuration
    return {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'crm_database',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        ssl: false
    };
};

// Create PostgreSQL connection pool
const pool = new Pool({
    ...getDatabaseConfig(),
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
});

// Test database connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
});

// Database query helper
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        
        if (process.env.NODE_ENV === 'development') {
            console.log('📊 SQL Query executed:', {
                query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                duration: `${duration}ms`,
                rows: result.rowCount
            });
        }
        
        return result;
    } catch (error) {
        console.error('❌ Database query error:', error);
        throw error;
    }
};

// Database transaction helper
const transaction = async (callback) => {
    const client = await pool.connect();
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

// Initialize database (create tables if not exists)
const initializeDatabase = async () => {
    try {
        console.log('🔄 Checking database schema...');
        
        // Check if users table exists
        const checkTable = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        
        if (!checkTable.rows[0].exists) {
            console.log('⚠️ Database tables not found. Please run the schema.sql file.');
            console.log('📝 Run: psql $DATABASE_URL < database/schema.sql');
        } else {
            console.log('✅ Database schema verified');
        }
        
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
};

// Graceful shutdown
const closeDatabase = async () => {
    try {
        await pool.end();
        console.log('✅ Database pool closed');
    } catch (error) {
        console.error('❌ Error closing database pool:', error);
    }
};

module.exports = {
    query,
    transaction,
    pool,
    initializeDatabase,
    closeDatabase
};
