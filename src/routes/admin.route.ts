import { Router, type Router as ExpressRouter } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { adminAuthMiddleware } from '../middlewares/admin.middleware.js';
import { validateAdminLogin, validateAdminRegistration, validateAdminUpdate } from '../validators/admin.validator.js';
import { scheduledJobsController } from '../controllers/scheduled-jobs.controller.js';

const router: ExpressRouter = Router();

// Public routes
router.post('/register', validateAdminRegistration, adminController.register);
router.post('/login', validateAdminLogin, adminController.login);

// Protected routes (require admin authentication)
router.get('/profile', adminAuthMiddleware, adminController.getProfile);
router.put('/profile', adminAuthMiddleware, validateAdminUpdate, adminController.updateProfile);
router.get('/all', adminAuthMiddleware, adminController.getAllAdmins);

// Scheduled Jobs routes
router.get('/scheduled-jobs/trigger-reminder', adminAuthMiddleware, scheduledJobsController.triggerBookingReminder);
router.post('/scheduled-jobs/send-immediate-reminder', adminAuthMiddleware, scheduledJobsController.sendImmediateReminder);

export default router;
