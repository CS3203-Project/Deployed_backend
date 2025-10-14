// @ts-nocheck - Suppress mock typing errors in Jest tests
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import * as companyController from '../../src/controllers/company.controller.js';
import * as companyService from '../../src/services/company.service.js';

jest.mock('../../src/services/company.service.js');

describe('Company Controller', () => {
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

  describe('createCompany', () => {
    it('should create a company successfully', async () => {
      const companyData = {
        name: 'Test Company',
        description: 'Test description',
        logo: 'https://example.com/logo.png',
      };

      req.body = companyData;
      (req as any).user = { id: 'user-id' };
      const mockCompany = { id: '1', providerId: 'provider-id', ...companyData };
      
      (companyService.createCompany as jest.Mock).mockResolvedValue(mockCompany);

      await companyController.createCompany(req as Request, res as Response, next);

      expect(companyService.createCompany).toHaveBeenCalledWith('user-id', companyData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company created successfully',
        company: mockCompany,
      });
    });

    it('should handle errors during company creation', async () => {
      req.body = { name: 'Test Company' };
      (req as any).user = { id: 'user-id' };
      const error = new Error('Provider profile not found');
      
      (companyService.createCompany as jest.Mock).mockRejectedValue(error);

      await companyController.createCompany(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCompanies', () => {
    it('should get all companies successfully', async () => {
      (req as any).user = { id: 'user-id' };
      const mockCompanies = [
        { id: '1', name: 'Company 1' },
        { id: '2', name: 'Company 2' },
      ];

      (companyService.getCompanies as jest.Mock).mockResolvedValue(mockCompanies);

      await companyController.getCompanies(req as Request, res as Response, next);

      expect(companyService.getCompanies).toHaveBeenCalledWith('user-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCompanies);
    });
  });

  describe('updateCompany', () => {
    it('should update company successfully', async () => {
      req.params = { companyId: 'company-id' };
      req.body = { name: 'Updated Company' };
      (req as any).user = { id: 'user-id' };

      const mockUpdatedCompany = { id: 'company-id', ...req.body };
      (companyService.updateCompany as jest.Mock).mockResolvedValue(mockUpdatedCompany);

      await companyController.updateCompany(req as Request, res as Response, next);

      expect(companyService.updateCompany).toHaveBeenCalledWith('user-id', 'company-id', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company updated successfully',
        company: mockUpdatedCompany,
      });
    });
  });

  describe('deleteCompany', () => {
    it('should delete company successfully', async () => {
      req.params = { companyId: 'company-id' };
      (req as any).user = { id: 'user-id' };

      (companyService.deleteCompany as jest.Mock).mockResolvedValue(undefined);

      await companyController.deleteCompany(req as Request, res as Response, next);

      expect(companyService.deleteCompany).toHaveBeenCalledWith('user-id', 'company-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company deleted successfully',
      });
    });
  });
});
