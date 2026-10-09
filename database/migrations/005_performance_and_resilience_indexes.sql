-- Migration: 005_performance_and_resilience_indexes.sql
-- Description: Indexes and optimizations for high concurrency, zero deadlocks, and millions of transactions

-- 1. Invoice Items Indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id 
  ON invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id 
  ON invoice_items(product_id);

-- 2. Payment Allocations Indexes
CREATE INDEX IF NOT EXISTS idx_payment_allocations_inv_pmt 
  ON payment_allocations(invoice_id, payment_id);

-- 3. Account Transactions Index for Ledger & Statements
CREATE INDEX IF NOT EXISTS idx_acc_tx_ref 
  ON account_transactions(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_acc_tx_cust_date_asc 
  ON account_transactions(customer_id, transaction_date ASC, id ASC);

-- 4. Customer Interactions Index
CREATE INDEX IF NOT EXISTS idx_cust_interactions_cust_type_date 
  ON customer_interactions(customer_id, interaction_type, interaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_cust_interactions_emp_date 
  ON customer_interactions(employee_id, interaction_date DESC);

-- 5. Products Index
CREATE INDEX IF NOT EXISTS idx_products_active_name 
  ON products(is_active, name);

-- 6. Users Performance Index
CREATE INDEX IF NOT EXISTS idx_users_role_status 
  ON users(role_code, status);
