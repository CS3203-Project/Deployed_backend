import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { adminService } from '../services/admin.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export class AdminController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, firstName, lastName } = req.body;

      // Check if admin already exists
      const existingAdmin = await adminService.getAdminByUsername(username);
      if (existingAdmin) {
        res.status(400).json({
          success: false,
          message: 'Admin with this username already exists',
        });
        return;
      }

      const admin = await adminService.createAdmin({
        username,
        password,
        firstName,
        lastName,
      });

      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: admin,
      });
    } catch (error: any) {
      console.error('Admin registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      const admin = await adminService.loginAdmin({ username, password });
      if (!admin) {
        res.status(401).json({
          success: false,
          message: 'Invalid username or password',
        });
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          adminId: admin.id,
          username: admin.username,
          role: 'ADMIN',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          admin,
          token,
        },
      });
    } catch (error: any) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).admin?.id;
      
      const admin = await adminService.getAdminById(adminId);
      if (!admin) {
        res.status(404).json({
          success: false,
          message: 'Admin not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: admin,
      });
    } catch (error: any) {
      console.error('Get admin profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async getAllAdmins(req: Request, res: Response): Promise<void> {
    try {
      const admins = await adminService.getAllAdmins();

      res.status(200).json({
        success: true,
        data: admins,
      });
    } catch (error: any) {
      console.error('Get all admins error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).admin?.id;
      const { username, password, firstName, lastName } = req.body;

      // Check if at least one field is provided
      if (!username && !password && !firstName && !lastName) {
        res.status(400).json({
          success: false,
          message: 'At least one field must be provided for update',
        });
        return;
      }

      const updateData: any = {};
      if (username) updateData.username = username;
      if (password) updateData.password = password;
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;

      const updatedAdmin = await adminService.updateAdmin(adminId, updateData);
      
      if (!updatedAdmin) {
        res.status(404).json({
          success: false,
          message: 'Admin not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedAdmin,
      });
    } catch (error: any) {
      console.error('Update admin profile error:', error);
      
      if (error.message === 'Username already exists') {
        res.status(400).json({
          success: false,
          message: 'Username already exists',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}

export const adminController = new AdminController();
