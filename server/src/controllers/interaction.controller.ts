import { Request, Response, NextFunction } from 'express';
import { interactionService } from '../services/interaction.service';
import { ResponseUtil } from '../utils/apiResponse';

export class InteractionController {
  /**
   * GET /api/customers/:id/interactions
   */
  async getByCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = parseInt(req.params.id, 10);
      if (isNaN(customerId)) {
        ResponseUtil.error(res, 'معرف العميل غير صالح', 400, 'INVALID_CUSTOMER_ID');
        return;
      }

      const interactions = await interactionService.getByCustomer(customerId);
      ResponseUtil.success(res, 'تم استرجاع سجل المتابعات والزيارات بنجاح', interactions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/customers/:id/interactions
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = parseInt(req.params.id, 10);
      const employeeId = req.user?.userId;
      if (isNaN(customerId) || !employeeId) {
        ResponseUtil.error(res, 'بيانات غير صالحة', 400, 'INVALID_DATA');
        return;
      }

      const item = await interactionService.createInteraction(
        {
          ...req.body,
          customer_id: customerId,
        },
        employeeId,
        req.ip
      );

      ResponseUtil.success(res, 'تم تسجيل المتابعة / الزيارة بنجاح', item, 201);
    } catch (error) {
      next(error);
    }
  }

}

export const interactionController = new InteractionController();
