export type LeaderboardPeriod = 'today' | 'week' | 'month' | 'year' | 'custom' | 'all';
export type CustomerLeaderboardSort = 'sales' | 'invoices' | 'avg_invoice' | 'collections';
export type RepLeaderboardSort = 'sales' | 'collections' | 'invoices' | 'rate' | 'visits';

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
  collection_rate: number; // percentage e.g. 92.5%
  visits_count: number;
  followups_count: number;
}

export interface LeaderboardFilterOptions {
  period?: LeaderboardPeriod;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  limit?: number;
}
