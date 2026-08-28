import { invoiceRepository } from '../repositories/invoice.repository';
import { customerRepository } from '../repositories/customer.repository';
import { productRepository } from '../repositories/product.repository';
import { auditService } from './audit.service';
import { AppError } from '../middleware/errorHandler';
import { Invoice, CreateInvoiceInput, InvoiceFilterOptions } from '../types/invoice.types';
import { UserRole } from '../types/user.types';

export class InvoiceService {
  async getInvoices(
    options?: InvoiceFilterOptions,
    actor?: { role: UserRole; userId: number }
  ): Promise<{ data: Invoice[]; total: number }> {
    return invoiceRepository.findAll(options, actor);
  }

  async getInvoiceById(id: number, actor?: { role: UserRole; userId: number }): Promise<Invoice> {
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) {
      throw new AppError('الفاتورة غير موجودة', 404, 'INVOICE_NOT_FOUND');
    }

    if (actor && (actor.role === 'EMPLOYEE' || actor.role === 'COLLECTOR')) {
      const customer = await customerRepository.findById(invoice.customer_id, actor);
      if (!customer) {
        throw new AppError('ليس لديك الصلاحية للوصول إلى هذه الفاتورة', 403, 'FORBIDDEN');
      }
    }

    return invoice;
  }

  async createInvoice(input: CreateInvoiceInput, actorId: number): Promise<Invoice> {
    if (!input.customer_id) {
      throw new AppError('يرجى تحديد العميل', 400, 'VALIDATION_ERROR');
    }

    if (!input.items || input.items.length === 0) {
      throw new AppError('يجب أن تحتوي الفاتورة على صنف واحد على الأقل', 400, 'EMPTY_INVOICE_ITEMS');
    }

    // Verify customer exists
    const customer = await customerRepository.findById(input.customer_id);
    if (!customer) {
      throw new AppError('العميل المحدد غير موجود', 404, 'CUSTOMER_NOT_FOUND');
    }

    if (input.invoice_number) {
      const existing = await invoiceRepository.findByNumber(input.invoice_number.trim());
      if (existing) {
        throw new AppError('رقم الفاتورة مستخدم بالفعل', 400, 'DUPLICATE_INVOICE_NUMBER');
      }
    }

    // Verify and load product unit prices if not passed
    for (const item of input.items) {
      if (item.quantity <= 0) {
        throw new AppError('الكمية يجب أن تكون أكبر من الصفر', 400, 'INVALID_QUANTITY');
      }
      const product = await productRepository.findById(item.product_id);
      if (!product) {
        throw new AppError(`المنتج رقم #${item.product_id} غير موجود`, 404, 'PRODUCT_NOT_FOUND');
      }
      if (item.unit_price === undefined || item.unit_price === null) {
        item.unit_price = Number(product.selling_price);
      }
    }

    // Inherit customer payment type if not specified
    if (!input.payment_type) {
      input.payment_type = customer.payment_type;
    }
    if (input.payment_terms_days === undefined) {
      input.payment_terms_days = customer.payment_terms_days;
    }

    const created = await invoiceRepository.create(input, actorId);

    await auditService.record({
      user_id: actorId,
      action: 'INVOICE_CREATED',
      entity_type: 'INVOICE',
      entity_id: created.id,
      new_values: {
        invoice_number: created.invoice_number,
        customer_id: created.customer_id,
        total: created.total,
        payment_type: created.payment_type,
        due_date: created.due_date,
      },
    });

    return created;
  }

  async updateInvoice(id: number, input: Partial<CreateInvoiceInput>, actorId: number): Promise<Invoice> {
    const existing = await invoiceRepository.findById(id);
    if (!existing) {
      throw new AppError('الفاتورة غير موجودة', 404, 'INVOICE_NOT_FOUND');
    }

    const updated = await invoiceRepository.update(id, input);
    if (!updated) {
      throw new AppError('فشل تعديل الفاتورة', 500, 'UPDATE_FAILED');
    }

    await auditService.record({
      user_id: actorId,
      action: 'INVOICE_UPDATED',
      entity_type: 'INVOICE',
      entity_id: id,
      old_values: { invoice_number: existing.invoice_number, notes: existing.notes },
      new_values: { ...input },
    });

    return updated;
  }

  async deleteInvoice(id: number, actorId: number): Promise<boolean> {
    const existing = await invoiceRepository.findById(id);
    if (!existing) {
      throw new AppError('الفاتورة غير موجودة', 404, 'INVOICE_NOT_FOUND');
    }

    const deleted = await invoiceRepository.delete(id);
    if (!deleted) {
      throw new AppError('فشل حذف الفاتورة', 500, 'DELETE_FAILED');
    }

    await auditService.record({
      user_id: actorId,
      action: 'INVOICE_DELETED',
      entity_type: 'INVOICE',
      entity_id: id,
      old_values: { invoice_number: existing.invoice_number, total: existing.total, customer_id: existing.customer_id },
    });

    return true;
  }
}

export const invoiceService = new InvoiceService();
