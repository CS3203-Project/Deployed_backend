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
 * Get categories with optional filtering
 */
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { parentId, includeChildren, includeParent, includeServices } = req.query;
    
    const filters = {
      ...(parentId && { parentId: parentId as string }),
      ...(includeChildren !== undefined && { includeChildren: includeChildren === 'true' }),
      ...(includeParent !== undefined && { includeParent: includeParent === 'true' }),
      ...(includeServices !== undefined && { includeServices: includeServices === 'true' })
    };

    const categories = await categoryService.getAllCategories(filters);
    
    res.status(200).json({
      success: true,
      message: 'Categories fetched successfully',
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
    const { includeChildren, includeParent, includeServices } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }
    
    const options = {
      ...(includeChildren !== undefined && { includeChildren: includeChildren === 'true' }),
      ...(includeParent !== undefined && { includeParent: includeParent === 'true' }),
      ...(includeServices !== undefined && { includeServices: includeServices === 'true' })
    };

    const category = await categoryService.getCategoryById(id, options);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category fetched successfully',
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
    const { includeChildren, includeParent, includeServices } = req.query;
    
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Category slug is required'
      });
    }
    
    const options = {
      ...(includeChildren !== undefined && { includeChildren: includeChildren === 'true' }),
      ...(includeParent !== undefined && { includeParent: includeParent === 'true' }),
      ...(includeServices !== undefined && { includeServices: includeServices === 'true' })
    };

    const category = await categoryService.getCategoryBySlug(slug, options);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category fetched successfully',
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

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    const updatedCategory = await categoryService.updateCategory(id, updateData);
    
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
    const { force } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }
    
    const options = {
      ...(force !== undefined && { force: force === 'true' })
    };

    const deletedCategory = await categoryService.deleteCategory(id, options);
    
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
 * Get root categories
 */
export const getRootCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { includeChildren, includeServices } = req.query;
    
    const options = {
      ...(includeChildren !== undefined && { includeChildren: includeChildren === 'true' }),
      ...(includeServices !== undefined && { includeServices: includeServices === 'true' })
    };

    const categories = await categoryService.getRootCategories(options);
    
    res.status(200).json({
      success: true,
      message: 'Root categories fetched successfully',
      data: categories
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

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    const hierarchy = await categoryService.getCategoryHierarchy(id);
    
    if (!hierarchy) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category hierarchy fetched successfully',
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
    const { includeChildren, includeParent } = req.query;
    
    if (!searchTerm || typeof searchTerm !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    const options = {
      ...(includeChildren !== undefined && { includeChildren: includeChildren === 'true' }),
      ...(includeParent !== undefined && { includeParent: includeParent === 'true' })
    };

    const categories = await categoryService.searchCategories(searchTerm, options);
    
    res.status(200).json({
      success: true,
      message: 'Categories search completed',
      data: categories
    });
  } catch (error) {
    next(error);
  }
};
