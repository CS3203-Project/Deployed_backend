import Joi from 'joi';

export const registerSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  imageUrl: Joi.string().uri().optional(),
  location: Joi.string().optional(),
  address: Joi.string().optional(),
  phone: Joi.string().pattern(/^[0-9]{11}$/).optional(),
  socialmedia: Joi.array().items(Joi.string()).optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  imageUrl: Joi.string().uri().optional(),
  location: Joi.string().optional(),
  address: Joi.string().optional(),
  phone: Joi.string().pattern(/^[0-9]{11}$/).optional(),
  socialmedia: Joi.array().items(Joi.string()).optional()
});
