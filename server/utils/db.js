// ./server/db.js
const Pool = require('pg').Pool;
require('dotenv').config(); // Ensure dotenv is loaded to access .env file

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});

// Test the connection
pool.query('SELECT NOW()')
    .then(res => console.log('✅ PostgreSQL connected at:', res.rows[0].now))
    .catch(err => console.error('❌ Connection error:', err.stack));

module.exports = pool;