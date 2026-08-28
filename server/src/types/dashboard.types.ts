export interface DashboardSummaryData {
  total_customers: number;
  active_customers: number;
  total_sales: number;
  total_payments: number;
  total_outstanding_balance: number;
  pending_approvals: number;
}

export interface TopBuyerCustomer {
  customer_id: number;
  customer_code: string;
  customer_name: string;
  trade_name?: string | null;
  phone?: string | null;
  total_sales: number;
  invoice_count: number;
  avg_invoice: number;
  current_balance: number;
}
