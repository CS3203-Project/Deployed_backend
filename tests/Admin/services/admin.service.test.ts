import { describe, expect, test, beforeEach, jest } from '@jest/globals';

// Mock the dependencies first
const mockPrisma = {
  admin: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  serviceProvider: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  service: {
    findMany: jest.fn(),
  },
  payment: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
};

const mockHash = {
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
};

jest.mock('../../../src/utils/database', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../../src/utils/hash', () => mockHash);

// Now import the modules
import { AdminService } from '../../../src/Admin/services/admin.service';

describe('AdminService', () => {
  let adminService: AdminService;

  beforeEach(() => {
    adminService = new AdminService();
    jest.clearAllMocks();
  });

  describe('createAdmin', () => {
    test('should create admin successfully', async () => {
      const adminData = {
        username: 'testadmin',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const hashedPassword = 'hashedPassword123';
      const mockCreatedAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      (mockHash.hashPassword as jest.Mock).mockResolvedValue(hashedPassword);
      (mockPrisma.admin.create as jest.Mock).mockResolvedValue(mockCreatedAdmin);

      const result = await adminService.createAdmin(adminData);

      expect(mockHash.hashPassword).toHaveBeenCalledWith(adminData.password);
      expect(mockPrisma.admin.create).toHaveBeenCalledWith({
        data: {
          username: adminData.username,
          password: hashedPassword,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      });
      expect(result).toEqual(mockCreatedAdmin);
    });

    test('should handle database error during admin creation', async () => {
      const adminData = {
        username: 'testadmin',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      (mockHash.hashPassword as jest.Mock).mockResolvedValue('hashedPassword123');
      (mockPrisma.admin.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(adminService.createAdmin(adminData)).rejects.toThrow('Database error');
    });
  });

  describe('loginAdmin', () => {
    test('should login admin successfully with valid credentials', async () => {
      const loginData = {
        username: 'testadmin',
        password: 'TestPassword123!',
      };

      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        password: 'hashedPassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const expectedResult = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      (mockPrisma.admin.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (mockHash.comparePassword as jest.Mock).mockResolvedValue(true);

      const result = await adminService.loginAdmin(loginData);

      expect(mockPrisma.admin.findUnique).toHaveBeenCalledWith({
        where: { username: loginData.username },
      });
      expect(mockHash.comparePassword).toHaveBeenCalledWith(loginData.password, mockAdmin.password);
      expect(result).toEqual(expectedResult);
    });

    test('should return null if admin not found', async () => {
      const loginData = {
        username: 'nonexistent',
        password: 'TestPassword123!',
      };

      (mockPrisma.admin.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await adminService.loginAdmin(loginData);

      expect(result).toBeNull();
      expect(mockHash.comparePassword).not.toHaveBeenCalled();
    });

    test('should return null if password is invalid', async () => {
      const loginData = {
        username: 'testadmin',
        password: 'WrongPassword123!',
      };

      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        password: 'hashedPassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      (mockPrisma.admin.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (mockHash.comparePassword as jest.Mock).mockResolvedValue(false);

      const result = await adminService.loginAdmin(loginData);

      expect(result).toBeNull();
    });
  });

  describe('getAdminById', () => {
    test('should return admin by id', async () => {
      const adminId = 1;
      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      (mockPrisma.admin.findUnique as jest.Mock).mockResolvedValue(mockAdmin);

      const result = await adminService.getAdminById(adminId);

      expect(mockPrisma.admin.findUnique).toHaveBeenCalledWith({
        where: { id: adminId },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      });
      expect(result).toEqual(mockAdmin);
    });

    test('should return null if admin not found', async () => {
      const adminId = 999;

      (mockPrisma.admin.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await adminService.getAdminById(adminId);

      expect(result).toBeNull();
    });
  });

  describe('getAllAdmins', () => {
    test('should return all admins', async () => {
      const mockAdmins = [
        { id: 1, username: 'admin1', firstName: 'John', lastName: 'Doe' },
        { id: 2, username: 'admin2', firstName: 'Jane', lastName: 'Smith' },
      ];

      (mockPrisma.admin.findMany as jest.Mock).mockResolvedValue(mockAdmins);

      const result = await adminService.getAllAdmins();

      expect(mockPrisma.admin.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      });
      expect(result).toEqual(mockAdmins);
    });
  });

  describe('updateAdmin', () => {
    test('should update admin successfully', async () => {
      const adminId = 1;
      const updateData = {
        username: 'updatedadmin',
        firstName: 'UpdatedJohn',
        lastName: 'UpdatedDoe',
      };

      const mockUpdatedAdmin = {
        id: 1,
        username: 'updatedadmin',
        firstName: 'UpdatedJohn',
        lastName: 'UpdatedDoe',
      };

      // Mock that username doesn't exist for other users
      (mockPrisma.admin.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.admin.update as jest.Mock).mockResolvedValue(mockUpdatedAdmin);

      const result = await adminService.updateAdmin(adminId, updateData);

      expect(mockPrisma.admin.update).toHaveBeenCalledWith({
        where: { id: adminId },
        data: {
          username: updateData.username,
          firstName: updateData.firstName,
          lastName: updateData.lastName,
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      });
      expect(result).toEqual(mockUpdatedAdmin);
    });

    test('should throw error if username already exists for another admin', async () => {
      const adminId = 1;
      const updateData = {
        username: 'existingusername',
      };

      const existingAdmin = {
        id: 2, // Different ID
        username: 'existingusername',
        firstName: 'Other',
        lastName: 'Admin',
      };

      (mockPrisma.admin.findUnique as jest.Mock).mockResolvedValue(existingAdmin);

      await expect(adminService.updateAdmin(adminId, updateData)).rejects.toThrow('Username already exists');
    });
  });

  describe('getCustomerCount', () => {
    test('should return customer count', async () => {
      const expectedCount = 25;

      (mockPrisma.user.count as jest.Mock).mockResolvedValue(expectedCount);

      const result = await adminService.getCustomerCount();

      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: {
          role: 'USER',
        },
      });
      expect(result).toBe(expectedCount);
    });
  });
});