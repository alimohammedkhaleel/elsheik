import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { interactionController } from '../controllers/interaction.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// All customer endpoints require authentication
router.use(authenticateToken);

// Customer management routes
router.get('/', customerController.getCustomers);
router.post('/', requireRole('ADMIN', 'MANAGER', 'EMPLOYEE'), customerController.createCustomer);
router.get('/assignments', requireRole('ADMIN', 'MANAGER'), customerController.getAssignmentsHistory);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), customerController.updateCustomer);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), customerController.deleteCustomer);

// Assignment action
router.patch('/:id/assignment', requireRole('ADMIN', 'MANAGER'), customerController.assignEmployee);

// Customer Interactions (Visits, Calls, Notes, Follow-ups)
router.get('/:id/interactions', interactionController.getByCustomer);
router.post('/:id/interactions', requireRole('ADMIN', 'MANAGER', 'EMPLOYEE', 'COLLECTOR'), interactionController.create);

export const customerRoutes = router;

