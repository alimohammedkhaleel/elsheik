import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// All routes here require ADMIN authentication
router.use(authenticateToken, requireRole('ADMIN'));

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.patch('/:id/status', userController.updateStatus);
router.patch('/:id/role', userController.updateRole);

export const userRoutes = router;
