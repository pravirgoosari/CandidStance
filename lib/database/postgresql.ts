import { Pool } from 'pg';
// Lazy initialization - only create pool when first accessed
let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('Please add your DATABASE_URL to .env.local');
    }
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test the connection
    _pool.on('connect', () => {
      console.log('Connected to PostgreSQL database');
    });

    _pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return _pool;
}

// Export the getter function
export default getPool;
