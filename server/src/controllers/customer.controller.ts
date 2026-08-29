import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customer.service';
import { ResponseUtil } from '../utils/apiResponse';
import { CustomerClassification, CustomerStatus, PaymentType } from '../types/customer.types';

export class CustomerController {
  getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string | undefined;
      const payment_type = req.query.payment_type as PaymentType | undefined;
      const status = req.query.status as CustomerStatus | undefined;
      const classification = req.query.classification as CustomerClassification | undefined;
      const sort_by = req.query.sort_by as 'balance' | 'latest' | 'name' | undefined;
      const sort_order = req.query.sort_order as 'asc' | 'desc' | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const assignedEmployeeId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;

      const actor = req.user ? { role: req.user.role, userId: req.user.userId } : undefined;

      const result = await customerService.getCustomers(
        {
          search,
          payment_type,
          status,
          classification,
          sort_by,
          sort_order,
          page,
          limit,
          assigned_employee_id: assignedEmployeeId,
        },
        actor
      );

      ResponseUtil.success(res, 'قائمة العملاء', result, 200);
    } catch (error) {
      next(error);
    }
  };

  getCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const actor = req.user ? { role: req.user.role, userId: req.user.userId } : undefined;
      const customer = await customerService.getCustomerById(id, actor);
      ResponseUtil.success(res, 'بيانات العميل', customer, 200);
    } catch (error) {
      next(error);
    }
  };

  createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorId = req.user?.userId || 1;
      const created = await customerService.createCustomer(req.body, actorId);
      ResponseUtil.success(res, 'تم إنشاء العميل بنجاح', created, 201);
    } catch (error) {
      next(error);
    }
  };

  updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const actorId = req.user?.userId || 1;
      const updated = await customerService.updateCustomer(id, req.body, actorId);
      ResponseUtil.success(res, 'تم تحديث بيانات العميل بنجاح', updated, 200);
    } catch (error) {
      next(error);
    }
  };

  assignEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const { employee_id, reason, assignment_type } = req.body;
      const adminId = req.user?.userId || 1;

      const result = await customerService.assignCustomer(
        id,
        {
          employee_id: employee_id !== undefined && employee_id !== null ? parseInt(employee_id, 10) : null,
          assignment_type,
          reason,
        },
        adminId
      );

      ResponseUtil.success(res, 'تم تعيين الموظف المسؤول للعميل بنجاح', result, 200);
    } catch (error) {
      next(error);
    }
  };


  getAssignmentsHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.query.customerId
        ? parseInt(req.query.customerId as string, 10)
        : undefined;
      const history = await customerService.getAssignmentHistory(customerId);
      ResponseUtil.success(res, 'سجل تعيينات الموظفين للعملاء', history, 200);
    } catch (error) {
      next(error);
    }
  };

  deleteCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const actorId = req.user?.userId || 1;
      await customerService.deleteCustomer(id, actorId);
      ResponseUtil.success(res, 'تم حذف العميل وكافة سجلاته بنجاح', { id, deleted: true }, 200);
    } catch (error) {
      next(error);
    }
  };

  resetAllBalances = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await customerService.resetAllBalances();
      ResponseUtil.success(res, 'تم تصفير أرصدة جميع العملاء بنجاح', result, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const customerController = new CustomerController();
