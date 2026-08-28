import { query, getClient } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import { Invoice, InvoiceItem, CreateInvoiceInput, InvoiceFilterOptions } from '../types/invoice.types';
import { UserRole } from '../types/user.types';

import { memoryUsers } from './user.repository';
import { memoryCustomers } from './customer.repository';

// In-memory fallback store
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

        const params: unknown[] = [];
        let pIndex = 1;

        if (options?.employee_id) {
          sql += ` AND i.employee_id = $${pIndex}`;
          params.push(options.employee_id);
          pIndex++;
        }

        if (options?.customer_id) {
          sql += ` AND i.customer_id = $${pIndex}`;
          params.push(options.customer_id);
          pIndex++;
        }

        if (options?.payment_status) {
          sql += ` AND i.payment_status = $${pIndex}`;
          params.push(options.payment_status);
          pIndex++;
        }

        if (options?.payment_type) {
          sql += ` AND i.payment_type = $${pIndex}`;
          params.push(options.payment_type);
          pIndex++;
        }

        if (options?.start_date) {
          sql += ` AND i.invoice_date >= $${pIndex}`;
          params.push(options.start_date);
          pIndex++;
        }

        if (options?.end_date) {
          sql += ` AND i.invoice_date <= $${pIndex}`;
          params.push(options.end_date);
          pIndex++;
        }

        if (options?.search) {
          sql += ` AND (LOWER(i.invoice_number) LIKE $${pIndex} OR LOWER(c.name) LIKE $${pIndex} OR LOWER(c.customer_code) LIKE $${pIndex})`;
          params.push(`%${options.search.toLowerCase()}%`);
          pIndex++;
        }

        sql += ` ORDER BY i.invoice_date DESC, i.id DESC`;

        const page = options?.page || 1;
        const limit = options?.limit || 50;
        const offset = (page - 1) * limit;

        sql += ` LIMIT $${pIndex} OFFSET $${pIndex + 1}`;
        params.push(limit, offset);

        const res = await query<Invoice>(sql, params);
        return { data: res.rows, total: res.rows.length };
      } catch (err) {
        // Fallback
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

    return { data: filtered, total: filtered.length };
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
        // Fallback
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
      } catch {
        // Fallback
      }
    }
    return memoryInvoices.find((i) => i.invoice_number === invoiceNumber) || null;
  }

  /**
   * ATOMIC Database Transaction: Create Invoice + Items + Account Transaction
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

    // Calculate subtotal and item totals on backend
    let subtotal = 0;
    const processedItems: InvoiceItem[] = [];

    for (const item of input.items) {
      const qty = Number(item.quantity);
      const unitPrice = Number(item.unit_price || 0);
      const itemDiscount = Number(item.discount || 0);
      const itemTotal = Math.max(0, qty * unitPrice - itemDiscount);

      subtotal += itemTotal;
      processedItems.push({
        product_id: item.product_id,
        quantity: qty,
        unit_price: unitPrice,
        discount: itemDiscount,
        total: itemTotal,
      });
    }

    const overallDiscount = Number(input.discount || 0);
    const finalTotal = Math.max(0, subtotal - overallDiscount);

    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      const client = await getClient();
      try {
        await client.query('BEGIN');

        // 1. Insert Invoice
        const invRes = await client.query<Invoice>(
          `INSERT INTO invoices (
            invoice_number, customer_id, invoice_date, employee_id,
            subtotal, discount, total, payment_type, due_date,
            payment_status, notes, created_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          ) RETURNING *;`,
          [
            invoiceNumber,
            input.customer_id,
            invoiceDate,
            input.employee_id || null,
            subtotal,
            overallDiscount,
            finalTotal,
            paymentType,
            dueDate,
            'UNPAID',
            input.notes || null,
            createdBy || null,
          ]
        );

        const createdInvoice = invRes.rows[0];

        // 2. Insert Invoice Items
        for (const it of processedItems) {
          await client.query(
            `INSERT INTO invoice_items (
              invoice_id, product_id, quantity, unit_price, discount, total
            ) VALUES ($1, $2, $3, $4, $5, $6);`,
            [createdInvoice.id, it.product_id, it.quantity, it.unit_price, it.discount, it.total]
          );
        }

        // 3. Insert Account Transaction (Debit = Invoice Total, Credit = 0)
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
            finalTotal,
            0,
          ]
        );

        await client.query('COMMIT');
        client.release();

        createdInvoice.items = processedItems;
        return createdInvoice;
      } catch (err) {
        await client.query('ROLLBACK');
        client.release();
        throw err;
      }
    }

    // Memory Store Transaction
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
      customer_id: input.customer_id,
      customer_name: customerName,
      customer_code: customerCode,
      invoice_date: invoiceDate,
      employee_id: input.employee_id || null,
      employee_name: employeeName,
      subtotal,
      discount: overallDiscount,
      total: finalTotal,
      paid_amount: 0,
      remaining_amount: finalTotal,
      payment_type: paymentType,
      due_date: dueDate,
      payment_status: 'UNPAID',
      notes: input.notes || null,
      items: processedItems.map((it, idx) => ({ ...it, id: idx + 1, invoice_id: newId })),
      created_by: createdBy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryInvoices.unshift(newInv);
    for (const it of newInv.items!) {
      memoryInvoiceItems.push(it);
    }

    // Add financial entry to account_transactions
    memoryAccountTransactions.push({
      id: memoryAccountTransactions.length + 1,
      customer_id: input.customer_id,
      transaction_date: invoiceDate,
      transaction_type: 'INVOICE',
      reference_type: 'INVOICE',
      reference_id: newId,
      description: `فاتورة مبيعات رقم ${invoiceNumber}`,
      debit: finalTotal,
      credit: 0,
      created_at: new Date().toISOString(),
    });

    return newInv;
  }

  async update(id: number, input: Partial<CreateInvoiceInput>): Promise<Invoice | null> {
    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      try {
        const client = await getClient();
        await client.query('BEGIN');
        const existingRes = await client.query<Invoice>('SELECT * FROM invoices WHERE id = $1', [id]);
        if (!existingRes.rows[0]) {
          await client.query('ROLLBACK');
          client.release();
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

        await client.query('COMMIT');
        client.release();
        return this.findById(id);
      } catch (err) {
        // Fallback
      }
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
      try {
        const client = await getClient();
        await client.query('BEGIN');
        // Delete payment allocations
        await client.query('DELETE FROM payment_allocations WHERE invoice_id = $1', [id]);
        // Delete invoice items
        await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
        // Delete account transactions
        await client.query(`DELETE FROM account_transactions WHERE reference_type = 'INVOICE' AND reference_id = $1`, [id]);
        // Delete invoice
        const res = await client.query('DELETE FROM invoices WHERE id = $1', [id]);
        await client.query('COMMIT');
        client.release();
        return (res.rowCount ?? 0) > 0;
      } catch (err) {
        // Fallback
      }
    }

    const idx = memoryInvoices.findIndex((i) => i.id === id);
    if (idx === -1) return false;

    // Remove from memoryInvoices
    memoryInvoices.splice(idx, 1);

    // Remove invoice items
    for (let i = memoryInvoiceItems.length - 1; i >= 0; i--) {
      if (memoryInvoiceItems[i].invoice_id === id) {
        memoryInvoiceItems.splice(i, 1);
      }
    }

    // Remove account transactions
    const txIdx = memoryAccountTransactions.findIndex(t => t.reference_type === 'INVOICE' && t.reference_id === id);
    if (txIdx !== -1) {
      memoryAccountTransactions.splice(txIdx, 1);
    }

    return true;
  }
}

export const invoiceRepository = new InvoiceRepository();
