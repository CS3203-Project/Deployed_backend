import { prisma } from '../utils/database.js';

// Type definitions
interface NotificationFilters {
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

interface NotificationStats {
  total: number;
  unread: number;
  read: number;
}

export const getUserNotifications = async (userId: string, filters: NotificationFilters = {}) => {
  const { isRead, limit = 20, offset = 0 } = filters;

  // Get user email for matching 'to' field
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const whereClause: any = {
    OR: [
      { userId: userId },
      { to: user.email } // Include notifications sent to user's email
    ]
  };

  // Filter by read status if specified
  if (isRead !== undefined) {
    whereClause.isRead = isRead;
  }

  return await prisma.notification.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
    select: {
      id: true,
      subject: true,
      html: true,
      emailType: true,
      sentAt: true,
      createdAt: true,
      isRead: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });
};

export const getNotificationStats = async (userId: string): Promise<NotificationStats> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Count all notifications for this user (by userId or email)
  const whereClause = {
    OR: [
      { userId: userId },
      { to: user.email }
    ]
  };

  const total = await prisma.notification.count({
    where: whereClause
  });

  const unread = await prisma.notification.count({
    where: {
      ...whereClause,
      isRead: false
    }
  });

  const read = total - unread;

  return { total, unread, read };
};

export const markNotificationAsRead = async (notificationId: string, userId: string) => {
  // Get user email first
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify the notification belongs to the user
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      OR: [
        { userId: userId },
        {
          to: user.email
        }
      ]
    }
  });

  if (!notification) {
    throw new Error('Notification not found or access denied');
  }

  return await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
    select: {
      id: true,
      isRead: true,
      subject: true
    }
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const whereClause = {
    OR: [
      { userId: userId },
      { to: user.email }
    ],
    isRead: false
  };

  const result = await prisma.notification.updateMany({
    where: whereClause,
    data: { isRead: true }
  });

  return { updatedCount: result.count };
};

export const getNotificationById = async (notificationId: string, userId: string) => {
  // Get user email first
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      OR: [
        { userId: userId },
        {
          to: user.email
        }
      ]
    },
    select: {
      id: true,
      subject: true,
      html: true,
      emailType: true,
      sentAt: true,
      createdAt: true,
      isRead: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  if (!notification) {
    throw new Error('Notification not found or access denied');
  }

  return notification;
};
