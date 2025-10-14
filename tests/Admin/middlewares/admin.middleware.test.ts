import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

// Mock the dependencies first
const mockJwtVerify = jest.fn();
const mockJwtSign = jest.fn();

jest.mock('../../../src/Admin/services/admin.service');
jest.mock('jsonwebtoken', () => ({
  sign: mockJwtSign,
  verify: mockJwtVerify,
}));

// Now import the modules
import { adminAuthMiddleware, adminOptionalMiddleware } from '../../../src/Admin/middlewares/admin.middleware';
import { adminService } from '../../../src/Admin/services/admin.service';

const mockAdminService = adminService as jest.Mocked<typeof adminService>;

describe('Admin Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let responseJson: jest.MockedFunction<any>;
  let responseStatus: jest.MockedFunction<any>;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnThis();
    mockNext = jest.fn() as any;
    
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };
    
    jest.clearAllMocks();
  });

  describe('adminAuthMiddleware', () => {
    test('should authenticate admin successfully with valid token', async () => {
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

      mockRequest.headers!.authorization = 'Bearer valid.jwt.token';
      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);

      await adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwtVerify).toHaveBeenCalledWith('valid.jwt.token', 'test-secret-key');
      expect(mockAdminService.getAdminById).toHaveBeenCalledWith(1);
      expect((mockRequest as any).admin).toEqual(mockAdmin);
      expect(mockNext).toHaveBeenCalled();
      expect(responseStatus).not.toHaveBeenCalled();
      expect(responseJson).not.toHaveBeenCalled();
    });

    test('should return 401 if no authorization header provided', async () => {
      mockRequest.headers!.authorization = undefined;

      await adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Access token is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 if authorization header does not start with Bearer', async () => {
      mockRequest.headers!.authorization = 'Basic some-token';

      await adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Access token is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 if token is invalid', async () => {
      mockRequest.headers!.authorization = 'Bearer invalid.jwt.token';
      mockJwtVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 if admin not found', async () => {
      const mockDecodedToken = {
        adminId: 999,
        username: 'nonexistent',
        role: 'ADMIN',
      };

      mockRequest.headers!.authorization = 'Bearer valid.jwt.token';
      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(null);

      await adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Admin not found',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 403 if role is not ADMIN', async () => {
      const mockDecodedToken = {
        adminId: 1,
        username: 'testuser',
        role: 'USER',
      };

      const mockAdmin = {
        id: 1,
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockRequest.headers!.authorization = 'Bearer valid.jwt.token';
      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);

      await adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Admin access required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle internal server error', async () => {
      mockRequest.headers!.authorization = 'Bearer valid.jwt.token';
      mockJwtVerify.mockImplementation(() => {
        throw new Error('Some unexpected error');
      });

      await adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle database error when getting admin', async () => {
      const mockDecodedToken = {
        adminId: 1,
        username: 'testadmin',
        role: 'ADMIN',
      };

      mockRequest.headers!.authorization = 'Bearer valid.jwt.token';
      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockRejectedValue(new Error('Database error'));

      await adminAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('adminOptionalMiddleware', () => {
    test('should authenticate admin if valid token provided', async () => {
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

      mockRequest.headers!.authorization = 'Bearer valid.jwt.token';
      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(mockAdmin);

      await adminOptionalMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwtVerify).toHaveBeenCalledWith('valid.jwt.token', 'test-secret-key');
      expect(mockAdminService.getAdminById).toHaveBeenCalledWith(1);
      expect((mockRequest as any).admin).toEqual(mockAdmin);
      expect(mockNext).toHaveBeenCalled();
      expect(responseStatus).not.toHaveBeenCalled();
      expect(responseJson).not.toHaveBeenCalled();
    });

    test('should continue without authentication if no authorization header', async () => {
      mockRequest.headers!.authorization = undefined;

      await adminOptionalMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwtVerify).not.toHaveBeenCalled();
      expect(mockAdminService.getAdminById).not.toHaveBeenCalled();
      expect((mockRequest as any).admin).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(responseStatus).not.toHaveBeenCalled();
      expect(responseJson).not.toHaveBeenCalled();
    });

    test('should continue without authentication if header does not start with Bearer', async () => {
      mockRequest.headers!.authorization = 'Basic some-token';

      await adminOptionalMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwtVerify).not.toHaveBeenCalled();
      expect(mockAdminService.getAdminById).not.toHaveBeenCalled();
      expect((mockRequest as any).admin).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(responseStatus).not.toHaveBeenCalled();
      expect(responseJson).not.toHaveBeenCalled();
    });

    test('should continue without authentication if token is invalid', async () => {
      mockRequest.headers!.authorization = 'Bearer invalid.jwt.token';
      mockJwtVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await adminOptionalMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwtVerify).toHaveBeenCalledWith('invalid.jwt.token', 'test-secret-key');
      expect((mockRequest as any).admin).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(responseStatus).not.toHaveBeenCalled();
      expect(responseJson).not.toHaveBeenCalled();
    });

    test('should continue without authentication if role is not ADMIN', async () => {
      const mockDecodedToken = {
        adminId: 1,
        username: 'testuser',
        role: 'USER',
      };

      mockRequest.headers!.authorization = 'Bearer valid.jwt.token';
      mockJwtVerify.mockReturnValue(mockDecodedToken);

      await adminOptionalMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwtVerify).toHaveBeenCalledWith('valid.jwt.token', 'test-secret-key');
      expect(mockAdminService.getAdminById).not.toHaveBeenCalled();
      expect((mockRequest as any).admin).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(responseStatus).not.toHaveBeenCalled();
      expect(responseJson).not.toHaveBeenCalled();
    });

    test('should continue without authentication if admin not found', async () => {
      const mockDecodedToken = {
        adminId: 999,
        username: 'nonexistent',
        role: 'ADMIN',
      };

      mockRequest.headers!.authorization = 'Bearer valid.jwt.token';
      mockJwtVerify.mockReturnValue(mockDecodedToken);
      mockAdminService.getAdminById.mockResolvedValue(null);

      await adminOptionalMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwtVerify).toHaveBeenCalledWith('valid.jwt.token', 'test-secret-key');
      expect(mockAdminService.getAdminById).toHaveBeenCalledWith(999);
      expect((mockRequest as any).admin).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(responseStatus).not.toHaveBeenCalled();
      expect(responseJson).not.toHaveBeenCalled();
    });

    test('should continue without authentication on any error', async () => {
      mockRequest.headers!.authorization = 'Bearer valid.jwt.token';
      mockAdminService.getAdminById.mockRejectedValue(new Error('Database error'));

      await adminOptionalMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(responseStatus).not.toHaveBeenCalled();
      expect(responseJson).not.toHaveBeenCalled();
    });
  });
});