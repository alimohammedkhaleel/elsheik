import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { ResponseUtil } from '../utils/apiResponse';

export class NotificationController {
  /**
   * GET /api/notifications
   */
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || 1;
      const role = req.user?.role || 'EMPLOYEE';
      const data = await notificationService.getNotifications(userId, role);
      ResponseUtil.success(res, 'تم استرجاع التنبيهات التشغيلية بنجاح', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (!isNaN(id)) {
        await notificationService.markAsRead(id);
      }
      ResponseUtil.success(res, 'تم تحديث حالة الإشعار', null);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/notifications/read-all
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markAllAsRead();
      ResponseUtil.success(res, 'تم تعليم جميع الإشعارات كمقروءة', null);
    } catch (error) {
      next(error);
    }
  }

}

export const notificationController = new NotificationController();
