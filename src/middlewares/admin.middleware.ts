import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { adminService } from '../services/admin.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

interface AdminTokenPayload {
  adminId: number;
  username: string;
  role: string;
}

// Extend Request interface to include admin property
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: number;
        username: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

export const adminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
      
      // Verify the admin still exists
      const admin = await adminService.getAdminById(decoded.adminId);
      if (!admin) {
        res.status(401).json({
          success: false,
          message: 'Admin not found',
        });
        return;
      }

      // Verify role is admin
      if (decoded.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Admin access required',
        });
        return;
      }

      // Add admin to request object
      req.admin = admin;
      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }
  } catch (error: any) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export const adminOptionalMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
      
      if (decoded.role === 'ADMIN') {
        const admin = await adminService.getAdminById(decoded.adminId);
        if (admin) {
          req.admin = admin;
        }
      }
    } catch (jwtError) {
      // Token is invalid, but we continue without authentication
    }

    next();
  } catch (error: any) {
    console.error('Admin optional middleware error:', error);
    next();
  }
};
