import { Router } from 'express';
import { getConfirmationController, upsertConfirmationController, createConfirmationController } from '../controllers/confirmation.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router: Router = Router();

// All confirmation routes require authentication
router.use(authMiddleware);

// Get confirmation by conversation ID
router.get('/:conversationId', getConfirmationController);

// Create confirmation for conversation
router.post('/', createConfirmationController);

// Update confirmation (patch)
router.patch('/:conversationId', upsertConfirmationController);

export default router;
