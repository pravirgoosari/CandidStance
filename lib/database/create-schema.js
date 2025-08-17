import { Pool } from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createSchema() {
  try {
    // Create candidates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        normalized_name VARCHAR(255) UNIQUE NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        search_count INTEGER DEFAULT 1,
        last_searched TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        stances JSONB NOT NULL
      );
    `);

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_candidates_normalized_name ON candidates(normalized_name);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_candidates_last_updated ON candidates(last_updated);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_candidates_search_count ON candidates(search_count);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_candidates_stances_gin ON candidates USING GIN (stances);');

    console.log('✅ Database schema created successfully!');
  } catch (error) {
    console.error('❌ Schema creation failed:', error.message);
  } finally {
    await pool.end();
  }
}

createSchema();
