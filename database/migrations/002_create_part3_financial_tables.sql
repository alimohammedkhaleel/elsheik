-- Migration: 002_create_part3_financial_tables.sql
-- Description: Financial Engine, Invoices, Items, Payments, Allocations, Account Transactions, and Customer Extensions

-- 1. Extend Customers table if columns don't exist
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'CASH' CHECK (payment_type IN ('CASH', 'CREDIT')),
  ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS classification VARCHAR(10) DEFAULT 'B' CHECK (classification IN ('A', 'B', 'C')),
  ADD COLUMN IF NOT EXISTS has_app BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_classification ON customers(classification);
CREATE INDEX IF NOT EXISTS idx_customers_payment_type ON customers(payment_type);

-- 2. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  employee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  payment_type VARCHAR(20) NOT NULL DEFAULT 'CASH' CHECK (payment_type IN ('CASH', 'CREDIT')),
  due_date DATE NOT NULL,
  payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('PAID', 'PARTIALLY_PAID', 'UNPAID', 'OVERDUE')),
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_employee ON invoices(employee_id);

-- 3. Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
  unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
  discount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
  total NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON invoice_items(product_id);

-- 4. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  receipt_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'WALLET', 'NSP', 'BANK_TRANSFER', 'OTHER')),
  collected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_collected_by ON payments(collected_by);

-- 5. Payment Allocations Table
CREATE TABLE IF NOT EXISTS payment_allocations (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_invoice ON payment_allocations(invoice_id);

-- 6. Account Transactions Table (Single Source of Truth for Balance)
CREATE TABLE IF NOT EXISTS account_transactions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('INVOICE', 'PAYMENT', 'RETURN', 'DISCOUNT', 'ADJUSTMENT')),
  reference_type VARCHAR(30) NOT NULL CHECK (reference_type IN ('INVOICE', 'PAYMENT', 'ADJUSTMENT', 'MANUAL')),
  reference_id INTEGER,
  description TEXT NOT NULL,
  debit NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (debit >= 0),
  credit NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (credit >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_customer ON account_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON account_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON account_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON account_transactions(reference_type, reference_id);
