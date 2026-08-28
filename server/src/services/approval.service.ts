import { approvalRepository } from '../repositories/approval.repository';
import { userRepository } from '../repositories/user.repository';
import { auditService } from './audit.service';
import { AppError } from '../middleware/errorHandler';
import { ApprovalRecord, ApprovalStatus } from '../types/approval.types';

export class ApprovalService {
  async getApprovals(status?: ApprovalStatus): Promise<ApprovalRecord[]> {
    return approvalRepository.findAll(status);
  }

  async getApprovalById(id: number): Promise<ApprovalRecord> {
    const record = await approvalRepository.findById(id);
    if (!record) {
      throw new AppError('طلب الاعتماد غير موجود', 404, 'APPROVAL_NOT_FOUND');
    }
    return record;
  }

  async approve(id: number, reviewerId: number, notes?: string): Promise<ApprovalRecord> {
    const record = await approvalRepository.findById(id);
    if (!record) {
      throw new AppError('طلب الاعتماد غير موجود', 404, 'APPROVAL_NOT_FOUND');
    }

    if (record.status !== 'PENDING') {
      throw new AppError('تم البت في هذا الطلب مسبقاً', 400, 'ALREADY_PROCESSED');
    }

    const updated = await approvalRepository.updateDecision(id, 'APPROVED', reviewerId, notes);
    if (!updated) {
      throw new AppError('فشل اعتماد الطلب', 500, 'APPROVAL_FAILED');
    }

    // Apply side effects if approving a user registration
    if (record.entity_type === 'USER') {
      await userRepository.approveUser(record.entity_id, reviewerId);
    }

    await auditService.record({
      user_id: reviewerId,
      action: 'APPROVAL_GRANTED',
      entity_type: record.entity_type,
      entity_id: record.entity_id,
      old_values: { status: 'PENDING' },
      new_values: { status: 'APPROVED', notes },
    });

    return updated;
  }

  async reject(id: number, reviewerId: number, reason?: string): Promise<ApprovalRecord> {
    const record = await approvalRepository.findById(id);
    if (!record) {
      throw new AppError('طلب الاعتماد غير موجود', 404, 'APPROVAL_NOT_FOUND');
    }

    if (record.status !== 'PENDING') {
      throw new AppError('تم البت في هذا الطلب مسبقاً', 400, 'ALREADY_PROCESSED');
    }

    const updated = await approvalRepository.updateDecision(id, 'REJECTED', reviewerId, reason);
    if (!updated) {
      throw new AppError('فشل رفض الطلب', 500, 'REJECTION_FAILED');
    }

    // Apply side effects if rejecting a user registration
    if (record.entity_type === 'USER') {
      await userRepository.rejectUser(record.entity_id, reviewerId, reason);
    }

    await auditService.record({
      user_id: reviewerId,
      action: 'APPROVAL_REJECTED',
      entity_type: record.entity_type,
      entity_id: record.entity_id,
      old_values: { status: 'PENDING' },
      new_values: { status: 'REJECTED', reason },
    });

    return updated;
  }
}

export const approvalService = new ApprovalService();
