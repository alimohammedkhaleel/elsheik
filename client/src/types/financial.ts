export type PaymentType = 'CASH' | 'CREDIT';
export type CustomerClassification = 'A' | 'B' | 'C';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE';
export type InvoicePaymentStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'OVERDUE';
export type PaymentMethod = 'CASH' | 'WALLET' | 'NSP' | 'BANK_TRANSFER' | 'INSTAPAY' | 'VODAFONE_CASH' | 'OTHER';
export type AssignmentType = 'SALES_REP' | 'ACCOUNTANT' | 'FOLLOW_UP';
export type InteractionType = 'VISIT' | 'CALL' | 'NOTE' | 'FOLLOW_UP' | 'CUSTOMER_SERVICE';

export interface Customer {
  id: number;
  customer_code: string;
  name: string;
  trade_name?: string | null;
  phone?: string | null;
  secondary_phone?: string | null;
  city?: string | null;
  address?: string | null;
  payment_type: PaymentType;
  payment_terms_days: number;
  assigned_employee_id?: number | null;
  assigned_employee_name?: string | null;
  accountant_id?: number | null;
  accountant_name?: string | null;
  follow_up_employee_id?: number | null;
  follow_up_employee_name?: string | null;
  status: CustomerStatus;
  classification: CustomerClassification;
  has_app: boolean;
  credit_limit: number;
  current_balance?: number;
  total_sales?: number;
  total_paid?: number;
  overdue_amount?: number;
  invoice_count?: number;
  avg_invoice?: number;
  last_payment_date?: string | null;
  last_order_date?: string | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerAssignmentRecord {
  id: number;
  customer_id: number;
  customer_name?: string;
  previous_employee_id?: number | null;
  previous_employee_name?: string | null;
  new_employee_id?: number | null;
  new_employee_name?: string | null;
  assignment_type?: AssignmentType;
  assigned_by?: number | null;
  assigned_by_name?: string | null;
  assigned_at: string;
  reason?: string | null;
}

export interface CustomerInteraction {
  id: number;
  customer_id: number;
  employee_id: number;
  employee_name?: string;
  interaction_type: InteractionType;
  interaction_date: string;
  summary?: string;
  notes?: string;
  follow_up_date?: string | null;
  is_resolved?: boolean;
  created_at: string;
}


export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  product_id: number;
  product_name?: string;
  product_code?: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  customer_code?: string;
  invoice_date: string;
  employee_id?: number | null;
  employee_name?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  paid_amount?: number;
  remaining_amount?: number;
  payment_type: PaymentType;
  due_date: string;
  payment_status: InvoicePaymentStatus;
  notes?: string | null;
  items?: InvoiceItem[];
  created_at: string;
}

export interface Payment {
  id: number;
  receipt_number: string;
  customer_id: number;
  customer_name?: string;
  customer_code?: string;
  invoice_id?: number | null;
  invoice_number?: string | null;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  collected_by?: number | null;
  collected_by_name?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface AccountTransaction {
  id: number;
  customer_id: number;
  transaction_date: string;
  transaction_type: 'INVOICE' | 'PAYMENT' | 'RETURN' | 'DISCOUNT' | 'ADJUSTMENT';
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

export interface DashboardSummaryData {
  totalCustomers: number;
  activeCustomers: number;
  totalSales: number;
  totalCollections: number;
  totalOutstandingBalance: number;
  pendingApprovalsCount: number;
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
