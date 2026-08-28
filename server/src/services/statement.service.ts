import { statementRepository } from '../repositories/statement.repository';
import { customerRepository } from '../repositories/customer.repository';
import { AppError } from '../middleware/errorHandler';
import { CustomerAccountStatementResponse, MonthlyStatementResponse } from '../types/statement.types';
import { UserRole } from '../types/user.types';

export class StatementService {
  async getCustomerStatement(
    customerId: number,
    startDate?: string,
    endDate?: string,
    transactionType?: string,
    actor?: { role: UserRole; userId: number }
  ): Promise<CustomerAccountStatementResponse> {
    const customer = await customerRepository.findById(customerId, actor);
    if (!customer) {
      throw new AppError('العميل غير موجود أو ليس لديك صلاحية الوصول إليه', 404, 'CUSTOMER_NOT_FOUND');
    }

    const statement = await statementRepository.getStatement(customerId, startDate, endDate, transactionType);
    if (!statement) {
      throw new AppError('تعذر جلب كشف الحساب لهذا العميل', 500, 'STATEMENT_FETCH_FAILED');
    }

    return statement;
  }

  async getCustomerMonthlyStatement(
    customerId: number,
    year: number,
    month: number,
    actor?: { role: UserRole; userId: number }
  ): Promise<MonthlyStatementResponse> {
    const customer = await customerRepository.findById(customerId, actor);
    if (!customer) {
      throw new AppError('العميل غير موجود أو ليس لديك صلاحية الوصول إليه', 404, 'CUSTOMER_NOT_FOUND');
    }

    if (month < 1 || month > 12) {
      throw new AppError('رقم الشهر غير صحيح (يجب أن يكون بين 1 و 12)', 400, 'INVALID_MONTH');
    }

    const monthly = await statementRepository.getMonthlyStatement(customerId, year, month);
    if (!monthly) {
      throw new AppError('تعذر إنشاء كشف الحساب الشهري لهذا العميل', 500, 'STATEMENT_FETCH_FAILED');
    }

    return monthly;
  }
}

export const statementService = new StatementService();
