import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import authMiddleware from '../../src/middlewares/auth.middleware.js';

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    } as Partial<Request>;
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;
    
    next = jest.fn() as NextFunction;
    
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('should authenticate valid token', () => {
    const mockDecoded = { id: 'user123', email: 'test@example.com' };
    req.headers = { authorization: 'Bearer valid-token' };
    
    (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

    authMiddleware(req as Request, res as Response, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    expect((req as any).user).toEqual(mockDecoded);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header is missing', () => {
    req.headers = {};

    authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: Token missing' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header does not start with Bearer', () => {
    req.headers = { authorization: 'InvalidFormat token' };

    authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: Token missing' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', () => {
    req.headers = { authorization: 'Bearer invalid-token' };
    
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: Token invalid' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is expired', () => {
    req.headers = { authorization: 'Bearer expired-token' };
    
    (jwt.verify as jest.Mock).mockImplementation(() => {
      const error: any = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      throw error;
    });

    authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: Token invalid' });
    expect(next).not.toHaveBeenCalled();
  });
});
