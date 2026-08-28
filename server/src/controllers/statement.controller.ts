import { Request, Response, NextFunction } from 'express';
import { statementService } from '../services/statement.service';
import { ResponseUtil } from '../utils/apiResponse';

export class StatementController {
  getCustomerStatement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = parseInt(req.params.id, 10);
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const transactionType = req.query.transactionType as string | undefined;

      const actor = req.user ? { role: req.user.role, userId: req.user.userId } : undefined;

      const statement = await statementService.getCustomerStatement(
        customerId,
        startDate,
        endDate,
        transactionType,
        actor
      );

      ResponseUtil.success(res, 'كشف الحساب التفصيلي للعميل', statement, 200);
    } catch (error) {
      next(error);
    }
  };

  getMonthlyStatement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = parseInt(req.params.id, 10);
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month as string, 10) : new Date().getMonth() + 1;

      const actor = req.user ? { role: req.user.role, userId: req.user.userId } : undefined;

      const statement = await statementService.getCustomerMonthlyStatement(
        customerId,
        year,
        month,
        actor
      );

      ResponseUtil.success(res, 'كشف الحساب الشهري للعميل', statement, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const statementController = new StatementController();
