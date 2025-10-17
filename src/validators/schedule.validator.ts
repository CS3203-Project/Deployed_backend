import Joi from 'joi';

export const serviceIdSchema = Joi.object({
  params: Joi.object({
    serviceId: Joi.string().required(),
  }),
});

export const createScheduleSchema = Joi.object({
  serviceId: Joi.string().required(),
  providerId: Joi.string().required(),
  userId: Joi.string().required(),
  startTime: Joi.string().required(),
  endTime: Joi.string().required(),
  queueValue: Joi.number().optional(),
  currency: Joi.string().default('RS'),
  serviceFee: Joi.number().positive().optional(),
});

export const updateScheduleSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    startTime: Joi.string().optional(),
    endTime: Joi.string().optional(),
    queueValue: Joi.number().optional(),
    customerConfirmation: Joi.boolean().optional(),
    providerConfirmation: Joi.boolean().optional(),
    currency: Joi.string().optional(),
    serviceFee: Joi.number().positive().optional(),
  }),
});
