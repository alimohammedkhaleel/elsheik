import { Request, Response, NextFunction } from 'express';
import { leaderboardService } from '../services/leaderboard.service';
import { ResponseUtil } from '../utils/apiResponse';
import { LeaderboardPeriod } from '../types/leaderboard.types';

export class LeaderboardController {
  /**
   * GET /api/leaderboard/top-customers
   */
  async getTopCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = req.query.period as LeaderboardPeriod | undefined;
      const startDate = req.query.start_date as string | undefined;
      const endDate = req.query.end_date as string | undefined;
      const sortBy = req.query.sort_by as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const results = await leaderboardService.getTopCustomers({
        period,
        start_date: startDate,
        end_date: endDate,
        sort_by: sortBy,
        limit,
      });

      ResponseUtil.success(res, 'تم استرجاع قائمة كبار العملاء بنجاح', results);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/leaderboard/top-representatives
   */
  async getTopRepresentatives(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = req.query.period as LeaderboardPeriod | undefined;
      const startDate = req.query.start_date as string | undefined;
      const endDate = req.query.end_date as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const results = await leaderboardService.getTopRepresentatives({
        period,
        start_date: startDate,
        end_date: endDate,
        limit,
      });

      ResponseUtil.success(res, 'تم استرجاع لوحة شرف أفضل المناديب بنجاح', results);
    } catch (error) {
      next(error);
    }
  }

}

export const leaderboardController = new LeaderboardController();
