// @ts-nocheck - Suppress mock typing errors in Jest tests
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import * as providerController from '../../src/controllers/provider.controller.js';
import * as providerService from '../../src/services/provider.service.js';

jest.mock('../../src/services/provider.service.js');

describe('Provider Controller', () => {
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

  describe('getProviderProfile', () => {
    it('should get provider profile successfully', async () => {
      (req as any).user = { id: 'provider-id' };
      const mockProvider = {
        id: 'provider-id',
        businessName: 'Test Business',
        email: 'provider@example.com',
      };

      (providerService.getProviderProfile as jest.Mock).mockResolvedValue(mockProvider);

      await providerController.getProviderProfile(req as Request, res as Response, next);

      expect(providerService.getProviderProfile).toHaveBeenCalledWith('provider-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProvider);
    });
  });

  describe('updateProvider', () => {
    it('should update provider profile successfully', async () => {
      (req as any).user = { id: 'provider-id' };
      req.body = {
        businessName: 'Updated Business',
        description: 'Updated description',
      };

      const mockUpdatedProvider = {
        id: 'provider-id',
        ...req.body,
      };

      (providerService.updateProvider as jest.Mock).mockResolvedValue(mockUpdatedProvider);

      await providerController.updateProvider(req as Request, res as Response, next);

      expect(providerService.updateProvider).toHaveBeenCalledWith('provider-id', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Service provider profile updated successfully',
        provider: mockUpdatedProvider,
      });
    });
  });

  describe('createProvider', () => {
    it('should create provider successfully', async () => {
      (req as any).user = { id: 'user-id' };
      req.body = {
        businessName: 'New Business',
        description: 'Business description',
      };

      const mockProvider = {
        id: 'provider-id',
        userId: 'user-id',
        ...req.body,
      };

      (providerService.createProvider as jest.Mock).mockResolvedValue(mockProvider);

      await providerController.createProvider(req as Request, res as Response, next);

      expect(providerService.createProvider).toHaveBeenCalledWith('user-id', req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Service provider profile created successfully',
        provider: mockProvider,
      });
    });
  });

  describe('getProviderById', () => {
    it('should get provider by ID successfully', async () => {
      req.params = { id: 'provider-id' };
      const mockProvider = {
        id: 'provider-id',
        businessName: 'Test Business',
      };

      (providerService.getProviderById as jest.Mock).mockResolvedValue(mockProvider);

      await providerController.getProviderById(req as Request, res as Response, next);

      expect(providerService.getProviderById).toHaveBeenCalledWith('provider-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProvider);
    });
  });

  describe('deleteProvider', () => {
    it('should delete provider successfully', async () => {
      (req as any).user = { id: 'user-id' };

      const mockResult = { message: 'Provider deleted successfully' };
      (providerService.deleteProvider as jest.Mock).mockResolvedValue(mockResult);

      await providerController.deleteProvider(req as Request, res as Response, next);

      expect(providerService.deleteProvider).toHaveBeenCalledWith('user-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });
});
