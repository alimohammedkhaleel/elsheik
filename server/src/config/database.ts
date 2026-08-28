import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { env, validateDatabaseEnv } from './env';

let pool: Pool | null = null;

/**
 * Creates and returns the PostgreSQL Connection Pool configured for Neon.
 */
export const getDatabasePool = (): Pool => {
  if (pool) {
    return pool;
  }

  const { isConfigured, message } = validateDatabaseEnv();
  if (!isConfigured || !env.DATABASE_URL) {
    throw new Error(`Database connection failed: ${message}`);
  }

  const poolConfig: PoolConfig = {
    connectionString: env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Required for Neon PostgreSQL SSL handshakes
    },
    max: 20, // Max concurrent connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
  });

  return pool;
};

/**
 * Safe query executor wrapping pool query.
 */
export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  const activePool = getDatabasePool();
  return activePool.query<T>(text, params);
};

/**
 * Get dedicated client from pool for transactions.
 */
export const getClient = async (): Promise<PoolClient> => {
  const activePool = getDatabasePool();
  return activePool.connect();
};

/**
 * Graceful shutdown for pool connections.
 */
export const closeDatabasePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
