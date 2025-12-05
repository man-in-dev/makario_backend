import { orderService } from '../services/order.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const orderController = {
  async createOrder(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const order = await orderService.createOrder(req.body, userId);
      console.log(`Order created: ${order.orderId} by ${order.userEmail}`);
      return successResponse(res, { order }, 'Order created successfully', 201);
    } catch (error) {
      console.log('Create order error:', error.message);
      next(error);
    }
  },

  async getOrders(req, res, next) {
    try {
      // Check if admin wants all orders (query parameter ?all=true)
      const getAll = req.query.all === 'true';

      // If requesting all orders, require authentication
      if (getAll) {
        if (!req.user?.id) {
          return errorResponse(res, 'Authentication required to fetch all orders', 401);
        }
        const orders = await orderService.getOrders(null, null, true);
        return successResponse(res, { orders }, 'All orders retrieved successfully');
      }

      // Try to get user from token (optional auth)
      const userId = req.user?.id || null;
      const userEmail = req.user?.email || req.query.email || null;

      // If user is authenticated via token, use their email
      if (userId && req.user?.email) {
        const orders = await orderService.getOrders(userId, req.user.email);
        return successResponse(res, { orders }, 'Orders retrieved successfully');
      }

      // If no user but email provided in query, use that
      if (userEmail) {
        const orders = await orderService.getOrders(null, userEmail);
        return successResponse(res, { orders }, 'Orders retrieved successfully');
      }

      // If neither user nor email, return error
      return errorResponse(res, 'Authentication required or provide email query parameter', 401);
    } catch (error) {
      console.log('Get orders error:', error.message);
      next(error);
    }
  },

  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      // Try to get user from token (optional auth)
      const userId = req.user?.id || null;
      const userEmail = req.user?.email || req.query.email || null;

      // If user is authenticated via token, use their email
      if (userId && req.user?.email) {
        const order = await orderService.getOrderById(id, userId, req.user.email);
        return successResponse(res, { order }, 'Order retrieved successfully');
      }

      // If no user but email provided in query, use that
      if (userEmail) {
        const order = await orderService.getOrderById(id, null, userEmail);
        return successResponse(res, { order }, 'Order retrieved successfully');
      }

      // If neither user nor email, return error
      return errorResponse(res, 'Authentication required or provide email query parameter', 401);
    } catch (error) {
      console.log('Get order by ID error:', error.message);
      next(error);
    }
  },

  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const order = await orderService.updateOrderStatus(id, status, notes);
      console.log(`Order status updated: ${order.orderId} to ${status}`);
      return successResponse(res, { order }, 'Order status updated successfully');
    } catch (error) {
      console.log('Update order status error:', error.message);
      next(error);
    }
  },

  async updatePaymentDetails(req, res, next) {
    try {
      const { id } = req.params;
      const paymentDetails = req.body;

      const order = await orderService.updatePaymentDetails(id, paymentDetails);
      console.log(`Payment details updated for order: ${order.orderId}`);
      return successResponse(res, { order }, 'Payment details updated successfully');
    } catch (error) {
      console.log('Update payment details error:', error.message);
      next(error);
    }
  },
};

