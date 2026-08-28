import { repBonusRepository } from '../repositories/repBonus.repository';
import { userRepository } from '../repositories/user.repository';
import { auditService } from './audit.service';
import { AppError } from '../middleware/errorHandler';
import {
  RepBonusDeduction,
  CreateRepBonusInput,
  RepBonusFilterOptions,
  RepBonusSummary,
} from '../types/repBonus.types';

export class RepBonusService {
  async getTransactions(options?: RepBonusFilterOptions): Promise<RepBonusDeduction[]> {
    return repBonusRepository.findAll(options);
  }

  async getSummaries(): Promise<RepBonusSummary[]> {
    return repBonusRepository.getSummaries();
  }

  async createTransaction(
    input: CreateRepBonusInput,
    userId: number,
    ipAddress?: string
  ): Promise<RepBonusDeduction> {
    if (!input.representative_id) {
      throw new AppError('يرجى تحديد المندوب / الموظف المعني', 400, 'VALIDATION_ERROR');
    }

    if (!input.type || !['BONUS', 'DEDUCTION'].includes(input.type)) {
      throw new AppError('نوع المعاملة غير صالح (يجب أن يكون مكافأة أو خصم)', 400, 'INVALID_TYPE');
    }

    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new AppError('قيمة المبلغ يجب أن تكون رقماً موجباً أكبر من الصفر', 400, 'INVALID_AMOUNT');
    }

    if (!input.reason || !input.reason.trim()) {
      throw new AppError('يرجى إدخال سبب المعاملة المالية', 400, 'REASON_REQUIRED');
    }

    // Employees cannot create bonuses for themselves
    if (input.representative_id === userId) {
      const creator = await userRepository.findById(userId);
      if (creator?.role_code !== 'ADMIN') {
        throw new AppError('لا يمكن للموظف تسجيل مكافأة أو خصم لنفسه', 403, 'FORBIDDEN_SELF_BONUS');
      }
    }

    const rep = await userRepository.findById(input.representative_id);
    if (!rep) {
      throw new AppError('الموظف المحدد غير موجود في المنظومة', 404, 'USER_NOT_FOUND');
    }

    const tx = await repBonusRepository.create(
      {
        representative_id: input.representative_id,
        type: input.type,
        amount,
        reason: input.reason.trim(),
        transaction_date: input.transaction_date,
        notes: input.notes?.trim(),
      },
      userId
    );

    // Record in Audit Log
    await auditService.record({
      user_id: userId,
      action: input.type === 'BONUS' ? 'REP_BONUS_CREATED' : 'REP_DEDUCTION_CREATED',
      entity_type: 'REP_BONUS',
      entity_id: tx.id,
      ip_address: ipAddress,
      new_values: {
        representative: rep.full_name,
        type: input.type,
        amount,
        reason: input.reason,
      },
    });

    return tx;
  }
}

export const repBonusService = new RepBonusService();
