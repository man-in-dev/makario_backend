import Joi from 'joi';

export const registerValidator = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must not exceed 100 characters',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional().allow('').messages({
    'string.pattern.base': 'Phone number must be 10 digits',
  }),
  address: Joi.string().optional().allow(''),
  city: Joi.string().optional().allow(''),
  state: Joi.string().optional().allow(''),
  pincode: Joi.string().optional().allow(''),
});

export const loginValidator = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

export const updateProfileValidator = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional().allow(''),
  address: Joi.string().optional().allow(''),
  city: Joi.string().optional().allow(''),
  state: Joi.string().optional().allow(''),
  pincode: Joi.string().optional().allow(''),
  addresses: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      street: Joi.string().optional().allow(''),
      city: Joi.string().optional().allow(''),
      state: Joi.string().optional().allow(''),
      pincode: Joi.string().optional().allow(''),
      phone: Joi.string().optional().allow(''),
      label: Joi.string().optional(),
      isDefault: Joi.boolean().optional(),
    })
  ).optional(),
});

