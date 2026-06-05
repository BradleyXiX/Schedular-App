import Joi from 'joi';

export const authSchemas = {
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.alphanum': 'Username must contain only alphanumeric characters',
        'string.min': 'Username must be at least 3 characters',
        'string.max': 'Username cannot exceed 50 characters',
        'any.required': 'Username is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email must be valid',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain uppercase, lowercase, and numbers',
        'any.required': 'Password is required'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email must be valid',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  })
};

export const scheduleSchemas = {
  create: Joi.object({
    title: Joi.string()
      .min(3)
      .max(255)
      .required()
      .messages({
        'string.min': 'Title must be at least 3 characters',
        'string.max': 'Title cannot exceed 255 characters',
        'any.required': 'Title is required'
      }),
    description: Joi.string()
      .max(1000)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 1000 characters'
      }),
    start_time: Joi.date()
      .required()
      .messages({
        'any.required': 'Start time is required',
        'date.base': 'Start time must be a valid date'
      }),
    end_time: Joi.date()
      .required()
      .min(Joi.ref('start_time'))
      .messages({
        'any.required': 'End time is required',
        'date.base': 'End time must be a valid date',
        'date.min': 'End time must be after start time'
      })
  }),

  update: Joi.object({
    title: Joi.string()
      .min(3)
      .max(255)
      .optional(),
    description: Joi.string()
      .max(1000)
      .optional(),
    start_time: Joi.date()
      .optional(),
    end_time: Joi.date()
      .optional(),
    status: Joi.string()
      .valid('active', 'completed', 'cancelled')
      .optional()
      .messages({
        'any.only': 'Status must be one of: active, completed, cancelled'
      })
  })
};
