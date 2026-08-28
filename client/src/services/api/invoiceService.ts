import { apiClient } from './client';
import { Invoice } from '../../types/financial';

export interface InvoiceFilters {
  customer_id?: number;
  employee_id?: number;
  payment_status?: string;
  payment_type?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateInvoicePayload {
  invoice_number?: string;
  customer_id: number;
  invoice_date?: string;
  employee_id?: number;
  payment_type?: 'CASH' | 'CREDIT';
  payment_terms_days?: number;
  discount?: number;
  notes?: string;
  items: {
    product_id: number;
    quantity: number;
    unit_price?: number;
    discount?: number;
  }[];
}

export class InvoiceService {
  async getInvoices(filters?: InvoiceFilters): Promise<{ data: Invoice[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.customer_id) params.append('customer_id', String(filters.customer_id));
    if (filters?.employee_id) params.append('employee_id', String(filters.employee_id));
    if (filters?.payment_status) params.append('payment_status', filters.payment_status);
    if (filters?.payment_type) params.append('payment_type', filters.payment_type);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const qs = params.toString();
    const endpoint = `/invoices${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<{ data: Invoice[]; total: number }>(endpoint);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب قائمة الفواتير');
    }
    return response.data;
  }

  async getInvoiceById(id: number): Promise<Invoice> {
    const response = await apiClient.get<Invoice>(`/invoices/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب تفاصيل الفاتورة');
    }
    return response.data;
  }

  async createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
    const response = await apiClient.post<Invoice>('/invoices', payload);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل إنشاء الفاتورة');
    }
    return response.data;
  }

  async updateInvoice(id: number, payload: Partial<CreateInvoicePayload>): Promise<Invoice> {
    const response = await apiClient.put<Invoice>(`/invoices/${id}`, payload);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل تعديل الفاتورة');
    }
    return response.data;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const response = await apiClient.delete<{ id: number; deleted: boolean }>(`/invoices/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'فشل حذف الفاتورة');
    }
    return true;
  }
}

export const invoiceService = new InvoiceService();
