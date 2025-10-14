// @ts-nocheck - Suppress mock typing errors in Jest tests
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import * as categoryController from '../../src/controllers/category.controller.js';
import * as categoryService from '../../src/services/category.service.js';

jest.mock('../../src/services/category.service.js');

describe('Category Controller', () => {
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

  describe('createCategory', () => {
    it('should create a category successfully', async () => {
      const categoryData = {
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description',
      };

      req.body = categoryData;
      const mockCategory = { id: '1', ...categoryData };
      
      (categoryService.createCategory as jest.Mock).mockResolvedValue(mockCategory);

      await categoryController.createCategory(req as Request, res as Response, next);

      expect(categoryService.createCategory).toHaveBeenCalledWith(categoryData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Category created successfully',
        data: mockCategory,
      });
    });

    it('should handle errors during category creation', async () => {
      req.body = { slug: 'test' };
      const error = new Error('Creation failed');
      
      (categoryService.createCategory as jest.Mock).mockRejectedValue(error);

      await categoryController.createCategory(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCategories', () => {
    it('should get all categories successfully', async () => {
      const mockCategories = [
        { id: '1', name: 'Category 1', slug: 'category-1' },
        { id: '2', name: 'Category 2', slug: 'category-2' },
      ];

      (categoryService.getAllCategories as jest.Mock).mockResolvedValue(mockCategories);

      await categoryController.getCategories(req as Request, res as Response, next);

      expect(categoryService.getAllCategories).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Categories fetched successfully',
        data: mockCategories,
      });
    });

    it('should apply filters when provided', async () => {
      req.query = {
        parentId: 'parent-id',
        includeChildren: 'true',
        includeParent: 'true',
      };

      (categoryService.getAllCategories as jest.Mock).mockResolvedValue([]);

      await categoryController.getCategories(req as Request, res as Response, next);

      expect(categoryService.getAllCategories).toHaveBeenCalledWith({
        parentId: 'parent-id',
        includeChildren: true,
        includeParent: true,
      });
    });
  });

  describe('getCategoryById', () => {
    it('should get category by ID successfully', async () => {
      req.params = { id: 'category-id' };
      const mockCategory = { id: 'category-id', name: 'Test Category' };

      (categoryService.getCategoryById as jest.Mock).mockResolvedValue(mockCategory);

      await categoryController.getCategoryById(req as Request, res as Response, next);

      expect(categoryService.getCategoryById).toHaveBeenCalledWith('category-id', {});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Category fetched successfully',
        data: mockCategory,
      });
    });

    it('should return 400 if ID is not provided', async () => {
      req.params = {};

      await categoryController.getCategoryById(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category ID is required',
      });
    });

    it('should return 404 if category not found', async () => {
      req.params = { id: 'non-existent' };
      (categoryService.getCategoryById as jest.Mock).mockResolvedValue(null);

      await categoryController.getCategoryById(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category not found',
      });
    });
  });

  describe('getCategoryBySlug', () => {
    it('should get category by slug successfully', async () => {
      req.params = { slug: 'test-category' };
      const mockCategory = { id: '1', slug: 'test-category', name: 'Test' };

      (categoryService.getCategoryBySlug as jest.Mock).mockResolvedValue(mockCategory);

      await categoryController.getCategoryBySlug(req as Request, res as Response, next);

      expect(categoryService.getCategoryBySlug).toHaveBeenCalledWith('test-category', {});
    });

    it('should return 400 if slug is not provided', async () => {
      req.params = {};

      await categoryController.getCategoryBySlug(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category slug is required',
      });
    });
  });
});
