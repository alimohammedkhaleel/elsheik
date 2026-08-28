import { Router } from 'express';
import { customerPortalController } from '../controllers/customerPortal.controller';
import { authenticateToken, requireCustomerAccount } from '../middleware/auth';

const customerPortalRoutes = Router();

// Strict Security Guard: All customer portal routes require valid JWT token AND CUSTOMER role with bound customerId
customerPortalRoutes.use(authenticateToken);
customerPortalRoutes.use(requireCustomerAccount);

// 1. Dashboard Overview
customerPortalRoutes.get('/overview', (req, res, next) =>
  customerPortalController.getOverview(req, res, next)
);

// 2. Invoices List
customerPortalRoutes.get('/invoices', (req, res, next) =>
  customerPortalController.getInvoices(req, res, next)
);

// 3. Account Statement (Debit / Credit / Balance)
customerPortalRoutes.get('/statement', (req, res, next) =>
  customerPortalController.getStatement(req, res, next)
);

// 4. Sales Analytics
customerPortalRoutes.get('/sales', (req, res, next) =>
  customerPortalController.getSalesAnalytics(req, res, next)
);

// 5. Customer Profile Info
customerPortalRoutes.get('/profile', (req, res, next) =>
  customerPortalController.getProfile(req, res, next)
);

// 6. Safe Profile Update
customerPortalRoutes.put('/profile', (req, res, next) =>
  customerPortalController.updateProfile(req, res, next)
);

// 7. Change Password
customerPortalRoutes.put('/change-password', (req, res, next) =>
  customerPortalController.changePassword(req, res, next)
);

export { customerPortalRoutes };
