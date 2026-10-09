import { query } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import { customerRepository } from './customer.repository';
import { approvalRepository } from './approval.repository';
import { memoryInvoices, memoryAccountTransactions } from './invoice.repository';
import { memoryPayments } from './payment.repository';
import { TopBuyerCustomer } from '../types/dashboard.types';
import { UserRole } from '../types/user.types';

export interface DashboardSummaryOutput {
  totalCustomers: number;
  activeCustomers: number;
  totalSales: number;
  totalCollections: number;
  totalOutstandingBalance: number;
  pendingApprovalsCount: number;
}

export class DashboardRepository {
  async getSummary(actor?: { role: UserRole; userId: number }): Promise<DashboardSummaryOutput> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const isFiltered = actor && (actor.role === 'EMPLOYEE' || actor.role === 'COLLECTOR');

        if (isFiltered) {
          // Single consolidated query for filtered view — avoids 5 round-trips
          const res = await query<{
            total_customers: string;
            active_customers: string;
            total_sales: string;
            total_collections: string;
            outstanding_balance: string;
            pending_approvals: string;
          }>(
            `SELECT
               (SELECT COUNT(*) FROM customers WHERE assigned_employee_id = $1) AS total_customers,
               (SELECT COUNT(*) FROM customers WHERE assigned_employee_id = $1 AND status = 'ACTIVE') AS active_customers,
               (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE employee_id = $1) AS total_sales,
               (SELECT COALESCE(SUM(p.amount), 0)
                FROM payments p
                WHERE p.customer_id IN (SELECT id FROM customers WHERE assigned_employee_id = $1)
               ) AS total_collections,
               (SELECT COALESCE(SUM(i.total - COALESCE(pa.paid, 0)), 0)
                FROM invoices i
                LEFT JOIN (
                  SELECT invoice_id, SUM(amount) AS paid
                  FROM payment_allocations
                  GROUP BY invoice_id
                ) pa ON pa.invoice_id = i.id
                WHERE i.employee_id = $1
                  AND i.payment_status <> 'PAID'
               ) AS outstanding_balance,
               (SELECT COUNT(*) FROM approval_records WHERE status = 'PENDING') AS pending_approvals`,
            [actor!.userId]
          );

          const row = res.rows[0];
          return {
            totalCustomers: parseInt(row?.total_customers || '0', 10),
            activeCustomers: parseInt(row?.active_customers || '0', 10),
            totalSales: parseFloat(row?.total_sales || '0'),
            totalCollections: parseFloat(row?.total_collections || '0'),
            totalOutstandingBalance: parseFloat(row?.outstanding_balance || '0'),
            pendingApprovalsCount: parseInt(row?.pending_approvals || '0', 10),
          };
        }

        // Unfiltered admin view — single consolidated query
        const res = await query<{
          total_customers: string;
          active_customers: string;
          total_sales: string;
          total_collections: string;
          outstanding_balance: string;
          pending_approvals: string;
        }>(
          `SELECT
             (SELECT COUNT(*) FROM customers) AS total_customers,
             (SELECT COUNT(*) FROM customers WHERE status = 'ACTIVE') AS active_customers,
             (SELECT COALESCE(SUM(total), 0) FROM invoices) AS total_sales,
             (SELECT COALESCE(SUM(amount), 0) FROM payments) AS total_collections,
             (SELECT COALESCE(SUM(i.total - COALESCE(pa.paid, 0)), 0)
              FROM invoices i
              LEFT JOIN (
                SELECT invoice_id, SUM(amount) AS paid
                FROM payment_allocations
                GROUP BY invoice_id
              ) pa ON pa.invoice_id = i.id
              WHERE i.payment_status <> 'PAID'
             ) AS outstanding_balance,
             (SELECT COUNT(*) FROM approval_records WHERE status = 'PENDING') AS pending_approvals`
        );

        const row = res.rows[0];
        return {
          totalCustomers: parseInt(row?.total_customers || '0', 10),
          activeCustomers: parseInt(row?.active_customers || '0', 10),
          totalSales: parseFloat(row?.total_sales || '0'),
          totalCollections: parseFloat(row?.total_collections || '0'),
          totalOutstandingBalance: parseFloat(row?.outstanding_balance || '0'),
          pendingApprovalsCount: parseInt(row?.pending_approvals || '0', 10),
        };
      } catch (err) {
        // Fallback to memory
      }
    }

    const custData = await customerRepository.findAll();
    const approvals = await approvalRepository.findAll('PENDING');

    let totalSales = 0;
    for (const inv of memoryInvoices) { totalSales += inv.total; }

    let totalCollections = 0;
    for (const pmt of memoryPayments) { totalCollections += pmt.amount; }

    let totalBalance = 0;
    for (const tx of memoryAccountTransactions) { totalBalance += tx.debit - tx.credit; }

    return {
      totalCustomers: custData.total,
      activeCustomers: custData.data.filter((c) => c.status === 'ACTIVE').length,
      totalSales,
      totalCollections,
      totalOutstandingBalance: totalBalance,
      pendingApprovalsCount: approvals.length,
    };
  }

  async getTopBuyers(actor?: { role: UserRole; userId: number }): Promise<TopBuyerCustomer[]> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const isFiltered = actor && (actor.role === 'EMPLOYEE' || actor.role === 'COLLECTOR');

        /**
         * Optimised query:
         *  - Uses CTE `inv_agg` to aggregate invoices once (uses idx_invoices_employee_date or idx_invoices_customer_date)
         *  - Uses CTE `bal_agg` to aggregate payment_allocations once (uses idx_pa_invoice_amount)
         *  - Final join is between two small result sets instead of raw tables
         */
        const sql = isFiltered
          ? `
              WITH inv_agg AS (
                SELECT
                  customer_id,
                  COALESCE(SUM(total), 0)::numeric          AS total_sales,
                  COUNT(*)::int                              AS invoice_count,
                  COALESCE(AVG(total), 0)::numeric          AS avg_invoice,
                  COALESCE(SUM(total - COALESCE(pa.paid,0)), 0)::numeric AS current_balance
                FROM invoices i
                LEFT JOIN (
                  SELECT invoice_id, SUM(amount) AS paid
                  FROM payment_allocations
                  GROUP BY invoice_id
                ) pa ON pa.invoice_id = i.id
                WHERE i.employee_id = $1
                GROUP BY customer_id
              )
              SELECT
                c.id           AS customer_id,
                c.customer_code,
                c.name         AS customer_name,
                c.trade_name,
                c.phone,
                a.total_sales,
                a.invoice_count,
                a.avg_invoice,
                a.current_balance
              FROM inv_agg a
              JOIN customers c ON c.id = a.customer_id
              ORDER BY a.total_sales DESC
              LIMIT 5;`
          : `
              WITH inv_agg AS (
                SELECT
                  customer_id,
                  COALESCE(SUM(total), 0)::numeric          AS total_sales,
                  COUNT(*)::int                              AS invoice_count,
                  COALESCE(AVG(total), 0)::numeric          AS avg_invoice,
                  COALESCE(SUM(total - COALESCE(pa.paid,0)), 0)::numeric AS current_balance
                FROM invoices i
                LEFT JOIN (
                  SELECT invoice_id, SUM(amount) AS paid
                  FROM payment_allocations
                  GROUP BY invoice_id
                ) pa ON pa.invoice_id = i.id
                GROUP BY customer_id
              )
              SELECT
                c.id           AS customer_id,
                c.customer_code,
                c.name         AS customer_name,
                c.trade_name,
                c.phone,
                a.total_sales,
                a.invoice_count,
                a.avg_invoice,
                a.current_balance
              FROM inv_agg a
              JOIN customers c ON c.id = a.customer_id
              ORDER BY a.total_sales DESC
              LIMIT 5;`;

        const params = isFiltered ? [actor!.userId] : [];
        const res = await query<TopBuyerCustomer>(sql, params);
        return res.rows;
      } catch (err) {
        // Fallback
      }
    }

    return [];
  }
}

export const dashboardRepository = new DashboardRepository();
