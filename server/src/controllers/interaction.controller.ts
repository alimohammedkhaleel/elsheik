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

      // Accept both `summary` and `notes` fields from client for backward compatibility
      const body = req.body;
      const summary = body.summary || body.notes || '';

      const item = await interactionService.createInteraction(
        {
          ...body,
          summary,
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

  /**
   * PUT /api/customers/:id/interactions/:interactionId
   */
  async updateOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = parseInt(req.params.id, 10);
      const interactionId = parseInt(req.params.interactionId, 10);

      if (isNaN(customerId) || isNaN(interactionId)) {
        ResponseUtil.error(res, 'معرف غير صالح', 400, 'INVALID_ID');
        return;
      }

      const body = req.body;
      const summary = body.summary !== undefined ? (body.summary || body.notes || '') : undefined;

      const updated = await interactionService.updateInteraction(
        interactionId,
        customerId,
        {
          ...body,
          ...(summary !== undefined ? { summary } : {}),
        }
      );

      ResponseUtil.success(res, 'تم تعديل السجل بنجاح', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/customers/:id/interactions/:interactionId
   */
  async deleteOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = parseInt(req.params.id, 10);
      const interactionId = parseInt(req.params.interactionId, 10);

      if (isNaN(customerId) || isNaN(interactionId)) {
        ResponseUtil.error(res, 'معرف غير صالح', 400, 'INVALID_ID');
        return;
      }

      await interactionService.deleteInteraction(interactionId, customerId);
      ResponseUtil.success(res, 'تم حذف الملاحظة بنجاح', null);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/customers/:id/interactions   (bulk delete all)
   */
  async deleteAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = parseInt(req.params.id, 10);
      if (isNaN(customerId)) {
        ResponseUtil.error(res, 'معرف العميل غير صالح', 400, 'INVALID_CUSTOMER_ID');
        return;
      }

      const result = await interactionService.deleteAllByCustomer(customerId);
      ResponseUtil.success(res, `تم حذف ${result.count} ملاحظة بنجاح`, result);
    } catch (error) {
      next(error);
    }
  }
}

export const interactionController = new InteractionController();
