import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/summary', dashboardController.getSummary);
router.get('/top-buyers', dashboardController.getTopBuyers);

export const dashboardRoutes = router;
