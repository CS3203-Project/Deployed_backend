import { describe, expect, test, beforeEach, jest, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock the dependencies first
const mockJwtSign = jest.fn();
const mockJwtVerify = jest.fn();

jest.mock('../../../src/Admin/services/admin.service');
jest.mock('jsonwebtoken', () => ({
  sign: mockJwtSign,
  verify: mockJwtVerify,
}));

// Now import the modules
import adminRoutes from '../../../src/Admin/routes/admin.route';
import { adminService } from '../../../src/Admin/services/admin.service';

const mockAdminService = adminService as jest.Mocked<typeof adminService>;

describe('Admin Routes Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/admin', adminRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /admin/register', () => {
    test('should register a new admin successfully', async () => {
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

      mockAdminService.getAdminByUsername.mockResolvedValue(null);
      mockAdminService.createAdmin.mockResolvedValue(mockCreatedAdmin);

      const response = await request(app)
        .post('/admin/register')
        .send(adminData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Admin created successfully',
        data: mockCreatedAdmin,
      });
    });

    test('should return validation error for invalid data', async () => {
      const invalidData = {
        username: 'ab', // too short
        password: 'weak', // doesn't meet requirements
      };

      const response = await request(app)
        .post('/admin/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /admin/login', () => {
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

      mockAdminService.loginAdmin.mockResolvedValue(mockAdmin);
      mockJwtSign.mockReturnValue(mockToken);

      const response = await request(app)
        .post('/admin/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toEqual({
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
        password: 'wrongpassword',
      };

      mockAdminService.loginAdmin.mockResolvedValue(null);

      const response = await request(app)
        .post('/admin/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid username or password',
      });
    });

    test('should return validation error for missing credentials', async () => {
      const response = await request(app)
        .post('/admin/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /admin/profile', () => {
    test('should get admin profile successfully', async () => {
      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockDecodedToken = {
        adminId: 1,
        username: 'testadmin',
        role: 'ADMIN',
      };

      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .get('/admin/profile')
        .set('Authorization', 'Bearer valid.jwt.token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockAdmin,
      });
    });

    test('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/admin/profile')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Access token is required',
      });
    });
  });

  describe('PUT /admin/profile', () => {
    test('should update admin profile successfully', async () => {
      const updateData = {
        firstName: 'UpdatedJohn',
        lastName: 'UpdatedDoe',
      };

      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockUpdatedAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'UpdatedJohn',
        lastName: 'UpdatedDoe',
      };

      const mockDecodedToken = {
        adminId: 1,
        username: 'testadmin',
        role: 'ADMIN',
      };

      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);
      mockAdminService.updateAdmin.mockResolvedValue(mockUpdatedAdmin);

      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', 'Bearer valid.jwt.token')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Profile updated successfully',
        data: mockUpdatedAdmin,
      });
    });

    test('should return validation error for empty update data', async () => {
      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockDecodedToken = {
        adminId: 1,
        username: 'testadmin',
        role: 'ADMIN',
      };

      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', 'Bearer valid.jwt.token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /admin/all', () => {
    test('should get all admins successfully', async () => {
      const mockAdmins = [
        { id: 1, username: 'admin1', firstName: 'John', lastName: 'Doe' },
        { id: 2, username: 'admin2', firstName: 'Jane', lastName: 'Smith' },
      ];

      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockDecodedToken = {
        adminId: 1,
        username: 'testadmin',
        role: 'ADMIN',
      };

      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);
      mockAdminService.getAllAdmins.mockResolvedValue(mockAdmins);

      const response = await request(app)
        .get('/admin/all')
        .set('Authorization', 'Bearer valid.jwt.token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockAdmins,
      });
    });
  });

  describe('GET /admin/service-providers', () => {
    test('should get all service providers successfully', async () => {
      const mockServiceProviders = [
        {
          id: 'provider1',
          user: {
            firstName: 'Provider',
            lastName: 'One',
          },
          services: [],
        },
      ];

      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockDecodedToken = {
        adminId: 1,
        username: 'testadmin',
        role: 'ADMIN',
      };

      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);
      mockAdminService.getAllServiceProvidersWithDetails.mockResolvedValue(mockServiceProviders as any);

      const response = await request(app)
        .get('/admin/service-providers')
        .set('Authorization', 'Bearer valid.jwt.token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Service providers fetched successfully');
      expect(response.body.data).toEqual(mockServiceProviders);
      expect(response.body.count).toBe(1);
    });
  });

  describe('PUT /admin/service-providers/:providerId/verification', () => {
    test('should update service provider verification successfully', async () => {
      const providerId = 'provider123';
      const verificationData = { isVerified: true };

      const mockUpdatedProvider = {
        id: 'provider123',
        isVerified: true,
        user: {
          firstName: 'Provider',
          lastName: 'One',
        },
      };

      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockDecodedToken = {
        adminId: 1,
        username: 'testadmin',
        role: 'ADMIN',
      };

      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);
      mockAdminService.updateServiceProviderVerification.mockResolvedValue(mockUpdatedProvider);

      const response = await request(app)
        .put(`/admin/service-providers/${providerId}/verification`)
        .set('Authorization', 'Bearer valid.jwt.token')
        .send(verificationData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Service provider approved successfully',
        data: mockUpdatedProvider,
      });
    });

    test('should return validation error for invalid verification data', async () => {
      const providerId = 'provider123';
      const invalidData = { isVerified: 'invalid' }; // should be boolean

      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockDecodedToken = {
        adminId: 1,
        username: 'testadmin',
        role: 'ADMIN',
      };

      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .put(`/admin/service-providers/${providerId}/verification`)
        .set('Authorization', 'Bearer valid.jwt.token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /admin/customers/count', () => {
    test('should get customer count successfully', async () => {
      const expectedCount = 25;

      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockDecodedToken = {
        adminId: 1,
        username: 'testadmin',
        role: 'ADMIN',
      };

      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);
      mockAdminService.getCustomerCount.mockResolvedValue(expectedCount);

      const response = await request(app)
        .get('/admin/customers/count')
        .set('Authorization', 'Bearer valid.jwt.token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Customer count fetched successfully',
        data: {
          count: expectedCount,
        },
      });
    });
  });

  describe('GET /admin/customers', () => {
    test('should get all customers successfully', async () => {
      const mockCustomers = [
        {
          id: 'user1',
          email: 'customer1@example.com',
          firstName: 'Customer',
          lastName: 'One',
        },
      ];

      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockDecodedToken = {
        adminId: 1,
        username: 'testadmin',
        role: 'ADMIN',
      };

      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);
      mockAdminService.getAllCustomers.mockResolvedValue(mockCustomers as any);

      const response = await request(app)
        .get('/admin/customers')
        .set('Authorization', 'Bearer valid.jwt.token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('All customers fetched successfully');
      expect(response.body.data).toEqual(mockCustomers);
      expect(response.body.count).toBe(1);
    });
  });

  describe('GET /admin/analytics/payments', () => {
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

      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockDecodedToken = {
        adminId: 1,
        username: 'testadmin',
        role: 'ADMIN',
      };

      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);
      mockAdminService.getPaymentStatistics.mockResolvedValue(mockStatistics);
      mockAdminService.getPaymentStatusDistribution.mockResolvedValue(mockStatusDistribution);
      mockAdminService.getMonthlyRevenueComparison.mockResolvedValue(mockMonthlyComparison);

      const response = await request(app)
        .get('/admin/analytics/payments')
        .set('Authorization', 'Bearer valid.jwt.token')
        .expect(200);

      expect(response.body).toEqual({
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

  describe('GET /admin/analytics/revenue-chart', () => {
    test('should get revenue chart data successfully', async () => {
      const mockRevenueData = [
        { date: '2023-10-01', revenue: 100, transactions: 2 },
        { date: '2023-10-02', revenue: 150, transactions: 3 },
      ];

      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockDecodedToken = {
        adminId: 1,
        username: 'testadmin',
        role: 'ADMIN',
      };

      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);
      mockAdminService.getRevenueByDateRange.mockResolvedValue(mockRevenueData);

      const response = await request(app)
        .get('/admin/analytics/revenue-chart')
        .set('Authorization', 'Bearer valid.jwt.token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Revenue chart data retrieved successfully',
        data: mockRevenueData,
      });
    });
  });

  describe('GET /admin/analytics/top-providers', () => {
    test('should get top providers successfully', async () => {
      const mockTopProviders = [
        {
          providerId: 'provider1',
          providerName: 'Provider One',
          totalRevenue: 1000,
          totalTransactions: 10,
        },
      ];

      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockDecodedToken = {
        adminId: 1,
        username: 'testadmin',
        role: 'ADMIN',
      };

      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);
      mockAdminService.getTopProvidersByRevenue.mockResolvedValue(mockTopProviders);

      const response = await request(app)
        .get('/admin/analytics/top-providers')
        .set('Authorization', 'Bearer valid.jwt.token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Top providers retrieved successfully',
        data: mockTopProviders,
      });
    });
  });

  describe('GET /admin/analytics/recent-payments', () => {
    test('should get recent payments successfully', async () => {
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

      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockDecodedToken = {
        adminId: 1,
        username: 'testadmin',
        role: 'ADMIN',
      };

      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);
      mockAdminService.getRecentPayments.mockResolvedValue(mockRecentPayments);

      const response = await request(app)
        .get('/admin/analytics/recent-payments')
        .set('Authorization', 'Bearer valid.jwt.token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Recent payments retrieved successfully',
        data: [
          {
            id: 'payment1',
            amount: 100,
            currency: 'USD',
            status: 'SUCCEEDED',
            serviceName: 'Test Service',
            providerName: 'Provider One',
            customerName: 'Customer One',
            createdAt: '2023-10-01T00:00:00.000Z',
          },
        ],
      });
    });
  });

  describe('GET /admin/analytics/payment-statistics', () => {
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

      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockDecodedToken = {
        adminId: 1,
        username: 'testadmin',
        role: 'ADMIN',
      };

      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);
      mockAdminService.getPaymentStatistics.mockResolvedValue(mockStatistics);

      const response = await request(app)
        .get('/admin/analytics/payment-statistics')
        .set('Authorization', 'Bearer valid.jwt.token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Payment statistics retrieved successfully',
        data: mockStatistics,
      });
    });
  });
});

