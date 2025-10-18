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

// Broadcast confirmation update via WebSocket
router.post('/broadcast', (req, res) => {
  try {
    const { conversationId, confirmation } = req.body;
    if (!conversationId || !confirmation) {
      return res.status(400).json({ error: 'conversationId and confirmation are required' });
    }
    
    // Use the global broadcast function
    const broadcastFn = (global as any).broadcastConfirmationUpdate;
    if (broadcastFn) {
      broadcastFn(conversationId, confirmation);
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Broadcast function not available' });
    }
  } catch (error: any) {
    console.error('Error broadcasting confirmation:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
