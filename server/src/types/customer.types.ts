export type PaymentType = 'CASH' | 'CREDIT';
export type CustomerClassification = 'A' | 'B' | 'C';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE';
export type AssignmentType = 'SALES_REP' | 'ACCOUNTANT' | 'FOLLOW_UP';

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

export interface CreateCustomerInput {
  customer_code?: string;
  name: string;
  trade_name?: string;
  phone?: string;
  secondary_phone?: string;
  city?: string;
  address?: string;
  payment_type?: PaymentType;
  payment_terms_days?: number;
  assigned_employee_id?: number | null;
  accountant_id?: number | null;
  follow_up_employee_id?: number | null;
  status?: CustomerStatus;
  classification?: CustomerClassification;
  has_app?: boolean;
  credit_limit?: number;
}

export interface UpdateCustomerInput {
  name?: string;
  trade_name?: string;
  phone?: string;
  secondary_phone?: string;
  city?: string;
  address?: string;
  payment_type?: PaymentType;
  payment_terms_days?: number;
  assigned_employee_id?: number | null;
  accountant_id?: number | null;
  follow_up_employee_id?: number | null;
  status?: CustomerStatus;
  classification?: CustomerClassification;
  has_app?: boolean;
  credit_limit?: number;
}


export interface CustomerAssignmentRecord {
  id: number;
  customer_id: number;
  customer_name?: string;
  assignment_type?: AssignmentType;
  previous_employee_id?: number | null;
  previous_employee_name?: string | null;
  new_employee_id?: number | null;
  new_employee_name?: string | null;
  assigned_by?: number | null;
  assigned_by_name?: string | null;
  assigned_at: string;
  reason?: string | null;
}

export interface AssignCustomerInput {
  employee_id: number | null;
  assignment_type?: AssignmentType;
  reason?: string;
}


export interface CustomerFilterOptions {
  search?: string;
  payment_type?: PaymentType;
  assigned_employee_id?: number;
  status?: CustomerStatus;
  classification?: CustomerClassification;
  sort_by?: 'balance' | 'latest' | 'name';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
