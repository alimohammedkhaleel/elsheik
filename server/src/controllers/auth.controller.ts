import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { ResponseUtil } from '../utils/apiResponse';

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { full_name, username, email, password, phone, job_title } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await authService.register(
        { full_name, username, email, password, phone, job_title },
        ipAddress
      );
      ResponseUtil.success(res, result.message, result.user, 201);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { usernameOrEmail, password } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await authService.login({ usernameOrEmail, password }, ipAddress);
      ResponseUtil.success(res, 'تم تسجيل الدخول بنجاح', result, 200);
    } catch (error) {
      next(error);
    }
  };

  logout = async (_req: Request, res: Response): Promise<void> => {
    ResponseUtil.success(res, 'تم تسجيل الخروج بنجاح', { loggedOut: true }, 200);
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        ResponseUtil.error(res, 'غير مصرح بالدخول', 401, 'UNAUTHORIZED');
        return;
      }
      const result = await authService.getCurrentUser(req.user.userId);
      ResponseUtil.success(res, 'بيانات المستخدم الحالي', result, 200);
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      ResponseUtil.success(res, result.message, null, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
