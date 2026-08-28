import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { ResponseUtil } from '../utils/apiResponse';

export class DashboardController {
  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actor = req.user ? { role: req.user.role, userId: req.user.userId } : undefined;
      const summary = await dashboardService.getSummary(actor);
      ResponseUtil.success(res, 'مؤشرات الأداء الرئيسية للنظام', summary, 200);
    } catch (error) {
      next(error);
    }
  };

  getTopBuyers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actor = req.user ? { role: req.user.role, userId: req.user.userId } : undefined;
      const topBuyers = await dashboardService.getTopBuyers(actor);
      ResponseUtil.success(res, 'قائمة أعلى العملاء شراءً', topBuyers, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();
