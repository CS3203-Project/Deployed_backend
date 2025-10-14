import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import {
  validateAdminRegistration,
  validateAdminLogin,
  validateAdminUpdate,
  validateServiceProviderVerification,
} from '../../../src/Admin/validators/admin.validator';

describe('Admin Validators', () => {
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
      body: {},
      params: {},
    };
    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };
    
    jest.clearAllMocks();
  });

  describe('validateAdminRegistration', () => {
    test('should pass validation with valid admin registration data', () => {
      mockRequest.body = {
        username: 'testadmin',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      validateAdminRegistration(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(responseStatus).not.toHaveBeenCalled();
      expect(responseJson).not.toHaveBeenCalled();
    });

    test('should fail validation with missing required fields', () => {
      mockRequest.body = {
        username: 'testadmin',
        // missing password, firstName, lastName
      };

      validateAdminRegistration(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: 'Password is required',
          }),
          expect.objectContaining({
            field: 'firstName',
            message: 'First name is required',
          }),
          expect.objectContaining({
            field: 'lastName',
            message: 'Last name is required',
          }),
        ]),
      });
    });

    test('should fail validation with invalid username', () => {
      mockRequest.body = {
        username: 'ab', // too short
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      validateAdminRegistration(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'username',
            message: 'Username must be at least 3 characters long',
          }),
        ]),
      });
    });

    test('should fail validation with invalid password', () => {
      mockRequest.body = {
        username: 'testadmin',
        password: 'weak', // doesn't meet complexity requirements
        firstName: 'John',
        lastName: 'Doe',
      };

      validateAdminRegistration(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: expect.stringContaining('Password must contain at least one uppercase letter'),
          }),
        ]),
      });
    });

    test('should fail validation with invalid firstName', () => {
      mockRequest.body = {
        username: 'testadmin',
        password: 'TestPassword123!',
        firstName: 'John123', // contains numbers
        lastName: 'Doe',
      };

      validateAdminRegistration(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'firstName',
            message: 'First name must only contain letters and spaces',
          }),
        ]),
      });
    });

    test('should fail validation with invalid lastName', () => {
      mockRequest.body = {
        username: 'testadmin',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe@', // contains special character
      };

      validateAdminRegistration(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'lastName',
            message: 'Last name must only contain letters and spaces',
          }),
        ]),
      });
    });
  });

  describe('validateAdminLogin', () => {
    test('should pass validation with valid login data', () => {
      mockRequest.body = {
        username: 'testadmin',
        password: 'TestPassword123!',
      };

      validateAdminLogin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(responseStatus).not.toHaveBeenCalled();
      expect(responseJson).not.toHaveBeenCalled();
    });

    test('should fail validation with missing username', () => {
      mockRequest.body = {
        password: 'TestPassword123!',
      };

      validateAdminLogin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'username',
            message: 'Username is required',
          }),
        ]),
      });
    });

    test('should fail validation with missing password', () => {
      mockRequest.body = {
        username: 'testadmin',
      };

      validateAdminLogin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: 'Password is required',
          }),
        ]),
      });
    });

    test('should fail validation with both username and password missing', () => {
      mockRequest.body = {};

      validateAdminLogin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'username',
            message: 'Username is required',
          }),
          expect.objectContaining({
            field: 'password',
            message: 'Password is required',
          }),
        ]),
      });
    });
  });

  describe('validateAdminUpdate', () => {
    test('should pass validation with valid update data', () => {
      mockRequest.body = {
        username: 'updatedadmin',
        firstName: 'UpdatedJohn',
      };

      validateAdminUpdate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(responseStatus).not.toHaveBeenCalled();
      expect(responseJson).not.toHaveBeenCalled();
    });

    test('should pass validation with only username update', () => {
      mockRequest.body = {
        username: 'newusername',
      };

      validateAdminUpdate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(responseStatus).not.toHaveBeenCalled();
      expect(responseJson).not.toHaveBeenCalled();
    });

    test('should pass validation with only password update', () => {
      mockRequest.body = {
        password: 'NewPassword123!',
      };

      validateAdminUpdate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(responseStatus).not.toHaveBeenCalled();
      expect(responseJson).not.toHaveBeenCalled();
    });

    test('should fail validation with empty body', () => {
      mockRequest.body = {};

      validateAdminUpdate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            message: 'At least one field must be provided for update',
          }),
        ]),
      });
    });

    test('should fail validation with invalid username in update', () => {
      mockRequest.body = {
        username: 'ab', // too short
      };

      validateAdminUpdate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'username',
            message: 'Username must be at least 3 characters long',
          }),
        ]),
      });
    });

    test('should fail validation with invalid password in update', () => {
      mockRequest.body = {
        password: 'weak', // doesn't meet complexity requirements
      };

      validateAdminUpdate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: expect.stringContaining('Password must contain at least one uppercase letter'),
          }),
        ]),
      });
    });

    test('should fail validation with invalid firstName in update', () => {
      mockRequest.body = {
        firstName: 'John123', // contains numbers
      };

      validateAdminUpdate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'firstName',
            message: 'First name must only contain letters and spaces',
          }),
        ]),
      });
    });

    test('should fail validation with invalid lastName in update', () => {
      mockRequest.body = {
        lastName: 'Doe@', // contains special character
      };

      validateAdminUpdate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'lastName',
            message: 'Last name must only contain letters and spaces',
          }),
        ]),
      });
    });
  });

  describe('validateServiceProviderVerification', () => {
    test('should pass validation with valid verification data', () => {
      mockRequest.body = {
        isVerified: true,
      };
      mockRequest.params = {
        providerId: 'provider123',
      };

      validateServiceProviderVerification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(responseStatus).not.toHaveBeenCalled();
      expect(responseJson).not.toHaveBeenCalled();
    });

    test('should pass validation with isVerified as false', () => {
      mockRequest.body = {
        isVerified: false,
      };
      mockRequest.params = {
        providerId: 'provider123',
      };

      validateServiceProviderVerification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(responseStatus).not.toHaveBeenCalled();
      expect(responseJson).not.toHaveBeenCalled();
    });

    test('should fail validation with missing isVerified', () => {
      mockRequest.body = {};
      mockRequest.params = {
        providerId: 'provider123',
      };

      validateServiceProviderVerification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'isVerified',
            message: 'isVerified is required',
          }),
        ]),
      });
    });

    test('should fail validation with non-boolean isVerified', () => {
      mockRequest.body = {
        isVerified: 'true', // string instead of boolean
      };
      mockRequest.params = {
        providerId: 'provider123',
      };

      validateServiceProviderVerification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'isVerified',
            message: 'isVerified must be a boolean value',
          }),
        ]),
      });
    });

    test('should fail validation with missing providerId', () => {
      mockRequest.body = {
        isVerified: true,
      };
      mockRequest.params = {};

      validateServiceProviderVerification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Valid provider ID is required',
      });
    });

    test('should fail validation with empty providerId', () => {
      mockRequest.body = {
        isVerified: true,
      };
      mockRequest.params = {
        providerId: '',
      };

      validateServiceProviderVerification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Valid provider ID is required',
      });
    });

    test('should fail validation with whitespace-only providerId', () => {
      mockRequest.body = {
        isVerified: true,
      };
      mockRequest.params = {
        providerId: '   ',
      };

      validateServiceProviderVerification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Valid provider ID is required',
      });
    });
  });
});