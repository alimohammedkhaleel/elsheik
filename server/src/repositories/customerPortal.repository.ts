import { customerRepository } from './customer.repository';
import { invoiceRepository } from './invoice.repository';
import { paymentRepository } from './payment.repository';
import { statementRepository } from './statement.repository';
import {
  CustomerPortalOverview,
  CustomerPortalSalesAnalytics,
  CustomerPortalProfile,
  UpdateCustomerPortalProfileInput,
} from '../types/customerPortal.types';
import { Invoice } from '../types/invoice.types';
import { CustomerAccountStatementResponse } from '../types/statement.types';

export class CustomerPortalRepository {
  async getOverview(customerId: number): Promise<CustomerPortalOverview | null> {
    const customer = await customerRepository.findById(customerId);
    if (!customer) return null;

    const invoicesRes = await invoiceRepository.findAll({ customer_id: customerId });
    const paymentsRes = await paymentRepository.findAll({ customer_id: customerId });
    const statement = await statementRepository.getStatement(customerId);

    const invoices = invoicesRes.data;
    const payments = paymentsRes.data;

    const latestInvoice = invoices.length > 0 ? invoices[0] : null;
    const latestPayment = payments.length > 0 ? payments[0] : null;

    const outstandingInvoices = invoices.filter(
      (inv) => inv.payment_status === 'UNPAID' || inv.payment_status === 'PARTIALLY_PAID' || inv.payment_status === 'OVERDUE'
    );
    const overdueInvoices = invoices.filter((inv) => inv.payment_status === 'OVERDUE');

    return {
      customerId: customer.id,
      customerCode: customer.customer_code,
      customerName: customer.name,
      tradeName: customer.trade_name,
      phone: customer.phone,
      address: customer.address,
      accountStatus: customer.status,
      classification: customer.classification,
      creditLimit: Number(customer.credit_limit || 0),
      currentBalance: statement?.summary.closing_balance || 0,
      totalSales: statement?.summary.total_debit || 0,
      totalPayments: statement?.summary.total_credit || 0,
      overdueAmount: Number(customer.overdue_amount || 0),
      latestInvoice,
      latestPayment,
      outstandingInvoicesCount: outstandingInvoices.length,
      overdueInvoicesCount: overdueInvoices.length,
    };
  }

  async getInvoices(customerId: number, status?: string): Promise<Invoice[]> {
    const res = await invoiceRepository.findAll({ customer_id: customerId });
    if (status && status !== 'ALL') {
      return res.data.filter((inv) => inv.payment_status === status);
    }
    return res.data;
  }

  async getStatement(
    customerId: number,
    options?: { startDate?: string; endDate?: string }
  ): Promise<CustomerAccountStatementResponse | null> {
    return statementRepository.getStatement(customerId, options?.startDate, options?.endDate);
  }

  async getSalesAnalytics(customerId: number): Promise<CustomerPortalSalesAnalytics> {
    const res = await invoiceRepository.findAll({ customer_id: customerId });
    const invoices = res.data;

    // Group invoices by month
    const monthMap = new Map<string, { total: number; count: number }>();
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    let annualSales = 0;
    for (const inv of invoices) {
      const invDate = new Date(inv.invoice_date);
      const mKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`;
      const prev = monthMap.get(mKey) || { total: 0, count: 0 };
      monthMap.set(mKey, {
        total: prev.total + Number(inv.total),
        count: prev.count + 1,
      });
      annualSales += Number(inv.total);
    }

    const monthlySales = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mKey, data]) => {
        const monthNum = parseInt(mKey.split('-')[1], 10) - 1;
        return {
          month: mKey,
          monthName: monthNames[monthNum] || mKey,
          total: data.total,
          invoiceCount: data.count,
        };
      });

    // If no invoices yet, provide last 6 months with zero values
    if (monthlySales.length === 0) {
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlySales.push({
          month: mKey,
          monthName: monthNames[d.getMonth()],
          total: 0,
          invoiceCount: 0,
        });
      }
    }

    const totalInvoicesCount = invoices.length;
    const averageInvoiceValue = totalInvoicesCount > 0 ? annualSales / totalInvoicesCount : 0;

    return {
      monthlySales,
      annualSales,
      totalInvoicesCount,
      averageInvoiceValue,
    };
  }

  async getProfile(customerId: number, username: string, email: string): Promise<CustomerPortalProfile | null> {
    const customer = await customerRepository.findById(customerId);
    if (!customer) return null;

    return {
      id: customer.id,
      customerCode: customer.customer_code,
      name: customer.name,
      tradeName: customer.trade_name,
      phone: customer.phone,
      secondaryPhone: customer.secondary_phone,
      city: customer.city,
      address: customer.address,
      username,
      email,
    };
  }

  async updateProfile(customerId: number, input: UpdateCustomerPortalProfileInput): Promise<boolean> {
    const customer = await customerRepository.findById(customerId);
    if (!customer) return false;

    await customerRepository.update(customerId, {
      phone: input.phone !== undefined ? input.phone : customer.phone || undefined,
      secondary_phone: input.secondaryPhone !== undefined ? input.secondaryPhone : customer.secondary_phone || undefined,
      address: input.address !== undefined ? input.address : customer.address || undefined,
    });

    return true;
  }
}

export const customerPortalRepository = new CustomerPortalRepository();

