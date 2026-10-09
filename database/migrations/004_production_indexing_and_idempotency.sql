-- Migration: 004_production_indexing_and_idempotency.sql
-- Description: Composite Indexes, Idempotency Keys, and Performance Optimizations for Millions of Records

-- 1. Idempotency Key for Invoices (Protects against duplicate network submissions)
ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_idempotency 
  ON invoices(idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- 2. Idempotency Key for Payments / Receipts
ALTER TABLE payments 
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency 
  ON payments(idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- 3. Composite Indexes for Invoices (Optimizes filtered pagination & reporting)
CREATE INDEX IF NOT EXISTS idx_invoices_customer_date 
  ON invoices(customer_id, invoice_date DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_status_date 
  ON invoices(payment_status, invoice_date DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_employee_date 
  ON invoices(employee_id, invoice_date DESC);

-- 4. Composite Indexes for Payments
CREATE INDEX IF NOT EXISTS idx_payments_customer_date 
  ON payments(customer_id, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_payments_collector_date 
  ON payments(collected_by, payment_date DESC);

-- 5. Composite Indexes for Account Ledger (Single Source of Truth)
CREATE INDEX IF NOT EXISTS idx_transactions_cust_date 
  ON account_transactions(customer_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_type_date 
  ON account_transactions(transaction_type, transaction_date DESC);

-- 6. Customers Search Indexes
CREATE INDEX IF NOT EXISTS idx_customers_assigned_status 
  ON customers(assigned_employee_id, status);

CREATE INDEX IF NOT EXISTS idx_customers_classification_status 
  ON customers(classification, status);
