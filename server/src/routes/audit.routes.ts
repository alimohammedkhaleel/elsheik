import { Router, Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';
import { ResponseUtil } from '../utils/apiResponse';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Audit logs are ADMIN-only
router.use(authenticateToken, requireRole('ADMIN'));

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const logs = await auditService.getLogs(limit);
    ResponseUtil.success(res, 'سجل العمليات والتدقيق الإداري', logs, 200);
  } catch (error) {
    next(error);
  }
});

export const auditRoutes = router;
