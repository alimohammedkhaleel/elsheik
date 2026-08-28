import { Invoice } from './invoice.types';
import { Payment } from './payment.types';
import { CustomerAccountStatementResponse, AccountTransaction } from './statement.types';

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
  latestPayment?: Payment | null;
  outstandingInvoicesCount: number;
  overdueInvoicesCount: number;
}


export interface CustomerPortalSalesAnalytics {
  monthlySales: { month: string; monthName: string; total: number; invoiceCount: number }[];
  annualSales: number;
  totalInvoicesCount: number;
  averageInvoiceValue: number;
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

export interface UpdateCustomerPortalProfileInput {
  phone?: string;
  secondaryPhone?: string;
  address?: string;
}

export interface CustomerChangePasswordInput {
  currentPassword?: string;
  newPassword: string;
}
