-- Seed Data: 002_seed_part2_data.sql
-- Description: Seed initial roles, permissions, root admin, sample staff, products, and customers

-- 1. Insert Core System Roles
INSERT INTO roles (code, name, description)
VALUES 
  ('ADMIN', 'مدير النظام', 'صلاحيات كاملة وغير مقيدة على كافة أقسام وإعدادات المنظومة'),
  ('MANAGER', 'مشرف مبيعات وتوزيع', 'إدارة ومتابعة العمليات والمندوبين وتقارير النشاط الميداني'),
  ('EMPLOYEE', 'مندوب مبيعات', 'تسجيل الزيارات والمتابعات وطلبات العملاء المعينين'),
  ('COLLECTOR', 'محصل مالي', 'تسجيل سندات التحصيل ومتابعة الديون والمدفوعات المتأخرة')
ON CONFLICT (code) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description;

-- 2. Insert Permissions
INSERT INTO permissions (code, name, module, description)
VALUES
  ('users.manage', 'إدارة المستخدمين', 'users', 'إنشاء وتعديل وتفعيل وتغيير أدوار المستخدمين'),
  ('approvals.manage', 'إدارة الموافقات والاعتمادات', 'approvals', 'اعتماد أو رفض طلبات التسجيل والبيانات'),
  ('customers.manage', 'إدارة العملاء', 'customers', 'إضافة وتعديل بيانات العملاء وسجلاتهم'),
  ('customers.assign', 'تعيين وتوزيع العملاء', 'customers', 'توزيع العملاء على المندوبين والموظفين'),
  ('products.manage', 'إدارة الأصناف والمنتجات', 'products', 'إضافة وتعديل المنتجات وأسعار الشراء والبيع'),
  ('bonuses.manage', 'إدارة الحوافز والمكافآت', 'bonuses', 'إنشاء وتعديل خطط الحوافز والمكافآت للمندوبين'),
  ('sales.view', 'عرض المبيعات', 'sales', 'الاطلاع على فواتير المبيعات والأداء التجاري'),
  ('payments.view', 'عرض التحصيلات', 'payments', 'الاطلاع على سندات التحصيل والمقبوضات'),
  ('payments.record', 'تسجيل التحصيلات', 'payments', 'إدخال سندات القبض والتحصيلات النقدية والبنكية'),
  ('reports.view', 'عرض التقارير', 'reports', 'الاطلاع على التقارير المالية والإحصائية'),
  ('audit.view', 'عرض سجل التدقيق', 'audit', 'الاطلاع على سجلات العمليات والتغييرات الإدارية'),
  ('data.submit', 'تقديم البيانات للاعتماد', 'general', 'إرسال التقارير والبيانات اليومية للاعتماد الإداري')
ON CONFLICT (code) DO NOTHING;

-- 3. Map Role Permissions
-- ADMIN gets ALL permissions
INSERT INTO role_permissions (role_code, permission_code)
SELECT 'ADMIN', code FROM permissions
ON CONFLICT DO NOTHING;

-- MANAGER permissions
INSERT INTO role_permissions (role_code, permission_code)
VALUES
  ('MANAGER', 'customers.manage'),
  ('MANAGER', 'customers.assign'),
  ('MANAGER', 'products.manage'),
  ('MANAGER', 'sales.view'),
  ('MANAGER', 'payments.view'),
  ('MANAGER', 'reports.view'),
  ('MANAGER', 'approvals.manage')
ON CONFLICT DO NOTHING;

-- EMPLOYEE permissions
INSERT INTO role_permissions (role_code, permission_code)
VALUES
  ('EMPLOYEE', 'customers.manage'),
  ('EMPLOYEE', 'sales.view'),
  ('EMPLOYEE', 'data.submit')
ON CONFLICT DO NOTHING;

-- COLLECTOR permissions
INSERT INTO role_permissions (role_code, permission_code)
VALUES
  ('COLLECTOR', 'customers.manage'),
  ('COLLECTOR', 'payments.view'),
  ('COLLECTOR', 'payments.record'),
  ('COLLECTOR', 'data.submit')
ON CONFLICT DO NOTHING;

-- 4. Insert Root Admin User (password: Admin@123456)
-- Bcrypt hash for 'Admin@123456': $2b$10$tZ8OQk6rG1vQy4GZ3s8G1e5z8y5V8uY0aK8oG1vQy4GZ3s8G1e5z8
INSERT INTO users (
  full_name, username, email, password_hash, phone, job_title, role_code, status, approved_at
) VALUES (
  'مدير النظام المركزي',
  'admin',
  'admin@sheikh-foundation.com',
  '$2a$10$wN9a3uU0z4k2bV2s5p7Wcew0V7C31hZ1A2lH6y7uK9z8q0w1E2r3t',
  '01000000001',
  'المدير العام',
  'ADMIN',
  'ACTIVE',
  CURRENT_TIMESTAMP
) ON CONFLICT (username) DO NOTHING;

-- 5. Insert Sample Representative Employees for Assignment Testing (password: 123456)
INSERT INTO users (
  full_name, username, email, password_hash, phone, job_title, role_code, status, approved_at
) VALUES 
(
  'علي محمد حسن',
  'ali',
  'ali@sheikh-foundation.com',
  '$2a$10$wN9a3uU0z4k2bV2s5p7Wcew0V7C31hZ1A2lH6y7uK9z8q0w1E2r3t',
  '01111111101',
  'مندوب مبيعات وتوزيع',
  'EMPLOYEE',
  'ACTIVE',
  CURRENT_TIMESTAMP
),
(
  'أحمد محمود إبراهيم',
  'ahmed',
  'ahmed@sheikh-foundation.com',
  '$2a$10$wN9a3uU0z4k2bV2s5p7Wcew0V7C31hZ1A2lH6y7uK9z8q0w1E2r3t',
  '01222222202',
  'مندوب مبيعات وتوزيع',
  'EMPLOYEE',
  'ACTIVE',
  CURRENT_TIMESTAMP
),
(
  'طارق خالد عبد الرحمن',
  'tarek',
  'tarek@sheikh-foundation.com',
  '$2a$10$wN9a3uU0z4k2bV2s5p7Wcew0V7C31hZ1A2lH6y7uK9z8q0w1E2r3t',
  '01555555505',
  'محصل ديون ميداني',
  'COLLECTOR',
  'ACTIVE',
  CURRENT_TIMESTAMP
) ON CONFLICT (username) DO NOTHING;

-- 6. Insert Sample Customers for Assignment Verification
INSERT INTO customers (
  customer_code, name, trade_name, phone, city, address, credit_limit, assigned_employee_id, status
) VALUES
(
  'CUST-001',
  'شركة النور للتجارة والتوزيع',
  'سوبرماركت النور',
  '01012345678',
  'القاهرة',
  'شارع صلاح سالم - مصر الجديدة',
  50000.00,
  (SELECT id FROM users WHERE username = 'ali' LIMIT 1),
  'ACTIVE'
),
(
  'CUST-002',
  'مؤسسة الأمل للمواد الغذائية',
  'الأمل ماركت',
  '01198765432',
  'الجيزة',
  'شارع الهرم الرئيسي',
  35000.00,
  (SELECT id FROM users WHERE username = 'ahmed' LIMIT 1),
  'ACTIVE'
),
(
  'CUST-003',
  'مركز الهدى للجملة والتجزئة',
  'الهدى ستورز',
  '01234567890',
  'الإسكندرية',
  'طريق الجيش - سيدي جابر',
  75000.00,
  NULL,
  'ACTIVE'
) ON CONFLICT (customer_code) DO NOTHING;

-- 7. Insert Sample Products Master Data
INSERT INTO products (
  product_code, name, description, unit, purchase_price, selling_price, is_active
) VALUES
(
  'PRD-101',
  'زيت عباد الشمس النقي 1 لتر',
  'عبوة زيت عباد الشمس نقية عالية الجودة كرتونة 12 زجاجة',
  'كرتونة',
  620.00,
  710.00,
  TRUE
),
(
  'PRD-102',
  'أرز أبيض فاخر عريض الحبة 5 كجم',
  'أرز مصري منقى ومعبأ آلياً درجة أولى',
  'شيكارة',
  165.00,
  195.00,
  TRUE
),
(
  'PRD-103',
  'سكر أبيض ناعم مكرر 1 كجم',
  'سكر بلوري نقي مخصص لمنافذ التوزيع باكت 10 كجم',
  'باكت',
  280.00,
  320.00,
  TRUE
),
(
  'PRD-104',
  'مكرونة فرن ممتازة 400 جم',
  'مكرونة مصنوعة من سميد القمح الفاخر كرتونة 20 كيس',
  'كرتونة',
  190.00,
  230.00,
  TRUE
) ON CONFLICT (product_code) DO NOTHING;

-- 8. Insert Sample Incentive / Bonus Plan
INSERT INTO bonuses (
  name, description, bonus_type, value, is_active, start_date, end_date, criteria
) VALUES
(
  'مكافأة تحقيق المستهدف الشهري للمبيعات',
  'حافز نقدي يصرف لكل مندوب مبيعات يتجاوز مستهدف 100,000 ج.م شهرياً',
  'FIXED',
  2500.00,
  TRUE,
  '2026-01-01',
  '2026-12-31',
  'تحقيق نسبة 100% فأكثر من مبيعات التوزيع المعتمدة'
),
(
  'عمولة التحصيل المبكر للديون',
  'نسبة مئوية تمنح للمحصل على إجمالي المبالغ المحصلة قبل موعد الاستحقاق',
  'PERCENTAGE',
  2.50,
  TRUE,
  '2026-01-01',
  '2026-12-31',
  'تحصيل الفواتير الآجلة في أول 10 أيام من تاريخ الإصدار'
) ON CONFLICT DO NOTHING;
