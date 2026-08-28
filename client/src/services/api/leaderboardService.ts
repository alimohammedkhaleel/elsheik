import { apiClient } from './client';

export type LeaderboardPeriod = 'today' | 'week' | 'month' | 'year' | 'custom' | 'all';

export interface TopCustomerLeaderboardItem {
  rank: number;
  customer_id: number;
  customer_code: string;
  customer_name: string;
  trade_name?: string | null;
  city?: string | null;
  sales: number;
  invoice_count: number;
  avg_invoice: number;
  collections: number;
  current_balance: number;
}

export interface TopRepresentativeLeaderboardItem {
  rank: number;
  representative_id: number;
  representative_name: string;
  job_title: string;
  assigned_customers: number;
  total_sales: number;
  invoice_count: number;
  total_collections: number;
  collection_rate: number;
}

export class LeaderboardService {
  async getTopCustomers(filters?: {
    period?: LeaderboardPeriod;
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    limit?: number;
  }): Promise<TopCustomerLeaderboardItem[]> {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.limit) params.append('limit', String(filters.limit));

    const qs = params.toString();
    const endpoint = `/leaderboard/top-customers${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<TopCustomerLeaderboardItem[]>(endpoint);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب قائمة كبار العملاء');
    }
    return response.data;
  }

  async getTopRepresentatives(filters?: {
    period?: LeaderboardPeriod;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<TopRepresentativeLeaderboardItem[]> {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.limit) params.append('limit', String(filters.limit));

    const qs = params.toString();
    const endpoint = `/leaderboard/top-representatives${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<TopRepresentativeLeaderboardItem[]>(endpoint);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب لوحة شرف المناديب');
    }
    return response.data;
  }
}

export const leaderboardService = new LeaderboardService();
