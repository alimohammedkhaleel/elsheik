import { apiClient } from './client';
import { Invoice } from '../../types/financial';

export interface CustomerPortalOverview {
  customerId: number;
  customerCode: string;
  customerName: string;
  tradeName?: string | null;
  phone?: string | null;
  address?: string | null;
  accountStatus: string;
  classification: string;
  creditLimit: number;
  currentBalance: number;
  totalSales: number;
  totalPayments: number;
  overdueAmount: number;
  latestInvoice?: Invoice | null;
  latestPayment?: {
    id: number;
    receipt_number: string;
    amount: number;
    payment_date: string;
    payment_method: string;
  } | null;
  outstandingInvoicesCount: number;
  overdueInvoicesCount: number;
}

export interface CustomerPortalProfile {
  id: number;
  customerCode: string;
  name: string;
  tradeName?: string | null;
  phone?: string | null;
  secondaryPhone?: string | null;
  city?: string | null;
  address?: string | null;
  username: string;
  email: string;
}

export interface CustomerPortalSalesAnalytics {
  monthlySales: { month: string; monthName: string; total: number; invoiceCount: number }[];
  annualSales: number;
  totalInvoicesCount: number;
  averageInvoiceValue: number;
}

export class CustomerPortalService {
  async getOverview(): Promise<CustomerPortalOverview> {
    const response = await apiClient.get<CustomerPortalOverview>('/customer/portal/overview');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب ملخص الحساب');
    }
    return response.data;
  }

  async getInvoices(status?: string): Promise<Invoice[]> {
    const endpoint = status ? `/customer/portal/invoices?status=${status}` : '/customer/portal/invoices';
    const response = await apiClient.get<Invoice[]>(endpoint);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب فواتير العميل');
    }
    return response.data;
  }

  async getStatement(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const qs = params.toString();

    const response = await apiClient.get<any>(`/customer/portal/statement${qs ? `?${qs}` : ''}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب كشف الحساب');
    }
    return response.data;
  }

  async getSalesAnalytics(): Promise<CustomerPortalSalesAnalytics> {
    const response = await apiClient.get<CustomerPortalSalesAnalytics>('/customer/portal/sales');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب إحصائيات المبيعات');
    }
    return response.data;
  }

  async getProfile(): Promise<CustomerPortalProfile> {
    const response = await apiClient.get<CustomerPortalProfile>('/customer/portal/profile');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب بيانات الحساب');
    }
    return response.data;
  }

  async updateProfile(data: { phone?: string; secondaryPhone?: string; address?: string }): Promise<void> {
    const response = await apiClient.put('/customer/portal/profile', data);
    if (!response.success) {
      throw new Error(response.message || 'فشل تحديث بيانات الحساب');
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiClient.put('/customer/portal/change-password', {
      currentPassword,
      newPassword,
    });
    if (!response.success) {
      throw new Error(response.message || 'فشل تغيير كلمة المرور');
    }
  }
}

export const customerPortalService = new CustomerPortalService();
