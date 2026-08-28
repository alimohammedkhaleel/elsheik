import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { ResponseUtil } from '../utils/apiResponse';
import { UserRole, UserStatus } from '../types/user.types';

export class UserController {
  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string | undefined;
      const role = req.query.role as UserRole | undefined;
      const status = req.query.status as UserStatus | undefined;

      const users = await userService.getAllUsers({ search, role, status });
      ResponseUtil.success(res, 'قائمة المستخدمين', users, 200);
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await userService.getUserById(id);
      ResponseUtil.success(res, 'تفاصيل المستخدم', user, 200);
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { full_name, username, email, password, phone, job_title, role_code, status } = req.body;
      const actorId = req.user?.userId;

      const created = await userService.createUser(
        { full_name, username, email, password, phone, job_title, role_code, status },
        actorId
      );
      ResponseUtil.success(res, 'تم إنشاء المستخدم بنجاح', created, 201);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const actorId = req.user?.userId;
      const updated = await userService.updateUser(id, req.body, actorId);
      ResponseUtil.success(res, 'تم تحديث بيانات المستخدم بنجاح', updated, 200);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      const actorId = req.user?.userId;
      const updated = await userService.changeStatus(id, status, actorId);
      ResponseUtil.success(res, 'تم تحديث حالة المستخدم بنجاح', updated, 200);
    } catch (error) {
      next(error);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const { role } = req.body;
      const actorId = req.user?.userId;
      const updated = await userService.changeRole(id, role, actorId);
      ResponseUtil.success(res, 'تم تغيير دور المستخدم بنجاح', updated, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();
