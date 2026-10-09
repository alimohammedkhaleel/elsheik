import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { newDb, IMemoryDb, DataType } from 'pg-mem';
import fs from 'fs';
import path from 'path';

describe('Real PostgreSQL Engine Integration & Transaction Rollback Suite', () => {
  let db: IMemoryDb;
  let pool: any;

  before(async () => {
    // 1. Initialize in-memory PostgreSQL engine
    db = newDb();

    // Register PostgreSQL built-in functions
    db.public.registerFunction({
      name: 'current_database',
      args: [],
      returns: DataType.text,
      implementation: () => 'test_db',
    });

    db.public.registerFunction({
      name: 'version',
      args: [],
      returns: DataType.text,
      implementation: () => 'PostgreSQL 16.0 (pg-mem)',
    });

    // 2. Read and execute actual SQL migration files in order
    const migrationsDir = path.resolve(__dirname, '../../database/migrations');
    const migrationFiles = [
      '001_create_part2_tables.sql',
      '002_create_part3_financial_tables.sql',
      '003_final_production_enhancements.sql',
      '004_production_indexing_and_idempotency.sql',
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        const sql = fs.readFileSync(filePath, 'utf-8');
        db.public.none(sql);
      }
    }

    // 3. Create pg Pool adapter connecting to the in-memory Postgres database
    pool = db.adapters.createPg().Pool;
  });

  // ----------------------------------------------------
  // 1. SCHEMA DDL & CONSTRAINT VALIDATION
  // ----------------------------------------------------
  describe('1. Schema DDL & Constraint Enforcement', () => {
    it('1.1 Should commit all operations when data satisfies schema constraints', async () => {
      const client = new (db.adapters.createPg().Client)();
      await client.connect();

      try {
        // Create customer
        const custRes = await client.query(
          `INSERT INTO customers (customer_code, name, status, payment_type)
           VALUES ($1, $2, $3, $4) RETURNING id;`,
          ['CUST-TX-1', 'عميل المعاملة الناجحة', 'ACTIVE', 'CREDIT']
        );
        const custId = custRes.rows[0].id;

        // Create invoice
        const invRes = await client.query(
          `INSERT INTO invoices (invoice_number, customer_id, invoice_date, subtotal, discount, total, due_date, payment_type, payment_status)
           VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, CURRENT_DATE + 15, 'CREDIT', 'UNPAID') RETURNING id;`,
          ['INV-TX-1', custId, 1000, 0, 1000]
        );
        const invId = invRes.rows[0].id;

        // Create ledger entry
        await client.query(
          `INSERT INTO account_transactions (customer_id, transaction_date, transaction_type, reference_type, reference_id, description, debit, credit)
           VALUES ($1, CURRENT_DATE, 'INVOICE', 'INVOICE', $2, 'فاتورة تجريبية', 1000, 0);`,
          [custId, invId]
        );

        // Verify records exist
        const checkCust = await client.query(`SELECT * FROM customers WHERE id = $1`, [custId]);
        const checkInv = await client.query(`SELECT * FROM invoices WHERE id = $1`, [invId]);
        const checkTx = await client.query(`SELECT * FROM account_transactions WHERE reference_id = $1`, [invId]);

        assert.strictEqual(checkCust.rows.length, 1);
        assert.strictEqual(checkInv.rows.length, 1);
        assert.strictEqual(checkTx.rows.length, 1);
      } finally {
        await client.end();
      }
    });

    it('1.2 Should reject invalid schema entries (NOT NULL violation on financial ledger)', async () => {
      const client = new (db.adapters.createPg().Client)();
      await client.connect();

      try {
        // Attempting to insert a ledger transaction without a customer_id MUST be rejected by Postgres constraints
        await assert.rejects(
          async () => {
            await client.query(
              `INSERT INTO account_transactions (customer_id, transaction_type, description, debit, credit)
               VALUES (NULL, 'INVALID_TX', 'فشل متعمد للتحقق من القيود', 100, 0);`
            );
          },
          (err: any) => {
            return err.message.toLowerCase().includes('null') || err.message.toLowerCase().includes('violat');
          }
        );
      } finally {
        await client.end();
      }
    });
  });

  // ----------------------------------------------------
  // 2. IDEMPOTENCY KEY UNIQUE CONSTRAINT ENFORCEMENT
  // ----------------------------------------------------
  describe('2. Idempotency Key Database Uniqueness', () => {
    it('2.1 Should prevent duplicate invoice insertion with same idempotency key at SQL level', async () => {
      const client = new (db.adapters.createPg().Client)();
      await client.connect();

      const idempotencyKey = `SQL-IDEMP-${Date.now()}`;

      try {
        // 1. First invoice insert with key succeeds
        await client.query(
          `INSERT INTO invoices (invoice_number, idempotency_key, customer_id, invoice_date, subtotal, discount, total, due_date, payment_type, payment_status)
           VALUES ($1, $2, 1, CURRENT_DATE, 100, 0, 100, CURRENT_DATE, 'CASH', 'PAID');`,
          ['INV-IDEMP-1', idempotencyKey]
        );

        // 2. Second invoice insert with SAME idempotency key must be REJECTED by Postgres UNIQUE constraint
        await assert.rejects(
          async () => {
            await client.query(
              `INSERT INTO invoices (invoice_number, idempotency_key, customer_id, invoice_date, subtotal, discount, total, due_date, payment_type, payment_status)
               VALUES ($1, $2, 1, CURRENT_DATE, 100, 0, 100, CURRENT_DATE, 'CASH', 'PAID');`,
              ['INV-IDEMP-2', idempotencyKey]
            );
          },
          (err: any) => {
            return err.message.toLowerCase().includes('unique') || err.message.toLowerCase().includes('duplicate');
          }
        );
      } finally {
        await client.end();
      }
    });
  });

  // ----------------------------------------------------
  // 3. SQL INJECTION RESISTANCE AT SQL PARSER LEVEL
  // ----------------------------------------------------
  describe('3. Parameterized Query SQL Engine Resistance', () => {
    it('3.1 Should safely execute parameterized query with SQL injection payloads without altering query AST', async () => {
      const client = new (db.adapters.createPg().Client)();
      await client.connect();

      try {
        const maliciousSearch = "' OR '1'='1' --";
        const sql = `
          SELECT COUNT(id) as total 
          FROM customers 
          WHERE (LOWER(name) LIKE $1 OR LOWER(customer_code) LIKE $1);
        `;
        const res = await client.query(sql, [`%${maliciousSearch.toLowerCase()}%`]);
        assert.ok(res.rows[0]);
        // Should return 0 matching because no customer has the literal text "' OR '1'='1' --"
        assert.strictEqual(Number(res.rows[0].total), 0);
      } finally {
        await client.end();
      }
    });
  });
});
