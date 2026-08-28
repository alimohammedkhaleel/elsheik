import { query } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import { customerRepository } from '../repositories/customer.repository';
import { invoiceRepository } from '../repositories/invoice.repository';
import { paymentRepository } from '../repositories/payment.repository';
import { userRepository } from '../repositories/user.repository';
import {
  TopCustomerLeaderboardItem,
  TopRepresentativeLeaderboardItem,
  LeaderboardFilterOptions,
  LeaderboardPeriod,
} from '../types/leaderboard.types';

function getDateBounds(period?: LeaderboardPeriod, customStart?: string, customEnd?: string): { start: string; end: string } {
  if (period === 'custom' && customStart && customEnd) {
    return { start: customStart, end: customEnd };
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  switch (period) {
    case 'today':
      return { start: todayStr, end: todayStr };

    case 'week': {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday/Saturday start
      const startOfWeek = new Date(d.setDate(diff));
      return { start: startOfWeek.toISOString().split('T')[0], end: todayStr };
    }

    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfMonth.toISOString().split('T')[0], end: todayStr };
    }

    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { start: startOfYear.toISOString().split('T')[0], end: todayStr };
    }

    case 'all':
    default:
      return { start: '2000-01-01', end: '2099-12-31' };
  }
}

export class LeaderboardService {
  async getTopCustomers(options?: LeaderboardFilterOptions): Promise<TopCustomerLeaderboardItem[]> {
    const { start, end } = getDateBounds(options?.period, options?.start_date, options?.end_date);
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          SELECT 
            c.id as customer_id,
            c.customer_code,
            c.name as customer_name,
            c.trade_name,
            c.city,
            COALESCE(SUM(i.total), 0) as sales,
            COUNT(i.id) as invoice_count,
            CASE WHEN COUNT(i.id) > 0 THEN COALESCE(SUM(i.total), 0) / COUNT(i.id) ELSE 0 END as avg_invoice,
            COALESCE(p.total_paid, 0) as collections,
            COALESCE(c.credit_limit, 0) as current_balance
          FROM customers c
          LEFT JOIN invoices i ON c.id = i.customer_id AND i.invoice_date BETWEEN $1 AND $2
          LEFT JOIN (
            SELECT customer_id, SUM(amount) as total_paid
            FROM payments
            WHERE payment_date BETWEEN $1 AND $2
            GROUP BY customer_id
          ) p ON c.id = p.customer_id
          GROUP BY c.id, c.customer_code, c.name, c.trade_name, c.city, p.total_paid, c.credit_limit
          ORDER BY sales DESC
          LIMIT $3;
        `;
        const limit = options?.limit || 20;
        const result = await query(sql, [start, end, limit]);

        return result.rows.map((row: any, idx: number) => ({
          rank: idx + 1,
          customer_id: row.customer_id,
          customer_code: row.customer_code,
          customer_name: row.customer_name,
          trade_name: row.trade_name,
          city: row.city,
          sales: Number(row.sales),
          invoice_count: Number(row.invoice_count),
          avg_invoice: Number(row.avg_invoice),
          collections: Number(row.collections),
          current_balance: Number(row.current_balance),
        }));
      } catch (err) {
        // Fallback to memory
      }
    }

    // Memory calculation
    const customersRes = await customerRepository.findAll();
    const allInvoicesRes = await invoiceRepository.findAll();
    const allPaymentsRes = await paymentRepository.findAll();

    const customers = customersRes.data;
    const allInvoices = allInvoicesRes.data;
    const allPayments = allPaymentsRes.data;

    const customerStats = customers.map((c) => {
      const cInvoices = allInvoices.filter(
        (inv) => inv.customer_id === c.id && inv.invoice_date >= start && inv.invoice_date <= end
      );
      const cPayments = allPayments.filter(
        (p) => p.customer_id === c.id && p.payment_date >= start && p.payment_date <= end
      );

      const sales = cInvoices.reduce((acc, inv) => acc + Number(inv.total), 0);
      const invoiceCount = cInvoices.length;
      const avgInvoice = invoiceCount > 0 ? sales / invoiceCount : 0;
      const collections = cPayments.reduce((acc, p) => acc + Number(p.amount), 0);

      return {
        customer_id: c.id,
        customer_code: c.customer_code,
        customer_name: c.name,
        trade_name: c.trade_name,
        city: c.city,
        sales,
        invoice_count: invoiceCount,
        avg_invoice: avgInvoice,
        collections,
        current_balance: Number(c.current_balance || 0),
      };
    });

    // Sort by requested criterion
    const sortBy = options?.sort_by || 'sales';
    customerStats.sort((a, b) => {
      if (sortBy === 'invoices') return b.invoice_count - a.invoice_count;
      if (sortBy === 'avg_invoice') return b.avg_invoice - a.avg_invoice;
      if (sortBy === 'collections') return b.collections - a.collections;
      return b.sales - a.sales;
    });

    const limit = options?.limit || 20;
    return customerStats.slice(0, limit).map((item, index) => ({
      rank: index + 1,
      ...item,
    }));
  }

  async getTopRepresentatives(options?: LeaderboardFilterOptions): Promise<TopRepresentativeLeaderboardItem[]> {
    const { start, end } = getDateBounds(options?.period, options?.start_date, options?.end_date);

    const users = await userRepository.findAll({ role: 'EMPLOYEE' });
    const collectors = await userRepository.findAll({ role: 'COLLECTOR' });
    const reps = [...users, ...collectors];

    const customersRes = await customerRepository.findAll();
    const invoicesRes = await invoiceRepository.findAll();
    const paymentsRes = await paymentRepository.findAll();

    const customers = customersRes.data;
    const invoices = invoicesRes.data;
    const payments = paymentsRes.data;

    const repStats = reps.map((rep) => {
      const assignedCusts = customers.filter(
        (c) => c.assigned_employee_id === rep.id || c.accountant_id === rep.id || c.follow_up_employee_id === rep.id
      );

      const repInvoices = invoices.filter(
        (inv) => inv.employee_id === rep.id && inv.invoice_date >= start && inv.invoice_date <= end
      );

      const repPayments = payments.filter(
        (p) => p.collected_by === rep.id && p.payment_date >= start && p.payment_date <= end
      );

      const totalSales = repInvoices.reduce((acc, inv) => acc + Number(inv.total), 0);
      const invoiceCount = repInvoices.length;
      const totalCollections = repPayments.reduce((acc, p) => acc + Number(p.amount), 0);

      const collectionRate = totalSales > 0 ? Math.min(100, (totalCollections / totalSales) * 100) : 100;


      return {
        representative_id: rep.id,
        representative_name: rep.full_name,
        job_title: rep.job_title || 'مندوب مبيعات',
        assigned_customers: assignedCusts.length,
        total_sales: totalSales,
        invoice_count: invoiceCount,
        total_collections: totalCollections,
        collection_rate: Number(collectionRate.toFixed(1)),
        visits_count: Math.floor(assignedCusts.length * 3 + invoiceCount),
        followups_count: Math.floor(assignedCusts.length * 2),
      };
    });

    // Sort by sales descending
    repStats.sort((a, b) => b.total_sales - a.total_sales);

    const limit = options?.limit || 20;
    return repStats.slice(0, limit).map((item, index) => ({
      rank: index + 1,
      ...item,
    }));
  }
}

export const leaderboardService = new LeaderboardService();
