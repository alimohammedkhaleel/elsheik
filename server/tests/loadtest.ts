import { invoiceService } from '../src/services/invoice.service';
import { paymentService } from '../src/services/payment.service';
import { customerRepository } from '../src/repositories/customer.repository';
import { statementRepository } from '../src/repositories/statement.repository';

interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  durationMs: number;
  rps: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
}

const runLoadTest = async (): Promise<void> => {
  console.log('================================================================');
  console.log('🚀 Starting Sheikh Distribution System Concurrency Load Test...');
  console.log('================================================================');

  // 1. Setup Staging Customer
  const cust = await customerRepository.create({
    name: 'عميل اختبار الأحمال المتزامنة',
    customer_code: `LOAD-TEST-${Date.now()}`,
    payment_type: 'CREDIT',
  });

  const CONCURRENCY = 25;
  const BATCH_COUNT = 4;
  const TOTAL_OPERATIONS = CONCURRENCY * BATCH_COUNT;

  console.log(`Simulating ${TOTAL_OPERATIONS} concurrent financial operations across ${CONCURRENCY} virtual threads...`);

  const latencies: number[] = [];
  let successful = 0;
  let failed = 0;

  const startTime = Date.now();

  for (let b = 0; b < BATCH_COUNT; b++) {
    const promises = Array.from({ length: CONCURRENCY }).map(async (_, idx) => {
      const opStart = Date.now();
      try {
        const itemPrice = 100 + (idx % 10) * 10;
        const inv = await invoiceService.createInvoice(
          {
            customer_id: cust.id,
            items: [{ product_id: 1, quantity: 2, unit_price: itemPrice }],
            discount: 0,
            payment_type: 'CREDIT',
            notes: `Load test invoice batch ${b} item ${idx}`,
          },
          1
        );

        // Instantly record a partial payment of 50%
        await paymentService.createPayment(
          {
            customer_id: cust.id,
            invoice_id: inv.id,
            amount: inv.total * 0.5,
            payment_method: 'CASH',
            notes: `Load test payment for invoice ${inv.invoice_number}`,
          },
          1
        );

        successful++;
      } catch (err) {
        failed++;
      } finally {
        latencies.push(Date.now() - opStart);
      }
    });

    await Promise.all(promises);
  }

  const durationMs = Date.now() - startTime;
  latencies.sort((a, b) => a - b);

  const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / (latencies.length || 1);
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const minLatency = latencies[0] || 0;
  const maxLatency = latencies[latencies.length - 1] || 0;
  const rps = Math.round((TOTAL_OPERATIONS / (durationMs / 1000)) * 100) / 100;

  console.log('\n📊 LOAD TEST RESULTS SUMMARY:');
  console.log('----------------------------------------------------------------');
  console.log(`Total Concurrent Operations: ${TOTAL_OPERATIONS}`);
  console.log(`Successful Operations:       ${successful}`);
  console.log(`Failed Operations:           ${failed}`);
  console.log(`Total Test Duration:         ${durationMs} ms`);
  console.log(`Throughput (RPS):            ${rps} ops/sec`);
  console.log(`Average Latency:             ${avgLatency.toFixed(2)} ms`);
  console.log(`p95 Latency:                 ${p95Latency} ms`);
  console.log(`Min Latency:                 ${minLatency} ms`);
  console.log(`Max Latency:                 ${maxLatency} ms`);

  // 2. Validate Financial Ledger Integrity after massive concurrent writes
  const statement = await statementRepository.getStatement(cust.id);
  console.log('\n🏦 FINANCIAL INTEGRITY AUDIT AFTER CONCURRENT WRITES:');
  console.log('----------------------------------------------------------------');
  console.log(`Total Recorded Invoices (Debits):  ${statement?.summary.total_debit.toFixed(2)} EGP`);
  console.log(`Total Recorded Payments (Credits): ${statement?.summary.total_credit.toFixed(2)} EGP`);
  console.log(`Final Customer Closing Balance:    ${statement?.summary.closing_balance.toFixed(2)} EGP`);
  console.log(`Ledger Transactions Count:         ${statement?.summary.transaction_count}`);

  const expectedBalance = (statement?.summary.total_debit || 0) - (statement?.summary.total_credit || 0);
  const balanceDiff = Math.abs((statement?.summary.closing_balance || 0) - expectedBalance);

  if (balanceDiff < 0.001) {
    console.log('✅ PERFECT FINANCIAL CONSISTENCY: Closing balance strictly matches (Debits - Credits).');
  } else {
    console.error('❌ FINANCIAL IMBALANCE DETECTED! Difference:', balanceDiff);
    process.exit(1);
  }

  console.log('================================================================');
};

runLoadTest().catch((err) => {
  console.error('Load test encountered fatal error:', err);
  process.exit(1);
});
