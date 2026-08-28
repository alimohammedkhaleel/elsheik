import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { ResponseUtil } from '../utils/apiResponse';
import { AuthTokenPayload } from '../types/auth.types';
import { UserRole, UserStatus } from '../types/user.types';
import { query } from '../config/database';
import { validateDatabaseEnv } from '../config/env';

// Extend Express Request type to carry authenticated user details
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

/**
 * Middleware: Verify JWT Bearer Token and ensure active status
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    ResponseUtil.error(res, 'يجب تسجيل الدخول للوصول إلى هذا المسار', 401, 'UNAUTHORIZED');
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret) as AuthTokenPayload;

    // Check live database user status if database is configured
    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      try {
        const userCheck = await query<{ status: UserStatus; role_code: UserRole; customer_id: number | null }>(
          'SELECT status, role_code, customer_id FROM users WHERE id = $1',
          [decoded.userId]
        );

        if (userCheck.rowCount === 0) {
          ResponseUtil.error(res, 'الحساب غير موجود', 401, 'ACCOUNT_NOT_FOUND');
          return;
        }

        const userRecord = userCheck.rows[0];
        if (userRecord.status === 'PENDING_APPROVAL') {
          ResponseUtil.error(
            res,
            'الحساب في انتظار موافقة مدير النظام، لا يمكن تسجيل الدخول بعد',
            403,
            'ACCOUNT_PENDING_APPROVAL'
          );
          return;
        }

        if (userRecord.status === 'INACTIVE') {
          ResponseUtil.error(
            res,
            'تم تعطيل هذا الحساب، يرجى التواصل مع الإدارة',
            403,
            'ACCOUNT_INACTIVE'
          );
          return;
        }

        if (userRecord.status === 'REJECTED') {
          ResponseUtil.error(
            res,
            'تم رفض طلب التسجيل لهذا الحساب',
            403,
            'ACCOUNT_REJECTED'
          );
          return;
        }

        decoded.status = userRecord.status;
        decoded.role = userRecord.role_code;
        decoded.customerId = userRecord.customer_id;
      } catch (dbErr) {
        // Fallback gracefully if database query is temporarily unreachable
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    ResponseUtil.error(res, 'رمز المصادقة غير صالح أو منتهي الصلاحية', 401, 'INVALID_TOKEN');
  }
};

/**
 * Middleware: Enforce Role-Based Access Control (RBAC)
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtil.error(res, 'غير مصرح بالدخول', 401, 'UNAUTHORIZED');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      ResponseUtil.error(
        res,
        'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء',
        403,
        'FORBIDDEN_INSUFFICIENT_PERMISSIONS'
      );
      return;
    }

    next();
  };
};

/**
 * Middleware: Enforce Customer Role and ensure linked customer account exists
 */
export const requireCustomerAccount = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    ResponseUtil.error(res, 'يجب تسجيل الدخول أولاً', 401, 'UNAUTHORIZED');
    return;
  }

  if (req.user.role !== 'CUSTOMER') {
    ResponseUtil.error(res, 'هذا المسار مخصص لبوابة العملاء فقط', 403, 'CUSTOMER_ROLE_REQUIRED');
    return;
  }

  if (!req.user.customerId) {
    ResponseUtil.error(res, 'حساب المستخدم غير مقترن بملف عميل صالح', 403, 'NO_CUSTOMER_LINKED');
    return;
  }

  next();
};

/**
 * Middleware: Enforce internal staff (blocks Customer role from accessing staff CRM endpoints)
 */
export const requireInternalStaff = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    ResponseUtil.error(res, 'يجب تسجيل الدخول أولاً', 401, 'UNAUTHORIZED');
    return;
  }

  if (req.user.role === 'CUSTOMER') {
    ResponseUtil.error(res, 'غير مصرح للعملاء بالوصول إلى لوحات الموظفين والإدارة', 403, 'INTERNAL_STAFF_ONLY');
    return;
  }

  next();
};

