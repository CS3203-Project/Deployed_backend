import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import type { Request, Response } from 'express';

// Mock the dependencies first
const mockJwtSign = jest.fn();
const mockJwtVerify = jest.fn();

jest.mock('../../../src/Admin/services/admin.service');
jest.mock('jsonwebtoken', () => ({
  sign: mockJwtSign,
  verify: mockJwtVerify,
}));

// Now import the modules
import { AdminController } from '../../../src/Admin/controllers/admin.controller';
import { adminService } from '../../../src/Admin/services/admin.service';

const mockAdminService = adminService as jest.Mocked<typeof adminService>;

describe('AdminController', () => {
  let adminController: AdminController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.MockedFunction<any>;
  let responseStatus: jest.MockedFunction<any>;

  beforeEach(() => {
    adminController = new AdminController();
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnThis();
    
    mockRequest = {};
    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };
    
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('should register admin successfully', async () => {
      const adminData = {
        username: 'testadmin',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockCreatedAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockRequest.body = adminData;
      mockAdminService.getAdminByUsername.mockResolvedValue(null);
      mockAdminService.createAdmin.mockResolvedValue(mockCreatedAdmin);

      await adminController.register(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.getAdminByUsername).toHaveBeenCalledWith(adminData.username);
      expect(mockAdminService.createAdmin).toHaveBeenCalledWith(adminData);
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Admin created successfully',
        data: mockCreatedAdmin,
      });
    });

    test('should return error if admin already exists', async () => {
      const adminData = {
        username: 'existingadmin',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const existingAdmin = {
        id: 1,
        username: 'existingadmin',
        firstName: 'Existing',
        lastName: 'Admin',
      };

      mockRequest.body = adminData;
      mockAdminService.getAdminByUsername.mockResolvedValue(existingAdmin);

      await adminController.register(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.createAdmin).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Admin with this username already exists',
      });
    });

    test('should handle internal server error', async () => {
      const adminData = {
        username: 'testadmin',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockRequest.body = adminData;
      mockAdminService.getAdminByUsername.mockRejectedValue(new Error('Database error'));

      await adminController.register(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: 'Database error',
      });
    });
  });

  describe('login', () => {
    test('should login admin successfully', async () => {
      const loginData = {
        username: 'testadmin',
        password: 'TestPassword123!',
      };

      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockToken = 'mock.jwt.token';

      mockRequest.body = loginData;
      mockAdminService.loginAdmin.mockResolvedValue(mockAdmin);
      mockJwtSign.mockReturnValue(mockToken);

      await adminController.login(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.loginAdmin).toHaveBeenCalledWith(loginData);
      expect(mockJwtSign).toHaveBeenCalledWith(
        {
          adminId: mockAdmin.id,
          username: mockAdmin.username,
          role: 'ADMIN',
        },
        'test-secret-key',
        { expiresIn: '1h' }
      );
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          admin: mockAdmin,
          token: mockToken,
        },
      });
    });

    test('should return error for invalid credentials', async () => {
      const loginData = {
        username: 'testadmin',
        password: 'WrongPassword123!',
      };

      mockRequest.body = loginData;
      mockAdminService.loginAdmin.mockResolvedValue(null);

      await adminController.login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid username or password',
      });
    });

    test('should handle internal server error during login', async () => {
      const loginData = {
        username: 'testadmin',
        password: 'TestPassword123!',
      };

      mockRequest.body = loginData;
      mockAdminService.loginAdmin.mockRejectedValue(new Error('Database error'));

      await adminController.login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: 'Database error',
      });
    });
  });

  describe('getProfile', () => {
    test('should get admin profile successfully', async () => {
      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      (mockRequest as any).admin = { id: 1 };
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);

      await adminController.getProfile(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.getAdminById).toHaveBeenCalledWith(1);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockAdmin,
      });
    });

    test('should return error if admin not found', async () => {
      (mockRequest as any).admin = { id: 999 };
      mockAdminService.getAdminById.mockResolvedValue(null);

      await adminController.getProfile(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Admin not found',
      });
    });
  });

  describe('getAllAdmins', () => {
    test('should get all admins successfully', async () => {
      const mockAdmins = [
        { id: 1, username: 'admin1', firstName: 'John', lastName: 'Doe' },
        { id: 2, username: 'admin2', firstName: 'Jane', lastName: 'Smith' },
      ];

      mockAdminService.getAllAdmins.mockResolvedValue(mockAdmins);

      await adminController.getAllAdmins(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.getAllAdmins).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockAdmins,
      });
    });
  });

  describe('updateProfile', () => {
    test('should update admin profile successfully', async () => {
      const updateData = {
        username: 'updatedadmin',
        firstName: 'UpdatedJohn',
      };

      const mockUpdatedAdmin = {
        id: 1,
        username: 'updatedadmin',
        firstName: 'UpdatedJohn',
        lastName: 'Doe',
      };

      (mockRequest as any).admin = { id: 1 };
      mockRequest.body = updateData;
      mockAdminService.updateAdmin.mockResolvedValue(mockUpdatedAdmin);

      await adminController.updateProfile(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.updateAdmin).toHaveBeenCalledWith(1, updateData);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: mockUpdatedAdmin,
      });
    });

    test('should return error if no fields provided for update', async () => {
      (mockRequest as any).admin = { id: 1 };
      mockRequest.body = {};

      await adminController.updateProfile(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.updateAdmin).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'At least one field must be provided for update',
      });
    });

    test('should handle username already exists error', async () => {
      const updateData = {
        username: 'existingusername',
      };

      (mockRequest as any).admin = { id: 1 };
      mockRequest.body = updateData;
      mockAdminService.updateAdmin.mockRejectedValue(new Error('Username already exists'));

      await adminController.updateProfile(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Username already exists',
      });
    });
  });

  describe('getAllServiceProviders', () => {
    test('should get all service providers successfully', async () => {
      const mockServiceProviders = [
        {
          id: 'provider1',
          user: {
            id: 'user1',
            email: 'provider@example.com',
            firstName: 'Provider',
            lastName: 'One',
            phone: '1234567890',
            imageUrl: null,
            location: 'Location',
            address: 'Address',
            isEmailVerified: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: new Date(),
            socialmedia: [],
          },
          companies: [],
          services: [],
          _count: { services: 0, schedules: 0, payments: 0 },
          isVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          providerId: 'provider1',
        },
      ];

      mockAdminService.getAllServiceProvidersWithDetails.mockResolvedValue(mockServiceProviders as any);

      await adminController.getAllServiceProviders(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.getAllServiceProvidersWithDetails).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Service providers fetched successfully',
        data: mockServiceProviders,
        count: mockServiceProviders.length,
      });
    });
  });

  describe('updateServiceProviderVerification', () => {
    test('should update service provider verification successfully', async () => {
      const providerId = 'provider1';
      const isVerified = true;

      const mockUpdatedProvider = {
        id: 'provider1',
        isVerified: true,
        user: {
          firstName: 'Provider',
          lastName: 'One',
        },
      };

      mockRequest.params = { providerId };
      mockRequest.body = { isVerified };
      mockAdminService.updateServiceProviderVerification.mockResolvedValue(mockUpdatedProvider);

      await adminController.updateServiceProviderVerification(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.updateServiceProviderVerification).toHaveBeenCalledWith(providerId, isVerified);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Service provider approved successfully',
        data: mockUpdatedProvider,
      });
    });

    test('should return error for invalid isVerified value', async () => {
      const providerId = 'provider1';

      mockRequest.params = { providerId };
      mockRequest.body = { isVerified: 'invalid' };

      await adminController.updateServiceProviderVerification(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.updateServiceProviderVerification).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'isVerified must be a boolean value (true for approve, false for reject)',
      });
    });

    test('should return error for missing provider ID', async () => {
      mockRequest.params = {};
      mockRequest.body = { isVerified: true };

      await adminController.updateServiceProviderVerification(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.updateServiceProviderVerification).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Provider ID is required',
      });
    });

    test('should handle service provider not found error', async () => {
      const providerId = 'nonexistent';
      const isVerified = true;

      mockRequest.params = { providerId };
      mockRequest.body = { isVerified };
      mockAdminService.updateServiceProviderVerification.mockRejectedValue(new Error('Service provider not found'));

      await adminController.updateServiceProviderVerification(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Service provider not found',
      });
    });
  });

  describe('getCustomerCount', () => {
    test('should get customer count successfully', async () => {
      const expectedCount = 25;

      mockAdminService.getCustomerCount.mockResolvedValue(expectedCount);

      await adminController.getCustomerCount(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.getCustomerCount).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Customer count fetched successfully',
        data: {
          count: expectedCount,
        },
      });
    });
  });

  describe('getAllCustomers', () => {
    test('should get all customers successfully', async () => {
      const mockCustomers = [
        {
          id: 'user1',
          email: 'customer1@example.com',
          firstName: 'Customer',
          lastName: 'One',
          phone: '1234567890',
          imageUrl: null,
          location: 'Location',
          address: 'Address',
          isEmailVerified: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          socialmedia: [],
          _count: {
            payments: 2,
            schedules: 3,
            customerReviewsWritten: 1,
            customerReviewsReceived: 1,
            writtenServiceReviews: 1,
          },
        },
      ];

      mockAdminService.getAllCustomers.mockResolvedValue(mockCustomers as any);

      await adminController.getAllCustomers(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.getAllCustomers).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'All customers fetched successfully',
        data: mockCustomers,
        count: mockCustomers.length,
      });
    });
  });

  describe('getPaymentAnalytics', () => {
    test('should get payment analytics successfully', async () => {
      const mockStatistics = {
        totalRevenue: 1000,
        totalTransactions: 10,
        averageTransactionValue: 100,
        successfulTransactions: 8,
        failedTransactions: 2,
        pendingTransactions: 0,
        totalPlatformFees: 100,
        totalProviderEarnings: 900,
      };

      const mockStatusDistribution = [
        { status: 'SUCCEEDED', count: 8, percentage: 80 },
        { status: 'FAILED', count: 2, percentage: 20 },
      ];

      const mockMonthlyComparison = {
        currentMonth: 1000,
        previousMonth: 800,
        growthPercentage: 25,
      };

      mockAdminService.getPaymentStatistics.mockResolvedValue(mockStatistics);
      mockAdminService.getPaymentStatusDistribution.mockResolvedValue(mockStatusDistribution);
      mockAdminService.getMonthlyRevenueComparison.mockResolvedValue(mockMonthlyComparison);

      await adminController.getPaymentAnalytics(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.getPaymentStatistics).toHaveBeenCalled();
      expect(mockAdminService.getPaymentStatusDistribution).toHaveBeenCalled();
      expect(mockAdminService.getMonthlyRevenueComparison).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Payment analytics retrieved successfully',
        data: {
          statistics: mockStatistics,
          statusDistribution: mockStatusDistribution,
          monthlyComparison: mockMonthlyComparison,
        },
      });
    });
  });

  describe('getRevenueChart', () => {
    test('should get revenue chart with default date range', async () => {
      const mockRevenueData = [
        { date: '2023-10-01', revenue: 100, transactions: 2 },
        { date: '2023-10-02', revenue: 150, transactions: 3 },
      ];

      mockRequest.query = {};
      mockAdminService.getRevenueByDateRange.mockResolvedValue(mockRevenueData);

      await adminController.getRevenueChart(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.getRevenueByDateRange).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Revenue chart data retrieved successfully',
        data: mockRevenueData,
      });
    });

    test('should get revenue chart with custom date range', async () => {
      const mockRevenueData = [
        { date: '2023-09-01', revenue: 200, transactions: 4 },
      ];

      mockRequest.query = {
        startDate: '2023-09-01',
        endDate: '2023-09-30',
      };
      mockAdminService.getRevenueByDateRange.mockResolvedValue(mockRevenueData);

      await adminController.getRevenueChart(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.getRevenueByDateRange).toHaveBeenCalledWith(
        new Date('2023-09-01'),
        new Date('2023-09-30')
      );
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Revenue chart data retrieved successfully',
        data: mockRevenueData,
      });
    });
  });

  describe('getTopProviders', () => {
    test('should get top providers with default limit', async () => {
      const mockTopProviders = [
        {
          providerId: 'provider1',
          providerName: 'Provider One',
          totalRevenue: 1000,
          totalTransactions: 10,
        },
      ];

      mockRequest.query = {};
      mockAdminService.getTopProvidersByRevenue.mockResolvedValue(mockTopProviders);

      await adminController.getTopProviders(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.getTopProvidersByRevenue).toHaveBeenCalledWith(10);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Top providers retrieved successfully',
        data: mockTopProviders,
      });
    });

    test('should get top providers with custom limit', async () => {
      const mockTopProviders = [
        {
          providerId: 'provider1',
          providerName: 'Provider One',
          totalRevenue: 1000,
          totalTransactions: 10,
        },
      ];

      mockRequest.query = { limit: '5' };
      mockAdminService.getTopProvidersByRevenue.mockResolvedValue(mockTopProviders);

      await adminController.getTopProviders(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.getTopProvidersByRevenue).toHaveBeenCalledWith(5);
      expect(responseStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('getRecentPayments', () => {
    test('should get recent payments with default limit', async () => {
      const mockRecentPayments = [
        {
          id: 'payment1',
          amount: 100,
          currency: 'USD',
          status: 'SUCCEEDED',
          serviceName: 'Test Service',
          providerName: 'Provider One',
          customerName: 'Customer One',
          createdAt: new Date('2023-10-01'),
        },
      ];

      mockRequest.query = {};
      mockAdminService.getRecentPayments.mockResolvedValue(mockRecentPayments);

      await adminController.getRecentPayments(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.getRecentPayments).toHaveBeenCalledWith(20);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Recent payments retrieved successfully',
        data: mockRecentPayments,
      });
    });
  });

  describe('getPaymentStatistics', () => {
    test('should get payment statistics successfully', async () => {
      const mockStatistics = {
        totalRevenue: 1000,
        totalTransactions: 10,
        averageTransactionValue: 100,
        successfulTransactions: 8,
        failedTransactions: 2,
        pendingTransactions: 0,
        totalPlatformFees: 100,
        totalProviderEarnings: 900,
      };

      mockAdminService.getPaymentStatistics.mockResolvedValue(mockStatistics);

      await adminController.getPaymentStatistics(mockRequest as Request, mockResponse as Response);

      expect(mockAdminService.getPaymentStatistics).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Payment statistics retrieved successfully',
        data: mockStatistics,
      });
    });
  });
});