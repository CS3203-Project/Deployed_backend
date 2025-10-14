import Joi from 'joi';

export const validatePaymentIntent = (req: any, res: any, next: any) => {
  const schema = Joi.object({
    serviceId: Joi.string().required().messages({
      'string.empty': 'Service ID is required',
      'any.required': 'Service ID is required',
    }),
    amount: Joi.number().positive().required().messages({
      'number.positive': 'Amount must be a positive number',
      'any.required': 'Amount is required',
    }),
    currency: Joi.string().length(3).default('lkr').messages({
      'string.length': 'Currency must be a 3-character code',
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map((detail) => detail.message),
    });
  }

  next();
};

export const validatePaymentConfirmation = (req: any, res: any, next: any) => {
  const schema = Joi.object({
    paymentIntentId: Joi.string().required().messages({
      'string.empty': 'Payment intent ID is required',
      'any.required': 'Payment intent ID is required',
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map((detail) => detail.message),
    });
  }

  next();
};

export const validateRefund = (req: any, res: any, next: any) => {
  const schema = Joi.object({
    amount: Joi.number().positive().optional().messages({
      'number.positive': 'Refund amount must be a positive number',
    }),
    reason: Joi.string().max(500).optional().messages({
      'string.max': 'Reason cannot exceed 500 characters',
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map((detail) => detail.message),
    });
  }

  next();
};