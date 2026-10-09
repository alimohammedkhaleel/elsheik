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

  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.SERVERLESS);
  const maxConnections = process.env.DB_POOL_MAX
    ? parseInt(process.env.DB_POOL_MAX, 10)
    : isServerless ? 5 : 20;

  const poolConfig: PoolConfig = {
    connectionString: env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Required for Neon PostgreSQL SSL handshakes
    },
    max: maxConnections, // Dynamically adjusted pool size
    idleTimeoutMillis: isServerless ? 10000 : 30000,
    connectionTimeoutMillis: 10000, // 10s connection timeout for Neon cold-starts
    statement_timeout: 20000, // 20s max statement duration (prevents hanging queries)
    query_timeout: 20000, // 20s query promise timeout
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  };

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    console.error('[DB Pool] Unexpected error on idle PostgreSQL client:', err.message);
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
 * Enterprise Transaction Runner:
 * Guarantees BEGIN -> Execution -> COMMIT, with safe ROLLBACK on error,
 * and guaranteed client.release() in a finally block to prevent connection leaks.
 */
export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const activePool = getDatabasePool();
  const client = await activePool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during transaction rollback:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Returns pool utilization statistics for monitoring & health checks.
 */
export const getPoolStats = () => {
  if (!pool) {
    return { isInitialized: false, totalCount: 0, idleCount: 0, waitingCount: 0 };
  }
  return {
    isInitialized: true,
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
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
