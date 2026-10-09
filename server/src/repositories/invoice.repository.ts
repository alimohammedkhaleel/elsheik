import { query, withTransaction } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import { Invoice, InvoiceItem, CreateInvoiceInput, InvoiceFilterOptions } from '../types/invoice.types';
import { UserRole } from '../types/user.types';
import { calculateInvoiceTotals, roundMoney } from '../utils/money';

import { memoryUsers } from './user.repository';
import { memoryCustomers } from './customer.repository';

// In-memory fallback store for test environments only
export const memoryInvoices: Invoice[] = [];
export const memoryInvoiceItems: InvoiceItem[] = [];
export const memoryAccountTransactions: {
  id: number;
  customer_id: number;
  transaction_date: string;
  transaction_type: 'INVOICE' | 'PAYMENT' | 'RETURN' | 'DISCOUNT' | 'ADJUSTMENT';
  reference_type: string;
  reference_id: number;
  description: string;
  debit: number;
  credit: number;
  created_at: string;
}[] = [];

export class InvoiceRepository {
  async findAll(
    options?: InvoiceFilterOptions,
    actor?: { role: UserRole; userId: number }
  ): Promise<{ data: Invoice[]; total: number }> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        let sql = `
          SELECT 
            i.*,
            c.name as customer_name,
            c.customer_code,
            u.full_name as employee_name,
            COALESCE(pa.paid_amount, 0)::numeric as paid_amount,
            (i.total - COALESCE(pa.paid_amount, 0))::numeric as remaining_amount
          FROM invoices i
          JOIN customers c ON i.customer_id = c.id
          LEFT JOIN users u ON i.employee_id = u.id
          LEFT JOIN (
            SELECT invoice_id, SUM(amount) as paid_amount
            FROM payment_allocations
            GROUP BY invoice_id
          ) pa ON pa.invoice_id = i.id
          WHERE 1=1
        `;

        const countClauses: string[] = ['1=1'];
        const countParams: unknown[] = [];
        let cpIndex = 1;

        const dataParams: unknown[] = [];
        let dpIndex = 1;

        if (options?.employee_id) {
          sql += ` AND i.employee_id = $${dpIndex}`;
          dataParams.push(options.employee_id);
          dpIndex++;

          countClauses.push(`i.employee_id = $${cpIndex}`);
          countParams.push(options.employee_id);
          cpIndex++;
        }

        if (options?.customer_id) {
          sql += ` AND i.customer_id = $${dpIndex}`;
          dataParams.push(options.customer_id);
          dpIndex++;

          countClauses.push(`i.customer_id = $${cpIndex}`);
          countParams.push(options.customer_id);
          cpIndex++;
        }

        if (options?.payment_status) {
          sql += ` AND i.payment_status = $${dpIndex}`;
          dataParams.push(options.payment_status);
          dpIndex++;

          countClauses.push(`i.payment_status = $${cpIndex}`);
          countParams.push(options.payment_status);
          cpIndex++;
        }

        if (options?.payment_type) {
          sql += ` AND i.payment_type = $${dpIndex}`;
          dataParams.push(options.payment_type);
          dpIndex++;

          countClauses.push(`i.payment_type = $${cpIndex}`);
          countParams.push(options.payment_type);
          cpIndex++;
        }

        if (options?.start_date) {
          sql += ` AND i.invoice_date >= $${dpIndex}`;
          dataParams.push(options.start_date);
          dpIndex++;

          countClauses.push(`i.invoice_date >= $${cpIndex}`);
          countParams.push(options.start_date);
          cpIndex++;
        }

        if (options?.end_date) {
          sql += ` AND i.invoice_date <= $${dpIndex}`;
          dataParams.push(options.end_date);
          dpIndex++;

          countClauses.push(`i.invoice_date <= $${cpIndex}`);
          countParams.push(options.end_date);
          cpIndex++;
        }

        if (options?.search) {
          const searchPattern = `%${options.search.trim().toLowerCase()}%`;
          sql += ` AND (LOWER(i.invoice_number) LIKE $${dpIndex} OR LOWER(c.name) LIKE $${dpIndex} OR LOWER(c.customer_code) LIKE $${dpIndex})`;
          dataParams.push(searchPattern);
          dpIndex++;

          countClauses.push(`(LOWER(i.invoice_number) LIKE $${cpIndex} OR LOWER(c.name) LIKE $${cpIndex} OR LOWER(c.customer_code) LIKE $${cpIndex})`);
          countParams.push(searchPattern);
          cpIndex++;
        }

        sql += ` ORDER BY i.invoice_date DESC, i.id DESC`;

        const page = Math.max(1, options?.page || 1);
        const limit = Math.max(1, Math.min(200, options?.limit || 50));
        const offset = (page - 1) * limit;

        sql += ` LIMIT $${dpIndex} OFFSET $${dpIndex + 1}`;
        dataParams.push(limit, offset);

        const res = await query<Invoice>(sql, dataParams);

        // Authoritative filtered count query with full parameterization
        const countSql = `
          SELECT COUNT(i.id) as total 
          FROM invoices i 
          JOIN customers c ON i.customer_id = c.id 
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

    let filtered = memoryInvoices.filter((inv) => {
      if (options?.customer_id && inv.customer_id !== options.customer_id) return false;
      if (options?.employee_id && inv.employee_id !== options.employee_id) return false;
      if (options?.payment_status && inv.payment_status !== options.payment_status) return false;
      if (options?.payment_type && inv.payment_type !== options.payment_type) return false;
      if (options?.search) {
        const s = options.search.toLowerCase();
        const match =
          inv.invoice_number.toLowerCase().includes(s) ||
          (inv.customer_name && inv.customer_name.toLowerCase().includes(s));
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

  async findById(id: number): Promise<Invoice | null> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          SELECT 
            i.*,
            c.name as customer_name,
            c.customer_code,
            u.full_name as employee_name,
            COALESCE(pa.paid_amount, 0)::numeric as paid_amount,
            (i.total - COALESCE(pa.paid_amount, 0))::numeric as remaining_amount
          FROM invoices i
          JOIN customers c ON i.customer_id = c.id
          LEFT JOIN users u ON i.employee_id = u.id
          LEFT JOIN (
            SELECT invoice_id, SUM(amount) as paid_amount
            FROM payment_allocations
            GROUP BY invoice_id
          ) pa ON pa.invoice_id = i.id
          WHERE i.id = $1
          LIMIT 1;
        `;
        const res = await query<Invoice>(sql, [id]);
        if (!res.rows[0]) return null;

        const invoice = res.rows[0];

        // Fetch invoice items
        const itemsSql = `
          SELECT ii.*, p.name as product_name, p.product_code, p.unit
          FROM invoice_items ii
          JOIN products p ON ii.product_id = p.id
          WHERE ii.invoice_id = $1;
        `;
        const itemsRes = await query<InvoiceItem>(itemsSql, [id]);
        invoice.items = itemsRes.rows;

        return invoice;
      } catch (err) {
        if (process.env.NODE_ENV === 'production') {
          throw err;
        }
      }
    }

    const inv = memoryInvoices.find((i) => i.id === id);
    if (!inv) return null;
    const items = memoryInvoiceItems.filter((it) => it.invoice_id === id);
    return { ...inv, items };
  }

  async findByNumber(invoiceNumber: string): Promise<Invoice | null> {
    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      try {
        const res = await query<Invoice>(`SELECT * FROM invoices WHERE invoice_number = $1 LIMIT 1`, [invoiceNumber]);
        return res.rows[0] || null;
      } catch (err) {
        if (process.env.NODE_ENV === 'production') {
          throw err;
        }
      }
    }
    return memoryInvoices.find((i) => i.invoice_number === invoiceNumber) || null;
  }

  async findByIdempotencyKey(key: string): Promise<Invoice | null> {
    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      try {
        const res = await query<Invoice>(`SELECT * FROM invoices WHERE idempotency_key = $1 LIMIT 1`, [key]);
        if (res.rows[0]) {
          return this.findById(res.rows[0].id);
        }
      } catch {
        // Idempotency check fallback
      }
    }
    const memInv = memoryInvoices.find((i) => i.idempotency_key === key);
    if (!memInv) return null;
    const items = memoryInvoiceItems.filter((it) => it.invoice_id === memInv.id);
    return { ...memInv, items };
  }

  /**
   * ATOMIC Database Transaction: Create Invoice + Items + Account Ledger Entry
   * Guarantees all records succeed or fail together with half-up monetary precision.
   */
  async create(input: CreateInvoiceInput, createdBy?: number): Promise<Invoice> {
    const invoiceNumber = input.invoice_number || `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    const invoiceDate = input.invoice_date || new Date().toISOString().split('T')[0];
    const paymentType = input.payment_type || 'CASH';
    const termsDays = input.payment_terms_days || (paymentType === 'CASH' ? 0 : 15);

    // Calculate due date
    const d = new Date(invoiceDate);
    d.setDate(d.getDate() + termsDays);
    const dueDate = d.toISOString().split('T')[0];

    // Authoritative financial calculations with 2-decimal precision
    const totals = calculateInvoiceTotals(
      input.items.map((it) => ({
        quantity: it.quantity,
        unit_price: it.unit_price || 0,
        discount: it.discount || 0,
      })),
      input.discount || 0
    );

    // Idempotency pre-check with payload verification
    if (input.idempotency_key) {
      const existing = await this.findByIdempotencyKey(input.idempotency_key);
      if (existing) {
        if (
          existing.customer_id !== input.customer_id ||
          roundMoney(existing.total) !== roundMoney(totals.total)
        ) {
          throw new Error('IDEMPOTENCY_CONFLICT: Idempotency key reused with materially different invoice data');
        }
        return existing;
      }
    }

    const processedItems: InvoiceItem[] = input.items.map((item) => {
      const qty = Number(item.quantity);
      const unitPrice = roundMoney(item.unit_price || 0);
      const itemDiscount = roundMoney(item.discount || 0);
      const itemTotal = roundMoney(Math.max(0, qty * unitPrice - itemDiscount));

      return {
        product_id: item.product_id,
        quantity: qty,
        unit_price: unitPrice,
        discount: itemDiscount,
        total: itemTotal,
      };
    });

    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        return await withTransaction(async (client) => {
          // 1. Insert Invoice Header
          const invRes = await client.query<Invoice>(
            `INSERT INTO invoices (
              invoice_number, idempotency_key, customer_id, invoice_date, employee_id,
              subtotal, discount, total, payment_type, due_date,
              payment_status, notes, created_by
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
            ) RETURNING *;`,
            [
              invoiceNumber,
              input.idempotency_key || null,
              input.customer_id,
              invoiceDate,
              input.employee_id || null,
              totals.subtotal,
              totals.totalDiscount,
              totals.total,
              paymentType,
              dueDate,
              'UNPAID',
              input.notes || null,
              createdBy || null,
            ]
          );

          const createdInvoice = invRes.rows[0];

          // 2. Insert Invoice Line Items
          for (const it of processedItems) {
            await client.query(
              `INSERT INTO invoice_items (
                invoice_id, product_id, quantity, unit_price, discount, total
              ) VALUES ($1, $2, $3, $4, $5, $6);`,
              [createdInvoice.id, it.product_id, it.quantity, it.unit_price, it.discount, it.total]
            );
          }

          // 3. Insert Account Ledger Transaction (Debit = Invoice Total, Credit = 0)
          await client.query(
            `INSERT INTO account_transactions (
              customer_id, transaction_date, transaction_type,
              reference_type, reference_id, description, debit, credit
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
            [
              input.customer_id,
              invoiceDate,
              'INVOICE',
              'INVOICE',
              createdInvoice.id,
              `فاتورة مبيعات رقم ${invoiceNumber}`,
              totals.total,
              0,
            ]
          );

          createdInvoice.items = processedItems;
          return createdInvoice;
        });
      } catch (err: any) {
        // Handle concurrent duplicate insertion caught by database unique index
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
              roundMoney(existing.total) !== roundMoney(totals.total)
            ) {
              throw new Error('IDEMPOTENCY_CONFLICT: Idempotency key reused with materially different invoice data');
            }
            return existing;
          }
        }
        throw err;
      }
    }

    // In-memory store for testing environments
    const newId = memoryInvoices.length + 1;
    
    let customerName: string | undefined;
    let customerCode: string | undefined;
    if (input.customer_id) {
      const cust = memoryCustomers.find(c => c.id === input.customer_id);
      if (cust) {
        customerName = cust.name;
        customerCode = cust.customer_code;
      }
    }

    let employeeName: string | undefined;
    if (input.employee_id) {
      const emp = memoryUsers.find(u => u.id === input.employee_id);
      if (emp) {
        employeeName = emp.full_name;
      }
    }

    const newInv: Invoice = {
      id: newId,
      invoice_number: invoiceNumber,
      idempotency_key: input.idempotency_key || null,
      customer_id: input.customer_id,
      customer_name: customerName,
      customer_code: customerCode,
      invoice_date: invoiceDate,
      employee_id: input.employee_id || null,
      employee_name: employeeName,
      subtotal: totals.subtotal,
      discount: totals.totalDiscount,
      total: totals.total,
      paid_amount: 0,
      remaining_amount: totals.total,
      payment_type: paymentType,
      due_date: dueDate,
      payment_status: 'UNPAID',
      notes: input.notes || null,
      items: processedItems,
      created_by: createdBy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryInvoices.unshift(newInv);

    for (const it of processedItems) {
      memoryInvoiceItems.push({
        ...it,
        id: memoryInvoiceItems.length + 1,
        invoice_id: newId,
      });
    }

    memoryAccountTransactions.push({
      id: memoryAccountTransactions.length + 1,
      customer_id: input.customer_id,
      transaction_date: invoiceDate,
      transaction_type: 'INVOICE',
      reference_type: 'INVOICE',
      reference_id: newId,
      description: `فاتورة مبيعات رقم ${invoiceNumber}`,
      debit: totals.total,
      credit: 0,
      created_at: new Date().toISOString(),
    });

    return newInv;
  }

  async update(id: number, input: Partial<CreateInvoiceInput>): Promise<Invoice | null> {
    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      return withTransaction(async (client) => {
        const existingRes = await client.query<Invoice>('SELECT * FROM invoices WHERE id = $1 FOR UPDATE', [id]);
        if (!existingRes.rows[0]) {
          return null;
        }

        const existing = existingRes.rows[0];
        const notes = input.notes !== undefined ? input.notes : existing.notes;
        const employeeId = input.employee_id !== undefined ? input.employee_id : existing.employee_id;
        const paymentType = input.payment_type || existing.payment_type;

        await client.query(
          `UPDATE invoices SET notes = $1, employee_id = $2, payment_type = $3, updated_at = NOW() WHERE id = $4`,
          [notes, employeeId, paymentType, id]
        );

        // Fetch directly using the same transaction client
        const updatedRes = await client.query<Invoice>(
          `SELECT 
            i.*,
            c.name as customer_name,
            c.customer_code,
            u.full_name as employee_name,
            COALESCE(pa.paid_amount, 0)::numeric as paid_amount,
            (i.total - COALESCE(pa.paid_amount, 0))::numeric as remaining_amount
          FROM invoices i
          JOIN customers c ON i.customer_id = c.id
          LEFT JOIN users u ON i.employee_id = u.id
          LEFT JOIN (
            SELECT invoice_id, SUM(amount) as paid_amount
            FROM payment_allocations
            GROUP BY invoice_id
          ) pa ON pa.invoice_id = i.id
          WHERE i.id = $1`,
          [id]
        );

        if (!updatedRes.rows[0]) return null;
        const invoice = updatedRes.rows[0];

        const itemsRes = await client.query<InvoiceItem>(
          `SELECT ii.*, p.name as product_name, p.product_code, p.unit
           FROM invoice_items ii
           JOIN products p ON ii.product_id = p.id
           WHERE ii.invoice_id = $1`,
          [id]
        );
        invoice.items = itemsRes.rows;

        return invoice;
      });
    }

    const invIdx = memoryInvoices.findIndex((i) => i.id === id);
    if (invIdx === -1) return null;
    const existing = memoryInvoices[invIdx];

    let empName = existing.employee_name;
    if (input.employee_id) {
      const emp = memoryUsers.find((u) => u.id === input.employee_id);
      if (emp) empName = emp.full_name;
    }

    const updatedInv: Invoice = {
      ...existing,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      employee_id: input.employee_id !== undefined ? input.employee_id : existing.employee_id,
      employee_name: empName,
      payment_type: input.payment_type || existing.payment_type,
      updated_at: new Date().toISOString(),
    };

    memoryInvoices[invIdx] = updatedInv;
    return updatedInv;
  }

  async delete(id: number): Promise<boolean> {
    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      return withTransaction(async (client) => {
        // Delete payment allocations
        await client.query('DELETE FROM payment_allocations WHERE invoice_id = $1', [id]);
        // Delete invoice items
        await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
        // Delete account transactions
        await client.query(`DELETE FROM account_transactions WHERE reference_type = 'INVOICE' AND reference_id = $1`, [id]);
        // Delete invoice
        const res = await client.query('DELETE FROM invoices WHERE id = $1', [id]);
        return (res.rowCount ?? 0) > 0;
      });
    }

    const idx = memoryInvoices.findIndex((i) => i.id === id);
    if (idx === -1) return false;

    // Clean up memoryInvoiceItems
    for (let i = memoryInvoiceItems.length - 1; i >= 0; i--) {
      if (memoryInvoiceItems[i].invoice_id === id) {
        memoryInvoiceItems.splice(i, 1);
      }
    }

    // Clean up memoryAccountTransactions
    const txIdx = memoryAccountTransactions.findIndex(
      (t) => t.reference_type === 'INVOICE' && t.reference_id === id
    );
    if (txIdx !== -1) {
      memoryAccountTransactions.splice(txIdx, 1);
    }

    memoryInvoices.splice(idx, 1);
    return true;
  }
}

export const invoiceRepository = new InvoiceRepository();
