import { apiClient } from './client';
import { CustomerAccountStatementResponse, MonthlyStatementResponse } from '../../types/financial';

export interface StatementFilters {
  startDate?: string;
  endDate?: string;
  transactionType?: string;
}

export class StatementService {
  async getCustomerStatement(
    customerId: number,
    filters?: StatementFilters
  ): Promise<CustomerAccountStatementResponse> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.transactionType) params.append('transactionType', filters.transactionType);

    const qs = params.toString();
    const endpoint = `/customers/${customerId}/account-statement${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<CustomerAccountStatementResponse>(endpoint);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب كشف حساب العميل');
    }
    return response.data;
  }

  async getMonthlyStatement(
    customerId: number,
    year: number,
    month: number
  ): Promise<MonthlyStatementResponse> {
    const endpoint = `/customers/${customerId}/account-statement/monthly?year=${year}&month=${month}`;
    const response = await apiClient.get<MonthlyStatementResponse>(endpoint);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب كشف الحساب الشهري');
    }
    return response.data;
  }
}

export const statementService = new StatementService();
