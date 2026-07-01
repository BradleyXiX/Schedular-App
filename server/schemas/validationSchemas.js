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
      .allow('')
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
      }),
    category_id: Joi.number()
      .integer()
      .optional()
      .allow(null),
    location: Joi.string()
      .max(255)
      .optional()
      .allow(''),
    is_recurring: Joi.boolean()
      .optional()
  }),

  update: Joi.object({
    title: Joi.string()
      .min(3)
      .max(255)
      .optional(),
    description: Joi.string()
      .max(1000)
      .optional()
      .allow(''),
    start_time: Joi.date()
      .optional(),
    end_time: Joi.date()
      .optional(),
    status: Joi.string()
      .valid('active', 'completed', 'cancelled')
      .optional()
      .messages({
        'any.only': 'Status must be one of: active, completed, cancelled'
      }),
    category_id: Joi.number()
      .integer()
      .optional()
      .allow(null),
    location: Joi.string()
      .max(255)
      .optional()
      .allow(''),
    is_recurring: Joi.boolean()
      .optional()
  })
};

export const categorySchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.min': 'Category name cannot be empty',
        'string.max': 'Category name cannot exceed 50 characters',
        'any.required': 'Category name is required'
      }),
    color_code: Joi.string()
      .pattern(/^#[0-9A-Fa-f]{6}$/)
      .required()
      .messages({
        'string.pattern.base': 'Color code must be a valid hex color (e.g. #3b82f6)',
        'any.required': 'Color code is required'
      })
  })
};

export const reminderSchemas = {
  create: Joi.object({
    schedule_id: Joi.number()
      .integer()
      .required()
      .messages({
        'any.required': 'Schedule ID is required'
      }),
    remind_at: Joi.date()
      .required()
      .messages({
        'any.required': 'Reminder time is required',
        'date.base': 'Reminder time must be a valid date'
      }),
    method: Joi.string()
      .valid('popup', 'email')
      .optional()
      .default('popup')
      .messages({
        'any.only': 'Method must be either popup or email'
      })
  })
};

export const recurrenceSchemas = {
  create: Joi.object({
    frequency: Joi.string()
      .valid('daily', 'weekly', 'monthly')
      .required()
      .messages({
        'any.only': 'Frequency must be one of: daily, weekly, monthly',
        'any.required': 'Frequency is required'
      }),
    interval: Joi.number()
      .integer()
      .min(1)
      .optional()
      .default(1)
      .messages({
        'number.min': 'Interval must be at least 1'
      }),
    end_date: Joi.date()
      .optional()
      .allow(null)
      .messages({
        'date.base': 'End date must be a valid date'
      })
  })
};
