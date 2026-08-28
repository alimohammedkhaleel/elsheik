import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth';

const notificationRoutes = Router();

notificationRoutes.use(authenticateToken);

notificationRoutes.get('/', (req, res, next) =>
  notificationController.getNotifications(req, res, next)
);

notificationRoutes.put('/:id/read', (req, res, next) =>
  notificationController.markAsRead(req, res, next)
);

notificationRoutes.put('/read-all', (req, res, next) =>
  notificationController.markAllAsRead(req, res, next)
);

export { notificationRoutes };
