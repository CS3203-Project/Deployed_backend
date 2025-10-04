import type { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/category.service.js';

/**
 * Create a new category
 */
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoryData = req.body;
    const newCategory = await categoryService.createCategory(categoryData);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all categories with optional filtering
 */
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      parentId: req.query.parentId as string | null,
      includeChildren: req.query.includeChildren !== 'false',
      includeParent: req.query.includeParent !== 'false',
      includeServices: req.query.includeServices === 'true'
    };

    const categories = await categoryService.getAllCategories(filters);
    
    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const options = {
      includeChildren: req.query.includeChildren !== 'false',
      includeParent: req.query.includeParent !== 'false',
      includeServices: req.query.includeServices === 'true'
    };

    const category = await categoryService.getCategoryById(id!, options);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by slug
 */
export const getCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const options = {
      includeChildren: req.query.includeChildren !== 'false',
      includeParent: req.query.includeParent !== 'false',
      includeServices: req.query.includeServices === 'true'
    };

    const category = await categoryService.getCategoryBySlug(slug!, options);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 */
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedCategory = await categoryService.updateCategory(id!, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category
 */
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const options = {
      force: req.query.force === 'true'
    };

    const deletedCategory = await categoryService.deleteCategory(id!, options);
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: deletedCategory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get root categories (categories with no parent)
 */
export const getRootCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options = {
      includeChildren: req.query.includeChildren !== 'false'
    };

    const rootCategories = await categoryService.getRootCategories(options);
    
    res.status(200).json({
      success: true,
      message: 'Root categories retrieved successfully',
      data: rootCategories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category hierarchy
 */
export const getCategoryHierarchy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const hierarchy = await categoryService.getCategoryHierarchy(id!);
    
    if (!hierarchy) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category hierarchy retrieved successfully',
      data: hierarchy
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search categories
 */
export const searchCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q: searchTerm } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    const options = {
      includeChildren: req.query.includeChildren !== 'false',
      includeParent: req.query.includeParent !== 'false'
    };

    const categories = await categoryService.searchCategories(searchTerm as string, options);
    
    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: categories,
      searchTerm
    });
  } catch (error) {
    next(error);
  }
};
