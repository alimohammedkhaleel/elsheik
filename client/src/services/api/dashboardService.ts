import { apiClient } from './client';
import { DashboardSummaryData, TopBuyerCustomer } from '../../types/financial';

export class DashboardService {
  async getSummary(): Promise<DashboardSummaryData> {
    const response = await apiClient.get<DashboardSummaryData>('/dashboard/summary');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب ملخص لوحة التحكم');
    }
    return response.data;
  }

  async getTopBuyers(): Promise<TopBuyerCustomer[]> {
    const response = await apiClient.get<TopBuyerCustomer[]>('/dashboard/top-buyers');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب قائمة كبار المشترين');
    }
    return response.data;
  }
}

export const dashboardService = new DashboardService();
