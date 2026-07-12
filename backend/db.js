require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    console.warn('[DB] DATABASE_URL is not set. Database queries will fail.');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('[DB] Unexpected pool error:', err.message);
});

/**
 * Run a parameterized query against the PostgreSQL database.
 * @param {string} text - SQL query string with $1, $2, ... placeholders
 * @param {Array} [params] - Optional query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

module.exports = { query, pool };
