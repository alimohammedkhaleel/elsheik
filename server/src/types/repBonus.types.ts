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

export interface CreateRepBonusInput {
  representative_id: number;
  type: RepTransactionType;
  amount: number;
  reason: string;
  transaction_date?: string;
  notes?: string;
}

export interface RepBonusFilterOptions {
  representative_id?: number;
  type?: RepTransactionType;
  month?: number;
  year?: number;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface RepBonusSummary {
  representative_id: number;
  representative_name: string;
  total_bonuses: number;
  total_deductions: number;
  net_amount: number;
  transaction_count: number;
}
