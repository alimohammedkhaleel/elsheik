import { paymentRepository } from '../repositories/payment.repository';
import { customerRepository } from '../repositories/customer.repository';
import { invoiceRepository } from '../repositories/invoice.repository';
import { auditService } from './audit.service';
import { AppError } from '../middleware/errorHandler';
import { Payment, CreatePaymentInput, PaymentFilterOptions } from '../types/payment.types';
import { UserRole } from '../types/user.types';

export class PaymentService {
  async getPayments(
    options?: PaymentFilterOptions,
    actor?: { role: UserRole; userId: number }
  ): Promise<{ data: Payment[]; total: number }> {
    return paymentRepository.findAll(options, actor);
  }

  async getPaymentById(id: number, actor?: { role: UserRole; userId: number }): Promise<Payment> {
    const payment = await paymentRepository.findById(id);
    if (!payment) {
      throw new AppError('سند التحصيل غير موجود', 404, 'PAYMENT_NOT_FOUND');
    }

    if (actor && (actor.role === 'EMPLOYEE' || actor.role === 'COLLECTOR')) {
      const customer = await customerRepository.findById(payment.customer_id, actor);
      if (!customer) {
        throw new AppError('ليس لديك الصلاحية للوصول إلى هذا السند', 403, 'FORBIDDEN');
      }
    }

    return payment;
  }

  async createPayment(input: CreatePaymentInput, actorId: number): Promise<Payment> {
    if (!input.customer_id) {
      throw new AppError('يرجى تحديد العميل', 400, 'VALIDATION_ERROR');
    }

    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new AppError('مبلغ التحصيل يجب أن يكون قيمة موجبة أكبر من الصفر', 400, 'INVALID_AMOUNT');
    }

    // Verify customer exists
    const customer = await customerRepository.findById(input.customer_id);
    if (!customer) {
      throw new AppError('العميل المحدد غير موجود', 404, 'CUSTOMER_NOT_FOUND');
    }

    if (input.receipt_number) {
      const existing = await paymentRepository.findByReceipt(input.receipt_number.trim());
      if (existing) {
        throw new AppError('رقم إيصال / سند القبض مستخدم بالفعل', 400, 'DUPLICATE_RECEIPT_NUMBER');
      }
    }

    // If invoice specified, verify invoice
    if (input.invoice_id) {
      const invoice = await invoiceRepository.findById(input.invoice_id);
      if (!invoice) {
        throw new AppError('الفاتورة المحددة غير موجودة', 404, 'INVOICE_NOT_FOUND');
      }
      if (invoice.customer_id !== input.customer_id) {
        throw new AppError('الفاتورة المحددة لا تخص هذا العميل', 400, 'INVOICE_CUSTOMER_MISMATCH');
      }
    }

    const created = await paymentRepository.create(input, actorId);

    await auditService.record({
      user_id: actorId,
      action: 'PAYMENT_RECORDED',
      entity_type: 'PAYMENT',
      entity_id: created.id,
      new_values: {
        receipt_number: created.receipt_number,
        customer_id: created.customer_id,
        amount: created.amount,
        payment_method: created.payment_method,
      },
    });

    return created;
  }

  async updatePayment(id: number, input: Partial<CreatePaymentInput>, actorId: number): Promise<Payment> {
    const existing = await paymentRepository.findById(id);
    if (!existing) {
      throw new AppError('سند التحصيل غير موجود', 404, 'PAYMENT_NOT_FOUND');
    }

    const updated = await paymentRepository.update(id, input);
    if (!updated) {
      throw new AppError('فشل تعديل سند التحصيل', 500, 'UPDATE_FAILED');
    }

    await auditService.record({
      user_id: actorId,
      action: 'PAYMENT_UPDATED',
      entity_type: 'PAYMENT',
      entity_id: id,
      old_values: { amount: existing.amount, notes: existing.notes },
      new_values: { ...input },
    });

    return updated;
  }

  async deletePayment(id: number, actorId: number): Promise<boolean> {
    const existing = await paymentRepository.findById(id);
    if (!existing) {
      throw new AppError('سند التحصيل غير موجود', 404, 'PAYMENT_NOT_FOUND');
    }

    const deleted = await paymentRepository.delete(id);
    if (!deleted) {
      throw new AppError('فشل حذف سند التحصيل', 500, 'DELETE_FAILED');
    }

    await auditService.record({
      user_id: actorId,
      action: 'PAYMENT_DELETED',
      entity_type: 'PAYMENT',
      entity_id: id,
      old_values: { receipt_number: existing.receipt_number, amount: existing.amount, customer_id: existing.customer_id },
    });

    return true;
  }
}

export const paymentService = new PaymentService();
