import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { adminAuthMiddleware } from '../middlewares/admin.middleware.js';
import { validateAdminLogin, validateAdminRegistration, validateAdminUpdate, validateServiceProviderVerification } from '../validators/admin.validator.js';

const router = Router();

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

export default router;
