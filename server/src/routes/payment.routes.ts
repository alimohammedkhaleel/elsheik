import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', paymentController.getPayments);
router.post('/', requireRole('ADMIN', 'MANAGER', 'EMPLOYEE', 'COLLECTOR'), paymentController.createPayment);
router.get('/:id', paymentController.getPaymentById);
router.put('/:id', requireRole('ADMIN', 'MANAGER', 'EMPLOYEE', 'COLLECTOR'), paymentController.updatePayment);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), paymentController.deletePayment);

export const paymentRoutes = router;
