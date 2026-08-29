export type PaymentMethod = 'CASH' | 'WALLET' | 'NSP' | 'BANK_TRANSFER' | 'INSTAPAY' | 'VODAFONE_CASH' | 'OTHER';

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
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentAllocation {
  id: number;
  payment_id: number;
  invoice_id: number;
  invoice_number?: string;
  amount: number;
  created_at: string;
}

export interface CreatePaymentInput {
  receipt_number?: string;
  customer_id: number;
  invoice_id?: number;
  payment_date?: string;
  amount: number;
  payment_method?: PaymentMethod;
  collected_by?: number;
  notes?: string;
}

export interface PaymentFilterOptions {
  customer_id?: number;
  invoice_id?: number;
  collected_by?: number;
  payment_method?: PaymentMethod;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}
