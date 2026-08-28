import { Router } from 'express';
import { approvalController } from '../controllers/approval.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Approvals require ADMIN or MANAGER
router.use(authenticateToken, requireRole('ADMIN', 'MANAGER'));

router.get('/', approvalController.getApprovals);
router.patch('/:id/approve', approvalController.approve);
router.patch('/:id/reject', approvalController.reject);

export const approvalRoutes = router;
