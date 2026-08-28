import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Authenticated users can view products
router.use(authenticateToken);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Modifications require ADMIN or MANAGER
router.post('/', requireRole('ADMIN', 'MANAGER'), productController.createProduct);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), productController.updateProduct);
router.patch('/:id/status', requireRole('ADMIN', 'MANAGER'), productController.toggleActiveStatus);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), productController.deleteProduct);

export const productRoutes = router;
