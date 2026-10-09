import { query, withTransaction } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import { Payment, CreatePaymentInput, PaymentFilterOptions } from '../types/payment.types';
import { UserRole } from '../types/user.types';
import { roundMoney } from '../utils/money';
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

        const countClauses: string[] = ['1=1'];
        const countParams: unknown[] = [];
        let cpIndex = 1;

        const dataParams: unknown[] = [];
        let dpIndex = 1;

        if (options?.collected_by) {
          sql += ` AND p.collected_by = $${dpIndex}`;
          dataParams.push(options.collected_by);
          dpIndex++;

          countClauses.push(`p.collected_by = $${cpIndex}`);
          countParams.push(options.collected_by);
          cpIndex++;
        }

        if (options?.customer_id) {
          sql += ` AND p.customer_id = $${dpIndex}`;
          dataParams.push(options.customer_id);
          dpIndex++;

          countClauses.push(`p.customer_id = $${cpIndex}`);
          countParams.push(options.customer_id);
          cpIndex++;
        }

        if (options?.invoice_id) {
          sql += ` AND p.invoice_id = $${dpIndex}`;
          dataParams.push(options.invoice_id);
          dpIndex++;

          countClauses.push(`p.invoice_id = $${cpIndex}`);
          countParams.push(options.invoice_id);
          cpIndex++;
        }

        if (options?.payment_method) {
          sql += ` AND p.payment_method = $${dpIndex}`;
          dataParams.push(options.payment_method);
          dpIndex++;

          countClauses.push(`p.payment_method = $${cpIndex}`);
          countParams.push(options.payment_method);
          cpIndex++;
        }

        if (options?.start_date) {
          sql += ` AND p.payment_date >= $${dpIndex}`;
          dataParams.push(options.start_date);
          dpIndex++;

          countClauses.push(`p.payment_date >= $${cpIndex}`);
          countParams.push(options.start_date);
          cpIndex++;
        }

        if (options?.end_date) {
          sql += ` AND p.payment_date <= $${dpIndex}`;
          dataParams.push(options.end_date);
          dpIndex++;

          countClauses.push(`p.payment_date <= $${cpIndex}`);
          countParams.push(options.end_date);
          cpIndex++;
        }

        if (options?.search) {
          const searchPattern = `%${options.search.trim().toLowerCase()}%`;
          sql += ` AND (LOWER(p.receipt_number) LIKE $${dpIndex} OR LOWER(c.name) LIKE $${dpIndex} OR LOWER(c.customer_code) LIKE $${dpIndex})`;
          dataParams.push(searchPattern);
          dpIndex++;

          countClauses.push(`(LOWER(p.receipt_number) LIKE $${cpIndex} OR LOWER(c.name) LIKE $${cpIndex} OR LOWER(c.customer_code) LIKE $${cpIndex})`);
          countParams.push(searchPattern);
          cpIndex++;
        }

        sql += ` ORDER BY p.payment_date DESC, p.id DESC`;

        const page = Math.max(1, options?.page || 1);
        const limit = Math.max(1, Math.min(200, options?.limit || 50));
        const offset = (page - 1) * limit;

        sql += ` LIMIT $${dpIndex} OFFSET $${dpIndex + 1}`;
        dataParams.push(limit, offset);

        const res = await query<Payment>(sql, dataParams);

        const countSql = `
          SELECT COUNT(p.id) as total 
          FROM payments p 
          JOIN customers c ON p.customer_id = c.id 
          WHERE ${countClauses.join(' AND ')}
        `;
        const countRes = await query<{ total: string }>(countSql, countParams);
        const total = countRes.rows[0] ? parseInt(countRes.rows[0].total, 10) : res.rows.length;

        return { data: res.rows, total };
      } catch (err) {
        if (process.env.NODE_ENV === 'production') {
          throw err;
        }
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

    const total = filtered.length;
    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, Math.min(200, options?.limit || 50));
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return { data: paginated, total };
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
      } catch (err) {
        if (process.env.NODE_ENV === 'production') {
          throw err;
        }
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
      } catch (err) {
        if (process.env.NODE_ENV === 'production') {
          throw err;
        }
      }
    }
    return memoryPayments.find((p) => p.receipt_number === receiptNumber) || null;
  }

  async findByIdempotencyKey(key: string): Promise<Payment | null> {
    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      try {
        const res = await query<Payment>(`SELECT * FROM payments WHERE idempotency_key = $1 LIMIT 1`, [key]);
        if (res.rows[0]) {
          return this.findById(res.rows[0].id);
        }
      } catch {
        // Idempotency check fallback
      }
    }
    const memPmt = memoryPayments.find((p) => p.idempotency_key === key);
    return memPmt ? { ...memPmt } : null;
  }

  /**
   * ATOMIC Database Transaction: Create Payment + Allocations + Account Transaction + Update Invoices
   */
  async create(input: CreatePaymentInput, createdBy?: number): Promise<Payment> {
    const receiptNumber = input.receipt_number || `RCT-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    const paymentDate = input.payment_date || new Date().toISOString().split('T')[0];
    const amount = roundMoney(input.amount);
    const method = input.payment_method || 'CASH';

    if (input.idempotency_key) {
      const existing = await this.findByIdempotencyKey(input.idempotency_key);
      if (existing) {
        if (
          existing.customer_id !== input.customer_id ||
          roundMoney(existing.amount) !== roundMoney(amount)
        ) {
          throw new Error('IDEMPOTENCY_CONFLICT: Idempotency key reused with materially different payment data');
        }
        return existing;
      }
    }

    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        return await withTransaction(async (client) => {
          // 0. If invoice specified, lock invoice row and validate customer ownership
          if (input.invoice_id) {
            const invLock = await client.query<{ id: number; customer_id: number; total: string; payment_status: string }>(
              `SELECT id, customer_id, total, payment_status FROM invoices WHERE id = $1 FOR UPDATE;`,
              [input.invoice_id]
            );
            if (!invLock.rows[0]) {
              throw new Error('INVOICE_NOT_FOUND: Invoice not found');
            }
            if (invLock.rows[0].customer_id !== input.customer_id) {
              throw new Error('INVOICE_CUSTOMER_MISMATCH: Invoice does not belong to this customer');
            }
          }

          // 1. Insert Payment
          const pmtRes = await client.query<Payment>(
            `INSERT INTO payments (
              receipt_number, idempotency_key, customer_id, invoice_id, payment_date,
              amount, payment_method, collected_by, notes, created_by
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            ) RETURNING *;`,
            [
              receiptNumber,
              input.idempotency_key || null,
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

          // 3. Allocate Payment to Invoices (Specific invoice or FIFO auto-allocation for general payments)
          if (input.invoice_id) {
            await client.query(
              `INSERT INTO payment_allocations (payment_id, invoice_id, amount) VALUES ($1, $2, $3);`,
              [createdPayment.id, input.invoice_id, amount]
            );

            // Authoritative recalculation of invoice status from payment_allocations
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
              await client.query(`UPDATE invoices SET payment_status = $1, updated_at = NOW() WHERE id = $2;`, [newStatus, input.invoice_id]);
            }
            // General payment: Auto-allocate FIFO to open unpaid/partially-paid invoices for this customer
            const openInvs = await client.query<{ id: number; total: string }>(
              `SELECT id, total
               FROM invoices
               WHERE customer_id = $1 AND payment_status != 'PAID'
               ORDER BY invoice_date ASC, id ASC
               FOR UPDATE;`,
              [input.customer_id]
            );

            let unallocatedAmount = amount;
            for (const inv of openInvs.rows) {
              if (unallocatedAmount <= 0) break;
              const invTotal = Number(inv.total);
              const paidRes = await client.query<{ paid: string }>(
                `SELECT COALESCE(SUM(amount), 0) as paid FROM payment_allocations WHERE invoice_id = $1`,
                [inv.id]
              );
              const alreadyPaid = Number(paidRes.rows[0]?.paid || 0);
              const needed = Math.max(0, invTotal - alreadyPaid);
              if (needed > 0) {
                const allocAmount = Math.min(needed, unallocatedAmount);
                await client.query(
                  `INSERT INTO payment_allocations (payment_id, invoice_id, amount) VALUES ($1, $2, $3);`,
                  [createdPayment.id, inv.id, allocAmount]
                );
                const newPaid = alreadyPaid + allocAmount;
                const newStatus = newPaid >= invTotal ? 'PAID' : 'PARTIALLY_PAID';
                await client.query(`UPDATE invoices SET payment_status = $1, updated_at = NOW() WHERE id = $2;`, [newStatus, inv.id]);
                unallocatedAmount = Math.max(0, unallocatedAmount - allocAmount);
              }
            }
          }

          // Fetch full joined payment record directly on this transaction connection
          const fullRes = await client.query<Payment>(
            `SELECT 
              p.*,
              c.name as customer_name,
              c.customer_code,
              i.invoice_number,
              u.full_name as collected_by_name
            FROM payments p
            JOIN customers c ON p.customer_id = c.id
            LEFT JOIN invoices i ON p.invoice_id = i.id
            LEFT JOIN users u ON p.collected_by = u.id
            WHERE p.id = $1;`,
            [createdPayment.id]
          );

          return fullRes.rows[0] || createdPayment;
        });
      } catch (err: any) {
        if (
          input.idempotency_key &&
          (err.code === '23505' ||
            err.message?.toLowerCase().includes('idempotency') ||
            err.message?.toLowerCase().includes('unique'))
        ) {
          const existing = await this.findByIdempotencyKey(input.idempotency_key);
          if (existing) {
            if (
              existing.customer_id !== input.customer_id ||
              roundMoney(existing.amount) !== roundMoney(amount)
            ) {
              throw new Error('IDEMPOTENCY_CONFLICT: Idempotency key reused with materially different payment data');
            }
            return existing;
          }
        }
        throw err;
      }
    }

    // In-memory Store for tests
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

    let effectiveCollectorId = input.collected_by || null;
    let collectorName: string | undefined;

    if (!effectiveCollectorId && input.customer_id) {
      const cust = memoryCustomers.find(c => c.id === input.customer_id);
      if (cust && cust.assigned_employee_id) {
        effectiveCollectorId = cust.assigned_employee_id;
      }
    }

    if (effectiveCollectorId) {
      const emp = memoryUsers.find(u => u.id === effectiveCollectorId);
      if (emp) collectorName = emp.full_name;
    }

    let invNumber: string | undefined;
    if (input.invoice_id) {
      const inv = memoryInvoices.find(i => i.id === input.invoice_id);
      if (inv) invNumber = inv.invoice_number;
    }

    const newPayment: Payment = {
      id: newId,
      receipt_number: receiptNumber,
      idempotency_key: input.idempotency_key || null,
      customer_id: input.customer_id,
      customer_name: customerName,
      customer_code: customerCode,
      invoice_id: input.invoice_id || null,
      invoice_number: invNumber,
      payment_date: paymentDate,
      amount,
      payment_method: method,
      collected_by: effectiveCollectorId,
      collected_by_name: collectorName,
      notes: input.notes || null,
      created_by: createdBy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryPayments.unshift(newPayment);

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
      const invIdx = memoryInvoices.findIndex((i) => i.id === input.invoice_id);
      if (invIdx !== -1) {
        const inv = memoryInvoices[invIdx];
        const totalPaid = memoryPayments
          .filter((p) => p.invoice_id === input.invoice_id)
          .reduce((sum, p) => roundMoney(sum + p.amount), 0);

        inv.paid_amount = totalPaid;
        inv.remaining_amount = Math.max(0, roundMoney(inv.total - totalPaid));
        if (totalPaid >= inv.total) {
          inv.payment_status = 'PAID';
        } else if (totalPaid > 0) {
          inv.payment_status = 'PARTIALLY_PAID';
        } else {
          inv.payment_status = 'UNPAID';
        }
      }
    }

    return newPayment;
  }

  async update(id: number, input: Partial<CreatePaymentInput>): Promise<Payment | null> {
    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      return withTransaction(async (client) => {
        // 1. Lock payment row
        const existingRes = await client.query<Payment>('SELECT * FROM payments WHERE id = $1 FOR UPDATE', [id]);
        if (!existingRes.rows[0]) {
          return null;
        }
        const existing = existingRes.rows[0];
        const newAmount = input.amount !== undefined ? roundMoney(input.amount) : roundMoney(existing.amount);
        const newMethod = input.payment_method || existing.payment_method;
        const newDate = input.payment_date || existing.payment_date;
        const newNotes = input.notes !== undefined ? input.notes : existing.notes;
        const newCollector = input.collected_by !== undefined ? input.collected_by : existing.collected_by;

        if (newAmount <= 0) {
          throw new Error('INVALID_AMOUNT: Payment amount must be positive');
        }

        // 2. Update payments table
        await client.query(
          `UPDATE payments 
           SET amount = $1, payment_method = $2, payment_date = $3, notes = $4, collected_by = $5, updated_at = NOW()
           WHERE id = $6`,
          [newAmount, newMethod, newDate, newNotes, newCollector, id]
        );

        // 3. Update account_transactions ledger entry
        await client.query(
          `UPDATE account_transactions 
           SET credit = $1, transaction_date = $2 
           WHERE reference_type = 'PAYMENT' AND reference_id = $3`,
          [newAmount, newDate, id]
        );

        // 4. Update payment_allocations and recalculate invoice status if allocated
        if (existing.invoice_id) {
          const invRes = await client.query<{ id: number; total: string }>(
            `SELECT id, total FROM invoices WHERE id = $1 FOR UPDATE`,
            [existing.invoice_id]
          );

          if (invRes.rows[0]) {
            await client.query(
              `UPDATE payment_allocations SET amount = $1 WHERE payment_id = $2 AND invoice_id = $3`,
              [newAmount, id, existing.invoice_id]
            );

            const allocSumRes = await client.query<{ paid: string }>(
              `SELECT COALESCE(SUM(amount), 0) as paid FROM payment_allocations WHERE invoice_id = $1`,
              [existing.invoice_id]
            );

            const totalPaid = Number(allocSumRes.rows[0]?.paid || 0);
            const invTotal = Number(invRes.rows[0].total);
            const newStatus = totalPaid >= invTotal ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';

            await client.query(
              `UPDATE invoices SET payment_status = $1, updated_at = NOW() WHERE id = $2`,
              [newStatus, existing.invoice_id]
            );
          }
        }

        // 5. Fetch and return directly on this transaction client
        const updatedRes = await client.query<Payment>(
          `SELECT 
            p.*,
            c.name as customer_name,
            c.customer_code,
            i.invoice_number,
            u.full_name as collected_by_name
          FROM payments p
          JOIN customers c ON p.customer_id = c.id
          LEFT JOIN invoices i ON p.invoice_id = i.id
          LEFT JOIN users u ON p.collected_by = u.id
          WHERE p.id = $1`,
          [id]
        );

        return updatedRes.rows[0] || null;
      });
    }

    const pmtIdx = memoryPayments.findIndex((p) => p.id === id);
    if (pmtIdx === -1) return null;
    const existing = memoryPayments[pmtIdx];

    const oldAmount = existing.amount;
    const newAmount = input.amount !== undefined ? roundMoney(input.amount) : oldAmount;
    const newDate = input.payment_date || existing.payment_date;
    
    let collectorName = existing.collected_by_name;
    if (input.collected_by) {
      const emp = memoryUsers.find((u) => u.id === input.collected_by);
      if (emp) collectorName = emp.full_name;
    }

    const updatedPmt: Payment = {
      ...existing,
      amount: newAmount,
      payment_method: input.payment_method || existing.payment_method,
      payment_date: newDate,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      collected_by: input.collected_by !== undefined ? input.collected_by : existing.collected_by,
      collected_by_name: collectorName,
      updated_at: new Date().toISOString(),
    };

    memoryPayments[pmtIdx] = updatedPmt;

    // Update memoryAccountTransactions
    const txIdx = memoryAccountTransactions.findIndex(
      (t) => t.reference_type === 'PAYMENT' && t.reference_id === id
    );
    if (txIdx !== -1) {
      memoryAccountTransactions[txIdx].credit = newAmount;
      memoryAccountTransactions[txIdx].transaction_date = newDate;
    }

    // Update memoryInvoices if invoice_id is present
    if (existing.invoice_id) {
      const invIdx = memoryInvoices.findIndex((i) => i.id === existing.invoice_id);
      if (invIdx !== -1) {
        const inv = memoryInvoices[invIdx];
        const totalPaid = memoryPayments
          .filter((p) => p.invoice_id === existing.invoice_id)
          .reduce((sum, p) => roundMoney(sum + p.amount), 0);

        inv.paid_amount = totalPaid;
        inv.remaining_amount = Math.max(0, roundMoney(inv.total - totalPaid));
        inv.payment_status = totalPaid >= inv.total ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
      }
    }

    return updatedPmt;
  }

  async delete(id: number): Promise<boolean> {
    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      return withTransaction(async (client) => {
        const pmtRes = await client.query<Payment>('SELECT * FROM payments WHERE id = $1 FOR UPDATE', [id]);
        if (!pmtRes.rows[0]) return false;
        const pmt = pmtRes.rows[0];

        // 1. Find all affected invoices from payment_allocations
        const allocsRes = await client.query<{ invoice_id: number }>(
          `SELECT DISTINCT invoice_id FROM payment_allocations WHERE payment_id = $1`,
          [id]
        );
        const affectedInvoiceIds = allocsRes.rows.map((r) => r.invoice_id);
        if (pmt.invoice_id && !affectedInvoiceIds.includes(pmt.invoice_id)) {
          affectedInvoiceIds.push(pmt.invoice_id);
        }

        // 2. Remove allocations
        await client.query('DELETE FROM payment_allocations WHERE payment_id = $1', [id]);

        // 3. Recalculate status of all affected invoices
        for (const invId of affectedInvoiceIds) {
          const invRes = await client.query<{ id: number; total: string }>(
            `SELECT id, total FROM invoices WHERE id = $1 FOR UPDATE`,
            [invId]
          );
          if (invRes.rows[0]) {
            const allocSumRes = await client.query<{ paid: string }>(
              `SELECT COALESCE(SUM(amount), 0) as paid FROM payment_allocations WHERE invoice_id = $1`,
              [invId]
            );
            const invTotal = Number(invRes.rows[0].total);
            const totalPaid = Number(allocSumRes.rows[0]?.paid || 0);
            const newStatus = totalPaid >= invTotal ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
            await client.query(`UPDATE invoices SET payment_status = $1, updated_at = NOW() WHERE id = $2;`, [newStatus, invId]);
          }
        }

        await client.query(`DELETE FROM account_transactions WHERE reference_type = 'PAYMENT' AND reference_id = $1`, [id]);
        const res = await client.query('DELETE FROM payments WHERE id = $1', [id]);

        return (res.rowCount ?? 0) > 0;
      });
    }

    const pmtIdx = memoryPayments.findIndex((p) => p.id === id);
    if (pmtIdx === -1) return false;
    const pmt = memoryPayments[pmtIdx];

    memoryPayments.splice(pmtIdx, 1);

    const txIdx = memoryAccountTransactions.findIndex(
      (t) => t.reference_type === 'PAYMENT' && t.reference_id === id
    );
    if (txIdx !== -1) {
      memoryAccountTransactions.splice(txIdx, 1);
    }

    if (pmt.invoice_id) {
      const invIdx = memoryInvoices.findIndex((i) => i.id === pmt.invoice_id);
      if (invIdx !== -1) {
        const inv = memoryInvoices[invIdx];
        const totalPaid = memoryPayments
          .filter((p) => p.invoice_id === pmt.invoice_id)
          .reduce((sum, p) => roundMoney(sum + p.amount), 0);

        inv.paid_amount = totalPaid;
        inv.remaining_amount = Math.max(0, roundMoney(inv.total - totalPaid));
        inv.payment_status = totalPaid >= inv.total ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
      }
    }

    return true;
  }
}

export const paymentRepository = new PaymentRepository();
