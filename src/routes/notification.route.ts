import { Router } from 'express';
const router: import('express').Router = Router();
import {
  getNotifications,
  getNotification,
  getNotificationStatsController,
  markAsRead,
  markAllAsRead
} from '../controllers/notification.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

router.get('/', authMiddleware, getNotifications);
router.get('/stats', authMiddleware, getNotificationStatsController);
router.get('/:id', authMiddleware, getNotification);
router.put('/:id/read', authMiddleware, markAsRead);
router.put('/read-all', authMiddleware, markAllAsRead);

export default router;
