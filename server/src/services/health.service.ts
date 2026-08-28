import { healthRepository } from '../repositories/health.repository';
import { env, validateDatabaseEnv } from '../config/env';
import { HealthCheckData, DatabaseHealthData } from '../types/api.types';

export class HealthService {
  /**
   * Retrieves overall server runtime health.
   */
  getSystemHealth(): HealthCheckData {
    return {
      status: 'healthy',
      uptime: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
      version: '1.0.0',
    };
  }

  /**
   * Performs database connectivity verification against Neon PostgreSQL.
   */
  async getDatabaseHealth(): Promise<DatabaseHealthData> {
    const { isConfigured } = validateDatabaseEnv();

    if (!isConfigured) {
      return {
        status: 'unconfigured',
        database: 'Neon PostgreSQL (Pending DATABASE_URL in .env)',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const dbResult = await healthRepository.pingDatabase();
      return {
        status: dbResult.connected ? 'connected' : 'disconnected',
        database: 'Neon PostgreSQL',
        responseTimeMs: dbResult.responseTimeMs,
        timestamp: new Date().toISOString(),
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      throw new Error(`Database connectivity check failed: ${errorMessage}`);
    }
  }
}

export const healthService = new HealthService();
