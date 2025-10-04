import { Router } from 'express';
const router: import('express').Router = Router();
import { 
  createProvider, 
  updateProvider, 
  deleteProvider, 
  getProviderProfile, 
  getProviderById,
  verifyProvider,
  unverifyProvider
} from '../controllers/provider.controller.js';
import validate from '../middlewares/validation.middleware.js';
import { createProviderSchema, updateProviderSchema, providerParamsSchema } from '../validators/provider.validator.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { adminAuthMiddleware } from '../middlewares/admin.middleware.js';

router.post('/', authMiddleware, validate(createProviderSchema), createProvider);
router.get('/profile', authMiddleware, getProviderProfile);
router.put('/profile', authMiddleware, validate(updateProviderSchema), updateProvider);
router.delete('/profile', authMiddleware, deleteProvider);
router.get('/:id', validate(providerParamsSchema, 'params'), getProviderById);

// Verification routes (admin only)
router.put('/:id/verify', authMiddleware, adminAuthMiddleware, validate(providerParamsSchema, 'params'), verifyProvider);
router.put('/:id/unverify', authMiddleware, adminAuthMiddleware, validate(providerParamsSchema, 'params'), unverifyProvider);

export default router;
