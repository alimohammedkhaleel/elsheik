import { Request, Response, NextFunction } from 'express';
import { repBonusService } from '../services/repBonus.service';
import { ResponseUtil } from '../utils/apiResponse';
import { RepTransactionType } from '../types/repBonus.types';

export class RepBonusController {
  /**
   * GET /api/rep-bonuses
   */
  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const repId = req.query.representative_id ? parseInt(req.query.representative_id as string, 10) : undefined;
      const type = req.query.type as RepTransactionType | undefined;
      const startDate = req.query.start_date as string | undefined;
      const endDate = req.query.end_date as string | undefined;

      const transactions = await repBonusService.getTransactions({
        representative_id: isNaN(repId as number) ? undefined : repId,
        type,
        start_date: startDate,
        end_date: endDate,
      });

      ResponseUtil.success(res, 'تم استرجاع سجل مكافآت وخصومات المناديب بنجاح', transactions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rep-bonuses/summary
   */
  async getSummaries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summaries = await repBonusService.getSummaries();
      ResponseUtil.success(res, 'تم استرجاع ملخصات حوافز ومكافآت المناديب بنجاح', summaries);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rep-bonuses
   */
  async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        ResponseUtil.error(res, 'يجب تسجيل الدخول', 401, 'UNAUTHORIZED');
        return;
      }

      const tx = await repBonusService.createTransaction(req.body, userId, req.ip);
      ResponseUtil.success(res, 'تم تسجيل المعاملة المالية للمندوب بنجاح', tx, 201);
    } catch (error) {
      next(error);
    }
  }

}

export const repBonusController = new RepBonusController();
