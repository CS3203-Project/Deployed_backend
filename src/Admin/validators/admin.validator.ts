import Joi from 'joi';
import type { Request, Response, NextFunction } from 'express';

const adminRegistrationSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must only contain alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters',
      'any.required': 'Username is required',
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),
  firstName: Joi.string()
    .min(1)
    .max(50)
    .pattern(new RegExp('^[a-zA-Z\\s]+$'))
    .required()
    .messages({
      'string.min': 'First name must be at least 1 character long',
      'string.max': 'First name must not exceed 50 characters',
      'string.pattern.base': 'First name must only contain letters and spaces',
      'any.required': 'First name is required',
    }),
  lastName: Joi.string()
    .min(1)
    .max(50)
    .pattern(new RegExp('^[a-zA-Z\\s]+$'))
    .required()
    .messages({
      'string.min': 'Last name must be at least 1 character long',
      'string.max': 'Last name must not exceed 50 characters',
      'string.pattern.base': 'Last name must only contain letters and spaces',
      'any.required': 'Last name is required',
    }),
});

const adminLoginSchema = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      'any.required': 'Username is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});

const adminUpdateSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .optional()
    .messages({
      'string.alphanum': 'Username must only contain alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters',
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .optional()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),
  firstName: Joi.string()
    .min(1)
    .max(50)
    .pattern(new RegExp('^[a-zA-Z\\s]+$'))
    .optional()
    .messages({
      'string.min': 'First name must be at least 1 character long',
      'string.max': 'First name must not exceed 50 characters',
      'string.pattern.base': 'First name must only contain letters and spaces',
    }),
  lastName: Joi.string()
    .min(1)
    .max(50)
    .pattern(new RegExp('^[a-zA-Z\\s]+$'))
    .optional()
    .messages({
      'string.min': 'Last name must be at least 1 character long',
      'string.max': 'Last name must not exceed 50 characters',
      'string.pattern.base': 'Last name must only contain letters and spaces',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export const validateAdminRegistration = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = adminRegistrationSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  next();
};

export const validateAdminLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = adminLoginSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  next();
};

export const validateAdminUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = adminUpdateSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  next();
};

const serviceProviderVerificationSchema = Joi.object({
  isVerified: Joi.boolean()
    .strict()
    .required()
    .messages({
      'boolean.base': 'isVerified must be a boolean value',
      'any.required': 'isVerified is required',
    }),
});

export const validateServiceProviderVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = serviceProviderVerificationSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  // Validate providerId parameter
  const { providerId } = req.params;
  if (!providerId || typeof providerId !== 'string' || providerId.trim() === '') {
    res.status(400).json({
      success: false,
      message: 'Valid provider ID is required',
    });
    return;
  }

  next();
};
