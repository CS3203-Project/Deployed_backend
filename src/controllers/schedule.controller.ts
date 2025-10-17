import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCurrentScheduleTimes = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;

    // Get current time
    const now = new Date();

    // Fetch schedules for the service that are confirmed by both user and provider
    // First try to get upcoming schedules, if none, get recent past schedules
    let schedules = await prisma.schedule.findMany({
      where: {
        serviceId,
        customerConfirmation: true,
        providerConfirmation: true,
        startTime: {
          gte: now.toISOString(), // startTime >= now (upcoming)
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 5,
    });

    // If no upcoming schedules, get recent past schedules
    if (schedules.length === 0) {
      schedules = await prisma.schedule.findMany({
        where: {
          serviceId,
          customerConfirmation: true,
          providerConfirmation: true,
          startTime: {
            lt: now.toISOString(), // startTime < now (past)
          },
        },
        select: {
          startTime: true,
          endTime: true,
        },
        orderBy: {
          startTime: 'desc', // Most recent first
        },
        take: 3, // Show last 3 completed schedules
      });
    }

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error('Error fetching current schedule times:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createSchedule = async (req: Request, res: Response) => {
  // Implementation for creating schedule
};

export const updateSchedule = async (req: Request, res: Response) => {
  // Implementation for updating schedule
};
