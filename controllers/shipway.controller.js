import { shipwayService } from '../services/shipway.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import Order from '../models/Order.model.js';

export const shipwayController = {
  /**
   * Create a shipment for an order
   */
  async createShipment(req, res, next) {
    try {
      const { orderId } = req.params;

      // Find the order
      const order = await Order.findOne({ 
        $or: [
          { orderId },
          { _id: orderId }
        ]
      });

      if (!order) {
        return errorResponse(res, 'Order not found', 404);
      }

      // Check if shipment already exists
      if (order.shippingDetails?.shipmentId) {
        return errorResponse(res, 'Shipment already created for this order', 400);
      }

      // Create shipment in Shipway
      const shipmentData = await shipwayService.createShipment(order.toJSON());

      // Update order with shipping details
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

      // Update order status to processing if it's confirmed
      if (order.status === 'confirmed') {
        order.status = 'processing';
      }

      await order.save();

      console.log(`Shipment created for order: ${order.orderId}, Shipment ID: ${shipmentData.shipmentId}`);

      return successResponse(res, {
        order: order.toJSON(),
        shipment: shipmentData,
      }, 'Shipment created successfully');
    } catch (error) {
      console.error('Create shipment error:', error.message);
      return errorResponse(
        res,
        error.message || 'Failed to create shipment',
        500
      );
    }
  },

  /**
   * Track a shipment
   */
  async trackShipment(req, res, next) {
    try {
      const { orderId } = req.params;

      // Find the order
      const order = await Order.findOne({ 
        $or: [
          { orderId },
          { _id: orderId }
        ]
      });

      if (!order) {
        return errorResponse(res, 'Order not found', 404);
      }

      if (!order.shippingDetails?.trackingNumber && !order.shippingDetails?.awbNumber) {
        return errorResponse(res, 'No tracking number found for this order', 404);
      }

      const trackingNumber = order.shippingDetails.trackingNumber || order.shippingDetails.awbNumber;

      // Track shipment in Shipway
      const trackingData = await shipwayService.trackShipment(trackingNumber);

      // Update order shipping details with latest tracking info
      if (order.shippingDetails) {
        order.shippingDetails.status = trackingData.status;
        order.shippingDetails.estimatedDeliveryDate = trackingData.estimatedDeliveryDate;
        order.shippingDetails.deliveredDate = trackingData.deliveredDate;
        order.shippingDetails.shipwayData = {
          ...order.shippingDetails.shipwayData,
          tracking: trackingData.rawResponse,
        };

        // Update order status based on shipment status
        if (trackingData.status === 'delivered' && order.status !== 'delivered') {
          order.status = 'delivered';
        } else if (trackingData.status === 'in_transit' || trackingData.status === 'out_for_delivery') {
          if (order.status !== 'shipped') {
            order.status = 'shipped';
          }
        }
      }

      await order.save();

      return successResponse(res, {
        order: order.toJSON(),
        tracking: trackingData,
      }, 'Tracking information retrieved successfully');
    } catch (error) {
      console.error('Track shipment error:', error.message);
      return errorResponse(
        res,
        error.message || 'Failed to track shipment',
        500
      );
    }
  },

  /**
   * Get shipping label for an order
   */
  async getLabel(req, res, next) {
    try {
      const { orderId } = req.params;

      // Find the order
      const order = await Order.findOne({ 
        $or: [
          { orderId },
          { _id: orderId }
        ]
      });

      if (!order) {
        return errorResponse(res, 'Order not found', 404);
      }

      if (!order.shippingDetails?.shipmentId) {
        return errorResponse(res, 'No shipment found for this order', 404);
      }

      // Get label from Shipway
      const labelData = await shipwayService.getLabel(order.shippingDetails.shipmentId);

      // Update label URL in order if not already set
      if (!order.shippingDetails.labelUrl && labelData.labelUrl) {
        order.shippingDetails.labelUrl = labelData.labelUrl;
        await order.save();
      }

      return successResponse(res, {
        label: labelData,
      }, 'Label retrieved successfully');
    } catch (error) {
      console.error('Get label error:', error.message);
      return errorResponse(
        res,
        error.message || 'Failed to get label',
        500
      );
    }
  },

  /**
   * Cancel a shipment
   */
  async cancelShipment(req, res, next) {
    try {
      const { orderId } = req.params;

      // Find the order
      const order = await Order.findOne({ 
        $or: [
          { orderId },
          { _id: orderId }
        ]
      });

      if (!order) {
        return errorResponse(res, 'Order not found', 404);
      }

      if (!order.shippingDetails?.shipmentId) {
        return errorResponse(res, 'No shipment found for this order', 404);
      }

      // Cancel shipment in Shipway
      const cancelData = await shipwayService.cancelShipment(order.shippingDetails.shipmentId);

      // Update order shipping details
      order.shippingDetails.status = 'cancelled';
      order.status = 'cancelled';
      await order.save();

      return successResponse(res, {
        order: order.toJSON(),
        cancellation: cancelData,
      }, 'Shipment cancelled successfully');
    } catch (error) {
      console.error('Cancel shipment error:', error.message);
      return errorResponse(
        res,
        error.message || 'Failed to cancel shipment',
        500
      );
    }
  },

  /**
   * Get available couriers for a pincode
   */
  async getAvailableCouriers(req, res, next) {
    try {
      const { pincode } = req.query;

      if (!pincode) {
        return errorResponse(res, 'Pincode is required', 400);
      }

      const couriersData = await shipwayService.getAvailableCouriers(pincode);

      return successResponse(res, {
        couriers: couriersData.couriers,
      }, 'Available couriers retrieved successfully');
    } catch (error) {
      console.error('Get available couriers error:', error.message);
      return errorResponse(
        res,
        error.message || 'Failed to get available couriers',
        500
      );
    }
  },

  /**
   * Handle Shipway webhook for tracking updates
   */
  async handleWebhook(req, res, next) {
    try {
      const webhookData = req.body;

      console.log('Shipway webhook received:', JSON.stringify(webhookData, null, 2));

      // Respond immediately to acknowledge webhook
      res.status(200).json({ status: 'OK' });

      // Process webhook asynchronously
      const orderId = webhookData.OrderNumber || webhookData.order_number || webhookData.OrderId;
      const trackingNumber = webhookData.TrackingNumber || webhookData.AWB || webhookData.tracking_number;

      if (!orderId && !trackingNumber) {
        console.error('Shipway webhook received without order ID or tracking number');
        return;
      }

      // Find order by orderId or tracking number
      let order;
      if (orderId) {
        order = await Order.findOne({ orderId });
      } else if (trackingNumber) {
        order = await Order.findOne({
          $or: [
            { 'shippingDetails.trackingNumber': trackingNumber },
            { 'shippingDetails.awbNumber': trackingNumber }
          ]
        });
      }

      if (!order) {
        console.error(`Order not found for webhook: orderId=${orderId}, trackingNumber=${trackingNumber}`);
        return;
      }

      // Update shipping details from webhook
      const status = webhookData.Status || webhookData.status || webhookData.CurrentStatus;
      const statusMap = {
        'Picked': 'picked',
        'In Transit': 'in_transit',
        'Out for Delivery': 'out_for_delivery',
        'Delivered': 'delivered',
        'Failed': 'failed',
        'Cancelled': 'cancelled',
      };

      const mappedStatus = statusMap[status] || status?.toLowerCase() || order.shippingDetails?.status || 'pending';

      if (order.shippingDetails) {
        order.shippingDetails.status = mappedStatus;
        order.shippingDetails.estimatedDeliveryDate = webhookData.EstimatedDeliveryDate || webhookData.estimated_delivery_date;
        order.shippingDetails.deliveredDate = webhookData.DeliveredDate || webhookData.delivered_date;
        order.shippingDetails.shipwayData = {
          ...order.shippingDetails.shipwayData,
          webhook: webhookData,
          lastUpdated: new Date(),
        };
      }

      // Update order status based on shipment status
      if (mappedStatus === 'delivered' && order.status !== 'delivered') {
        order.status = 'delivered';
      } else if ((mappedStatus === 'in_transit' || mappedStatus === 'out_for_delivery') && order.status !== 'shipped') {
        order.status = 'shipped';
      } else if (mappedStatus === 'picked' && order.status === 'processing') {
        order.status = 'processing';
      } else if (mappedStatus === 'cancelled' || mappedStatus === 'failed') {
        order.status = 'cancelled';
      }

      await order.save();

      console.log(`Shipway webhook processed for order: ${order.orderId}, status: ${mappedStatus}`);
    } catch (error) {
      console.error('Shipway webhook processing error:', error);
    }
  },
};

