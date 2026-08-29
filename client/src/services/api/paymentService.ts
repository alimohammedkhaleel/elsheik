import { apiClient } from './client';
import { Payment } from '../../types/financial';

export interface PaymentFilters {
  customer_id?: number;
  invoice_id?: number;
  collected_by?: number;
  payment_method?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreatePaymentPayload {
  receipt_number?: string;
  customer_id: number;
  invoice_id?: number;
  payment_date?: string;
  amount: number;
  payment_method?: 'CASH' | 'WALLET' | 'NSP' | 'BANK_TRANSFER' | 'INSTAPAY' | 'VODAFONE_CASH' | 'OTHER';
  collected_by?: number;
  notes?: string;
}

export class PaymentService {
  async getPayments(filters?: PaymentFilters): Promise<{ data: Payment[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.customer_id) params.append('customer_id', String(filters.customer_id));
    if (filters?.invoice_id) params.append('invoice_id', String(filters.invoice_id));
    if (filters?.collected_by) params.append('collected_by', String(filters.collected_by));
    if (filters?.payment_method) params.append('payment_method', filters.payment_method);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const qs = params.toString();
    const endpoint = `/payments${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<{ data: Payment[]; total: number }>(endpoint);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب قائمة المدفوعات');
    }
    return response.data;
  }

  async getPaymentById(id: number): Promise<Payment> {
    const response = await apiClient.get<Payment>(`/payments/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب تفاصيل الدفعة');
    }
    return response.data;
  }

  async createPayment(payload: CreatePaymentPayload): Promise<Payment> {
    const response = await apiClient.post<Payment>('/payments', payload);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل إنشاء عملية الدفع');
    }
    return response.data;
  }

  async updatePayment(id: number, payload: Partial<CreatePaymentPayload>): Promise<Payment> {
    const response = await apiClient.put<Payment>(`/payments/${id}`, payload);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل تعديل سند التحصيل');
    }
    return response.data;
  }

  async deletePayment(id: number): Promise<boolean> {
    const response = await apiClient.delete<{ id: number; deleted: boolean }>(`/payments/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'فشل حذف سند التحصيل');
    }
    return true;
  }
}

export const paymentService = new PaymentService();
