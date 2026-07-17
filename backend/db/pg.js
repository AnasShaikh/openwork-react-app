const { Pool } = require('pg');

const LOCAL_DB_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

// Support DATABASE_URL (Neon, Supabase, etc.) or individual host/user/password vars.
// In managed runtimes, localhost is the app container rather than a database.
const isCloudRun = !!process.env.K_SERVICE;
const isAppRunner = !!process.env.AWS_APPRUNNER_SERVICE_ID || process.env.OPENWORK_MANAGED_RUNTIME === 'true';
const isManagedRuntime = isCloudRun || isAppRunner;
const dbHost = process.env.DB_HOST;
const hasDatabaseUrl = !!process.env.DATABASE_URL;
const dbConfigured = hasDatabaseUrl || !isManagedRuntime || (!!dbHost && !LOCAL_DB_HOSTS.has(dbHost));

let pool;

if (!dbConfigured) {
  // Return a stub that rejects immediately — startServer catches this gracefully
  const reject = () => Promise.reject(new Error('No external database configured for managed runtime'));
  pool = { query: reject, connect: reject, end: () => Promise.resolve(), on: () => {} };
} else {
  const poolConfig = hasDatabaseUrl
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
      }
    : isManagedRuntime
    ? {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: dbHost,
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
