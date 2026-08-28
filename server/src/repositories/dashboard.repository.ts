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
        let custFilter = '';
        let invFilter = '';
        let pmtFilter = '';
        let txFilter = '';

        if (actor && (actor.role === 'EMPLOYEE' || actor.role === 'COLLECTOR')) {
          custFilter = `WHERE assigned_employee_id = ${actor.userId}`;
          invFilter = `WHERE customer_id IN (SELECT id FROM customers WHERE assigned_employee_id = ${actor.userId})`;
          pmtFilter = `WHERE customer_id IN (SELECT id FROM customers WHERE assigned_employee_id = ${actor.userId})`;
          txFilter = `WHERE customer_id IN (SELECT id FROM customers WHERE assigned_employee_id = ${actor.userId})`;
        }

        const custResult = await query<{ total: string; active: string }>(`
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'ACTIVE') as active
          FROM customers ${custFilter};
        `);

        const invResult = await query<{ total_sales: string }>(`
          SELECT COALESCE(SUM(total), 0) as total_sales FROM invoices ${invFilter};
        `);

        const pmtResult = await query<{ total_payments: string }>(`
          SELECT COALESCE(SUM(amount), 0) as total_payments FROM payments ${pmtFilter};
        `);

        const txResult = await query<{ balance: string }>(`
          SELECT COALESCE(SUM(debit) - SUM(credit), 0) as balance FROM account_transactions ${txFilter};
        `);

        const appResult = await query<{ pending: string }>(`
          SELECT COUNT(*) as pending FROM approval_records WHERE status = 'PENDING';
        `);

        const totalCustomers = parseInt(custResult.rows[0]?.total || '0', 10);
        const activeCustomers = parseInt(custResult.rows[0]?.active || '0', 10);
        const totalSales = parseFloat(invResult.rows[0]?.total_sales || '0');
        const totalCollections = parseFloat(pmtResult.rows[0]?.total_payments || '0');
        const totalOutstandingBalance = parseFloat(txResult.rows[0]?.balance || '0');
        const pendingApprovalsCount = parseInt(appResult.rows[0]?.pending || '0', 10);

        return {
          totalCustomers,
          activeCustomers,
          totalSales,
          totalCollections,
          totalOutstandingBalance,
          pendingApprovalsCount,
        };
      } catch (err) {
        // Fallback
      }
    }

    const custData = await customerRepository.findAll();
    const approvals = await approvalRepository.findAll('PENDING');

    let totalSales = 0;
    for (const inv of memoryInvoices) {
      totalSales += inv.total;
    }

    let totalCollections = 0;
    for (const pmt of memoryPayments) {
      totalCollections += pmt.amount;
    }

    let totalBalance = 0;
    for (const tx of memoryAccountTransactions) {
      totalBalance += tx.debit - tx.credit;
    }

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
        let filter = '';
        if (actor && (actor.role === 'EMPLOYEE' || actor.role === 'COLLECTOR')) {
          filter = `AND c.assigned_employee_id = ${actor.userId}`;
        }

        const sql = `
          SELECT 
            c.id as customer_id,
            c.customer_code,
            c.name as customer_name,
            c.trade_name,
            c.phone,
            COALESCE(SUM(i.total), 0)::numeric as total_sales,
            COUNT(i.id)::int as invoice_count,
            COALESCE(AVG(i.total), 0)::numeric as avg_invoice,
            COALESCE(tx.balance, 0)::numeric as current_balance
          FROM customers c
          JOIN invoices i ON i.customer_id = c.id
          LEFT JOIN (
            SELECT customer_id, SUM(debit) - SUM(credit) as balance
            FROM account_transactions
            GROUP BY customer_id
          ) tx ON tx.customer_id = c.id
          WHERE 1=1 ${filter}
          GROUP BY c.id, c.customer_code, c.name, c.trade_name, c.phone, tx.balance
          ORDER BY total_sales DESC
          LIMIT 5;
        `;
        const res = await query<TopBuyerCustomer>(sql);
        return res.rows;
      } catch (err) {
        // Fallback
      }
    }

    return [];
  }
}

export const dashboardRepository = new DashboardRepository();
