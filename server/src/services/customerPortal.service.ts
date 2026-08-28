import { customerPortalRepository } from '../repositories/customerPortal.repository';
import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { auditService } from './audit.service';
import { AppError } from '../middleware/errorHandler';
import {
  CustomerPortalOverview,
  CustomerPortalSalesAnalytics,
  CustomerPortalProfile,
  UpdateCustomerPortalProfileInput,
  CustomerChangePasswordInput,
} from '../types/customerPortal.types';
import { Invoice } from '../types/invoice.types';
import { CustomerAccountStatementResponse } from '../types/statement.types';

export class CustomerPortalService {
  async getOverview(customerId: number): Promise<CustomerPortalOverview> {
    if (!customerId) {
      throw new AppError('معرف العميل غير صالح أو غير مرتبط بالحساب', 403, 'FORBIDDEN_INVALID_CUSTOMER');
    }

    const overview = await customerPortalRepository.getOverview(customerId);
    if (!overview) {
      throw new AppError('لم يتم العثور على سجل العميل المقترن', 404, 'CUSTOMER_NOT_FOUND');
    }

    return overview;
  }

  async getInvoices(customerId: number, status?: string): Promise<Invoice[]> {
    if (!customerId) {
      throw new AppError('معرف العميل غير صالح', 403, 'FORBIDDEN_INVALID_CUSTOMER');
    }
    return customerPortalRepository.getInvoices(customerId, status);
  }

  async getStatement(
    customerId: number,
    options?: { startDate?: string; endDate?: string }
  ): Promise<CustomerAccountStatementResponse | null> {
    if (!customerId) {
      throw new AppError('معرف العميل غير صالح', 403, 'FORBIDDEN_INVALID_CUSTOMER');
    }
    return customerPortalRepository.getStatement(customerId, options);
  }


  async getSalesAnalytics(customerId: number): Promise<CustomerPortalSalesAnalytics> {
    if (!customerId) {
      throw new AppError('معرف العميل غير صالح', 403, 'FORBIDDEN_INVALID_CUSTOMER');
    }
    return customerPortalRepository.getSalesAnalytics(customerId);
  }

  async getProfile(customerId: number, userId: number): Promise<CustomerPortalProfile> {
    if (!customerId) {
      throw new AppError('معرف العميل غير صالح', 403, 'FORBIDDEN_INVALID_CUSTOMER');
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');
    }

    const profile = await customerPortalRepository.getProfile(customerId, user.username, user.email);
    if (!profile) {
      throw new AppError('لم يتم العثور على بيانات ملف العميل', 404, 'CUSTOMER_NOT_FOUND');
    }

    return profile;
  }

  async updateProfile(
    customerId: number,
    userId: number,
    input: UpdateCustomerPortalProfileInput,
    ipAddress?: string
  ): Promise<{ message: string }> {
    if (!customerId) {
      throw new AppError('معرف العميل غير صالح', 403, 'FORBIDDEN_INVALID_CUSTOMER');
    }

    const success = await customerPortalRepository.updateProfile(customerId, input);
    if (!success) {
      throw new AppError('فشل تحديث بيانات العميل', 400, 'UPDATE_FAILED');
    }

    await auditService.record({
      user_id: userId,
      action: 'CUSTOMER_PORTAL_PROFILE_UPDATE',
      entity_type: 'CUSTOMER',
      entity_id: customerId,
      ip_address: ipAddress,
      new_values: input as unknown as Record<string, unknown>,
    });


    return { message: 'تم تحديث بيانات الاتصال بنجاح' };
  }

  async changePassword(
    userId: number,
    input: CustomerChangePasswordInput,
    ipAddress?: string
  ): Promise<{ message: string }> {
    if (!input.newPassword || input.newPassword.length < 6) {
      throw new AppError('كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف', 400, 'PASSWORD_TOO_SHORT');
    }

    const user = await userRepository.findById(userId);
    if (!user || !user.password_hash) {
      throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');
    }

    if (input.currentPassword) {
      const isValid = await comparePassword(input.currentPassword, user.password_hash);
      if (!isValid) {
        throw new AppError('كلمة المرور الحالية غير صحيحة', 400, 'INVALID_CURRENT_PASSWORD');
      }
    }

    const newHash = await hashPassword(input.newPassword);
    await userRepository.updatePassword(userId, newHash);

    await auditService.record({
      user_id: userId,
      action: 'CUSTOMER_PASSWORD_CHANGED',
      entity_type: 'USER',
      entity_id: userId,
      ip_address: ipAddress,
    });

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }
}

export const customerPortalService = new CustomerPortalService();
