import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { approvalRoutes } from './approval.routes';
import { customerRoutes } from './customer.routes';
import { productRoutes } from './product.routes';
import { bonusRoutes } from './bonus.routes';
import { repBonusRoutes } from './repBonus.routes';
import { leaderboardRoutes } from './leaderboard.routes';
import { notificationRoutes } from './notification.routes';
import { auditRoutes } from './audit.routes';
import { dashboardRoutes } from './dashboard.routes';
import { invoiceRoutes } from './invoice.routes';
import { paymentRoutes } from './payment.routes';
import { statementRoutes } from './statement.routes';
import { customerPortalRoutes } from './customerPortal.routes';

const apiRouter = Router();

// 1. Health Endpoints
apiRouter.use('/health', healthRoutes);

// 2. Authentication & Session
apiRouter.use('/auth', authRoutes);

// 3. Customer Portal (Dedicated IDOR-safe routes for CUSTOMER role)
apiRouter.use('/customer/portal', customerPortalRoutes);

// 4. Real Business Dashboard
apiRouter.use('/dashboard', dashboardRoutes);

// 5. Leaderboard (Top Customers & Top Reps)
apiRouter.use('/leaderboard', leaderboardRoutes);

// 6. System Notifications
apiRouter.use('/notifications', notificationRoutes);

// 7. Customers & Customer Statements
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/customers', statementRoutes);

// 8. Invoices & Billing Engine
apiRouter.use('/invoices', invoiceRoutes);

// 9. Payments & Collections
apiRouter.use('/payments', paymentRoutes);

// 10. Products Master
apiRouter.use('/products', productRoutes);

// 11. Bonuses & Incentives (Plans & Representative Bonus/Deduction Transactions)
apiRouter.use('/bonuses', bonusRoutes);
apiRouter.use('/rep-bonuses', repBonusRoutes);

// 12. Audit Logs & System Management
apiRouter.use('/audit-logs', auditRoutes);

// 13. Admin Management Areas (Protected with RBAC)
apiRouter.use('/admin/users', userRoutes);
apiRouter.use('/admin/approvals', approvalRoutes);
apiRouter.use('/admin/customers', customerRoutes);
apiRouter.use('/admin/customer-assignments', customerRoutes);
apiRouter.use('/admin/products', productRoutes);
apiRouter.use('/admin/bonuses', bonusRoutes);
apiRouter.use('/admin/audit-logs', auditRoutes);

export { apiRouter };

