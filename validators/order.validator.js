import Joi from 'joi';

const orderItemSchema = Joi.object({
  productId: Joi.string().required().messages({
    'string.empty': 'Product ID is required',
  }),
  name: Joi.string().required().messages({
    'string.empty': 'Product name is required',
  }),
  price: Joi.number().positive().required().messages({
    'number.positive': 'Price must be positive',
    'any.required': 'Price is required',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),
  image: Joi.string().optional().allow(''),
});

const shippingInfoSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Full name is required',
    'string.min': 'Full name must be at least 2 characters',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.empty': 'Phone number is required',
    'string.pattern.base': 'Phone number must be 10 digits',
  }),
  address: Joi.string().min(5).required().messages({
    'string.empty': 'Address is required',
    'string.min': 'Address must be at least 5 characters',
  }),
  city: Joi.string().min(2).required().messages({
    'string.empty': 'City is required',
  }),
  state: Joi.string().min(2).required().messages({
    'string.empty': 'State is required',
  }),
  pincode: Joi.string().pattern(/^[0-9]{6}$/).required().messages({
    'string.empty': 'Pincode is required',
    'string.pattern.base': 'Pincode must be 6 digits',
  }),
});

export const createOrderValidator = Joi.object({
  items: Joi.array().items(orderItemSchema).min(1).required().messages({
    'array.min': 'Order must have at least one item',
    'any.required': 'Items are required',
  }),
  shippingInfo: shippingInfoSchema.required(),
  paymentMethod: Joi.string().valid('cod', 'online').required().messages({
    'any.only': 'Payment method must be either cod or online',
    'any.required': 'Payment method is required',
  }),
  paymentDetails: Joi.object({
    paymentStatus: Joi.string().valid('pending', 'completed', 'failed').optional(),
    cashfreeOrderId: Joi.string().optional().allow(''),
    cashfreePaymentId: Joi.string().optional().allow(''),
    cashfreePaymentStatus: Joi.string().optional().allow(''),
    cashfreePaymentSessionId: Joi.string().optional().allow(''),
  }).optional(),
  subtotal: Joi.number().min(0).required().messages({
    'number.min': 'Subtotal must be 0 or greater',
    'any.required': 'Subtotal is required',
  }),
  shippingCharge: Joi.number().min(0).optional().default(50),
  discount: Joi.number().min(0).optional().default(0),
  coupon: Joi.string().optional().allow(null, ''),
  total: Joi.number().min(0).required().messages({
    'number.min': 'Total must be 0 or greater',
    'any.required': 'Total is required',
  }),
  notes: Joi.string().optional().allow(''),
});

export const updateOrderStatusValidator = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').required().messages({
    'any.only': 'Invalid order status',
    'any.required': 'Status is required',
  }),
  notes: Joi.string().optional().allow(''),
});

