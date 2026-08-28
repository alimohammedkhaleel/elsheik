import { bonusRepository } from '../repositories/bonus.repository';
import { auditService } from './audit.service';
import { AppError } from '../middleware/errorHandler';
import { Bonus, CreateBonusInput } from '../types/bonus.types';

export class BonusService {
  async getBonuses(activeOnly?: boolean): Promise<Bonus[]> {
    return bonusRepository.findAll(activeOnly);
  }

  async getBonusById(id: number): Promise<Bonus> {
    const bonus = await bonusRepository.findById(id);
    if (!bonus) {
      throw new AppError('خطة المكافأة غير موجودة', 404, 'BONUS_NOT_FOUND');
    }
    return bonus;
  }

  async createBonus(input: CreateBonusInput, adminId?: number): Promise<Bonus> {
    if (input.value <= 0) {
      throw new AppError('يجب أن تكون قيمة المكافأة أكبر من الصفر', 400, 'INVALID_VALUE');
    }

    const created = await bonusRepository.create(input, adminId);

    await auditService.record({
      user_id: adminId || null,
      action: 'BONUS_CREATED',
      entity_type: 'BONUS',
      entity_id: created.id,
      new_values: { name: created.name, type: created.bonus_type, value: created.value },
    });

    return created;
  }

  async updateBonus(id: number, input: Partial<CreateBonusInput>, adminId?: number): Promise<Bonus> {
    const existing = await bonusRepository.findById(id);
    if (!existing) {
      throw new AppError('خطة المكافأة غير موجودة', 404, 'BONUS_NOT_FOUND');
    }

    if (input.value !== undefined && input.value <= 0) {
      throw new AppError('يجب أن تكون قيمة المكافأة أكبر من الصفر', 400, 'INVALID_VALUE');
    }

    const updated = await bonusRepository.update(id, input);
    if (!updated) {
      throw new AppError('فشل تحديث خطة المكافأة', 500, 'UPDATE_FAILED');
    }

    await auditService.record({
      user_id: adminId || null,
      action: 'BONUS_UPDATED',
      entity_type: 'BONUS',
      entity_id: id,
      old_values: { name: existing.name, value: existing.value },
      new_values: input,
    });

    return updated;
  }

  async toggleActive(id: number, adminId?: number): Promise<Bonus> {
    const existing = await bonusRepository.findById(id);
    if (!existing) {
      throw new AppError('خطة المكافأة غير موجودة', 404, 'BONUS_NOT_FOUND');
    }

    const updated = await bonusRepository.toggleActive(id);
    if (!updated) {
      throw new AppError('فشل تغيير حالة تفعيل المكافأة', 500, 'STATUS_UPDATE_FAILED');
    }

    await auditService.record({
      user_id: adminId || null,
      action: updated.is_active ? 'BONUS_ACTIVATED' : 'BONUS_DEACTIVATED',
      entity_type: 'BONUS',
      entity_id: id,
      new_values: { is_active: updated.is_active },
    });

    return updated;
  }
}

export const bonusService = new BonusService();
