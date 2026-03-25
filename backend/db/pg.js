const { Pool } = require('pg');

// Detect Cloud Run environment
const isCloudRun = !!process.env.K_SERVICE;

// Support DATABASE_URL (Neon, Supabase, etc.) OR individual host/user/pass vars
const hasDatabaseUrl = !!process.env.DATABASE_URL;
const dbConfigured = hasDatabaseUrl || !isCloudRun || !!process.env.DB_HOST;

let pool;

if (!dbConfigured) {
  // Return a stub that rejects immediately — startServer catches this gracefully
  const reject = () => Promise.reject(new Error('No DB configured (set DATABASE_URL or DB_HOST in Cloud Run)'));
  pool = { query: reject, connect: reject, on: () => {} };
} else {
  const poolConfig = hasDatabaseUrl
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
      }
    : isCloudRun
    ? {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
      }
    : {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'openwork',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
      };

  pool = new Pool({
    ...poolConfig,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
  });
}

module.exports = pool;
