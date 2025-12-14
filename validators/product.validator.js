import Joi from 'joi';

const productImageSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    'string.empty': 'Image URL is required',
    'string.uri': 'Image URL must be a valid URI',
  }),
  alt: Joi.string().optional().allow(''),
  featured: Joi.boolean().optional().default(false),
});

const specificationsSchema = Joi.object({
  weight: Joi.string().optional().allow(''),
  speciality: Joi.string().optional().allow(''),
  brand: Joi.string().optional().allow(''),
  countryOfOrigin: Joi.string().optional().allow(''),
  flavor: Joi.string().optional().allow(''),
  storage: Joi.string().optional().allow(''),
  type: Joi.string().optional().allow(''),
}).optional();

const nutritionalInfoSchema = Joi.object({
  servingSize: Joi.string().optional().allow(''),
  calories: Joi.string().optional().allow(''),
  fat: Joi.string().optional().allow(''),
  protein: Joi.string().optional().allow(''),
  sugars: Joi.string().optional().allow(''),
  carbohydrates: Joi.string().optional().allow(''),
  ingredients: Joi.string().optional().allow(''),
}).optional();

export const createProductValidator = Joi.object({
  title: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Product title is required',
    'string.min': 'Product title must be at least 1 character',
    'string.max': 'Product title must not exceed 255 characters',
    'any.required': 'Product title is required',
  }),
  description: Joi.string().optional().allow(''),
  category: Joi.string().valid('Raw Makhana', 'Classic Makhana', 'Premium', 'Organic', 'Flavored', 'Gifting').required().messages({
    'any.only': 'Invalid category',
    'any.required': 'Category is required',
  }),
  sku: Joi.string().min(1).required().messages({
    'string.empty': 'SKU is required',
    'any.required': 'SKU is required',
  }),
  price: Joi.number().positive().required().messages({
    'number.positive': 'Price must be positive',
    'any.required': 'Price is required',
  }),
  compareAtPrice: Joi.number().positive().optional().allow(null, '').messages({
    'number.positive': 'Compare at price must be positive',
  }),
  stock: Joi.number().integer().min(0).required().messages({
    'number.min': 'Stock must be 0 or greater',
    'any.required': 'Stock is required',
  }),
  images: Joi.array().items(productImageSchema).optional().default([]),
  rating: Joi.number().min(0).max(5).optional().default(0),
  reviewCount: Joi.number().integer().min(0).optional().default(0),
  features: Joi.array().items(Joi.string()).optional().default([]),
  specifications: specificationsSchema,
  nutritionalInfo: nutritionalInfoSchema,
  isActive: Joi.boolean().optional().default(true),
});

export const updateProductValidator = Joi.object({
  title: Joi.string().min(1).max(255).optional().messages({
    'string.min': 'Product title must be at least 1 character',
    'string.max': 'Product title must not exceed 255 characters',
  }),
  description: Joi.string().optional().allow(''),
  category: Joi.string().valid('Raw Makhana', 'Classic Makhana', 'Premium', 'Organic', 'Flavored', 'Gifting').optional(),
  sku: Joi.string().min(1).optional().messages({
    'string.empty': 'SKU cannot be empty',
  }),
  price: Joi.number().positive().optional().messages({
    'number.positive': 'Price must be positive',
  }),
  compareAtPrice: Joi.number().positive().optional().allow(null, '').messages({
    'number.positive': 'Compare at price must be positive',
  }),
  stock: Joi.number().integer().min(0).optional().messages({
    'number.min': 'Stock must be 0 or greater',
  }),
  images: Joi.array().items(productImageSchema).optional(),
  rating: Joi.number().min(0).max(5).optional(),
  reviewCount: Joi.number().integer().min(0).optional(),
  features: Joi.array().items(Joi.string()).optional(),
  specifications: specificationsSchema,
  nutritionalInfo: nutritionalInfoSchema,
  isActive: Joi.boolean().optional(),
});

export const updateStockValidator = Joi.object({
  stock: Joi.number().integer().min(0).required().messages({
    'number.min': 'Stock must be 0 or greater',
    'any.required': 'Stock is required',
  }),
});

