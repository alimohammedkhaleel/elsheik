import { useState, useEffect, useCallback } from 'react';
import { HealthService } from '../services/api/healthService';
import { HealthCheckData, DatabaseHealthData } from '../types/api';

export interface SystemStatusState {
  apiStatus: 'loading' | 'healthy' | 'unhealthy';
  apiData: HealthCheckData | null;
  dbStatus: 'loading' | 'connected' | 'disconnected' | 'unconfigured';
  dbData: DatabaseHealthData | null;
  lastChecked: Date | null;
  error: string | null;
}

export const useHealthCheck = () => {
  const [status, setStatus] = useState<SystemStatusState>({
    apiStatus: 'loading',
    apiData: null,
    dbStatus: 'loading',
    dbData: null,
    lastChecked: null,
    error: null,
  });

  const checkHealth = useCallback(async () => {
    setStatus((prev) => ({ ...prev, apiStatus: 'loading', dbStatus: 'loading', error: null }));

    try {
      const [apiRes, dbRes] = await Promise.all([
        HealthService.checkApiHealth(),
        HealthService.checkDatabaseHealth(),
      ]);

      setStatus({
        apiStatus: apiRes.success ? 'healthy' : 'unhealthy',
        apiData: apiRes.data || null,
        dbStatus: dbRes.success
          ? dbRes.data?.status || 'connected'
          : 'disconnected',
        dbData: dbRes.data || null,
        lastChecked: new Date(),
        error: !apiRes.success ? apiRes.message : !dbRes.success ? dbRes.message : null,
      });
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        apiStatus: 'unhealthy',
        dbStatus: 'disconnected',
        lastChecked: new Date(),
        error: err instanceof Error ? err.message : 'Failed to reach API server',
      }));
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { ...status, refetch: checkHealth };
};
