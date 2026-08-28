-- Migration: 001_create_part2_tables.sql
-- Description: Core Schema for Users, RBAC, Approvals, Customer Assignments, Products, Bonuses, and Audit Logs

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  module VARCHAR(50) NOT NULL,
  description TEXT
);

-- 3. Role Permissions Mapping
CREATE TABLE IF NOT EXISTS role_permissions (
  role_code VARCHAR(50) NOT NULL REFERENCES roles(code) ON DELETE CASCADE,
  permission_code VARCHAR(100) NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
  PRIMARY KEY (role_code, permission_code)
);

-- 4. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  job_title VARCHAR(100),
  role_code VARCHAR(50) NOT NULL REFERENCES roles(code) ON UPDATE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'REJECTED')),
  rejection_reason TEXT,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role_code, status);

-- 5. Customers Foundation Table (Master records for assignment & distribution)
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  trade_name VARCHAR(200),
  phone VARCHAR(50),
  city VARCHAR(100),
  address TEXT,
  credit_limit NUMERIC(14, 2) DEFAULT 0.00,
  assigned_employee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_assigned_employee ON customers(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);

-- 6. Customer Assignments Audit History
CREATE TABLE IF NOT EXISTS customer_assignments (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  previous_employee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  new_employee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_customer_assignments_customer ON customer_assignments(customer_id);

-- 7. Products Master Table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  product_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  unit VARCHAR(50) DEFAULT 'قطعة',
  purchase_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  selling_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- 8. Bonuses & Incentives Foundation Table
CREATE TABLE IF NOT EXISTS bonuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  bonus_type VARCHAR(50) NOT NULL DEFAULT 'FIXED' CHECK (bonus_type IN ('FIXED', 'PERCENTAGE', 'TARGET_BASED')),
  value NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  criteria TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Approval Records Table (State machine for employee accounts and business submissions)
CREATE TABLE IF NOT EXISTS approval_records (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('USER', 'CUSTOMER', 'DATA', 'VISIT', 'PAYMENT', 'INVOICE')),
  entity_id INTEGER NOT NULL,
  submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW')),
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_approvals_status ON approval_records(status);
CREATE INDEX IF NOT EXISTS idx_approvals_entity ON approval_records(entity_type, entity_id);

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
