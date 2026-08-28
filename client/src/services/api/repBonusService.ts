import { apiClient } from './client';

export type RepTransactionType = 'BONUS' | 'DEDUCTION';

export interface RepBonusDeduction {
  id: number;
  representative_id: number;
  representative_name?: string;
  representative_job?: string;
  type: RepTransactionType;
  amount: number;
  reason: string;
  transaction_date: string;
  notes?: string | null;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
}

export interface RepBonusSummary {
  representative_id: number;
  representative_name: string;
  job_title: string;
  total_bonuses: number;
  total_deductions: number;
  net_amount: number;
  transactions_count: number;
}

export interface CreateRepBonusInput {
  representative_id: number;
  type: RepTransactionType;
  amount: number;
  reason: string;
  transaction_date?: string;
  notes?: string;
}

export class RepBonusService {
  async getTransactions(filters?: {
    representative_id?: number;
    type?: RepTransactionType;
    start_date?: string;
    end_date?: string;
  }): Promise<RepBonusDeduction[]> {
    const params = new URLSearchParams();
    if (filters?.representative_id) params.append('representative_id', String(filters.representative_id));
    if (filters?.type) params.append('type', filters.type);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const qs = params.toString();
    const endpoint = `/rep-bonuses${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<RepBonusDeduction[]>(endpoint);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب سجل مكافآت وخصومات المناديب');
    }
    return response.data;
  }

  async getSummaries(): Promise<RepBonusSummary[]> {
    const response = await apiClient.get<RepBonusSummary[]>('/rep-bonuses/summary');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب ملخصات مكافآت المناديب');
    }
    return response.data;
  }

  async createTransaction(input: CreateRepBonusInput): Promise<RepBonusDeduction> {
    const response = await apiClient.post<RepBonusDeduction>('/rep-bonuses', input);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل تسجيل المعاملة المالية');
    }
    return response.data;
  }
}

export const repBonusService = new RepBonusService();
