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
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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
        const sortColMap: Record<string, string> = {
          invoices: 'invoice_count',
          collections: 'collections',
          avg_invoice: 'avg_invoice',
          sales: 'sales',
        };
        const sortCol = sortColMap[options?.sort_by || 'sales'] || 'sales';

        // Fully parameterized — no string interpolation
        const sql = `
          SELECT 
            c.id as customer_id,
            c.customer_code,
            c.name as customer_name,
            c.trade_name,
            c.city,
            COALESCE(SUM(i.total), 0)::numeric as sales,
            COUNT(i.id)::int as invoice_count,
            CASE WHEN COUNT(i.id) > 0 
              THEN (COALESCE(SUM(i.total), 0) / COUNT(i.id)) 
              ELSE 0 
            END::numeric as avg_invoice,
            COALESCE(p.total_paid, 0)::numeric as collections,
            COALESCE(tx.balance, 0)::numeric as current_balance
          FROM customers c
          LEFT JOIN invoices i 
            ON c.id = i.customer_id 
            AND i.invoice_date BETWEEN $1 AND $2
          LEFT JOIN (
            SELECT customer_id, SUM(amount) as total_paid
            FROM payments
            WHERE payment_date BETWEEN $1 AND $2
            GROUP BY customer_id
          ) p ON c.id = p.customer_id
          LEFT JOIN (
            SELECT customer_id, COALESCE(SUM(debit) - SUM(credit), 0) as balance
            FROM account_transactions
            GROUP BY customer_id
          ) tx ON tx.customer_id = c.id
          GROUP BY c.id, c.customer_code, c.name, c.trade_name, c.city, p.total_paid, tx.balance
          ORDER BY ${sortCol} DESC
          LIMIT $3;
        `;
        const limit = options?.limit || 20;
        const result = await query(sql, [start, end, limit]);

        return result.rows.map((row: any, idx: number) => ({
          rank: idx + 1,
          customer_id: Number(row.customer_id),
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
        console.error('[Leaderboard] getTopCustomers DB error:', err);
      }
    }

    // Memory fallback
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
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const limit = options?.limit || 20;
        // Fully parameterized DB query — no string interpolation
        // Handles both EMPLOYEE (sales) and COLLECTOR (collections) roles
        const sql = `
          SELECT
            u.id as representative_id,
            u.full_name as representative_name,
            u.job_title,
            COUNT(DISTINCT c.id)::int as assigned_customers,
            COALESCE(SUM(i.total), 0)::numeric as total_sales,
            COUNT(DISTINCT i.id)::int as invoice_count,
            COALESCE(p.total_collections, 0)::numeric as total_collections,
            CASE 
              WHEN COALESCE(SUM(i.total), 0) > 0 
              THEN LEAST(100, ROUND(
                (COALESCE(p.total_collections, 0) / COALESCE(SUM(i.total), 0)) * 100,
                1
              ))
              ELSE 100
            END::numeric as collection_rate
          FROM users u
          LEFT JOIN customers c 
            ON c.assigned_employee_id = u.id 
            AND c.status = 'ACTIVE'
          LEFT JOIN invoices i 
            ON i.employee_id = u.id 
            AND i.invoice_date BETWEEN $1 AND $2
          LEFT JOIN (
            SELECT collected_by, SUM(amount) as total_collections
            FROM payments
            WHERE payment_date BETWEEN $1 AND $2
              AND collected_by IS NOT NULL
            GROUP BY collected_by
          ) p ON p.collected_by = u.id
          WHERE u.role_code IN ('EMPLOYEE', 'COLLECTOR') 
            AND u.status = 'ACTIVE'
          GROUP BY u.id, u.full_name, u.job_title, p.total_collections
          ORDER BY total_sales DESC, total_collections DESC
          LIMIT $3;
        `;

        const result = await query(sql, [start, end, limit]);

        return result.rows.map((row: any, idx: number) => ({
          rank: idx + 1,
          representative_id: Number(row.representative_id),
          representative_name: row.representative_name,
          job_title: row.job_title || 'مندوب مبيعات',
          assigned_customers: Number(row.assigned_customers),
          total_sales: Number(row.total_sales),
          invoice_count: Number(row.invoice_count),
          total_collections: Number(row.total_collections),
          collection_rate: Number(row.collection_rate),
          visits_count: 0,
          followups_count: 0,
        }));
      } catch (err) {
        console.error('[Leaderboard] getTopRepresentatives DB error:', err);
      }
    }

    // Memory fallback
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
      const assignedCusts = customers.filter((c) => c.assigned_employee_id === rep.id);
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
        visits_count: 0,
        followups_count: 0,
      };
    });

    repStats.sort((a, b) => b.total_sales - a.total_sales || b.total_collections - a.total_collections);

    const limit = options?.limit || 20;
    return repStats.slice(0, limit).map((item, index) => ({
      rank: index + 1,
      ...item,
    }));
  }
}

export const leaderboardService = new LeaderboardService();
