import Joi from 'joi';

/**
 * Validation schema for creating a category
 */
export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Category name must be at least 2 characters long',
    'string.max': 'Category name must not exceed 100 characters'
  }),
  
  slug: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .required()
    .messages({
      'string.min': 'Slug must be at least 2 characters long',
      'string.max': 'Slug must not exceed 100 characters',
      'string.pattern.base': 'Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen',
      'any.required': 'Slug is required'
    }),
  
  description: Joi.string().min(10).max(500).optional().messages({
    'string.min': 'Description must be at least 10 characters long',
    'string.max': 'Description must not exceed 500 characters'
  }),
  
  parentId: Joi.string().optional().allow(null).messages({
    'string.empty': 'Parent ID cannot be empty string'
  })
});

/**
 * Validation schema for updating a category
 */
export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Category name must be at least 2 characters long',
    'string.max': 'Category name must not exceed 100 characters'
  }),
  
  slug: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional()
    .messages({
      'string.min': 'Slug must be at least 2 characters long',
      'string.max': 'Slug must not exceed 100 characters',
      'string.pattern.base': 'Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen'
    }),
  
  description: Joi.string().min(10).max(500).optional().allow(null).messages({
    'string.min': 'Description must be at least 10 characters long',
    'string.max': 'Description must not exceed 500 characters'
  }),
  
  parentId: Joi.string().optional().allow(null).messages({
    'string.empty': 'Parent ID cannot be empty string'
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Validation schema for category ID parameter
 */
export const categoryIdSchema = Joi.object({
  id: Joi.string().required().messages({
    'string.empty': 'Category ID is required',
    'any.required': 'Category ID is required'
  })
});

/**
 * Validation schema for category slug parameter
 */
export const categorySlugSchema = Joi.object({
  slug: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .required()
    .messages({
      'string.min': 'Slug must be at least 2 characters long',
      'string.max': 'Slug must not exceed 100 characters',
      'string.pattern.base': 'Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen',
      'any.required': 'Slug is required'
    })
});

/**
 * Validation schema for search query
 */
export const searchCategoriesSchema = Joi.object({
  q: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Search term must be at least 2 characters long',
    'string.max': 'Search term must not exceed 100 characters',
    'any.required': 'Search term (q) is required'
  })
});

/**
 * Validation schema for query parameters
 */
export const categoryQuerySchema = Joi.object({
  parentId: Joi.string().optional(),
  includeChildren: Joi.string().valid('true', 'false').optional(),
  includeParent: Joi.string().valid('true', 'false').optional(),
  includeServices: Joi.string().valid('true', 'false').optional(),
  force: Joi.string().valid('true', 'false').optional()
}).unknown(true); // Allow other query parameters
