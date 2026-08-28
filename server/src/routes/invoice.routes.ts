import { Router } from 'express';
import { invoiceController } from '../controllers/invoice.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', invoiceController.getInvoices);
router.post('/', requireRole('ADMIN', 'MANAGER', 'EMPLOYEE'), invoiceController.createInvoice);
router.get('/:id', invoiceController.getInvoiceById);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), invoiceController.updateInvoice);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), invoiceController.deleteInvoice);

export const invoiceRoutes = router;
