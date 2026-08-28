import { Router } from 'express';
import { bonusController } from '../controllers/bonus.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Bonuses endpoints require authentication
router.use(authenticateToken);
router.get('/', bonusController.getBonuses);
router.get('/:id', bonusController.getBonusById);

// Admin-only bonus modifications
router.post('/', requireRole('ADMIN'), bonusController.createBonus);
router.put('/:id', requireRole('ADMIN'), bonusController.updateBonus);
router.patch('/:id/status', requireRole('ADMIN'), bonusController.toggleActive);

export const bonusRoutes = router;
