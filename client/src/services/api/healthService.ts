import { ApiClient } from './client';
import { ApiResponse, HealthCheckData, DatabaseHealthData } from '../../types/api';

export class HealthService {
  /**
   * Checks API server health
   */
  static async checkApiHealth(): Promise<ApiResponse<HealthCheckData>> {
    return ApiClient.get<HealthCheckData>('/health');
  }

  /**
   * Checks Neon PostgreSQL database connectivity
   */
  static async checkDatabaseHealth(): Promise<ApiResponse<DatabaseHealthData>> {
    return ApiClient.get<DatabaseHealthData>('/health/db');
  }
}
