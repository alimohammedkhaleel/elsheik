-- Migration: 006_advanced_query_indexes.sql
-- Description: Advanced indexes for the most expensive queries: dashboard, invoices list, payments, rep-bonuses, statements
-- Each index is CONCURRENTLY safe and idempotent (IF NOT EXISTS)

-- ============================================================
-- 1. INVOICES  — most queried table
-- ============================================================

-- invoice list filtered by employee + date (dashboard & employee view)
CREATE INDEX IF NOT EXISTS idx_invoices_employee_date
  ON invoices(employee_id, invoice_date DESC);

-- invoice list filtered by customer + date
CREATE INDEX IF NOT EXISTS idx_invoices_customer_date
  ON invoices(customer_id, invoice_date DESC);

-- invoice filtered by payment_status (UNPAID / PARTIAL / PAID)
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status_date
  ON invoices(payment_status, invoice_date DESC);

-- full-text search on invoice_number (prefix match)
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number_lower
  ON invoices(LOWER(invoice_number) varchar_pattern_ops);

-- idempotency look-up
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_idempotency_key
  ON invoices(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ============================================================
-- 2. PAYMENT_ALLOCATIONS — aggregated on every invoice list page
-- ============================================================

-- covering index: invoice_id → SUM(amount) without heap fetch
CREATE INDEX IF NOT EXISTS idx_pa_invoice_amount
  ON payment_allocations(invoice_id) INCLUDE (amount);

-- ============================================================
-- 3. ACCOUNT_TRANSACTIONS — opening balance & ledger
-- ============================================================

-- partial sum for opening balance (WHERE customer_id=$1 AND transaction_date < $2)
CREATE INDEX IF NOT EXISTS idx_acc_tx_cust_date_for_ob
  ON account_transactions(customer_id, transaction_date)
  INCLUDE (debit, credit);

-- dashboard total outstanding  SUM(debit-credit)
CREATE INDEX IF NOT EXISTS idx_acc_tx_debit_credit
  ON account_transactions(customer_id) INCLUDE (debit, credit);

-- ============================================================
-- 4. CUSTOMERS — dashboard filtered by assigned_employee
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_customers_employee_status
  ON customers(assigned_employee_id, status);

-- ============================================================
-- 5. PAYMENTS — dashboard total collections per employee
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_payments_customer_date
  ON payments(customer_id, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_payments_amount
  ON payments(customer_id) INCLUDE (amount);

-- ============================================================
-- 6. REP_BONUS_DEDUCTIONS — summaries and filters
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_rbd_rep_type_date
  ON rep_bonus_deductions(representative_id, type, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_rbd_date
  ON rep_bonus_deductions(transaction_date DESC);

-- ============================================================
-- 7. USERS — login look-up (critical hot path)
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower
  ON users(LOWER(username));

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower
  ON users(LOWER(email));

-- ============================================================
-- 8. APPROVAL_RECORDS — pending count (dashboard)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_approval_status
  ON approval_records(status)
  WHERE status = 'PENDING';
