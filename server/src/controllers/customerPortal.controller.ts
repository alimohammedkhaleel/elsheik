import { Request, Response, NextFunction } from 'express';
import { customerPortalService } from '../services/customerPortal.service';
import { ResponseUtil } from '../utils/apiResponse';

export class CustomerPortalController {
  /**
   * GET /api/customer/portal/overview
   */
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.user?.customerId;
      if (!customerId) {
        ResponseUtil.error(res, 'حساب المستخدم غير مقترن بملف عميل', 403, 'FORBIDDEN');
        return;
      }

      const overview = await customerPortalService.getOverview(customerId);
      ResponseUtil.success(res, 'تم استرجاع ملخص الحساب بنجاح', overview);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/customer/portal/invoices
   */
  async getInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.user?.customerId;
      if (!customerId) {
        ResponseUtil.error(res, 'حساب المستخدم غير مقترن بملف عميل', 403, 'FORBIDDEN');
        return;
      }

      const status = req.query.status as string | undefined;
      const invoices = await customerPortalService.getInvoices(customerId, status);
      ResponseUtil.success(res, 'تم استرجاع قائمة الفواتير بنجاح', invoices);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/customer/portal/statement
   */
  async getStatement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.user?.customerId;
      if (!customerId) {
        ResponseUtil.error(res, 'حساب المستخدم غير مقترن بملف عميل', 403, 'FORBIDDEN');
        return;
      }

      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const statement = await customerPortalService.getStatement(customerId, {
        startDate,
        endDate,
      });
      ResponseUtil.success(res, 'تم استرجاع كشف الحساب بنجاح', statement);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/customer/portal/sales
   */
  async getSalesAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.user?.customerId;
      if (!customerId) {
        ResponseUtil.error(res, 'حساب المستخدم غير مقترن بملف عميل', 403, 'FORBIDDEN');
        return;
      }

      const analytics = await customerPortalService.getSalesAnalytics(customerId);
      ResponseUtil.success(res, 'تم استرجاع إحصائيات المبيعات بنجاح', analytics);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/customer/portal/profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.user?.customerId;
      const userId = req.user?.userId;
      if (!customerId || !userId) {
        ResponseUtil.error(res, 'غير مصرح', 403, 'FORBIDDEN');
        return;
      }

      const profile = await customerPortalService.getProfile(customerId, userId);
      ResponseUtil.success(res, 'تم استرجاع الملف التعريفي بنجاح', profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/customer/portal/profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.user?.customerId;
      const userId = req.user?.userId;
      if (!customerId || !userId) {
        ResponseUtil.error(res, 'غير مصرح', 403, 'FORBIDDEN');
        return;
      }

      const result = await customerPortalService.updateProfile(customerId, userId, req.body, req.ip);
      ResponseUtil.success(res, result.message, null);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/customer/portal/change-password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        ResponseUtil.error(res, 'غير مصرح', 401, 'UNAUTHORIZED');
        return;
      }

      const result = await customerPortalService.changePassword(userId, req.body, req.ip);
      ResponseUtil.success(res, result.message, null);
    } catch (error) {
      next(error);
    }
  }

}

export const customerPortalController = new CustomerPortalController();
