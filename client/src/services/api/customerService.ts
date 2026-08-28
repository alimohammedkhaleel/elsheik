import { apiClient } from './client';
import { Customer, CustomerAssignmentRecord } from '../../types/financial';

export interface CustomerFilters {
  search?: string;
  payment_type?: string;
  status?: string;
  classification?: string;
  sort_by?: string;
  sort_order?: string;
  employeeId?: number;
  page?: number;
  limit?: number;
}

export class CustomerService {
  async getCustomers(filters?: CustomerFilters): Promise<{ data: Customer[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.payment_type) params.append('payment_type', filters.payment_type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.classification) params.append('classification', filters.classification);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_order) params.append('sort_order', filters.sort_order);
    if (filters?.employeeId) params.append('employeeId', String(filters.employeeId));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const qs = params.toString();
    const endpoint = `/customers${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<{ data: Customer[]; total: number }>(endpoint);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب بيانات العملاء');
    }
    return response.data;
  }

  async getCustomerById(id: number): Promise<Customer> {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب بيانات العميل');
    }
    return response.data;
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const response = await apiClient.post<Customer>('/customers', data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل إنشاء حساب العميل');
    }
    return response.data;
  }

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    const response = await apiClient.put<Customer>(`/customers/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل تحديث بيانات العميل');
    }
    return response.data;
  }

  async assignCustomer(
    id: number,
    employeeId: number | null,
    reason?: string,
    assignmentType: 'SALES_REP' | 'ACCOUNTANT' | 'FOLLOW_UP' = 'SALES_REP'
  ): Promise<{ customer: Customer; assignment: CustomerAssignmentRecord }> {
    const response = await apiClient.patch<{ customer: Customer; assignment: CustomerAssignmentRecord }>(
      `/customers/${id}/assignment`,
      { employee_id: employeeId, reason, assignment_type: assignmentType }
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل إسناد العميل');
    }
    return response.data;
  }


  async getAssignmentsHistory(customerId?: number): Promise<CustomerAssignmentRecord[]> {
    const endpoint = customerId ? `/customers/assignments?customerId=${customerId}` : '/customers/assignments';
    const response = await apiClient.get<CustomerAssignmentRecord[]>(endpoint);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب سجل الإسنادات');
    }
    return response.data;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const response = await apiClient.delete<{ id: number; deleted: boolean }>(`/customers/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'فشل حذف العميل');
    }
    return true;
  }
}

export const customerService = new CustomerService();
