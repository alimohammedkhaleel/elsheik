-- Migration: 003_final_production_enhancements.sql
-- Description: Customer Portal Linkage, Multi-role Customer Assignments, Rep Bonus/Deduction Transactions, Interactions, and System Notifications

-- 1. Ensure CUSTOMER role exists
INSERT INTO roles (code, name, description)
VALUES 
  ('CUSTOMER', 'عميل المنظومة', 'الوصول إلى بوابة العملاء المخصصة للاطلاع على كشف الحساب والفواتير والمسحوبات الخاصة به فقط')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 2. Link Users to Customer record (Strict 1-to-1 or N-to-1 account binding for Portal)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users(customer_id);

-- 3. Extend Customers table for Multi-Representative Assignments
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS accountant_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS follow_up_employee_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_accountant ON customers(accountant_id);
CREATE INDEX IF NOT EXISTS idx_customers_follow_up ON customers(follow_up_employee_id);

-- 4. Extend Customer Assignments Audit for specific assignment types
ALTER TABLE customer_assignments 
  ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(50) DEFAULT 'SALES_REP' CHECK (assignment_type IN ('SALES_REP', 'ACCOUNTANT', 'FOLLOW_UP'));

-- 5. Real Bonus & Deduction Transactions Engine for Representatives
CREATE TABLE IF NOT EXISTS rep_bonus_deductions (
  id SERIAL PRIMARY KEY,
  representative_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('BONUS', 'DEDUCTION')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rep_bonus_rep ON rep_bonus_deductions(representative_id);
CREATE INDEX IF NOT EXISTS idx_rep_bonus_date ON rep_bonus_deductions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_rep_bonus_type ON rep_bonus_deductions(type);

-- 6. Customer Interactions Tracking (Visits, Phone Calls, Follow-ups, Notes)
CREATE TABLE IF NOT EXISTS customer_interactions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('VISIT', 'CALL', 'NOTE', 'FOLLOW_UP')),
  interaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'COMPLETED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interactions_customer ON customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_interactions_employee ON customer_interactions(employee_id);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON customer_interactions(interaction_date);

-- 7. System Notifications Engine
CREATE TABLE IF NOT EXISTS system_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'INFO' CHECK (type IN ('INFO', 'WARNING', 'SUCCESS', 'ALERT')),
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON system_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON system_notifications(created_at DESC);
