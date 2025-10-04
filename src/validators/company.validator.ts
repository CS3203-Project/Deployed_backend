import Joi from 'joi';

export const createCompanySchema = Joi.object({
  name: Joi.string().max(255).required(),
  description: Joi.string().max(1000).optional(),
  logo: Joi.string().uri().optional(),
  address: Joi.string().max(500).optional(),
  contact: Joi.string().max(100).optional(),
  socialmedia: Joi.array().items(Joi.string().uri()).optional()
});

export const updateCompanySchema = Joi.object({
  name: Joi.string().max(255).optional(),
  description: Joi.string().max(1000).optional(),
  logo: Joi.string().uri().optional(),
  address: Joi.string().max(500).optional(),
  contact: Joi.string().max(100).optional(),
  socialmedia: Joi.array().items(Joi.string().uri()).optional()
});
