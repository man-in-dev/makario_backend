import Order from '../models/Order.model.js';

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
    ).lean();

    if (!order) {
      throw new Error('Order not found');
    }

    const { _id, __v, ...orderData } = order;
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
    ).lean();

    if (!order) {
      throw new Error('Order not found');
    }

    const { _id, __v, ...orderData } = order;
    return {
      ...orderData,
      id: _id.toString(),
    };
  },
};

