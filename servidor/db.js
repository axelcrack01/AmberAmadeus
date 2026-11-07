const { Pool } = require('pg');
const pool = new Pool({ max: 5, connectionTimeoutMillis: 5000 });
module.exports = pool;
