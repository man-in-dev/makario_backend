import { successResponse, errorResponse } from '../utils/response.js';
import Order from '../models/Order.model.js';
import dotenv from 'dotenv';
dotenv.config();

// Cashfree API base URLs
const CASHFREE_API_BASE_URL = process.env.CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

// Get Cashfree credentials
const getCashfreeHeaders = () => {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    throw new Error('Cashfree credentials are not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in your .env file.');
  }

  // Use appropriate API version based on environment
  // Cashfree supports: 2022-09-01, 2023-08-01, 2024-01-01
  const apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';

  return {
    'Content-Type': 'application/json',
    'x-api-version': apiVersion,
    'x-client-id': appId,
    'x-client-secret': secretKey,
  };
};

export const paymentController = {
  /**
   * Create a Cashfree payment session
   */
  async createPaymentSession(req, res, next) {
    try {
      const { orderId, amount, customerDetails, orderNote } = req.body;

      // Validate required fields
      if (!orderId || !amount || !customerDetails) {
        return errorResponse(res, 'Missing required fields: orderId, amount, and customerDetails are required', 400);
      }

      // Validate customer details
      if (!customerDetails.customerId || !customerDetails.customerEmail || !customerDetails.customerPhone) {
        return errorResponse(res, 'customerDetails must include customerId, customerEmail, and customerPhone', 400);
      }

      // Use amount directly (Cashfree expects amount in rupees for INR currency)
      const orderAmount = Math.round(amount);

      const headers = getCashfreeHeaders();
      const isProduction = process.env.CASHFREE_ENV === 'production';

      console.log('Cashfree Configuration:', {
        environment: isProduction ? 'PRODUCTION' : 'SANDBOX',
        apiBaseUrl: CASHFREE_API_BASE_URL,
        apiVersion: headers['x-api-version'],
        hasAppId: !!process.env.CASHFREE_APP_ID,
        hasSecretKey: !!process.env.CASHFREE_SECRET_KEY,
        appIdLength: process.env.CASHFREE_APP_ID?.length || 0,
      });

      // Prepare return and notify URLs
      // In production, Cashfree requires HTTPS URLs
      let returnUrl = process.env.CASHFREE_RETURN_URL;
      let notifyUrl = process.env.CASHFREE_NOTIFY_URL;

      if (!returnUrl) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
        // In production mode, ensure HTTPS (or use provided URL)
        if (isProduction && frontendUrl.startsWith('http://localhost')) {
          throw new Error('Production mode requires HTTPS URLs. Please set CASHFREE_RETURN_URL or FRONTEND_URL with HTTPS in your .env file.');
        }
        returnUrl = `${frontendUrl}/payment/callback?orderId=${orderId}`;
      } else {
        // If CASHFREE_RETURN_URL is set, append orderId if not already present
        returnUrl = returnUrl.includes('orderId=') ? returnUrl : `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}orderId=${orderId}`;
      }

      if (!notifyUrl) {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
        // In production mode, ensure HTTPS (or use provided URL)
        if (isProduction && backendUrl.startsWith('http://localhost')) {
          throw new Error('Production mode requires HTTPS URLs. Please set CASHFREE_NOTIFY_URL or BACKEND_URL with HTTPS in your .env file.');
        }
        notifyUrl = `${backendUrl}/api/payments/webhook`;
      }

      // Format phone number - ensure it has country code if missing
      let phoneNumber = customerDetails.customerPhone.toString().trim();
      if (!phoneNumber.startsWith('+')) {
        // If phone doesn't start with +, assume it's an Indian number and add +91
        phoneNumber = phoneNumber.startsWith('91') ? `+${phoneNumber}` : `+91${phoneNumber}`;
      }

      // Create order with Cashfree - this will return payment_session_id directly
      const orderData = {
        order_id: orderId,
        order_amount: orderAmount,
        order_currency: 'INR',
        customer_details: {
          customer_id: customerDetails.customerId.toString(),
          customer_email: customerDetails.customerEmail,
          customer_phone: phoneNumber,
          customer_name: customerDetails.customerName || customerDetails.customerEmail.split('@')[0],
        },
        order_meta: {
          return_url: returnUrl,
          notify_url: notifyUrl,
        },
      };

      if (orderNote) {
        orderData.order_note = orderNote;
      }

      console.log('Creating Cashfree order with data:', JSON.stringify(orderData, null, 2));

      // Create order with Cashfree
      const orderResponse = await fetch(
        `${CASHFREE_API_BASE_URL}/orders`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(orderData),
        }
      );

      const orderResponseData = await orderResponse.json();

      console.log('Cashfree order response:', {
        status: orderResponse.status,
        statusText: orderResponse.statusText,
        data: orderResponseData,
      });

      if (!orderResponse.ok) {
        console.error('Cashfree order creation error - Full response:', {
          status: orderResponse.status,
          statusText: orderResponse.statusText,
          headers: Object.fromEntries(orderResponse.headers.entries()),
          body: orderResponseData,
          environment: isProduction ? 'PRODUCTION' : 'SANDBOX',
          apiUrl: CASHFREE_API_BASE_URL,
        });

        // Try to extract detailed error message
        let errorMessage = orderResponseData.message ||
          orderResponseData.error?.message ||
          orderResponseData.error?.description ||
          orderResponseData.type ||
          (typeof orderResponseData === 'string' ? orderResponseData : JSON.stringify(orderResponseData)) ||
          `Cashfree API error: ${orderResponse.status} ${orderResponse.statusText}`;

        // Provide specific guidance for authentication errors
        if (orderResponse.status === 401 || orderResponse.status === 403 ||
          errorMessage.toLowerCase().includes('authentication') ||
          errorMessage.toLowerCase().includes('unauthorized')) {
          errorMessage += `. Please verify: 1) You're using ${isProduction ? 'PRODUCTION' : 'SANDBOX'} credentials, 2) CASHFREE_APP_ID and CASHFREE_SECRET_KEY are correct, 3) Your account has S2S feature approved.`;
        }

        throw new Error(errorMessage);
      }

      // Cashfree returns payment_session_id directly when creating an order
      if (orderResponseData && orderResponseData.payment_session_id) {
        // Update order in database with Cashfree order ID and session ID
        const order = await Order.findOne({ orderId });
        if (order) {
          order.paymentDetails = {
            ...order.paymentDetails,
            cashfreeOrderId: orderId,
            cashfreePaymentSessionId: orderResponseData.payment_session_id,
          };
          await order.save();
        }

        return successResponse(res, {
          paymentSessionId: orderResponseData.payment_session_id,
          orderId: orderId,
        }, 'Payment session created successfully');
      } else {
        console.error('Invalid Cashfree order response - payment_session_id missing:', orderResponseData);
        throw new Error('Invalid response from Cashfree API: payment_session_id not found in response');
      }
    } catch (error) {
      console.error('Create payment session error:', error.message);
      return errorResponse(
        res,
        error.message || 'Failed to create payment session',
        500
      );
    }
  },

  /**
   * Verify payment status with Cashfree
   */
  async verifyPayment(req, res, next) {
    try {
      const { orderId } = req.body;

      if (!orderId) {
        return errorResponse(res, 'Order ID is required', 400);
      }

      const headers = getCashfreeHeaders();

      // Get order details from Cashfree
      const response = await fetch(
        `${CASHFREE_API_BASE_URL}/orders/${orderId}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Cashfree API error: ${response.status}`);
      }

      const cashfreeOrder = await response.json();

      if (!cashfreeOrder) {
        return errorResponse(res, 'Order not found in Cashfree', 404);
      }

      // Find the order in our database
      const order = await Order.findOne({ orderId });

      if (!order) {
        return errorResponse(res, 'Order not found in database', 404);
      }

      // Update payment details based on Cashfree response
      const paymentStatus = cashfreeOrder.payment_status === 'SUCCESS' ? 'completed' :
        cashfreeOrder.payment_status === 'FAILED' ? 'failed' : 'pending';

      order.paymentDetails = {
        ...order.paymentDetails,
        paymentStatus,
        cashfreeOrderId: cashfreeOrder.order_id,
        cashfreePaymentId: cashfreeOrder.payment_id || null,
        cashfreePaymentStatus: cashfreeOrder.payment_status,
      };

      // Update order status if payment is successful
      if (paymentStatus === 'completed' && order.status === 'pending') {
        order.status = 'confirmed';
      }

      await order.save();

      return successResponse(res, {
        order: order.toJSON(),
        paymentStatus,
        cashfreeOrder,
      }, 'Payment verified successfully');
    } catch (error) {
      console.error('Verify payment error:', error.message);
      return errorResponse(
        res,
        error.message || 'Failed to verify payment',
        500
      );
    }
  },

  /**
   * Handle Cashfree webhook
   */
  // async handleWebhook(req, res, next) {
  //   try {
  //     const webhookData = req.body;
  //     // Verify webhook signature (implement signature verification for production)
  //     // For now, we'll process the webhook

  //     const orderId = webhookData.data?.order?.order_id || webhookData.order?.orderId;

  //     if (!orderId) {
  //       console.error('Webhook received without order ID');
  //       return res.status(400).json({ success: false, message: 'Order ID missing' });
  //     }

  //     // Find the order in our database
  //     const order = await Order.findOne({ orderId });

  //     if (!order) {
  //       console.error(`Order not found: ${orderId}`);
  //       return res.status(404).json({ success: false, message: 'Order not found' });
  //     }

  //     // Update payment details based on webhook data
  //     const paymentStatus = webhookData.data?.payment?.payment_status === 'SUCCESS' ? 'completed' :
  //       webhookData.data?.payment?.payment_status === 'FAILED' ? 'failed' : 'pending';

  //     order.paymentDetails = {
  //       ...order.paymentDetails,
  //       paymentStatus,
  //       cashfreeOrderId: webhookData.data?.order?.order_id || orderId,
  //       cashfreePaymentId: webhookData.data?.payment?.cf_payment_id || null,
  //       cashfreePaymentStatus: webhookData.data?.payment?.payment_status,
  //     };

  //     // Update order status if payment is successful
  //     if (paymentStatus === 'completed' && order.status === 'pending') {
  //       order.status = 'confirmed';
  //     }

  //     await order.save();

  //     console.log(`Webhook processed for order: ${orderId}, status: ${paymentStatus}`);

  //     return res.status(200).json({ success: true, message: 'Webhook processed' });
  //   } catch (error) {
  //     console.error('Webhook processing error:', error);
  //     return res.status(500).json({ success: false, message: 'Webhook processing failed' });
  //   }
  // },
  async handleWebhook(req, res, next) {
    try {
      const webhookData = req.body;

      // Respond immediately so Cashfree marks it successful
      res.status(200).json({ status: "OK" });

      // Process asynchronously (do not wait)
      const orderId = webhookData.data?.order?.order_id || webhookData.order?.orderId;
      if (!orderId) {
        console.error('Webhook received without order ID');
        return;
      }

      const order = await Order.findOne({ orderId });
      if (!order) {
        console.error(`Order not found: ${orderId}`);
        return;
      }

      const paymentStatus =
        webhookData.data?.payment?.payment_status === "SUCCESS"
          ? "completed"
          : webhookData.data?.payment?.payment_status === "FAILED"
            ? "failed"
            : "pending";

      order.paymentDetails = {
        ...order.paymentDetails,
        paymentStatus,
        cashfreeOrderId: webhookData.data?.order?.order_id || orderId,
        cashfreePaymentId: webhookData.data?.payment?.cf_payment_id || null,
        cashfreePaymentStatus: webhookData.data?.payment?.payment_status,
      };

      if (paymentStatus === "completed" && order.status === "pending") {
        order.status = "confirmed";
      }

      await order.save();

      const updatedOrder = await order.findOne({ orderId });
      console.log('Updated order:', updatedOrder);

      console.log(`Webhook processed for order: ${orderId}, status: ${paymentStatus}`);
    } catch (error) {
      console.error("Webhook processing error:", error);
    }
  }
};

