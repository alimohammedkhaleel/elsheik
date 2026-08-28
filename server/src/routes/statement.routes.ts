import { Router } from 'express';
import { statementController } from '../controllers/statement.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/:id/account-statement', statementController.getCustomerStatement);
router.get('/:id/account-statement/monthly', statementController.getMonthlyStatement);

export const statementRoutes = router;
