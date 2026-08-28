import { query, getClient } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import { Payment, CreatePaymentInput, PaymentFilterOptions } from '../types/payment.types';
import { UserRole } from '../types/user.types';
import { memoryAccountTransactions, memoryInvoices } from './invoice.repository';
import { memoryUsers } from './user.repository';
import { memoryCustomers } from './customer.repository';

export const memoryPayments: Payment[] = [];

export class PaymentRepository {
  async findAll(
    options?: PaymentFilterOptions,
    actor?: { role: UserRole; userId: number }
  ): Promise<{ data: Payment[]; total: number }> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        let sql = `
          SELECT 
            p.*,
            c.name as customer_name,
            c.customer_code,
            i.invoice_number,
            u.full_name as collected_by_name
          FROM payments p
          JOIN customers c ON p.customer_id = c.id
          LEFT JOIN invoices i ON p.invoice_id = i.id
          LEFT JOIN users u ON p.collected_by = u.id
          WHERE 1=1
        `;

        const params: unknown[] = [];
        let pIndex = 1;

        if (options?.collected_by) {
          sql += ` AND p.collected_by = $${pIndex}`;
          params.push(options.collected_by);
          pIndex++;
        }

        if (options?.customer_id) {
          sql += ` AND p.customer_id = $${pIndex}`;
          params.push(options.customer_id);
          pIndex++;
        }

        if (options?.invoice_id) {
          sql += ` AND p.invoice_id = $${pIndex}`;
          params.push(options.invoice_id);
          pIndex++;
        }

        if (options?.payment_method) {
          sql += ` AND p.payment_method = $${pIndex}`;
          params.push(options.payment_method);
          pIndex++;
        }

        if (options?.start_date) {
          sql += ` AND p.payment_date >= $${pIndex}`;
          params.push(options.start_date);
          pIndex++;
        }

        if (options?.end_date) {
          sql += ` AND p.payment_date <= $${pIndex}`;
          params.push(options.end_date);
          pIndex++;
        }

        if (options?.search) {
          sql += ` AND (LOWER(p.receipt_number) LIKE $${pIndex} OR LOWER(c.name) LIKE $${pIndex} OR LOWER(c.customer_code) LIKE $${pIndex})`;
          params.push(`%${options.search.toLowerCase()}%`);
          pIndex++;
        }

        sql += ` ORDER BY p.payment_date DESC, p.id DESC`;

        const page = options?.page || 1;
        const limit = options?.limit || 50;
        const offset = (page - 1) * limit;

        sql += ` LIMIT $${pIndex} OFFSET $${pIndex + 1}`;
        params.push(limit, offset);

        const res = await query<Payment>(sql, params);
        return { data: res.rows, total: res.rows.length };
      } catch (err) {
        // Fallback
      }
    }

    let filtered = memoryPayments.filter((pmt) => {
      if (options?.customer_id && pmt.customer_id !== options.customer_id) return false;
      if (options?.invoice_id && pmt.invoice_id !== options.invoice_id) return false;
      if (options?.collected_by && pmt.collected_by !== options.collected_by) return false;
      if (options?.payment_method && pmt.payment_method !== options.payment_method) return false;
      if (options?.search) {
        const s = options.search.toLowerCase();
        const match =
          pmt.receipt_number.toLowerCase().includes(s) ||
          (pmt.customer_name && pmt.customer_name.toLowerCase().includes(s));
        if (!match) return false;
      }
      return true;
    });

    return { data: filtered, total: filtered.length };
  }

  async findById(id: number): Promise<Payment | null> {
    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      try {
        const sql = `
          SELECT 
            p.*,
            c.name as customer_name,
            c.customer_code,
            i.invoice_number,
            u.full_name as collected_by_name
          FROM payments p
          JOIN customers c ON p.customer_id = c.id
          LEFT JOIN invoices i ON p.invoice_id = i.id
          LEFT JOIN users u ON p.collected_by = u.id
          WHERE p.id = $1
          LIMIT 1;
        `;
        const res = await query<Payment>(sql, [id]);
        return res.rows[0] || null;
      } catch {
        // Fallback
      }
    }
    return memoryPayments.find((p) => p.id === id) || null;
  }

  async findByReceipt(receiptNumber: string): Promise<Payment | null> {
    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      try {
        const res = await query<Payment>(`SELECT * FROM payments WHERE receipt_number = $1 LIMIT 1`, [receiptNumber]);
        return res.rows[0] || null;
      } catch {
        // Fallback
      }
    }
    return memoryPayments.find((p) => p.receipt_number === receiptNumber) || null;
  }

  /**
   * ATOMIC Database Transaction: Create Payment + Allocations + Account Transaction + Update Invoices
   */
  async create(input: CreatePaymentInput, createdBy?: number): Promise<Payment> {
    const receiptNumber = input.receipt_number || `RCT-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    const paymentDate = input.payment_date || new Date().toISOString().split('T')[0];
    const amount = Number(input.amount);
    const method = input.payment_method || 'CASH';

    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      const client = await getClient();
      try {
        await client.query('BEGIN');

        // 1. Insert Payment
        const pmtRes = await client.query<Payment>(
          `INSERT INTO payments (
            receipt_number, customer_id, invoice_id, payment_date,
            amount, payment_method, collected_by, notes, created_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          ) RETURNING *;`,
          [
            receiptNumber,
            input.customer_id,
            input.invoice_id || null,
            paymentDate,
            amount,
            method,
            input.collected_by || null,
            input.notes || null,
            createdBy || null,
          ]
        );

        const createdPayment = pmtRes.rows[0];

        // 2. Insert Account Transaction (Debit = 0, Credit = Payment Amount)
        await client.query(
          `INSERT INTO account_transactions (
            customer_id, transaction_date, transaction_type,
            reference_type, reference_id, description, debit, credit
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
          [
            input.customer_id,
            paymentDate,
            'PAYMENT',
            'PAYMENT',
            createdPayment.id,
            `سند قبض وتحصيل رقم ${receiptNumber}`,
            0,
            amount,
          ]
        );

        // 3. Allocate Payment to Invoice if specified or automatically to unpaid invoices
        if (input.invoice_id) {
          await client.query(
            `INSERT INTO payment_allocations (payment_id, invoice_id, amount) VALUES ($1, $2, $3);`,
            [createdPayment.id, input.invoice_id, amount]
          );

          // Check if invoice is fully or partially paid
          const invCheck = await client.query<{ total: string; paid: string }>(
            `SELECT i.total, COALESCE(SUM(pa.amount), 0) as paid
             FROM invoices i
             LEFT JOIN payment_allocations pa ON pa.invoice_id = i.id
             WHERE i.id = $1
             GROUP BY i.id;`,
            [input.invoice_id]
          );

          if (invCheck.rows[0]) {
            const invTotal = Number(invCheck.rows[0].total);
            const totalPaid = Number(invCheck.rows[0].paid);
            const newStatus = totalPaid >= invTotal ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
            await client.query(`UPDATE invoices SET payment_status = $1 WHERE id = $2;`, [newStatus, input.invoice_id]);
          }
        }

        await client.query('COMMIT');
        client.release();

        return createdPayment;
      } catch (err) {
        await client.query('ROLLBACK');
        client.release();
        throw err;
      }
    }

    // Memory Store
    const newId = memoryPayments.length + 1;
    
    let customerName: string | undefined;
    let customerCode: string | undefined;
    if (input.customer_id) {
      const cust = memoryCustomers.find(c => c.id === input.customer_id);
      if (cust) {
        customerName = cust.name;
        customerCode = cust.customer_code;
      }
    }

    // Determine default collector if not passed
    let effectiveCollectorId = input.collected_by || null;
    if (!effectiveCollectorId && input.customer_id) {
      const targetCust = memoryCustomers.find(c => c.id === input.customer_id);
      if (targetCust && targetCust.assigned_employee_id) {
        effectiveCollectorId = targetCust.assigned_employee_id;
      } else if (createdBy) {
        effectiveCollectorId = createdBy;
      }
    }

    let collectedByName: string | undefined;
    if (effectiveCollectorId) {
      const emp = memoryUsers.find(u => u.id === effectiveCollectorId);
      if (emp) {
        collectedByName = emp.full_name;
      }
    }

    const newPayment: Payment = {
      id: newId,
      receipt_number: receiptNumber,
      customer_id: input.customer_id,
      customer_name: customerName,
      customer_code: customerCode,
      invoice_id: input.invoice_id || null,
      payment_date: paymentDate,
      amount,
      payment_method: method,
      collected_by: effectiveCollectorId,
      collected_by_name: collectedByName,
      notes: input.notes || null,
      created_by: createdBy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryPayments.unshift(newPayment);

    // Insert Account Transaction
    memoryAccountTransactions.push({
      id: memoryAccountTransactions.length + 1,
      customer_id: input.customer_id,
      transaction_date: paymentDate,
      transaction_type: 'PAYMENT',
      reference_type: 'PAYMENT',
      reference_id: newId,
      description: `سند قبض وتحصيل رقم ${receiptNumber}`,
      debit: 0,
      credit: amount,
      created_at: new Date().toISOString(),
    });

    if (input.invoice_id) {
      const inv = memoryInvoices.find((i) => i.id === input.invoice_id);
      if (inv) {
        inv.paid_amount = (inv.paid_amount || 0) + amount;
        inv.remaining_amount = Math.max(0, inv.total - inv.paid_amount);
        inv.payment_status = inv.remaining_amount <= 0 ? 'PAID' : 'PARTIALLY_PAID';
      }
    }

    return newPayment;
  }

  async update(id: number, input: Partial<CreatePaymentInput>): Promise<Payment | null> {
    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      try {
        const client = await getClient();
        await client.query('BEGIN');
        const existingRes = await client.query<Payment>('SELECT * FROM payments WHERE id = $1', [id]);
        if (!existingRes.rows[0]) {
          await client.query('ROLLBACK');
          client.release();
          return null;
        }
        const existing = existingRes.rows[0];
        const newAmount = input.amount !== undefined ? Number(input.amount) : existing.amount;
        const newMethod = input.payment_method || existing.payment_method;
        const newDate = input.payment_date || existing.payment_date;
        const newNotes = input.notes !== undefined ? input.notes : existing.notes;
        const newCollector = input.collected_by !== undefined ? input.collected_by : existing.collected_by;

        const updateRes = await client.query<Payment>(
          `UPDATE payments 
           SET amount = $1, payment_method = $2, payment_date = $3, notes = $4, collected_by = $5, updated_at = NOW()
           WHERE id = $6 RETURNING *`,
          [newAmount, newMethod, newDate, newNotes, newCollector, id]
        );

        // Update account transaction
        await client.query(
          `UPDATE account_transactions SET credit = $1, transaction_date = $2 WHERE reference_type = 'PAYMENT' AND reference_id = $3`,
          [newAmount, newDate, id]
        );

        await client.query('COMMIT');
        client.release();
        return this.findById(id);
      } catch (err) {
        // Fallback
      }
    }

    const pmtIdx = memoryPayments.findIndex((p) => p.id === id);
    if (pmtIdx === -1) return null;
    const existing = memoryPayments[pmtIdx];

    const oldAmount = existing.amount;
    const newAmount = input.amount !== undefined ? Number(input.amount) : oldAmount;
    
    let collName = existing.collected_by_name;
    if (input.collected_by) {
      const emp = memoryUsers.find((u) => u.id === input.collected_by);
      if (emp) collName = emp.full_name;
    }

    const updatedPmt: Payment = {
      ...existing,
      amount: newAmount,
      payment_method: input.payment_method || existing.payment_method,
      payment_date: input.payment_date || existing.payment_date,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      collected_by: input.collected_by !== undefined ? input.collected_by : existing.collected_by,
      collected_by_name: collName,
      updated_at: new Date().toISOString(),
    };

    memoryPayments[pmtIdx] = updatedPmt;

    // Update account transaction in memory
    const tx = memoryAccountTransactions.find(t => t.reference_type === 'PAYMENT' && t.reference_id === id);
    if (tx) {
      tx.credit = newAmount;
      tx.transaction_date = updatedPmt.payment_date;
    }

    // Update invoice status if linked
    if (existing.invoice_id) {
      const inv = memoryInvoices.find(i => i.id === existing.invoice_id);
      if (inv) {
        inv.paid_amount = Math.max(0, (inv.paid_amount || 0) - oldAmount + newAmount);
        inv.remaining_amount = Math.max(0, inv.total - inv.paid_amount);
        inv.payment_status = inv.remaining_amount <= 0 ? 'PAID' : inv.paid_amount > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
      }
    }

    return updatedPmt;
  }

  async delete(id: number): Promise<boolean> {
    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      try {
        const client = await getClient();
        await client.query('BEGIN');
        const pmtRes = await client.query<Payment>('SELECT * FROM payments WHERE id = $1', [id]);
        if (!pmtRes.rows[0]) {
          await client.query('ROLLBACK');
          client.release();
          return false;
        }
        const pmt = pmtRes.rows[0];

        // 1. Delete payment allocations and recalculate invoice
        if (pmt.invoice_id) {
          await client.query('DELETE FROM payment_allocations WHERE payment_id = $1', [id]);
          const invCheck = await client.query<{ total: string; paid: string }>(
            `SELECT i.total, COALESCE(SUM(pa.amount), 0) as paid
             FROM invoices i
             LEFT JOIN payment_allocations pa ON pa.invoice_id = i.id
             WHERE i.id = $1
             GROUP BY i.id;`,
            [pmt.invoice_id]
          );
          if (invCheck.rows[0]) {
            const invTotal = Number(invCheck.rows[0].total);
            const totalPaid = Number(invCheck.rows[0].paid);
            const newStatus = totalPaid >= invTotal ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
            await client.query(`UPDATE invoices SET payment_status = $1 WHERE id = $2;`, [newStatus, pmt.invoice_id]);
          }
        }

        // 2. Delete account transactions
        await client.query(`DELETE FROM account_transactions WHERE reference_type = 'PAYMENT' AND reference_id = $1`, [id]);

        // 3. Delete payment
        await client.query('DELETE FROM payments WHERE id = $1', [id]);

        await client.query('COMMIT');
        client.release();
        return true;
      } catch (err) {
        // Fallback
      }
    }

    const idx = memoryPayments.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const pmt = memoryPayments[idx];

    // Remove from memoryPayments
    memoryPayments.splice(idx, 1);

    // Remove corresponding account transaction
    const txIdx = memoryAccountTransactions.findIndex(t => t.reference_type === 'PAYMENT' && t.reference_id === id);
    if (txIdx !== -1) {
      memoryAccountTransactions.splice(txIdx, 1);
    }

    // Revert invoice paid amount
    if (pmt.invoice_id) {
      const inv = memoryInvoices.find(i => i.id === pmt.invoice_id);
      if (inv) {
        inv.paid_amount = Math.max(0, (inv.paid_amount || 0) - pmt.amount);
        inv.remaining_amount = Math.max(0, inv.total - inv.paid_amount);
        inv.payment_status = inv.remaining_amount <= 0 ? 'PAID' : inv.paid_amount > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
      }
    }

    return true;
  }
}

export const paymentRepository = new PaymentRepository();
