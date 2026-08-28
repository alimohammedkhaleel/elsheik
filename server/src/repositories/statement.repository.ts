import { query } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import {
  AccountTransaction,
  CustomerAccountStatementResponse,
  MonthlyStatementResponse,
} from '../types/statement.types';
import { customerRepository } from './customer.repository';
import { memoryAccountTransactions } from './invoice.repository';

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export class StatementRepository {
  async getStatement(
    customerId: number,
    startDate?: string,
    endDate?: string,
    transactionType?: string
  ): Promise<CustomerAccountStatementResponse | null> {
    const customer = await customerRepository.findById(customerId);
    if (!customer) return null;

    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        // 1. Calculate Opening Balance before startDate
        let openingBalance = 0;
        if (startDate) {
          const obRes = await query<{ opening_balance: string }>(
            `SELECT COALESCE(SUM(debit) - SUM(credit), 0) as opening_balance
             FROM account_transactions
             WHERE customer_id = $1 AND transaction_date < $2;`,
            [customerId, startDate]
          );
          openingBalance = Number(obRes.rows[0]?.opening_balance || 0);
        }

        // 2. Fetch Period Transactions
        let sql = `
          SELECT *
          FROM account_transactions
          WHERE customer_id = $1
        `;
        const params: unknown[] = [customerId];
        let pIndex = 2;

        if (startDate) {
          sql += ` AND transaction_date >= $${pIndex++}`;
          params.push(startDate);
        }
        if (endDate) {
          sql += ` AND transaction_date <= $${pIndex++}`;
          params.push(endDate);
        }
        if (transactionType) {
          sql += ` AND transaction_type = $${pIndex++}`;
          params.push(transactionType);
        }

        sql += ` ORDER BY transaction_date ASC, id ASC;`;

        const txRes = await query<AccountTransaction>(sql, params);

        // 3. Compute running balance in chronological order
        let currentRunning = openingBalance;
        let totalDebit = 0;
        let totalCredit = 0;

        const transactions = txRes.rows.map((tx) => {
          const debit = Number(tx.debit);
          const credit = Number(tx.credit);
          totalDebit += debit;
          totalCredit += credit;
          currentRunning = currentRunning + debit - credit;

          return {
            ...tx,
            debit,
            credit,
            running_balance: currentRunning,
          };
        });

        const closingBalance = currentRunning;

        return {
          customer: {
            id: customer.id,
            customer_code: customer.customer_code,
            name: customer.name,
            trade_name: customer.trade_name,
            phone: customer.phone,
            assigned_employee_name: customer.assigned_employee_name,
          },
          period: {
            start_date: startDate || null,
            end_date: endDate || null,
          },
          summary: {
            opening_balance: openingBalance,
            total_debit: totalDebit,
            total_credit: totalCredit,
            closing_balance: closingBalance,
            transaction_count: transactions.length,
          },
          transactions,
        };
      } catch (err) {
        // Fallback
      }
    }

    // Memory Store Calculation
    let openingBalance = 0;
    const customerTxs = memoryAccountTransactions
      .filter((t) => t.customer_id === customerId)
      .sort((a, b) => (a.transaction_date > b.transaction_date ? 1 : -1));

    if (startDate) {
      for (const t of customerTxs) {
        if (t.transaction_date < startDate) {
          openingBalance += t.debit - t.credit;
        }
      }
    }

    let running = openingBalance;
    let totalDebit = 0;
    let totalCredit = 0;

    const filtered = customerTxs.filter((t) => {
      if (startDate && t.transaction_date < startDate) return false;
      if (endDate && t.transaction_date > endDate) return false;
      if (transactionType && t.transaction_type !== transactionType) return false;
      return true;
    });

    const transactions: AccountTransaction[] = filtered.map((t) => {
      totalDebit += t.debit;
      totalCredit += t.credit;
      running += t.debit - t.credit;
      return {
        ...t,
        running_balance: running,
      };
    });

    return {
      customer: {
        id: customer.id,
        customer_code: customer.customer_code,
        name: customer.name,
        trade_name: customer.trade_name,
        phone: customer.phone,
        assigned_employee_name: customer.assigned_employee_name,
      },
      period: {
        start_date: startDate || null,
        end_date: endDate || null,
      },
      summary: {
        opening_balance: openingBalance,
        total_debit: totalDebit,
        total_credit: totalCredit,
        closing_balance: running,
        transaction_count: transactions.length,
      },
      transactions,
    };
  }

  async getMonthlyStatement(
    customerId: number,
    year: number,
    month: number
  ): Promise<MonthlyStatementResponse | null> {
    const customer = await customerRepository.findById(customerId);
    if (!customer) return null;

    const mStr = String(month).padStart(2, '0');
    const startDate = `${year}-${mStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`;

    const statement = await this.getStatement(customerId, startDate, endDate);
    if (!statement) return null;

    let totalSales = 0;
    let totalPayments = 0;
    let returns = 0;
    let discounts = 0;
    let adjustments = 0;

    for (const tx of statement.transactions) {
      if (tx.transaction_type === 'INVOICE') totalSales += tx.debit;
      else if (tx.transaction_type === 'PAYMENT') totalPayments += tx.credit;
      else if (tx.transaction_type === 'RETURN') returns += tx.credit;
      else if (tx.transaction_type === 'DISCOUNT') discounts += tx.credit;
      else if (tx.transaction_type === 'ADJUSTMENT') adjustments += (tx.debit - tx.credit);
    }

    return {
      customer: {
        id: customer.id,
        customer_code: customer.customer_code,
        name: customer.name,
      },
      year,
      month,
      month_name_ar: ARABIC_MONTHS[month - 1] || `شهر ${month}`,
      opening_balance: statement.summary.opening_balance,
      total_sales: totalSales,
      total_payments: totalPayments,
      returns,
      discounts,
      adjustments,
      closing_balance: statement.summary.closing_balance,
      transactions: statement.transactions,
    };
  }
}

export const statementRepository = new StatementRepository();
