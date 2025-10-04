import { Router } from 'express';
const router: import('express').Router = Router();

import {
  createCategory,
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  getRootCategories,
  getCategoryHierarchy,
  searchCategories
} from '../controllers/category.controller.js';

import validate from '../middlewares/validation.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  categorySlugSchema,
  searchCategoriesSchema,
  categoryQuerySchema
} from '../validators/category.validator.js';

import authMiddleware from '../middlewares/auth.middleware.js';

// Public routes (no authentication required)
/**
 * @route GET /api/categories
 * @desc Get all categories with optional filtering
 * @access Public
 * @query parentId - Filter by parent category ID
 * @query includeChildren - Include children categories (default: true)
 * @query includeParent - Include parent category info (default: true)  
 * @query includeServices - Include services count (default: false)
 */
router.get('/', validate(categoryQuerySchema, 'query'), getCategories);

/**
 * @route GET /api/categories/roots
 * @desc Get all root categories (categories with no parent)
 * @access Public
 * @query includeChildren - Include children categories (default: true)
 */
router.get('/roots', validate(categoryQuerySchema, 'query'), getRootCategories);

/**
 * @route GET /api/categories/search
 * @desc Search categories by name or description
 * @access Public
 * @query q - Search term (required)
 * @query includeChildren - Include children categories (default: true)
 * @query includeParent - Include parent category info (default: true)
 */
router.get('/search', validate(searchCategoriesSchema, 'query'), searchCategories);

/**
 * @route GET /api/categories/id/:id
 * @desc Get category by ID
 * @access Public
 * @param id - Category ID
 * @query includeChildren - Include children categories (default: true)
 * @query includeParent - Include parent category info (default: true)
 * @query includeServices - Include services (default: false)
 */
router.get('/id/:id', validate(categoryIdSchema, 'params'), getCategoryById);

/**
 * @route GET /api/categories/slug/:slug
 * @desc Get category by slug
 * @access Public
 * @param slug - Category slug
 * @query includeChildren - Include children categories (default: true)
 * @query includeParent - Include parent category info (default: true)
 * @query includeServices - Include services (default: false)
 */
router.get('/slug/:slug', validate(categorySlugSchema, 'params'), getCategoryBySlug);

/**
 * @route GET /api/categories/:id/hierarchy
 * @desc Get category hierarchy (full tree starting from category)
 * @access Public
 * @param id - Category ID
 */
router.get('/:id/hierarchy', validate(categoryIdSchema, 'params'), getCategoryHierarchy);

// Protected routes (authentication required)
/**
 * @route POST /api/categories
 * @desc Create a new category
 * @access Public (For Testing)
 * @body name - Category name (optional)
 * @body slug - Category slug (required, unique)
 * @body description - Category description (optional)
 * @body parentId - Parent category ID (optional)
 */
router.post('/', validate(createCategorySchema), createCategory);

/**
 * @route PUT /api/categories/:id
 * @desc Update a category
 * @access Private (Admin/Provider)
 * @param id - Category ID
 * @body name - Category name (optional)
 * @body slug - Category slug (optional)
 * @body description - Category description (optional)
 * @body parentId - Parent category ID (optional)
 */
router.put('/:id', authMiddleware, validate(categoryIdSchema, 'params'), validate(updateCategorySchema), updateCategory);

/**
 * @route DELETE /api/categories/:id
 * @desc Delete a category
 * @access Private (Admin only)
 * @param id - Category ID
 * @query force - Force delete even if category has children or services (default: false)
 */
router.delete('/:id', authMiddleware, validate(categoryIdSchema, 'params'), deleteCategory);

export default router;
