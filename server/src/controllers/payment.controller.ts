import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { ResponseUtil } from '../utils/apiResponse';
import { PaymentMethod } from '../types/payment.types';

export class PaymentController {
  getPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customer_id = req.query.customer_id ? parseInt(req.query.customer_id as string, 10) : undefined;
      const invoice_id = req.query.invoice_id ? parseInt(req.query.invoice_id as string, 10) : undefined;
      const collected_by = req.query.collected_by ? parseInt(req.query.collected_by as string, 10) : undefined;
      const payment_method = req.query.payment_method as PaymentMethod | undefined;
      const start_date = req.query.start_date as string | undefined;
      const end_date = req.query.end_date as string | undefined;
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const actor = req.user ? { role: req.user.role, userId: req.user.userId } : undefined;

      const result = await paymentService.getPayments(
        { customer_id, invoice_id, collected_by, payment_method, start_date, end_date, search, page, limit },
        actor
      );

      ResponseUtil.success(res, 'قائمة سندات التحصيل والمقبوضات', result, 200);
    } catch (error) {
      next(error);
    }
  };

  getPaymentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const actor = req.user ? { role: req.user.role, userId: req.user.userId } : undefined;
      const payment = await paymentService.getPaymentById(id, actor);
      ResponseUtil.success(res, 'بيانات سند التحصيل', payment, 200);
    } catch (error) {
      next(error);
    }
  };

  createPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorId = req.user?.userId || 1;
      const created = await paymentService.createPayment(req.body, actorId);
      ResponseUtil.success(res, 'تم تسجيل سند التحصيل بنجاح', created, 201);
    } catch (error) {
      next(error);
    }
  };

  updatePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const actorId = req.user?.userId || 1;
      const updated = await paymentService.updatePayment(id, req.body, actorId);
      ResponseUtil.success(res, 'تم تعديل سند التحصيل بنجاح', updated, 200);
    } catch (error) {
      next(error);
    }
  };

  deletePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const actorId = req.user?.userId || 1;
      await paymentService.deletePayment(id, actorId);
      ResponseUtil.success(res, 'تم حذف سند التحصيل وإعادة احتساب الرصيد بنجاح', { id, deleted: true }, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const paymentController = new PaymentController();
