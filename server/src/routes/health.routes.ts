import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const router = Router();

// GET /api/health
router.get('/', healthController.getHealth);

// GET /api/health/db
router.get('/db', healthController.getDatabaseHealth);

export const healthRoutes = router;
