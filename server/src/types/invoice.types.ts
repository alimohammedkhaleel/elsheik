import { PaymentType } from './customer.types';

export type InvoicePaymentStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'OVERDUE';

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
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceItemInput {
  product_id: number;
  quantity: number;
  unit_price?: number;
  discount?: number;
}

export interface CreateInvoiceInput {
  invoice_number?: string;
  customer_id: number;
  invoice_date?: string;
  employee_id?: number;
  payment_type?: PaymentType;
  payment_terms_days?: number;
  discount?: number;
  notes?: string;
  items: CreateInvoiceItemInput[];
}

export interface InvoiceFilterOptions {
  customer_id?: number;
  employee_id?: number;
  payment_status?: InvoicePaymentStatus;
  payment_type?: PaymentType;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}
