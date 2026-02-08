import { Pool } from 'pg';
import dotenv from 'dotenv';
import { mockQuery } from './mockDb.js';

dotenv.config();

const useMock = process.env.USE_MOCK_DB === 'true';

let pool;
if (!useMock) {
  const config = process.env.DATABASE_URL
    ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
    : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'freip_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

  pool = new Pool(config);

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
}

export const query = async (text, params) => {
  if (useMock) {
    return mockQuery(text, params);
  }

  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    // Fallback? No, if configured for real DB, fail real.
    throw error;
  }
};

export const getClient = async () => {
  if (useMock) return null; // Mock client not implemented
  return pool.connect();
};

export default pool;

