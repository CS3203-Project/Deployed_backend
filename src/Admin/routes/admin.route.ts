import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { adminAuthMiddleware } from '../middlewares/admin.middleware.js';
import { validateAdminLogin, validateAdminRegistration, validateAdminUpdate, validateServiceProviderVerification } from '../validators/admin.validator.js';

const router: Router = Router();

// Public routes
router.post('/register', validateAdminRegistration, adminController.register);
router.post('/login', validateAdminLogin, adminController.login);

// Protected routes (require admin authentication)
router.get('/profile', adminAuthMiddleware, adminController.getProfile);
router.put('/profile', adminAuthMiddleware, validateAdminUpdate, adminController.updateProfile);
router.get('/all', adminAuthMiddleware, adminController.getAllAdmins);
router.get('/service-providers', adminAuthMiddleware, adminController.getAllServiceProviders);
router.get('/services', adminAuthMiddleware, adminController.getAllServicesWithCategories);
router.get('/customers/count', adminAuthMiddleware, adminController.getCustomerCount);
router.get('/customers', adminAuthMiddleware, adminController.getAllCustomers);
router.put('/service-providers/:providerId/verification', adminAuthMiddleware, validateServiceProviderVerification, adminController.updateServiceProviderVerification);

// Payment Analytics routes
router.get('/analytics/payments', adminAuthMiddleware, adminController.getPaymentAnalytics);
router.get('/analytics/revenue-chart', adminAuthMiddleware, adminController.getRevenueChart);
router.get('/analytics/top-providers', adminAuthMiddleware, adminController.getTopProviders);
router.get('/analytics/recent-payments', adminAuthMiddleware, adminController.getRecentPayments);
router.get('/analytics/payment-statistics', adminAuthMiddleware, adminController.getPaymentStatistics);

export default router;
