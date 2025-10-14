// @ts-nocheck - Suppress mock typing errors in Jest tests
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { register, login, getProfile, updateProfile, deleteProfile, checkEmailExists, createAdmin } from '../../src/services/user.service.js';
import { prisma } from '../../src/utils/database.js';
import { hashPassword, comparePassword } from '../../src/utils/hash.js';
import jwt from 'jsonwebtoken';

jest.mock('../../src/utils/database.js');
jest.mock('../../src/utils/hash.js');
jest.mock('jsonwebtoken');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        ...userData,
        password: 'hashed-password',
      });

      const result = await register(userData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
      expect(hashPassword).toHaveBeenCalledWith(userData.password);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          password: 'hashed-password',
        },
      });
      expect(result).toHaveProperty('id', '1');
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-id',
        email: userData.email,
      });

      await expect(register(userData)).rejects.toThrow('Email already exists');
    });
  });

  describe('createAdmin', () => {
    it('should create an admin user successfully', async () => {
      const adminData = {
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'admin123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        ...adminData,
        role: 'ADMIN',
        isEmailVerified: true,
        password: 'hashed-password',
      });

      const result = await createAdmin(adminData);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          ...adminData,
          password: 'hashed-password',
          role: 'ADMIN',
          isEmailVerified: true,
        },
      });
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('role', 'ADMIN');
    });

    it('should throw error if admin email already exists', async () => {
      const adminData = {
        email: 'existing-admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'admin123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-id',
        email: adminData.email,
      });

      await expect(createAdmin(adminData)).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '1',
        email: credentials.email,
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await login(credentials);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email },
      });
      expect(comparePassword).toHaveBeenCalledWith(credentials.password, mockUser.password);
      expect(result).toHaveProperty('token', 'mock-token');
      expect(result).toHaveProperty('user');
    });

    it('should throw error if user not found', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(login(credentials)).rejects.toThrow('User not found');
    });

    it('should throw error if password is invalid', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      const mockUser = {
        id: '1',
        email: credentials.email,
        password: 'hashed-password',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if JWT_SECRET is not defined', async () => {
      delete process.env.JWT_SECRET;

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '1',
        email: credentials.email,
        password: 'hashed-password',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(true);

      await expect(login(credentials)).rejects.toThrow('JWT_SECRET is not defined');
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const userId = 'user-id';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        serviceProvider: null, // Added to match actual service return value
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getProfile(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
        })
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getProfile('non-existent')).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = 'user-id';
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const updatedUser = {
        id: userId,
        email: 'test@example.com',
        ...updateData,
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await updateProfile(userId, updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteProfile', () => {
    it('should delete user profile successfully', async () => {
      const userId = 'user-id';

      (prisma.user.delete as jest.Mock).mockResolvedValue({ id: userId });

      await deleteProfile(userId);

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });

  describe('checkEmailExists', () => {
    it('should return true if email exists', async () => {
      const email = 'existing@example.com';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email,
      });

      const result = await checkEmailExists(email);

      expect(result).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      const email = 'new@example.com';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await checkEmailExists(email);

      expect(result).toBe(false);
    });
  });
});
