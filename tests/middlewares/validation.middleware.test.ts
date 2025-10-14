import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import validationMiddleware from '../../src/middlewares/validation.middleware.js';

describe('Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
    } as Partial<Request>;
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;
    
    next = jest.fn() as NextFunction;
    jest.clearAllMocks();
  });

  it('should call next if validation passes', () => {
    const mockSchema = {
      validate: jest.fn().mockReturnValue({ error: null, value: req.body }),
    };

    const middleware = validationMiddleware(mockSchema as any);
    middleware(req as Request, res as Response, next);

    expect(mockSchema.validate).toHaveBeenCalledWith(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: false,
    });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if validation fails', () => {
    const validationError = {
      details: [
        { 
          message: 'Validation error',
          path: ['field1'],
        }
      ],
    };

    const mockSchema = {
      validate: jest.fn().mockReturnValue({
        error: validationError,
        value: req.body,
      }),
    };

    const middleware = validationMiddleware(mockSchema as any);
    middleware(req as Request, res as Response, next);

    expect(mockSchema.validate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return validation error details', () => {
    const validationError = {
      details: [
        { message: 'Email is required', path: ['email'] },
        { message: 'Password must be at least 8 characters', path: ['password'] },
      ],
    };

    const mockSchema = {
      validate: jest.fn().mockReturnValue({
        error: validationError,
        value: req.body,
      }),
    };

    const middleware = validationMiddleware(mockSchema as any);
    middleware(req as Request, res as Response, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed',
      errors: [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password must be at least 8 characters' },
      ],
    });
  });
});
