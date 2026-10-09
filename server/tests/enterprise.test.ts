import { describe, it } from 'node:test';
import assert from 'node:assert';
import { roundMoney, calculateInvoiceTotals } from '../src/utils/money';
import { invoiceService } from '../src/services/invoice.service';
import { paymentService } from '../src/services/payment.service';
import { customerService } from '../src/services/customer.service';
import { customerRepository } from '../src/repositories/customer.repository';
import { invoiceRepository } from '../src/repositories/invoice.repository';
import { paymentRepository } from '../src/repositories/payment.repository';
import { statementRepository } from '../src/repositories/statement.repository';

describe('Enterprise-Grade System & Financial Engine Test Suite', () => {
  // ----------------------------------------------------
  // 1. FINANCIAL PRECISION & ROUNDING
  // ----------------------------------------------------
  describe('1. Financial Precision & Monetary Calculations', () => {
    it('1.1 Should accurately round floating point numbers to 2 decimals without IEEE-754 errors', () => {
      assert.strictEqual(roundMoney(0.1 + 0.2), 0.3);
      assert.strictEqual(roundMoney(10.005), 10.01);
      assert.strictEqual(roundMoney(10.004), 10.00);
      assert.strictEqual(roundMoney(199.999), 200.00);
      assert.strictEqual(roundMoney(null), 0.00);
    });

    it('1.2 Should correctly calculate invoice subtotals, item discounts, and final total', () => {
      const items = [
        { quantity: 3, unit_price: 100.50, discount: 1.50 }, // (3 * 100.5) - 1.5 = 300.00
        { quantity: 2, unit_price: 50.25, discount: 0.50 },  // (2 * 50.25) - 0.5 = 100.00
      ];
      const overallDiscount = 25.00;

      const calc = calculateInvoiceTotals(items, overallDiscount);
      assert.strictEqual(calc.subtotal, 402.00);
      assert.strictEqual(calc.totalDiscount, 27.00);
      assert.strictEqual(calc.total, 375.00);
    });
  });

  // ----------------------------------------------------
  // 2. INVOICE CREATION & ATOMIC FINANCIAL TRANSACTIONS
  // ----------------------------------------------------
  describe('2. Invoice Engine & Atomic Mutations', () => {
    let testCustomerId: number;
    let createdInvoiceId: number;

    it('2.1 Should create a customer for testing', async () => {
      const cust = await customerService.createCustomer(
        {
          customer_code: `TEST-CUST-${Date.now()}`,
          name: 'عميل اختبار المعاملات الذرية',
          trade_name: 'شركة الاختبار المالي',
          phone: '01012345678',
          payment_type: 'CREDIT',
          payment_terms_days: 15,
          credit_limit: 50000,
          status: 'ACTIVE',
          classification: 'A',
        },
        1
      );
      assert.ok(cust.id);
      testCustomerId = cust.id;
    });

    it('2.2 Should atomically create invoice and record debit in account ledger', async () => {
      const invoice = await invoiceService.createInvoice(
        {
          customer_id: testCustomerId,
          items: [
            { product_id: 1, quantity: 5, unit_price: 200, discount: 0 },
            { product_id: 2, quantity: 2, unit_price: 150, discount: 20 },
          ],
          discount: 50,
          payment_type: 'CREDIT',
          payment_terms_days: 15,
          notes: 'فاتورة اختبار المعاملات المحاسبية الموحدة',
        },
        1
      );

      assert.ok(invoice.id);
      assert.strictEqual(invoice.subtotal, 1300.00);
      assert.strictEqual(invoice.discount, 70.00);
      assert.strictEqual(invoice.total, 1230.00);
      assert.strictEqual(invoice.payment_status, 'UNPAID');
      createdInvoiceId = invoice.id;

      // Verify Account Statement
      const statement = await statementRepository.getStatement(testCustomerId);
      assert.ok(statement);
      assert.strictEqual(statement.summary.total_debit, 1230.00);
      assert.strictEqual(statement.summary.closing_balance, 1230.00);
    });

    it('2.3 Should reject invoice with discount exceeding subtotal', async () => {
      await assert.rejects(
        async () => {
          await invoiceService.createInvoice(
            {
              customer_id: testCustomerId,
              items: [{ product_id: 1, quantity: 1, unit_price: 100 }],
              discount: 500, // Exceeds 100
            },
            1
          );
        },
        (err: Error) => {
          return err.message.includes('الخصم الإجمالي');
        }
      );
    });

    it('2.4 Should support Idempotency Keys (prevent duplicate creation on retry)', async () => {
      const idempotencyKey = `IDEMP-${Date.now()}`;

      const inv1 = await invoiceRepository.create({
        idempotency_key: idempotencyKey,
        customer_id: testCustomerId,
        items: [{ product_id: 1, quantity: 1, unit_price: 500 }],
      });

      const inv2 = await invoiceRepository.create({
        idempotency_key: idempotencyKey,
        customer_id: testCustomerId,
        items: [{ product_id: 1, quantity: 1, unit_price: 500 }],
      });

      assert.strictEqual(inv1.id, inv2.id);
      assert.strictEqual(inv1.invoice_number, inv2.invoice_number);
    });

    it('2.5 Should reject conflicting idempotency request when same key is reused for materially different payload', async () => {
      const idempotencyKey = `IDEMP-CONFLICT-${Date.now()}`;

      await invoiceRepository.create({
        idempotency_key: idempotencyKey,
        customer_id: testCustomerId,
        items: [{ product_id: 1, quantity: 1, unit_price: 300 }],
      });

      await assert.rejects(
        async () => {
          await invoiceRepository.create({
            idempotency_key: idempotencyKey,
            customer_id: testCustomerId,
            items: [{ product_id: 1, quantity: 2, unit_price: 700 }], // Materially different total!
          });
        },
        (err: Error) => {
          return err.message.includes('IDEMPOTENCY_CONFLICT');
        }
      );
    });
  });

  // ----------------------------------------------------
  // 3. PAYMENTS & ALLOCATIONS LEDGER CONSISTENCY
  // ----------------------------------------------------
  describe('3. Payments Engine & Ledger Consistency', () => {
    it('3.1 Should record payment and allocate to invoice, updating ledger balance', async () => {
      const cust = await customerRepository.create({
        name: 'عميل تجربة التحصيل',
        customer_code: `PAY-CUST-${Date.now()}`,
        payment_type: 'CREDIT',
      });

      const inv = await invoiceRepository.create({
        customer_id: cust.id,
        items: [{ product_id: 1, quantity: 2, unit_price: 500 }], // total 1000
      });

      assert.strictEqual(inv.total, 1000);

      // Record partial payment of 400
      const payment1 = await paymentService.createPayment(
        {
          customer_id: cust.id,
          invoice_id: inv.id,
          amount: 400,
          payment_method: 'CASH',
          notes: 'دفعة أولى',
        },
        1
      );

      assert.ok(payment1.id);
      const invAfterPmt1 = await invoiceRepository.findById(inv.id);
      assert.strictEqual(invAfterPmt1?.payment_status, 'PARTIALLY_PAID');
      assert.strictEqual(invAfterPmt1?.paid_amount, 400);
      assert.strictEqual(invAfterPmt1?.remaining_amount, 600);

      // Record remaining payment of 600
      await paymentService.createPayment(
        {
          customer_id: cust.id,
          invoice_id: inv.id,
          amount: 600,
          payment_method: 'CASH',
          notes: 'تسوية باقي الفاتورة',
        },
        1
      );

      const invAfterPmt2 = await invoiceRepository.findById(inv.id);
      assert.strictEqual(invAfterPmt2?.payment_status, 'PAID');
      assert.strictEqual(invAfterPmt2?.paid_amount, 1000);
      assert.strictEqual(invAfterPmt2?.remaining_amount, 0);

      const statement = await statementRepository.getStatement(cust.id);
      assert.strictEqual(statement?.summary.total_debit, 1000);
      assert.strictEqual(statement?.summary.total_credit, 1000);
      assert.strictEqual(statement?.summary.closing_balance, 0);
    });

    it('3.2 Should update payment amount and date, reconciling ledger entry and invoice payment status', async () => {
      const cust = await customerRepository.create({
        name: 'عميل اختبار تعديل التحصيل',
        customer_code: `UPD-CUST-${Date.now()}`,
        payment_type: 'CREDIT',
      });

      const inv = await invoiceRepository.create({
        customer_id: cust.id,
        items: [{ product_id: 1, quantity: 1, unit_price: 1500 }],
      });

      // Create initial payment of 500
      const pmt = await paymentService.createPayment(
        {
          customer_id: cust.id,
          invoice_id: inv.id,
          amount: 500,
          payment_method: 'CASH',
        },
        1
      );

      const invInitial = await invoiceRepository.findById(inv.id);
      assert.strictEqual(invInitial?.payment_status, 'PARTIALLY_PAID');
      assert.strictEqual(invInitial?.paid_amount, 500);

      // Update payment to 1500 (full settlement)
      const updatedPmt = await paymentService.updatePayment(
        pmt.id,
        {
          amount: 1500,
          notes: 'تم تعديل السداد ليشمل كامل المبلغ',
        },
        1
      );

      assert.strictEqual(updatedPmt.amount, 1500);

      const invAfterUpdate = await invoiceRepository.findById(inv.id);
      assert.strictEqual(invAfterUpdate?.payment_status, 'PAID');
      assert.strictEqual(invAfterUpdate?.paid_amount, 1500);
      assert.strictEqual(invAfterUpdate?.remaining_amount, 0);

      const statement = await statementRepository.getStatement(cust.id);
      assert.strictEqual(statement?.summary.total_credit, 1500);
      assert.strictEqual(statement?.summary.closing_balance, 0);
    });

    it('3.3 Should delete payment and atomically reverse allocations, restoring invoice status to UNPAID', async () => {
      const cust = await customerRepository.create({
        name: 'عميل اختبار حذف التحصيل',
        customer_code: `DEL-CUST-${Date.now()}`,
        payment_type: 'CREDIT',
      });

      const inv = await invoiceRepository.create({
        customer_id: cust.id,
        items: [{ product_id: 1, quantity: 1, unit_price: 800 }],
      });

      const pmt = await paymentService.createPayment(
        {
          customer_id: cust.id,
          invoice_id: inv.id,
          amount: 800,
          payment_method: 'CASH',
        },
        1
      );

      const invPaid = await invoiceRepository.findById(inv.id);
      assert.strictEqual(invPaid?.payment_status, 'PAID');

      // Delete payment
      const deleteResult = await paymentService.deletePayment(pmt.id, 1);
      assert.strictEqual(deleteResult, true);

      // Verify invoice status reverted to UNPAID
      const invReverted = await invoiceRepository.findById(inv.id);
      assert.strictEqual(invReverted?.payment_status, 'UNPAID');
      assert.strictEqual(invReverted?.paid_amount, 0);
      assert.strictEqual(invReverted?.remaining_amount, 800);

      const statement = await statementRepository.getStatement(cust.id);
      assert.strictEqual(statement?.summary.total_credit, 0);
      assert.strictEqual(statement?.summary.closing_balance, 800);
    });

    it('3.4 Should reject payment when invoice belongs to another customer (Ownership Validation)', async () => {
      const custA = await customerRepository.create({
        name: 'عميل أ',
        customer_code: `CUST-A-${Date.now()}`,
      });
      const custB = await customerRepository.create({
        name: 'عميل ب',
        customer_code: `CUST-B-${Date.now()}`,
      });

      const invA = await invoiceRepository.create({
        customer_id: custA.id,
        items: [{ product_id: 1, quantity: 1, unit_price: 500 }],
      });

      // Customer B attempting to pay invoice of Customer A must be rejected
      await assert.rejects(
        async () => {
          await paymentService.createPayment(
            {
              customer_id: custB.id,
              invoice_id: invA.id,
              amount: 500,
              payment_method: 'CASH',
            },
            1
          );
        },
        (err: Error) => {
          return err.message.includes('لا تخص هذا العميل');
        }
      );
    });

    it('3.5 Should reject payment idempotency conflict when same key is reused for different amount', async () => {
      const cust = await customerRepository.create({
        name: 'عميل عدم تكرار السند',
        customer_code: `PMT-IDEMP-${Date.now()}`,
      });

      const key = `PMT-KEY-${Date.now()}`;

      const pmt1 = await paymentRepository.create({
        idempotency_key: key,
        customer_id: cust.id,
        amount: 300,
      });

      const pmt2 = await paymentRepository.create({
        idempotency_key: key,
        customer_id: cust.id,
        amount: 300,
      });

      assert.strictEqual(pmt1.id, pmt2.id);

      // Reusing key with different amount MUST throw conflict error
      await assert.rejects(
        async () => {
          await paymentRepository.create({
            idempotency_key: key,
            customer_id: cust.id,
            amount: 900,
          });
        },
        (err: Error) => {
          return err.message.includes('IDEMPOTENCY_CONFLICT');
        }
      );
    });
  });

  // ----------------------------------------------------
  // 4. SQL INJECTION RESISTANCE & PARAMETERIZATION
  // ----------------------------------------------------
  describe('4. SQL Injection Resistance', () => {
    it('4.1 Should handle malicious quotes and SQL injection payloads in customer search safely', async () => {
      const maliciousPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE customers; --",
        "admin'--",
        "' UNION SELECT * FROM users --",
        "1' OR '1' = '1' /*",
      ];

      for (const payload of maliciousPayloads) {
        const result = await customerRepository.findAll({
          search: payload,
          page: 1,
          limit: 10,
        });

        assert.ok(Array.isArray(result.data));
        assert.ok(typeof result.total === 'number');
      }
    });

    it('4.2 Should handle malicious search in invoices search safely', async () => {
      const result = await invoiceRepository.findAll({
        search: "' OR 1=1 --",
        page: 1,
        limit: 10,
      });

      assert.ok(Array.isArray(result.data));
      assert.ok(typeof result.total === 'number');
    });
  });

  // ----------------------------------------------------
  // 5. PAGINATION ACCURACY
  // ----------------------------------------------------
  describe('5. Pagination Totals & Bounds', () => {
    it('5.1 Should return correct total record count independent of limit', async () => {
      const resPage1 = await invoiceRepository.findAll({ page: 1, limit: 1 });
      const resPage2 = await invoiceRepository.findAll({ page: 2, limit: 1 });

      assert.strictEqual(resPage1.total, resPage2.total);
      if (resPage1.total >= 2) {
        assert.notStrictEqual(resPage1.data[0]?.id, resPage2.data[0]?.id);
      }
    });
  });
});
