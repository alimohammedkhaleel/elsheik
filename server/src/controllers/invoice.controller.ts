import { Request, Response, NextFunction } from 'express';
import { invoiceService } from '../services/invoice.service';
import { ResponseUtil } from '../utils/apiResponse';
import { InvoicePaymentStatus } from '../types/invoice.types';
import { PaymentType } from '../types/customer.types';

export class InvoiceController {
  getInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customer_id = req.query.customer_id ? parseInt(req.query.customer_id as string, 10) : undefined;
      const employee_id = req.query.employee_id ? parseInt(req.query.employee_id as string, 10) : undefined;
      const payment_status = req.query.payment_status as InvoicePaymentStatus | undefined;
      const payment_type = req.query.payment_type as PaymentType | undefined;
      const start_date = req.query.start_date as string | undefined;
      const end_date = req.query.end_date as string | undefined;
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const actor = req.user ? { role: req.user.role, userId: req.user.userId } : undefined;

      const result = await invoiceService.getInvoices(
        { customer_id, employee_id, payment_status, payment_type, start_date, end_date, search, page, limit },
        actor
      );

      ResponseUtil.success(res, 'قائمة الفواتير', result, 200);
    } catch (error) {
      next(error);
    }
  };

  getInvoiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const actor = req.user ? { role: req.user.role, userId: req.user.userId } : undefined;
      const invoice = await invoiceService.getInvoiceById(id, actor);
      ResponseUtil.success(res, 'بيانات الفاتورة', invoice, 200);
    } catch (error) {
      next(error);
    }
  };

  createInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorId = req.user?.userId || 1;
      const created = await invoiceService.createInvoice(req.body, actorId);
      ResponseUtil.success(res, 'تم إنشاء الفاتورة بنجاح', created, 201);
    } catch (error) {
      next(error);
    }
  };

  updateInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const actorId = req.user?.userId || 1;
      const updated = await invoiceService.updateInvoice(id, req.body, actorId);
      ResponseUtil.success(res, 'تم تعديل الفاتورة بنجاح', updated, 200);
    } catch (error) {
      next(error);
    }
  };

  deleteInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const actorId = req.user?.userId || 1;
      await invoiceService.deleteInvoice(id, actorId);
      ResponseUtil.success(res, 'تم حذف الفاتورة وإلغاء قيودها المالية بنجاح', { id, deleted: true }, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const invoiceController = new InvoiceController();
