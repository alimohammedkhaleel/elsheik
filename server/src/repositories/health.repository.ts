import { query } from '../config/database';

export interface DbCheckResult {
  connected: boolean;
  responseTimeMs: number;
  databaseName: string;
}

export class HealthRepository {
  /**
   * Executes a lightweight safe ping query (SELECT 1) against PostgreSQL.
   */
  async pingDatabase(): Promise<DbCheckResult> {
    const startTime = Date.now();
    const result = await query<{ current_database: string; test_num: number }>(
      'SELECT current_database(), 1 as test_num'
    );
    const responseTimeMs = Date.now() - startTime;

    const row = result.rows[0];
    return {
      connected: !!row && row.test_num === 1,
      responseTimeMs,
      databaseName: row?.current_database || 'PostgreSQL',
    };
  }
}

export const healthRepository = new HealthRepository();
