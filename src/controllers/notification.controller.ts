import type { Request, Response, NextFunction } from 'express';
import {
  getUserNotifications,
  getNotificationStats,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationById
} from '../services/notification.service.js';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { isRead, limit, offset } = req.query;

    const filters: any = {
      limit: limit ? parseInt(limit as string, 10) : 20,
      offset: offset ? parseInt(offset as string, 10) : 0
    };

    // Only add isRead filter if it's specified
    if (isRead !== undefined) {
      filters.isRead = isRead === 'true';
    }

    const notifications = await getUserNotifications(userId, filters);
    const stats = await getNotificationStats(userId);

    res.status(200).json({
      notifications,
      stats,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasMore: notifications.length === filters.limit
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getNotificationStatsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const stats = await getNotificationStats(userId);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
};

export const getNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    const notification = await getNotificationById(id, userId);
    res.status(200).json(notification);
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    const result = await markNotificationAsRead(id, userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const result = await markAllNotificationsAsRead(userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
