// @ts-nocheck - Suppress mock typing errors in Jest tests
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

// Type helper for mocked functions
type MockedFunction = jest.MockedFunction<any>;

import {
  createUser,
  createAdminUser,
  checkEmailExistsController,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  searchUsersController,
  getUserByIdController,
} from '../../src/controllers/user.controller.js';
import * as userService from '../../src/services/user.service.js';
import * as s3Utils from '../../src/utils/s3.js';

// Mock the services
jest.mock('../../src/services/user.service.js');
jest.mock('../../src/utils/s3.js');

describe('User Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
      user: undefined,
    } as Partial<Request>;
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;
    
    next = jest.fn() as NextFunction;
    
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        imageUrl: 'https://example.com/image.jpg',
        location: 'Test Location',
        address: '123 Test St',
        phone: '+1234567890',
        socialmedia: ['twitter.com/test'],
      };

      req.body = userData;
      const mockUser = { id: '1', ...userData, password: 'hashed' };
      
      (userService.register as jest.MockedFunction<typeof userService.register>).mockResolvedValue(mockUser as any);

      await createUser(req as Request, res as Response, next);

      expect(userService.register).toHaveBeenCalledWith(userData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User registered',
        user: mockUser,
      });
    });

    it('should handle errors during user creation', async () => {
      req.body = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      };

      const error = new Error('Registration failed');
      // @ts-expect-error - Mock typing
      (userService.register as jest.Mock).mockRejectedValue(error);

      await createUser(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createAdminUser', () => {
    it('should create an admin user successfully', async () => {
      const adminData = {
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'admin123',
      };

      req.body = adminData;
      const mockAdmin = { id: '1', ...adminData, role: 'ADMIN' };
      
      (userService.createAdmin as jest.Mock).mockResolvedValue(mockAdmin);

      await createAdminUser(req as Request, res as Response, next);

      expect(userService.createAdmin).toHaveBeenCalledWith(adminData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Admin user created successfully',
        admin: mockAdmin,
      });
    });

    it('should handle errors during admin creation', async () => {
      req.body = {
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'admin123',
      };

      const error = new Error('Admin creation failed');
      (userService.createAdmin as jest.Mock).mockRejectedValue(error);

      await createAdminUser(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('checkEmailExistsController', () => {
    it('should return true when email exists', async () => {
      req.query = { email: 'existing@example.com' };
      (userService.checkEmailExists as jest.Mock).mockResolvedValue(true);

      await checkEmailExistsController(req as Request, res as Response, next);

      expect(userService.checkEmailExists).toHaveBeenCalledWith('existing@example.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ exists: true });
    });

    it('should return false when email does not exist', async () => {
      req.query = { email: 'new@example.com' };
      (userService.checkEmailExists as jest.Mock).mockResolvedValue(false);

      await checkEmailExistsController(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith({ exists: false });
    });

    it('should return 400 when email is not provided', async () => {
      req.query = {};

      await checkEmailExistsController(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email is required' });
    });
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      req.body = credentials;
      const mockResult = {
        token: 'jwt-token',
        user: { id: '1', email: credentials.email },
      };
      
      (userService.login as jest.Mock).mockResolvedValue(mockResult);

      await loginUser(req as Request, res as Response);

      expect(userService.login).toHaveBeenCalledWith(credentials);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login successful',
        ...mockResult,
      });
    });

    it('should handle login errors', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const error = new Error('Invalid credentials');
      (userService.login as jest.Mock).mockRejectedValue(error);

      await loginUser(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      (req as any).user = { id: '1' };
      const mockProfile = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };
      
      (userService.getProfile as jest.Mock).mockResolvedValue(mockProfile);

      await getUserProfile(req as Request, res as Response, next);

      expect(userService.getProfile).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProfile);
    });

    it('should handle errors when getting profile', async () => {
      (req as any).user = { id: '1' };
      const error = new Error('Profile not found');
      (userService.getProfile as jest.Mock).mockRejectedValue(error);

      await getUserProfile(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully without image', async () => {
      (req as any).user = { id: '1' };
      req.body = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const mockUpdatedUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      (userService.getProfile as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        imageUrl: null,
      });
      (userService.updateProfile as jest.Mock).mockResolvedValue(mockUpdatedUser);

      await updateUserProfile(req as Request, res as Response, next);

      expect(userService.updateProfile).toHaveBeenCalledWith('1', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Profile updated',
        user: mockUpdatedUser,
      });
    });

    it('should update user profile with new image', async () => {
      (req as any).user = { id: '1' };
      (req as any).file = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      };
      req.body = { firstName: 'Jane' };

      const mockCurrentUser = {
        id: '1',
        imageUrl: 'https://s3.amazonaws.com/old-image.jpg',
      };
      const newImageUrl = 'https://s3.amazonaws.com/new-image.jpg';

      (userService.getProfile as jest.Mock).mockResolvedValue(mockCurrentUser);
      (s3Utils.uploadToS3 as jest.Mock).mockResolvedValue(newImageUrl);
      (s3Utils.deleteFromS3 as jest.Mock).mockResolvedValue(undefined);
      (userService.updateProfile as jest.Mock).mockResolvedValue({
        id: '1',
        firstName: 'Jane',
        imageUrl: newImageUrl,
      });

      await updateUserProfile(req as Request, res as Response, next);

      expect(s3Utils.uploadToS3).toHaveBeenCalled();
      expect(s3Utils.deleteFromS3).toHaveBeenCalledWith(mockCurrentUser.imageUrl);
      expect(userService.updateProfile).toHaveBeenCalledWith('1', {
        firstName: 'Jane',
        imageUrl: newImageUrl,
      });
    });

    it('should parse socialmedia from JSON string', async () => {
      (req as any).user = { id: '1' };
      req.body = {
        socialmedia: '["twitter.com/test"]',
      };

      (userService.getProfile as jest.Mock).mockResolvedValue({ id: '1' });
      (userService.updateProfile as jest.Mock).mockResolvedValue({ id: '1' });

      await updateUserProfile(req as Request, res as Response, next);

      expect(userService.updateProfile).toHaveBeenCalledWith('1', {
        socialmedia: ['twitter.com/test'],
      });
    });
  });

  describe('deleteUserProfile', () => {
    it('should delete user profile successfully', async () => {
      (req as any).user = { id: '1' };
      (userService.deleteProfile as jest.Mock).mockResolvedValue(undefined);

      await deleteUserProfile(req as Request, res as Response, next);

      expect(userService.deleteProfile).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Profile deleted' });
    });

    it('should handle errors during deletion', async () => {
      (req as any).user = { id: '1' };
      const error = new Error('Deletion failed');
      (userService.deleteProfile as jest.Mock).mockRejectedValue(error);

      await deleteUserProfile(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
