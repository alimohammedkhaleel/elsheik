import { userRepository } from '../repositories/user.repository';
import { auditService } from './audit.service';
import { hashPassword } from '../utils/password';
import { AppError } from '../middleware/errorHandler';
import { CreateUserInput, UpdateUserInput, UserResponse, UserRole, UserStatus } from '../types/user.types';

export class UserService {
  private formatUserResponse(user: {
    id: number;
    full_name: string;
    username: string;
    email: string;
    phone?: string | null;
    job_title?: string | null;
    role_code: UserRole;
    status: UserStatus;
    rejection_reason?: string | null;
    approved_by?: number | null;
    approved_at?: string | null;
    created_at: string;
    updated_at: string;
  }): UserResponse {
    return {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      job_title: user.job_title,
      role: user.role_code,
      status: user.status,
      rejection_reason: user.rejection_reason,
      approved_by: user.approved_by,
      approved_at: user.approved_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  async getAllUsers(options?: {
    search?: string;
    role?: UserRole;
    status?: UserStatus;
  }): Promise<UserResponse[]> {
    const users = await userRepository.findAll(options);
    return users.map((u) => this.formatUserResponse(u));
  }

  async getUserById(id: number): Promise<UserResponse> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');
    }
    return this.formatUserResponse(user);
  }

  async createUser(input: CreateUserInput, actorId?: number): Promise<UserResponse> {
    const existing = await userRepository.findByUsernameOrEmail(input.username);
    if (existing) {
      throw new AppError('اسم المستخدم مستخدم بالفعل', 400, 'USERNAME_ALREADY_EXISTS');
    }

    const existingEmail = await userRepository.findByUsernameOrEmail(input.email);
    if (existingEmail) {
      throw new AppError('البريد الإلكتروني مستخدم بالفعل', 400, 'EMAIL_ALREADY_EXISTS');
    }

    const hashedPassword = await hashPassword(input.password);
    const createdUser = await userRepository.create(input, hashedPassword);

    await auditService.record({
      user_id: actorId || null,
      action: 'USER_CREATED',
      entity_type: 'USER',
      entity_id: createdUser.id,
      new_values: {
        username: createdUser.username,
        role: createdUser.role_code,
        status: createdUser.status,
      },
    });

    return this.formatUserResponse(createdUser);
  }

  async updateUser(id: number, input: UpdateUserInput, actorId?: number): Promise<UserResponse> {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');
    }

    const updated = await userRepository.update(id, input);
    if (!updated) {
      throw new AppError('فشل تحديث بيانات المستخدم', 500, 'UPDATE_FAILED');
    }

    await auditService.record({
      user_id: actorId || null,
      action: 'USER_UPDATED',
      entity_type: 'USER',
      entity_id: id,
      old_values: { role: existing.role_code, status: existing.status },
      new_values: { ...input },
    });

    return this.formatUserResponse(updated);
  }

  async changeStatus(id: number, status: UserStatus, actorId?: number): Promise<UserResponse> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');
    }

    const updated = await userRepository.update(id, { status });
    if (!updated) {
      throw new AppError('فشل تغيير حالة المستخدم', 500, 'STATUS_UPDATE_FAILED');
    }

    await auditService.record({
      user_id: actorId || null,
      action: status === 'ACTIVE' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entity_type: 'USER',
      entity_id: id,
      old_values: { status: user.status },
      new_values: { status },
    });

    return this.formatUserResponse(updated);
  }

  async changeRole(id: number, role: UserRole, actorId?: number): Promise<UserResponse> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');
    }

    const updated = await userRepository.update(id, { role_code: role });
    if (!updated) {
      throw new AppError('فشل تغيير دور المستخدم', 500, 'ROLE_UPDATE_FAILED');
    }

    await auditService.record({
      user_id: actorId || null,
      action: 'USER_ROLE_CHANGED',
      entity_type: 'USER',
      entity_id: id,
      old_values: { role: user.role_code },
      new_values: { role },
    });

    return this.formatUserResponse(updated);
  }

  async approveUser(id: number, adminId: number): Promise<UserResponse> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('طلب المستخدم غير موجود', 404, 'USER_NOT_FOUND');
    }

    const approved = await userRepository.approveUser(id, adminId);
    if (!approved) {
      throw new AppError('فشل اعتماد المستخدم', 500, 'APPROVAL_FAILED');
    }

    await auditService.record({
      user_id: adminId,
      action: 'USER_APPROVED',
      entity_type: 'USER',
      entity_id: id,
      old_values: { status: user.status },
      new_values: { status: 'ACTIVE', approved_by: adminId },
    });

    return this.formatUserResponse(approved);
  }

  async rejectUser(id: number, adminId: number, reason?: string): Promise<UserResponse> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('طلب المستخدم غير موجود', 404, 'USER_NOT_FOUND');
    }

    const rejected = await userRepository.rejectUser(id, adminId, reason);
    if (!rejected) {
      throw new AppError('فشل رفض طلب المستخدم', 500, 'REJECTION_FAILED');
    }

    await auditService.record({
      user_id: adminId,
      action: 'USER_REJECTED',
      entity_type: 'USER',
      entity_id: id,
      old_values: { status: user.status },
      new_values: { status: 'REJECTED', rejection_reason: reason, approved_by: adminId },
    });

    return this.formatUserResponse(rejected);
  }
}

export const userService = new UserService();
