import { query, getClient } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import { Customer, CustomerAssignmentRecord, CreateCustomerInput, UpdateCustomerInput, CustomerFilterOptions, CustomerStatus, AssignmentType } from '../types/customer.types';
import { UserRole } from '../types/user.types';

import { memoryUsers } from './user.repository';

// In-memory fallback store with seeded sample customers
export const memoryCustomers: Customer[] = [
  {
    id: 1,
    customer_code: 'CUST-001',
    name: 'شركة النور للتجارة والتوزيع',
    trade_name: 'سوبرماركت النور',
    phone: '01012345678',
    secondary_phone: '0224567890',
    city: 'القاهرة',
    address: 'شارع صلاح سالم - مصر الجديدة',
    payment_type: 'CREDIT',
    payment_terms_days: 15,
    classification: 'A',
    has_app: true,
    credit_limit: 50000.0,
    current_balance: 0,
    total_sales: 0,
    total_paid: 0,
    overdue_amount: 0,
    invoice_count: 0,
    avg_invoice: 0,
    assigned_employee_id: 2,
    assigned_employee_name: 'علي محمد حسن',
    status: 'ACTIVE',
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 2,
    customer_code: 'CUST-002',
    name: 'مؤسسة الأمل للمواد الغذائية',
    trade_name: 'الأمل ماركت',
    phone: '01198765432',
    secondary_phone: null,
    city: 'الجيزة',
    address: 'شارع الهرم الرئيسي',
    payment_type: 'CREDIT',
    payment_terms_days: 30,
    classification: 'B',
    has_app: false,
    credit_limit: 35000.0,
    current_balance: 0,
    total_sales: 0,
    total_paid: 0,
    overdue_amount: 0,
    invoice_count: 0,
    avg_invoice: 0,
    assigned_employee_id: 3,
    assigned_employee_name: 'أحمد محمود إبراهيم',
    status: 'ACTIVE',
    created_at: '2026-01-05T09:00:00Z',
    updated_at: '2026-01-05T09:00:00Z',
  },
  {
    id: 3,
    customer_code: 'CUST-003',
    name: 'مركز الهدى للجملة والتجزئة',
    trade_name: 'الهدى ستورز',
    phone: '01234567890',
    secondary_phone: null,
    city: 'الإسكندرية',
    address: 'طريق الجيش - سيدي جابر',
    payment_type: 'CASH',
    payment_terms_days: 0,
    classification: 'A',
    has_app: true,
    credit_limit: 75000.0,
    current_balance: 0,
    total_sales: 0,
    total_paid: 0,
    overdue_amount: 0,
    invoice_count: 0,
    avg_invoice: 0,
    assigned_employee_id: null,
    assigned_employee_name: null,
    status: 'ACTIVE',
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-01-10T10:00:00Z',
  },
];

const memoryAssignments: CustomerAssignmentRecord[] = [];

export class CustomerRepository {
  async findAll(
    options?: CustomerFilterOptions,
    actor?: { role: UserRole; userId: number }
  ): Promise<{ data: Customer[]; total: number }> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        let sql = `
          SELECT 
            c.*, 
            u.full_name as assigned_employee_name,
            COALESCE(tx.balance, 0)::numeric as current_balance,
            COALESCE(inv.total_sales, 0)::numeric as total_sales,
            COALESCE(pmt.total_paid, 0)::numeric as total_paid,
            COALESCE(inv.invoice_count, 0)::int as invoice_count,
            COALESCE(inv.last_order_date, NULL) as last_order_date,
            COALESCE(pmt.last_payment_date, NULL) as last_payment_date
          FROM customers c
          LEFT JOIN users u ON c.assigned_employee_id = u.id
          LEFT JOIN (
            SELECT customer_id, SUM(debit) - SUM(credit) as balance
            FROM account_transactions
            GROUP BY customer_id
          ) tx ON tx.customer_id = c.id
          LEFT JOIN (
            SELECT customer_id, SUM(total) as total_sales, COUNT(id) as invoice_count, MAX(invoice_date) as last_order_date
            FROM invoices
            GROUP BY customer_id
          ) inv ON inv.customer_id = c.id
          LEFT JOIN (
            SELECT customer_id, SUM(amount) as total_paid, MAX(payment_date) as last_payment_date
            FROM payments
            GROUP BY customer_id
          ) pmt ON pmt.customer_id = c.id
          WHERE 1=1
        `;

        const params: unknown[] = [];
        let pIndex = 1;

        if (options?.assigned_employee_id !== undefined) {
          sql += ` AND c.assigned_employee_id = $${pIndex}`;
          params.push(options.assigned_employee_id);
          pIndex++;
        }

        if (options?.search) {
          sql += ` AND (LOWER(c.name) LIKE $${pIndex} OR LOWER(c.customer_code) LIKE $${pIndex} OR LOWER(c.phone) LIKE $${pIndex} OR LOWER(COALESCE(c.trade_name, '')) LIKE $${pIndex})`;
          params.push(`%${options.search.toLowerCase()}%`);
          pIndex++;
        }

        if (options?.payment_type) {
          sql += ` AND c.payment_type = $${pIndex}`;
          params.push(options.payment_type);
          pIndex++;
        }

        if (options?.status) {
          sql += ` AND c.status = $${pIndex}`;
          params.push(options.status);
          pIndex++;
        }

        if (options?.classification) {
          sql += ` AND c.classification = $${pIndex}`;
          params.push(options.classification);
          pIndex++;
        }

        if (options?.sort_by === 'balance') {
          sql += ` ORDER BY current_balance ${options.sort_order === 'asc' ? 'ASC' : 'DESC'}`;
        } else if (options?.sort_by === 'latest') {
          sql += ` ORDER BY c.created_at ${options.sort_order === 'asc' ? 'ASC' : 'DESC'}`;
        } else {
          sql += ` ORDER BY c.created_at DESC`;
        }

        const page = options?.page || 1;
        const limit = options?.limit || 50;
        const offset = (page - 1) * limit;

        sql += ` LIMIT $${pIndex} OFFSET $${pIndex + 1}`;
        params.push(limit, offset);

        const result = await query<Customer>(sql, params);

        // Count total matching records
        const countSql = `
          SELECT COUNT(c.id) as total 
          FROM customers c 
          WHERE 1=1 
          ${options?.assigned_employee_id !== undefined ? `AND c.assigned_employee_id = ${options.assigned_employee_id}` : ''}
          ${options?.search ? `AND (LOWER(c.name) LIKE '%${options.search.toLowerCase()}%' OR LOWER(c.customer_code) LIKE '%${options.search.toLowerCase()}%' OR LOWER(c.phone) LIKE '%${options.search.toLowerCase()}%')` : ''}
          ${options?.payment_type ? `AND c.payment_type = '${options.payment_type}'` : ''}
          ${options?.status ? `AND c.status = '${options.status}'` : ''}
          ${options?.classification ? `AND c.classification = '${options.classification}'` : ''}
        `;
        const countRes = await query<{ total: string }>(countSql);
        const total = countRes.rows[0] ? parseInt(countRes.rows[0].total, 10) : result.rows.length;

        return { data: result.rows, total };
      } catch (err) {
        // Fallback to memory
      }
    }

    // Memory store filtering
    let filtered = memoryCustomers.filter((c) => {
      if (options?.assigned_employee_id !== undefined) {
        if (c.assigned_employee_id !== options.assigned_employee_id) return false;
      }

      if (options?.search) {
        const s = options.search.toLowerCase();
        const match =
          c.name.toLowerCase().includes(s) ||
          c.customer_code.toLowerCase().includes(s) ||
          (c.phone && c.phone.includes(s)) ||
          (c.trade_name && c.trade_name.toLowerCase().includes(s));
        if (!match) return false;
      }

      if (options?.payment_type && c.payment_type !== options.payment_type) return false;
      if (options?.status && c.status !== options.status) return false;
      if (options?.classification && c.classification !== options.classification) return false;

      return true;
    });

    return { data: filtered, total: filtered.length };
  }

  async findById(id: number, actor?: { role: UserRole; userId: number }): Promise<Customer | null> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          SELECT 
            c.*, 
            u.full_name as assigned_employee_name,
            COALESCE(tx.balance, 0)::numeric as current_balance,
            COALESCE(inv.total_sales, 0)::numeric as total_sales,
            COALESCE(pmt.total_paid, 0)::numeric as total_paid,
            COALESCE(inv.overdue_amount, 0)::numeric as overdue_amount,
            COALESCE(inv.invoice_count, 0)::int as invoice_count,
            COALESCE(inv.avg_invoice, 0)::numeric as avg_invoice,
            COALESCE(inv.last_order_date, NULL) as last_order_date,
            COALESCE(pmt.last_payment_date, NULL) as last_payment_date
          FROM customers c
          LEFT JOIN users u ON c.assigned_employee_id = u.id
          LEFT JOIN (
            SELECT customer_id, SUM(debit) - SUM(credit) as balance
            FROM account_transactions
            WHERE customer_id = $1
            GROUP BY customer_id
          ) tx ON tx.customer_id = c.id
          LEFT JOIN (
            SELECT 
              customer_id, 
              SUM(total) as total_sales, 
              COUNT(id) as invoice_count,
              AVG(total) as avg_invoice,
              MAX(invoice_date) as last_order_date,
              SUM(CASE WHEN due_date < CURRENT_DATE AND payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'OVERDUE') THEN total ELSE 0 END) as overdue_amount
            FROM invoices
            WHERE customer_id = $1
            GROUP BY customer_id
          ) inv ON inv.customer_id = c.id
          LEFT JOIN (
            SELECT customer_id, SUM(amount) as total_paid, MAX(payment_date) as last_payment_date
            FROM payments
            WHERE customer_id = $1
            GROUP BY customer_id
          ) pmt ON pmt.customer_id = c.id
          WHERE c.id = $1
          LIMIT 1;
        `;
        const result = await query<Customer>(sql, [id]);
        const customer = result.rows[0] || null;

        return customer;
      } catch (err) {
        // Fallback to memory
      }
    }

    const c = memoryCustomers.find((item) => item.id === id);
    if (!c) return null;

    return { ...c };
  }

  async findByCode(code: string): Promise<Customer | null> {
    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      try {
        const res = await query<Customer>(`SELECT * FROM customers WHERE customer_code = $1 LIMIT 1`, [code]);
        return res.rows[0] || null;
      } catch {
        // Fallback
      }
    }
    return memoryCustomers.find((c) => c.customer_code === code) || null;
  }

  async create(input: CreateCustomerInput, createdBy?: number): Promise<Customer> {
    const customerCode = input.customer_code || `CUST-${String(Date.now()).slice(-4)}`;
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          INSERT INTO customers (
            customer_code, name, trade_name, phone, secondary_phone, city, address,
            payment_type, payment_terms_days, assigned_employee_id, status, classification,
            has_app, credit_limit, created_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
          ) RETURNING *;
        `;
        const params = [
          customerCode,
          input.name,
          input.trade_name || null,
          input.phone || null,
          input.secondary_phone || null,
          input.city || null,
          input.address || null,
          input.payment_type || 'CASH',
          input.payment_terms_days || 0,
          input.assigned_employee_id || null,
          input.status || 'ACTIVE',
          input.classification || 'B',
          input.has_app ?? false,
          input.credit_limit || 0.0,
          createdBy || null,
        ];
        const res = await query<Customer>(sql, params);
        return res.rows[0];
      } catch (err) {
        // Fallback
      }
    }

    const newCustomer: Customer = {
      id: memoryCustomers.length + 1,
      customer_code: customerCode,
      name: input.name,
      trade_name: input.trade_name || null,
      phone: input.phone || null,
      secondary_phone: input.secondary_phone || null,
      city: input.city || null,
      address: input.address || null,
      payment_type: input.payment_type || 'CASH',
      payment_terms_days: input.payment_terms_days || 0,
      assigned_employee_id: input.assigned_employee_id || null,
      status: input.status || 'ACTIVE',
      classification: input.classification || 'B',
      has_app: input.has_app ?? false,
      credit_limit: input.credit_limit || 0,
      current_balance: 0,
      total_sales: 0,
      total_paid: 0,
      overdue_amount: 0,
      invoice_count: 0,
      avg_invoice: 0,
      assigned_employee_name: input.assigned_employee_id
        ? memoryUsers.find(u => u.id === input.assigned_employee_id)?.full_name || null
        : null,
      created_by: createdBy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryCustomers.unshift(newCustomer);
    return newCustomer;
  }

  async update(id: number, input: UpdateCustomerInput): Promise<Customer | null> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const fields: string[] = [];
        const params: unknown[] = [];
        let pIndex = 1;

        if (input.name !== undefined) { fields.push(`name = $${pIndex++}`); params.push(input.name); }
        if (input.trade_name !== undefined) { fields.push(`trade_name = $${pIndex++}`); params.push(input.trade_name); }
        if (input.phone !== undefined) { fields.push(`phone = $${pIndex++}`); params.push(input.phone); }
        if (input.secondary_phone !== undefined) { fields.push(`secondary_phone = $${pIndex++}`); params.push(input.secondary_phone); }
        if (input.city !== undefined) { fields.push(`city = $${pIndex++}`); params.push(input.city); }
        if (input.address !== undefined) { fields.push(`address = $${pIndex++}`); params.push(input.address); }
        if (input.payment_type !== undefined) { fields.push(`payment_type = $${pIndex++}`); params.push(input.payment_type); }
        if (input.payment_terms_days !== undefined) { fields.push(`payment_terms_days = $${pIndex++}`); params.push(input.payment_terms_days); }
        if (input.assigned_employee_id !== undefined) { fields.push(`assigned_employee_id = $${pIndex++}`); params.push(input.assigned_employee_id); }
        if (input.status !== undefined) { fields.push(`status = $${pIndex++}`); params.push(input.status); }
        if (input.classification !== undefined) { fields.push(`classification = $${pIndex++}`); params.push(input.classification); }
        if (input.has_app !== undefined) { fields.push(`has_app = $${pIndex++}`); params.push(input.has_app); }
        if (input.credit_limit !== undefined) { fields.push(`credit_limit = $${pIndex++}`); params.push(input.credit_limit); }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const sql = `UPDATE customers SET ${fields.join(', ')} WHERE id = $${pIndex} RETURNING *;`;
        const res = await query<Customer>(sql, params);
        return res.rows[0] || null;
      } catch (err) {
        // Fallback
      }
    }

    const idx = memoryCustomers.findIndex((c) => c.id === id);
    if (idx !== -1) {
      memoryCustomers[idx] = {
        ...memoryCustomers[idx],
        ...input,
        updated_at: new Date().toISOString(),
      };
      return memoryCustomers[idx];
    }
    return null;
  }

  async assignEmployee(
    customerId: number,
    newEmployeeId: number | null,
    assignedBy: number,
    reason?: string,
    assignmentType: AssignmentType = 'SALES_REP'
  ): Promise<{ customer: Customer; assignment: CustomerAssignmentRecord } | null> {
    const customer = await this.findById(customerId);
    if (!customer) return null;

    let prevEmployeeId: number | null = null;
    let colName = 'assigned_employee_id';

    if (assignmentType === 'ACCOUNTANT') {
      prevEmployeeId = customer.accountant_id || null;
      colName = 'accountant_id';
    } else if (assignmentType === 'FOLLOW_UP') {
      prevEmployeeId = customer.follow_up_employee_id || null;
      colName = 'follow_up_employee_id';
    } else {
      prevEmployeeId = customer.assigned_employee_id || null;
      colName = 'assigned_employee_id';
    }

    const now = new Date().toISOString();
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        await query(
          `UPDATE customers SET ${colName} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;`,
          [newEmployeeId, customerId]
        );

        const assignResult = await query<CustomerAssignmentRecord>(
          `INSERT INTO customer_assignments (customer_id, previous_employee_id, new_employee_id, assigned_by, reason, assignment_type)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *;`,
          [customerId, prevEmployeeId || null, newEmployeeId, assignedBy, reason || null, assignmentType]
        );

        const updatedCustomer = await this.findById(customerId);
        return {
          customer: updatedCustomer!,
          assignment: assignResult.rows[0],
        };
      } catch (err) {
        // Fallback to memory
      }
    }

    const cIdx = memoryCustomers.findIndex((c) => c.id === customerId);
    if (cIdx !== -1) {
      if (assignmentType === 'ACCOUNTANT') {
        memoryCustomers[cIdx].accountant_id = newEmployeeId;
      } else if (assignmentType === 'FOLLOW_UP') {
        memoryCustomers[cIdx].follow_up_employee_id = newEmployeeId;
      } else {
        memoryCustomers[cIdx].assigned_employee_id = newEmployeeId;
      }
      memoryCustomers[cIdx].updated_at = now;
    }

    const newAssignment: CustomerAssignmentRecord = {
      id: memoryAssignments.length + 1,
      customer_id: customerId,
      customer_name: customer.name,
      assignment_type: assignmentType,
      previous_employee_id: prevEmployeeId,
      previous_employee_name: customer.assigned_employee_name,
      new_employee_id: newEmployeeId,
      new_employee_name: newEmployeeId ? `موظف #${newEmployeeId}` : null,
      assigned_by: assignedBy,
      assigned_by_name: 'مدير النظام',
      assigned_at: now,
      reason: reason || null,
    };
    memoryAssignments.unshift(newAssignment);

    return {
      customer: memoryCustomers[cIdx],
      assignment: newAssignment,
    };
  }


  async getAssignmentHistory(customerId?: number): Promise<CustomerAssignmentRecord[]> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        let sql = `
          SELECT 
            ca.*,
            c.name as customer_name,
            u_prev.full_name as previous_employee_name,
            u_new.full_name as new_employee_name,
            u_by.full_name as assigned_by_name
          FROM customer_assignments ca
          LEFT JOIN customers c ON ca.customer_id = c.id
          LEFT JOIN users u_prev ON ca.previous_employee_id = u_prev.id
          LEFT JOIN users u_new ON ca.new_employee_id = u_new.id
          LEFT JOIN users u_by ON ca.assigned_by = u_by.id
          WHERE 1=1
        `;
        const params: unknown[] = [];
        if (customerId) {
          sql += ` AND ca.customer_id = $1`;
          params.push(customerId);
        }
        sql += ` ORDER BY ca.assigned_at DESC;`;
        const result = await query<CustomerAssignmentRecord>(sql, params);
        return result.rows;
      } catch (err) {
        // Fallback to memory
      }
    }

    if (customerId) {
      return memoryAssignments.filter((a) => a.customer_id === customerId);
    }
    return memoryAssignments;
  }

  async delete(id: number): Promise<boolean> {
    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      try {
        const client = await getClient();
        await client.query('BEGIN');
        await client.query('DELETE FROM customer_assignments WHERE customer_id = $1', [id]);
        await client.query('DELETE FROM customer_interactions WHERE customer_id = $1', [id]);
        await client.query('DELETE FROM account_transactions WHERE customer_id = $1', [id]);
        await client.query('DELETE FROM payment_allocations WHERE invoice_id IN (SELECT id FROM invoices WHERE customer_id = $1)', [id]);
        await client.query('DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE customer_id = $1)', [id]);
        await client.query('DELETE FROM payments WHERE customer_id = $1', [id]);
        await client.query('DELETE FROM invoices WHERE customer_id = $1', [id]);
        const res = await client.query('DELETE FROM customers WHERE id = $1', [id]);
        await client.query('COMMIT');
        client.release();
        return (res.rowCount ?? 0) > 0;
      } catch (err) {
        // Fallback
      }
    }

    const idx = memoryCustomers.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    memoryCustomers.splice(idx, 1);
    return true;
  }
}

export const customerRepository = new CustomerRepository();
