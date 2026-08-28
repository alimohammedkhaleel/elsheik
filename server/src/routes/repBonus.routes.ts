import { Router } from 'express';
import { repBonusController } from '../controllers/repBonus.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const repBonusRoutes = Router();

// Authentication required for all bonus routes
repBonusRoutes.use(authenticateToken);

// 1. List transactions
repBonusRoutes.get('/', (req, res, next) =>
  repBonusController.getTransactions(req, res, next)
);

// 2. Summary by representative
repBonusRoutes.get('/summary', (req, res, next) =>
  repBonusController.getSummaries(req, res, next)
);

// 3. Create bonus or deduction (ADMIN or MANAGER only)
repBonusRoutes.post('/', requireRole('ADMIN', 'MANAGER'), (req, res, next) =>
  repBonusController.createTransaction(req, res, next)
);

export { repBonusRoutes };
