import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { approvalRepository } from '../repositories/approval.repository';
import { auditService } from './audit.service';
import { comparePassword, hashPassword } from '../utils/password';
import { jwtConfig } from '../config/jwt';
import { AppError } from '../middleware/errorHandler';
import { LoginInput, RegisterInput, AuthResponseData, AuthTokenPayload } from '../types/auth.types';
import { UserResponse, UserRole } from '../types/user.types';

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: [
    'users.manage',
    'approvals.manage',
    'customers.manage',
    'customers.assign',
    'products.manage',
    'bonuses.manage',
    'sales.view',
    'sales.manage',
    'payments.view',
    'payments.manage',
    'reports.view',
    'audit.view',
    'data.submit',
    'data.approve',
  ],
  MANAGER: [
    'customers.manage',
    'customers.assign',
    'products.manage',
    'sales.view',
    'payments.view',
    'reports.view',
    'approvals.manage',
    'data.submit',
  ],
  EMPLOYEE: ['customers.manage', 'sales.view', 'data.submit'],
  COLLECTOR: ['customers.manage', 'payments.view', 'payments.record', 'data.submit'],
  CUSTOMER: ['customer.portal.view', 'customer.portal.manage'],
};


export class AuthService {
  async register(input: RegisterInput, ipAddress?: string): Promise<{ message: string; user: UserResponse }> {
    if (!input.full_name || !input.username || !input.email || !input.password) {
      throw new AppError('يرجى ملء جميع الحقول الإلزامية', 400, 'VALIDATION_ERROR');
    }

    if (input.password.length < 6) {
      throw new AppError('كلمة المرور يجب ألا تقل عن 6 أحرف', 400, 'PASSWORD_TOO_SHORT');
    }

    const cleanUsername = input.username.trim().toLowerCase();
    const cleanEmail = input.email.trim().toLowerCase();

    const existingUser = await userRepository.findByUsernameOrEmail(cleanUsername);
    if (existingUser) {
      throw new AppError('اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم آخر', 400, 'USERNAME_TAKEN');
    }

    const existingEmail = await userRepository.findByUsernameOrEmail(cleanEmail);
    if (existingEmail) {
      throw new AppError('البريد الإلكتروني مسجل مسبقاً', 400, 'EMAIL_TAKEN');
    }

    const hashedPassword = await hashPassword(input.password);

    // Default registration is ALWAYS PENDING_APPROVAL and EMPLOYEE. User cannot grant themselves admin/manager roles.
    const createdUser = await userRepository.create(
      {
        full_name: input.full_name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        password: input.password,
        phone: input.phone?.trim(),
        job_title: input.job_title?.trim() || 'موظف تحت الاعتماد',
        role_code: 'EMPLOYEE',
        status: 'PENDING_APPROVAL',
      },
      hashedPassword
    );

    // Create Approval record for the Admin
    await approvalRepository.create({
      entity_type: 'USER',
      entity_id: createdUser.id,
      submitted_by: createdUser.id,
      status: 'PENDING',
    });

    // Record in Audit Trail
    await auditService.record({
      user_id: createdUser.id,
      action: 'USER_REGISTERED',
      entity_type: 'USER',
      entity_id: createdUser.id,
      ip_address: ipAddress,
      new_values: {
        username: createdUser.username,
        email: createdUser.email,
        status: 'PENDING_APPROVAL',
      },
    });

    const userResponse: UserResponse = {
      id: createdUser.id,
      full_name: createdUser.full_name,
      username: createdUser.username,
      email: createdUser.email,
      phone: createdUser.phone,
      job_title: createdUser.job_title,
      role: createdUser.role_code,
      status: createdUser.status,
      created_at: createdUser.created_at,
      updated_at: createdUser.updated_at,
    };

    return {
      message: 'تم تقديم طلب إنشاء الحساب بنجاح، الحساب في انتظار مراجعة واعتماد مدير النظام.',
      user: userResponse,
    };
  }

  async login(input: LoginInput, ipAddress?: string): Promise<AuthResponseData> {
    if (!input.usernameOrEmail || !input.password) {
      throw new AppError('يرجى إدخال اسم المستخدم وكلمة المرور', 400, 'VALIDATION_ERROR');
    }

    const user = await userRepository.findByUsernameOrEmail(input.usernameOrEmail.trim().toLowerCase());
    if (!user || !user.password_hash) {
      throw new AppError('اسم المستخدم أو كلمة المرور غير صحيحة', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password with bcrypt
    const isPasswordValid = await comparePassword(input.password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('اسم المستخدم أو كلمة المرور غير صحيحة', 401, 'INVALID_CREDENTIALS');
    }

    // Enforce account status check
    if (user.status === 'PENDING_APPROVAL') {
      throw new AppError(
        'الحساب في انتظار موافقة مدير النظام، لا يمكن تسجيل الدخول بعد',
        403,
        'ACCOUNT_PENDING_APPROVAL'
      );
    }

    if (user.status === 'INACTIVE') {
      throw new AppError(
        'تم تعطيل هذا الحساب، يرجى التواصل مع الإدارة',
        403,
        'ACCOUNT_INACTIVE'
      );
    }

    if (user.status === 'REJECTED') {
      throw new AppError(
        user.rejection_reason
          ? `تم رفض طلب التسجيل لهذا الحساب. السبب: ${user.rejection_reason}`
          : 'تم رفض طلب التسجيل لهذا الحساب',
        403,
        'ACCOUNT_REJECTED'
      );
    }

    // Generate JWT Token
    const payload: AuthTokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role_code,
      status: user.status,
      customerId: user.customer_id,
    };

    const token = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: '7d',
    } as jwt.SignOptions);

    const permissions = ROLE_PERMISSIONS[user.role_code] || [];

    const userResponse: UserResponse = {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      job_title: user.job_title,
      role: user.role_code,
      status: user.status,
      customer_id: user.customer_id,
      rejection_reason: user.rejection_reason,
      approved_by: user.approved_by,
      approved_at: user.approved_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    // Log successful authentication in audit trail
    await auditService.record({
      user_id: user.id,
      action: 'USER_LOGIN',
      entity_type: 'USER',
      entity_id: user.id,
      ip_address: ipAddress,
      new_values: { username: user.username, role: user.role_code },
    });

    return {
      user: userResponse,
      token,
      permissions,
    };
  }

  async getCurrentUser(userId: number): Promise<{ user: UserResponse; permissions: string[] }> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');
    }

    const permissions = ROLE_PERMISSIONS[user.role_code] || [];

    const userResponse: UserResponse = {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      job_title: user.job_title,
      role: user.role_code,
      status: user.status,
      customer_id: user.customer_id,
      rejection_reason: user.rejection_reason,
      approved_by: user.approved_by,
      approved_at: user.approved_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return { user: userResponse, permissions };
  }


  async forgotPassword(email: string): Promise<{ message: string }> {
    if (!email) {
      throw new AppError('يرجى إدخال البريد الإلكتروني', 400, 'VALIDATION_ERROR');
    }
    const user = await userRepository.findByUsernameOrEmail(email.trim().toLowerCase());
    if (user) {
      await auditService.record({
        user_id: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entity_type: 'USER',
        entity_id: user.id,
        new_values: { email: user.email },
      });
    }
    return {
      message: 'إذا كان البريد الإلكتروني مسجلاً لدينا، فسيتم إرسال تعليمات إعادة التعيين أو مراجعة مسؤول النظام.',
    };
  }
}

export const authService = new AuthService();
