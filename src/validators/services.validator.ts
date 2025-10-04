import Joi from 'joi';

/**
 * Validation schema for creating a service
 */
export const createServiceSchema = Joi.object({
  providerId: Joi.string().required().messages({
    'string.empty': 'Provider ID is required',
    'any.required': 'Provider ID is required'
  }),
  
  categoryId: Joi.string().required().messages({
    'string.empty': 'Category ID is required',
    'any.required': 'Category ID is required'
  }),
  
  title: Joi.string().min(3).max(100).optional().messages({
    'string.min': 'Title must be at least 3 characters long',
    'string.max': 'Title must not exceed 100 characters'
  }),
  
  description: Joi.string().min(10).max(1000).optional().messages({
    'string.min': 'Description must be at least 10 characters long',
    'string.max': 'Description must not exceed 1000 characters'
  }),
  
  price: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Price must be a positive number',
    'any.required': 'Price is required'
  }),
  
  currency: Joi.string().length(3).uppercase().optional().default('USD').messages({
    'string.length': 'Currency must be a 3-character code (e.g., USD, EUR)',
    'string.uppercase': 'Currency must be uppercase'
  }),
  
  tags: Joi.array().items(Joi.string().min(2).max(30)).max(10).optional().default([]).messages({
    'array.max': 'Maximum 10 tags allowed',
    'string.min': 'Each tag must be at least 2 characters long',
    'string.max': 'Each tag must not exceed 30 characters'
  }),
  
  images: Joi.array().items(Joi.string().uri()).max(5).optional().default([]).messages({
    'array.max': 'Maximum 5 images allowed',
    'string.uri': 'Each image must be a valid URL'
  }),
  
  videoUrl: Joi.string().optional().custom((value, helpers) => {
    // Allow empty/null values
    if (!value) return value;
    
    try {
      // Try to create a URL object - this will handle most valid URLs including S3 URLs with encoded characters
      new URL(value);
      return value;
    } catch (error) {
      // If URL constructor fails, try to URL encode any spaces and special characters
      try {
        const encodedUrl = value.replace(/\s/g, '%20');
        new URL(encodedUrl);
        return value; // Return original value, not encoded
      } catch (encodedError) {
        return helpers.error('string.uri');
      }
    }
  }).messages({
    'string.uri': 'Video URL must be a valid URL'
  }),
  
  isActive: Joi.boolean().optional().default(true),
  
  workingTime: Joi.array().items(
    Joi.string().pattern(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*\d{1,2}:\d{2}\s*(AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(AM|PM)$/i)
  ).max(7).optional().default([]).messages({
    'array.max': 'Maximum 7 working time slots allowed (one per day)',
    'string.pattern.base': 'Working time must be in format "Day: HH:MM AM/PM - HH:MM AM/PM" (e.g., "Monday: 9:00 AM - 5:00 PM")'
  })
});

/**
 * Validation schema for updating a service
 */
export const updateServiceSchema = Joi.object({
  title: Joi.string().min(3).max(100).optional().messages({
    'string.min': 'Title must be at least 3 characters long',
    'string.max': 'Title must not exceed 100 characters'
  }),
  
  description: Joi.string().min(10).max(1000).optional().messages({
    'string.min': 'Description must be at least 10 characters long',
    'string.max': 'Description must not exceed 1000 characters'
  }),
  
  price: Joi.number().positive().precision(2).optional().messages({
    'number.positive': 'Price must be a positive number'
  }),
  
  currency: Joi.string().length(3).uppercase().optional().messages({
    'string.length': 'Currency must be a 3-character code (e.g., USD, EUR)',
    'string.uppercase': 'Currency must be uppercase'
  }),
  
  tags: Joi.array().items(Joi.string().min(2).max(30)).max(10).optional().messages({
    'array.max': 'Maximum 10 tags allowed',
    'string.min': 'Each tag must be at least 2 characters long',
    'string.max': 'Each tag must not exceed 30 characters'
  }),
  
  images: Joi.array().items(Joi.string().uri()).max(5).optional().messages({
    'array.max': 'Maximum 5 images allowed',
    'string.uri': 'Each image must be a valid URL'
  }),
  
  videoUrl: Joi.string().optional().custom((value, helpers) => {
    // Allow empty/null values
    if (!value) return value;
    
    try {
      // Try to create a URL object - this will handle most valid URLs including S3 URLs with encoded characters
      new URL(value);
      return value;
    } catch (error) {
      // If URL constructor fails, try to URL encode any spaces and special characters
      try {
        const encodedUrl = value.replace(/\s/g, '%20');
        new URL(encodedUrl);
        return value; // Return original value, not encoded
      } catch (encodedError) {
        return helpers.error('string.uri');
      }
    }
  }).messages({
    'string.uri': 'Video URL must be a valid URL'
  }),
  
  isActive: Joi.boolean().optional(),
  
  workingTime: Joi.array().items(
    Joi.string().pattern(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*\d{1,2}:\d{2}\s*(AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(AM|PM)$/i)
  ).max(7).optional().messages({
    'array.max': 'Maximum 7 working time slots allowed (one per day)',
    'string.pattern.base': 'Working time must be in format "Day: HH:MM AM/PM - HH:MM AM/PM" (e.g., "Monday: 9:00 AM - 5:00 PM")'
  })
});

/**
 * Validation schema for service query parameters
 */
export const getServicesQuerySchema = Joi.object({
  providerId: Joi.string().optional(),
  categoryId: Joi.string().optional(),
  isActive: Joi.string().valid('true', 'false').optional(),
  skip: Joi.number().integer().min(0).optional().default(0),
  take: Joi.number().integer().min(1).max(100).optional().default(10)
});

/**
 * Validation schema for service ID parameter
 */
export const serviceIdSchema = Joi.object({
  id: Joi.string().required().messages({
    'string.empty': 'Service ID is required',
    'any.required': 'Service ID is required'
  })
});

/**
 * Validation schema for conversation ID parameter
 */
export const conversationIdSchema = Joi.object({
  conversationId: Joi.string().required().messages({
    'string.empty': 'Conversation ID is required',
    'any.required': 'Conversation ID is required'
  })
});
