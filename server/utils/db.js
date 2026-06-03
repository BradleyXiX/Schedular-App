import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test the connection
pool.query('SELECT NOW()')
    .then(res => console.log('✅ PostgreSQL connected at:', res.rows[0].now))
    .catch(err => console.error('❌ Connection error:', err.stack));

export default pool;