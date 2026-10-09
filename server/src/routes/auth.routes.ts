import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes with strict brute-force protection
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);

// Protected session route
router.get('/me', authenticateToken, authController.getCurrentUser);

export const authRoutes = router;
