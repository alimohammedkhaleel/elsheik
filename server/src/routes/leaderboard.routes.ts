import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboard.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const leaderboardRoutes = Router();

// Leaderboard accessible by authenticated staff (ADMIN, MANAGER, EMPLOYEE, COLLECTOR)
leaderboardRoutes.use(authenticateToken);
leaderboardRoutes.use(requireRole('ADMIN', 'MANAGER', 'EMPLOYEE', 'COLLECTOR'));

// 1. Top Customers
leaderboardRoutes.get('/top-customers', (req, res, next) =>
  leaderboardController.getTopCustomers(req, res, next)
);

// 2. Top Representatives
leaderboardRoutes.get('/top-representatives', (req, res, next) =>
  leaderboardController.getTopRepresentatives(req, res, next)
);

export { leaderboardRoutes };
