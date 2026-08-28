import { dashboardRepository, DashboardSummaryOutput } from '../repositories/dashboard.repository';
import { TopBuyerCustomer } from '../types/dashboard.types';
import { UserRole } from '../types/user.types';

export class DashboardService {
  async getSummary(actor?: { role: UserRole; userId: number }): Promise<DashboardSummaryOutput> {
    return dashboardRepository.getSummary(actor);
  }

  async getTopBuyers(actor?: { role: UserRole; userId: number }): Promise<TopBuyerCustomer[]> {
    return dashboardRepository.getTopBuyers(actor);
  }
}

export const dashboardService = new DashboardService();
