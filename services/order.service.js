import Order from '../models/Order.model.js';
import { shipwayService } from './shipway.service.js';
import dotenv from 'dotenv';
dotenv.config();

// Check if auto-shipment creation is enabled
const AUTO_CREATE_SHIPMENT = process.env.SHIPWAY_AUTO_CREATE_SHIPMENT === 'true';

export const orderService = {
  async createOrder(orderData, userId = null) {
    // Calculate total if not provided
    const subtotal = orderData.subtotal || orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCharge = orderData.shippingCharge || 50;
    const discount = orderData.discount || 0;
    const total = orderData.total || (subtotal + shippingCharge - discount);

    // Determine initial status based on payment method
    let status = 'pending';
    if (orderData.paymentMethod === 'cod') {
      status = 'confirmed';
    } else if (orderData.paymentDetails?.paymentStatus === 'completed') {
      status = 'confirmed';
    }

    // Generate orderId before creating order
    const orderId = orderData.orderId || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const order = await Order.create({
      orderId,
      items: orderData.items,
      shippingInfo: orderData.shippingInfo,
      paymentMethod: orderData.paymentMethod,
      paymentDetails: orderData.paymentDetails || {},
      subtotal,
      shippingCharge,
      discount,
      coupon: orderData.coupon || null,
      total,
      status,
      userId: userId || null,
      userEmail: orderData.shippingInfo.email,
      notes: orderData.notes || '',
    });

    return order.toJSON();
  },

  async getOrders(userId = null, userEmail = null, getAll = false) {
    const query = {};

    // If getAll is true, don't filter by user (for admin)
    if (!getAll) {
      if (userId) {
        query.userId = userId;
      } else if (userEmail) {
        query.userEmail = userEmail.toLowerCase();
      } else {
        throw new Error('Either userId or userEmail must be provided');
      }
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return orders.map(order => {
      const { _id, __v, ...orderData } = order;
      return {
        ...orderData,
        id: _id.toString(),
      };
    });
  },

  async getOrderById(orderId, userId = null, userEmail = null) {
    const query = { $or: [] };

    if (orderId.includes('ORD-')) {
      query.$or.push({ orderId });
    } else {
      query.$or.push({ _id: orderId });
    }

    // Add user filter if provided
    if (userId) {
      query.userId = userId;
    } else if (userEmail) {
      query.userEmail = userEmail.toLowerCase();
    }

    const order = await Order.findOne(query).lean();

    if (!order) {
      throw new Error('Order not found');
    }

    const { _id, __v, ...orderData } = order;
    return {
      ...orderData,
      id: _id.toString(),
    };
  },

  async updateOrderStatus(orderId, status, notes = '') {
    const query = {};

    if (orderId.includes('ORD-')) {
      query.orderId = orderId;
    } else {
      query._id = orderId;
    }

    const order = await Order.findOneAndUpdate(
      query,
      {
        $set: { status, notes },
        $setOnInsert: { updatedAt: new Date() }
      },
      { new: true, runValidators: true }
    );

    if (!order) {
      throw new Error('Order not found');
    }

    // Auto-create shipment if enabled and order is confirmed/processing
    if (AUTO_CREATE_SHIPMENT && (status === 'confirmed' || status === 'processing')) {
      if (!order.shippingDetails?.shipmentId) {
        try {
          const shipmentData = await shipwayService.createShipment(order.toJSON());

          order.shippingDetails = {
            shipmentId: shipmentData.shipmentId,
            trackingNumber: shipmentData.trackingNumber,
            awbNumber: shipmentData.awbNumber,
            courierName: shipmentData.courierName,
            courierTrackingUrl: shipmentData.courierTrackingUrl,
            labelUrl: shipmentData.labelUrl,
            manifestUrl: shipmentData.manifestUrl,
            status: shipmentData.status,
            estimatedDeliveryDate: shipmentData.estimatedDeliveryDate,
            shipwayData: shipmentData.rawResponse,
          };

          if (status === 'confirmed') {
            order.status = 'processing';
          }

          await order.save();
          console.log(`Auto-created shipment for order: ${order.orderId}`);
        } catch (error) {
          console.error(`Failed to auto-create shipment for order ${order.orderId}:`, error.message);
          // Don't throw error - order status update should still succeed
        }
      }
    }

    const { _id, __v, ...orderData } = order.toObject();
    return {
      ...orderData,
      id: _id.toString(),
    };
  },

  async updatePaymentDetails(orderId, paymentDetails) {
    const query = {};

    if (orderId.includes('ORD-')) {
      query.orderId = orderId;
    } else {
      query._id = orderId;
    }

    const order = await Order.findOneAndUpdate(
      query,
      {
        $set: {
          'paymentDetails': paymentDetails,
          status: paymentDetails.paymentStatus === 'completed' ? 'confirmed' : 'pending'
        }
      },
      { new: true, runValidators: true }
    );

    if (!order) {
      throw new Error('Order not found');
    }

    // Auto-create shipment if payment is completed and auto-create is enabled
    if (AUTO_CREATE_SHIPMENT && paymentDetails.paymentStatus === 'completed') {
      if (!order.shippingDetails?.shipmentId) {
        try {
          const shipmentData = await shipwayService.createShipment(order.toJSON());

          order.shippingDetails = {
            shipmentId: shipmentData.shipmentId,
            trackingNumber: shipmentData.trackingNumber,
            awbNumber: shipmentData.awbNumber,
            courierName: shipmentData.courierName,
            courierTrackingUrl: shipmentData.courierTrackingUrl,
            labelUrl: shipmentData.labelUrl,
            manifestUrl: shipmentData.manifestUrl,
            status: shipmentData.status,
            estimatedDeliveryDate: shipmentData.estimatedDeliveryDate,
            shipwayData: shipmentData.rawResponse,
          };

          order.status = 'processing';
          await order.save();
          console.log(`Auto-created shipment for order: ${order.orderId} after payment completion`);
        } catch (error) {
          console.error(`Failed to auto-create shipment for order ${order.orderId}:`, error.message);
          // Don't throw error - payment update should still succeed
        }
      }
    }

    const { _id, __v, ...orderData } = order.toObject();
    return {
      ...orderData,
      id: _id.toString(),
    };
  },
};

