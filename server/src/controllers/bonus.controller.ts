import { Request, Response, NextFunction } from 'express';
import { bonusService } from '../services/bonus.service';
import { ResponseUtil } from '../utils/apiResponse';

export class BonusController {
  getBonuses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activeOnly = req.query.active === 'true';
      const bonuses = await bonusService.getBonuses(activeOnly);
      ResponseUtil.success(res, 'خطط الحوافز والمكافآت', bonuses, 200);
    } catch (error) {
      next(error);
    }
  };

  getBonusById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const bonus = await bonusService.getBonusById(id);
      ResponseUtil.success(res, 'تفاصيل خطة المكافأة', bonus, 200);
    } catch (error) {
      next(error);
    }
  };

  createBonus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user?.userId || 1;
      const created = await bonusService.createBonus(req.body, adminId);
      ResponseUtil.success(res, 'تم إنشاء خطة المكافأة بنجاح', created, 201);
    } catch (error) {
      next(error);
    }
  };

  updateBonus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const adminId = req.user?.userId || 1;
      const updated = await bonusService.updateBonus(id, req.body, adminId);
      ResponseUtil.success(res, 'تم تحديث خطة المكافأة بنجاح', updated, 200);
    } catch (error) {
      next(error);
    }
  };

  toggleActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const adminId = req.user?.userId || 1;
      const updated = await bonusService.toggleActive(id, adminId);
      ResponseUtil.success(res, 'تم تغيير حالة تفعيل المكافأة', updated, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const bonusController = new BonusController();
