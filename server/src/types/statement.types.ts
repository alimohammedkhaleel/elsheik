export type TransactionType = 'INVOICE' | 'PAYMENT' | 'RETURN' | 'DISCOUNT' | 'ADJUSTMENT';

export interface AccountTransaction {
  id: number;
  customer_id: number;
  transaction_date: string;
  transaction_type: TransactionType;
  reference_type: string;
  reference_id?: number | null;
  description: string;
  debit: number;
  credit: number;
  running_balance?: number;
  created_at: string;
}

export interface StatementSummary {
  opening_balance: number;
  total_debit: number;
  total_credit: number;
  closing_balance: number;
  transaction_count: number;
}

export interface CustomerAccountStatementResponse {
  customer: {
    id: number;
    customer_code: string;
    name: string;
    trade_name?: string | null;
    phone?: string | null;
    assigned_employee_name?: string | null;
  };
  period: {
    start_date?: string | null;
    end_date?: string | null;
  };
  summary: StatementSummary;
  transactions: AccountTransaction[];
}

export interface MonthlyStatementResponse {
  customer: {
    id: number;
    customer_code: string;
    name: string;
  };
  year: number;
  month: number;
  month_name_ar: string;
  opening_balance: number;
  total_sales: number;
  total_payments: number;
  returns: number;
  discounts: number;
  adjustments: number;
  closing_balance: number;
  transactions: AccountTransaction[];
}
