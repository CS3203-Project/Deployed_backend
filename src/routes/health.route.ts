import { Router, Request, Response } from 'express';
import { prisma } from '../utils/database.js';

const router: import('express').Router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      database: {
        connected: true
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      database: {
        connected: false,
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/health/database', async (req: Request, res: Response) => {
  try {
    // Basic database connection test
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      database: {
        connected: true
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      error: {
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
