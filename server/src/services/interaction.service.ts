import { interactionRepository } from '../repositories/interaction.repository';
import { customerRepository } from '../repositories/customer.repository';
import { auditService } from './audit.service';
import { AppError } from '../middleware/errorHandler';
import { CustomerInteraction, CreateInteractionInput } from '../types/interaction.types';

export class InteractionService {
  async getByCustomer(customerId: number): Promise<CustomerInteraction[]> {
    return interactionRepository.findByCustomer(customerId);
  }

  async createInteraction(
    input: CreateInteractionInput,
    employeeId: number,
    ipAddress?: string
  ): Promise<CustomerInteraction> {
    if (!input.customer_id) {
      throw new AppError('يرجى تحديد العميل', 400, 'VALIDATION_ERROR');
    }

    if (!input.summary || !input.summary.trim()) {
      throw new AppError('يرجى كتابة ملخص الزيارة أو المتابعة', 400, 'SUMMARY_REQUIRED');
    }

    const customer = await customerRepository.findById(input.customer_id);
    if (!customer) {
      throw new AppError('العميل غير موجود', 404, 'CUSTOMER_NOT_FOUND');
    }

    const item = await interactionRepository.create(input, employeeId);

    // Record in Audit Log
    await auditService.record({
      user_id: employeeId,
      action: `CUSTOMER_${input.interaction_type}_LOGGED`,
      entity_type: 'CUSTOMER_INTERACTION',
      entity_id: item.id,
      ip_address: ipAddress,
      new_values: {
        customer: customer.name,
        type: input.interaction_type,
        summary: input.summary,
      },
    });

    return item;
  }

  async updateInteraction(
    interactionId: number,
    customerId: number,
    input: Partial<CreateInteractionInput>
  ): Promise<CustomerInteraction> {
    const updated = await interactionRepository.updateOne(interactionId, customerId, input);
    if (!updated) {
      throw new AppError('الملاحظة / الزيارة غير موجودة', 404, 'NOT_FOUND');
    }
    return updated;
  }

  async deleteInteraction(interactionId: number, customerId: number): Promise<void> {
    const deleted = await interactionRepository.deleteOne(interactionId, customerId);
    if (!deleted) {
      throw new AppError('الملاحظة غير موجودة أو لا تنتمي لهذا العميل', 404, 'NOT_FOUND');
    }
  }

  async deleteAllByCustomer(customerId: number): Promise<{ count: number }> {
    const count = await interactionRepository.deleteAllByCustomer(customerId);
    return { count };
  }
}

export const interactionService = new InteractionService();
