import { Request, Response, NextFunction } from 'express';
import { healthService } from '../services/health.service';
import { ResponseUtil } from '../utils/apiResponse';

export class HealthController {
  /**
   * GET /api/health
   * Standard system health check endpoint
   */
  getHealth = (_req: Request, res: Response): void => {
    const healthData = healthService.getSystemHealth();
    ResponseUtil.success(res, 'API is running', healthData, 200);
  };

  /**
   * GET /api/health/db
   * Verifies connectivity to Neon PostgreSQL via a SELECT 1 query
   */
  getDatabaseHealth = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dbHealth = await healthService.getDatabaseHealth();
      if (dbHealth.status === 'unconfigured') {
        ResponseUtil.success(
          res,
          'Database is not configured yet. Provide DATABASE_URL in .env to connect.',
          dbHealth,
          200
        );
        return;
      }
      ResponseUtil.success(res, 'Database connection verified successfully', dbHealth, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const healthController = new HealthController();
