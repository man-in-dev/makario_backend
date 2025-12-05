import express from 'express';
import { orderController } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { optionalAuthenticate } from '../middleware/optionalAuth.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import {
  createOrderValidator,
  updateOrderStatusValidator,
} from '../validators/order.validator.js';

const router = express.Router();

// Create order (optional auth - for guest checkout)
router.post('/', optionalAuthenticate, validate(createOrderValidator), orderController.createOrder);

// Get orders (optional auth - allows email query for guest orders)
router.get('/', optionalAuthenticate, orderController.getOrders);

// Get order by ID (optional auth - allows email query for guest orders)
router.get('/:id', optionalAuthenticate, orderController.getOrderById);

// Update order status (protected - typically admin only, but keeping flexible)
router.put('/:id/status', authenticate, validate(updateOrderStatusValidator), orderController.updateOrderStatus);

// Update payment details (optional auth - for guest checkout payment updates)
router.put('/:id/payment', optionalAuthenticate, orderController.updatePaymentDetails);

export default router;

