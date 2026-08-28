export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code?: string;
    details?: unknown;
  };
  timestamp?: string;
}

export interface HealthCheckData {
  status: 'healthy' | 'unhealthy';
  uptime: number;
  environment: string;
  version: string;
}

export interface DatabaseHealthData {
  status: 'connected' | 'disconnected' | 'unconfigured';
  database: string;
  responseTimeMs?: number;
  timestamp: string;
}
