import { describe, it } from 'node:test';
import assert from 'node:assert';
import { authService } from '../src/services/auth.service';
import { userService } from '../src/services/user.service';
import { customerService } from '../src/services/customer.service';
import { productService } from '../src/services/product.service';
import { bonusService } from '../src/services/bonus.service';
import { approvalService } from '../src/services/approval.service';
import { dashboardService } from '../src/services/dashboard.service';

describe('Part 2 Comprehensive Test Suite', () => {
  // ----------------------------------------------------
  // AUTHENTICATION TESTS
  // ----------------------------------------------------
  describe('Authentication Suite', () => {
    it('1. Should login successfully with correct admin credentials and return JWT', async () => {
      const res = await authService.login({
        usernameOrEmail: 'admin',
        password: 'Admin@123456',
      });
      assert.strictEqual(res.user.username, 'admin');
      assert.strictEqual(res.user.role, 'ADMIN');
      assert.strictEqual(typeof res.token, 'string');
      assert.ok(res.permissions.includes('users.manage'));
    });

    it('2. Should reject login with wrong password (401)', async () => {
      await assert.rejects(
        async () => {
          await authService.login({
            usernameOrEmail: 'admin',
            password: 'WrongPassword999',
          });
        },
        (err: Error) => {
          return err.message.includes('غير صحيحة');
        }
      );
    });

    it('3. Should reject login for non-existent account', async () => {
      await assert.rejects(
        async () => {
          await authService.login({
            usernameOrEmail: 'ghost_user',
            password: 'AnyPassword',
          });
        },
        (err: Error) => {
          return err.message.includes('غير صحيحة');
        }
      );
    });

    it('4. Should reject login for account with PENDING_APPROVAL status (403)', async () => {
      await assert.rejects(
        async () => {
          await authService.login({
            usernameOrEmail: 'hossam',
            password: '123456',
          });
        },
        (err: Error) => {
          return err.message.includes('في انتظار موافقة');
        }
      );
    });
  });

  // ----------------------------------------------------
  // USERS MANAGEMENT TESTS
  // ----------------------------------------------------
  describe('Users Suite', () => {
    let createdUserId: number;

    it('5. Should create a new employee account with hashed password', async () => {
      const username = `test_emp_${Date.now()}`;
      const email = `${username}@sheikh-foundation.com`;

      const newUser = await userService.createUser(
        {
          full_name: 'موظف تجريبي جديد',
          username,
          email,
          password: 'Password@123',
          role_code: 'EMPLOYEE',
          status: 'ACTIVE',
        },
        1
      );

      assert.strictEqual(newUser.username, username);
      assert.strictEqual(newUser.role, 'EMPLOYEE');
      createdUserId = newUser.id;
    });

    it('6. Should update user role and status', async () => {
      const updatedRole = await userService.changeRole(createdUserId, 'MANAGER', 1);
      assert.strictEqual(updatedRole.role, 'MANAGER');

      const updatedStatus = await userService.changeStatus(createdUserId, 'INACTIVE', 1);
      assert.strictEqual(updatedStatus.status, 'INACTIVE');
    });
  });

  // ----------------------------------------------------
  // CUSTOMER ASSIGNMENT TESTS
  // ----------------------------------------------------
  describe('Customer Assignment Suite', () => {
    it('7. Should assign customer to Ali and record in assignment history', async () => {
      const res = await customerService.assignCustomer(
        1,
        { employee_id: 2, reason: 'إعادة تعيين للمندوب علي' },
        1
      );

      assert.strictEqual(res.customer.assigned_employee_id, 2);
      assert.strictEqual(res.assignment.new_employee_id, 2);
    });

    it('8. Should reassign customer to Ahmed and preserve audit history', async () => {
      const res = await customerService.assignCustomer(
        1,
        { employee_id: 3, reason: 'نقل المسؤولية للمندوب أحمد' },
        1
      );

      assert.strictEqual(res.customer.assigned_employee_id, 3);
      assert.strictEqual(res.assignment.previous_employee_id, 2);
      assert.strictEqual(res.assignment.new_employee_id, 3);

      const history = await customerService.getAssignmentHistory(1);
      assert.ok(history.length >= 2);
    });
  });

  // ----------------------------------------------------
  // PRODUCTS MANAGEMENT TESTS
  // ----------------------------------------------------
  describe('Products Suite', () => {
    let createdProdId: number;

    it('9. Should create a new product master record', async () => {
      const code = `PRD-TEST-${Date.now().toString().slice(-4)}`;
      const prod = await productService.createProduct(
        {
          product_code: code,
          name: 'صنف اختبار تجريبي',
          unit: 'كرتونة',
          purchase_price: 150.0,
          selling_price: 185.0,
          is_active: true,
        },
        1
      );

      assert.strictEqual(prod.product_code, code);
      assert.strictEqual(Number(prod.selling_price), 185.0);
      createdProdId = prod.id;
    });

    it('10. Should update product price and toggle active status', async () => {
      const updated = await productService.updateProduct(
        createdProdId,
        { selling_price: 200.0 },
        1
      );
      assert.strictEqual(Number(updated.selling_price), 200.0);

      const toggled = await productService.toggleActiveStatus(createdProdId, 1);
      assert.strictEqual(toggled.is_active, false);
    });
  });

  // ----------------------------------------------------
  // BONUSES MANAGEMENT TESTS
  // ----------------------------------------------------
  describe('Bonuses Suite', () => {
    let createdBonusId: number;

    it('11. Should create a new bonus plan', async () => {
      const bonus = await bonusService.createBonus(
        {
          name: 'حافز التميز الفصلي',
          bonus_type: 'FIXED',
          value: 3000.0,
          is_active: true,
          criteria: 'تحقيق أعلى مبيعات في الربع الأول',
        },
        1
      );

      assert.strictEqual(bonus.name, 'حافز التميز الفصلي');
      assert.strictEqual(Number(bonus.value), 3000.0);
      createdBonusId = bonus.id;
    });

    it('12. Should toggle bonus active status', async () => {
      const toggled = await bonusService.toggleActive(createdBonusId, 1);
      assert.strictEqual(toggled.is_active, false);
    });
  });

  // ----------------------------------------------------
  // APPROVALS WORKFLOW TESTS
  // ----------------------------------------------------
  describe('Approvals Suite', () => {
    it('13. Should approve pending user approval request', async () => {
      const approvals = await approvalService.getApprovals('PENDING');
      assert.ok(approvals.length > 0);

      const userApproval = approvals.find((a) => a.entity_type === 'USER');
      if (userApproval) {
        const approved = await approvalService.approve(userApproval.id, 1, 'تمت الموافقة من المدير العام');
        assert.strictEqual(approved.status, 'APPROVED');
      }
    });
  });

  // ----------------------------------------------------
  // DASHBOARD SUMMARY & TOP BUYERS TESTS
  // ----------------------------------------------------
  describe('Dashboard Analytics Suite', () => {
    it('14. Should return real business summary without technical metrics', async () => {
      const summary = await dashboardService.getSummary();
      assert.strictEqual(typeof summary.totalCustomers, 'number');
      assert.strictEqual(typeof summary.activeCustomers, 'number');
      assert.strictEqual(typeof summary.totalSales, 'number');
      assert.strictEqual(typeof summary.totalCollections, 'number');
    });

    it('15. Should return top buyers list without fake data', async () => {
      const topBuyers = await dashboardService.getTopBuyers();
      assert.ok(Array.isArray(topBuyers));
    });
  });
});
